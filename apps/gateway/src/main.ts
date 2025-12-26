import { bootstrapHttpService, initializeTelemetry } from '@app/common';
import { AppModule } from './app.module';

async function bootstrap() {
  await initializeTelemetry({
    serviceName: 'gateway',
  });
  await bootstrapHttpService(AppModule, {
    serviceName: 'gateway',
    defaultPort: 3000,
  });
}

bootstrap();
