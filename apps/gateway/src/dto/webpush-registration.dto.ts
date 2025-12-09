import { IsString, IsUrl } from 'class-validator';

export class WebpushRegistrationDto {
  @IsUrl()
  endpoint!: string;

  @IsString()
  p256dh!: string;

  @IsString()
  auth!: string;
}

