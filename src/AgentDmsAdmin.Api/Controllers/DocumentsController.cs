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
}