import type { Document, PaginatedResponse } from '../types/api';
import { apiService } from './api';

// Job status types (matching AgentDMS backend)
export interface JobStatus {
  jobId: string;
  status: 'Queued' | 'Processing' | 'Completed' | 'Failed';
  createdAt: string;
  errorMessage?: string;
}

export interface UploadResponse {
  jobId: string;
  fileName: string;
  fileSize: number;
  message: string;
  status: string;
}

export interface ProcessingResult {
  success: boolean;
  jobId: string;
  processedImage?: {
    fileName: string;
    storagePath: string;
    convertedPngPath?: string;
    thumbnailPath?: string;
    width: number;
    height: number;
    fileSize: number;
    originalFormat: string;
    mimeType: string;
    isMultiPage: boolean;
    pageCount?: number;
  };
  splitPages?: Array<{
    convertedPngPath?: string;
    thumbnailPath?: string;
  }>;
  processingTime?: string;
  message?: string;
}

export class DocumentService {
  private readonly basePath = '/documents';

  // Document CRUD operations
  public async getDocuments(page = 1, pageSize = 10): Promise<PaginatedResponse<Document>> {
    try {
      const response = await apiService.get<PaginatedResponse<Document>>(`${this.basePath}?page=${page}&pageSize=${pageSize}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      // Return empty result for now - in real implementation this would throw
      return {
        data: [],
        totalCount: 0,
        page,
        pageSize,
        totalPages: 0
      };
    }
  }

  public async getDocument(id: string): Promise<Document> {
    const response = await apiService.get<Document>(`${this.basePath}/${id}`);
    return response.data;
  }

  public async deleteDocument(id: string): Promise<void> {
    await apiService.delete(`${this.basePath}/${id}`);
  }

  // File upload operations (integrating with AgentDMS backend)
  public async uploadFile(file: File, onProgress?: (progress: number) => void): Promise<UploadResponse> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();

      // Track upload progress
      if (onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            onProgress(progress);
          }
        };
      }

      // Handle completion
      xhr.onload = () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('Failed to parse upload response'));
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText);
            reject(new Error(errorData.error || `Upload failed: ${xhr.statusText}`));
          } catch {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error during upload'));
      };

      // Use the AgentDMS endpoint
      const baseUrl = apiService.getBaseURL();
      xhr.open('POST', `${baseUrl}/imageprocessing/upload`);
      
      // Add auth token if available
      const token = apiService.getToken();
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.send(formData);
    });
  }

  // Job status polling (matching AgentDMS patterns)
  public async getJobStatus(jobId: string): Promise<JobStatus> {
    const response = await apiService.get<JobStatus>(`/imageprocessing/job/${jobId}/status`);
    return response.data;
  }

  public async getJobResult(jobId: string): Promise<ProcessingResult> {
    const response = await apiService.get<ProcessingResult>(`/imageprocessing/job/${jobId}/result`);
    return response.data;
  }

  // Poll for job completion with proper error handling
  public async pollJobCompletion(jobId: string, maxAttempts = 120, intervalMs = 2000): Promise<ProcessingResult> {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const status = await this.getJobStatus(jobId);
        
        if (status.status === 'Completed') {
          // Job completed successfully, get the result
          const result = await this.getJobResult(jobId);
          return result;
        } else if (status.status === 'Failed') {
          throw new Error(status.errorMessage || 'Job failed');
        }
        
        // Job is still processing, continue polling
        // Progress updates are handled via SignalR in the component
        
        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, intervalMs));
        attempts++;
        
      } catch (error) {
        console.error('Error polling job status:', error);
        
        // If it's the last attempt, throw the error
        if (attempts >= maxAttempts - 1) {
          throw error;
        }
        
        // Otherwise, wait and retry
        await new Promise(resolve => setTimeout(resolve, intervalMs));
        attempts++;
      }
    }
    
    throw new Error('Job polling timed out');
  }

  // Get supported file formats
  public async getSupportedFormats(): Promise<string[]> {
    try {
      const response = await apiService.get<string[]>('/imageprocessing/formats');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch supported formats:', error);
      // Return default formats matching AgentDMS backend
      return ['.jpg', '.jpeg', '.png', '.bmp', '.gif', '.tif', '.tiff', '.pdf', '.webp'];
    }
  }

  // Download document file
  public async downloadDocument(documentId: string): Promise<Blob> {
    const response = await fetch(`${apiService.getBaseURL()}${this.basePath}/${documentId}/download`, {
      headers: {
        'Authorization': `Bearer ${apiService.getToken()}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Download failed');
    }
    
    return await response.blob();
  }

  // Get document preview/thumbnail
  public getDocumentPreviewUrl(documentId: string): string {
    return `${apiService.getBaseURL()}${this.basePath}/${documentId}/preview`;
  }

  public getDocumentThumbnailUrl(documentId: string): string {
    return `${apiService.getBaseURL()}${this.basePath}/${documentId}/thumbnail`;
  }
}

export const documentService = new DocumentService();