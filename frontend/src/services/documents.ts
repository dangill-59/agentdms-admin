import type { Document, DocumentSearchFilters, DocumentSearchResult, DocumentMetadata, UpdateDocumentMetadataRequest, PaginatedResponse, CustomField } from '../types/api';
import { apiService } from './api';
import { projectService } from './projects';

// Define DocumentDto to match backend response
interface DocumentDto {
  id: string;
  projectId: string;
  fileName: string;
  storagePath: string;
  mimeType?: string;
  fileSize: number;
  createdAt: string;
  modifiedAt: string;
  // Dynamic custom field values from backend
  customFieldValues: Record<string, string>;
}

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
  private readonly basePath = '/Documents';

  // Document CRUD operations
  public async getDocuments(page = 1, pageSize = 10): Promise<PaginatedResponse<Document>> {
    try {
      // Use real API for documents
      const response = await apiService.get<PaginatedResponse<Document>>(`${this.basePath}?page=${page}&pageSize=${pageSize}`);
      return response.data || response;
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      throw error;
    }
  }

  public async getDocument(id: string): Promise<Document> {
    try {
      const response = await apiService.get<Document>(`${this.basePath}/${id}`);
      return response.data || response;
    } catch (error) {
      console.error('Failed to fetch document:', error);
      throw error;
    }
  }

  public async deleteDocument(id: string): Promise<void> {
    try {
      await apiService.delete(`${this.basePath}/${id}`);
    } catch (error) {
      console.error('Failed to delete document:', error);
      throw error;
    }
  }

  // Update document metadata (including custom field values)
  public async updateDocumentCustomFields(id: string, customFieldValues: Record<string, string>): Promise<void> {
    try {
      await apiService.putDirect(`${this.basePath}/${id}/metadata`, {
        customFieldValues
      });
    } catch (error) {
      console.error('Failed to update document metadata:', error);
      throw error;
    }
  }



  // Health check before upload
  public async checkUploadHealth(): Promise<boolean> {
    try {
      const baseUrl = apiService.getBaseURL();
      const healthUrl = `${baseUrl.replace('/api', '')}/health`;
      
      // Create an AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(healthUrl, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.warn('Health check failed:', error);
      return false;
    }
  }

  // File upload operations (integrating with AgentDMS backend)
  public async uploadFile(file: File, projectId?: number, onProgress?: (progress: number) => void): Promise<UploadResponse> {
    const maxRetries = 3;
    const retryDelay = 1000; // Start with 1 second

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Upload attempt ${attempt}/${maxRetries} for file: ${file.name}`);
        return await this.attemptUpload(file, projectId, onProgress, attempt);
      } catch (error) {
        const isNetworkError = error instanceof Error && (
          error.message.includes('Network error') ||
          error.message.includes('connection') ||
          error.message.includes('timeout') ||
          error.message.includes('aborted')
        );

        if (isNetworkError && attempt < maxRetries) {
          const delay = retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
          console.warn(`Upload attempt ${attempt} failed, retrying in ${delay}ms:`, error.message);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        // If this is the last attempt or not a network error, throw the error
        console.error(`Upload failed after ${attempt} attempts:`, error);
        throw error;
      }
    }

    throw new Error('Upload failed after all retry attempts');
  }

  private async attemptUpload(file: File, projectId?: number, onProgress?: (progress: number) => void, attempt: number = 1): Promise<UploadResponse> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      
      // Add project ID if provided
      if (projectId) {
        formData.append('projectId', projectId.toString());
      }

      const xhr = new XMLHttpRequest();
      
      // Set timeout based on file size (minimum 30 seconds, add 10 seconds per MB)
      const timeoutMs = Math.max(30000, 30000 + (file.size / (1024 * 1024)) * 10000);
      xhr.timeout = timeoutMs;

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
        console.log('XHR onload - Status:', xhr.status, 'Response:', xhr.responseText);
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            console.log('Upload successful:', response);
            resolve(response);
          } catch (parseError) {
            console.error('Failed to parse response:', parseError, 'Response text:', xhr.responseText);
            reject(new Error('Failed to parse upload response'));
          }
        } else {
          console.error('Upload failed with status:', xhr.status, 'Response:', xhr.responseText);
          try {
            const errorData = JSON.parse(xhr.responseText);
            reject(new Error(errorData.error || `Upload failed: ${xhr.statusText}`));
          } catch {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        }
      };

      xhr.onerror = (event) => {
        console.error('XHR error event:', event);
        console.error('XHR ready state:', xhr.readyState);
        console.error('XHR status:', xhr.status);
        
        // Provide more specific error messages based on the state
        let errorMessage = 'Network error during upload';
        if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 0) {
          errorMessage = 'Connection failed or was blocked. Please check your network connection and try again.';
        } else if (xhr.status === 0) {
          errorMessage = 'Connection was reset or blocked. This may be due to network issues or security settings.';
        }
        
        reject(new Error(errorMessage));
      };

      xhr.onabort = () => {
        console.error('XHR request was aborted');
        reject(new Error('Upload was aborted. Please try again.'));
      };

      xhr.ontimeout = () => {
        console.error('XHR request timed out after', timeoutMs, 'ms');
        reject(new Error(`Upload timed out after ${Math.round(timeoutMs / 1000)} seconds. Please try uploading a smaller file or check your connection.`));
      };

      // Use the AgentDMS endpoint
      const baseUrl = apiService.getBaseURL();
      const uploadUrl = `${baseUrl}/imageprocessing/upload`;
      
      console.log(`[Attempt ${attempt}] Starting upload to:`, uploadUrl);
      console.log('File details:', { name: file.name, size: file.size, type: file.type });
      console.log('Project ID:', projectId);
      console.log('Timeout set to:', timeoutMs, 'ms');
      
      xhr.open('POST', uploadUrl);
      
      // Add auth token if available
      const token = apiService.getToken();
      if (token) {
        console.log('Adding authorization header');
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      } else {
        console.log('No auth token found');
      }

      // Add custom headers for debugging
      xhr.setRequestHeader('X-Upload-Attempt', attempt.toString());
      xhr.setRequestHeader('X-File-Size', file.size.toString());

      xhr.send(formData);
    });
  }

  // Job status polling (matching AgentDMS patterns)
  public async getJobStatus(jobId: string): Promise<JobStatus> {
    const response = await apiService.get<JobStatus>(`/imageprocessing/job/${jobId}/status`);
    // Handle both wrapped (response.data) and unwrapped (response) responses
    return response.data || response;
  }

  public async getJobResult(jobId: string): Promise<ProcessingResult> {
    const response = await apiService.get<ProcessingResult>(`/imageprocessing/job/${jobId}/result`);
    // Handle both wrapped (response.data) and unwrapped (response) responses
    return response.data || response;
  }

  // Poll for job completion with proper error handling
  public async pollJobCompletion(jobId: string, maxAttempts = 120, intervalMs = 2000): Promise<ProcessingResult> {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const status = await this.getJobStatus(jobId);
        
        // Validate job status response
        if (!status || typeof status.status !== 'string') {
          throw new Error('Job status unavailable or invalid response from server');
        }
        
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
    // Return common file types - in production this could come from an API endpoint
    return ['pdf', 'jpg', 'jpeg', 'png', 'tiff', 'tif', 'bmp', 'gif', 'txt', 'doc', 'docx'];
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

  // Get document preview with authentication - returns blob URL
  public async getDocumentPreview(documentId: string): Promise<string> {
    const response = await fetch(`${apiService.getBaseURL()}${this.basePath}/${documentId}/preview`, {
      headers: {
        'Authorization': `Bearer ${apiService.getToken()}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Preview failed: ${response.status} ${response.statusText}`);
    }
    
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }

  // Get document thumbnail with authentication - returns blob URL
  public async getDocumentThumbnail(documentId: string): Promise<string> {
    const response = await fetch(`${apiService.getBaseURL()}${this.basePath}/${documentId}/thumbnail`, {
      headers: {
        'Authorization': `Bearer ${apiService.getToken()}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Thumbnail failed: ${response.status} ${response.statusText}`);
    }
    
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }

  // Legacy URL methods (deprecated - use getDocumentPreview/getDocumentThumbnail instead)
  public getDocumentPreviewUrl(documentId: string): string {
    return `${apiService.getBaseURL()}${this.basePath}/${documentId}/preview`;
  }

  public getDocumentThumbnailUrl(documentId: string): string {
    return `${apiService.getBaseURL()}${this.basePath}/${documentId}/thumbnail`;
  }

  // Document search functionality
  public async searchDocuments(filters: DocumentSearchFilters, page = 1, pageSize = 10): Promise<PaginatedResponse<DocumentSearchResult>> {
    try {
      // Use real API - no demo mode check needed
      const responseData = await apiService.postDirect<PaginatedResponse<DocumentDto>>(`${this.basePath}/search`, 
        { ...filters, page, pageSize }
      );
      
      // Convert DocumentDto to DocumentSearchResult
      const searchResults: DocumentSearchResult[] = (responseData.data || []).map((doc: DocumentDto) => ({
        id: doc.id,
        projectId: doc.projectId,
        fileName: doc.fileName,
        createdAt: doc.createdAt,
        modifiedAt: doc.modifiedAt,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType || '',
        customFieldValues: doc.customFieldValues || {}
      }));
      
      return {
        data: searchResults,
        totalCount: responseData.totalCount || 0,
        page: responseData.page || page,
        pageSize: responseData.pageSize || pageSize,
        totalPages: responseData.totalPages || 0
      };
    } catch (error) {
      console.error('Failed to search documents:', error);
      throw error;
    }
  }

  // Get document metadata for editing with custom fields support
  public async getDocumentMetadata(documentId: string): Promise<DocumentMetadata> {
    try {
      // Use real API only - no demo mode
      const response = await apiService.get<DocumentMetadata>(`${this.basePath}/${documentId}/metadata`);
      return response.data || response;
    } catch (error) {
      console.error('Failed to fetch document metadata:', error);
      throw error;
    }
  }

  // Get project custom fields for document metadata
  public async getProjectCustomFields(projectId: string): Promise<CustomField[]> {
    try {
      // Use project service to get custom fields
      return await projectService.getProjectCustomFields(projectId);
    } catch (error) {
      console.error('Failed to fetch project custom fields:', error);
      
      // Return empty array as fallback
      return [];
    }
  }

  // Update document metadata
  public async updateDocumentMetadata(documentId: string, metadata: Partial<DocumentMetadata>): Promise<DocumentMetadata> {
    try {
      // Transform DocumentMetadata to UpdateDocumentMetadataRequest format
      const updateRequest: UpdateDocumentMetadataRequest = {
        customFieldValues: metadata.customFieldValues || {}
      };

      // Use real API only - no demo mode
      const response = await apiService.put<DocumentMetadata>(`${this.basePath}/${documentId}/metadata`, updateRequest);
      return response.data || response;
    } catch (error) {
      console.error('Failed to update document metadata:', error);
      throw error;
    }
  }

  // Get allowed field values for current user
  public async getAllowedFieldValues(customFieldId: string): Promise<string[]> {
    try {
      const response = await apiService.get<string[]>(`${this.basePath}/fields/${customFieldId}/allowed-values`);
      return response.data || response;
    } catch (error) {
      console.warn('Failed to fetch allowed field values, returning empty array:', error);
      return [];
    }
  }


}

export const documentService = new DocumentService();