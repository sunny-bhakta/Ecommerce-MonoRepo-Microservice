import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class CatalogController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  health() {
    return this.appService.health();
  }
}
