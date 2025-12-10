import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';

export interface RequestContextStore {
  correlationId: string;
}

const storage = new AsyncLocalStorage<RequestContextStore>();

export function ensureCorrelationId(headerValue?: string): string {
  if (headerValue && headerValue.trim().length > 0) {
    return headerValue;
  }
  return randomUUID();
}

export function runWithRequestContext(correlationId: string, callback: () => void): void {
  storage.run({ correlationId }, callback);
}

export function getCorrelationId(): string | undefined {
  return storage.getStore()?.correlationId;
}

