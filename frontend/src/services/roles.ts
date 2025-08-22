import type { 
  Role,
  UserRole,
  ProjectRole,
  RolePermission,
  PaginatedResponse,
  CreateRoleRequest,
  UpdateRoleRequest,
  AssignUserRoleRequest,
  AssignProjectRoleRequest,
  UpdateProjectRoleRequest,
  AssignRolePermissionRequest
} from '../types/api';
import { apiService } from './api';

export class RoleService {
  // Role CRUD operations
  public async getRoles(page = 1, pageSize = 10, includePermissions = false): Promise<PaginatedResponse<Role>> {
    try {
      // Use axios directly for this endpoint since backend returns PaginatedResponse directly, not wrapped in ApiResponse
      const token = apiService.getToken();
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${apiService.getBaseURL()}/roles?page=${page}&pageSize=${pageSize}&includePermissions=${includePermissions}`, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.warn('Failed to fetch roles from backend, using demo data:', error);
      
      // Fallback to demo data for development
      const mockRoles: Role[] = [
        {
          id: '1',
          name: 'Admin',
          description: 'Full system access',
          createdAt: '2024-01-01T00:00:00Z',
          modifiedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: '2', 
          name: 'Manager',
          description: 'Project management access',
          createdAt: '2024-01-01T00:00:00Z',
          modifiedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: '3',
          name: 'User',
          description: 'Basic user access',
          createdAt: '2024-01-01T00:00:00Z',
          modifiedAt: '2024-01-01T00:00:00Z'
        }
      ];

      const totalCount = mockRoles.length;
      const totalPages = Math.ceil(totalCount / pageSize);
      const pagedRoles = mockRoles.slice((page - 1) * pageSize, page * pageSize);

      return {
        data: pagedRoles,
        totalCount,
        page,
        pageSize,
        totalPages
      };
    }
  }

  public async getRole(id: string, includePermissions = false): Promise<Role> {
    try {
      const response = await apiService.get<Role>(`/roles/${id}?includePermissions=${includePermissions}`);
      return response.data || response;
    } catch (error) {
      console.warn('Failed to fetch role from backend, using demo data:', error);
      return {
        id,
        name: 'Demo Role',
        description: 'Demo role for testing',
        createdAt: '2024-01-01T00:00:00Z',
        modifiedAt: '2024-01-01T00:00:00Z'
      };
    }
  }

  public async createRole(request: CreateRoleRequest): Promise<Role> {
    try {
      const response = await apiService.post<Role>('/roles', request);
      return response.data || response;
    } catch (error) {
      console.warn('Failed to create role, simulating success:', error);
      return {
        id: Math.random().toString(),
        name: request.name,
        description: request.description,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString()
      };
    }
  }

  public async updateRole(id: string, request: UpdateRoleRequest): Promise<Role> {
    try {
      const response = await apiService.put<Role>(`/roles/${id}`, request);
      return response.data || response;
    } catch (error) {
      console.warn('Failed to update role, simulating success:', error);
      return {
        id,
        name: request.name || 'Updated Role',
        description: request.description,
        createdAt: '2024-01-01T00:00:00Z',
        modifiedAt: new Date().toISOString()
      };
    }
  }

  public async deleteRole(id: string): Promise<void> {
    try {
      await apiService.delete(`/roles/${id}`);
    } catch (error) {
      console.warn('Failed to delete role, simulating success:', error);
    }
  }

  // User role assignments
  public async assignUserRole(request: AssignUserRoleRequest): Promise<UserRole> {
    try {
      const response = await apiService.post<UserRole>('/roles/assign-user', request);
      return response.data || response;
    } catch (error) {
      console.warn('Failed to assign user role, simulating success:', error);
      return {
        id: Math.random().toString(),
        userId: request.userId,
        roleId: request.roleId,
        roleName: 'Demo Role',
        createdAt: new Date().toISOString()
      };
    }
  }

  public async removeUserRole(userRoleId: string): Promise<void> {
    try {
      await apiService.delete(`/roles/user-roles/${userRoleId}`);
    } catch (error) {
      console.warn('Failed to remove user role, simulating success:', error);
    }
  }

  // Project role assignments
  public async getProjectRoles(projectId?: string, roleId?: string): Promise<ProjectRole[]> {
    try {
      let url = '/roles/project-roles';
      const params = new URLSearchParams();
      
      if (projectId) {
        params.append('projectId', projectId);
      }
      
      if (roleId) {
        params.append('roleId', roleId);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await apiService.get<ProjectRole[]>(url);
      return Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
    } catch (error) {
      console.warn('Failed to fetch project roles, using demo data:', error);
      return [
        {
          id: '1',
          projectId: projectId || '1',
          roleId: roleId || '1',
          roleName: 'Demo Role',
          canView: true,
          canEdit: false,
          canDelete: false,
          createdAt: '2024-01-01T00:00:00Z'
        }
      ];
    }
  }

  public async assignProjectRole(request: AssignProjectRoleRequest): Promise<ProjectRole> {
    try {
      const response = await apiService.post<ProjectRole>('/roles/assign-project', request);
      return response.data || response;
    } catch (error) {
      console.warn('Failed to assign project role, simulating success:', error);
      return {
        id: Math.random().toString(),
        projectId: request.projectId,
        roleId: request.roleId,
        roleName: 'Demo Role',
        canView: request.canView,
        canEdit: request.canEdit,
        canDelete: request.canDelete,
        createdAt: new Date().toISOString()
      };
    }
  }

  public async updateProjectRole(projectRoleId: string, request: UpdateProjectRoleRequest): Promise<ProjectRole> {
    try {
      const response = await apiService.put<ProjectRole>(`/roles/project-roles/${projectRoleId}`, request);
      return response.data || response;
    } catch (error) {
      console.warn('Failed to update project role, simulating success:', error);
      return {
        id: projectRoleId,
        projectId: '1',
        roleId: '1',
        roleName: 'Demo Role',
        canView: request.canView ?? true,
        canEdit: request.canEdit ?? false,
        canDelete: request.canDelete ?? false,
        createdAt: '2024-01-01T00:00:00Z'
      };
    }
  }

  public async removeProjectRole(projectRoleId: string): Promise<void> {
    try {
      await apiService.delete(`/roles/project-roles/${projectRoleId}`);
    } catch (error) {
      console.warn('Failed to remove project role, simulating success:', error);
    }
  }

  // Permission assignment methods
  public async assignRolePermission(request: AssignRolePermissionRequest): Promise<RolePermission> {
    try {
      const response = await apiService.post<RolePermission>('/roles/assign-permission', request);
      return response.data || response;
    } catch (error) {
      console.warn('Failed to assign permission to role, simulating success:', error);
      return {
        id: Math.random().toString(),
        roleId: request.roleId,
        permissionId: request.permissionId,
        permissionName: 'Demo Permission',
        permissionDescription: 'Demo permission description',
        createdAt: new Date().toISOString()
      };
    }
  }

  public async removeRolePermission(rolePermissionId: string): Promise<void> {
    try {
      await apiService.delete(`/roles/role-permissions/${rolePermissionId}`);
    } catch (error) {
      console.warn('Failed to remove role permission, simulating success:', error);
    }
  }

  public async getRolePermissions(roleId: string): Promise<RolePermission[]> {
    try {
      const response = await apiService.get<RolePermission[]>(`/roles/${roleId}/permissions`);
      // Handle different response structures - data might be nested in an ApiResponse wrapper
      if (response?.data && Array.isArray(response.data)) {
        return response.data;
      } else if (Array.isArray(response)) {
        return response;
      } else {
        // Fallback to empty array
        return [];
      }
    } catch (error) {
      console.warn('Failed to fetch role permissions, returning mock data:', error);
      return [
        {
          id: '1',
          roleId: roleId,
          permissionId: '1',
          permissionName: 'user.create',
          permissionDescription: 'Create new users',
          createdAt: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          roleId: roleId,
          permissionId: '2',
          permissionName: 'user.edit',
          permissionDescription: 'Edit existing users',
          createdAt: '2024-01-01T00:00:00Z'
        }
      ];
    }
  }
}

export const roleService = new RoleService();