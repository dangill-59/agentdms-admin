import { useAuth } from './useAuth';

/**
 * Hook to check if the current user has administrative permissions
 * @returns boolean indicating if user is an administrator or super admin
 */
export const useHasAdminPermission = (): boolean => {
  const { user } = useAuth();
  
  if (!user || !user.roles) {
    return false;
  }
  
  // Check if user has Administrator or Super Admin role
  return user.roles.some(role => 
    role.roleName === 'Administrator' || 
    role.roleName === 'Super Admin'
  );
};

/**
 * Hook to check if the current user has a specific role
 * @param roleName - The name of the role to check for
 * @returns boolean indicating if user has the specified role
 */
export const useHasRole = (roleName: string): boolean => {
  const { user } = useAuth();
  
  if (!user || !user.roles) {
    return false;
  }
  
  return user.roles.some(role => role.roleName === roleName);
};