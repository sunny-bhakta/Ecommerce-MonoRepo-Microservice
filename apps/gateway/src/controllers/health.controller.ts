import { Controller, Get } from '@nestjs/common';
import { HealthGatewayService } from '../services/health.service';

@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthGatewayService) {}

  @Get('health')
  health() {
    return this.healthService.health();
  }
}