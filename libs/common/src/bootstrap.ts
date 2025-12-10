import { INestApplication, Type } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { createServiceLogger } from './logger';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { RequestContextMiddleware } from './middleware/request-context.middleware';
import { HttpExceptionLoggingFilter } from './filters/http-exception.filter';

interface HttpBootstrapOptions {
  serviceName: string;
  defaultPort: number;
  enableMicroservice?: boolean;
}

export async function bootstrapHttpService(
  AppModule: Type<unknown>,
  options: HttpBootstrapOptions,
): Promise<void> {
  const logger = createServiceLogger(options.serviceName);
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    rawBody: true,
    logger,
  });
  app.useLogger(logger);
  const requestContextMiddleware = new RequestContextMiddleware();
  app.use(requestContextMiddleware.use.bind(requestContextMiddleware));
  app.useGlobalInterceptors(new LoggingInterceptor(logger));
  app.useGlobalFilters(new HttpExceptionLoggingFilter(logger));
  const configService = app.get(ConfigService);

  if (options.enableMicroservice ?? true) {
    //todo uncomment this when rmq is ready
    // connectRmqMicroservice(app, configService, options.serviceName);
    await app.startAllMicroservices();
  }

  const port =
    configService.get<number>(`${options.serviceName.toUpperCase()}_PORT`) ??
    configService.get<number>('PORT') ??
    options.defaultPort;

  await app.listen(port);
  app.enableShutdownHooks();
  logger.log(`${options.serviceName} service listening on port ${port}`);
}

export async function bootstrapWorker(AppModule: Type<unknown>, serviceName: string): Promise<void> {
  const logger = createServiceLogger(serviceName);
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    createRmqOptions(serviceName),
  );
  app.useLogger(logger);
  await app.listen();
  logger.log(`${serviceName} worker microservice is running`);
}

function connectRmqMicroservice(
  app: INestApplication,
  configService: ConfigService,
  serviceName: string,
): void {
  app.connectMicroservice<MicroserviceOptions>(
    createRmqOptions(serviceName, configService.get<string>('RABBITMQ_URL'), (key) =>
      configService.get<string>(key),
    ),
  );
}

function createRmqOptions(
  serviceName: string,
  overrideUrl?: string,
  envResolver?: (key: string) => string | undefined,
): MicroserviceOptions {
  const envKey = `${serviceName.toUpperCase()}_QUEUE`;
  const rmqUrl = overrideUrl ?? envResolver?.('RABBITMQ_URL') ?? process.env.RABBITMQ_URL ?? 'amqp://localhost:5672';
  const queue = envResolver?.(envKey) ?? process.env[envKey] ?? `${serviceName}_queue`;

  return {
    transport: Transport.RMQ,
    options: {
      urls: [rmqUrl],
      queue,
      queueOptions: {
        durable: true,
      },
    },
  };
}

