import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { IngestEventDto } from './dto/ingest-event.dto';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  health() {
    return this.appService.health();
  }

  @Post('events')
  ingest(@Body() dto: IngestEventDto) {
    return this.appService.ingest(dto);
  }

  @Get('metrics')
  metrics() {
    return this.appService.metrics();
  }
}
