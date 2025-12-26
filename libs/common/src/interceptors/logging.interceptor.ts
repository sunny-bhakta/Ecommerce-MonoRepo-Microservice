import {
  CallHandler,
  ExecutionContext,
  Injectable,
  LoggerService,
  NestInterceptor,
} from '@nestjs/common';
import { trace } from '@opentelemetry/api';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { getCorrelationId } from '../request-context';
import type { Request, Response } from 'express';

interface RequestUserInfo {
  id?: string;
  email?: string;
  fullName?: string | null;
  roles?: string[];
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest<Request & { correlationId?: string; user?: RequestUserInfo }>();
    const response = http.getResponse<Response>();
    const startedAt = Date.now();
    const correlationId = getCorrelationId() ?? request.correlationId;

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startedAt;
        const statusCode = response?.statusCode ?? 200;
        const spanContext = trace.getActiveSpan()?.spanContext();
        const payload = {
          type: 'http_request',
          method: request.method,
          path: request.url,
          statusCode,
          durationMs: duration,
          correlationId: correlationId ?? 'n/a',
          traceId: spanContext?.traceId,
          spanId: spanContext?.spanId,
          user: request.user
            ? {
                id: request.user.id,
                email: request.user.email,
                roles: request.user.roles,
              }
            : undefined,
        };
        this.logger.log(JSON.stringify(payload), 'HTTP');
      }),
      catchError((err) => {
        const duration = Date.now() - startedAt;
        const spanContext = trace.getActiveSpan()?.spanContext();
        const payload = {
          type: 'http_request_error',
          method: request.method,
          path: request.url,
          durationMs: duration,
          correlationId: correlationId ?? 'n/a',
          traceId: spanContext?.traceId,
          spanId: spanContext?.spanId,
          user: request.user
            ? {
                id: request.user.id,
                email: request.user.email,
                roles: request.user.roles,
              }
            : undefined,
          errorMessage: err?.message,
        };
        this.logger.error(JSON.stringify(payload), err?.stack, 'HTTP');
        return throwError(() => err);
      }),
    );
  }
}

