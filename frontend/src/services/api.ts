import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import type { ApiResponse } from '../types/api';
import config from '../utils/config';

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    // Use configuration service for base URL
    this.baseURL = config.get('apiUrl');
    
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: config.get('apiTimeout'),
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
        // Note: 403 errors are handled at the component level with enhanced error messages
        // We don't want to intercept them globally since they need context-specific handling
        return Promise.reject(error);
      }
    );
  }

  // Token management
  public setToken(token: string): void {
    const storageKey = config.get('tokenStorageKey');
    localStorage.setItem(storageKey, token);
  }

  public getToken(): string | null {
    const storageKey = config.get('tokenStorageKey');
    return localStorage.getItem(storageKey);
  }

  public removeToken(): void {
    const storageKey = config.get('tokenStorageKey');
    localStorage.removeItem(storageKey);
  }

  // Base URL getter for external services
  public getBaseURL(): string {
    return this.baseURL;
  }

  // Generic API methods that return data directly (not wrapped in ApiResponse)
  public async getDirect<T>(url: string): Promise<T> {
    const response = await this.api.get<T>(url);
    return response.data;
  }

  public async postDirect<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.api.post<T>(url, data);
    return response.data;
  }

  public async putDirect<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.api.put<T>(url, data);
    return response.data;
  }

  public async deleteDirect<T>(url: string): Promise<T> {
    const response = await this.api.delete<T>(url);
    return response.data;
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