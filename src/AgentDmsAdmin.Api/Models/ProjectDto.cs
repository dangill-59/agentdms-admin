namespace AgentDmsAdmin.Api.Models;

public class ProjectDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string CreatedAt { get; set; } = string.Empty;
    public string ModifiedAt { get; set; } = string.Empty;
}