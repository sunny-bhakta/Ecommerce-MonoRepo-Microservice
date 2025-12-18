import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_PIPE } from '@nestjs/core';
import { SearchController } from './app.controller';
import { AppService } from './app.service';
import { SearchDocumentEntity, SearchDocumentSchema } from './schemas/search-document.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri:
          config.get<string>('MONGODB_URI') ??
          config.get<string>('MONGO_URL') ??
          'mongodb://0.0.0.0:27017/ecommerce',
        dbName: config.get<string>('MONGODB_DB') ?? 'search',
      }),
    }),
    MongooseModule.forFeature([
      { name: SearchDocumentEntity.name, schema: SearchDocumentSchema },
    ]),
  ],
  controllers: [SearchController],
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
