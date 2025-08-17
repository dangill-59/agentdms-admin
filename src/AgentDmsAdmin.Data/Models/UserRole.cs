using System.ComponentModel.DataAnnotations;

namespace AgentDmsAdmin.Data.Models;

public class UserRole : BaseEntity
{
    [Required]
    public int UserId { get; set; }
    
    [Required]
    public int RoleId { get; set; }
    
    // Navigation properties
    public User User { get; set; } = null!;
    public Role Role { get; set; } = null!;
}