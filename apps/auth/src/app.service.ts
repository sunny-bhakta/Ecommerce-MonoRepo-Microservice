import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import {
  AuthResponse,
  AuthenticatedUser,
  AuthTokens,
  mapUserToAuthUser,
} from './dto/user.dto';
import { UserEntity } from './entities/user.entity';
import {
  AUTH_BCRYPT_ROUNDS,
  AUTH_JWT_SECRET,
  DEFAULT_BCRYPT_ROUNDS
} from './auth.constants';
import { resolveJwtExpiresInSeconds } from './utils/jwt-expiry.util';
import { ChangePasswordDto, LoginDto, RegisterUserDto } from '@app/common/dto';
import { UserRole } from '@app/common/enums';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async health() {
    const totalUsers = await this.userRepository.count();
    return {
      service: 'auth',
      status: 'ok',
      users: totalUsers,
      timestamp: new Date().toISOString(),
    };
  }

  async register(dto: RegisterUserDto): Promise<AuthResponse> {
    const email = this.normalizeEmail(dto.email);
    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await this.hashPassword(dto.password);
    const roles = dto.roles?.length ? this.normalizeRoles(dto.roles) : [UserRole.CUSTOMER];

    const user = this.userRepository.create({
      email,
      fullName: dto.fullName,
      passwordHash,
      roles,
    });

    const saved = await this.userRepository.save(user);
    return this.buildAuthResponse(saved);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const email = this.normalizeEmail(dto.email);
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.buildAuthResponse(user);
  }

  async getProfile(userId: string): Promise<AuthenticatedUser> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return mapUserToAuthUser(user);
  }

  async listUsers(): Promise<AuthenticatedUser[]> {
    const users = await this.userRepository.find({
      order: { createdAt: 'DESC' },
    });
    return users.map(mapUserToAuthUser);
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<{ success: true }> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.id = :userId', { userId })
      .getOne();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const matches = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    user.passwordHash = await this.hashPassword(dto.newPassword);
    await this.userRepository.save(user);
    return { success: true };
  }

  private async hashPassword(password: string): Promise<string> {
    const rounds = this.getBcryptRounds();
    return bcrypt.hash(password, rounds);
  }

  private buildAuthResponse(user: UserEntity): AuthResponse {
    const authUser = mapUserToAuthUser(user);
    const tokens = this.issueTokens(authUser);
    return { user: authUser, tokens };
  }

  private issueTokens(user: AuthenticatedUser): AuthTokens {
    const expiresInSeconds = this.getJwtExpiresInSeconds();
    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>(AUTH_JWT_SECRET) ?? 'dev-secret',
      expiresIn: expiresInSeconds,
    });
    return {
      accessToken,
      expiresIn: expiresInSeconds,
    };
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private normalizeRoles(roles: UserRole[]): UserRole[] {
    return Array.from(new Set(roles));
  }

  private getBcryptRounds(): number {
    return Number(this.configService.get(AUTH_BCRYPT_ROUNDS) ?? DEFAULT_BCRYPT_ROUNDS);
  }

  private getJwtExpiresInSeconds(): number {
    return resolveJwtExpiresInSeconds(this.configService);
  }
}

