using System;
using System.ComponentModel.DataAnnotations;

namespace AgentDmsAdmin.Data.Models;

public class DocumentFieldValue : BaseEntity
{
    [MaxLength(2000)]
    public string? Value { get; set; }
    
    // Foreign keys
    public int DocumentId { get; set; }
    public int CustomFieldId { get; set; }
    
    // Navigation properties
    public Document Document { get; set; } = null!;
    public CustomField CustomField { get; set; } = null!;
}