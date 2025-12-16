import { bootstrapHttpService } from '@app/common';
import { AppModule } from './app.module';

async function bootstrap() {
  await bootstrapHttpService(AppModule, {
    serviceName: 'vendor',
    defaultPort: 3030,
  });
}

bootstrap();
