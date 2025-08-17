// Import role types from api.ts to avoid duplication
import type { UserRole } from './api';

export interface User {
  id: string;
  username: string;
  email: string;
  roles: UserRole[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  expiresAt: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}