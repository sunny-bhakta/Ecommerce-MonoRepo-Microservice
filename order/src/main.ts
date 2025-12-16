import { bootstrapHttpService } from '@app/common';
import { AppModule } from './app.module';

async function bootstrap() {
  await bootstrapHttpService(AppModule, {
    serviceName: 'order',
    defaultPort: 3060,
  });
}

bootstrap();
