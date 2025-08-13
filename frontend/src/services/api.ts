import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import type { ApiResponse } from '../types/api';

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    // Default to localhost for development, can be configured via environment variables
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5267/api';
    
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle common errors
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid, logout user
          this.removeToken();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Token management
  public setToken(token: string): void {
    localStorage.setItem('authToken', token);
  }

  public getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  public removeToken(): void {
    localStorage.removeItem('authToken');
  }

  // Generic API methods
  public async get<T>(url: string): Promise<ApiResponse<T>> {
    const response = await this.api.get<ApiResponse<T>>(url);
    return response.data;
  }

  public async post<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    const response = await this.api.post<ApiResponse<T>>(url, data);
    return response.data;
  }

  public async put<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    const response = await this.api.put<ApiResponse<T>>(url, data);
    return response.data;
  }

  public async delete<T>(url: string): Promise<ApiResponse<T>> {
    const response = await this.api.delete<ApiResponse<T>>(url);
    return response.data;
  }

  // Check if service is available
  public async healthCheck(): Promise<boolean> {
    try {
      await this.api.get('/health');
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;