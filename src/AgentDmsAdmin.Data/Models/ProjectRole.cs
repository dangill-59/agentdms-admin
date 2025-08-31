using System.ComponentModel.DataAnnotations;

namespace AgentDmsAdmin.Data.Models;

public class ProjectRole : BaseEntity
{
    [Required]
    public int ProjectId { get; set; }
    
    [Required]
    public int RoleId { get; set; }
    
    // TODO: These fields are deprecated and should be removed in favor of role-based permissions
    // They are kept for backward compatibility with admin interfaces
    public bool CanView { get; set; } = true;
    public bool CanEdit { get; set; } = false;
    public bool CanDelete { get; set; } = false;
    
    // Navigation properties
    public Project Project { get; set; } = null!;
    public Role Role { get; set; } = null!;
}