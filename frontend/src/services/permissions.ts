import { apiService } from './api';
import type {
  Permission,
  PaginatedResponse,
  CreatePermissionRequest,
  UpdatePermissionRequest
} from '../types/api';

export class PermissionService {
  // Permission CRUD operations
  public async getPermissions(page = 1, pageSize = 10): Promise<PaginatedResponse<Permission>> {
    try {
      const response = await apiService.get<PaginatedResponse<Permission>>(`/permissions?page=${page}&pageSize=${pageSize}`);
      // Handle different response structures - data might be nested in an ApiResponse wrapper
      if (response?.data && typeof response.data === 'object' && 'data' in response.data) {
        // Response is wrapped in ApiResponse structure
        return response.data as PaginatedResponse<Permission>;
      } else if (response?.data && Array.isArray(response.data)) {
        // Response data is directly an array
        return {
          data: response.data,
          totalCount: response.data.length,
          page: page,
          pageSize: pageSize,
          totalPages: Math.ceil(response.data.length / pageSize)
        };
      } else if (Array.isArray(response)) {
        // Response is directly an array
        return {
          data: response,
          totalCount: response.length,
          page: page,
          pageSize: pageSize,
          totalPages: Math.ceil(response.length / pageSize)
        };
      } else {
        // Fallback to empty result
        return { data: [], totalCount: 0, page, pageSize, totalPages: 0 };
      }
    } catch (error) {
      console.warn('Failed to fetch permissions, returning mock data:', error);
      // Return mock data for development
      return {
        data: [
          {
            id: '1',
            name: 'user.create',
            description: 'Create new users',
            createdAt: '2024-01-01T00:00:00Z',
            modifiedAt: '2024-01-01T00:00:00Z'
          },
          {
            id: '2',
            name: 'user.edit',
            description: 'Edit existing users',
            createdAt: '2024-01-01T00:00:00Z',
            modifiedAt: '2024-01-01T00:00:00Z'
          },
          {
            id: '3',
            name: 'user.delete',
            description: 'Delete users',
            createdAt: '2024-01-01T00:00:00Z',
            modifiedAt: '2024-01-01T00:00:00Z'
          },
          {
            id: '4',
            name: 'project.create',
            description: 'Create new projects',
            createdAt: '2024-01-01T00:00:00Z',
            modifiedAt: '2024-01-01T00:00:00Z'
          },
          {
            id: '5',
            name: 'project.edit',
            description: 'Edit existing projects',
            createdAt: '2024-01-01T00:00:00Z',
            modifiedAt: '2024-01-01T00:00:00Z'
          },
          {
            id: '6',
            name: 'project.delete',
            description: 'Delete projects',
            createdAt: '2024-01-01T00:00:00Z',
            modifiedAt: '2024-01-01T00:00:00Z'
          }
        ],
        totalCount: 6,
        page: page,
        pageSize: pageSize,
        totalPages: 1
      };
    }
  }

  public async getPermission(id: string): Promise<Permission> {
    try {
      const response = await apiService.get<Permission>(`/permissions/${id}`);
      return response.data || response;
    } catch (error) {
      console.warn('Failed to fetch permission, returning mock data:', error);
      return {
        id: id,
        name: 'mock.permission',
        description: 'Mock permission for development',
        createdAt: '2024-01-01T00:00:00Z',
        modifiedAt: '2024-01-01T00:00:00Z'
      };
    }
  }

  public async createPermission(request: CreatePermissionRequest): Promise<Permission> {
    try {
      const response = await apiService.post<Permission>('/permissions', request);
      return response.data || response;
    } catch (error) {
      console.warn('Failed to create permission, returning mock data:', error);
      return {
        id: Math.random().toString(),
        name: request.name,
        description: request.description,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString()
      };
    }
  }

  public async updatePermission(id: string, request: UpdatePermissionRequest): Promise<Permission> {
    try {
      const response = await apiService.put<Permission>(`/permissions/${id}`, request);
      return response.data || response;
    } catch (error) {
      console.warn('Failed to update permission, returning mock data:', error);
      return {
        id: id,
        name: request.name || 'updated.permission',
        description: request.description,
        createdAt: '2024-01-01T00:00:00Z',
        modifiedAt: new Date().toISOString()
      };
    }
  }

  public async deletePermission(id: string): Promise<void> {
    try {
      await apiService.delete(`/permissions/${id}`);
    } catch (error) {
      console.warn('Failed to delete permission, simulating success:', error);
    }
  }
}

export const permissionService = new PermissionService();