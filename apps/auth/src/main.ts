import { bootstrapHttpService } from '@app/common';
import { AppModule } from './app.module';
import { DownstreamApps } from '@app/common/enums';

async function bootstrap() {
  await bootstrapHttpService(AppModule, {
    serviceName: DownstreamApps.AUTH,
    defaultPort: 3010,
  });
}

bootstrap();
