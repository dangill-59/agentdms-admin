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
            return false;
        }

        if (!int.TryParse(currentUser.Id, out var userId))
        {
            return false;
        }

        return await UserHasPermissionAsync(userId, permissionName);
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

        var hasPermission = await _context.Users
            .Where(u => u.Id == userId)
            .SelectMany(u => u.UserRoles)
            .SelectMany(ur => ur.Role.RolePermissions)
            .AnyAsync(rp => rp.Permission.Name == permissionName);

        return hasPermission;
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