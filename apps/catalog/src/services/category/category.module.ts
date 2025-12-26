import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MongooseModule } from '@nestjs/mongoose';

import { CategoryEntity, CategorySchema } from './schemas/category.schema';
import { CategoryService } from './category.service';
import { CategoryTreeCacheService } from './category-tree.cache';
import { CategoryPublisher } from './category.publisher';
import { CategoryEventBus } from './category-events.bus';
import { CategoryEventsListener } from './category-events.listener';
import { CATALOG_EVENTS_CLIENT } from './category.constants';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: CategoryEntity.name, schema: CategorySchema }]),
    ClientsModule.registerAsync([
      {
        name: CATALOG_EVENTS_CLIENT,
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [config.get<string>('RABBITMQ_URL') ?? 'amqp://localhost:5672'],
            queue: config.get<string>('CATALOG_EVENTS_QUEUE') ?? 'catalog_events',
            queueOptions: { durable: true },
          },
        }),
      },
    ]),
  ],
  providers: [
    CategoryService,
    CategoryTreeCacheService,
    CategoryPublisher,
    CategoryEventBus,
    CategoryEventsListener,
  ],
  exports: [CategoryService],
})
export class CategoryModule {}