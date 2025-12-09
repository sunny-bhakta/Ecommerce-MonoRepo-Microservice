import { ConfigService } from '@nestjs/config';

import { AUTH_JWT_EXPIRES_IN, DEFAULT_JWT_EXPIRES_IN_SECONDS } from '../auth.constants';

export function resolveJwtExpiresInSeconds(config: ConfigService): number {
  const configured = config.get<string>(AUTH_JWT_EXPIRES_IN);
  if (!configured) {
    return DEFAULT_JWT_EXPIRES_IN_SECONDS;
  }

  const asNumber = Number(configured);
  if (!Number.isNaN(asNumber)) {
    return asNumber;
  }

  if (configured.endsWith('m')) {
    const minutes = Number(configured.slice(0, -1));
    if (!Number.isNaN(minutes)) {
      return minutes * 60;
    }
  }

  if (configured.endsWith('h')) {
    const hours = Number(configured.slice(0, -1));
    if (!Number.isNaN(hours)) {
      return hours * 60 * 60;
    }
  }

  return DEFAULT_JWT_EXPIRES_IN_SECONDS;
}

