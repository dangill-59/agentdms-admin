namespace AgentDmsAdmin.Api.Models;

public class RoleDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
    public string ModifiedAt { get; set; } = string.Empty;
}

public class UserRoleDto
{
    public string Id { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string RoleId { get; set; } = string.Empty;
    public string RoleName { get; set; } = string.Empty;
    public string CreatedAt { get; set; } = string.Empty;
}

public class ProjectRoleDto
{
    public string Id { get; set; } = string.Empty;
    public string ProjectId { get; set; } = string.Empty;
    public string RoleId { get; set; } = string.Empty;
    public string RoleName { get; set; } = string.Empty;
    public bool CanView { get; set; } = true;
    public bool CanEdit { get; set; } = false;
    public bool CanDelete { get; set; } = false;
    public string CreatedAt { get; set; } = string.Empty;
}

public class CreateRoleRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class UpdateRoleRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
}

public class AssignUserRoleRequest
{
    public string UserId { get; set; } = string.Empty;
    public string RoleId { get; set; } = string.Empty;
}

public class AssignProjectRoleRequest
{
    public string ProjectId { get; set; } = string.Empty;
    public string RoleId { get; set; } = string.Empty;
    public bool CanView { get; set; } = true;
    public bool CanEdit { get; set; } = false;
    public bool CanDelete { get; set; } = false;
}

public class UpdateProjectRoleRequest
{
    public bool? CanView { get; set; }
    public bool? CanEdit { get; set; }
    public bool? CanDelete { get; set; }
}