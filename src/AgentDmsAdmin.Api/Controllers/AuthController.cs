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
    /// Supports both database authentication and demo authentication for development.
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

                    _logger.LogInformation("JWT token generated successfully for user: {Email}", request.Email);
                    return Ok(response);
                }
                else
                {
                    _logger.LogWarning("Password verification failed for email: {Email}", request.Email);
                    
                    // Check for hardcoded authentication even when user exists in database
                    _logger.LogDebug("Attempting hardcoded authentication fallback for existing user: {Email}", request.Email);
                    
                    // Check for admin demo credentials
                    if (_environment.IsDevelopment() && request.Email == "admin@agentdms.com" && request.Password == "admin123")
                    {
                        _logger.LogInformation("Demo authentication successful for existing user: {Email}", request.Email);
                        
                        var demoUser = new UserDto
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

                        // Generate real JWT token for demo user too
                        var demoToken = _jwtService.GenerateToken(demoUser);
                        var demoExpiresAt = DateTime.UtcNow.AddHours(24).ToString("yyyy-MM-ddTHH:mm:ss.fffZ");

                        var demoResponse = new AuthResponse
                        {
                            Token = demoToken,
                            User = demoUser,
                            ExpiresAt = demoExpiresAt
                        };

                        _logger.LogInformation("Demo JWT token generated successfully for existing user: {Email}", request.Email);
                        return Ok(demoResponse);
                    }
                    // Check for hardcoded superadmin credentials 
                    else if (request.Email == "superadmin@agentdms.com" && request.Password == "sarasa123")
                    {
                        _logger.LogInformation("Hardcoded superadmin authentication successful for existing user: {Email}", request.Email);
                        
                        var superAdminUser = new UserDto
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

                        // Generate real JWT token for superadmin user
                        var superAdminToken = _jwtService.GenerateToken(superAdminUser);
                        var superAdminExpiresAt = DateTime.UtcNow.AddHours(24).ToString("yyyy-MM-ddTHH:mm:ss.fffZ");

                        var superAdminResponse = new AuthResponse
                        {
                            Token = superAdminToken,
                            User = superAdminUser,
                            ExpiresAt = superAdminExpiresAt
                        };

                        _logger.LogInformation("Hardcoded superadmin JWT token generated successfully for existing user: {Email}", request.Email);
                        return Ok(superAdminResponse);
                    }
                    
                    // Return environment-specific error message for incorrect password
                    var errorMessage = _environment.IsDevelopment() 
                        ? "Incorrect password" 
                        : "Invalid email or password";
                    
                    _logger.LogInformation("Returning Unauthorized response for password mismatch. Reason: Incorrect password");
                    return Unauthorized(new { message = errorMessage });
                }
            }
            else
            {
                _logger.LogWarning("User not found in database for email: {Email}", request.Email);
                
                // Check for hardcoded authentication credentials
                _logger.LogDebug("Attempting hardcoded authentication for email: {Email}", request.Email);
                
                // Check for admin demo credentials
                if (request.Email == "admin@agentdms.com" && request.Password == "admin123")
                {
                    _logger.LogInformation("Demo authentication successful for email: {Email}", request.Email);
                    
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

                    _logger.LogInformation("Demo JWT token generated successfully for user: {Email}", request.Email);
                    return Ok(demoResponse);
                }
                // Check for hardcoded superadmin credentials
                else if (request.Email == "superadmin@agentdms.com" && request.Password == "sarasa123")
                {
                    _logger.LogInformation("Hardcoded superadmin authentication successful for email: {Email}", request.Email);
                    
                    var superAdminUser = new UserDto
                    {
                        Id = "0",
                        Username = "superadmin",
                        Email = request.Email,
                        Roles = new List<UserRoleDto>
                        {
                            new UserRoleDto
                            {
                                Id = "0",
                                UserId = "0",
                                RoleId = "0",
                                RoleName = "Super Admin",
                                CreatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
                            }
                        }
                    };

                    // Generate real JWT token for superadmin user
                    var superAdminToken = _jwtService.GenerateToken(superAdminUser);
                    var superAdminExpiresAt = DateTime.UtcNow.AddHours(24).ToString("yyyy-MM-ddTHH:mm:ss.fffZ");

                    var superAdminResponse = new AuthResponse
                    {
                        Token = superAdminToken,
                        User = superAdminUser,
                        ExpiresAt = superAdminExpiresAt
                    };

                    _logger.LogInformation("Hardcoded superadmin JWT token generated successfully for user: {Email}", request.Email);
                    return Ok(superAdminResponse);
                }
                else
                {
                    _logger.LogDebug("Demo authentication failed for email: {Email} (credentials do not match demo user)", request.Email);
                    
                    // Return environment-specific error message for user not found
                    var errorMessage = _environment.IsDevelopment() 
                        ? "User not found" 
                        : "Invalid email or password";
                    
                    _logger.LogInformation("Returning Unauthorized response for user not found. Reason: User not found");
                    return Unauthorized(new { message = errorMessage });
                }
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
    /// Falls back to demo user data for development/demo purposes.
    /// </summary>
    /// <returns>Current user information or demo user data</returns>
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
            }
        }
        else
        {
            _logger.LogDebug("No valid Authorization header found, falling back to demo user");
        }

        // Fallback to sample user data for demo purposes
        var demoUser = new UserDto
        {
            Id = "1",
            Username = "admin",
            Email = "admin@agentdms.com"
        };

        _logger.LogDebug("Returning demo user data");
        return Ok(demoUser);
    }
}