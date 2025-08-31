using AgentDmsAdmin.Api.Models;

namespace AgentDmsAdmin.Api.Services;

/// <summary>
/// Service for checking user permissions and authorization
/// </summary>
public interface IAuthorizationService
{
    /// <summary>
    /// Checks if the current user has the specified permission
    /// </summary>
    /// <param name="permissionName">Name of the permission to check</param>
    /// <returns>True if user has permission, false otherwise</returns>
    Task<bool> HasPermissionAsync(string permissionName);
    
    /// <summary>
    /// Checks if the specified user has the given permission
    /// </summary>
    /// <param name="userId">ID of the user to check</param>
    /// <param name="permissionName">Name of the permission to check</param>
    /// <returns>True if user has permission, false otherwise</returns>
    Task<bool> UserHasPermissionAsync(int userId, string permissionName);
    
    /// <summary>
    /// Gets the current user from the HTTP context
    /// </summary>
    /// <returns>Current user DTO or null if not authenticated</returns>
    UserDto? GetCurrentUser();
    
    /// <summary>
    /// Checks if the current user has the specified role
    /// </summary>
    /// <param name="roleName">Name of the role to check</param>
    /// <returns>True if user has role, false otherwise</returns>
    Task<bool> HasRoleAsync(string roleName);
    
    /// <summary>
    /// Gets project-specific permissions for a user using proper role-based intersection logic
    /// </summary>
    /// <param name="userId">ID of the user</param>
    /// <param name="projectId">ID of the project</param>
    /// <returns>Project permissions for the user</returns>
    Task<ProjectPermissions> GetUserProjectPermissionsAsync(int userId, int projectId);
}