import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { GatewayController } from './app.controller';
import { AppService } from './app.service';
import { AuthClientService } from './services/auth-client.service';
import { GatewayAuthGuard } from './guards/gateway-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    HttpModule.register({
      // timeout: 5000,
      timeout: 900000,
      maxRedirects: 0,
    }),
  ],
  controllers: [GatewayController],
  providers: [AppService, AuthClientService, GatewayAuthGuard, RolesGuard],
})
export class AppModule {}
