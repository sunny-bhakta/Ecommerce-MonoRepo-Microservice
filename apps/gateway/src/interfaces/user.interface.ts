export interface UserProfileResponse {
  id: string;
  email: string;
  fullName?: string | null;
  phoneNumber?: string | null;
  addresses?: Record<string, unknown>[];
  preferences?: Record<string, unknown>;
  isActive: boolean;
}


