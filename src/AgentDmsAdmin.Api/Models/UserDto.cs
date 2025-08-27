namespace AgentDmsAdmin.Api.Models;

public class UserDto
{
    public string Id { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool IsImmutable { get; set; } = false;
    public List<UserRoleDto> Roles { get; set; } = new List<UserRoleDto>();
    public List<string> Permissions { get; set; } = new List<string>();
}