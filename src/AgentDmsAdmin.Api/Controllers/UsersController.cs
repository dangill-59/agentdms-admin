using Microsoft.AspNetCore.Mvc;
using AgentDmsAdmin.Api.Models;

namespace AgentDmsAdmin.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    // MOCK/DEMO CONTROLLER - This is for development/demo purposes only
    // In production, this should be replaced with proper database persistence
    // and user management with proper authentication, validation, and security

    private static readonly List<UserDto> MockUsers = new()
    {
        new UserDto
        {
            Id = "1",
            Username = "admin",
            Email = "admin@agentdms.com"
        },
        new UserDto
        {
            Id = "2",
            Username = "johnmanager",
            Email = "john@agentdms.com"
        },
        new UserDto
        {
            Id = "3",
            Username = "janeuser",
            Email = "jane@agentdms.com"
        }
    };

    private static int _nextId = 4; // For generating new user IDs

    [HttpGet]
    public ActionResult<PaginatedResponse<UserDto>> GetUsers([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        // MOCK IMPLEMENTATION - Replace with real database query
        var totalCount = MockUsers.Count;
        var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);
        
        var pagedUsers = MockUsers
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        var response = new PaginatedResponse<UserDto>
        {
            Data = pagedUsers,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = totalPages
        };

        return Ok(response);
    }

    [HttpPost]
    public ActionResult<UserDto> CreateUser([FromBody] CreateUserRequest request)
    {
        // MOCK IMPLEMENTATION - Replace with real database persistence
        // In production: validate email uniqueness, hash password, validate username, etc.
        
        if (string.IsNullOrWhiteSpace(request.Username) || 
            string.IsNullOrWhiteSpace(request.Email) || 
            string.IsNullOrWhiteSpace(request.PasswordHash))
        {
            return BadRequest("Username, email, and password hash are required.");
        }

        // Check if email already exists (mock validation)
        if (MockUsers.Any(u => u.Email.Equals(request.Email, StringComparison.OrdinalIgnoreCase)))
        {
            return BadRequest("A user with this email already exists.");
        }

        // Check if username already exists (mock validation)
        if (MockUsers.Any(u => u.Username.Equals(request.Username, StringComparison.OrdinalIgnoreCase)))
        {
            return BadRequest("A user with this username already exists.");
        }

        var newUser = new UserDto
        {
            Id = _nextId++.ToString(),
            Username = request.Username.Trim(),
            Email = request.Email.Trim().ToLowerInvariant()
        };

        MockUsers.Add(newUser);

        return CreatedAtAction(nameof(GetUser), new { id = newUser.Id }, newUser);
    }

    [HttpGet("{id}")]
    public ActionResult<UserDto> GetUser(string id)
    {
        // MOCK IMPLEMENTATION - Replace with real database query
        var user = MockUsers.FirstOrDefault(u => u.Id == id);
        
        if (user == null)
        {
            return NotFound($"User with ID {id} not found.");
        }

        return Ok(user);
    }
}