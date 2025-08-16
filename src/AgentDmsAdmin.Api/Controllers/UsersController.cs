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
            Name = "Admin User",
            Email = "admin@agentdms.com",
            Role = "Administrator"
        },
        new UserDto
        {
            Id = "2",
            Name = "John Manager",
            Email = "john@agentdms.com",
            Role = "Manager"
        },
        new UserDto
        {
            Id = "3",
            Name = "Jane User",
            Email = "jane@agentdms.com",
            Role = "User"
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
        // In production: validate email uniqueness, hash password, validate role, etc.
        
        if (string.IsNullOrWhiteSpace(request.Name) || 
            string.IsNullOrWhiteSpace(request.Email) || 
            string.IsNullOrWhiteSpace(request.Role))
        {
            return BadRequest("Name, email, and role are required.");
        }

        // Check if email already exists (mock validation)
        if (MockUsers.Any(u => u.Email.Equals(request.Email, StringComparison.OrdinalIgnoreCase)))
        {
            return BadRequest("A user with this email already exists.");
        }

        var newUser = new UserDto
        {
            Id = _nextId++.ToString(),
            Name = request.Name.Trim(),
            Email = request.Email.Trim().ToLowerInvariant(),
            Role = request.Role.Trim()
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