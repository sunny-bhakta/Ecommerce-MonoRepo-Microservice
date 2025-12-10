import { Injectable, NestMiddleware } from '@nestjs/common';
import { ensureCorrelationId, runWithRequestContext } from '../request-context';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void): void {
    const correlationId =
      ensureCorrelationId(req.headers['x-request-id'] ?? req.headers['x-correlation-id']);

    req.correlationId = correlationId;
    res.setHeader('x-request-id', correlationId);

    runWithRequestContext(correlationId, () => next());
  }
}

