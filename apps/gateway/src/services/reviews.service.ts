import { Injectable, Logger } from "@nestjs/common";
import { GatewayHttpService } from "./gateway-http.service";
import { CreateReviewDto } from "../dto/create-review.dto";
import { Review } from "../interfaces";
import { FlagReviewDto } from "../dto/flag-review.dto";
import { ModerateReviewDto } from "../dto/moderate-review.dto";
import { DownstreamApps } from "@app/common/enums/downstream-apps.enum";

@Injectable()
export class ReviewGatewayService {
  private readonly logger = new Logger(ReviewGatewayService.name);

  constructor(private readonly httpGateway: GatewayHttpService) {}


  async createReview(dto: CreateReviewDto, userId: string) {
    return this.httpGateway.post<Review>(
      this.httpGateway.composeServiceUrl(DownstreamApps.REVIEW, '/reviews'),
      { ...dto, userId },
      'review service',
    );
  }

  async listReviews(targetId?: string, targetType?: 'product' | 'vendor', status?: string) {
    const params = new URLSearchParams();
    if (targetId) params.append('targetId', targetId);
    if (targetType) params.append('targetType', targetType);
    if (status) params.append('status', status);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.httpGateway.get<Review[]>(
      this.httpGateway.composeServiceUrl(DownstreamApps.REVIEW, `/reviews${query}`),
      'review service',
    );
  }

  async flagReview(id: string, dto: FlagReviewDto) {
    return this.httpGateway.patch<Review>(
      this.httpGateway.composeServiceUrl(DownstreamApps.REVIEW, `/reviews/${id}/flag`),
      dto,
      'review service',
    );
  }

  async moderateReview(id: string, dto: ModerateReviewDto) {
    return this.httpGateway.patch<Review>(
      this.httpGateway.composeServiceUrl(DownstreamApps.REVIEW, `/reviews/${id}/moderate`),
      dto,
      'review service',
    );
  }
}