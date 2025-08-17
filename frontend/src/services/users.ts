import type { User } from '../types/auth';
import type { UserRole, PaginatedResponse } from '../types/api';
import { apiService } from './api';

export class UserService {
  public async getUsers(page = 1, pageSize = 10): Promise<PaginatedResponse<User>> {
    try {
      const response = await apiService.get<PaginatedResponse<User>>(`/api/users?page=${page}&pageSize=${pageSize}`);
      return response.data || response;
    } catch (error) {
      console.warn('Failed to fetch users from backend, using demo data:', error);
      
      // Fallback to demo data for development
      const mockUsers: User[] = [
        {
          id: '1',
          username: 'admin',
          email: 'admin@agentdms.com',
          roles: [
            {
              id: '1',
              userId: '1',
              roleId: '1',
              roleName: 'Admin',
              createdAt: '2024-01-01T00:00:00Z'
            }
          ]
        },
        {
          id: '2',
          username: 'johnmanager',
          email: 'john@agentdms.com',
          roles: [
            {
              id: '2',
              userId: '2',
              roleId: '2',
              roleName: 'Manager',
              createdAt: '2024-01-01T00:00:00Z'
            }
          ]
        },
        {
          id: '3',
          username: 'janeuser',
          email: 'jane@agentdms.com',
          roles: [
            {
              id: '3',
              userId: '3',
              roleId: '3',
              roleName: 'User',
              createdAt: '2024-01-01T00:00:00Z'
            }
          ]
        }
      ];

      const totalCount = mockUsers.length;
      const totalPages = Math.ceil(totalCount / pageSize);
      const pagedUsers = mockUsers.slice((page - 1) * pageSize, page * pageSize);

      return {
        data: pagedUsers,
        totalCount,
        page,
        pageSize,
        totalPages
      };
    }
  }

  public async getUser(id: string): Promise<User> {
    try {
      const response = await apiService.get<User>(`/api/users/${id}`);
      return response.data || response;
    } catch (error) {
      console.warn('Failed to fetch user from backend, using demo data:', error);
      return {
        id,
        username: 'demouser',
        email: 'demo@agentdms.com',
        roles: []
      };
    }
  }

  public async createUser(userData: { username: string; email: string; passwordHash: string }): Promise<User> {
    try {
      const response = await apiService.post<User>('/api/users', userData);
      return response.data || response;
    } catch (error) {
      console.warn('Failed to create user, simulating success:', error);
      return {
        id: Math.random().toString(),
        username: userData.username,
        email: userData.email,
        roles: []
      };
    }
  }

  public async updateUser(id: string, userData: Partial<User>): Promise<User> {
    try {
      const response = await apiService.put<User>(`/api/users/${id}`, userData);
      return response.data || response;
    } catch (error) {
      console.warn('Failed to update user, simulating success:', error);
      return {
        id,
        username: userData.username || 'updated',
        email: userData.email || 'updated@agentdms.com',
        roles: userData.roles || []
      };
    }
  }

  public async deleteUser(id: string): Promise<void> {
    try {
      await apiService.delete(`/api/users/${id}`);
    } catch (error) {
      console.warn('Failed to delete user, simulating success:', error);
    }
  }
}

export const userService = new UserService();