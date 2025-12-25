import { Injectable, BadGatewayException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosRequestConfig } from 'axios';
import { lastValueFrom } from 'rxjs';
import { DownstreamApps } from '@app/common/enums/downstream-apps.enum';

export type DownstreamService =
  | DownstreamApps.ORDER
  | DownstreamApps.PAYMENT
  | DownstreamApps.USER
  | DownstreamApps.AUTH
  | DownstreamApps.CATALOG
  | DownstreamApps.VENDOR
  | DownstreamApps.INVENTORY
  | DownstreamApps.SHIPPING
  | DownstreamApps.SEARCH
  | DownstreamApps.REVIEW
  | DownstreamApps.ANALYTICS
  | DownstreamApps.ADMIN
  | DownstreamApps.NOTIFICATION;

export const DEFAULT_SERVICE_URLS: Record<DownstreamService, string> = {
  [DownstreamApps.ORDER]: 'http://localhost:3060',
  [DownstreamApps.PAYMENT]: 'http://localhost:3070',
  [DownstreamApps.USER]: 'http://localhost:3020',
  [DownstreamApps.AUTH]: 'http://localhost:3010',
  [DownstreamApps.CATALOG]: 'http://localhost:3040',
  [DownstreamApps.VENDOR]: 'http://localhost:3030',
  [DownstreamApps.INVENTORY]: 'http://localhost:3050',
  [DownstreamApps.SHIPPING]: 'http://localhost:4080',
  [DownstreamApps.SEARCH]: 'http://localhost:3120',
  [DownstreamApps.ANALYTICS]: 'http://localhost:3100',
  [DownstreamApps.ADMIN]: 'http://localhost:3110',
  [DownstreamApps.NOTIFICATION]: 'http://localhost:3130',
  [DownstreamApps.REVIEW]: 'http://localhost:3090',
};

@Injectable()
export class GatewayHttpService {
  private readonly logger = new Logger(GatewayHttpService.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  composeServiceUrl(service: DownstreamService, pathname: string): string {
    const envKey = `${service.toUpperCase()}_SERVICE_URL`;
    const baseUrl = this.config.get<string>(envKey) ?? DEFAULT_SERVICE_URLS[service];
    const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
    return `${normalizedBase}/${service.toLowerCase()}${normalizedPath}`;
  }

  async get<T = unknown>(url: string, context: string, config: AxiosRequestConfig = {}): Promise<T> {
    try {
      const response = await lastValueFrom(this.http.get<T>(url, config));
      return response.data;
    } catch (error) {
      throw this.wrapHttpError(error, context);
    }
  }

  async post<T>(url: string, payload: unknown, context: string, config: AxiosRequestConfig = {}): Promise<T> {
    try {
      const response = await lastValueFrom(this.http.post<T>(url, payload, config));
      return response.data;
    } catch (error) {
      throw this.wrapHttpError(error, context);
    }
  }

  async patch<T>(url: string, payload: unknown, context: string, config: AxiosRequestConfig = {}): Promise<T> {
    try {
      const response = await lastValueFrom(this.http.patch<T>(url, payload, config));
      return response.data;
    } catch (error) {
      throw this.wrapHttpError(error, context);
    }
  }

  async delete(url: string, context: string): Promise<void> {
    try {
      await lastValueFrom(this.http.delete(url));
    } catch (error) {
      throw this.wrapHttpError(error, context);
    }
  }

  extractErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
      return (
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.response?.statusText ||
        error.message
      );
    }

    if (error instanceof BadGatewayException) {
      const response = error.getResponse() as { message?: string } | undefined;
      return response?.message ?? error.message;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'Unknown upstream error';
  }

  private wrapHttpError(error: unknown, context: string): BadGatewayException {
    const message = this.extractErrorMessage(error);
    const statusCode = axios.isAxiosError(error) ? error.response?.status : undefined;
    const details = axios.isAxiosError(error) ? error.response?.data : undefined;
    this.logger.error(`Failed to reach ${context}: ${message}`);
    return new BadGatewayException({
      message: `Failed to complete request via ${context}`,
      statusCode,
      details,
    });
  }
}