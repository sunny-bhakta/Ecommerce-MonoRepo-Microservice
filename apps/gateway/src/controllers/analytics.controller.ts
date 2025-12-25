import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IngestEventDto } from '../dto/ingest-event.dto';
import { GatewayAuthGuard } from '../guards/gateway-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { AnalyticGatewayService } from '../services/analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticService: AnalyticGatewayService) {}

  @UseGuards(GatewayAuthGuard)
  @Post('events')
  ingestAnalytics(@Body() dto: IngestEventDto) {
    return this.analyticService.ingestAnalyticsEvent(dto);
  }

  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('metrics')
  analyticsMetrics() {
    return this.analyticService.analyticsMetrics();
  }
}