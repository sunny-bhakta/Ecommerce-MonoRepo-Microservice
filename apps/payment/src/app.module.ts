import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Queue, Worker } from 'bullmq';

import { PaymentController } from './app.controller';
import { AppService } from './app.service';
import { PaymentEntity } from './entities/payment.entity';
import { PaymentEventLogEntity } from './entities/payment-event-log.entity';
import { PaymentRefundEntity } from './entities/payment-refund.entity';
import { PaymentEventsController } from './payment.events.controller';
import { PaymentWebhookController } from './payment-webhook.controller';
import {
  PAYMENT_DLQ_QUEUE,
  PAYMENT_DLQ_QUEUE_NAME,
  PAYMENT_EVENTS_CLIENT,
  PAYMENT_RETRY_QUEUE,
  PAYMENT_RETRY_QUEUE_NAME,
  PAYMENT_RETRY_WORKER,
} from './payment.constants';
import { RazorpayProvider } from './providers/razorpay.provider';

function ensureDirectoryExists(filePath: string): void {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function createRedisConnectionOptions(redisUrl: string) {
  try {
    const url = new URL(redisUrl);
    return {
      host: url.hostname,
      port: Number(url.port || 6379),
      password: url.password || undefined,
    };
  } catch {
    return { host: 'localhost', port: 6379 };
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
          config.get<string>('DATABASE_URL') ?? resolve(process.cwd(), 'data', 'payment', 'payment.db');
        ensureDirectoryExists(dbPath);
        return {
          type: 'sqlite',
          database: dbPath,
          entities: [PaymentEntity, PaymentRefundEntity],
          synchronize: true,
        };
      },
    }),
    TypeOrmModule.forFeature([PaymentEntity, PaymentEventLogEntity, PaymentRefundEntity]),
    ClientsModule.registerAsync([
      {
        name: PAYMENT_EVENTS_CLIENT,
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [config.get<string>('RABBITMQ_URL') ?? 'amqp://localhost:5672'],
            queue: config.get<string>('ORDER_QUEUE_NAME') ?? 'order_queue',
            queueOptions: {
              durable: true,
            },
          },
        }),
      },
    ]),
  ],
  controllers: [PaymentController, PaymentEventsController, PaymentWebhookController],
  providers: [
    {
      provide: RazorpayProvider,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new RazorpayProvider({
          keyId: config.get<string>('RAZORPAY_KEY_ID') ?? 'rzp_test_key',
          keySecret: config.get<string>('RAZORPAY_KEY_SECRET') ?? 'rzp_test_secret',
        }),
    },
    {
      provide: PAYMENT_RETRY_QUEUE,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new Queue(PAYMENT_RETRY_QUEUE_NAME, {
          connection: createRedisConnectionOptions(config.get<string>('REDIS_URL') ?? 'redis://localhost:6379'),
        }),
    },
    {
      provide: PAYMENT_DLQ_QUEUE,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new Queue(PAYMENT_DLQ_QUEUE_NAME, {
          connection: createRedisConnectionOptions(config.get<string>('REDIS_URL') ?? 'redis://localhost:6379'),
        }),
    },
    {
      provide: PAYMENT_RETRY_WORKER,
      inject: [ConfigService, AppService],
      useFactory: (config: ConfigService, appService: AppService) =>
        new Worker(
          PAYMENT_RETRY_QUEUE_NAME,
          async (job) => {
            await appService.processPaymentJob(job.data);
          },
          {
            connection: createRedisConnectionOptions(config.get<string>('REDIS_URL') ?? 'redis://localhost:6379'),
          },
        ),
    },
    AppService,
  ],
})
export class AppModule {}
