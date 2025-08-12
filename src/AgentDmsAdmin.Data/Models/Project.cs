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
    
    // Navigation properties
    public ICollection<Document> Documents { get; set; } = new List<Document>();
    public ICollection<CustomField> CustomFields { get; set; } = new List<CustomField>();
}