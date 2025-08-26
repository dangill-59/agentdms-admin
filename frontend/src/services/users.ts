import type { User } from '../types/auth';
import type { PaginatedResponse } from '../types/api';
import { apiService } from './api';

export class UserService {
  public async getUsers(page = 1, pageSize = 10): Promise<PaginatedResponse<User>> {
    const response = await apiService.get<PaginatedResponse<User>>(`/users?page=${page}&pageSize=${pageSize}`);
    return response.data || response;
  }

  public async getUser(id: string): Promise<User> {
    const response = await apiService.get<User>(`/users/${id}`);
    return response.data || response;
  }

  public async createUser(userData: { username: string; email: string; passwordHash: string; roleIds?: string[] }): Promise<User> {
    const response = await apiService.post<User>('/users', userData);
    return response.data || response;
  }

  public async updateUser(id: string, userData: Partial<User> & { roleIds?: string[] }): Promise<User> {
    const response = await apiService.put<User>(`/users/${id}`, userData);
    return response.data || response;
  }

  public async deleteUser(id: string): Promise<void> {
    await apiService.delete(`/users/${id}`);
  }

  public async changeUserPassword(id: string, newPassword: string): Promise<void> {
    await apiService.post(`/users/${id}/change-password`, { newPassword });
  }
}

export const userService = new UserService();