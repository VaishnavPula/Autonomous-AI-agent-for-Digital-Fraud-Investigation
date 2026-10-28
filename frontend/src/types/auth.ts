export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
  is_superuser: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export type UserRole = 
  | 'ADMIN' 
  | 'LEAD_INVESTIGATOR' 
  | 'INVESTIGATOR' 
  | 'ANALYST' 
  | 'VIEWER';

export interface LoginRequest {
  username: string;
  password: string;
  confirmPassword?: string;
  terms?: boolean;
}

export interface RegisterRequest {
  email: string;
  username: string;
  full_name?: string;
  password: string;
  confirmPassword?: string;
  role?: UserRole;
}

export interface Token {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
}

export interface UserUpdate {
  email?: string;
  full_name?: string;
  is_active?: boolean;
}