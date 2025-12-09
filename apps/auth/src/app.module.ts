import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

import { AuthController } from './app.controller';
import { AppService } from './app.service';
import { UserEntity } from './entities/user.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RolesGuard } from './guards/roles.guard';
import { AUTH_JWT_SECRET } from './auth.constants';
import { resolveJwtExpiresInSeconds } from './utils/jwt-expiry.util';

function ensureDirectoryExists(filePath: string): void {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const dbPath =
          config.get<string>('DATABASE_URL') ?? resolve(process.cwd(), 'data', 'auth', 'auth.db');
        ensureDirectoryExists(dbPath);
        return {
          type: 'sqlite',
          database: dbPath,
          entities: [UserEntity],
          synchronize: true,
        };
      },
    }),
    TypeOrmModule.forFeature([UserEntity]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>(AUTH_JWT_SECRET) ?? 'dev-secret',
        signOptions: {
          expiresIn: resolveJwtExpiresInSeconds(config),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AppService, JwtStrategy, RolesGuard],
})
export class AppModule {}
