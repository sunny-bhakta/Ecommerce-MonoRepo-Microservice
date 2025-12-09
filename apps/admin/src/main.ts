import { bootstrapHttpService } from '@app/common';
import { AppModule } from './app.module';

async function bootstrap() {
  await bootstrapHttpService(AppModule, {
    serviceName: 'admin',
    defaultPort: 3110,
  });
}

bootstrap();
