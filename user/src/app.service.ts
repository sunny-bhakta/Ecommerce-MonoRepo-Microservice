import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserProfileEntity } from './entities/user-profile.entity';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(UserProfileEntity)
    private readonly userRepository: Repository<UserProfileEntity>,
  ) {}

  async health() {
    const totalUsers = await this.userRepository.count();
    return {
      service: 'user',
      status: 'ok',
      users: totalUsers,
      timestamp: new Date().toISOString(),
    };
  }

  async create(dto: CreateUserDto): Promise<UserProfileEntity> {
    const email = this.normalizeEmail(dto.email);
    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('User email already exists');
    }
    const entity = this.userRepository.create({
      ...dto,
      email,
      addresses: dto.addresses,
      preferences: dto.preferences,
    });
    return this.userRepository.save(entity);
  }

  async findAll(email?: string): Promise<UserProfileEntity[]> {
    const where = email
      ? {
          email: this.normalizeEmail(email),
        }
      : undefined;
    return this.userRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<UserProfileEntity> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserProfileEntity> {
    const user = await this.findOne(id);

    if (dto.email && this.normalizeEmail(dto.email) !== user.email) {
      const existing = await this.userRepository.findOne({
        where: { email: this.normalizeEmail(dto.email) },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Email already in use');
      }
      user.email = this.normalizeEmail(dto.email);
    }

    if (dto.fullName !== undefined) {
      user.fullName = dto.fullName;
    }
    if (dto.phoneNumber !== undefined) {
      user.phoneNumber = dto.phoneNumber;
    }
    if (dto.isActive !== undefined) {
      user.isActive = dto.isActive;
    }
    if (dto.addresses !== undefined) {
      user.addresses = dto.addresses;
    }
    if (dto.preferences !== undefined) {
      user.preferences = dto.preferences;
    }

    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }
}
