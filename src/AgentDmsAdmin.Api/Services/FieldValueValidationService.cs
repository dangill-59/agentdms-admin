using AgentDmsAdmin.Data.Data;
using AgentDmsAdmin.Data.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace AgentDmsAdmin.Api.Services;

public interface IFieldValueValidationService
{
    Task<(bool IsValid, string? ErrorMessage)> ValidateFieldValueAsync(int userId, int customFieldId, string value);
    Task<List<string>> GetAllowedValuesAsync(int userId, int customFieldId);
}

public class FieldValueValidationService : IFieldValueValidationService
{
    private readonly AgentDmsContext _context;
    private readonly ILogger<FieldValueValidationService> _logger;

    public FieldValueValidationService(AgentDmsContext context, ILogger<FieldValueValidationService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<(bool IsValid, string? ErrorMessage)> ValidateFieldValueAsync(int userId, int customFieldId, string value)
    {
        try
        {
            // Get user's roles for this project
            var userRoles = await GetUserRolesForFieldAsync(userId, customFieldId);

            if (!userRoles.Any())
            {
                // User has no roles, allow by default (should be caught by other authorization)
                return (true, null);
            }

            // Get field restrictions for user's roles
            var restrictions = await _context.RoleFieldValueRestrictions
                .Where(r => userRoles.Contains(r.RoleId) && r.CustomFieldId == customFieldId)
                .ToListAsync();

            if (!restrictions.Any())
            {
                // No restrictions, allow the value
                return (true, null);
            }

            // Check each restriction
            foreach (var restriction in restrictions)
            {
                var allowedValues = JsonSerializer.Deserialize<List<string>>(restriction.Values) ?? new List<string>();
                
                if (restriction.IsAllowList)
                {
                    // This is an allow list - value must be in the list
                    if (!allowedValues.Contains(value, StringComparer.OrdinalIgnoreCase))
                    {
                        var role = await _context.Roles.FindAsync(restriction.RoleId);
                        return (false, $"Value '{value}' is not allowed for your role '{role?.Name}'. Allowed values: {string.Join(", ", allowedValues)}");
                    }
                }
                else
                {
                    // This is a deny list - value must not be in the list
                    if (allowedValues.Contains(value, StringComparer.OrdinalIgnoreCase))
                    {
                        var role = await _context.Roles.FindAsync(restriction.RoleId);
                        return (false, $"Value '{value}' is restricted for your role '{role?.Name}'.");
                    }
                }
            }

            return (true, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating field value for user {UserId}, field {CustomFieldId}, value {Value}", userId, customFieldId, value);
            return (false, "An error occurred while validating the field value.");
        }
    }

    public async Task<List<string>> GetAllowedValuesAsync(int userId, int customFieldId)
    {
        try
        {
            // Get user's roles for this project
            var userRoles = await GetUserRolesForFieldAsync(userId, customFieldId);

            if (!userRoles.Any())
            {
                // User has no roles, return empty list
                return new List<string>();
            }

            // Get field restrictions for user's roles
            var restrictions = await _context.RoleFieldValueRestrictions
                .Where(r => userRoles.Contains(r.RoleId) && r.CustomFieldId == customFieldId)
                .ToListAsync();

            if (!restrictions.Any())
            {
                // No restrictions, could return all possible values but that's complex to determine
                // Return empty list to indicate no restrictions
                return new List<string>();
            }

            var allowedValues = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var restrictedValues = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (var restriction in restrictions)
            {
                var values = JsonSerializer.Deserialize<List<string>>(restriction.Values) ?? new List<string>();
                
                if (restriction.IsAllowList)
                {
                    // Add to allowed values
                    foreach (var value in values)
                    {
                        allowedValues.Add(value);
                    }
                }
                else
                {
                    // Add to restricted values
                    foreach (var value in values)
                    {
                        restrictedValues.Add(value);
                    }
                }
            }

            // If there are allow lists, only return those values (minus any restricted ones)
            if (restrictions.Any(r => r.IsAllowList))
            {
                return allowedValues.Except(restrictedValues, StringComparer.OrdinalIgnoreCase).ToList();
            }

            // If only deny lists, we can't determine all possible values easily
            // Return empty list to indicate restrictions exist but allowed values are open-ended
            return new List<string>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting allowed values for user {UserId}, field {CustomFieldId}", userId, customFieldId);
            return new List<string>();
        }
    }

    private async Task<List<int>> GetUserRolesForFieldAsync(int userId, int customFieldId)
    {
        // Get the project for this field
        var customField = await _context.CustomFields.FindAsync(customFieldId);
        if (customField == null)
        {
            return new List<int>();
        }

        // Get user's roles for this project
        var userProjectRoles = await _context.ProjectRoles
            .Include(pr => pr.Role)
            .Where(pr => pr.ProjectId == customField.ProjectId)
            .Join(_context.UserRoles,
                pr => pr.RoleId,
                ur => ur.RoleId,
                (pr, ur) => new { pr.RoleId, ur.UserId })
            .Where(x => x.UserId == userId)
            .Select(x => x.RoleId)
            .ToListAsync();

        return userProjectRoles;
    }
}