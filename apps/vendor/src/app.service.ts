import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  health() {
    return {
      service: 'vendor',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
