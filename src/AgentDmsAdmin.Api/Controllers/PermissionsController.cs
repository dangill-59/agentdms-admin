using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AgentDmsAdmin.Api.Models;
using AgentDmsAdmin.Data.Data;
using AgentDmsAdmin.Data.Models;

namespace AgentDmsAdmin.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PermissionsController : ControllerBase
{
    private readonly AgentDmsContext _context;
    private readonly ILogger<PermissionsController> _logger;

    public PermissionsController(AgentDmsContext context, ILogger<PermissionsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<PaginatedResponse<PermissionDto>>> GetPermissions([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        try
        {
            var totalCount = await _context.Permissions.CountAsync();
            
            var permissions = await _context.Permissions
                .OrderByDescending(p => p.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(p => new PermissionDto
                {
                    Id = p.Id.ToString(),
                    Name = p.Name,
                    Description = p.Description,
                    CreatedAt = p.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    ModifiedAt = p.ModifiedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
                })
                .ToListAsync();

            var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

            var response = new PaginatedResponse<PermissionDto>
            {
                Data = permissions,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = totalPages
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while fetching permissions");
            return StatusCode(500, "An error occurred while processing your request");
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<PermissionDto>> GetPermission(int id)
    {
        try
        {
            var permission = await _context.Permissions.FindAsync(id);
            if (permission == null)
            {
                return NotFound($"Permission with ID {id} not found.");
            }

            var permissionDto = new PermissionDto
            {
                Id = permission.Id.ToString(),
                Name = permission.Name,
                Description = permission.Description,
                CreatedAt = permission.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                ModifiedAt = permission.ModifiedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
            };

            return Ok(permissionDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while fetching permission with ID {PermissionId}", id);
            return StatusCode(500, "An error occurred while processing your request");
        }
    }

    [HttpPost]
    public async Task<ActionResult<PermissionDto>> CreatePermission([FromBody] CreatePermissionRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return BadRequest("Permission name is required.");
            }

            // Check if permission with same name already exists
            var existingPermission = await _context.Permissions.FirstOrDefaultAsync(p => p.Name == request.Name);
            if (existingPermission != null)
            {
                return BadRequest($"Permission with name '{request.Name}' already exists.");
            }

            var permission = new Permission
            {
                Name = request.Name,
                Description = request.Description
            };

            _context.Permissions.Add(permission);
            await _context.SaveChangesAsync();

            var permissionDto = new PermissionDto
            {
                Id = permission.Id.ToString(),
                Name = permission.Name,
                Description = permission.Description,
                CreatedAt = permission.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                ModifiedAt = permission.ModifiedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
            };

            return CreatedAtAction(nameof(GetPermission), new { id = permission.Id }, permissionDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while creating permission");
            return StatusCode(500, "An error occurred while processing your request");
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<PermissionDto>> UpdatePermission(int id, [FromBody] UpdatePermissionRequest request)
    {
        try
        {
            var permission = await _context.Permissions.FindAsync(id);
            if (permission == null)
            {
                return NotFound($"Permission with ID {id} not found.");
            }

            if (!string.IsNullOrWhiteSpace(request.Name))
            {
                // Check if new name conflicts with existing permission
                var existingPermission = await _context.Permissions.FirstOrDefaultAsync(p => p.Name == request.Name && p.Id != id);
                if (existingPermission != null)
                {
                    return BadRequest($"Permission with name '{request.Name}' already exists.");
                }
                permission.Name = request.Name;
            }

            if (request.Description != null)
            {
                permission.Description = request.Description;
            }

            await _context.SaveChangesAsync();

            var permissionDto = new PermissionDto
            {
                Id = permission.Id.ToString(),
                Name = permission.Name,
                Description = permission.Description,
                CreatedAt = permission.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                ModifiedAt = permission.ModifiedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
            };

            return Ok(permissionDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while updating permission with ID {PermissionId}", id);
            return StatusCode(500, "An error occurred while processing your request");
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeletePermission(int id)
    {
        try
        {
            var permission = await _context.Permissions.FindAsync(id);
            if (permission == null)
            {
                return NotFound($"Permission with ID {id} not found.");
            }

            _context.Permissions.Remove(permission);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while deleting permission with ID {PermissionId}", id);
            return StatusCode(500, "An error occurred while processing your request");
        }
    }
}