using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AgentDmsAdmin.Api.Models;
using AgentDmsAdmin.Api.Services;
using AgentDmsAdmin.Data.Data;
using BCrypt.Net;

namespace AgentDmsAdmin.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AgentDmsContext _context;
    private readonly IJwtService _jwtService;

    public AuthController(AgentDmsContext context, IJwtService jwtService)
    {
        _context = context;
        _jwtService = jwtService;
    }
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        try
        {
            // First, try database authentication
            var user = await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user != null && BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                // Database authentication successful - create UserDto with roles
                var userDto = new UserDto
                {
                    Id = user.Id.ToString(),
                    Username = user.Username,
                    Email = user.Email,
                    Roles = user.UserRoles.Select(ur => new UserRoleDto
                    {
                        Id = ur.Id.ToString(),
                        UserId = ur.UserId.ToString(),
                        RoleId = ur.RoleId.ToString(),
                        RoleName = ur.Role.Name,
                        CreatedAt = ur.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
                    }).ToList()
                };

                // Generate real JWT token
                var token = _jwtService.GenerateToken(userDto);
                var expiresAt = DateTime.UtcNow.AddHours(24).ToString("yyyy-MM-ddTHH:mm:ss.fffZ");

                var response = new AuthResponse
                {
                    Token = token,
                    User = userDto,
                    ExpiresAt = expiresAt
                };

                return Ok(response);
            }

            // Fallback to demo authentication for development
            if (request.Email == "admin@agentdms.com" && request.Password == "admin123")
            {
                var demoUser = new UserDto
                {
                    Id = "1",
                    Username = "admin",
                    Email = request.Email
                };

                // Generate real JWT token for demo user too
                var demoToken = _jwtService.GenerateToken(demoUser);
                var demoExpiresAt = DateTime.UtcNow.AddHours(24).ToString("yyyy-MM-ddTHH:mm:ss.fffZ");

                var demoResponse = new AuthResponse
                {
                    Token = demoToken,
                    User = demoUser,
                    ExpiresAt = demoExpiresAt
                };

                return Ok(demoResponse);
            }

            return Unauthorized(new { message = "Invalid email or password" });
        }
        catch (Exception)
        {
            // Log the exception in a real application
            return StatusCode(500, new { message = "An error occurred during authentication" });
        }
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
        // Extract the JWT token from the Authorization header
        var authHeader = Request.Headers["Authorization"].FirstOrDefault();
        if (authHeader?.StartsWith("Bearer ") == true)
        {
            var token = authHeader.Substring("Bearer ".Length);
            var user = _jwtService.ValidateToken(token);
            
            if (user != null)
            {
                return Ok(user);
            }
        }

        // Fallback to sample user data for demo purposes
        var demoUser = new UserDto
        {
            Id = "1",
            Username = "admin",
            Email = "admin@agentdms.com"
        };

        return Ok(demoUser);
    }
}