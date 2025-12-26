import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { context as otelContext, SpanAttributes, SpanStatusCode, trace } from '@opentelemetry/api';
import { Observable } from 'rxjs';
import { getCorrelationId } from '../request-context';
import type { Request, Response } from 'express';

interface RequestUser {
  id?: string;
  email?: string;
  fullName?: string | null;
  roles?: string[];
}

@Injectable()
export class RequestTracingInterceptor implements NestInterceptor {
  constructor(private readonly serviceName: string) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const tracer = trace.getTracer(`${this.serviceName}-http`);
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request & { correlationId?: string; user?: RequestUser }>();
    const response = httpContext.getResponse<Response>();
    const correlationId = getCorrelationId() ?? request.correlationId;
    const spanName = `${request.method} ${request.path ?? request.url}`;

  const attributes: SpanAttributes = {
      'http.method': request.method,
      'http.target': request.originalUrl ?? request.url,
      'http.host': request.headers.host,
      'http.user_agent': request.headers['user-agent'],
      'http.client_ip': request.ip,
    };

    if (request.route?.path) {
      attributes['http.route'] = request.route.path;
    }
    if (correlationId) {
      attributes['http.request_id'] = correlationId;
    }
    if (request.user?.id) {
      attributes['enduser.id'] = request.user.id;
    }
    if (request.user?.email) {
      attributes['enduser.email'] = request.user.email;
    }
    if (request.user?.roles?.length) {
      attributes['enduser.role'] = request.user.roles.join(',');
    }

    const span = tracer.startSpan(spanName, {
      attributes,
    });

    span.setAttribute('service.name', this.serviceName);

    const activeContext = trace.setSpan(otelContext.active(), span);
    const handler$ = next.handle();

    return new Observable((observer) => {
      const run = () => {
        const subscription = handler$.subscribe({
          next: (value) => observer.next(value),
          error: (err) => {
            span.recordException(err);
            span.setStatus({ code: SpanStatusCode.ERROR, message: err?.message });
            span.setAttribute('http.status_code', response.statusCode ?? 500);
            span.end();
            observer.error(err);
          },
          complete: () => {
            span.setAttribute('http.status_code', response.statusCode ?? 200);
            span.setStatus({ code: SpanStatusCode.OK });
            span.end();
            observer.complete();
          },
        });

        return () => subscription.unsubscribe();
      };

      return otelContext.with(activeContext, run);
    });
  }
}
