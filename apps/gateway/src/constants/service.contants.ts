import { DownstreamService } from "../services/gateway-http.service";

export const DEFAULT_SERVICE_URLS: Record<DownstreamService, string> = {
  order: 'http://localhost:3060',
  payment: 'http://localhost:3070',
  user: 'http://localhost:3020',
  auth: 'http://localhost:3010',
  catalog: 'http://localhost:3040',
  vendor: 'http://localhost:3030',
  inventory: 'http://localhost:3050',
  // shipping: 'http://localhost:3080', temporary
  shipping: 'http://localhost:4080',
  search: 'http://localhost:3120',
  analytics: 'http://localhost:3100',
  admin: 'http://localhost:3110',
  notification: 'http://localhost:3130',
  review: 'http://localhost:3090',
};