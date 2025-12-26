import os from 'os';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

interface TelemetryOptions {
  serviceName: string;
  exporterEndpoint?: string;
  headers?: Record<string, string>;
}

let sdk: NodeSDK | undefined;
let initializing: Promise<void> | undefined;

function parseHeaders(raw?: string): Record<string, string> | undefined {
  if (!raw) {
    return undefined;
  }
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, string>;
    }
  } catch (err) {
    // Fall back to simple comma-separated format
  }

  const entries = raw
    .split(',')
    .map((pair) => pair.trim())
    .filter(Boolean)
    .map((pair) => {
      const [key, value] = pair.split('=').map((part) => part.trim());
      return key && value ? [key, value] : null;
    })
    .filter((entry): entry is [string, string] => Array.isArray(entry));

  if (!entries.length) {
    return undefined;
  }

  return Object.fromEntries(entries);
}

export async function initializeTelemetry(options: TelemetryOptions): Promise<void> {
  const isTelemetryDisabled =
    (process.env.OTEL_ENABLED ?? process.env.GATEWAY_TELEMETRY_ENABLED ?? 'true').toLowerCase() ===
    'false';

  if (isTelemetryDisabled || sdk) {
    return;
  }

  if (initializing) {
    return initializing;
  }

  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR);

  const exporter = new OTLPTraceExporter({
    url:
      options.exporterEndpoint ??
      process.env.OTEL_EXPORTER_OTLP_ENDPOINT ??
      'http://localhost:4318/v1/traces',
    headers: options.headers ?? parseHeaders(process.env.OTEL_EXPORTER_OTLP_HEADERS),
  });

  const resource = new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: options.serviceName,
    [SemanticResourceAttributes.SERVICE_NAMESPACE]:
      process.env.OTEL_SERVICE_NAMESPACE ?? 'ecommerce-platform',
    [SemanticResourceAttributes.SERVICE_INSTANCE_ID]:
      process.env.OTEL_SERVICE_INSTANCE_ID ?? os.hostname(),
  });

  sdk = new NodeSDK({
    traceExporter: exporter,
    resource,
    instrumentations: [getNodeAutoInstrumentations()],
  });

  const startResult = sdk.start();

  initializing = Promise.resolve(startResult)
    .then(() => {
      const shutdown = async () => {
        try {
          await sdk?.shutdown();
        } catch (err) {
          console.error('Failed to shut down telemetry', err);
        }
      };

      process.once('SIGTERM', shutdown);
      process.once('SIGINT', shutdown);
    })
    .catch((err) => {
      console.error('Failed to initialize telemetry', err);
      sdk = undefined;
    });

  await initializing;
}
