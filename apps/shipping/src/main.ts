import { bootstrapHttpService } from '@app/common';
import { AppModule } from './app.module';

async function bootstrap() {
  await bootstrapHttpService(AppModule, {
    serviceName: 'shipping',
    defaultPort: 4080,
  });
}

bootstrap();
