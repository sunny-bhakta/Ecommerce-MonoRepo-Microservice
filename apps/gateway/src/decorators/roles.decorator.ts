import { SetMetadata } from '@nestjs/common';

import { ROLES_METADATA_KEY } from '../constants/auth.constants';

// Need route rules/config (roles, permissions)? → SetMetadata
// SetMetadata → describe behavior
export const Roles = (...roles: string[]) => SetMetadata(ROLES_METADATA_KEY, roles);

