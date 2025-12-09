import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  health() {
    return {
      service: 'search',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
