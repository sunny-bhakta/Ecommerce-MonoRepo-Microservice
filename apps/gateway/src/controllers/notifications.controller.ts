import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { GatewayAuthGuard } from '../guards/gateway-auth.guard';
import { SendNotificationDto } from '../dto/send-notification.dto';
import { WebpushRegistrationDto } from '../dto/webpush-registration.dto';
import { NotificationGatewayService } from '../services/notifications.service';

@UseGuards(GatewayAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationService: NotificationGatewayService) {}

  @Post()
  sendNotification(@Body() dto: SendNotificationDto) {
    return this.notificationService.sendNotification(dto);
  }

  @Post('webpush/register')
  registerWebpush(@Body() dto: WebpushRegistrationDto) {
    return this.notificationService.registerWebpush(dto);
  }
}