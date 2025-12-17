import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShippingController } from './app.controller';
import { AppService } from './app.service';
import { ShipmentEntity } from './entities/shipment.entity';

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
          config.get<string>('DATABASE_URL') ?? resolve(process.cwd(), 'data', 'shipping', 'shipping.db');
        ensureDirectoryExists(dbPath);
        return {
          type: 'sqlite',
          database: dbPath,
          entities: [ShipmentEntity],
          synchronize: true,
        };
      },
    }),
    TypeOrmModule.forFeature([ShipmentEntity]),
  ],
  controllers: [ShippingController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    },
  ],
})
export class AppModule {}
