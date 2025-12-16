import { Body, Controller, Get, Param, Post, Query, Patch } from '@nestjs/common';
import { AppService } from './app.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { FlagReviewDto } from './dto/flag-review.dto';
import { ModerateReviewDto } from './dto/moderate-review.dto';

@Controller()
export class ReviewController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  health() {
    return this.appService.health();
  }

  @Post('reviews')
  create(@Body() dto: CreateReviewDto) {
    return this.appService.create(dto);
  }

  @Get('reviews')
  list(
    @Query('targetId') targetId?: string,
    @Query('targetType') targetType?: 'product' | 'vendor',
    @Query('status') status?: 'pending' | 'approved' | 'rejected',
  ) {
    return this.appService.list(targetId, targetType, status);
  }

  @Patch('reviews/:id/flag')
  flag(@Param('id') id: string, @Body() dto: FlagReviewDto) {
    return this.appService.flag(id, dto);
  }

  @Patch('reviews/:id/moderate')
  moderate(@Param('id') id: string, @Body() dto: ModerateReviewDto) {
    return this.appService.moderate(id, dto);
  }
}
