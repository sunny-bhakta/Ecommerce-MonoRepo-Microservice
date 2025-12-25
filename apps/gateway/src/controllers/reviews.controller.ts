import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CreateReviewDto } from '../dto/create-review.dto';
import { FlagReviewDto } from '../dto/flag-review.dto';
import { ModerateReviewDto } from '../dto/moderate-review.dto';
import { GatewayAuthGuard } from '../guards/gateway-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { AuthenticatedUser } from '../interfaces/auth.interface';
import { ReviewGatewayService } from '../services/reviews.service';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewService: ReviewGatewayService) {}

  @UseGuards(GatewayAuthGuard)
  @Post()
  createReview(@Body() dto: CreateReviewDto, @CurrentUser() user: AuthenticatedUser) {
    return this.reviewService.createReview(dto, user.id);
  }

  @Get()
  listReviews(@Query('targetId') targetId?: string, @Query('targetType') targetType?: 'product' | 'vendor', @Query('status') status?: string) {
    return this.reviewService.listReviews(targetId, targetType, status);
  }

  @UseGuards(GatewayAuthGuard)
  @Patch(':id/flag')
  flagReview(@Param('id') id: string, @Body() dto: FlagReviewDto) {
    return this.reviewService.flagReview(id, dto);
  }

  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id/moderate')
  moderateReview(@Param('id') id: string, @Body() dto: ModerateReviewDto) {
    return this.reviewService.moderateReview(id, dto);
  }
}