import { Inject, Injectable, Logger } from "@nestjs/common";
import { DependencyHealth } from "../interfaces";
import { DownstreamService, GatewayHttpService } from "./gateway-http.service";
import { DownstreamApps } from "@app/common/enums/downstream-apps.enum";

@Injectable()
export class HealthGatewayService {
  private readonly logger = new Logger(HealthGatewayService.name);
  constructor(
    @Inject('DEPENDENCY_HEALTH_CHECKERS')
    private readonly httpGateway: GatewayHttpService,
  ) { }

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

  private async collectDependencyHealth(): Promise<DependencyHealth[]> {
    const services: DownstreamService[] = [
      DownstreamApps.ORDER,
      DownstreamApps.PAYMENT,
      DownstreamApps.USER,
      DownstreamApps.AUTH,
      DownstreamApps.CATALOG,
      DownstreamApps.VENDOR,
      DownstreamApps.INVENTORY,
      DownstreamApps.SHIPPING,
      DownstreamApps.SEARCH,
      DownstreamApps.ANALYTICS,
      DownstreamApps.ADMIN,
      DownstreamApps.NOTIFICATION,
      DownstreamApps.REVIEW,
    ];

    const checks = await Promise.all(
      services.map(async (service) => {
        try {
          const response = await this.httpGateway.get<Record<string, unknown>>(
            this.httpGateway.composeServiceUrl(service, '/health'),
            `${service} service`,
          );
          return {
            service,
            status: (response?.status as 'ok' | 'error' | undefined) ?? 'ok',
            details: response,
          } satisfies DependencyHealth;
        } catch (error) {
          const message = this.httpGateway.extractErrorMessage(error);
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
}