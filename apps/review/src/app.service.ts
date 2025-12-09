import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  health() {
    return {
      service: 'review',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
