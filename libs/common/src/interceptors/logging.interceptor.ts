import {
  CallHandler,
  ExecutionContext,
  Injectable,
  LoggerService,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { getCorrelationId } from '../request-context';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest<Request & { correlationId?: string }>();
    const response = http.getResponse<Response>();
    const startedAt = Date.now();
    const correlationId = getCorrelationId() ?? request.correlationId;

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startedAt;
        const statusCode = response?.statusCode ?? 200;
        this.logger.log(
          `HTTP ${request.method} ${request.url} ${statusCode} ${duration}ms cid=${correlationId ?? 'n/a'}`,
          'HTTP',
        );
      }),
      catchError((err) => {
        const duration = Date.now() - startedAt;
        this.logger.error(
          `HTTP ${request.method} ${request.url} failed in ${duration}ms cid=${correlationId ?? 'n/a'}`,
          err?.stack,
          'HTTP',
        );
        return throwError(() => err);
      }),
    );
  }
}

