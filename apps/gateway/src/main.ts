import { bootstrapHttpService } from '@app/common';
import { AppModule } from './app.module';

async function bootstrap() {
  console.log('Bootstrapping gateway service');
  try {
    console.log('Bootstrapping gateway service...');
    await bootstrapHttpService(AppModule, {
      serviceName: 'gateway',
      defaultPort: 3000,
    });
    console.log('Gateway service bootstrapped successfully');
  } catch (error) {
    console.error('Error bootstrapping gateway service', error);
    process.exit(1);
  }
}

bootstrap();
