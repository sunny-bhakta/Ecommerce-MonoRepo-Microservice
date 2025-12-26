import { strict as assert } from 'node:assert';
import { of, throwError } from 'rxjs';
import { GatewayHttpService } from '../gateway-http.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

interface TestCase {
  name: string;
  fn: () => Promise<void> | void;
}

class FakeConfigService {
  constructor(private readonly values: Record<string, string | number | undefined>) {}

  get<T = string>(key: string): T | undefined {
    return this.values[key] as T | undefined;
  }
}

const axiosLikeError = Object.assign(new Error('upstream error'), {
  isAxiosError: true,
  response: { status: 502, data: { message: 'bad gateway' } },
});

const tests: TestCase[] = [];

function test(name: string, fn: () => Promise<void> | void) {
  tests.push({ name, fn });
}

function createHttpStub(overrides: Partial<HttpService>): HttpService {
  return overrides as HttpService;
}

test('retries transient downstream errors before succeeding', async () => {
  let attempts = 0;
  const http = createHttpStub({
    get: () => {
      attempts += 1;
      if (attempts < 3) {
        return throwError(() => axiosLikeError);
      }
      return of({ data: { ok: true } });
    },
  });
  const config = new FakeConfigService({
    GATEWAY_HTTP_DEFAULT_RETRY_ATTEMPTS: '2',
    GATEWAY_HTTP_DEFAULT_RETRY_DELAY_MS: '0',
    GATEWAY_HTTP_DEFAULT_CIRCUIT_THRESHOLD: '5',
    GATEWAY_HTTP_DEFAULT_CIRCUIT_COOLDOWN_MS: '1000',
  });

  const gateway = new GatewayHttpService(http, config as unknown as ConfigService);
  const result = await gateway.get('http://localhost:3060/order/test', 'order service');
  assert.equal(attempts, 3);
  assert.deepEqual(result, { ok: true });
});

test('opens circuit after configured failures and short-circuits subsequent calls', async () => {
  let attempts = 0;
  const http = createHttpStub({
    get: () => {
      attempts += 1;
      return throwError(() => axiosLikeError);
    },
  });
  const config = new FakeConfigService({
    GATEWAY_HTTP_DEFAULT_RETRY_ATTEMPTS: '0',
    GATEWAY_HTTP_DEFAULT_RETRY_DELAY_MS: '0',
    GATEWAY_HTTP_DEFAULT_CIRCUIT_THRESHOLD: '1',
    GATEWAY_HTTP_DEFAULT_CIRCUIT_COOLDOWN_MS: '60000',
  });

  const gateway = new GatewayHttpService(http, config as unknown as ConfigService);

  await assert.rejects(() => gateway.get('http://localhost:3060/order/fail', 'order service'));
  assert.equal(attempts, 1, 'first call should hit downstream once');
  await assert.rejects(
    () => gateway.get('http://localhost:3060/order/fail', 'order service'),
    /Circuit open/,
  );
  assert.equal(attempts, 1, 'second call should be short-circuited');
});

async function run() {
  for (const { name, fn } of tests) {
    await fn();
    console.log(`✓ ${name}`);
  }
  console.log(`\n${tests.length} gateway HTTP tests passed`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
