namespace AgentDmsAdmin.Api.Models;

public class ProjectDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string CreatedAt { get; set; } = string.Empty;
    public string ModifiedAt { get; set; } = string.Empty;
    public string? ModifiedBy { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsArchived { get; set; } = false;
}

public class CreateProjectRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string FileName { get; set; } = string.Empty;
}

public class UpdateProjectRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? FileName { get; set; }
}

public class ArchiveProjectRequest
{
    public bool IsArchived { get; set; }
}