using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using AgentDmsAdmin.Api.Models;

namespace AgentDmsAdmin.Api.Services;

/// <summary>
/// Service for JWT token generation and validation
/// </summary>
public class JwtService : IJwtService
{
    private readonly IConfiguration _configuration;
    private readonly string _secretKey;
    private readonly string _issuer;
    private readonly string _audience;
    private readonly int _expirationHours;

    public JwtService(IConfiguration configuration)
    {
        _configuration = configuration;
        
        // Use configuration values or defaults for development
        _secretKey = _configuration["Jwt:SecretKey"] ?? "AgentDMS-Development-Secret-Key-Must-Be-At-Least-32-Characters-Long";
        _issuer = _configuration["Jwt:Issuer"] ?? "AgentDMS";
        _audience = _configuration["Jwt:Audience"] ?? "AgentDMS-Users";
        _expirationHours = int.TryParse(_configuration["Jwt:ExpirationHours"], out var hours) ? hours : 24;
    }

    /// <summary>
    /// Generates a JWT token for the specified user
    /// </summary>
    public string GenerateToken(UserDto user)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.ASCII.GetBytes(_secretKey);
        
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Email, user.Email)
        };

        // Add role claims
        foreach (var role in user.Roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role.RoleName));
        }

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddHours(_expirationHours),
            Issuer = _issuer,
            Audience = _audience,
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    /// <summary>
    /// Validates a JWT token and extracts user information
    /// </summary>
    public UserDto? ValidateToken(string token)
    {
        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_secretKey);

            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidIssuer = _issuer,
                ValidateAudience = true,
                ValidAudience = _audience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };

            var principal = tokenHandler.ValidateToken(token, validationParameters, out var validatedToken);

            // Extract user information from claims
            var userId = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var username = principal.FindFirst(ClaimTypes.Name)?.Value;
            var email = principal.FindFirst(ClaimTypes.Email)?.Value;

            if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(username) || string.IsNullOrEmpty(email))
            {
                return null;
            }

            // Extract roles
            var roles = principal.FindAll(ClaimTypes.Role)
                .Select(c => new UserRoleDto { RoleName = c.Value })
                .ToList();

            return new UserDto
            {
                Id = userId,
                Username = username,
                Email = email,
                Roles = roles
            };
        }
        catch
        {
            return null;
        }
    }
}