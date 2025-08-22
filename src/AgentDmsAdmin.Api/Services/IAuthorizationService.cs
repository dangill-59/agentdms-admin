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
}