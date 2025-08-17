using System.ComponentModel.DataAnnotations;

namespace AgentDmsAdmin.Data.Models;

public class ProjectRole : BaseEntity
{
    [Required]
    public int ProjectId { get; set; }
    
    [Required]
    public int RoleId { get; set; }
    
    public bool CanView { get; set; } = true;
    public bool CanEdit { get; set; } = false;
    public bool CanDelete { get; set; } = false;
    
    // Navigation properties
    public Project Project { get; set; } = null!;
    public Role Role { get; set; } = null!;
}