using System;
using System.ComponentModel.DataAnnotations;

namespace AgentDmsAdmin.Data.Models;

public class DocumentPage : BaseEntity
{
    public int PageNumber { get; set; }
    
    [Required]
    [MaxLength(500)]
    public string ImagePath { get; set; } = string.Empty;
    
    [MaxLength(500)]
    public string? ThumbnailPath { get; set; }
    
    public int Width { get; set; }
    public int Height { get; set; }
    
    // Foreign key
    public int DocumentId { get; set; }
    
    // Navigation property
    public Document Document { get; set; } = null!;
}