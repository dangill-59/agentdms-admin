import type { LoginCredentials, AuthResponse, User } from '../types/auth';
import { apiService } from './api';

export class AuthService {
  // Mock authentication for demo purposes
  // In a real application, these would call actual backend endpoints
  public async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock validation - in real app, this would be validated by backend
    if (credentials.email === 'admin@agentdms.com' && credentials.password === 'admin123') {
      const user: User = {
        id: '1',
        email: credentials.email,
        name: 'Admin User',
        role: 'Administrator'
      };

      const token = 'mock-jwt-token-' + Date.now();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

      const response: AuthResponse = {
        token,
        user,
        expiresAt
      };

      // Store token
      apiService.setToken(token);
      
      return response;
    } else {
      throw new Error('Invalid email or password');
    }
  }

  public async logout(): Promise<void> {
    // In a real app, you might want to call a logout endpoint to invalidate the token
    apiService.removeToken();
  }

  public async getCurrentUser(): Promise<User | null> {
    const token = apiService.getToken();
    if (!token) return null;

    // In a real app, this would verify the token with the backend
    // For now, return mock user if token exists
    return {
      id: '1',
      email: 'admin@agentdms.com',
      name: 'Admin User',
      role: 'Administrator'
    };
  }

  public async refreshToken(): Promise<string | null> {
    // In a real app, this would refresh the JWT token
    // For now, just return the existing token
    return apiService.getToken();
  }

  public isTokenValid(): boolean {
    const token = apiService.getToken();
    if (!token) return false;

    // In a real app, you would decode and validate the JWT token
    // For now, just check if token exists
    return true;
  }

  public getToken(): string | null {
    return apiService.getToken();
  }
}

export const authService = new AuthService();