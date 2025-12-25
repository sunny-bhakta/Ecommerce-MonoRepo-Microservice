import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { IndexDocumentDto } from '../dto/index-document.dto';
import { SearchQueryDto } from '../dto/search-query.dto';
import { GatewayAuthGuard } from '../guards/gateway-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { SearchGatewayService } from '../services/search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchGatewayService) {}

  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('index')
  indexDocument(@Body() dto: IndexDocumentDto) {
    return this.searchService.indexSearchDocument(dto);
  }

  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('seed')
  seedSearch() {
    return this.searchService.seedSearchData();
  }

  @Post('query')
  search(@Body() dto: SearchQueryDto) {
    return this.searchService.search(dto);
  }

  @Get('documents/:id')
  getDocument(@Param('id') id: string) {
    return this.searchService.getDocument(id);
  }
}