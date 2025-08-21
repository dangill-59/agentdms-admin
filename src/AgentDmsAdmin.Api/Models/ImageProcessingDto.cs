namespace AgentDmsAdmin.Api.Models;

// Job status types (matching AgentDMS backend expectations)
public class JobStatus
{
    public string JobId { get; set; } = string.Empty;
    public string Status { get; set; } = "Queued"; // Queued, Processing, Completed, Failed
    public string CreatedAt { get; set; } = string.Empty;
    public string? ErrorMessage { get; set; }
}

public class UploadResponse
{
    public string JobId { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string Message { get; set; } = string.Empty;
    public string Status { get; set; } = "Uploaded";
}

public class ProcessingResult
{
    public bool Success { get; set; }
    public string JobId { get; set; } = string.Empty;
    public ProcessedImage? ProcessedImage { get; set; }
    public List<SplitPage>? SplitPages { get; set; }
    public string? ProcessingTime { get; set; }
    public string? Message { get; set; }
}

public class ProcessedImage
{
    public string FileName { get; set; } = string.Empty;
    public string StoragePath { get; set; } = string.Empty;
    public string? ConvertedPngPath { get; set; }
    public string? ThumbnailPath { get; set; }
    public int Width { get; set; }
    public int Height { get; set; }
    public long FileSize { get; set; }
    public string OriginalFormat { get; set; } = string.Empty;
    public string MimeType { get; set; } = string.Empty;
    public bool IsMultiPage { get; set; }
    public int? PageCount { get; set; }
}

public class SplitPage
{
    public string? ConvertedPngPath { get; set; }
    public string? ThumbnailPath { get; set; }
}

// Simple job tracking for async processing
public class ProcessingJob
{
    public string JobId { get; set; } = string.Empty;
    public string Status { get; set; } = "Queued";
    public string FileName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string? ErrorMessage { get; set; }
    public ProcessingResult? Result { get; set; }
}