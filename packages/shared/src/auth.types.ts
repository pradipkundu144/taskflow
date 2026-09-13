export const ROLES = ['admin', 'manager', 'teamLead', 'employee'] as const;
export const OPERATIONAL_ROLES = ['manager', 'teamLead', 'employee'] as const;

export type Role = (typeof ROLES)[number];
export type OperationalRole = (typeof OPERATIONAL_ROLES)[number];

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
  user: AuthUser;
}
