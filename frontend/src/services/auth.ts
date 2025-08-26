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
    } catch (error: unknown) {
      // Check if this is a backend authentication error with a specific message
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
        if (axiosError.response?.status === 401 && axiosError.response?.data?.message) {
          // Use the specific error message from the backend
          const backendErrorMessage = axiosError.response.data.message;
          console.warn('Backend authentication failed with message:', backendErrorMessage);
          throw new Error(backendErrorMessage);
        }
        
        // Check if this is any other HTTP error from the backend
        if (axiosError.response?.status) {
          console.warn('Backend authentication failed with HTTP error:', axiosError.response.status, axiosError.response?.data);
          // Use backend error message if available, otherwise use a generic message
          const errorMessage = axiosError.response?.data?.message || `Authentication failed (HTTP ${axiosError.response.status})`;
          throw new Error(errorMessage);
        }
      }
      
      // For all errors, throw them in production mode - no demo fallbacks
      throw error;
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
      // Get current user from backend
      const response = await apiService.get<User>('/auth/me');
      
      // The backend returns the user directly (not wrapped in ApiResponse.data)
      const user = response as unknown as User;
      
      return user;
    } catch (error) {
      console.warn('Failed to get current user from backend:', error);
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
      return null;
    }
  }

  public isTokenValid(): boolean {
    const token = apiService.getToken();
    if (!token) return false;

    // For real JWT tokens, validate properly
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
    try {
      await apiService.post('/auth/forgot-password', { email });
    } catch (error) {
      throw error;
    }
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