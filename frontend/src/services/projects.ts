import type { Project, Document, CustomField, PaginatedResponse } from '../types/api';
import { apiService } from './api';

export class ProjectService {
  private readonly basePath = '/projects';

  // Projects CRUD operations
  public async getProjects(page = 1, pageSize = 10): Promise<PaginatedResponse<Project>> {
    // Mock data for demonstration
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

  public async getProject(id: string): Promise<Project> {
    const response = await apiService.get<Project>(`${this.basePath}/${id}`);
    return response.data;
  }

  public async createProject(project: Omit<Project, 'id' | 'createdAt' | 'modifiedAt'>): Promise<Project> {
    const response = await apiService.post<Project>(this.basePath, project);
    return response.data;
  }

  public async updateProject(id: string, project: Partial<Project>): Promise<Project> {
    const response = await apiService.put<Project>(`${this.basePath}/${id}`, project);
    return response.data;
  }

  public async deleteProject(id: string): Promise<void> {
    await apiService.delete(`${this.basePath}/${id}`);
  }

  // Project documents
  public async getProjectDocuments(projectId: string): Promise<Document[]> {
    const response = await apiService.get<Document[]>(`${this.basePath}/${projectId}/documents`);
    return response.data;
  }

  // Project custom fields
  public async getProjectCustomFields(projectId: string): Promise<CustomField[]> {
    const response = await apiService.get<CustomField[]>(`${this.basePath}/${projectId}/custom-fields`);
    return response.data;
  }
}

export const projectService = new ProjectService();