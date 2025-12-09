import { IsIn, IsOptional, IsString } from 'class-validator';

export class ModerateReviewDto {
  // Using enum:
  //
  // enum ReviewStatus {
  //   Approved = 'approved',
  //   Rejected = 'rejected',
  // }
  //
  // @IsIn([ReviewStatus.Approved, ReviewStatus.Rejected])
  // status!: ReviewStatus;
  //
  // This approach gives more type safety and centralizes valid statuses. But in TypeScript, 
  // enums cannot be declared inside a class—must declare outside the class.
  //
  // Using union literal (current implementation):
  @IsIn(['approved', 'rejected'])
  status!: 'approved' | 'rejected';
  //
  // This is simpler, needs no extra declaration. 
  // But if you want to reuse the statuses elsewhere or expand them later, using an enum (declared outside the class) is better.

  @IsOptional()
  @IsString()
  moderatorNote?: string;
}

