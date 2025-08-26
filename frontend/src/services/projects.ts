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
  // Projects CRUD operations
  public async getProjects(page = 1, pageSize = 10, includeArchived = false): Promise<PaginatedResponse<Project>> {
    // Use direct method since backend returns data directly, not wrapped in ApiResponse
    const response = await apiService.getDirect<PaginatedResponse<Project>>(`/projects?page=${page}&pageSize=${pageSize}&includeArchived=${includeArchived}`);
    return response;
  }

  public async getProject(id: string): Promise<Project> {
    const response = await apiService.getDirect<Project>(`/projects/${id}`);
    return response;
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