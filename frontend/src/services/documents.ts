import type { Document, DocumentSearchFilters, DocumentSearchResult, DocumentMetadata, PaginatedResponse } from '../types/api';
import { apiService } from './api';
import config from '../utils/config';

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
          } catch {
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
    // Use configuration service instead of API call to avoid 404 error
    // The supported file types are already configured in the config service
    return config.get('supportedFileTypes');
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

  // Document search functionality (mocked for development)
  public async searchDocuments(filters: DocumentSearchFilters, page = 1, pageSize = 10): Promise<PaginatedResponse<DocumentSearchResult>> {
    try {
      // TODO: Replace with actual backend API call
      // const response = await apiService.post<PaginatedResponse<DocumentSearchResult>>('/documents/search', { filters, page, pageSize });
      // return response.data;
      
      // Mock data for development - matches the expected search results format
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      
      const mockResults: DocumentSearchResult[] = [
        {
          id: '1',
          projectId: filters.projectId || '1',
          fileName: 'Invoice_ABC123.pdf',
          customerName: 'ABC Company Inc.',
          invoiceNumber: 'INV-2024-001',
          invoiceDate: '2024-01-15',
          docType: 'Invoice',
          status: 'Processed',
          createdAt: '2024-01-15T10:30:00Z',
          modifiedAt: '2024-01-15T10:30:00Z',
          fileSize: 245760,
          mimeType: 'application/pdf'
        },
        {
          id: '2',
          projectId: filters.projectId || '1',
          fileName: 'Receipt_XYZ789.jpg',
          customerName: 'XYZ Corporation',
          invoiceNumber: 'RCP-2024-002',
          invoiceDate: '2024-01-20',
          docType: 'Receipt',
          status: 'Pending Review',
          createdAt: '2024-01-20T14:15:00Z',
          modifiedAt: '2024-01-20T14:15:00Z',
          fileSize: 1048576,
          mimeType: 'image/jpeg'
        },
        {
          id: '3',
          projectId: filters.projectId || '1',
          fileName: 'PO_DEF456.pdf',
          customerName: 'DEF Industries Ltd.',
          invoiceNumber: 'PO-2024-003',
          invoiceDate: '2024-01-25',
          docType: 'Purchase Order',
          status: 'Approved',
          createdAt: '2024-01-25T09:45:00Z',
          modifiedAt: '2024-01-25T16:20:00Z',
          fileSize: 512000,
          mimeType: 'application/pdf'
        },
        {
          id: '4',
          projectId: filters.projectId || '1',
          fileName: 'Estimate_GHI789.pdf',
          customerName: 'GHI Services',
          invoiceNumber: 'EST-2024-004',
          invoiceDate: '2024-02-01',
          docType: 'Estimate',
          status: 'Draft',
          createdAt: '2024-02-01T11:00:00Z',
          modifiedAt: '2024-02-01T11:00:00Z',
          fileSize: 320000,
          mimeType: 'application/pdf'
        }
      ];

      // Apply filters
      let filteredResults = mockResults;
      
      if (filters.invoiceNumber) {
        filteredResults = filteredResults.filter(doc => 
          doc.invoiceNumber.toLowerCase().includes(filters.invoiceNumber!.toLowerCase())
        );
      }
      
      if (filters.customerName) {
        filteredResults = filteredResults.filter(doc => 
          doc.customerName.toLowerCase().includes(filters.customerName!.toLowerCase())
        );
      }
      
      if (filters.docType) {
        filteredResults = filteredResults.filter(doc => 
          doc.docType.toLowerCase().includes(filters.docType!.toLowerCase())
        );
      }

      // Simulate pagination
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedResults = filteredResults.slice(startIndex, endIndex);

      return {
        data: paginatedResults,
        totalCount: filteredResults.length,
        page,
        pageSize,
        totalPages: Math.ceil(filteredResults.length / pageSize)
      };
    } catch (error) {
      console.error('Failed to search documents:', error);
      return {
        data: [],
        totalCount: 0,
        page,
        pageSize,
        totalPages: 0
      };
    }
  }

  // Get document metadata for editing
  public async getDocumentMetadata(documentId: string): Promise<DocumentMetadata> {
    try {
      // TODO: Replace with actual backend API call
      // const response = await apiService.get<DocumentMetadata>(`${this.basePath}/${documentId}/metadata`);
      // return response.data;
      
      // Mock data for development
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const mockMetadata: DocumentMetadata = {
        id: documentId,
        customerName: 'ABC Company Inc.',
        invoiceNumber: 'INV-2024-001',
        invoiceDate: '2024-01-15',
        docType: 'Invoice',
        status: 'Processed',
        notes: 'Payment terms: Net 30 days'
      };
      
      return mockMetadata;
    } catch (error) {
      console.error('Failed to fetch document metadata:', error);
      throw error;
    }
  }

  // Update document metadata
  public async updateDocumentMetadata(documentId: string, metadata: Partial<DocumentMetadata>): Promise<DocumentMetadata> {
    try {
      // TODO: Replace with actual backend API call
      // const response = await apiService.put<DocumentMetadata>(`${this.basePath}/${documentId}/metadata`, metadata);
      // return response.data;
      
      // Mock implementation for development
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const currentMetadata = await this.getDocumentMetadata(documentId);
      const updatedMetadata = { ...currentMetadata, ...metadata };
      
      return updatedMetadata;
    } catch (error) {
      console.error('Failed to update document metadata:', error);
      throw error;
    }
  }

  // Get available document types for filtering
  public getDocumentTypes(): string[] {
    return ['Invoice', 'Receipt', 'Purchase Order', 'Estimate', 'Credit Note', 'Statement'];
  }

  // Get available status options
  public getStatusOptions(): string[] {
    return ['Draft', 'Pending Review', 'Processed', 'Approved', 'Rejected'];
  }
}

export const documentService = new DocumentService();