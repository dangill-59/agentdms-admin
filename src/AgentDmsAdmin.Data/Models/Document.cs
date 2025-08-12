using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace AgentDmsAdmin.Data.Models;

public class Document : BaseEntity
{
    [Required]
    [MaxLength(255)]
    public string FileName { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(500)]
    public string StoragePath { get; set; } = string.Empty;
    
    [MaxLength(100)]
    public string? MimeType { get; set; }
    
    public long FileSize { get; set; }
    
    // Foreign key
    public int ProjectId { get; set; }
    
    // Navigation properties
    public Project Project { get; set; } = null!;
    public ICollection<DocumentFieldValue> DocumentFieldValues { get; set; } = new List<DocumentFieldValue>();
    public ICollection<DocumentPage> DocumentPages { get; set; } = new List<DocumentPage>();
}