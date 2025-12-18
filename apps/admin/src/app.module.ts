import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import { AdminController } from './app.controller';
import { AppService } from './app.service';
import { AdminActionEntity, AdminActionSchema } from './schemas/admin_actions.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/ecommerce',
        dbName: process.env.MONGODB_DB ?? 'admin',
      }),
    }),
    MongooseModule.forFeature([
      { name: AdminActionEntity.name, schema: AdminActionSchema },
    ]),
  ],
  controllers: [AdminController],
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
