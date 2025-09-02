using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AgentDmsAdmin.Api.Models;
using AgentDmsAdmin.Api.Services;
using AgentDmsAdmin.Data.Data;
using AgentDmsAdmin.Data.Models;
using BCrypt.Net;

namespace AgentDmsAdmin.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AgentDmsContext _context;
    private readonly IJwtService _jwtService;
    private readonly ILogger<AuthController> _logger;
    private readonly IWebHostEnvironment _environment;

    /// <summary>
    /// Initializes a new instance of the AuthController with dependency injection.
    /// </summary>
    /// <param name="context">Database context for user operations</param>
    /// <param name="jwtService">Service for JWT token generation and validation</param>
    /// <param name="logger">Logger for authentication events and diagnostics</param>
    /// <param name="environment">Host environment for environment-specific behaviors</param>
    public AuthController(AgentDmsContext context, IJwtService jwtService, ILogger<AuthController> logger, IWebHostEnvironment environment)
    {
        _context = context;
        _jwtService = jwtService;
        _logger = logger;
        _environment = environment;
    }
    /// <summary>
    /// Authenticates a user using email and password credentials.
    /// Validates credentials against the database and returns JWT token on success.
    /// </summary>
    /// <param name="request">Login credentials containing email and password</param>
    /// <returns>Authentication response with JWT token and user information, or error response</returns>
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        // Log the login attempt (email only, never log passwords)
        _logger.LogInformation("Login attempt for email: {Email}", request.Email);

        try
        {
            // First, try database authentication
            _logger.LogDebug("Attempting database authentication for email: {Email}", request.Email);
            var user = await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                        .ThenInclude(r => r.RolePermissions)
                            .ThenInclude(rp => rp.Permission)
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user != null)
            {
                _logger.LogDebug("User found in database for email: {Email}", request.Email);
                
                // Verify password
                bool passwordMatch = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
                _logger.LogDebug("Password verification result for email {Email}: {PasswordMatch}", request.Email, passwordMatch);

                if (passwordMatch)
                {
                    _logger.LogInformation("Database authentication successful for email: {Email}", request.Email);
                    
                    // Database authentication successful - create UserDto with roles and permissions
                    var userDto = CreateUserDtoWithPermissions(user);

                    // Generate real JWT token
                    var token = _jwtService.GenerateToken(userDto);
                    var expiresAt = DateTime.UtcNow.AddHours(24).ToString("yyyy-MM-ddTHH:mm:ss.fffZ");

                    var response = new AuthResponse
                    {
                        Token = token,
                        User = userDto,
                        ExpiresAt = expiresAt
                    };

                    _logger.LogInformation("JWT token generated successfully for user: {Email}", request.Email);
                    return Ok(response);
                }
                else
                {
                    _logger.LogWarning("Password verification failed for email: {Email}", request.Email);
                    
                    // Return consistent error message for incorrect password
                    var errorMessage = "Invalid email or password";
                    
                    _logger.LogInformation("Returning Unauthorized response for password mismatch. Reason: Incorrect password");
                    return Unauthorized(new { message = errorMessage });
                }
            }
            else
            {
                _logger.LogWarning("User not found in database for email: {Email}", request.Email);
                
                // Return consistent error message for user not found
                var errorMessage = "Invalid email or password";
                
                _logger.LogInformation("Returning Unauthorized response for user not found");
                return Unauthorized(new { message = errorMessage });
            }
        }
        catch (Exception ex)
        {
            // Log the exception with full details for debugging
            _logger.LogError(ex, "An exception occurred during authentication attempt for email: {Email}", request.Email);
            
            // Return generic error message without exposing internal details
            _logger.LogInformation("Returning Internal Server Error response due to exception during authentication");
            return StatusCode(500, new { message = "An error occurred during authentication" });
        }
    }

    /// <summary>
    /// Logs out the current user by invalidating their session.
    /// Note: This is a dummy implementation for demonstration purposes.
    /// In a production system, this would invalidate the JWT token in a token blacklist or revocation store.
    /// </summary>
    /// <returns>Success message indicating logout completion</returns>
    [HttpPost("logout")]
    public ActionResult Logout()
    {
        _logger.LogInformation("User logout requested");
        
        // Dummy logout endpoint for demo authentication
        // In a real implementation, this would invalidate the JWT token
        return Ok(new { message = "Logged out successfully" });
    }

    /// <summary>
    /// Retrieves the current authenticated user's information.
    /// Validates the JWT token and returns user details.
    /// </summary>
    /// <returns>Current user information or unauthorized error</returns>
    [HttpGet("me")]
    public ActionResult<UserDto> GetCurrentUser()
    {
        _logger.LogDebug("Current user information requested");
        
        // Extract the JWT token from the Authorization header
        var authHeader = Request.Headers["Authorization"].FirstOrDefault();
        if (authHeader?.StartsWith("Bearer ") == true)
        {
            var token = authHeader.Substring("Bearer ".Length);
            _logger.LogDebug("JWT token found in Authorization header, validating token");
            
            var user = _jwtService.ValidateToken(token);
            
            if (user != null)
            {
                _logger.LogInformation("JWT token validation successful for user: {Email}", user.Email);
                return Ok(user);
            }
            else
            {
                _logger.LogWarning("JWT token validation failed");
                return Unauthorized(new { message = "Invalid or expired token" });
            }
        }
        else
        {
            _logger.LogDebug("No valid Authorization header found");
            return Unauthorized(new { message = "Authorization token required" });
        }
    }

    /// <summary>
    /// Initiates a password reset process by sending a reset email to the user.
    /// For demo purposes, this endpoint simulates the password reset email sending.
    /// </summary>
    /// <param name="request">Request containing the email address</param>
    /// <returns>Success message indicating reset email was sent</returns>
    [HttpPost("forgot-password")]
    public async Task<ActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        _logger.LogInformation("Password reset request for email: {Email}", request.Email);

        try
        {
            // Check if user exists in database
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user != null)
            {
                _logger.LogInformation("User found in database for password reset: {Email}", request.Email);
                
                // In a real implementation, you would:
                // 1. Generate a secure reset token
                // 2. Store it in the database with an expiration time
                // 3. Send an email with the reset link
                
                // For demo purposes, we'll just log and return success
                _logger.LogInformation("Password reset email would be sent to: {Email}", request.Email);
            }
            else
            {
                // For security, always return success even if user doesn't exist
                // This prevents email enumeration attacks
                _logger.LogWarning("Password reset requested for non-existent user: {Email}", request.Email);
            }

            // Always return success to prevent email enumeration
            return Ok(new { message = "If an account with that email exists, a password reset link has been sent." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing password reset request for email: {Email}", request.Email);
            return StatusCode(500, new { message = "An error occurred while processing your request" });
        }
    }

    /// <summary>
    /// Resets a user's password using a valid reset token.
    /// For demo purposes, this endpoint simulates the password reset process.
    /// </summary>
    /// <param name="request">Request containing the reset token and new password</param>
    /// <returns>Success message indicating password was reset</returns>
    [HttpPost("reset-password")]
    public ActionResult ResetPassword([FromBody] ResetPasswordRequest request)
    {
        _logger.LogInformation("Password reset attempt with token");

        try
        {
            // In a real implementation, you would:
            // 1. Validate the reset token
            // 2. Check if it's not expired
            // 3. Find the associated user
            // 4. Hash the new password
            // 5. Update the user's password in the database
            // 6. Invalidate the reset token

            // For demo purposes, we'll simulate this process
            if (string.IsNullOrEmpty(request.Token) || string.IsNullOrEmpty(request.NewPassword))
            {
                return BadRequest(new { message = "Invalid reset token or password" });
            }

            // Simulate token validation (in reality, you'd validate against database)
            if (request.Token.StartsWith("demo-reset-token-"))
            {
                _logger.LogInformation("Demo password reset successful");
                return Ok(new { message = "Password has been reset successfully" });
            }
            else
            {
                _logger.LogWarning("Invalid reset token provided");
                return BadRequest(new { message = "Invalid or expired reset token" });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing password reset");
            return StatusCode(500, new { message = "An error occurred while resetting your password" });
        }
    }

    /// <summary>
    /// Helper method to create UserDto with permissions from database user entity
    /// </summary>
    private UserDto CreateUserDtoWithPermissions(User user)
    {
        var userPermissions = user.UserRoles
            .SelectMany(ur => ur.Role.RolePermissions)
            .Select(rp => rp.Permission.Name)
            .Distinct()
            .ToList();
            
        return new UserDto
        {
            Id = user.Id.ToString(),
            Username = user.Username,
            Email = user.Email,
            IsImmutable = user.IsImmutable,
            Roles = user.UserRoles.Select(ur => new UserRoleDto
            {
                Id = ur.Id.ToString(),
                UserId = ur.UserId.ToString(),
                RoleId = ur.RoleId.ToString(),
                RoleName = ur.Role.Name,
                CreatedAt = ur.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
            }).ToList(),
            Permissions = userPermissions
        };
    }
}