import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { InventoryController } from './app.controller';
import { AppService } from './app.service';
import { Stock, StockSchema } from './schemas/stock.schema';
import { Warehouse, WarehouseSchema } from './schemas/warehouse.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGO_URL ?? 'mongodb://localhost:27017/ecommerce',
      }),
    }),
    MongooseModule.forFeature([
      { name: Warehouse.name, schema: WarehouseSchema },
      { name: Stock.name, schema: StockSchema },
    ]),
  ],
  controllers: [InventoryController],
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
