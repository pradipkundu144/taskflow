export type Role = 'admin' | 'manager' | 'teamLead' | 'employee';
export type OperationalRole = 'manager' | 'teamLead' | 'employee';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: Role;
  teamLead?: string;
  manager?: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role: OperationalRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export interface RefreshResponse {
  accessToken: string;
}
