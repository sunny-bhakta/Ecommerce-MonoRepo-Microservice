import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  health() {
    return {
      service: 'shipping',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
