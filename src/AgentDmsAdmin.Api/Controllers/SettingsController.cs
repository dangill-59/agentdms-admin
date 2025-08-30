using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AgentDmsAdmin.Api.Models;
using System.Reflection;

namespace AgentDmsAdmin.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // Require authentication for all settings endpoints
public class SettingsController : ControllerBase
{
    private readonly ILogger<SettingsController> _logger;

    public SettingsController(ILogger<SettingsController> logger)
    {
        _logger = logger;
    }

    [HttpGet("app")]
    public ActionResult<AppSettingsDto> GetAppSettings()
    {
        try
        {
            _logger.LogInformation("Fetching application settings");

            // Return default settings for now
            // In a real application, these would be loaded from database or configuration
            var settings = new AppSettingsDto
            {
                MaxFileSize = 104857600, // 100MB
                AllowedFileTypes = new List<string> 
                { 
                    ".jpg", ".jpeg", ".png", ".bmp", ".gif", 
                    ".tif", ".tiff", ".pdf", ".webp" 
                },
                AutoProcessUploads = true,
                ProcessingTimeout = 300, // 5 minutes
                RetentionDays = 365,
                EnableNotifications = true,
                EmailNotifications = new EmailNotificationSettings
                {
                    UploadCompleted = true,
                    ProcessingStatus = true,
                    SystemErrors = true
                },
                PushNotifications = new PushNotificationSettings
                {
                    UploadProgress = false,
                    ProcessingCompletion = true
                },
                SessionTimeout = 120, // 2 hours
                PasswordPolicy = new PasswordPolicySettings
                {
                    MinLength = 8,
                    RequireUppercase = true,
                    RequireLowercase = true,
                    RequireNumbers = true,
                    RequireSpecialChars = false
                },
                Theme = "light",
                DefaultPageSize = 10,
                DateFormat = "MM/dd/yyyy",
                TimeFormat = "12h"
            };

            return Ok(settings);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching application settings");
            return StatusCode(500, "An error occurred while retrieving application settings");
        }
    }

    [HttpPut("app")]
    public ActionResult<AppSettingsDto> UpdateAppSettings([FromBody] UpdateAppSettingsRequest request)
    {
        try
        {
            _logger.LogInformation("Updating application settings");

            // Get current settings (this would normally come from database)
            var settings = new AppSettingsDto
            {
                MaxFileSize = 104857600,
                AllowedFileTypes = new List<string> 
                { 
                    ".jpg", ".jpeg", ".png", ".bmp", ".gif", 
                    ".tif", ".tiff", ".pdf", ".webp" 
                },
                AutoProcessUploads = true,
                ProcessingTimeout = 300,
                RetentionDays = 365,
                EnableNotifications = true,
                EmailNotifications = new EmailNotificationSettings
                {
                    UploadCompleted = true,
                    ProcessingStatus = true,
                    SystemErrors = true
                },
                PushNotifications = new PushNotificationSettings
                {
                    UploadProgress = false,
                    ProcessingCompletion = true
                },
                SessionTimeout = 120,
                PasswordPolicy = new PasswordPolicySettings
                {
                    MinLength = 8,
                    RequireUppercase = true,
                    RequireLowercase = true,
                    RequireNumbers = true,
                    RequireSpecialChars = false
                },
                Theme = "light",
                DefaultPageSize = 10,
                DateFormat = "MM/dd/yyyy",
                TimeFormat = "12h"
            };

            // Apply updates from request
            if (request.MaxFileSize.HasValue)
                settings.MaxFileSize = request.MaxFileSize.Value;
            
            if (request.AllowedFileTypes != null)
                settings.AllowedFileTypes = request.AllowedFileTypes;
            
            if (request.AutoProcessUploads.HasValue)
                settings.AutoProcessUploads = request.AutoProcessUploads.Value;
            
            if (request.ProcessingTimeout.HasValue)
                settings.ProcessingTimeout = request.ProcessingTimeout.Value;
            
            if (request.RetentionDays.HasValue)
                settings.RetentionDays = request.RetentionDays.Value;
            
            if (request.EnableNotifications.HasValue)
                settings.EnableNotifications = request.EnableNotifications.Value;
            
            if (request.EmailNotifications != null)
                settings.EmailNotifications = request.EmailNotifications;
            
            if (request.PushNotifications != null)
                settings.PushNotifications = request.PushNotifications;
            
            if (request.SessionTimeout.HasValue)
                settings.SessionTimeout = request.SessionTimeout.Value;
            
            if (request.PasswordPolicy != null)
                settings.PasswordPolicy = request.PasswordPolicy;
            
            if (!string.IsNullOrEmpty(request.Theme))
                settings.Theme = request.Theme;
            
            if (request.DefaultPageSize.HasValue)
                settings.DefaultPageSize = request.DefaultPageSize.Value;
            
            if (!string.IsNullOrEmpty(request.DateFormat))
                settings.DateFormat = request.DateFormat;
            
            if (!string.IsNullOrEmpty(request.TimeFormat))
                settings.TimeFormat = request.TimeFormat;

            // In a real application, save to database here

            return Ok(settings);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating application settings");
            return StatusCode(500, "An error occurred while updating application settings");
        }
    }

    [HttpGet("system")]
    public ActionResult<SystemInfoDto> GetSystemInfo()
    {
        try
        {
            _logger.LogInformation("Fetching system information");

            var assembly = Assembly.GetExecutingAssembly();
            var version = assembly.GetName().Version?.ToString() ?? "1.0.0";
            var buildDate = System.IO.File.GetLastWriteTime(assembly.Location).ToString("yyyy-MM-ddTHH:mm:ssZ");

            var systemInfo = new SystemInfoDto
            {
                Version = version,
                BuildDate = buildDate,
                Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production",
                Uptime = TimeSpan.FromMilliseconds(Environment.TickCount64).ToString(@"d\d\ h\h\ m\m"),
                SystemHealth = new SystemHealthDto
                {
                    Status = "healthy",
                    CpuUsage = Random.Shared.Next(10, 40), // Mock values
                    MemoryUsage = Random.Shared.Next(40, 80),
                    DiskUsage = Random.Shared.Next(20, 60),
                    ActiveJobs = 0
                }
            };

            return Ok(systemInfo);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching system information");
            return StatusCode(500, "An error occurred while retrieving system information");
        }
    }

    [HttpGet("notifications")]
    public ActionResult<NotificationPreferencesDto> GetNotificationPreferences()
    {
        try
        {
            _logger.LogInformation("Fetching notification preferences");

            // Return default preferences for now
            var preferences = new NotificationPreferencesDto
            {
                EmailNotifications = new EmailNotificationPreferences
                {
                    UploadCompleted = true,
                    ProcessingStatus = true,
                    SystemErrors = true,
                    SystemUpdates = false,
                    SecurityAlerts = true
                },
                PushNotifications = new PushNotificationPreferences
                {
                    UploadProgress = false,
                    ProcessingCompletion = true,
                    SystemAlerts = true
                },
                InAppNotifications = new InAppNotificationPreferences
                {
                    JobCompletion = true,
                    SystemMessages = true,
                    ErrorAlerts = true
                }
            };

            return Ok(preferences);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching notification preferences");
            return StatusCode(500, "An error occurred while retrieving notification preferences");
        }
    }

    [HttpPut("notifications")]
    public ActionResult<NotificationPreferencesDto> UpdateNotificationPreferences([FromBody] NotificationPreferencesDto preferences)
    {
        try
        {
            _logger.LogInformation("Updating notification preferences");

            // In a real application, save to database here
            // For now, just return the provided preferences

            return Ok(preferences);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating notification preferences");
            return StatusCode(500, "An error occurred while updating notification preferences");
        }
    }
}