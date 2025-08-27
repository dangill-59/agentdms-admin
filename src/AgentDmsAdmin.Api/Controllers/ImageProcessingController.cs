using Microsoft.AspNetCore.Mvc;
using AgentDmsAdmin.Api.Models;
using AgentDmsAdmin.Data.Data;
using AgentDmsAdmin.Data.Models;
using AgentDmsAdmin.Data.Services;
using Microsoft.EntityFrameworkCore;
using AgentDmsAdmin.Api.Attributes;

namespace AgentDmsAdmin.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ImageProcessingController : ControllerBase
{
    private readonly AgentDmsContext _context;
    private readonly ILogger<ImageProcessingController> _logger;
    private readonly IWebHostEnvironment _environment;
    private readonly DataSeeder _dataSeeder;
    
    // Simple in-memory job tracking for development
    private static readonly Dictionary<string, ProcessingJob> _jobs = new();

    public ImageProcessingController(
        AgentDmsContext context, 
        ILogger<ImageProcessingController> logger,
        IWebHostEnvironment environment,
        DataSeeder dataSeeder)
    {
        _context = context;
        _logger = logger;
        _environment = environment;
        _dataSeeder = dataSeeder;
    }

    [HttpPost("upload")]
    [RequirePermission("document.edit")]
    public async Task<ActionResult<UploadResponse>> UploadFile(IFormFile file, [FromForm] int? projectId = null)
    {
        try
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("No file uploaded");
            }

            // Validate file type
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".bmp", ".gif", ".tif", ".tiff", ".pdf", ".webp" };
            var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
            
            if (!allowedExtensions.Contains(fileExtension))
            {
                return BadRequest($"File type {fileExtension} is not supported");
            }

            // Validate file size (100MB limit)
            const long maxFileSize = 100 * 1024 * 1024;
            if (file.Length > maxFileSize)
            {
                return BadRequest("File size exceeds the 100MB limit");
            }

            // Generate unique job ID and file name
            var jobId = Guid.NewGuid().ToString();
            var fileName = $"{Guid.NewGuid()}{fileExtension}";
            
            // Create uploads directory if it doesn't exist
            var uploadsPath = Path.Combine(_environment.WebRootPath ?? _environment.ContentRootPath, "uploads");
            Directory.CreateDirectory(uploadsPath);
            
            var filePath = Path.Combine(uploadsPath, fileName);

            // Save the file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Create processing job
            var job = new ProcessingJob
            {
                JobId = jobId,
                Status = "Completed", // For simplicity, mark as completed immediately
                FileName = file.FileName,
                CreatedAt = DateTime.UtcNow,
                Result = new ProcessingResult
                {
                    Success = true,
                    JobId = jobId,
                    ProcessedImage = new ProcessedImage
                    {
                        FileName = fileName,
                        StoragePath = filePath,
                        FileSize = file.Length,
                        OriginalFormat = fileExtension,
                        MimeType = file.ContentType,
                        IsMultiPage = false, // Simplified - would need actual image processing to detect
                        Width = 0, // Would need image processing library to get actual dimensions
                        Height = 0
                    },
                    ProcessingTime = "0.1s",
                    Message = "File uploaded and processed successfully"
                }
            };

            // Determine which project to assign the document to
            int targetProjectId = projectId ?? 1; // Default to first project if not specified
            
            // Verify the project exists and ensure it has default fields
            var project = await _context.Projects.FindAsync(targetProjectId);
            if (project == null)
            {
                return BadRequest($"Project with ID {targetProjectId} not found");
            }

            // Ensure default fields exist for the project
            await _dataSeeder.CreateDefaultFieldsForProjectAsync(targetProjectId);

            _jobs[jobId] = job;

            // Create Document record in database
            var document = new Document
            {
                FileName = file.FileName,
                StoragePath = filePath,
                MimeType = file.ContentType,
                FileSize = file.Length,
                ProjectId = targetProjectId
            };

            _context.Documents.Add(document);
            await _context.SaveChangesAsync();

            // Get the default custom fields for this project and populate them
            var defaultFields = await _context.CustomFields
                .Where(cf => cf.ProjectId == targetProjectId && cf.IsDefault)
                .ToListAsync();

            var documentFieldValues = new List<DocumentFieldValue>();
            var currentDate = DateTime.UtcNow.ToString("yyyy-MM-dd");

            foreach (var field in defaultFields)
            {
                string? value = field.Name switch
                {
                    "Filename" => file.FileName,
                    "Date Created" => currentDate,
                    "Date Modified" => currentDate,
                    _ => null
                };

                if (value != null)
                {
                    var fieldValue = new DocumentFieldValue
                    {
                        DocumentId = document.Id,
                        CustomFieldId = field.Id,
                        Value = value
                    };
                    documentFieldValues.Add(fieldValue);
                }
            }

            if (documentFieldValues.Any())
            {
                _context.DocumentFieldValues.AddRange(documentFieldValues);
                await _context.SaveChangesAsync();
            }

            _logger.LogInformation("File {FileName} uploaded successfully with job ID {JobId}", file.FileName, jobId);

            var response = new UploadResponse
            {
                JobId = jobId,
                FileName = file.FileName,
                FileSize = file.Length,
                Message = "File uploaded successfully",
                Status = "Uploaded"
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading file");
            return StatusCode(500, "An error occurred while uploading the file");
        }
    }

    [HttpGet("job/{jobId}/status")]
    [RequirePermission("document.view")]
    public ActionResult<JobStatus> GetJobStatus(string jobId)
    {
        try
        {
            if (!_jobs.TryGetValue(jobId, out var job))
            {
                return NotFound($"Job with ID {jobId} not found");
            }

            var status = new JobStatus
            {
                JobId = job.JobId,
                Status = job.Status,
                CreatedAt = job.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                ErrorMessage = job.ErrorMessage
            };

            return Ok(status);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching job status for {JobId}", jobId);
            return StatusCode(500, "An error occurred while fetching job status");
        }
    }

    [HttpGet("job/{jobId}/result")]
    [RequirePermission("document.view")]
    public ActionResult<ProcessingResult> GetJobResult(string jobId)
    {
        try
        {
            if (!_jobs.TryGetValue(jobId, out var job))
            {
                return NotFound($"Job with ID {jobId} not found");
            }

            if (job.Status != "Completed")
            {
                return BadRequest($"Job {jobId} is not completed yet. Current status: {job.Status}");
            }

            if (job.Result == null)
            {
                return NotFound($"No result available for job {jobId}");
            }

            return Ok(job.Result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching job result for {JobId}", jobId);
            return StatusCode(500, "An error occurred while fetching job result");
        }
    }

    [HttpGet("supported-formats")]
    public ActionResult<List<string>> GetSupportedFormats()
    {
        var supportedFormats = new List<string>
        {
            ".jpg", ".jpeg", ".png", ".bmp", ".gif", ".tif", ".tiff", ".pdf", ".webp"
        };

        return Ok(supportedFormats);
    }
}