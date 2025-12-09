import { bootstrapHttpService } from '@app/common';
import { AppModule } from './app.module';

async function bootstrap() {
  await bootstrapHttpService(AppModule, {
    serviceName: 'user',
    defaultPort: 3020,
  });
}

bootstrap();
