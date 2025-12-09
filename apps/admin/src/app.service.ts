import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  health() {
    return {
      service: 'admin',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
