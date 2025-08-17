using System.ComponentModel.DataAnnotations;

namespace AgentDmsAdmin.Data.Models;

public class User : BaseEntity
{
    [Required]
    [MaxLength(255)]
    public string Username { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(500)]
    public string PasswordHash { get; set; } = string.Empty;
}