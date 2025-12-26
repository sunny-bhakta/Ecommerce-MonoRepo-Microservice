import { bootstrapHttpService } from '@app/common';
import { AppModule } from './app.module';

async function bootstrap() {
  await bootstrapHttpService(AppModule, {
    serviceName: 'catalog',
    defaultPort: 3040,
    swagger: {
      title: 'Catalog Service API',
      description: 'Catalog service endpoints for categories, products, and variants',
      version: '1.0',
      path: 'docs',
    },
  });
}

bootstrap();
