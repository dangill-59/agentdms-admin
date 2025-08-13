// API Response types
export interface ApiResponse<T = unknown> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Project types (based on backend entities)
export interface Project {
  id: string;
  name: string;
  description?: string;
  fileName: string;
  createdAt: string;
  modifiedAt: string;
}

export interface CustomField {
  id: string;
  projectId: string;
  name: string;
  fieldType: 'Text' | 'Number' | 'Date' | 'Boolean' | 'LongText';
  isRequired: boolean;
  isDefault: boolean;
  createdAt: string;
  modifiedAt: string;
}

export interface Document {
  id: string;
  projectId: string;
  fileName: string;
  storagePath: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
  modifiedAt: string;
}