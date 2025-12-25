import { Injectable, UnauthorizedException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import axios from 'axios';

import { AuthenticatedUser } from '../interfaces/auth.interface';

@Injectable()
export class AuthClientGatewayService {
  private readonly baseUrl: string;

  constructor(private readonly http: HttpService, configService: ConfigService) {
    const configured = configService.get<string>('AUTH_SERVICE_URL');
    this.baseUrl = configured ?? 'http://localhost:3010';
  }

  async validateToken(accessToken: string): Promise<AuthenticatedUser> {
    try {
      const response = await lastValueFrom(
        this.http.get<AuthenticatedUser>(`${this.baseUrl}/auth/me`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }),
      );
      return response.data;
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message ?? error.response?.statusText ?? 'Unauthorized'
        : 'Unauthorized';
      throw new UnauthorizedException(message);
    }
  }
}

