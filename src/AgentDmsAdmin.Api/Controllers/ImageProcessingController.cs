using Microsoft.AspNetCore.Mvc;
using AgentDmsAdmin.Api.Models;
using AgentDmsAdmin.Data.Data;
using AgentDmsAdmin.Data.Models;
using AgentDmsAdmin.Data.Services;
using Microsoft.EntityFrameworkCore;
using AgentDmsAdmin.Api.Attributes;
using ImageMagick;

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

            // Process the image using Magick.NET to get dimensions and create thumbnail
            var stopwatch = System.Diagnostics.Stopwatch.StartNew();
            var processedImage = await ProcessImageWithMagickNet(filePath, fileName, file.Length, fileExtension, file.ContentType, uploadsPath);
            stopwatch.Stop();

            // Create processing job
            var job = new ProcessingJob
            {
                JobId = jobId,
                Status = "Completed",
                FileName = file.FileName,
                CreatedAt = DateTime.UtcNow,
                Result = new ProcessingResult
                {
                    Success = true,
                    JobId = jobId,
                    ProcessedImage = processedImage,
                    ProcessingTime = $"{stopwatch.ElapsedMilliseconds}ms",
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

    private async Task<ProcessedImage> ProcessImageWithMagickNet(string filePath, string fileName, long fileSize, string originalFormat, string mimeType, string uploadsPath)
    {
        try
        {
            using var image = new MagickImage(filePath);
            
            // Get image dimensions
            var width = image.Width;
            var height = image.Height;
            
            // Check if it's a multi-page format (like PDF or TIFF)
            var isMultiPage = false;
            int? pageCount = null;
            
            if (originalFormat.ToLowerInvariant() == ".pdf" || originalFormat.ToLowerInvariant() == ".tif" || originalFormat.ToLowerInvariant() == ".tiff")
            {
                try
                {
                    using var imageCollection = new MagickImageCollection(filePath);
                    pageCount = imageCollection.Count;
                    isMultiPage = pageCount > 1;
                }
                catch
                {
                    // If we can't read as collection, treat as single page
                    isMultiPage = false;
                    pageCount = 1;
                }
            }
            
            // Create thumbnail (max 200x200)
            string? thumbnailPath = null;
            try
            {
                var thumbnailFileName = $"thumb_{fileName}";
                thumbnailPath = Path.Combine(uploadsPath, thumbnailFileName);
                
                using var thumbnail = image.Clone();
                thumbnail.Resize(200, 200);
                thumbnail.Format = MagickFormat.Jpeg;
                await Task.Run(() => thumbnail.Write(thumbnailPath));
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to create thumbnail for {FileName}", fileName);
            }
            
            // Create PNG conversion for better web compatibility if needed
            string? convertedPngPath = null;
            if (originalFormat.ToLowerInvariant() != ".png" && originalFormat.ToLowerInvariant() != ".jpg" && originalFormat.ToLowerInvariant() != ".jpeg")
            {
                try
                {
                    var pngFileName = Path.ChangeExtension(fileName, ".png");
                    convertedPngPath = Path.Combine(uploadsPath, pngFileName);
                    
                    using var pngImage = image.Clone();
                    pngImage.Format = MagickFormat.Png;
                    await Task.Run(() => pngImage.Write(convertedPngPath));
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to create PNG conversion for {FileName}", fileName);
                }
            }
            
            return new ProcessedImage
            {
                FileName = fileName,
                StoragePath = filePath,
                ConvertedPngPath = convertedPngPath,
                ThumbnailPath = thumbnailPath,
                Width = (int)width,
                Height = (int)height,
                FileSize = fileSize,
                OriginalFormat = originalFormat,
                MimeType = mimeType,
                IsMultiPage = isMultiPage,
                PageCount = pageCount
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing image {FileName} with Magick.NET", fileName);
            
            // Return basic info if image processing fails
            return new ProcessedImage
            {
                FileName = fileName,
                StoragePath = filePath,
                FileSize = fileSize,
                OriginalFormat = originalFormat,
                MimeType = mimeType,
                Width = 0,
                Height = 0,
                IsMultiPage = false
            };
        }
    }
}