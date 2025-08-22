namespace AgentDmsAdmin.Api.Models;

public class UpdateUserRequest
{
    public string? Username { get; set; }
    public string? Email { get; set; }
    public string? Password { get; set; }
    public List<string>? RoleIds { get; set; }
}