using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AgentDmsAdmin.Api.Models;
using AgentDmsAdmin.Data.Data;
using AgentDmsAdmin.Data.Models;
using AgentDmsAdmin.Api.Attributes;

namespace AgentDmsAdmin.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[RequirePermission("workspace.admin")] // All role management requires admin permission
public class RolesController : ControllerBase
{
    private readonly AgentDmsContext _context;
    private readonly ILogger<RolesController> _logger;

    public RolesController(AgentDmsContext context, ILogger<RolesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<PaginatedResponse<RoleDto>>> GetRoles([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] bool includePermissions = false)
    {
        try
        {
            // Filter out Super Admin role from the list
            var totalCount = await _context.Roles.Where(r => r.Name != "Super Admin").CountAsync();
            
            var rolesQuery = _context.Roles
                .Where(r => r.Name != "Super Admin")
                .OrderByDescending(r => r.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize);

            List<RoleDto> roles;

            if (includePermissions)
            {
                var rolesWithPermissions = await rolesQuery
                    .Include(r => r.RolePermissions)
                    .ThenInclude(rp => rp.Permission)
                    .ToListAsync();

                roles = rolesWithPermissions.Select(r => new RoleDto
                {
                    Id = r.Id.ToString(),
                    Name = r.Name,
                    Description = r.Description,
                    CreatedAt = r.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    ModifiedAt = r.ModifiedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    Permissions = r.RolePermissions.Select(rp => new PermissionDto
                    {
                        Id = rp.Permission.Id.ToString(),
                        Name = rp.Permission.Name,
                        Description = rp.Permission.Description,
                        CreatedAt = rp.Permission.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                        ModifiedAt = rp.Permission.ModifiedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
                    }).ToList()
                }).ToList();
            }
            else
            {
                roles = await rolesQuery
                    .Select(r => new RoleDto
                    {
                        Id = r.Id.ToString(),
                        Name = r.Name,
                        Description = r.Description,
                        CreatedAt = r.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                        ModifiedAt = r.ModifiedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
                    })
                    .ToListAsync();
            }

            var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

            var response = new PaginatedResponse<RoleDto>
            {
                Data = roles,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = totalPages
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting roles");
            return StatusCode(500, "An error occurred while retrieving roles");
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<RoleDto>> GetRole(int id, [FromQuery] bool includePermissions = false)
    {
        try
        {
            var role = await _context.Roles.FindAsync(id);
            
            if (role == null)
            {
                return NotFound($"Role with ID {id} not found.");
            }

            var roleDto = new RoleDto
            {
                Id = role.Id.ToString(),
                Name = role.Name,
                Description = role.Description,
                CreatedAt = role.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                ModifiedAt = role.ModifiedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
            };

            if (includePermissions)
            {
                var permissions = await _context.RolePermissions
                    .Where(rp => rp.RoleId == id)
                    .Include(rp => rp.Permission)
                    .Select(rp => new PermissionDto
                    {
                        Id = rp.Permission.Id.ToString(),
                        Name = rp.Permission.Name,
                        Description = rp.Permission.Description,
                        CreatedAt = rp.Permission.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                        ModifiedAt = rp.Permission.ModifiedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
                    })
                    .ToListAsync();

                roleDto.Permissions = permissions;
            }

            return Ok(roleDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting role {RoleId}", id);
            return StatusCode(500, "An error occurred while retrieving the role");
        }
    }

    [HttpPost]
    public async Task<ActionResult<RoleDto>> CreateRole([FromBody] CreateRoleRequest request)
    {
        try
        {
            // Check if role name already exists
            var existingRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == request.Name);
            if (existingRole != null)
            {
                return BadRequest($"Role with name '{request.Name}' already exists.");
            }

            var role = new Role
            {
                Name = request.Name,
                Description = request.Description
            };

            _context.Roles.Add(role);
            await _context.SaveChangesAsync();

            var roleDto = new RoleDto
            {
                Id = role.Id.ToString(),
                Name = role.Name,
                Description = role.Description,
                CreatedAt = role.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                ModifiedAt = role.ModifiedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
            };

            return CreatedAtAction(nameof(GetRole), new { id = role.Id }, roleDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating role");
            return StatusCode(500, "An error occurred while creating the role");
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<RoleDto>> UpdateRole(int id, [FromBody] UpdateRoleRequest request)
    {
        try
        {
            var role = await _context.Roles.FindAsync(id);
            if (role == null)
            {
                return NotFound($"Role with ID {id} not found.");
            }

            if (!string.IsNullOrWhiteSpace(request.Name))
            {
                // Check if new name conflicts with existing role
                var existingRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == request.Name && r.Id != id);
                if (existingRole != null)
                {
                    return BadRequest($"Role with name '{request.Name}' already exists.");
                }
                role.Name = request.Name;
            }

            if (request.Description != null)
            {
                role.Description = request.Description;
            }

            await _context.SaveChangesAsync();

            var roleDto = new RoleDto
            {
                Id = role.Id.ToString(),
                Name = role.Name,
                Description = role.Description,
                CreatedAt = role.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                ModifiedAt = role.ModifiedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
            };

            return Ok(roleDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating role {RoleId}", id);
            return StatusCode(500, "An error occurred while updating the role");
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteRole(int id)
    {
        try
        {
            var role = await _context.Roles.FindAsync(id);
            if (role == null)
            {
                return NotFound($"Role with ID {id} not found.");
            }

            // Check if role is assigned to any users or projects
            var hasUsers = await _context.UserRoles.AnyAsync(ur => ur.RoleId == id);
            var hasProjects = await _context.ProjectRoles.AnyAsync(pr => pr.RoleId == id);

            if (hasUsers || hasProjects)
            {
                return BadRequest("Cannot delete role that is assigned to users or projects. Remove all assignments first.");
            }

            _context.Roles.Remove(role);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting role {RoleId}", id);
            return StatusCode(500, "An error occurred while deleting the role");
        }
    }

    [HttpPost("assign-user")]
    public async Task<ActionResult<UserRoleDto>> AssignUserRole([FromBody] AssignUserRoleRequest request)
    {
        try
        {
            if (!int.TryParse(request.UserId, out var userId) || !int.TryParse(request.RoleId, out var roleId))
            {
                return BadRequest("Invalid user or role ID.");
            }

            // Check if user and role exist
            var user = await _context.Users.FindAsync(userId);
            var role = await _context.Roles.FindAsync(roleId);

            if (user == null || role == null)
            {
                return NotFound("User or role not found.");
            }

            // Check if assignment already exists
            var existingAssignment = await _context.UserRoles
                .FirstOrDefaultAsync(ur => ur.UserId == userId && ur.RoleId == roleId);

            if (existingAssignment != null)
            {
                return BadRequest("User is already assigned to this role.");
            }

            var userRole = new UserRole
            {
                UserId = userId,
                RoleId = roleId
            };

            _context.UserRoles.Add(userRole);
            await _context.SaveChangesAsync();

            var userRoleDto = new UserRoleDto
            {
                Id = userRole.Id.ToString(),
                UserId = userRole.UserId.ToString(),
                RoleId = userRole.RoleId.ToString(),
                RoleName = role.Name,
                CreatedAt = userRole.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
            };

            return Ok(userRoleDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error assigning user role");
            return StatusCode(500, "An error occurred while assigning the user role");
        }
    }

    [HttpDelete("user-roles/{userRoleId}")]
    public async Task<ActionResult> RemoveUserRole(int userRoleId)
    {
        try
        {
            var userRole = await _context.UserRoles.FindAsync(userRoleId);
            if (userRole == null)
            {
                return NotFound($"User role assignment with ID {userRoleId} not found.");
            }

            _context.UserRoles.Remove(userRole);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing user role {UserRoleId}", userRoleId);
            return StatusCode(500, "An error occurred while removing the user role");
        }
    }

    [HttpPost("assign-project")]
    public async Task<ActionResult<ProjectRoleDto>> AssignProjectRole([FromBody] AssignProjectRoleRequest request)
    {
        try
        {
            if (!int.TryParse(request.ProjectId, out var projectId) || !int.TryParse(request.RoleId, out var roleId))
            {
                return BadRequest("Invalid project or role ID.");
            }

            // Check if project and role exist
            var project = await _context.Projects.FindAsync(projectId);
            var role = await _context.Roles.FindAsync(roleId);

            if (project == null || role == null)
            {
                return NotFound("Project or role not found.");
            }

            // Check if assignment already exists
            var existingAssignment = await _context.ProjectRoles
                .FirstOrDefaultAsync(pr => pr.ProjectId == projectId && pr.RoleId == roleId);

            if (existingAssignment != null)
            {
                return BadRequest("Role is already assigned to this project.");
            }

            var projectRole = new ProjectRole
            {
                ProjectId = projectId,
                RoleId = roleId,
                CanView = request.CanView,
                CanEdit = request.CanEdit,
                CanDelete = request.CanDelete
            };

            _context.ProjectRoles.Add(projectRole);
            await _context.SaveChangesAsync();

            var projectRoleDto = new ProjectRoleDto
            {
                Id = projectRole.Id.ToString(),
                ProjectId = projectRole.ProjectId.ToString(),
                RoleId = projectRole.RoleId.ToString(),
                RoleName = role.Name,
                CanView = projectRole.CanView,
                CanEdit = projectRole.CanEdit,
                CanDelete = projectRole.CanDelete,
                CreatedAt = projectRole.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
            };

            return Ok(projectRoleDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error assigning project role");
            return StatusCode(500, "An error occurred while assigning the project role");
        }
    }

    [HttpPut("project-roles/{projectRoleId}")]
    public async Task<ActionResult<ProjectRoleDto>> UpdateProjectRole(int projectRoleId, [FromBody] UpdateProjectRoleRequest request)
    {
        try
        {
            var projectRole = await _context.ProjectRoles
                .Include(pr => pr.Role)
                .FirstOrDefaultAsync(pr => pr.Id == projectRoleId);

            if (projectRole == null)
            {
                return NotFound($"Project role assignment with ID {projectRoleId} not found.");
            }

            if (request.CanView.HasValue)
                projectRole.CanView = request.CanView.Value;
            
            if (request.CanEdit.HasValue)
                projectRole.CanEdit = request.CanEdit.Value;
            
            if (request.CanDelete.HasValue)
                projectRole.CanDelete = request.CanDelete.Value;

            await _context.SaveChangesAsync();

            var projectRoleDto = new ProjectRoleDto
            {
                Id = projectRole.Id.ToString(),
                ProjectId = projectRole.ProjectId.ToString(),
                RoleId = projectRole.RoleId.ToString(),
                RoleName = projectRole.Role.Name,
                CanView = projectRole.CanView,
                CanEdit = projectRole.CanEdit,
                CanDelete = projectRole.CanDelete,
                CreatedAt = projectRole.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
            };

            return Ok(projectRoleDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating project role {ProjectRoleId}", projectRoleId);
            return StatusCode(500, "An error occurred while updating the project role");
        }
    }

    [HttpDelete("project-roles/{projectRoleId}")]
    public async Task<ActionResult> RemoveProjectRole(int projectRoleId)
    {
        try
        {
            var projectRole = await _context.ProjectRoles.FindAsync(projectRoleId);
            if (projectRole == null)
            {
                return NotFound($"Project role assignment with ID {projectRoleId} not found.");
            }

            _context.ProjectRoles.Remove(projectRole);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing project role {ProjectRoleId}", projectRoleId);
            return StatusCode(500, "An error occurred while removing the project role");
        }
    }

    // Permission management endpoints

    [HttpPost("assign-permission")]
    public async Task<ActionResult<RolePermissionDto>> AssignRolePermission([FromBody] AssignRolePermissionRequest request)
    {
        try
        {
            if (!int.TryParse(request.RoleId, out var roleId) || !int.TryParse(request.PermissionId, out var permissionId))
            {
                return BadRequest("Invalid role or permission ID.");
            }

            // Check if role and permission exist
            var role = await _context.Roles.FindAsync(roleId);
            var permission = await _context.Permissions.FindAsync(permissionId);

            if (role == null || permission == null)
            {
                return NotFound("Role or permission not found.");
            }

            // Check if assignment already exists
            var existingAssignment = await _context.RolePermissions
                .FirstOrDefaultAsync(rp => rp.RoleId == roleId && rp.PermissionId == permissionId);

            if (existingAssignment != null)
            {
                return BadRequest("Permission is already assigned to this role.");
            }

            var rolePermission = new RolePermission
            {
                RoleId = roleId,
                PermissionId = permissionId
            };

            _context.RolePermissions.Add(rolePermission);
            await _context.SaveChangesAsync();

            var rolePermissionDto = new RolePermissionDto
            {
                Id = rolePermission.Id.ToString(),
                RoleId = rolePermission.RoleId.ToString(),
                PermissionId = rolePermission.PermissionId.ToString(),
                PermissionName = permission.Name,
                PermissionDescription = permission.Description,
                CreatedAt = rolePermission.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
            };

            return Ok(rolePermissionDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error assigning permission to role");
            return StatusCode(500, "An error occurred while assigning the permission to the role");
        }
    }

    [HttpDelete("role-permissions/{rolePermissionId}")]
    public async Task<ActionResult> RemoveRolePermission(int rolePermissionId)
    {
        try
        {
            var rolePermission = await _context.RolePermissions.FindAsync(rolePermissionId);
            if (rolePermission == null)
            {
                return NotFound($"Role permission assignment with ID {rolePermissionId} not found.");
            }

            _context.RolePermissions.Remove(rolePermission);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing role permission {RolePermissionId}", rolePermissionId);
            return StatusCode(500, "An error occurred while removing the role permission");
        }
    }

    [HttpGet("project-roles")]
    public async Task<ActionResult<List<ProjectRoleDto>>> GetProjectRoles([FromQuery] int? projectId = null, [FromQuery] int? roleId = null)
    {
        try
        {
            var query = _context.ProjectRoles
                .Include(pr => pr.Role)
                .Include(pr => pr.Project)
                .Where(pr => pr.Role.Name != "Super Admin" && pr.Role.Name != "Administrator") // Filter out Super Admin and Administrator roles
                .AsQueryable();

            if (projectId.HasValue)
            {
                query = query.Where(pr => pr.ProjectId == projectId.Value);
            }

            if (roleId.HasValue)
            {
                query = query.Where(pr => pr.RoleId == roleId.Value);
            }

            var projectRoles = await query
                .OrderByDescending(pr => pr.CreatedAt)
                .Select(pr => new ProjectRoleDto
                {
                    Id = pr.Id.ToString(),
                    ProjectId = pr.ProjectId.ToString(),
                    RoleId = pr.RoleId.ToString(),
                    RoleName = pr.Role.Name,
                    CanView = pr.CanView,
                    CanEdit = pr.CanEdit,
                    CanDelete = pr.CanDelete,
                    CreatedAt = pr.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
                })
                .ToListAsync();

            return Ok(projectRoles);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting project roles. ProjectId: {ProjectId}, RoleId: {RoleId}", projectId, roleId);
            return StatusCode(500, "An error occurred while fetching project roles");
        }
    }

    [HttpGet("{roleId}/permissions")]
    public async Task<ActionResult<List<RolePermissionDto>>> GetRolePermissions(int roleId)
    {
        try
        {
            var role = await _context.Roles.FindAsync(roleId);
            if (role == null)
            {
                return NotFound($"Role with ID {roleId} not found.");
            }

            var rolePermissions = await _context.RolePermissions
                .Where(rp => rp.RoleId == roleId)
                .Include(rp => rp.Permission)
                .Select(rp => new RolePermissionDto
                {
                    Id = rp.Id.ToString(),
                    RoleId = rp.RoleId.ToString(),
                    PermissionId = rp.PermissionId.ToString(),
                    PermissionName = rp.Permission.Name,
                    PermissionDescription = rp.Permission.Description,
                    CreatedAt = rp.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
                })
                .ToListAsync();

            return Ok(rolePermissions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting permissions for role {RoleId}", roleId);
            return StatusCode(500, "An error occurred while fetching role permissions");
        }
    }
}