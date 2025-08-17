using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace AgentDmsAdmin.Data.Models;

public class Project : BaseEntity
{
    [Required]
    [MaxLength(255)]
    public string Name { get; set; } = string.Empty;
    
    [MaxLength(1000)]
    public string? Description { get; set; }
    
    [Required]
    [MaxLength(255)]
    public string FileName { get; set; } = string.Empty; // Default field
    
    public bool IsActive { get; set; } = true;
    
    public bool IsArchived { get; set; } = false;
    
    // Navigation properties
    public ICollection<Document> Documents { get; set; } = new List<Document>();
    public ICollection<CustomField> CustomFields { get; set; } = new List<CustomField>();
    public ICollection<ProjectRole> ProjectRoles { get; set; } = new List<ProjectRole>();
}