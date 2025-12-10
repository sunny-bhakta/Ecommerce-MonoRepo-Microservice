import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  LoggerService,
} from '@nestjs/common';
import { getCorrelationId } from '../request-context';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionLoggingFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest<Request & { correlationId?: string }>();
    const correlationId = getCorrelationId() ?? request.correlationId;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: any = {
      statusCode: status,
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
      path: (request as any)?.url,
      correlationId,
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse() as any;
      const validationErrors = this.extractValidationMessages(exception);

      body = {
        statusCode: status,
        message: typeof res === 'string' ? res : res?.message ?? 'Error',
        errors: validationErrors,
        timestamp: new Date().toISOString(),
        path: (request as any)?.url,
        correlationId,
      };

      this.logger.warn(
        `HTTP ${request.method} ${request.url} ${status} cid=${correlationId ?? 'n/a'}`,
        typeof res === 'string' ? res : JSON.stringify(res),
        'HTTP',
      );
    } else if (exception instanceof Error) {
      this.logger.error(
        `HTTP ${request.method} ${request.url} failed cid=${correlationId ?? 'n/a'}`,
        exception.stack,
        'HTTP',
      );
    } else {
      this.logger.error(
        `HTTP ${request.method} ${request.url} failed cid=${correlationId ?? 'n/a'}`,
        undefined,
        'HTTP',
      );
    }

    response.status(status).json(body);
  }

  private extractValidationMessages(exception: HttpException): string[] | undefined {
    if (!(exception instanceof BadRequestException)) return undefined;
    const res = exception.getResponse() as any;
    const messages = res?.message;
    if (Array.isArray(messages)) return messages;
    if (typeof messages === 'string') return [messages];
    return undefined;
  }
}

