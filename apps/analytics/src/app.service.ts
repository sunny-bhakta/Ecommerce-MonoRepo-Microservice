import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  health() {
    return {
      service: 'analytics',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
