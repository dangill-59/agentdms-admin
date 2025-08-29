using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AgentDmsAdmin.Api.Models;
using AgentDmsAdmin.Data.Data;
using AgentDmsAdmin.Data.Models;
using AgentDmsAdmin.Api.Attributes;

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
    [RequirePermission("document.view")]
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
    [RequirePermission("document.view")]
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
    [RequirePermission("document.delete")]
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
    [RequirePermission("document.view")]
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

            var metadata = new DocumentMetadata
            {
                Id = document.Id.ToString(),
                CustomFieldValues = new Dictionary<string, string>()
            };
            
            // Add all custom field values to the dictionary
            foreach (var fieldValue in document.DocumentFieldValues)
            {
                metadata.CustomFieldValues[fieldValue.CustomField.Name] = fieldValue.Value ?? string.Empty;
            }
            
            // Maintain backward compatibility with legacy fields
            metadata.CustomerName = GetFieldValue(document.DocumentFieldValues, "CustomerName") ?? string.Empty;
            metadata.InvoiceNumber = GetFieldValue(document.DocumentFieldValues, "InvoiceNumber") ?? string.Empty;
            metadata.InvoiceDate = GetFieldValue(document.DocumentFieldValues, "InvoiceDate") ?? string.Empty;
            metadata.DocType = GetFieldValue(document.DocumentFieldValues, "DocType") ?? string.Empty;
            metadata.Status = GetFieldValue(document.DocumentFieldValues, "Status") ?? string.Empty;
            metadata.Notes = GetFieldValue(document.DocumentFieldValues, "Notes");

            return Ok(metadata);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching document metadata {DocumentId}", id);
            return StatusCode(500, "An error occurred while fetching document metadata");
        }
    }

    [HttpPut("{id}/metadata")]
    [RequirePermission("document.edit")]
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

            // Update custom field values
            foreach (var customFieldUpdate in request.CustomFieldValues)
            {
                await UpdateOrCreateFieldValue(document, customFieldUpdate.Key, customFieldUpdate.Value);
            }
            
            // Update legacy field values for backward compatibility
            if (request.CustomerName != null)
                await UpdateOrCreateFieldValue(document, "CustomerName", request.CustomerName);
            if (request.InvoiceNumber != null)
                await UpdateOrCreateFieldValue(document, "InvoiceNumber", request.InvoiceNumber);
            if (request.InvoiceDate != null)
                await UpdateOrCreateFieldValue(document, "InvoiceDate", request.InvoiceDate);
            if (request.DocType != null)
                await UpdateOrCreateFieldValue(document, "DocType", request.DocType);
            if (request.Status != null)
                await UpdateOrCreateFieldValue(document, "Status", request.Status);
            if (request.Notes != null)
                await UpdateOrCreateFieldValue(document, "Notes", request.Notes);

            await _context.SaveChangesAsync();

            // Return updated metadata
            var metadata = new DocumentMetadata
            {
                Id = document.Id.ToString(),
                CustomFieldValues = new Dictionary<string, string>()
            };
            
            // Reload document with updated field values
            document = await _context.Documents
                .Include(d => d.DocumentFieldValues)
                .ThenInclude(dfv => dfv.CustomField)
                .FirstOrDefaultAsync(d => d.Id == id);
            
            if (document != null)
            {
                // Add all custom field values to the dictionary
                foreach (var fieldValue in document.DocumentFieldValues)
                {
                    metadata.CustomFieldValues[fieldValue.CustomField.Name] = fieldValue.Value ?? string.Empty;
                }
                
                // Maintain backward compatibility
                metadata.CustomerName = GetFieldValue(document.DocumentFieldValues, "CustomerName") ?? string.Empty;
                metadata.InvoiceNumber = GetFieldValue(document.DocumentFieldValues, "InvoiceNumber") ?? string.Empty;
                metadata.InvoiceDate = GetFieldValue(document.DocumentFieldValues, "InvoiceDate") ?? string.Empty;
                metadata.DocType = GetFieldValue(document.DocumentFieldValues, "DocType") ?? string.Empty;
                metadata.Status = GetFieldValue(document.DocumentFieldValues, "Status") ?? string.Empty;
                metadata.Notes = GetFieldValue(document.DocumentFieldValues, "Notes");
            }

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

    [HttpGet("projects/{projectId}/custom-fields")]
    [RequirePermission("document.view")]
    public async Task<ActionResult<IEnumerable<CustomFieldDto>>> GetProjectCustomFields(int projectId)
    {
        try
        {
            var customFields = await _context.CustomFields
                .Where(cf => cf.ProjectId == projectId)
                .OrderBy(cf => cf.Order)
                .Select(cf => new CustomFieldDto
                {
                    Id = cf.Id.ToString(),
                    ProjectId = cf.ProjectId.ToString(),
                    Name = cf.Name,
                    Description = cf.Description,
                    FieldType = cf.FieldType.ToString(),
                    IsRequired = cf.IsRequired,
                    IsDefault = cf.IsDefault,
                    DefaultValue = cf.DefaultValue,
                    Order = cf.Order,
                    RoleVisibility = cf.RoleVisibility,
                    UserListOptions = cf.UserListOptions,
                    IsRemovable = cf.IsRemovable,
                    CreatedAt = cf.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    ModifiedAt = cf.ModifiedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
                })
                .ToListAsync();

            return Ok(customFields);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching custom fields for project {ProjectId}", projectId);
            return StatusCode(500, "An error occurred while fetching custom fields");
        }
    }

    [HttpPost("search")]
    [RequirePermission("document.view")]
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
            
            // Apply custom field filters
            foreach (var customFieldFilter in filters.CustomFieldFilters)
            {
                if (!string.IsNullOrEmpty(customFieldFilter.Value))
                {
                    var fieldName = customFieldFilter.Key;
                    var searchValue = customFieldFilter.Value;
                    
                    query = query.Where(d => d.DocumentFieldValues
                        .Any(dfv => dfv.CustomField.Name == fieldName && 
                                   dfv.Value != null && 
                                   dfv.Value.ToLower().Contains(searchValue.ToLower())));
                }
            }
            
            // Legacy field filters for backward compatibility
            if (!string.IsNullOrEmpty(filters.InvoiceNumber))
            {
                query = query.Where(d => d.DocumentFieldValues
                    .Any(dfv => dfv.CustomField.Name == "InvoiceNumber" && 
                               dfv.Value != null && 
                               dfv.Value.ToLower().Contains(filters.InvoiceNumber.ToLower())));
            }
            
            if (!string.IsNullOrEmpty(filters.CustomerName))
            {
                query = query.Where(d => d.DocumentFieldValues
                    .Any(dfv => dfv.CustomField.Name == "CustomerName" && 
                               dfv.Value != null && 
                               dfv.Value.ToLower().Contains(filters.CustomerName.ToLower())));
            }
            
            if (!string.IsNullOrEmpty(filters.DocType))
            {
                query = query.Where(d => d.DocumentFieldValues
                    .Any(dfv => dfv.CustomField.Name == "DocType" && 
                               dfv.Value != null && 
                               dfv.Value.ToLower().Contains(filters.DocType.ToLower())));
            }
            
            if (!string.IsNullOrEmpty(filters.Status))
            {
                query = query.Where(d => d.DocumentFieldValues
                    .Any(dfv => dfv.CustomField.Name == "Status" && 
                               dfv.Value != null && 
                               dfv.Value.ToLower().Contains(filters.Status.ToLower())));
            }
            
            // Apply date range filters
            if (!string.IsNullOrEmpty(filters.DateFrom) && DateTime.TryParse(filters.DateFrom, out var dateFrom))
            {
                query = query.Where(d => d.CreatedAt >= dateFrom);
            }
            
            if (!string.IsNullOrEmpty(filters.DateTo) && DateTime.TryParse(filters.DateTo, out var dateTo))
            {
                query = query.Where(d => d.CreatedAt <= dateTo.AddDays(1)); // Include the entire day
            }
            
            var totalCount = await query.CountAsync();
            
            var documents = await query
                .Include(d => d.Project)
                .Include(d => d.DocumentFieldValues)
                .ThenInclude(dfv => dfv.CustomField)
                .OrderByDescending(d => d.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var documentDtos = documents.Select(d => {
                var dto = new DocumentDto
                {
                    Id = d.Id.ToString(),
                    ProjectId = d.ProjectId.ToString(),
                    FileName = d.FileName,
                    StoragePath = d.StoragePath,
                    MimeType = d.MimeType,
                    FileSize = d.FileSize,
                    CreatedAt = d.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    ModifiedAt = d.ModifiedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    CustomFieldValues = new Dictionary<string, string>()
                };
                
                // Add all custom field values to the dictionary
                foreach (var fieldValue in d.DocumentFieldValues)
                {
                    dto.CustomFieldValues[fieldValue.CustomField.Name] = fieldValue.Value ?? string.Empty;
                }
                
                // Maintain backward compatibility with legacy fields
                dto.CustomerName = GetFieldValue(d.DocumentFieldValues, "CustomerName") ?? string.Empty;
                dto.InvoiceNumber = GetFieldValue(d.DocumentFieldValues, "InvoiceNumber") ?? string.Empty;
                dto.InvoiceDate = GetFieldValue(d.DocumentFieldValues, "InvoiceDate") ?? string.Empty;
                dto.DocType = GetFieldValue(d.DocumentFieldValues, "DocType") ?? string.Empty;
                dto.Status = GetFieldValue(d.DocumentFieldValues, "Status") ?? string.Empty;
                
                return dto;
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

    private async Task UpdateOrCreateFieldValue(Document document, string fieldName, string? value)
    {
        if (value == null) return;

        var fieldValue = document.DocumentFieldValues.FirstOrDefault(fv => fv.CustomField.Name == fieldName);
        if (fieldValue != null)
        {
            fieldValue.Value = value;
        }
        else
        {
            // Find the custom field for this document's project
            var customField = await _context.CustomFields
                .FirstOrDefaultAsync(cf => cf.ProjectId == document.ProjectId && cf.Name == fieldName);
                
            if (customField != null)
            {
                // Create new field value
                var newFieldValue = new DocumentFieldValue
                {
                    DocumentId = document.Id,
                    CustomFieldId = customField.Id,
                    Value = value
                };
                
                _context.DocumentFieldValues.Add(newFieldValue);
                document.DocumentFieldValues.Add(newFieldValue);
            }
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
    [RequirePermission("document.print")]
    public async Task<ActionResult> DownloadDocument(int id)
    {
        try
        {
            var document = await _context.Documents.FindAsync(id);
            if (document == null)
            {
                return NotFound($"Document with ID {id} not found.");
            }

            // Resolve storage path for file access
            var filePath = ResolveStoragePath(document.StoragePath);

            if (string.IsNullOrEmpty(document.StoragePath) || !System.IO.File.Exists(filePath))
            {
                return NotFound("Document file not found on disk.");
            }

            var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
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
    [RequirePermission("document.view")]
    public async Task<ActionResult> PreviewDocument(int id)
    {
        try
        {
            var document = await _context.Documents.FindAsync(id);
            if (document == null)
            {
                return NotFound($"Document with ID {id} not found.");
            }

            // Resolve storage path for file access
            var filePath = ResolveStoragePath(document.StoragePath);

            if (string.IsNullOrEmpty(document.StoragePath) || !System.IO.File.Exists(filePath))
            {
                return NotFound("Document file not found on disk.");
            }

            var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
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
    [RequirePermission("document.view")]
    public async Task<ActionResult> GetDocumentThumbnail(int id)
    {
        try
        {
            var document = await _context.Documents.FindAsync(id);
            if (document == null)
            {
                return NotFound($"Document with ID {id} not found.");
            }

            // Resolve storage path for file access
            var filePath = ResolveStoragePath(document.StoragePath);

            if (string.IsNullOrEmpty(document.StoragePath) || !System.IO.File.Exists(filePath))
            {
                return NotFound("Document file not found on disk.");
            }

            // For now, return the original file as thumbnail
            // In a production environment, you would generate actual thumbnails
            var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
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

    /// <summary>
    /// Resolves the storage path by converting /uploads/ paths to relative ./uploads/ paths
    /// </summary>
    /// <param name="storagePath">The original storage path</param>
    /// <returns>The resolved file path</returns>
    private static string ResolveStoragePath(string storagePath)
    {
        if (storagePath.StartsWith("/uploads/"))
        {
            return "." + storagePath; // Convert "/uploads/file.pdf" to "./uploads/file.pdf"
        }
        return storagePath;
    }
}