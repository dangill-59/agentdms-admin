namespace AgentDmsAdmin.Api.Models;

public class RoleFieldValueRestrictionDto
{
    public string Id { get; set; } = string.Empty;
    public string RoleId { get; set; } = string.Empty;
    public string RoleName { get; set; } = string.Empty;
    public string CustomFieldId { get; set; } = string.Empty;
    public string CustomFieldName { get; set; } = string.Empty;
    public List<string> Values { get; set; } = new List<string>();
    public bool IsAllowList { get; set; } = true;
    public string CreatedAt { get; set; } = string.Empty;
    public string ModifiedAt { get; set; } = string.Empty;
}

public class CreateRoleFieldValueRestrictionRequest
{
    public int RoleId { get; set; }
    public int CustomFieldId { get; set; }
    public List<string> Values { get; set; } = new List<string>();
    public bool IsAllowList { get; set; } = true;
}

public class UpdateRoleFieldValueRestrictionRequest
{
    public List<string>? Values { get; set; }
    public bool? IsAllowList { get; set; }
}

public class FieldValueRestrictionsForRoleDto
{
    public string RoleId { get; set; } = string.Empty;
    public string RoleName { get; set; } = string.Empty;
    public List<FieldRestrictionDto> FieldRestrictions { get; set; } = new List<FieldRestrictionDto>();
}

public class FieldRestrictionDto
{
    public string CustomFieldId { get; set; } = string.Empty;
    public string CustomFieldName { get; set; } = string.Empty;
    public string CustomFieldType { get; set; } = string.Empty;
    public List<string> AllowedValues { get; set; } = new List<string>();
    public List<string> RestrictedValues { get; set; } = new List<string>();
    public bool HasRestrictions { get; set; }
    public bool IsAllowList { get; set; }
}