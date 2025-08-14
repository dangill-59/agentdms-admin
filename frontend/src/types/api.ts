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
  fieldType: 'Text' | 'Number' | 'Date' | 'Boolean' | 'LongText' | 'Currency' | 'UserList';
  isRequired: boolean;
  isDefault: boolean;
  defaultValue?: string;
  order: number;
  roleVisibility?: string;
  userListOptions?: string;
  isRemovable: boolean;
  createdAt: string;
  modifiedAt: string;
  description?: string;
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

// Request types
export interface CreateProjectRequest {
  name: string;
  description?: string;
  fileName?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  fileName?: string;
}

export interface CreateCustomFieldRequest {
  name: string;
  description?: string;
  fieldType: string;
  isRequired: boolean;
  defaultValue?: string;
  order: number;
  roleVisibility?: string;
  userListOptions?: string;
}

export interface UpdateCustomFieldRequest {
  name?: string;
  description?: string;
  fieldType?: string;
  isRequired?: boolean;
  defaultValue?: string;
  order?: number;
  roleVisibility?: string;
  userListOptions?: string;
}