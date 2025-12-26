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

interface GatewayResilienceConfig {
  retryAttempts: number;
  retryDelayMs: number;
  circuitBreakerThreshold: number;
  circuitBreakerCooldownMs: number;
}

interface CircuitState {
  failures: number;
  openUntil: number | null;
}

interface HttpRequestOptions {
  service?: DownstreamService;
}

@Injectable()
export class GatewayHttpService {
  private readonly logger = new Logger(GatewayHttpService.name);
  private readonly circuitStates = new Map<DownstreamService, CircuitState>();
  private readonly serviceConfigs: Record<DownstreamService, GatewayResilienceConfig>;
  private readonly serviceLookup = new Set<string>(Object.values(DownstreamApps));

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.serviceConfigs = this.buildResilienceConfig();
  }

  composeServiceUrl(service: DownstreamService, pathname: string): string {
    const envKey = `${service.toUpperCase()}_SERVICE_URL`;
    const baseUrl = this.config.get<string>(envKey) ?? DEFAULT_SERVICE_URLS[service];
    const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
    return `${normalizedBase}/${service.toLowerCase()}${normalizedPath}`;
  }

  async get<T = unknown>(
    url: string,
    context: string,
    config: AxiosRequestConfig = {},
    options: HttpRequestOptions = {},
  ): Promise<T> {
    const targetService = options.service ?? this.detectServiceFromUrl(url);
    return this.executeWithResilience(targetService, context, async () => {
      const response = await lastValueFrom(this.http.get<T>(url, config));
      return response.data;
    });
  }

  async post<T>(
    url: string,
    payload: unknown,
    context: string,
    config: AxiosRequestConfig = {},
    options: HttpRequestOptions = {},
  ): Promise<T> {
    const targetService = options.service ?? this.detectServiceFromUrl(url);
    return this.executeWithResilience(targetService, context, async () => {
      const response = await lastValueFrom(this.http.post<T>(url, payload, config));
      return response.data;
    });
  }

  async patch<T>(
    url: string,
    payload: unknown,
    context: string,
    config: AxiosRequestConfig = {},
    options: HttpRequestOptions = {},
  ): Promise<T> {
    const targetService = options.service ?? this.detectServiceFromUrl(url);
    return this.executeWithResilience(targetService, context, async () => {
      const response = await lastValueFrom(this.http.patch<T>(url, payload, config));
      return response.data;
    });
  }

  async delete(url: string, context: string, options: HttpRequestOptions = {}): Promise<void> {
    const targetService = options.service ?? this.detectServiceFromUrl(url);
    await this.executeWithResilience(targetService, context, async () => {
      await lastValueFrom(this.http.delete(url));
    });
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

  private async executeWithResilience<T>(
    service: DownstreamService | undefined,
    context: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    if (!service) {
      try {
        return await operation();
      } catch (error) {
        throw this.wrapHttpError(error, context);
      }
    }

    const config = this.serviceConfigs[service];
    const state = this.circuitStates.get(service) ?? { failures: 0, openUntil: null };
    const now = Date.now();

    if (state.openUntil) {
      if (now < state.openUntil) {
        throw new BadGatewayException({
          message: `Circuit open for ${service}; retry after ${new Date(state.openUntil).toISOString()}`,
          statusCode: 503,
          details: { service },
        });
      }
      this.resetCircuitState(service);
    }

    let attempt = 0;
    while (attempt <= config.retryAttempts) {
      try {
        const result = await operation();
        this.resetCircuitState(service);
        return result;
      } catch (error) {
        const retryable = this.isRetryable(error);
        if (retryable) {
          this.recordFailure(service, config);
        }

        if (++attempt > config.retryAttempts || !retryable) {
          throw this.wrapHttpError(error, context);
        }

        await this.delay(config.retryDelayMs * attempt);
      }
    }

    throw new BadGatewayException({ message: `Failed to complete request via ${context}` });
  }

  private recordFailure(service: DownstreamService, config: GatewayResilienceConfig): void {
    const state = this.circuitStates.get(service) ?? { failures: 0, openUntil: null };
    state.failures += 1;
    if (state.failures >= config.circuitBreakerThreshold && !state.openUntil) {
      state.openUntil = Date.now() + config.circuitBreakerCooldownMs;
      this.logger.warn(
        `Circuit opened for ${service} after ${state.failures} failures (cooldown ${config.circuitBreakerCooldownMs}ms)`,
      );
    }
    this.circuitStates.set(service, state);
  }

  private resetCircuitState(service: DownstreamService): void {
    this.circuitStates.set(service, { failures: 0, openUntil: null });
  }

  private isRetryable(error: unknown): boolean {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      if (status !== undefined) {
        if (status >= 500 || status === 429) {
          return true;
        }
        return false;
      }
      return true;
    }
    return true;
  }

  private async delay(ms: number): Promise<void> {
    if (ms <= 0) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private buildResilienceConfig(): Record<DownstreamService, GatewayResilienceConfig> {
    const defaults: GatewayResilienceConfig = {
      retryAttempts: this.getNumber('GATEWAY_HTTP_DEFAULT_RETRY_ATTEMPTS', 2),
      retryDelayMs: this.getNumber('GATEWAY_HTTP_DEFAULT_RETRY_DELAY_MS', 200),
      circuitBreakerThreshold: this.getNumber('GATEWAY_HTTP_DEFAULT_CIRCUIT_THRESHOLD', 5),
      circuitBreakerCooldownMs: this.getNumber('GATEWAY_HTTP_DEFAULT_CIRCUIT_COOLDOWN_MS', 10000),
    };

    const entries = (Object.values(DownstreamApps) as DownstreamService[]).map((service) => {
      const prefix = `GATEWAY_HTTP_${service.toUpperCase()}`;
      return [
        service,
        {
          retryAttempts: this.getNumber(`${prefix}_RETRY_ATTEMPTS`, defaults.retryAttempts),
          retryDelayMs: this.getNumber(`${prefix}_RETRY_DELAY_MS`, defaults.retryDelayMs),
          circuitBreakerThreshold: this.getNumber(`${prefix}_CIRCUIT_THRESHOLD`, defaults.circuitBreakerThreshold),
          circuitBreakerCooldownMs: this.getNumber(
            `${prefix}_CIRCUIT_COOLDOWN_MS`,
            defaults.circuitBreakerCooldownMs,
          ),
        },
      ];
    });

    return Object.fromEntries(entries) as Record<DownstreamService, GatewayResilienceConfig>;
  }

  private getNumber(key: string, fallback: number): number {
    const raw = this.config.get<string | number>(key);
    if (raw === undefined || raw === null) {
      return fallback;
    }
    const value = typeof raw === 'number' ? raw : Number(raw);
    return Number.isFinite(value) ? value : fallback;
  }

  private detectServiceFromUrl(url: string): DownstreamService | undefined {
    try {
      const parsed = new URL(url);
      const segments = parsed.pathname.split('/').filter(Boolean);
      if (segments.length === 0) {
        return undefined;
      }
      const candidate = segments[0].toLowerCase();
      if (this.serviceLookup.has(candidate)) {
        return candidate as DownstreamService;
      }
    } catch {
      return undefined;
    }
    return undefined;
  }
}