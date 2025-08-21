using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using AgentDmsAdmin.Api.Models;
using AgentDmsAdmin.Data.Data;
using AgentDmsAdmin.Data.Models;
using System.Net.Http;
using System.Text.Json;

namespace AgentDmsAdmin.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DocumentsController : ControllerBase
{
    private readonly AgentDmsContext _context;
    private readonly ILogger<DocumentsController> _logger;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;

    public DocumentsController(
        AgentDmsContext context, 
        ILogger<DocumentsController> logger, 
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration)
    {
        _context = context;
        _logger = logger;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
    }

    [HttpGet]
    public async Task<ActionResult<PaginatedResponse<DocumentDto>>> GetDocuments(
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 10,
        [FromQuery] int? projectId = null)
    {
        try
        {
            var query = _context.Documents.AsQueryable();
            
            if (projectId.HasValue)
            {
                query = query.Where(d => d.ProjectId == projectId.Value);
            }
            
            var totalCount = await query.CountAsync();
            
            var documents = await query
                .Include(d => d.DocumentPages)
                .OrderByDescending(d => d.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(d => new DocumentDto
                {
                    Id = d.Id.ToString(),
                    FileName = d.FileName,
                    StoragePath = d.StoragePath,
                    FileSize = d.FileSize,
                    MimeType = d.MimeType,
                    ProjectId = d.ProjectId.ToString(),
                    CreatedAt = d.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    ModifiedAt = d.ModifiedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    PageCount = d.DocumentPages.Count()
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
            _logger.LogError(ex, "Error retrieving documents");
            return StatusCode(500, "Error retrieving documents");
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<DocumentDto>> GetDocument(int id)
    {
        try
        {
            var document = await _context.Documents
                .Include(d => d.DocumentPages)
                .FirstOrDefaultAsync(d => d.Id == id);
            
            if (document == null)
            {
                return NotFound($"Document with ID {id} not found.");
            }

            var documentDto = new DocumentDto
            {
                Id = document.Id.ToString(),
                FileName = document.FileName,
                StoragePath = document.StoragePath,
                FileSize = document.FileSize,
                MimeType = document.MimeType,
                ProjectId = document.ProjectId.ToString(),
                CreatedAt = document.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                ModifiedAt = document.ModifiedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                PageCount = document.DocumentPages.Count()
            };

            return Ok(documentDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving document with ID {DocumentId}", id);
            return StatusCode(500, "Error retrieving document");
        }
    }

    [HttpGet("{id}/preview")]
    public async Task<IActionResult> GetDocumentPreview(int id)
    {
        try
        {
            var document = await _context.Documents
                .Include(d => d.DocumentPages)
                .FirstOrDefaultAsync(d => d.Id == id);
            
            if (document == null)
            {
                return NotFound($"Document with ID {id} not found.");
            }

            // Get the first page for preview (or primary image)
            var firstPage = document.DocumentPages.OrderBy(p => p.PageNumber).FirstOrDefault();
            
            if (firstPage == null || string.IsNullOrEmpty(firstPage.ImagePath))
            {
                // Try to proxy request to main AgentDMS system
                return await ProxyImageRequest($"documents/{id}/preview");
            }

            // Return the stored image file
            var imagePath = Path.Combine(GetStorageBasePath(), firstPage.ImagePath);
            
            if (!System.IO.File.Exists(imagePath))
            {
                _logger.LogWarning("Image file not found at path: {ImagePath}", imagePath);
                return await ProxyImageRequest($"documents/{id}/preview");
            }

            var mimeType = GetMimeTypeFromExtension(Path.GetExtension(imagePath));
            var imageBytes = await System.IO.File.ReadAllBytesAsync(imagePath);
            
            return File(imageBytes, mimeType);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving document preview for ID {DocumentId}", id);
            return StatusCode(500, "Error retrieving document preview");
        }
    }

    [HttpGet("{id}/thumbnail")]
    public async Task<IActionResult> GetDocumentThumbnail(int id)
    {
        try
        {
            var document = await _context.Documents
                .Include(d => d.DocumentPages)
                .FirstOrDefaultAsync(d => d.Id == id);
            
            if (document == null)
            {
                return NotFound($"Document with ID {id} not found.");
            }

            // Get the first page for thumbnail
            var firstPage = document.DocumentPages.OrderBy(p => p.PageNumber).FirstOrDefault();
            
            if (firstPage == null || string.IsNullOrEmpty(firstPage.ThumbnailPath))
            {
                // Try to proxy request to main AgentDMS system
                return await ProxyImageRequest($"documents/{id}/thumbnail");
            }

            // Return the stored thumbnail file
            var thumbnailPath = Path.Combine(GetStorageBasePath(), firstPage.ThumbnailPath);
            
            if (!System.IO.File.Exists(thumbnailPath))
            {
                _logger.LogWarning("Thumbnail file not found at path: {ThumbnailPath}", thumbnailPath);
                return await ProxyImageRequest($"documents/{id}/thumbnail");
            }

            var mimeType = GetMimeTypeFromExtension(Path.GetExtension(thumbnailPath));
            var imageBytes = await System.IO.File.ReadAllBytesAsync(thumbnailPath);
            
            return File(imageBytes, mimeType);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving document thumbnail for ID {DocumentId}", id);
            return StatusCode(500, "Error retrieving document thumbnail");
        }
    }

    [HttpGet("{id}/download")]
    public async Task<IActionResult> DownloadDocument(int id)
    {
        try
        {
            var document = await _context.Documents.FindAsync(id);
            
            if (document == null)
            {
                return NotFound($"Document with ID {id} not found.");
            }

            // Check if file exists locally
            if (!string.IsNullOrEmpty(document.StoragePath))
            {
                var filePath = Path.Combine(GetStorageBasePath(), document.StoragePath);
                
                if (System.IO.File.Exists(filePath))
                {
                    var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
                    return File(fileBytes, document.MimeType ?? "application/octet-stream", document.FileName);
                }
            }

            // Proxy to main AgentDMS system
            return await ProxyFileRequest($"documents/{id}/download", document.FileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error downloading document with ID {DocumentId}", id);
            return StatusCode(500, "Error downloading document");
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteDocument(int id)
    {
        try
        {
            var document = await _context.Documents
                .Include(d => d.DocumentPages)
                .Include(d => d.DocumentFieldValues)
                .FirstOrDefaultAsync(d => d.Id == id);
            
            if (document == null)
            {
                return NotFound($"Document with ID {id} not found.");
            }

            // Remove related data
            _context.DocumentPages.RemoveRange(document.DocumentPages);
            _context.DocumentFieldValues.RemoveRange(document.DocumentFieldValues);
            _context.Documents.Remove(document);
            
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting document with ID {DocumentId}", id);
            return StatusCode(500, "Error deleting document");
        }
    }

    private async Task<IActionResult> ProxyImageRequest(string endpoint)
    {
        try
        {
            var agentDmsBaseUrl = _configuration["AgentDMS:BaseUrl"] ?? "http://localhost:5267";
            var httpClient = _httpClientFactory.CreateClient();
            
            var response = await httpClient.GetAsync($"{agentDmsBaseUrl}/api/{endpoint}");
            
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Failed to proxy image request to AgentDMS: {StatusCode}", response.StatusCode);
                return NotFound("Image not found");
            }

            var content = await response.Content.ReadAsByteArrayAsync();
            var contentType = response.Content.Headers.ContentType?.ToString() ?? "image/png";
            
            return File(content, contentType);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error proxying image request to AgentDMS for endpoint {Endpoint}", endpoint);
            return StatusCode(500, "Error retrieving image");
        }
    }

    private async Task<IActionResult> ProxyFileRequest(string endpoint, string fileName)
    {
        try
        {
            var agentDmsBaseUrl = _configuration["AgentDMS:BaseUrl"] ?? "http://localhost:5267";
            var httpClient = _httpClientFactory.CreateClient();
            
            var response = await httpClient.GetAsync($"{agentDmsBaseUrl}/api/{endpoint}");
            
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Failed to proxy file request to AgentDMS: {StatusCode}", response.StatusCode);
                return NotFound("File not found");
            }

            var content = await response.Content.ReadAsByteArrayAsync();
            var contentType = response.Content.Headers.ContentType?.ToString() ?? "application/octet-stream";
            
            return File(content, contentType, fileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error proxying file request to AgentDMS for endpoint {Endpoint}", endpoint);
            return StatusCode(500, "Error retrieving file");
        }
    }

    private string GetStorageBasePath()
    {
        return _configuration["Storage:BasePath"] ?? Path.Combine(Directory.GetCurrentDirectory(), "storage");
    }

    private static string GetMimeTypeFromExtension(string extension)
    {
        return extension.ToLowerInvariant() switch
        {
            ".png" => "image/png",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".gif" => "image/gif",
            ".bmp" => "image/bmp",
            ".tif" or ".tiff" => "image/tiff",
            ".webp" => "image/webp",
            _ => "image/png"
        };
    }
}