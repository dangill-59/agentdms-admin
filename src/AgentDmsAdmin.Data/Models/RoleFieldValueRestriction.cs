using System.ComponentModel.DataAnnotations;

namespace AgentDmsAdmin.Data.Models;

public class RoleFieldValueRestriction : BaseEntity
{
    [Required]
    public int RoleId { get; set; }
    
    [Required]
    public int CustomFieldId { get; set; }
    
    /// <summary>
    /// JSON array of allowed or restricted values for this role and field combination
    /// </summary>
    [Required]
    [MaxLength(2000)]
    public string Values { get; set; } = string.Empty;
    
    /// <summary>
    /// If true, Values contains allowed values (allow list).
    /// If false, Values contains restricted values (deny list).
    /// </summary>
    public bool IsAllowList { get; set; } = true;
    
    // Navigation properties
    public Role Role { get; set; } = null!;
    public CustomField CustomField { get; set; } = null!;
}