using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using AgentDmsAdmin.Api.Services;

namespace AgentDmsAdmin.Api.Attributes;

/// <summary>
/// Authorization attribute that requires the user to have a specific permission
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class RequirePermissionAttribute : Attribute, IAsyncAuthorizationFilter
{
    private readonly string _permissionName;

    /// <summary>
    /// Initializes a new instance of the RequirePermissionAttribute
    /// </summary>
    /// <param name="permissionName">The permission name required to access the endpoint</param>
    public RequirePermissionAttribute(string permissionName)
    {
        _permissionName = permissionName;
    }

    /// <summary>
    /// Called to check authorization
    /// </summary>
    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        var authorizationService = context.HttpContext.RequestServices
            .GetService<IAuthorizationService>();

        if (authorizationService == null)
        {
            context.Result = new StatusCodeResult(500);
            return;
        }

        var hasPermission = await authorizationService.HasPermissionAsync(_permissionName);
        
        if (!hasPermission)
        {
            context.Result = new ObjectResult(new { error = "Access denied. Insufficient permissions." })
            {
                StatusCode = 403
            };
        }
    }
}