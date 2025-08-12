using System;
using System.ComponentModel.DataAnnotations;

namespace AgentDmsAdmin.Data.Models;

public enum CustomFieldType
{
    Text,
    Number,
    Date,
    Boolean,
    LongText
}

public class CustomField : BaseEntity
{
    [Required]
    [MaxLength(255)]
    public string Name { get; set; } = string.Empty;
    
    [MaxLength(500)]
    public string? Description { get; set; }
    
    [Required]
    public CustomFieldType FieldType { get; set; }
    
    public bool IsRequired { get; set; }
    
    public bool IsDefault { get; set; } // For default fields like filename, date created, date modified
    
    [MaxLength(500)]
    public string? DefaultValue { get; set; }
    
    // Foreign key
    public int ProjectId { get; set; }
    
    // Navigation property
    public Project Project { get; set; } = null!;
    public ICollection<DocumentFieldValue> DocumentFieldValues { get; set; } = new List<DocumentFieldValue>();
}