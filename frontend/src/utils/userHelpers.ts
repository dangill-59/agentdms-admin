import type { User } from '../types/auth';

/**
 * Get the display name for a user
 */
export function getUserDisplayName(user: User | null): string {
  if (!user) return 'Unknown User';
  return user.username || user.email || 'Unknown User';
}

/**
 * Get the primary role name for a user (first role)
 */
export function getUserPrimaryRole(user: User | null): string {
  if (!user || !user.roles || user.roles.length === 0) return 'User';
  return user.roles[0].roleName;
}

/**
 * Check if user has a specific role
 */
export function userHasRole(user: User | null, roleName: string): boolean {
  if (!user || !user.roles) return false;
  return user.roles.some(role => role.roleName === roleName);
}

/**
 * Check if user has admin role
 */
export function userIsAdmin(user: User | null): boolean {
  return userHasRole(user, 'Admin') || userHasRole(user, 'Administrator') || userHasRole(user, 'Super Admin');
}

/**
 * Check if user has manager role
 */
export function userIsManager(user: User | null): boolean {
  return userHasRole(user, 'Manager');
}

/**
 * Get role color class for styling
 */
export function getRoleColor(roleName: string): string {
  switch (roleName.toLowerCase()) {
    case 'admin':
    case 'administrator':
    case 'super admin':
      return 'bg-red-100 text-red-800';
    case 'manager':
      return 'bg-yellow-100 text-yellow-800';
    case 'user':
    default:
      return 'bg-green-100 text-green-800';
  }
}

/**
 * Get role icon for display
 */
export function getRoleIcon(roleName: string): string {
  switch (roleName.toLowerCase()) {
    case 'admin':
    case 'administrator':
    case 'super admin':
      return '👑';
    case 'manager':
      return '🏢';
    case 'user':
    default:
      return '👤';
  }
}

/**
 * Check if user can access a navigation item based on roles
 */
export function canAccessNavItem(user: User | null, requiredRoles: string[]): boolean {
  if (!user || !user.roles) return false;
  if (requiredRoles.length === 0) return true;
  
  return user.roles.some(role => requiredRoles.includes(role.roleName));
}

/**
 * Check if user has a specific permission
 */
export function userHasPermission(user: User | null, permission: string): boolean {
  if (!user || !user.permissions) return false;
  return user.permissions.includes(permission);
}

/**
 * Check if user has any of the specified permissions
 */
export function userHasAnyPermission(user: User | null, permissions: string[]): boolean {
  if (!user || !user.permissions || permissions.length === 0) return false;
  return permissions.some(permission => user.permissions.includes(permission));
}

/**
 * Check if user has all of the specified permissions
 */
export function userHasAllPermissions(user: User | null, permissions: string[]): boolean {
  if (!user || !user.permissions || permissions.length === 0) return false;
  return permissions.every(permission => user.permissions.includes(permission));
}

/**
 * Check if user can access a feature based on required permissions
 */
export function canAccessFeature(user: User | null, requiredPermissions: string[]): boolean {
  if (!user || !user.permissions) return false;
  if (requiredPermissions.length === 0) return true;
  
  return userHasAnyPermission(user, requiredPermissions);
}

/**
 * Check if user can edit documents
 */
export function canEditDocuments(user: User | null): boolean {
  return userHasPermission(user, 'document.edit');
}

/**
 * Check if user can delete documents
 */
export function canDeleteDocuments(user: User | null): boolean {
  return userHasPermission(user, 'document.delete');
}

/**
 * Check if user can manage projects (requires admin permission)
 */
export function canManageProjects(user: User | null): boolean {
  return userHasPermission(user, 'workspace.admin');
}

/**
 * Check if user can access settings (requires admin permission)
 */
export function canAccessSettings(user: User | null): boolean {
  return userHasPermission(user, 'workspace.admin');
}