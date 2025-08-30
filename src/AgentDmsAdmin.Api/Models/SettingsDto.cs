using AgentDmsAdmin.Data.Models;

namespace AgentDmsAdmin.Api.Models;

public class AppSettingsDto
{
    // Database settings
    public DatabaseSettings Database { get; set; } = new();

    // File processing settings
    public long MaxFileSize { get; set; } = 104857600; // 100MB in bytes
    public List<string> AllowedFileTypes { get; set; } = new();
    public bool AutoProcessUploads { get; set; } = true;
    public int ProcessingTimeout { get; set; } = 300; // in seconds
    public int RetentionDays { get; set; } = 365;

    // Notification settings
    public bool EnableNotifications { get; set; } = true;
    public EmailNotificationSettings EmailNotifications { get; set; } = new();
    public PushNotificationSettings PushNotifications { get; set; } = new();

    // Security settings
    public int SessionTimeout { get; set; } = 120; // in minutes
    public PasswordPolicySettings PasswordPolicy { get; set; } = new();

    // Image storage settings
    public ImageStorageSettings ImageStorage { get; set; } = new();

    // UI settings
    public string Theme { get; set; } = "light";
    public int DefaultPageSize { get; set; } = 10;
    public string DateFormat { get; set; } = "MM/dd/yyyy";
    public string TimeFormat { get; set; } = "12h";
}

public class EmailNotificationSettings
{
    public bool UploadCompleted { get; set; } = true;
    public bool ProcessingStatus { get; set; } = true;
    public bool SystemErrors { get; set; } = true;
}

public class PushNotificationSettings
{
    public bool UploadProgress { get; set; } = false;
    public bool ProcessingCompletion { get; set; } = true;
}

public class PasswordPolicySettings
{
    public int MinLength { get; set; } = 8;
    public bool RequireUppercase { get; set; } = true;
    public bool RequireLowercase { get; set; } = true;
    public bool RequireNumbers { get; set; } = true;
    public bool RequireSpecialChars { get; set; } = false;
}

public class SystemInfoDto
{
    public string Version { get; set; } = string.Empty;
    public string BuildDate { get; set; } = string.Empty;
    public string Environment { get; set; } = string.Empty;
    public string Uptime { get; set; } = string.Empty;
    public SystemHealthDto SystemHealth { get; set; } = new();
}

public class SystemHealthDto
{
    public string Status { get; set; } = "healthy";
    public int CpuUsage { get; set; }
    public int MemoryUsage { get; set; }
    public int DiskUsage { get; set; }
    public int ActiveJobs { get; set; }
}

public class NotificationPreferencesDto
{
    public EmailNotificationPreferences EmailNotifications { get; set; } = new();
    public PushNotificationPreferences PushNotifications { get; set; } = new();
    public InAppNotificationPreferences InAppNotifications { get; set; } = new();
}

public class EmailNotificationPreferences
{
    public bool UploadCompleted { get; set; } = true;
    public bool ProcessingStatus { get; set; } = true;
    public bool SystemErrors { get; set; } = true;
    public bool SystemUpdates { get; set; } = false;
    public bool SecurityAlerts { get; set; } = true;
}

public class PushNotificationPreferences
{
    public bool UploadProgress { get; set; } = false;
    public bool ProcessingCompletion { get; set; } = true;
    public bool SystemAlerts { get; set; } = true;
}

public class InAppNotificationPreferences
{
    public bool JobCompletion { get; set; } = true;
    public bool SystemMessages { get; set; } = true;
    public bool ErrorAlerts { get; set; } = true;
}

public class ImageStorageSettings
{
    public string Provider { get; set; } = "local"; // local, aws, azure
    public LocalStorageSettings Local { get; set; } = new();
    public AwsStorageSettings Aws { get; set; } = new();
    public AzureStorageSettings Azure { get; set; } = new();
}

public class LocalStorageSettings
{
    public string BasePath { get; set; } = "./uploads/images";
    public bool CreateDirectoryIfNotExists { get; set; } = true;
}

public class AwsStorageSettings
{
    public string BucketName { get; set; } = string.Empty;
    public string Region { get; set; } = "us-east-1";
    public string AccessKeyId { get; set; } = string.Empty;
    public string SecretAccessKey { get; set; } = string.Empty;
    public string BasePath { get; set; } = "images/";
}

public class AzureStorageSettings
{
    public string ConnectionString { get; set; } = string.Empty;
    public string ContainerName { get; set; } = "images";
    public string BasePath { get; set; } = "images/";
}

public class UpdateAppSettingsRequest
{
    public DatabaseSettings? Database { get; set; }
    public long? MaxFileSize { get; set; }
    public List<string>? AllowedFileTypes { get; set; }
    public bool? AutoProcessUploads { get; set; }
    public int? ProcessingTimeout { get; set; }
    public int? RetentionDays { get; set; }
    public bool? EnableNotifications { get; set; }
    public EmailNotificationSettings? EmailNotifications { get; set; }
    public PushNotificationSettings? PushNotifications { get; set; }
    public int? SessionTimeout { get; set; }
    public PasswordPolicySettings? PasswordPolicy { get; set; }
    public ImageStorageSettings? ImageStorage { get; set; }
    public string? Theme { get; set; }
    public int? DefaultPageSize { get; set; }
    public string? DateFormat { get; set; }
    public string? TimeFormat { get; set; }
}