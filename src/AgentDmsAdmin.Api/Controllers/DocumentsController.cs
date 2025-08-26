using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AgentDmsAdmin.Api.Models;
using AgentDmsAdmin.Data.Data;
using AgentDmsAdmin.Data.Models;

namespace AgentDmsAdmin.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DocumentsController : ControllerBase
{
    private readonly AgentDmsContext _context;
    private readonly ILogger<DocumentsController> _logger;

    public DocumentsController(AgentDmsContext context, ILogger<DocumentsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<PaginatedResponse<DocumentDto>>> GetDocuments(
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 10,
        [FromQuery] string? projectId = null)
    {
        try
        {
            var query = _context.Documents.AsQueryable();
            
            // Filter by project if specified
            if (!string.IsNullOrEmpty(projectId) && int.TryParse(projectId, out var projectIdInt))
            {
                query = query.Where(d => d.ProjectId == projectIdInt);
            }
            
            var totalCount = await query.CountAsync();
            
            var documents = await query
                .Include(d => d.Project)
                .OrderByDescending(d => d.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(d => new DocumentDto
                {
                    Id = d.Id.ToString(),
                    ProjectId = d.ProjectId.ToString(),
                    FileName = d.FileName,
                    StoragePath = d.StoragePath,
                    MimeType = d.MimeType,
                    FileSize = d.FileSize,
                    CreatedAt = d.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    ModifiedAt = d.ModifiedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
                })
                .ToListAsync();

            var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

            var response = new PaginatedResponse<DocumentDto>
            {
                Data = documents,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = totalPages
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching documents");
            return StatusCode(500, "An error occurred while fetching documents");
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<DocumentDto>> GetDocument(int id)
    {
        try
        {
            var document = await _context.Documents
                .Include(d => d.Project)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (document == null)
            {
                return NotFound($"Document with ID {id} not found.");
            }

            var documentDto = new DocumentDto
            {
                Id = document.Id.ToString(),
                ProjectId = document.ProjectId.ToString(),
                FileName = document.FileName,
                StoragePath = document.StoragePath,
                MimeType = document.MimeType,
                FileSize = document.FileSize,
                CreatedAt = document.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                ModifiedAt = document.ModifiedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
            };

            return Ok(documentDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching document {DocumentId}", id);
            return StatusCode(500, "An error occurred while fetching the document");
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteDocument(int id)
    {
        try
        {
            var document = await _context.Documents.FindAsync(id);
            
            if (document == null)
            {
                return NotFound($"Document with ID {id} not found.");
            }

            _context.Documents.Remove(document);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Document {DocumentId} deleted successfully", id);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting document {DocumentId}", id);
            return StatusCode(500, "An error occurred while deleting the document");
        }
    }

    [HttpGet("{id}/metadata")]
    public async Task<ActionResult<DocumentMetadata>> GetDocumentMetadata(int id)
    {
        try
        {
            var document = await _context.Documents
                .Include(d => d.DocumentFieldValues)
                .ThenInclude(dfv => dfv.CustomField)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (document == null)
            {
                return NotFound($"Document with ID {id} not found.");
            }

            // Extract metadata from document field values
            // This is a simplified version - in a real implementation you'd map specific custom fields
            var metadata = new DocumentMetadata
            {
                Id = document.Id.ToString(),
                CustomerName = GetFieldValue(document.DocumentFieldValues, "CustomerName") ?? "Unknown Customer",
                InvoiceNumber = GetFieldValue(document.DocumentFieldValues, "InvoiceNumber") ?? "N/A",
                InvoiceDate = GetFieldValue(document.DocumentFieldValues, "InvoiceDate") ?? DateTime.Now.ToString("yyyy-MM-dd"),
                DocType = GetFieldValue(document.DocumentFieldValues, "DocType") ?? "Document",
                Status = GetFieldValue(document.DocumentFieldValues, "Status") ?? "Processed",
                Notes = GetFieldValue(document.DocumentFieldValues, "Notes")
            };

            return Ok(metadata);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching document metadata {DocumentId}", id);
            return StatusCode(500, "An error occurred while fetching document metadata");
        }
    }

    [HttpPut("{id}/metadata")]
    public async Task<ActionResult<DocumentMetadata>> UpdateDocumentMetadata(int id, [FromBody] UpdateDocumentMetadataRequest request)
    {
        try
        {
            var document = await _context.Documents
                .Include(d => d.DocumentFieldValues)
                .ThenInclude(dfv => dfv.CustomField)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (document == null)
            {
                return NotFound($"Document with ID {id} not found.");
            }

            // Update field values - simplified implementation
            // In a real implementation, you'd handle custom fields properly
            UpdateFieldValue(document, "CustomerName", request.CustomerName);
            UpdateFieldValue(document, "InvoiceNumber", request.InvoiceNumber);
            UpdateFieldValue(document, "InvoiceDate", request.InvoiceDate);
            UpdateFieldValue(document, "DocType", request.DocType);
            UpdateFieldValue(document, "Status", request.Status);
            UpdateFieldValue(document, "Notes", request.Notes);

            await _context.SaveChangesAsync();

            // Return updated metadata
            var metadata = new DocumentMetadata
            {
                Id = document.Id.ToString(),
                CustomerName = request.CustomerName ?? "Unknown Customer",
                InvoiceNumber = request.InvoiceNumber ?? "N/A",
                InvoiceDate = request.InvoiceDate ?? DateTime.Now.ToString("yyyy-MM-dd"),
                DocType = request.DocType ?? "Document",
                Status = request.Status ?? "Processed",
                Notes = request.Notes
            };

            return Ok(metadata);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating document metadata {DocumentId}", id);
            return StatusCode(500, "An error occurred while updating document metadata");
        }
    }

    private string? GetFieldValue(ICollection<DocumentFieldValue> fieldValues, string fieldName)
    {
        return fieldValues.FirstOrDefault(fv => fv.CustomField.Name == fieldName)?.Value;
    }

    [HttpPost("search")]
    public async Task<ActionResult<PaginatedResponse<DocumentDto>>> SearchDocuments(
        [FromBody] DocumentSearchFilters filters, 
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 10)
    {
        try
        {
            var query = _context.Documents.AsQueryable();
            
            // Filter by project if specified
            if (!string.IsNullOrEmpty(filters.ProjectId) && int.TryParse(filters.ProjectId, out var projectIdInt))
            {
                query = query.Where(d => d.ProjectId == projectIdInt);
            }
            
            // For now, we'll return basic document info as DocumentDto
            // In a full implementation, you'd join with DocumentFieldValues to search custom fields
            var totalCount = await query.CountAsync();
            
            var documents = await query
                .Include(d => d.Project)
                .Include(d => d.DocumentFieldValues)
                .ThenInclude(dfv => dfv.CustomField)
                .OrderByDescending(d => d.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var documentDtos = documents.Select(d => new DocumentDto
            {
                Id = d.Id.ToString(),
                ProjectId = d.ProjectId.ToString(),
                FileName = d.FileName,
                StoragePath = d.StoragePath,
                MimeType = d.MimeType,
                FileSize = d.FileSize,
                CreatedAt = d.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                ModifiedAt = d.ModifiedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                // Extract metadata from field values (safe null handling)
                CustomerName = GetFieldValue(d.DocumentFieldValues, "CustomerName") ?? "Unknown Customer",
                InvoiceNumber = GetFieldValue(d.DocumentFieldValues, "InvoiceNumber") ?? "N/A",
                InvoiceDate = GetFieldValue(d.DocumentFieldValues, "InvoiceDate") ?? DateTime.Now.ToString("yyyy-MM-dd"),
                DocType = GetFieldValue(d.DocumentFieldValues, "DocType") ?? "Document",
                Status = GetFieldValue(d.DocumentFieldValues, "Status") ?? "Processed"
            }).ToList();

            var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

            var searchResponse = new PaginatedResponse<DocumentDto>
            {
                Data = documentDtos,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = totalPages
            };

            return Ok(searchResponse);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching documents");
            return StatusCode(500, "An error occurred while searching documents");
        }
    }

    private void UpdateFieldValue(Document document, string fieldName, string? value)
    {
        if (value == null) return;

        var fieldValue = document.DocumentFieldValues.FirstOrDefault(fv => fv.CustomField.Name == fieldName);
        if (fieldValue != null)
        {
            fieldValue.Value = value;
        }
        // Note: In a real implementation, you'd handle creating new field values for missing custom fields
    }

    [HttpGet("{id}/download")]
    public async Task<ActionResult> DownloadDocument(int id)
    {
        try
        {
            var document = await _context.Documents.FindAsync(id);
            if (document == null)
            {
                return NotFound($"Document with ID {id} not found.");
            }

            if (string.IsNullOrEmpty(document.StoragePath) || !System.IO.File.Exists(document.StoragePath))
            {
                return NotFound("Document file not found on disk.");
            }

            var fileBytes = await System.IO.File.ReadAllBytesAsync(document.StoragePath);
            var contentType = document.MimeType ?? "application/octet-stream";

            return File(fileBytes, contentType, document.FileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error downloading document {DocumentId}", id);
            return StatusCode(500, "An error occurred while downloading the document");
        }
    }

    [HttpGet("{id}/preview")]
    public async Task<ActionResult> PreviewDocument(int id)
    {
        try
        {
            var document = await _context.Documents.FindAsync(id);
            if (document == null)
            {
                return NotFound($"Document with ID {id} not found.");
            }

            if (string.IsNullOrEmpty(document.StoragePath) || !System.IO.File.Exists(document.StoragePath))
            {
                return NotFound("Document file not found on disk.");
            }

            var fileBytes = await System.IO.File.ReadAllBytesAsync(document.StoragePath);
            var contentType = document.MimeType ?? "application/octet-stream";

            // For preview, we want to display inline rather than download
            Response.Headers["Content-Disposition"] = $"inline; filename=\"{document.FileName}\"";
            return File(fileBytes, contentType);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error previewing document {DocumentId}", id);
            return StatusCode(500, "An error occurred while previewing the document");
        }
    }

    [HttpGet("{id}/thumbnail")]
    public async Task<ActionResult> GetDocumentThumbnail(int id)
    {
        try
        {
            var document = await _context.Documents.FindAsync(id);
            if (document == null)
            {
                return NotFound($"Document with ID {id} not found.");
            }

            if (string.IsNullOrEmpty(document.StoragePath) || !System.IO.File.Exists(document.StoragePath))
            {
                return NotFound("Document file not found on disk.");
            }

            // For now, return the original file as thumbnail
            // In a production environment, you would generate actual thumbnails
            var fileBytes = await System.IO.File.ReadAllBytesAsync(document.StoragePath);
            var contentType = document.MimeType ?? "application/octet-stream";

            // For images, return as-is for thumbnail. For other types, you might want to generate previews
            if (contentType.StartsWith("image/"))
            {
                Response.Headers["Content-Disposition"] = $"inline; filename=\"thumbnail_{document.FileName}\"";
                return File(fileBytes, contentType);
            }

            // For non-image files, return a placeholder or generate a preview
            return NotFound("Thumbnail not available for this file type");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting document thumbnail {DocumentId}", id);
            return StatusCode(500, "An error occurred while getting the document thumbnail");
        }
    }
}