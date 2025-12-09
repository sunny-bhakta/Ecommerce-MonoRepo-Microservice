import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { CreateReviewDto } from './dto/create-review.dto';
import { FlagReviewDto } from './dto/flag-review.dto';
import { ModerateReviewDto } from './dto/moderate-review.dto';
import { Review, ReviewDocument } from './schemas/review.schema';

@Injectable()
export class AppService {
  constructor(@InjectModel(Review.name) private readonly reviewModel: Model<ReviewDocument>) {}

  async health() {
    const count = await this.reviewModel.estimatedDocumentCount();
    return {
      service: 'review',
      status: 'ok',
      reviews: count,
      timestamp: new Date().toISOString(),
    };
  }

  async create(dto: CreateReviewDto) {
    const created = await this.reviewModel.create({
      userId: dto.userId,
      targetId: dto.targetId,
      targetType: dto.targetType,
      rating: dto.rating,
      comment: dto.comment,
    });
    return this.toResponse(created);
  }

  async list(targetId?: string, targetType?: 'product' | 'vendor', status?: string) {
    const filter: FilterQuery<Review> = {};
    if (targetId) filter.targetId = targetId;
    if (targetType) filter.targetType = targetType;
    if (status) filter.status = status;
    const docs = await this.reviewModel.find(filter).sort({ createdAt: -1 }).lean();
    return docs.map((d) => this.toResponse(d));
  }

  async flag(id: string, dto: FlagReviewDto) {
    const updated = await this.reviewModel
      .findByIdAndUpdate(
        id,
        { $set: { flagged: true, flagReason: dto.reason } },
        { new: true },
      )
      .lean();
    if (!updated) {
      throw new NotFoundException('Review not found');
    }
    return this.toResponse(updated);
  }

  async moderate(id: string, dto: ModerateReviewDto) {
    const updated = await this.reviewModel
      .findByIdAndUpdate(
        id,
        { $set: { status: dto.status, moderatorNote: dto.moderatorNote } },
        { new: true },
      )
      .lean();
    if (!updated) {
      throw new NotFoundException('Review not found');
    }
    return this.toResponse(updated);
  }

  private toResponse(doc: ReviewDocument | Review) {
    const obj = typeof (doc as any).toObject === 'function' ? (doc as any).toObject() : doc;
    return {
      id: obj._id?.toString?.() ?? obj.id,
      userId: obj.userId,
      targetId: obj.targetId,
      targetType: obj.targetType,
      rating: obj.rating,
      comment: obj.comment,
      status: obj.status,
      flagged: obj.flagged,
      flagReason: obj.flagReason,
      moderatorNote: obj.moderatorNote,
      createdAt: obj.createdAt,
      updatedAt: obj.updatedAt,
    };
  }
}
