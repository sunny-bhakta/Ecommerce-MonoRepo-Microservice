import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AuthClientGatewayService, AuthGatewayService, GatewayHttpService } from './services';
import { AuthGatewayController } from './controllers';
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
  controllers: [
    AuthGatewayController
  ],
  providers: [
    AuthGatewayService,
    AuthClientGatewayService,
    GatewayHttpService,
    GatewayAuthGuard,
    RolesGuard
  ],
})
export class AppModule {}
