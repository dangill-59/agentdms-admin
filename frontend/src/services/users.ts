import type { User, PaginatedResponse } from '../types/auth';
import { apiService } from './api';

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: string;
  password?: string;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  administratorCount: number;
  managerCount: number;
  userCount: number;
}

export class UserService {
  private readonly basePath = '/users';

  // User CRUD operations
  public async getUsers(page = 1, pageSize = 10): Promise<PaginatedResponse<User>> {
    try {
      const response = await apiService.get<PaginatedResponse<User>>(`${this.basePath}?page=${page}&pageSize=${pageSize}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch users:', error);
      // Return mock data for development until backend is connected
      const mockUsers: User[] = [
        {
          id: '1',
          name: 'Admin User',
          email: 'admin@agentdms.com',
          role: 'Administrator'
        },
        {
          id: '2',
          name: 'John Manager',
          email: 'john@agentdms.com',
          role: 'Manager'
        },
        {
          id: '3',
          name: 'Jane User',
          email: 'jane@agentdms.com',
          role: 'User'
        }
      ];
      
      return {
        data: mockUsers,
        totalCount: mockUsers.length,
        page,
        pageSize,
        totalPages: Math.ceil(mockUsers.length / pageSize)
      };
    }
  }

  public async getUser(id: string): Promise<User> {
    const response = await apiService.get<User>(`${this.basePath}/${id}`);
    return response.data;
  }

  public async createUser(userData: CreateUserRequest): Promise<User> {
    const response = await apiService.post<User>(this.basePath, userData);
    return response.data;
  }

  public async updateUser(id: string, userData: UpdateUserRequest): Promise<User> {
    const response = await apiService.put<User>(`${this.basePath}/${id}`, userData);
    return response.data;
  }

  public async deleteUser(id: string): Promise<void> {
    await apiService.delete(`${this.basePath}/${id}`);
  }

  // Search users
  public async searchUsers(query: string, page = 1, pageSize = 10): Promise<PaginatedResponse<User>> {
    const response = await apiService.get<PaginatedResponse<User>>(`${this.basePath}/search?q=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}`);
    return response.data;
  }

  // Get user statistics
  public async getUserStats(): Promise<UserStats> {
    try {
      const response = await apiService.get<UserStats>(`${this.basePath}/stats`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
      // Return mock stats for development
      return {
        totalUsers: 3,
        activeUsers: 3,
        administratorCount: 1,
        managerCount: 1,
        userCount: 1
      };
    }
  }

  // Role management
  public async getRoles(): Promise<string[]> {
    try {
      const response = await apiService.get<string[]>(`${this.basePath}/roles`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      // Return default roles
      return ['Administrator', 'Manager', 'User'];
    }
  }

  // User activation/deactivation
  public async activateUser(id: string): Promise<void> {
    await apiService.post(`${this.basePath}/${id}/activate`);
  }

  public async deactivateUser(id: string): Promise<void> {
    await apiService.post(`${this.basePath}/${id}/deactivate`);
  }

  // Password reset
  public async resetPassword(id: string): Promise<{ temporaryPassword: string }> {
    const response = await apiService.post<{ temporaryPassword: string }>(`${this.basePath}/${id}/reset-password`);
    return response.data;
  }

  // Change user password
  public async changePassword(id: string, currentPassword: string, newPassword: string): Promise<void> {
    await apiService.post(`${this.basePath}/${id}/change-password`, {
      currentPassword,
      newPassword
    });
  }

  // User profile operations
  public async updateProfile(profileData: { name: string; email: string }): Promise<User> {
    const response = await apiService.put<User>('/profile', profileData);
    return response.data;
  }

  public async updateCurrentUserPassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiService.post('/profile/change-password', {
      currentPassword,
      newPassword
    });
  }

  // Get user permissions
  public async getUserPermissions(id: string): Promise<string[]> {
    try {
      const response = await apiService.get<string[]>(`${this.basePath}/${id}/permissions`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user permissions:', error);
      return [];
    }
  }

  // Check if user has permission
  public async hasPermission(userId: string, permission: string): Promise<boolean> {
    try {
      const permissions = await this.getUserPermissions(userId);
      return permissions.includes(permission);
    } catch (error) {
      console.error('Failed to check user permission:', error);
      return false;
    }
  }

  // Bulk operations
  public async bulkUpdateUsers(userIds: string[], updateData: Partial<UpdateUserRequest>): Promise<User[]> {
    const response = await apiService.post<User[]>(`${this.basePath}/bulk-update`, {
      userIds,
      updateData
    });
    return response.data;
  }

  public async bulkDeleteUsers(userIds: string[]): Promise<void> {
    await apiService.post(`${this.basePath}/bulk-delete`, { userIds });
  }

  // Export users
  public async exportUsers(format: 'csv' | 'xlsx' = 'csv'): Promise<Blob> {
    const response = await fetch(`${apiService.getBaseURL()}${this.basePath}/export?format=${format}`, {
      headers: {
        'Authorization': `Bearer ${apiService.getToken()}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Export failed');
    }
    
    return await response.blob();
  }
}

export const userService = new UserService();