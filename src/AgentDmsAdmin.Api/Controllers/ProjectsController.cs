using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using AgentDmsAdmin.Api.Models;
using AgentDmsAdmin.Data.Data;
using AgentDmsAdmin.Data.Models;
using AgentDmsAdmin.Data.Services;

namespace AgentDmsAdmin.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProjectsController : ControllerBase
{
    private readonly AgentDmsContext _context;
    private readonly DataSeeder _dataSeeder;
    private readonly ILogger<ProjectsController> _logger;

    public ProjectsController(AgentDmsContext context, DataSeeder dataSeeder, ILogger<ProjectsController> logger)
    {
        _context = context;
        _dataSeeder = dataSeeder;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<PaginatedResponse<ProjectDto>>> GetProjects([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] bool includeArchived = false)
    {
        try
        {
            var query = _context.Projects.AsQueryable();
            
            // Filter active projects by default, unless includeArchived is true
            if (!includeArchived)
            {
                query = query.Where(p => p.IsActive && !p.IsArchived);
            }
            
            var totalCount = await query.CountAsync();
            
            var projects = await query
                .Include(p => p.ProjectRoles)
                .ThenInclude(pr => pr.Role)
                .OrderByDescending(p => p.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(p => new ProjectDto
                {
                    Id = p.Id.ToString(),
                    Name = p.Name,
                    Description = p.Description,
                    FileName = p.FileName,
                    CreatedAt = p.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    ModifiedAt = p.ModifiedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    ModifiedBy = p.ModifiedBy,
                    IsActive = p.IsActive,
                    IsArchived = p.IsArchived,
                    ProjectRoles = p.ProjectRoles.Select(pr => new ProjectRoleDto
                    {
                        Id = pr.Id.ToString(),
                        ProjectId = pr.ProjectId.ToString(),
                        RoleId = pr.RoleId.ToString(),
                        RoleName = pr.Role.Name,
                        CanView = pr.CanView,
                        CanEdit = pr.CanEdit,
                        CanDelete = pr.CanDelete,
                        CreatedAt = pr.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
                    }).ToList()
                })
                .ToListAsync();

            var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

            var response = new PaginatedResponse<ProjectDto>
            {
                Data = projects,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = totalPages
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to retrieve projects from database, falling back to demo data");
            // Fallback to demo data for development
            var projects = new List<ProjectDto>
            {
                new ProjectDto
                {
                    Id = "1",
                    Name = "Sample Project 1",
                    Description = "A sample project for testing",
                    FileName = "DefaultFilename",
                    CreatedAt = "2024-01-01T00:00:00Z",
                    ModifiedAt = "2024-01-01T00:00:00Z",
                    IsActive = true,
                    IsArchived = false
                },
                new ProjectDto
                {
                    Id = "2",
                    Name = "Document Management System",
                    Description = "Main DMS project",
                    FileName = "DefaultFilename",
                    CreatedAt = "2024-01-02T00:00:00Z",
                    ModifiedAt = "2024-01-02T00:00:00Z",
                    IsActive = true,
                    IsArchived = false
                },
                new ProjectDto
                {
                    Id = "3",
                    Name = "Enterprise Project",
                    Description = "Large scale enterprise system",
                    FileName = "DefaultFilename",
                    CreatedAt = "2024-01-03T00:00:00Z",
                    ModifiedAt = "2024-01-03T00:00:00Z",
                    IsActive = true,
                    IsArchived = false
                }
            };

            var totalCount = projects.Count;
            var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);
            var pagedProjects = projects
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            var response = new PaginatedResponse<ProjectDto>
            {
                Data = pagedProjects,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = totalPages
            };

            return Ok(response);
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProjectDto>> GetProject(int id)
    {
        try
        {
            var project = await _context.Projects
                .Include(p => p.ProjectRoles)
                .ThenInclude(pr => pr.Role)
                .FirstOrDefaultAsync(p => p.Id == id);
            
            if (project == null)
            {
                return NotFound($"Project with ID {id} not found.");
            }

            var projectDto = new ProjectDto
            {
                Id = project.Id.ToString(),
                Name = project.Name,
                Description = project.Description,
                FileName = project.FileName,
                CreatedAt = project.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                ModifiedAt = project.ModifiedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                ModifiedBy = project.ModifiedBy,
                IsActive = project.IsActive,
                IsArchived = project.IsArchived,
                ProjectRoles = project.ProjectRoles.Select(pr => new ProjectRoleDto
                {
                    Id = pr.Id.ToString(),
                    ProjectId = pr.ProjectId.ToString(),
                    RoleId = pr.RoleId.ToString(),
                    RoleName = pr.Role.Name,
                    CanView = pr.CanView,
                    CanEdit = pr.CanEdit,
                    CanDelete = pr.CanDelete,
                    CreatedAt = pr.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
                }).ToList()
            };

            return Ok(projectDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving project with ID {ProjectId}", id);
            return StatusCode(500, $"Error retrieving project: {ex.Message}");
        }
    }

    [HttpPost]
    public async Task<ActionResult<ProjectDto>> CreateProject([FromBody] CreateProjectRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest("Project name is required.");
        }

        try
        {
            var project = new Project
            {
                Name = request.Name,
                Description = request.Description,
                FileName = request.FileName ?? "DefaultFilename"
            };

            _context.Projects.Add(project);
            await _context.SaveChangesAsync();

            // Create default fields for the new project
            await _dataSeeder.CreateDefaultFieldsForProjectAsync(project.Id);

            // Handle role assignments if provided
            if (request.RoleAssignments != null && request.RoleAssignments.Any())
            {
                foreach (var roleAssignment in request.RoleAssignments)
                {
                    if (!int.TryParse(roleAssignment.RoleId, out var roleId))
                    {
                        _logger.LogWarning("Invalid role ID: {RoleId}", roleAssignment.RoleId);
                        continue;
                    }

                    // Check if role exists
                    var role = await _context.Roles.FindAsync(roleId);
                    if (role == null)
                    {
                        _logger.LogWarning("Role not found: {RoleId}", roleId);
                        continue;
                    }

                    // Check if assignment already exists
                    var existingAssignment = await _context.ProjectRoles
                        .FirstOrDefaultAsync(pr => pr.ProjectId == project.Id && pr.RoleId == roleId);

                    if (existingAssignment == null)
                    {
                        var projectRole = new ProjectRole
                        {
                            ProjectId = project.Id,
                            RoleId = roleId,
                            CanView = roleAssignment.CanView,
                            CanEdit = roleAssignment.CanEdit,
                            CanDelete = roleAssignment.CanDelete
                        };

                        _context.ProjectRoles.Add(projectRole);
                    }
                }

                await _context.SaveChangesAsync();
            }

            // Fetch project with roles for response
            var createdProject = await _context.Projects
                .Include(p => p.ProjectRoles)
                .ThenInclude(pr => pr.Role)
                .FirstOrDefaultAsync(p => p.Id == project.Id);

            if (createdProject == null)
            {
                _logger.LogError("Failed to retrieve created project with ID {ProjectId}", project.Id);
                return StatusCode(500, "Error retrieving created project");
            }

            var projectDto = new ProjectDto
            {
                Id = createdProject.Id.ToString(),
                Name = createdProject.Name,
                Description = createdProject.Description,
                FileName = createdProject.FileName,
                CreatedAt = createdProject.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                ModifiedAt = createdProject.ModifiedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                ModifiedBy = createdProject.ModifiedBy,
                IsActive = createdProject.IsActive,
                IsArchived = createdProject.IsArchived,
                ProjectRoles = createdProject.ProjectRoles.Select(pr => new ProjectRoleDto
                {
                    Id = pr.Id.ToString(),
                    ProjectId = pr.ProjectId.ToString(),
                    RoleId = pr.RoleId.ToString(),
                    RoleName = pr.Role.Name,
                    CanView = pr.CanView,
                    CanEdit = pr.CanEdit,
                    CanDelete = pr.CanDelete,
                    CreatedAt = pr.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
                }).ToList()
            };

            return CreatedAtAction(nameof(GetProject), new { id = project.Id }, projectDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating project with name {ProjectName}", request.Name);
            return StatusCode(500, $"Error creating project: {ex.Message}");
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ProjectDto>> UpdateProject(int id, [FromBody] UpdateProjectRequest request)
    {
        try
        {
            var project = await _context.Projects.FindAsync(id);
            if (project == null)
            {
                return NotFound($"Project with ID {id} not found.");
            }

            if (!string.IsNullOrWhiteSpace(request.Name))
                project.Name = request.Name;
            if (request.Description != null)
                project.Description = request.Description;
            if (!string.IsNullOrWhiteSpace(request.FileName))
                project.FileName = request.FileName;

            // Update auditing fields
            project.ModifiedAt = DateTime.UtcNow;
            project.ModifiedBy = "System"; // TODO: Get from current user context

            await _context.SaveChangesAsync();

            // Handle role assignments if provided
            if (request.RoleAssignments != null)
            {
                // Remove existing role assignments for this project
                var existingRoles = await _context.ProjectRoles
                    .Where(pr => pr.ProjectId == id)
                    .ToListAsync();
                
                _context.ProjectRoles.RemoveRange(existingRoles);

                // Add new role assignments
                foreach (var roleAssignment in request.RoleAssignments)
                {
                    if (!int.TryParse(roleAssignment.RoleId, out var roleId))
                    {
                        _logger.LogWarning("Invalid role ID: {RoleId}", roleAssignment.RoleId);
                        continue;
                    }

                    // Check if role exists
                    var role = await _context.Roles.FindAsync(roleId);
                    if (role == null)
                    {
                        _logger.LogWarning("Role not found: {RoleId}", roleId);
                        continue;
                    }

                    var projectRole = new ProjectRole
                    {
                        ProjectId = id,
                        RoleId = roleId,
                        CanView = roleAssignment.CanView,
                        CanEdit = roleAssignment.CanEdit,
                        CanDelete = roleAssignment.CanDelete
                    };

                    _context.ProjectRoles.Add(projectRole);
                }

                await _context.SaveChangesAsync();
            }

            // Fetch updated project with roles for response
            var updatedProject = await _context.Projects
                .Include(p => p.ProjectRoles)
                .ThenInclude(pr => pr.Role)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (updatedProject == null)
            {
                _logger.LogError("Failed to retrieve updated project with ID {ProjectId}", id);
                return StatusCode(500, "Error retrieving updated project");
            }

            var projectDto = new ProjectDto
            {
                Id = updatedProject.Id.ToString(),
                Name = updatedProject.Name,
                Description = updatedProject.Description,
                FileName = updatedProject.FileName,
                CreatedAt = updatedProject.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                ModifiedAt = updatedProject.ModifiedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                ModifiedBy = updatedProject.ModifiedBy,
                IsActive = updatedProject.IsActive,
                IsArchived = updatedProject.IsArchived,
                ProjectRoles = updatedProject.ProjectRoles.Select(pr => new ProjectRoleDto
                {
                    Id = pr.Id.ToString(),
                    ProjectId = pr.ProjectId.ToString(),
                    RoleId = pr.RoleId.ToString(),
                    RoleName = pr.Role.Name,
                    CanView = pr.CanView,
                    CanEdit = pr.CanEdit,
                    CanDelete = pr.CanDelete,
                    CreatedAt = pr.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
                }).ToList()
            };

            return Ok(projectDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating project with ID {ProjectId}", id);
            return StatusCode(500, $"Error updating project: {ex.Message}");
        }
    }

    [HttpPatch("{id}/archive")]
    public async Task<ActionResult<ProjectDto>> ArchiveProject(int id, [FromBody] ArchiveProjectRequest request)
    {
        try
        {
            var project = await _context.Projects.FindAsync(id);
            if (project == null)
            {
                return NotFound($"Project with ID {id} not found.");
            }

            project.IsArchived = request.IsArchived;
            project.IsActive = !request.IsArchived; // When archived, make inactive
            project.ModifiedAt = DateTime.UtcNow;
            project.ModifiedBy = "System"; // TODO: Get from current user context

            await _context.SaveChangesAsync();

            var projectDto = new ProjectDto
            {
                Id = project.Id.ToString(),
                Name = project.Name,
                Description = project.Description,
                FileName = project.FileName,
                CreatedAt = project.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                ModifiedAt = project.ModifiedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                ModifiedBy = project.ModifiedBy,
                IsActive = project.IsActive,
                IsArchived = project.IsArchived
            };

            return Ok(projectDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error archiving project with ID {ProjectId}", id);
            return StatusCode(500, $"Error archiving project: {ex.Message}");
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteProject(int id, [FromQuery] bool hardDelete = false)
    {
        try
        {
            var project = await _context.Projects.FindAsync(id);
            if (project == null)
            {
                return NotFound($"Project with ID {id} not found.");
            }

            if (hardDelete)
            {
                // Hard delete - completely remove from database
                _context.Projects.Remove(project);
                _logger.LogInformation("Hard deleting project {ProjectId}", id);
            }
            else
            {
                // Soft delete - mark as inactive and archived
                project.IsActive = false;
                project.IsArchived = true;
                project.ModifiedAt = DateTime.UtcNow;
                project.ModifiedBy = "System"; // TODO: Get from current user context
                _logger.LogInformation("Soft deleting (archiving) project {ProjectId}", id);
            }

            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting project with ID {ProjectId}", id);
            return StatusCode(500, $"Error deleting project: {ex.Message}");
        }
    }

    [HttpPost("{id}/clone")]
    public async Task<ActionResult<ProjectDto>> CloneProject(int id)
    {
        try
        {
            var originalProject = await _context.Projects
                .Include(p => p.CustomFields)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (originalProject == null)
            {
                return NotFound($"Project with ID {id} not found.");
            }

            var clonedProject = new Project
            {
                Name = $"{originalProject.Name} (Copy)",
                Description = originalProject.Description,
                FileName = originalProject.FileName
            };

            _context.Projects.Add(clonedProject);
            await _context.SaveChangesAsync();

            // Clone custom fields
            foreach (var field in originalProject.CustomFields)
            {
                var clonedField = new CustomField
                {
                    Name = field.Name,
                    Description = field.Description,
                    FieldType = field.FieldType,
                    IsRequired = field.IsRequired,
                    IsDefault = field.IsDefault,
                    DefaultValue = field.DefaultValue,
                    Order = field.Order,
                    RoleVisibility = field.RoleVisibility,
                    UserListOptions = field.UserListOptions,
                    IsRemovable = field.IsRemovable,
                    ProjectId = clonedProject.Id
                };
                _context.CustomFields.Add(clonedField);
            }

            await _context.SaveChangesAsync();

            var projectDto = new ProjectDto
            {
                Id = clonedProject.Id.ToString(),
                Name = clonedProject.Name,
                Description = clonedProject.Description,
                FileName = clonedProject.FileName,
                CreatedAt = clonedProject.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                ModifiedAt = clonedProject.ModifiedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                ModifiedBy = clonedProject.ModifiedBy,
                IsActive = clonedProject.IsActive,
                IsArchived = clonedProject.IsArchived
            };

            return CreatedAtAction(nameof(GetProject), new { id = clonedProject.Id }, projectDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cloning project with ID {ProjectId}", id);
            return StatusCode(500, $"Error cloning project: {ex.Message}");
        }
    }

    // Custom Fields endpoints
    [HttpGet("{projectId}/custom-fields")]
    public async Task<ActionResult<List<CustomFieldDto>>> GetProjectCustomFields(int projectId)
    {
        try
        {
            // Check if project exists first
            var project = await _context.Projects.FindAsync(projectId);
            if (project == null)
            {
                return NotFound($"Project with ID {projectId} not found.");
            }

            // Query custom fields - this should return an empty list if none exist
            var customFields = await _context.CustomFields
                .Where(cf => cf.ProjectId == projectId)
                .OrderBy(cf => cf.Order)
                .Select(cf => new CustomFieldDto
                {
                    Id = cf.Id.ToString(),
                    Name = cf.Name ?? string.Empty,
                    Description = cf.Description,
                    FieldType = cf.FieldType.ToString(),
                    IsRequired = cf.IsRequired,
                    IsDefault = cf.IsDefault,
                    DefaultValue = cf.DefaultValue,
                    Order = cf.Order,
                    RoleVisibility = cf.RoleVisibility ?? "all",
                    UserListOptions = cf.UserListOptions,
                    IsRemovable = cf.IsRemovable,
                    ProjectId = cf.ProjectId.ToString(),
                    CreatedAt = cf.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    ModifiedAt = cf.ModifiedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
                })
                .ToListAsync();

            return Ok(customFields);
        }
        catch (InvalidOperationException ex)
        {
            // Database connectivity or query issues
            _logger.LogError(ex, "Database error retrieving custom fields for project {ProjectId}", projectId);
            return StatusCode(500, "Database error occurred while retrieving custom fields.");
        }
        catch (ArgumentException ex)
        {
            // Invalid data format issues
            _logger.LogError(ex, "Data format error retrieving custom fields for project {ProjectId}", projectId);
            return StatusCode(500, "Data format error occurred while retrieving custom fields.");
        }
        catch (Exception ex)
        {
            // Unexpected errors
            _logger.LogError(ex, "Unexpected error retrieving custom fields for project {ProjectId}", projectId);
            return StatusCode(500, "An unexpected error occurred while retrieving custom fields.");
        }
    }

    [HttpPost("{projectId}/custom-fields")]
    public async Task<ActionResult<CustomFieldDto>> CreateCustomField(int projectId, [FromBody] CreateCustomFieldRequest request)
    {
        try
        {
            var project = await _context.Projects.FindAsync(projectId);
            if (project == null)
            {
                return NotFound($"Project with ID {projectId} not found.");
            }

            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return BadRequest("Field name is required.");
            }

            if (!Enum.TryParse<CustomFieldType>(request.FieldType, out var fieldType))
            {
                return BadRequest($"Invalid field type: {request.FieldType}");
            }

            var customField = new CustomField
            {
                Name = request.Name,
                Description = request.Description,
                FieldType = fieldType,
                IsRequired = request.IsRequired,
                IsDefault = false,
                DefaultValue = request.DefaultValue,
                Order = request.Order,
                RoleVisibility = request.RoleVisibility ?? "all",
                UserListOptions = request.UserListOptions,
                IsRemovable = true,
                ProjectId = projectId
            };

            _context.CustomFields.Add(customField);
            await _context.SaveChangesAsync();

            var customFieldDto = new CustomFieldDto
            {
                Id = customField.Id.ToString(),
                Name = customField.Name,
                Description = customField.Description,
                FieldType = customField.FieldType.ToString(),
                IsRequired = customField.IsRequired,
                IsDefault = customField.IsDefault,
                DefaultValue = customField.DefaultValue,
                Order = customField.Order,
                RoleVisibility = customField.RoleVisibility,
                UserListOptions = customField.UserListOptions,
                IsRemovable = customField.IsRemovable,
                ProjectId = customField.ProjectId.ToString(),
                CreatedAt = customField.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                ModifiedAt = customField.ModifiedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
            };

            return CreatedAtAction(nameof(GetProjectCustomFields), new { projectId = projectId }, customFieldDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating custom field {FieldName} for project {ProjectId}", request.Name, projectId);
            return StatusCode(500, $"Error creating custom field: {ex.Message}");
        }
    }

    [HttpPut("{projectId}/custom-fields/{fieldId}")]
    public async Task<ActionResult<CustomFieldDto>> UpdateCustomField(int projectId, int fieldId, [FromBody] UpdateCustomFieldRequest request)
    {
        try
        {
            var customField = await _context.CustomFields
                .FirstOrDefaultAsync(cf => cf.Id == fieldId && cf.ProjectId == projectId);

            if (customField == null)
            {
                return NotFound($"Custom field with ID {fieldId} not found in project {projectId}.");
            }

            if (!string.IsNullOrWhiteSpace(request.Name))
                customField.Name = request.Name;
            if (request.Description != null)
                customField.Description = request.Description;
            if (!string.IsNullOrWhiteSpace(request.FieldType) && Enum.TryParse<CustomFieldType>(request.FieldType, out var fieldType))
                customField.FieldType = fieldType;
            if (request.IsRequired.HasValue)
                customField.IsRequired = request.IsRequired.Value;
            if (request.DefaultValue != null)
                customField.DefaultValue = request.DefaultValue;
            if (request.Order.HasValue)
                customField.Order = request.Order.Value;
            if (request.RoleVisibility != null)
                customField.RoleVisibility = request.RoleVisibility;
            if (request.UserListOptions != null)
                customField.UserListOptions = request.UserListOptions;

            await _context.SaveChangesAsync();

            var customFieldDto = new CustomFieldDto
            {
                Id = customField.Id.ToString(),
                Name = customField.Name,
                Description = customField.Description,
                FieldType = customField.FieldType.ToString(),
                IsRequired = customField.IsRequired,
                IsDefault = customField.IsDefault,
                DefaultValue = customField.DefaultValue,
                Order = customField.Order,
                RoleVisibility = customField.RoleVisibility,
                UserListOptions = customField.UserListOptions,
                IsRemovable = customField.IsRemovable,
                ProjectId = customField.ProjectId.ToString(),
                CreatedAt = customField.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                ModifiedAt = customField.ModifiedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
            };

            return Ok(customFieldDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating custom field {FieldId} for project {ProjectId}", fieldId, projectId);
            return StatusCode(500, $"Error updating custom field: {ex.Message}");
        }
    }

    [HttpDelete("{projectId}/custom-fields/{fieldId}")]
    public async Task<ActionResult> DeleteCustomField(int projectId, int fieldId)
    {
        try
        {
            var customField = await _context.CustomFields
                .FirstOrDefaultAsync(cf => cf.Id == fieldId && cf.ProjectId == projectId);

            if (customField == null)
            {
                return NotFound($"Custom field with ID {fieldId} not found in project {projectId}.");
            }

            if (!customField.IsRemovable)
            {
                return BadRequest("This field cannot be removed as it is a default system field.");
            }

            _context.CustomFields.Remove(customField);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting custom field {FieldId} for project {ProjectId}", fieldId, projectId);
            return StatusCode(500, $"Error deleting custom field: {ex.Message}");
        }
    }
}