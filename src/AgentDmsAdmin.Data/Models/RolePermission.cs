using System.ComponentModel.DataAnnotations;

namespace AgentDmsAdmin.Data.Models;

public class RolePermission : BaseEntity
{
    [Required]
    public int RoleId { get; set; }
    
    [Required]
    public int PermissionId { get; set; }
    
    // Navigation properties
    public Role Role { get; set; } = null!;
    public Permission Permission { get; set; } = null!;
}