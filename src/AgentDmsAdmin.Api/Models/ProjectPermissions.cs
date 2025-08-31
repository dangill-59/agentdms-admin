namespace AgentDmsAdmin.Api.Models;

/// <summary>
/// Represents project-specific permissions for a user based on role intersection logic
/// </summary>
public class ProjectPermissions
{
    public bool CanView { get; set; }
    public bool CanEdit { get; set; }
    public bool CanDelete { get; set; }
}