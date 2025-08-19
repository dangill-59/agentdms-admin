namespace AgentDmsAdmin.Api.Models;

public class PermissionDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
    public string ModifiedAt { get; set; } = string.Empty;
}

public class RolePermissionDto
{
    public string Id { get; set; } = string.Empty;
    public string RoleId { get; set; } = string.Empty;
    public string PermissionId { get; set; } = string.Empty;
    public string PermissionName { get; set; } = string.Empty;
    public string? PermissionDescription { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
}

public class CreatePermissionRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class UpdatePermissionRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
}

public class AssignRolePermissionRequest
{
    public string RoleId { get; set; } = string.Empty;
    public string PermissionId { get; set; } = string.Empty;
}