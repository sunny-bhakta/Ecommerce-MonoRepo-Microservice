import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OrderController } from './app.controller';
import { AppService } from './app.service';
import { OrderEntity } from './entities/order.entity';
import { OrderItemEntity } from './entities/order-item.entity';
import { OrderEventsController } from './order.events.controller';
import { ORDER_EVENTS_CLIENT } from './order.constants';

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
          config.get<string>('DATABASE_URL') ?? resolve(process.cwd(), 'data', 'order', 'order.db');
        ensureDirectoryExists(dbPath);
        return {
          type: 'sqlite',
          database: dbPath,
          entities: [OrderEntity, OrderItemEntity],
          synchronize: true,
        };
      },
    }),
    TypeOrmModule.forFeature([OrderEntity, OrderItemEntity]),
    ClientsModule.registerAsync([
      {
        name: ORDER_EVENTS_CLIENT,
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [config.get<string>('RABBITMQ_URL') ?? 'amqp://localhost:5672'],
            queue: config.get<string>('PAYMENT_QUEUE_NAME') ?? 'payment_queue',
            queueOptions: {
              durable: true,
            },
          },
        }),
      },
    ]),
  ],
  controllers: [OrderController, OrderEventsController],
  providers: [AppService],
})
export class AppModule {}
