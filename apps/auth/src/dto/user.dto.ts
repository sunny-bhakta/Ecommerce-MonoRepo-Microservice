import { UserRole } from '@app/common/enums/user-role.enum';
import { UserEntity } from '../entities/user.entity';

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName?: string | null;
  roles: UserRole[];
}

export interface AuthTokens {
  accessToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: AuthenticatedUser;
  tokens: AuthTokens;
}

export function mapUserToAuthUser(entity: UserEntity): AuthenticatedUser {
  return {
    id: entity.id,
    email: entity.email,
    fullName: entity.fullName,
    roles: entity.roles,
  };
}


