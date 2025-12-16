import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserController } from './app.controller';
import { AppService } from './app.service';
import { UserProfileEntity } from './entities/user-profile.entity';

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
          config.get<string>('DATABASE_URL') ?? resolve(process.cwd(), 'data', 'user', 'user.db');
        ensureDirectoryExists(dbPath);
        return {
          type: 'sqlite',
          database: dbPath,
          entities: [UserProfileEntity],
          synchronize: true,
        };
      },
    }),
    TypeOrmModule.forFeature([UserProfileEntity]),
  ],
  controllers: [UserController],
  providers: [AppService],
})
export class AppModule {}
