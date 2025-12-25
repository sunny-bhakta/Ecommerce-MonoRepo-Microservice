import { Injectable, Logger } from "@nestjs/common";
import { GatewayHttpService } from "./gateway-http.service";
import { SendNotificationDto } from "../dto/send-notification.dto";
import { NotificationAccepted } from "../interfaces";
import { WebpushRegistrationDto } from "../dto/webpush-registration.dto";
import { DownstreamApps } from "@app/common/enums/downstream-apps.enum";

@Injectable()
export class NotificationGatewayService {
  private readonly logger = new Logger(NotificationGatewayService.name);

  constructor(private readonly httpGateway: GatewayHttpService) {}



  async sendNotification(dto: SendNotificationDto) {
    return this.httpGateway.post<NotificationAccepted>(
      this.httpGateway.composeServiceUrl(DownstreamApps.NOTIFICATION, '/notifications'),
      dto,
      'notification service',
    );
  }

  async registerWebpush(dto: WebpushRegistrationDto) {
    return this.httpGateway.post<NotificationAccepted>(
      this.httpGateway.composeServiceUrl(DownstreamApps.NOTIFICATION, '/notifications/webpush/register'),
      dto,
      'notification service',
    );
  }
}