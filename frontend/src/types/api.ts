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

// Role types
export interface Role {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  modifiedAt: string;
  permissions?: Permission[];
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  modifiedAt: string;
}

export interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  permissionName: string;
  permissionDescription?: string;
  createdAt: string;
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  roleName: string;
  createdAt: string;
}

export interface ProjectRole {
  id: string;
  projectId: string;
  roleId: string;
  roleName: string;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  createdAt: string;
}

// Project types (based on backend entities)
export interface Project {
  id: string;
  name: string;
  description?: string;
  fileName: string;
  createdAt: string;
  modifiedAt: string;
  modifiedBy?: string;
  isActive: boolean;
  isArchived: boolean;
  projectRoles: ProjectRole[];
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
  // Dynamic custom field values
  customFieldValues: Record<string, string>;
  // Legacy fields for backward compatibility
  customerName?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  docType?: string;
  status?: string;
}

// Document search types
export interface DocumentSearchFilters {
  projectId?: string;
  dateFrom?: string;
  dateTo?: string;
  // Dynamic custom field filters
  customFieldFilters: Record<string, string>;
  // Legacy filters for backward compatibility  
  invoiceNumber?: string;
  customerName?: string;
  docType?: string;
  status?: string;
}

export interface DocumentSearchResult {
  id: string;
  projectId: string;
  fileName: string;
  createdAt: string;
  modifiedAt: string;
  fileSize: number;
  mimeType: string;
  // Dynamic custom field values
  customFieldValues: Record<string, string>;
  // Legacy fields for backward compatibility  
  customerName: string;
  invoiceNumber: string;
  invoiceDate: string;
  docType: string;
  status: string;
}

export interface DocumentMetadata {
  id: string;
  // Dynamic custom field values
  customFieldValues: Record<string, string>;
  // Legacy fields for backward compatibility
  customerName: string;
  invoiceNumber: string;
  invoiceDate: string;
  docType: string;
  status: string;
  notes?: string;
  // Dynamic custom fields support - includes field definitions with values
  customFields?: DocumentCustomFieldValue[];
}

export interface DocumentCustomFieldValue {
  fieldId: string;
  fieldName: string;
  fieldType: 'Text' | 'Number' | 'Date' | 'Boolean' | 'LongText' | 'Currency' | 'UserList';
  value: string | null;
  isRequired: boolean;
  isReadonly?: boolean;
  userListOptions?: string;
}

// Request types
export interface CreateProjectRequest {
  name: string;
  description?: string;
  fileName?: string;
  roleAssignments?: CreateProjectRoleAssignment[];
}

export interface CreateProjectRoleAssignment {
  roleId: string;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  fileName?: string;
  roleAssignments?: CreateProjectRoleAssignment[];
}

export interface ArchiveProjectRequest {
  isArchived: boolean;
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

// Role request types
export interface CreateRoleRequest {
  name: string;
  description?: string;
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
}

export interface AssignUserRoleRequest {
  userId: string;
  roleId: string;
}

export interface AssignProjectRoleRequest {
  projectId: string;
  roleId: string;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface UpdateProjectRoleRequest {
  canView?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

// Permission request types
export interface CreatePermissionRequest {
  name: string;
  description?: string;
}

export interface UpdatePermissionRequest {
  name?: string;
  description?: string;
}

export interface AssignRolePermissionRequest {
  roleId: string;
  permissionId: string;
}