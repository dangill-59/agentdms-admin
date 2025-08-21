using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace AgentDmsAdmin.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ImageProcessingController : ControllerBase
{
    private readonly ILogger<ImageProcessingController> _logger;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;

    public ImageProcessingController(
        ILogger<ImageProcessingController> logger,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration)
    {
        _logger = logger;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
    }

    [HttpPost("upload")]
    public async Task<IActionResult> UploadFile(IFormFile file)
    {
        try
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { error = "No file provided" });
            }

            _logger.LogInformation("Received file upload: {FileName}, Size: {FileSize}", file.FileName, file.Length);

            // Create form data for the main AgentDMS system
            using var formData = new MultipartFormDataContent();
            using var fileStream = file.OpenReadStream();
            using var streamContent = new StreamContent(fileStream);
            
            // Set content type based on file extension
            streamContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(file.ContentType ?? "application/octet-stream");
            
            // Add TWAIN-specific processing parameters to improve image handling
            formData.Add(streamContent, "file", file.FileName);
            formData.Add(new StringContent("true"), "preserveQuality");
            formData.Add(new StringContent("300"), "dpi"); // Ensure proper DPI for TWAIN images
            formData.Add(new StringContent("png"), "outputFormat"); // Use PNG to preserve quality
            formData.Add(new StringContent("true"), "autoAdjustContrast"); // Help with dark images
            formData.Add(new StringContent("true"), "autoAdjustBrightness"); // Help with dark images
            formData.Add(new StringContent("twain"), "sourceType"); // Indicate this is from TWAIN scanner

            // Proxy to main AgentDMS system
            var agentDmsBaseUrl = _configuration["AgentDMS:BaseUrl"] ?? "http://localhost:5267";
            var httpClient = _httpClientFactory.CreateClient();
            
            // Set a longer timeout for image processing
            httpClient.Timeout = TimeSpan.FromMinutes(5);

            var response = await httpClient.PostAsync($"{agentDmsBaseUrl}/api/imageprocessing/upload", formData);
            
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError("AgentDMS upload failed: {StatusCode}, Content: {Content}", response.StatusCode, errorContent);
                return StatusCode((int)response.StatusCode, new { error = $"Upload failed: {errorContent}" });
            }

            var responseContent = await response.Content.ReadAsStringAsync();
            
            // Parse and potentially modify the response to ensure proper image processing
            try
            {
                var uploadResponse = JsonSerializer.Deserialize<JsonElement>(responseContent);
                
                // Log the successful upload for debugging
                _logger.LogInformation("Successfully proxied upload to AgentDMS. Response: {Response}", responseContent);
                
                return Ok(uploadResponse);
            }
            catch (JsonException)
            {
                // If response is not JSON, return as-is
                return Ok(new { message = responseContent });
            }
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Network error during file upload proxy");
            return StatusCode(500, new { error = "Network error connecting to image processing service" });
        }
        catch (TaskCanceledException ex)
        {
            _logger.LogError(ex, "Timeout during file upload proxy");
            return StatusCode(500, new { error = "Upload request timed out" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during file upload proxy");
            return StatusCode(500, new { error = "Internal server error during upload" });
        }
    }

    [HttpGet("job/{jobId}/status")]
    public async Task<IActionResult> GetJobStatus(string jobId)
    {
        try
        {
            var agentDmsBaseUrl = _configuration["AgentDMS:BaseUrl"] ?? "http://localhost:5267";
            var httpClient = _httpClientFactory.CreateClient();
            
            var response = await httpClient.GetAsync($"{agentDmsBaseUrl}/api/imageprocessing/job/{jobId}/status");
            
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("Failed to get job status from AgentDMS: {StatusCode}, Content: {Content}", response.StatusCode, errorContent);
                return StatusCode((int)response.StatusCode, new { error = $"Failed to get job status: {errorContent}" });
            }

            var responseContent = await response.Content.ReadAsStringAsync();
            
            try
            {
                var jobStatus = JsonSerializer.Deserialize<JsonElement>(responseContent);
                return Ok(jobStatus);
            }
            catch (JsonException)
            {
                return Ok(new { message = responseContent });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting job status for job {JobId}", jobId);
            return StatusCode(500, new { error = "Error getting job status" });
        }
    }

    [HttpGet("job/{jobId}/result")]
    public async Task<IActionResult> GetJobResult(string jobId)
    {
        try
        {
            var agentDmsBaseUrl = _configuration["AgentDMS:BaseUrl"] ?? "http://localhost:5267";
            var httpClient = _httpClientFactory.CreateClient();
            
            var response = await httpClient.GetAsync($"{agentDmsBaseUrl}/api/imageprocessing/job/{jobId}/result");
            
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("Failed to get job result from AgentDMS: {StatusCode}, Content: {Content}", response.StatusCode, errorContent);
                return StatusCode((int)response.StatusCode, new { error = $"Failed to get job result: {errorContent}" });
            }

            var responseContent = await response.Content.ReadAsStringAsync();
            
            try
            {
                var jobResult = JsonSerializer.Deserialize<JsonElement>(responseContent);
                
                // Log successful result retrieval for debugging
                _logger.LogInformation("Successfully retrieved job result for {JobId}: {Response}", jobId, responseContent);
                
                return Ok(jobResult);
            }
            catch (JsonException)
            {
                return Ok(new { message = responseContent });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting job result for job {JobId}", jobId);
            return StatusCode(500, new { error = "Error getting job result" });
        }
    }

    [HttpGet("formats")]
    public async Task<IActionResult> GetSupportedFormats()
    {
        try
        {
            var agentDmsBaseUrl = _configuration["AgentDMS:BaseUrl"] ?? "http://localhost:5267";
            var httpClient = _httpClientFactory.CreateClient();
            
            var response = await httpClient.GetAsync($"{agentDmsBaseUrl}/api/imageprocessing/formats");
            
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Failed to get supported formats from AgentDMS, returning defaults");
                // Return default formats that work well with TWAIN scanners
                return Ok(new[] { ".jpg", ".jpeg", ".png", ".bmp", ".gif", ".tif", ".tiff", ".pdf", ".webp" });
            }

            var responseContent = await response.Content.ReadAsStringAsync();
            
            try
            {
                var formats = JsonSerializer.Deserialize<JsonElement>(responseContent);
                return Ok(formats);
            }
            catch (JsonException)
            {
                // Return default formats if parsing fails
                return Ok(new[] { ".jpg", ".jpeg", ".png", ".bmp", ".gif", ".tif", ".tiff", ".pdf", ".webp" });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting supported formats");
            // Return default formats that work well with TWAIN scanners
            return Ok(new[] { ".jpg", ".jpeg", ".png", ".bmp", ".gif", ".tif", ".tiff", ".pdf", ".webp" });
        }
    }
}