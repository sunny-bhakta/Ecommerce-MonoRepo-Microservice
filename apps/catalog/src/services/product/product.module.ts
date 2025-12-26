import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MongooseModule } from '@nestjs/mongoose';

import { Product, ProductSchema } from './schemas/product.schema';
import { VariantCollection, VariantCollectionSchema } from './schemas/variant-collection.schema';
import { CategoryEntity, CategorySchema } from '../category/schemas/category.schema';
import { ProductService } from './product.service';
import { ProductMapper } from './product.mapper';
import { ProductOptionsService } from './product-options.service';
import { ProductPublisher } from './product.publisher';
import { ProductEventBus } from './product-events.bus';
import { CATALOG_EVENTS_CLIENT } from '../category/category.constants';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: VariantCollection.name, schema: VariantCollectionSchema },
      { name: CategoryEntity.name, schema: CategorySchema },
    ]),
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
  providers: [ProductService, ProductMapper, ProductOptionsService, ProductPublisher, ProductEventBus],
  exports: [ProductService, ProductMapper, ProductOptionsService],
})
export class ProductModule {}