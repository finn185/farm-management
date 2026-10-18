export type UserRole = 'SUPER_ADMIN' | 'FARM_MANAGER' | 'AGRONOMIST' | 'OPERATOR';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phoneNumber?: string;
  avatarUrl?: string;
  lastLoginAt?: string;
  createdAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
  role?: UserRole;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    user: AuthUser;
    token: string;
  };
  error?: any;
}
