import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ReviewController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
  ],
  controllers: [ReviewController],
  providers: [AppService],
})
export class AppModule {}
