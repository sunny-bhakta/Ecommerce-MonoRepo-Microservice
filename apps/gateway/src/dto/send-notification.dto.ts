import { IsEmail, IsIn, IsObject, IsOptional, IsString } from 'class-validator';

export class SendNotificationDto {
  @IsIn(['email', 'sms', 'webpush'])
  channel!: 'email' | 'sms' | 'webpush';

  @IsString()
  to!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsString()
  body!: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

