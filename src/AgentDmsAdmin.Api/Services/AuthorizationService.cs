using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using AgentDmsAdmin.Api.Models;
using AgentDmsAdmin.Api.Services;
using AgentDmsAdmin.Data.Data;

namespace AgentDmsAdmin.Api.Services;

/// <summary>
/// Service for checking user permissions and authorization
/// </summary>
public class AuthorizationService : IAuthorizationService
{
    private readonly AgentDmsContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IJwtService _jwtService;

    public AuthorizationService(
        AgentDmsContext context, 
        IHttpContextAccessor httpContextAccessor,
        IJwtService jwtService)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
        _jwtService = jwtService;
    }

    /// <summary>
    /// Checks if the current user has the specified permission
    /// </summary>
    public async Task<bool> HasPermissionAsync(string permissionName)
    {
        var currentUser = GetCurrentUser();
        if (currentUser == null)
        {
            Console.WriteLine($"[AUTH DEBUG] No current user found for permission check: {permissionName}");
            return false;
        }

        if (!int.TryParse(currentUser.Id, out var userId))
        {
            Console.WriteLine($"[AUTH DEBUG] Invalid user ID '{currentUser.Id}' for permission check: {permissionName}");
            return false;
        }

        var hasPermission = await UserHasPermissionAsync(userId, permissionName);
        
        if (!hasPermission)
        {
            Console.WriteLine($"[AUTH DEBUG] User {currentUser.Username} (ID: {userId}) lacks permission: {permissionName}");
            
            // Log user's current permissions for debugging
            var userPermissions = await _context.Users
                .Where(u => u.Id == userId)
                .SelectMany(u => u.UserRoles)
                .SelectMany(ur => ur.Role.RolePermissions)
                .Select(rp => rp.Permission.Name)
                .ToListAsync();
            
            Console.WriteLine($"[AUTH DEBUG] User {currentUser.Username} has permissions: [{string.Join(", ", userPermissions)}]");
        }

        return hasPermission;
    }

    /// <summary>
    /// Checks if the specified user has the given permission
    /// </summary>
    public async Task<bool> UserHasPermissionAsync(int userId, string permissionName)
    {
        // Special case for hardcoded superadmin user (ID 0) - grant all permissions
        if (userId == 0)
        {
            return true;
        }

        // Note: Removed hardcoded special case for user ID 3 as it was incorrectly granting 
        // all permissions to gill.dan2 user who should have limited permissions

        var hasPermission = await _context.Users
            .Where(u => u.Id == userId)
            .SelectMany(u => u.UserRoles)
            .SelectMany(ur => ur.Role.RolePermissions)
            .AnyAsync(rp => rp.Permission.Name == permissionName);

        return hasPermission;
    }

    /// <summary>
    /// Checks if a user has the specified project permissions using intersection logic.
    /// User must have the permission through ALL their roles assigned to the project.
    /// </summary>
    public async Task<ProjectPermissions> GetUserProjectPermissionsAsync(int userId, int projectId)
    {
        // Special case for superadmin user (ID 0) - grant all permissions
        if (userId == 0)
        {
            return new ProjectPermissions { CanView = true, CanEdit = true, CanDelete = true };
        }

        // Get user's roles
        var userRoleIds = await _context.UserRoles
            .Where(ur => ur.UserId == userId)
            .Select(ur => ur.RoleId)
            .ToListAsync();

        if (!userRoleIds.Any())
        {
            // User has no roles, no permissions
            return new ProjectPermissions { CanView = false, CanEdit = false, CanDelete = false };
        }

        // Get project roles for this user's roles
        var projectRoles = await _context.ProjectRoles
            .Where(pr => pr.ProjectId == projectId && userRoleIds.Contains(pr.RoleId))
            .ToListAsync();

        if (!projectRoles.Any())
        {
            // No roles assigned to this project for this user
            return new ProjectPermissions { CanView = false, CanEdit = false, CanDelete = false };
        }

        // Use intersection logic: user can only do what ALL their assigned roles allow
        var canView = projectRoles.All(pr => pr.CanView);
        var canEdit = projectRoles.All(pr => pr.CanEdit);  
        var canDelete = projectRoles.All(pr => pr.CanDelete);

        return new ProjectPermissions 
        { 
            CanView = canView, 
            CanEdit = canEdit, 
            CanDelete = canDelete 
        };
    }

    /// <summary>
    /// Gets the current user from the HTTP context
    /// </summary>
    public UserDto? GetCurrentUser()
    {
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext == null)
        {
            return null;
        }

        // Try to get from Authorization header
        var authHeader = httpContext.Request.Headers["Authorization"].FirstOrDefault();
        if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer "))
        {
            var token = authHeader.Substring("Bearer ".Length).Trim();
            return _jwtService.ValidateToken(token);
        }

        return null;
    }

    /// <summary>
    /// Checks if the current user has the specified role
    /// </summary>
    public async Task<bool> HasRoleAsync(string roleName)
    {
        var currentUser = GetCurrentUser();
        if (currentUser == null)
        {
            return false;
        }

        if (!int.TryParse(currentUser.Id, out var userId))
        {
            return false;
        }

        var hasRole = await _context.Users
            .Where(u => u.Id == userId)
            .SelectMany(u => u.UserRoles)
            .AnyAsync(ur => ur.Role.Name == roleName);

        return hasRole;
    }
}