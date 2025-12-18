import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import { AnalyticsController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsMetricEntity, AnalyticsMetricSchema } from './schemas/analytics_metrics_schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/ecommerce',
        dbName: process.env.MONGODB_DB ?? 'analytics',
      }),
    }),
    MongooseModule.forFeature([
      { name: AnalyticsMetricEntity.name, schema: AnalyticsMetricSchema },
    ]),
  ],
  controllers: [AnalyticsController],
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
