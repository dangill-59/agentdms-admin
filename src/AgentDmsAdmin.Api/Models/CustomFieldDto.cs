namespace AgentDmsAdmin.Api.Models;

public class CustomFieldDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string FieldType { get; set; } = string.Empty;
    public bool IsRequired { get; set; }
    public bool IsDefault { get; set; }
    public string? DefaultValue { get; set; }
    public int Order { get; set; }
    public string? RoleVisibility { get; set; } = "all";
    public string? UserListOptions { get; set; }
    public bool IsRemovable { get; set; } = true;
    public string ProjectId { get; set; } = string.Empty;
    public string CreatedAt { get; set; } = string.Empty;
    public string ModifiedAt { get; set; } = string.Empty;
}

public class CreateCustomFieldRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string FieldType { get; set; } = string.Empty;
    public bool IsRequired { get; set; }
    public string? DefaultValue { get; set; }
    public int Order { get; set; }
    public string? RoleVisibility { get; set; } = "all";
    public string? UserListOptions { get; set; }
}

public class UpdateCustomFieldRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? FieldType { get; set; }
    public bool? IsRequired { get; set; }
    public string? DefaultValue { get; set; }
    public int? Order { get; set; }
    public string? RoleVisibility { get; set; }
    public string? UserListOptions { get; set; }
}