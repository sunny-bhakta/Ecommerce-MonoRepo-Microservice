import { ConsoleLogger, LogLevel, LoggerService } from '@nestjs/common';
import { getCorrelationId } from './request-context';

function resolveLogLevels(): LogLevel[] {
  const levels = process.env.LOG_LEVELS ?? process.env.LOG_LEVEL;
  if (!levels) {
    return ['error', 'warn', 'log'];
  }

  const parsed = levels
    .split(',')
    .map((level) => level.trim())
    .filter(Boolean) as LogLevel[];

  return parsed.length ? parsed : ['error', 'warn', 'log'];
}

export function createServiceLogger(serviceName: string, logLevels?: LogLevel[]): ConsoleLogger {
  return new ConsoleLogger(serviceName, {
    timestamp: true,
    logLevels: logLevels ?? resolveLogLevels(),
  });
}

export interface DomainEventLog {
  action: string;
  entity: string;
  entityId?: string;
  status: 'success' | 'failure';
  detail?: Record<string, unknown>;
}

export function logDomainEvent(logger: LoggerService, event: DomainEventLog): void {
  const correlationId = getCorrelationId();
  const baseMessage = `domain.${event.entity}.${event.action} status=${event.status} id=${
    event.entityId ?? 'n/a'
  } cid=${correlationId ?? 'n/a'}`;

  if (event.status === 'failure') {
    logger.error?.(baseMessage, event.detail ? JSON.stringify(event.detail) : undefined);
  } else {
    logger.log?.(baseMessage + (event.detail ? ` detail=${JSON.stringify(event.detail)}` : ''));
  }
}

