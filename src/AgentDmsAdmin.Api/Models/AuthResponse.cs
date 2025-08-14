namespace AgentDmsAdmin.Api.Models;

public class AuthResponse
{
    public string Token { get; set; } = string.Empty;
    public UserDto User { get; set; } = new();
    public string ExpiresAt { get; set; } = string.Empty;
}