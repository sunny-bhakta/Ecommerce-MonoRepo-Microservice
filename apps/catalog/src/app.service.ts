import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  health() {
    return {
      service: 'catalog',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
