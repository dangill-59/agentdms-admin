using System.ComponentModel.DataAnnotations;

namespace AgentDmsAdmin.Data.Models;

public class Role : BaseEntity
{
    [Required]
    [MaxLength(255)]
    public string Name { get; set; } = string.Empty;
    
    [MaxLength(500)]
    public string? Description { get; set; }
    
    // Navigation properties
    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    public ICollection<ProjectRole> ProjectRoles { get; set; } = new List<ProjectRole>();
}