using AgentDmsAdmin.Api.Models;

namespace AgentDmsAdmin.Api.Services;

/// <summary>
/// Service interface for JWT token operations
/// </summary>
public interface IJwtService
{
    /// <summary>
    /// Generates a JWT token for the specified user
    /// </summary>
    /// <param name="user">The user to generate a token for</param>
    /// <returns>JWT token string</returns>
    string GenerateToken(UserDto user);

    /// <summary>
    /// Validates a JWT token and extracts user information
    /// </summary>
    /// <param name="token">The JWT token to validate</param>
    /// <returns>UserDto if token is valid, null otherwise</returns>
    UserDto? ValidateToken(string token);
}