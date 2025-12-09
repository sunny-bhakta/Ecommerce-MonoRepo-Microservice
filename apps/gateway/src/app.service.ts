import { Injectable, BadGatewayException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';
import { lastValueFrom } from 'rxjs';

import {
  CheckoutItemDto,
  CheckoutPaymentProvider,
  CheckoutRequestDto,
} from './dto/checkout-request.dto';
import { CreateGatewayUserDto, UpdateGatewayUserDto } from './dto/user-profile.dto';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';

type DownstreamService = 'order' | 'payment' | 'user' | 'auth';

interface DependencyHealth {
  service: DownstreamService;
  status: 'ok' | 'error';
  details?: unknown;
}

interface OrderResponse {
  id: string;
  status: string;
  totalAmount: number;
  currency: string;
  userId: string;
}

interface PaymentResponse {
  id: string;
  status: string;
  provider: string;
  amount: number;
  currency: string;
  orderId: string;
}

interface UserProfileResponse {
  id: string;
  email: string;
  fullName?: string | null;
  phoneNumber?: string | null;
  addresses?: Record<string, unknown>[];
  preferences?: Record<string, unknown>;
  isActive: boolean;
}

const DEFAULT_SERVICE_URLS: Record<DownstreamService, string> = {
  order: 'http://localhost:3060',
  payment: 'http://localhost:3070',
  user: 'http://localhost:3020',
  auth: 'http://localhost:3050',
};

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(private readonly http: HttpService, private readonly config: ConfigService) {}

  async health() {
    const dependencies = await this.collectDependencyHealth();
    const isDegraded = dependencies.some((dep) => dep.status !== 'ok');
    return {
      service: 'gateway',
      status: isDegraded ? 'degraded' : 'ok',
      timestamp: new Date().toISOString(),
      dependencies,
    };
  }

  async checkout(dto: CheckoutRequestDto, user: AuthenticatedUser) {
    const totalAmount = dto.totalAmount ?? this.calculateTotal(dto.items);
    const userId = user.id;

    const orderPayload = {
      userId,
      currency: dto.currency,
      totalAmount,
      notes: dto.notes,
      items: dto.items,
    };

    const order = await this.postToService<OrderResponse>(
      this.composeServiceUrl('order', '/orders'),
      orderPayload,
      'order service',
    );

    const paymentPayload = {
      orderId: order.id,
      userId,
      amount: totalAmount,
      currency: dto.currency,
      provider: dto.paymentProvider ?? CheckoutPaymentProvider.RAZORPAY,
    };

    const payment = await this.postToService<PaymentResponse>(
      this.composeServiceUrl('payment', '/payments'),
      paymentPayload,
      'payment service',
    );

    return {
      order,
      payment,
      nextSteps: this.describeNextSteps(payment.status),
    };
  }

  async getOrderAggregate(orderId: string) {
    const [order, payments] = await Promise.all([
      this.getFromService<OrderResponse>(
        this.composeServiceUrl('order', `/orders/${orderId}`),
        'order service',
      ),
      this.getFromService<PaymentResponse[]>(
        this.composeServiceUrl('payment', `/payments?orderId=${encodeURIComponent(orderId)}`),
        'payment service',
      ),
    ]);

    return {
      order,
      payments,
    };
  }

  async createUser(dto: CreateGatewayUserDto) {
    return this.postToService<UserProfileResponse>(
      this.composeServiceUrl('user', '/users'),
      dto,
      'user service',
    );
  }

  async listUsers(email?: string) {
    const query = email ? `?email=${encodeURIComponent(email)}` : '';
    return this.getFromService<UserProfileResponse[]>(
      this.composeServiceUrl('user', `/users${query}`),
      'user service',
    );
  }

  async getUser(id: string) {
    return this.getFromService<UserProfileResponse>(
      this.composeServiceUrl('user', `/users/${id}`),
      'user service',
    );
  }

  async updateUser(id: string, dto: UpdateGatewayUserDto) {
    return this.patchToService<UserProfileResponse>(
      this.composeServiceUrl('user', `/users/${id}`),
      dto,
      'user service',
    );
  }

  async deleteUser(id: string) {
    await this.deleteFromService(this.composeServiceUrl('user', `/users/${id}`), 'user service');
    return { deleted: true };
  }

  async getMyProfile(userId: string) {
    return this.getFromService<UserProfileResponse>(
      this.composeServiceUrl('user', `/users/${userId}`),
      'user service',
    );
  }

  async updateMyProfile(userId: string, dto: UpdateGatewayUserDto) {
    return this.patchToService<UserProfileResponse>(
      this.composeServiceUrl('user', `/users/${userId}`),
      dto,
      'user service',
    );
  }

  private describeNextSteps(paymentStatus?: string) {
    if (!paymentStatus) {
      return 'await_payment_status';
    }
    switch (paymentStatus.toLowerCase()) {
      case 'succeeded':
        return 'order_confirmed';
      case 'failed':
        return 'retry_payment';
      case 'processing':
      case 'pending':
      default:
        return 'await_payment_confirmation';
    }
  }

  private calculateTotal(items: CheckoutItemDto[]): number {
    return items.reduce((total, item) => total + item.quantity * item.price, 0);
  }

  private composeServiceUrl(service: DownstreamService, pathname: string) {
    const envKey = `${service.toUpperCase()}_SERVICE_URL`;
    const baseUrl = this.config.get<string>(envKey) ?? DEFAULT_SERVICE_URLS[service];
    const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
    return `${normalizedBase}${normalizedPath}`;
  }

  private async collectDependencyHealth(): Promise<DependencyHealth[]> {
    const services: DownstreamService[] = ['order', 'payment', 'user', 'auth'];
    const checks = await Promise.all(
      services.map(async (service) => {
        try {
          const response = await lastValueFrom(
            this.http.get(this.composeServiceUrl(service, '/health')),
          );
          return {
            service,
            status: response.data?.status ?? 'ok',
            details: response.data,
          } satisfies DependencyHealth;
        } catch (error) {
          const message = this.extractErrorMessage(error);
          this.logger.warn(`Health check failed for ${service}: ${message}`);
          return {
            service,
            status: 'error',
            details: { message },
          } satisfies DependencyHealth;
        }
      }),
    );

    return checks;
  }

  private async postToService<T>(url: string, payload: unknown, context: string): Promise<T> {
    try {
      const response = await lastValueFrom(this.http.post<T>(url, payload));
      return response.data;
    } catch (error) {
      throw this.wrapHttpError(error, context);
    }
  }

  private async getFromService<T>(url: string, context: string): Promise<T> {
    try {
      const response = await lastValueFrom(this.http.get<T>(url));
      return response.data;
    } catch (error) {
      throw this.wrapHttpError(error, context);
    }
  }

  private async patchToService<T>(url: string, payload: unknown, context: string): Promise<T> {
    try {
      const response = await lastValueFrom(this.http.patch<T>(url, payload));
      return response.data;
    } catch (error) {
      throw this.wrapHttpError(error, context);
    }
  }

  private async deleteFromService(url: string, context: string): Promise<void> {
    try {
      await lastValueFrom(this.http.delete(url));
    } catch (error) {
      throw this.wrapHttpError(error, context);
    }
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

  private extractErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
      return (
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.response?.statusText ||
        error.message
      );
    }
    if (error instanceof Error) {
      return error.message;
    }
    return 'Unknown upstream error';
  }
}
