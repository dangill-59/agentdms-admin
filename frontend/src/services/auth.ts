import type { LoginCredentials, AuthResponse, User } from '../types/auth';
import { apiService } from './api';

export class AuthService {
  public async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // Try real backend authentication first
      const response = await apiService.post<AuthResponse>('/auth/login', credentials);
      
      // The backend returns the auth response directly (not wrapped in ApiResponse.data)
      // So response is actually the auth response itself
      const authResponse = response as unknown as AuthResponse;
      
      // Defensively check response structure
      if (!authResponse || !authResponse.token) {
        throw new Error('Invalid backend response: missing authentication data or token');
      }
      
      // Store token
      apiService.setToken(authResponse.token);
      
      return authResponse;
    } catch (error: any) {
      // Check if this is a backend authentication error with a specific message
      if (error.response?.status === 401 && error.response?.data?.message) {
        // Use the specific error message from the backend
        const backendErrorMessage = error.response.data.message;
        console.warn('Backend authentication failed with message:', backendErrorMessage);
        throw new Error(backendErrorMessage);
      }
      
      // Check if this is any other HTTP error from the backend
      if (error.response?.status) {
        console.warn('Backend authentication failed with HTTP error:', error.response.status, error.response?.data);
        // Use backend error message if available, otherwise use a generic message
        const errorMessage = error.response?.data?.message || `Authentication failed (HTTP ${error.response.status})`;
        throw new Error(errorMessage);
      }
      
      // For network errors or other non-HTTP errors, fallback to demo authentication for development
      console.warn('Backend authentication failed, using demo authentication:', error.message || error);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Demo validation - remove this in production
      if (credentials.email === 'admin@agentdms.com' && credentials.password === 'admin123') {
        const user: User = {
          id: '1',
          username: 'admin',
          email: credentials.email,
          roles: [
            {
              id: '1',
              userId: '1',
              roleId: '1',
              roleName: 'Administrator',
              createdAt: new Date().toISOString()
            }
          ]
        };

        const token = 'demo-jwt-token-' + Date.now();
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
  }

  public async logout(): Promise<void> {
    try {
      // Try to call backend logout endpoint to invalidate the token
      await apiService.post('/auth/logout');
    } catch (error) {
      console.warn('Backend logout failed:', error);
    } finally {
      // Always remove token locally
      apiService.removeToken();
    }
  }

  public async getCurrentUser(): Promise<User | null> {
    const token = apiService.getToken();
    if (!token) return null;

    try {
      // Try to get current user from backend
      const response = await apiService.get<User>('/auth/me');
      
      // The backend returns the user directly (not wrapped in ApiResponse.data)
      const user = response as unknown as User;
      
      return user;
    } catch (error) {
      console.warn('Failed to get current user from backend:', error);
      
      // Fallback to demo user if token exists (for development)
      if (token.startsWith('demo-jwt-token-')) {
        return {
          id: '1',
          username: 'admin',
          email: 'admin@agentdms.com',
          roles: [
            {
              id: '1',
              userId: '1',
              roleId: '1',
              roleName: 'Administrator',
              createdAt: new Date().toISOString()
            }
          ]
        };
      }
      
      return null;
    }
  }

  public async refreshToken(): Promise<string | null> {
    try {
      const response = await apiService.post<{ token: string; expiresAt: string }>('/auth/refresh');
      
      // The backend returns the token response directly (not wrapped in ApiResponse.data)
      const tokenResponse = response as unknown as { token: string; expiresAt: string };
      
      // Defensively check response structure
      if (!tokenResponse || !tokenResponse.token) {
        throw new Error('Invalid backend response: missing token data');
      }
      
      const newToken = tokenResponse.token;
      
      apiService.setToken(newToken);
      return newToken;
    } catch (error) {
      console.warn('Token refresh failed:', error);
      
      // For demo tokens, just return the existing token
      const currentToken = apiService.getToken();
      if (currentToken?.startsWith('demo-jwt-token-')) {
        return currentToken;
      }
      
      return null;
    }
  }

  public isTokenValid(): boolean {
    const token = apiService.getToken();
    if (!token) return false;

    // For demo tokens, always consider valid
    if (token.startsWith('demo-jwt-token-')) {
      return true;
    }

    // For real JWT tokens, you would decode and validate the token
    // For now, just check if token exists
    try {
      // You can add JWT token validation here
      // const decoded = jwt.decode(token);
      // return decoded && decoded.exp > Date.now() / 1000;
      return true;
    } catch {
      return false;
    }
  }

  public getToken(): string | null {
    return apiService.getToken();
  }

  // Additional auth methods for real backend integration
  public async register(userData: {
    username: string;
    email: string;
    password: string;
    role?: string;
  }): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>('/auth/register', userData);
    
    // The backend returns the auth response directly (not wrapped in ApiResponse.data)
    const authResponse = response as unknown as AuthResponse;
    
    // Defensively check response structure
    if (!authResponse || !authResponse.token) {
      throw new Error('Invalid backend response: missing authentication data or token');
    }
    
    // Store token
    apiService.setToken(authResponse.token);
    
    return authResponse;
  }

  public async forgotPassword(email: string): Promise<void> {
    await apiService.post('/auth/forgot-password', { email });
  }

  public async resetPassword(token: string, newPassword: string): Promise<void> {
    await apiService.post('/auth/reset-password', { token, newPassword });
  }

  public async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiService.post('/auth/change-password', { currentPassword, newPassword });
  }

  public async verifyEmail(token: string): Promise<void> {
    await apiService.post('/auth/verify-email', { token });
  }

  public async resendVerification(email: string): Promise<void> {
    await apiService.post('/auth/resend-verification', { email });
  }
}

export const authService = new AuthService();