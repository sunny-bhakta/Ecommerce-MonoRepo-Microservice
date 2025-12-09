import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  health() {
    return {
      service: 'inventory',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
