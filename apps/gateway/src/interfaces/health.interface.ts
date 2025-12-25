import { DownstreamService } from "../services/gateway-http.service";

export interface DependencyHealth {
  service: DownstreamService;
  status: 'ok' | 'error';
  details?: unknown;
}