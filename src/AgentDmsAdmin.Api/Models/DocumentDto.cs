namespace AgentDmsAdmin.Api.Models;

public class DocumentDto
{
    public string Id { get; set; } = string.Empty;
    public string ProjectId { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string StoragePath { get; set; } = string.Empty;
    public string? MimeType { get; set; }
    public long FileSize { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
    public string ModifiedAt { get; set; } = string.Empty;
    
    // Dynamic custom field values
    public Dictionary<string, string> CustomFieldValues { get; set; } = new Dictionary<string, string>();
    
    // Legacy fields for backward compatibility (will be removed after frontend update)
    public string? CustomerName { get; set; }
    public string? InvoiceNumber { get; set; }
    public string? InvoiceDate { get; set; }
    public string? DocType { get; set; }
    public string? Status { get; set; }
}

public class DocumentSearchFilters
{
    public string? ProjectId { get; set; }
    public string? DateFrom { get; set; }
    public string? DateTo { get; set; }
    
    // Dynamic custom field filters - key is field name, value is search term
    public Dictionary<string, string> CustomFieldFilters { get; set; } = new Dictionary<string, string>();
    
    // Legacy filters for backward compatibility (will be removed after frontend update)
    public string? InvoiceNumber { get; set; }
    public string? CustomerName { get; set; }
    public string? DocType { get; set; }
    public string? Status { get; set; }
}

public class DocumentMetadata
{
    public string Id { get; set; } = string.Empty;
    
    // Dynamic custom field values
    public Dictionary<string, string> CustomFieldValues { get; set; } = new Dictionary<string, string>();
    
    // Legacy fields for backward compatibility (will be removed after frontend update)
    public string CustomerName { get; set; } = string.Empty;
    public string InvoiceNumber { get; set; } = string.Empty;
    public string InvoiceDate { get; set; } = string.Empty;
    public string DocType { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

public class UpdateDocumentMetadataRequest
{
    // Dynamic custom field values to update
    public Dictionary<string, string> CustomFieldValues { get; set; } = new Dictionary<string, string>();
    
    // Legacy fields for backward compatibility (will be removed after frontend update)
    public string? CustomerName { get; set; }
    public string? InvoiceNumber { get; set; }
    public string? InvoiceDate { get; set; }
    public string? DocType { get; set; }
    public string? Status { get; set; }
    public string? Notes { get; set; }
}