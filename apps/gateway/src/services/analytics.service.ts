import { Injectable, Logger } from "@nestjs/common";
import { GatewayHttpService } from "./gateway-http.service";
import { IngestEventDto } from "../dto/ingest-event.dto";
import { MetricsSummary } from "../interfaces";
import { DownstreamApps } from "@app/common/enums/downstream-apps.enum";

@Injectable()
export class AnalyticGatewayService {
  private readonly logger = new Logger(AnalyticGatewayService.name);

  constructor(private readonly httpGateway: GatewayHttpService) { }

  async ingestAnalyticsEvent(dto: IngestEventDto) {
    return this.httpGateway.post(
      this.httpGateway.composeServiceUrl(DownstreamApps.ANALYTICS, '/events'),
      dto,
      'analytics service',
    );
  }

  async analyticsMetrics() {
    return this.httpGateway.get<MetricsSummary>(
      this.httpGateway.composeServiceUrl(DownstreamApps.ANALYTICS, '/metrics'),
      'analytics service',
    );
  }
}
