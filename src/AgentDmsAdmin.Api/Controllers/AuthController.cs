using Microsoft.AspNetCore.Mvc;
using AgentDmsAdmin.Api.Models;

namespace AgentDmsAdmin.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    [HttpPost("login")]
    public ActionResult<AuthResponse> Login([FromBody] LoginRequest request)
    {
        // Demo authentication - validate demo credentials
        if (request.Email == "admin@agentdms.com" && request.Password == "admin123")
        {
            var user = new UserDto
            {
                Id = "1",
                Email = request.Email,
                Name = "Admin User",
                Role = "Administrator"
            };

            var token = $"demo-jwt-token-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}";
            var expiresAt = DateTime.UtcNow.AddHours(24).ToString("yyyy-MM-ddTHH:mm:ss.fffZ");

            var response = new AuthResponse
            {
                Token = token,
                User = user,
                ExpiresAt = expiresAt
            };

            return Ok(response);
        }

        return Unauthorized(new { message = "Invalid email or password" });
    }

    [HttpPost("logout")]
    public ActionResult Logout()
    {
        // Dummy logout endpoint for demo authentication
        // In a real implementation, this would invalidate the JWT token
        return Ok(new { message = "Logged out successfully" });
    }

    [HttpGet("me")]
    public ActionResult<UserDto> GetCurrentUser()
    {
        // Return sample user data
        var user = new UserDto
        {
            Id = "1",
            Email = "admin@agentdms.com",
            Name = "Admin User",
            Role = "Administrator"
        };

        return Ok(user);
    }
}