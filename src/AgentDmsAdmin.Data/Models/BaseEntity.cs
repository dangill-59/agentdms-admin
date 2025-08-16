using System;
using System.ComponentModel.DataAnnotations;

namespace AgentDmsAdmin.Data.Models;

public abstract class BaseEntity
{
    [Key]
    public int Id { get; set; }
    
    public DateTime CreatedAt { get; set; }
    
    public DateTime ModifiedAt { get; set; }
    
    [MaxLength(255)]
    public string? ModifiedBy { get; set; }
}