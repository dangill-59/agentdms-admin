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
import { apiService } from './api';

export class ProjectService {
  private readonly basePath = '/projects';

  // Projects CRUD operations
  public async getProjects(page = 1, pageSize = 10): Promise<PaginatedResponse<Project>> {
    try {
      // Make direct API call since backend returns data directly
      const response = await fetch(`http://localhost:5267/api/projects?page=${page}&pageSize=${pageSize}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.warn('Failed to fetch projects from backend, using demo data:', error);
      
      // Fallback to demo data for development
      const mockProjects: Project[] = [
        {
          id: '1',
          name: 'Sample Project 1',
          description: 'A sample project for testing',
          fileName: 'DefaultFilename',
          createdAt: '2024-01-01T00:00:00Z',
          modifiedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          name: 'Document Management System',
          description: 'Main DMS project',
          fileName: 'DefaultFilename',
          createdAt: '2024-01-02T00:00:00Z',
          modifiedAt: '2024-01-02T00:00:00Z'
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
    const response = await fetch(`http://localhost:5267/api/projects/${id}`);
    return await response.json();
  }

  public async createProject(request: CreateProjectRequest): Promise<Project> {
    const response = await fetch('http://localhost:5267/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    return await response.json();
  }

  public async updateProject(id: string, request: UpdateProjectRequest): Promise<Project> {
    const response = await fetch(`http://localhost:5267/api/projects/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    return await response.json();
  }

  public async deleteProject(id: string): Promise<void> {
    await fetch(`http://localhost:5267/api/projects/${id}`, {
      method: 'DELETE',
    });
  }

  public async cloneProject(id: string): Promise<Project> {
    const response = await fetch(`http://localhost:5267/api/projects/${id}/clone`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return await response.json();
  }

  // Project documents
  public async getProjectDocuments(projectId: string): Promise<Document[]> {
    const response = await fetch(`http://localhost:5267/api/projects/${projectId}/documents`);
    return await response.json();
  }

  // Project custom fields
  public async getProjectCustomFields(projectId: string): Promise<CustomField[]> {
    const response = await fetch(`http://localhost:5267/api/projects/${projectId}/custom-fields`);
    return await response.json();
  }

  public async createCustomField(projectId: string, request: CreateCustomFieldRequest): Promise<CustomField> {
    const response = await fetch(`http://localhost:5267/api/projects/${projectId}/custom-fields`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    return await response.json();
  }

  public async updateCustomField(projectId: string, fieldId: string, request: UpdateCustomFieldRequest): Promise<CustomField> {
    const response = await fetch(`http://localhost:5267/api/projects/${projectId}/custom-fields/${fieldId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    return await response.json();
  }

  public async deleteCustomField(projectId: string, fieldId: string): Promise<void> {
    await fetch(`http://localhost:5267/api/projects/${projectId}/custom-fields/${fieldId}`, {
      method: 'DELETE',
    });
  }
}

export const projectService = new ProjectService();