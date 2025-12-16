import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { IndexDocumentDto } from './dto/index-document.dto';
import { SearchQueryDto } from './dto/search-query.dto';

@Controller()
export class SearchController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  health() {
    return this.appService.health();
  }

  @Post('index')
  indexDocument(@Body() dto: IndexDocumentDto) {
    return this.appService.indexDocument(dto);
  }

  @Post('search')
  search(@Body() dto: SearchQueryDto) {
    return this.appService.search(dto);
  }

  @Get('documents/:id')
  getDocument(@Param('id') id: string) {
    return this.appService.getDocument(id);
  }
}
