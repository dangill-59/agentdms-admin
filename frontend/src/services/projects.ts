import type { 
  Project, 
  Document, 
  CustomField, 
  PaginatedResponse, 
  CreateProjectRequest,
  UpdateProjectRequest,
  CreateCustomFieldRequest,
  UpdateCustomFieldRequest 
} from '../types/api';
import config from '../utils/config';
import { apiService } from './api';

export class ProjectService {
  // Projects CRUD operations
  public async getProjects(page = 1, pageSize = 10, includeArchived = false): Promise<PaginatedResponse<Project>> {
    try {
      // Use direct method since backend returns data directly, not wrapped in ApiResponse
      const response = await apiService.getDirect<PaginatedResponse<Project>>(`/projects?page=${page}&pageSize=${pageSize}&includeArchived=${includeArchived}`);
      return response;
    } catch (error) {
      console.warn('Failed to fetch projects from backend:', error);
      
      // Only fall back to demo data if demo mode is enabled
      if (!config.get('enableDemoMode')) {
        throw error;
      }
      
      // Fallback to demo data for development
      const mockProjects: Project[] = [
        {
          id: '1',
          name: 'Sample Project 1',
          description: 'A sample project for testing',
          fileName: 'DefaultFilename',
          createdAt: '2024-01-01T00:00:00Z',
          modifiedAt: '2024-01-01T00:00:00Z',
          isActive: true,
          isArchived: false,
          projectRoles: [
            {
              id: '1',
              projectId: '1',
              roleId: '1',
              roleName: 'Admin',
              canView: true,
              canEdit: true,
              canDelete: true,
              createdAt: '2024-01-01T00:00:00Z'
            },
            {
              id: '2',
              projectId: '1',
              roleId: '2',
              roleName: 'Manager',
              canView: true,
              canEdit: true,
              canDelete: false,
              createdAt: '2024-01-01T00:00:00Z'
            }
          ]
        },
        {
          id: '2',
          name: 'Document Management System',
          description: 'Main DMS project',
          fileName: 'DefaultFilename',
          createdAt: '2024-01-02T00:00:00Z',
          modifiedAt: '2024-01-02T00:00:00Z',
          isActive: true,
          isArchived: false,
          projectRoles: [
            {
              id: '3',
              projectId: '2',
              roleId: '1',
              roleName: 'Admin',
              canView: true,
              canEdit: true,
              canDelete: true,
              createdAt: '2024-01-01T00:00:00Z'
            }
          ]
        },
        {
          id: '3',
          name: 'AP Project',
          description: 'Accounts Payable project with view-only access for dan user',
          fileName: 'ap-project.dms',
          createdAt: '2024-01-03T00:00:00Z',
          modifiedAt: '2024-01-03T00:00:00Z',
          isActive: true,
          isArchived: false,
          projectRoles: [
            {
              id: '4',
              projectId: '3',
              roleId: '1',
              roleName: 'Admin',
              canView: true,
              canEdit: true,
              canDelete: true,
              createdAt: '2024-01-01T00:00:00Z'
            },
            {
              id: '5',
              projectId: '3',
              roleId: '2',
              roleName: 'User',
              canView: true,
              canEdit: false,
              canDelete: false,
              createdAt: '2024-01-01T00:00:00Z'
            }
          ]
        }
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      return {
        data: mockProjects,
        totalCount: mockProjects.length,
        page,
        pageSize,
        totalPages: Math.ceil(mockProjects.length / pageSize)
      };
    }
  }

  public async getProject(id: string): Promise<Project> {
    try {
      const response = await apiService.getDirect<Project>(`/projects/${id}`);
      return response;
    } catch (error) {
      console.warn('Failed to fetch project from backend:', error);
      
      // Only fall back to demo data if demo mode is enabled
      if (!config.get('enableDemoMode')) {
        throw error;
      }
      
      // Fallback to demo data for development
      const mockProjects = [
        {
          id: '1',
          name: 'Sample Project 1',
          description: 'A sample project for testing',
          fileName: 'DefaultFilename',
          createdAt: '2024-01-01T00:00:00Z',
          modifiedAt: '2024-01-01T00:00:00Z',
          isActive: true,
          isArchived: false,
          projectRoles: [
            {
              id: '1',
              projectId: '1',
              roleId: '1',
              roleName: 'Admin',
              canView: true,
              canEdit: true,
              canDelete: true,
              createdAt: '2024-01-01T00:00:00Z'
            },
            {
              id: '2',
              projectId: '1',
              roleId: '2',
              roleName: 'Manager',
              canView: true,
              canEdit: true,
              canDelete: false,
              createdAt: '2024-01-01T00:00:00Z'
            }
          ]
        },
        {
          id: '2',
          name: 'Document Management System',
          description: 'Main DMS project',
          fileName: 'DefaultFilename',
          createdAt: '2024-01-02T00:00:00Z',
          modifiedAt: '2024-01-02T00:00:00Z',
          isActive: true,
          isArchived: false,
          projectRoles: [
            {
              id: '3',
              projectId: '2',
              roleId: '1',
              roleName: 'Admin',
              canView: true,
              canEdit: true,
              canDelete: true,
              createdAt: '2024-01-01T00:00:00Z'
            }
          ]
        },
        {
          id: '3',
          name: 'AP Project',
          description: 'Accounts Payable project with view-only access for dan user',
          fileName: 'ap-project.dms',
          createdAt: '2024-01-03T00:00:00Z',
          modifiedAt: '2024-01-03T00:00:00Z',
          isActive: true,
          isArchived: false,
          projectRoles: [
            {
              id: '4',
              projectId: '3',
              roleId: '1',
              roleName: 'Admin',
              canView: true,
              canEdit: true,
              canDelete: true,
              createdAt: '2024-01-01T00:00:00Z'
            },
            {
              id: '5',
              projectId: '3',
              roleId: '2',
              roleName: 'User',
              canView: true,
              canEdit: false,
              canDelete: false,
              createdAt: '2024-01-01T00:00:00Z'
            }
          ]
        }
      ];

      // Find the project by ID
      const project = mockProjects.find(p => p.id === id);
      if (!project) {
        throw new Error(`Project with ID ${id} not found`);
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      return project;
    }
  }

  public async createProject(request: CreateProjectRequest): Promise<Project> {
    const response = await apiService.postDirect<Project>('/projects', request);
    return response;
  }

  public async updateProject(id: string, request: UpdateProjectRequest): Promise<Project> {
    const response = await apiService.putDirect<Project>(`/projects/${id}`, request);
    return response;
  }

  public async deleteProject(id: string, hardDelete = false): Promise<void> {
    await apiService.deleteDirect(`/projects/${id}?hardDelete=${hardDelete}`);
  }

  public async archiveProject(id: string, isArchived: boolean): Promise<Project> {
    const response = await apiService.putDirect<Project>(`/projects/${id}/archive`, { isArchived });
    return response;
  }

  public async cloneProject(id: string): Promise<Project> {
    const response = await apiService.postDirect<Project>(`/projects/${id}/clone`);
    return response;
  }

  // Project documents
  public async getProjectDocuments(projectId: string): Promise<Document[]> {
    const response = await apiService.getDirect<Document[]>(`/projects/${projectId}/documents`);
    return response;
  }

  // Project custom fields
  public async getProjectCustomFields(projectId: string): Promise<CustomField[]> {
    const response = await apiService.getDirect<CustomField[]>(`/projects/${projectId}/custom-fields`);
    return response;
  }

  public async createCustomField(projectId: string, request: CreateCustomFieldRequest): Promise<CustomField> {
    const response = await apiService.postDirect<CustomField>(`/projects/${projectId}/custom-fields`, request);
    return response;
  }

  public async updateCustomField(projectId: string, fieldId: string, request: UpdateCustomFieldRequest): Promise<CustomField> {
    const response = await apiService.putDirect<CustomField>(`/projects/${projectId}/custom-fields/${fieldId}`, request);
    return response;
  }

  public async deleteCustomField(projectId: string, fieldId: string): Promise<void> {
    await apiService.deleteDirect(`/projects/${projectId}/custom-fields/${fieldId}`);
  }
}

export const projectService = new ProjectService();