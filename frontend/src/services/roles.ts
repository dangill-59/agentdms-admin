import type { Role, RolePermission, CreateRoleRequest, UpdateRoleRequest, PaginatedResponse } from '../types/api';
import { apiService } from './api';

export class RoleService {
  
  public async getRoles(page = 1, pageSize = 10, includePermissions = false): Promise<PaginatedResponse<Role>> {
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
  }

  public async getRole(id: string, includePermissions = false): Promise<Role> {
    const response = await apiService.get<Role>(`/roles/${id}?includePermissions=${includePermissions}`);
    return response.data || response;
  }

  public async createRole(request: CreateRoleRequest): Promise<Role> {
    const response = await apiService.post<Role>('/roles', request);
    return response.data || response;
  }

  public async updateRole(id: string, request: UpdateRoleRequest): Promise<Role> {
    const response = await apiService.put<Role>(`/roles/${id}`, request);
    return response.data || response;
  }

  public async deleteRole(id: string): Promise<void> {
    await apiService.delete(`/roles/${id}`);
  }

  // Project role management
  public async getProjectRoles(projectId: string): Promise<any[]> {
    const response = await apiService.get<any[]>(`/projects/${projectId}/roles`);
    return response.data || response;
  }

  public async updateProjectRole(projectId: string, roleId: string, permissions: any): Promise<any> {
    const response = await apiService.put<any>(`/projects/${projectId}/roles/${roleId}`, permissions);
    return response.data || response;
  }

  public async assignProjectRole(assignment: any): Promise<any> {
    const response = await apiService.post<any>('/project-roles', assignment);
    return response.data || response;
  }

  public async removeProjectRole(projectRoleId: string): Promise<void> {
    await apiService.delete(`/project-roles/${projectRoleId}`);
  }

  // Role permissions
  public async getRolePermissions(roleId: string): Promise<RolePermission[]> {
    const response = await apiService.get<RolePermission[]>(`/roles/${roleId}/permissions`);
    return response.data || response;
  }

  public async assignPermissionToRole(roleId: string, permissionId: string): Promise<void> {
    await apiService.post(`/roles/${roleId}/permissions/${permissionId}`, {});
  }

  public async removePermissionFromRole(roleId: string, permissionId: string): Promise<void> {
    await apiService.delete(`/roles/${roleId}/permissions/${permissionId}`);
  }

  public async assignRolePermission(assignment: { roleId: string; permissionId: string }): Promise<RolePermission> {
    const response = await apiService.post<RolePermission>('/role-permissions', assignment);
    return response.data || response;
  }

  public async removeRolePermission(rolePermissionId: string): Promise<void> {
    await apiService.delete(`/role-permissions/${rolePermissionId}`);
  }

  public async updateRolePermissions(roleId: string, permissionIds: string[]): Promise<void> {
    await apiService.put(`/roles/${roleId}/permissions`, { permissionIds });
  }
}

export const roleService = new RoleService();