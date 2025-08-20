using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AgentDmsAdmin.Api.Models;
using AgentDmsAdmin.Data.Data;
using AgentDmsAdmin.Data.Models;

namespace AgentDmsAdmin.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly AgentDmsContext _context;
    private readonly ILogger<UsersController> _logger;

    public UsersController(AgentDmsContext context, ILogger<UsersController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<PaginatedResponse<UserDto>>> GetUsers([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        try
        {
            var totalCount = await _context.Users.CountAsync();
            
            var users = await _context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .OrderByDescending(u => u.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(u => new UserDto
                {
                    Id = u.Id.ToString(),
                    Username = u.Username,
                    Email = u.Email,
                    IsImmutable = u.IsImmutable,
                    Roles = u.UserRoles.Select(ur => new UserRoleDto
                    {
                        Id = ur.Id.ToString(),
                        UserId = ur.UserId.ToString(),
                        RoleId = ur.RoleId.ToString(),
                        RoleName = ur.Role.Name,
                        CreatedAt = ur.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
                    }).ToList()
                })
                .ToListAsync();

            var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

            var response = new PaginatedResponse<UserDto>
            {
                Data = users,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = totalPages
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting users");
            return StatusCode(500, "An error occurred while retrieving users");
        }
    }

    [HttpPost]
    public async Task<ActionResult<UserDto>> CreateUser([FromBody] CreateUserRequest request)
    {
        try
        {
            // Check if username or email already exists
            var existingUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Username == request.Username || u.Email == request.Email);

            if (existingUser != null)
            {
                return BadRequest("Username or email already exists.");
            }

            var user = new User
            {
                Username = request.Username,
                Email = request.Email,
                PasswordHash = request.PasswordHash // In production, this should be hashed
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Assign roles if provided
            var userRoles = new List<UserRoleDto>();
            if (request.RoleIds != null && request.RoleIds.Any())
            {
                foreach (var roleIdStr in request.RoleIds)
                {
                    if (int.TryParse(roleIdStr, out var roleId))
                    {
                        // Check if role exists
                        var role = await _context.Roles.FindAsync(roleId);
                        if (role != null)
                        {
                            // Check if assignment already exists
                            var existingAssignment = await _context.UserRoles
                                .FirstOrDefaultAsync(ur => ur.UserId == user.Id && ur.RoleId == roleId);

                            if (existingAssignment == null)
                            {
                                var userRole = new UserRole
                                {
                                    UserId = user.Id,
                                    RoleId = roleId
                                };

                                _context.UserRoles.Add(userRole);
                                await _context.SaveChangesAsync();

                                userRoles.Add(new UserRoleDto
                                {
                                    Id = userRole.Id.ToString(),
                                    UserId = userRole.UserId.ToString(),
                                    RoleId = userRole.RoleId.ToString(),
                                    RoleName = role.Name,
                                    CreatedAt = userRole.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
                                });
                            }
                        }
                    }
                }
            }

            var userDto = new UserDto
            {
                Id = user.Id.ToString(),
                Username = user.Username,
                Email = user.Email,
                IsImmutable = user.IsImmutable,
                Roles = userRoles
            };

            return CreatedAtAction(nameof(GetUser), new { id = user.Id }, userDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating user");
            return StatusCode(500, "An error occurred while creating the user");
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<UserDto>> GetUser(int id)
    {
        try
        {
            var user = await _context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == id);
            
            if (user == null)
            {
                return NotFound($"User with ID {id} not found.");
            }

            var userDto = new UserDto
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
                    CreatedAt = ur.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
                }).ToList()
            };

            return Ok(userDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user {UserId}", id);
            return StatusCode(500, "An error occurred while retrieving the user");
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<UserDto>> UpdateUser(int id, [FromBody] UpdateUserRequest request)
    {
        try
        {
            var user = await _context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
            {
                return NotFound($"User with ID {id} not found.");
            }

            // Check if user is immutable
            if (user.IsImmutable)
            {
                return BadRequest("Cannot edit an immutable user.");
            }

            // Update username if provided
            if (!string.IsNullOrWhiteSpace(request.Username) && request.Username != user.Username)
            {
                // Check if new username conflicts with existing user
                var existingUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.Username == request.Username && u.Id != id);
                if (existingUser != null)
                {
                    return BadRequest($"Username '{request.Username}' already exists.");
                }
                user.Username = request.Username;
            }

            // Update email if provided
            if (!string.IsNullOrWhiteSpace(request.Email) && request.Email != user.Email)
            {
                // Check if new email conflicts with existing user
                var existingUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email == request.Email && u.Id != id);
                if (existingUser != null)
                {
                    return BadRequest($"Email '{request.Email}' already exists.");
                }
                user.Email = request.Email;
            }

            // Update password if provided
            if (!string.IsNullOrWhiteSpace(request.PasswordHash))
            {
                user.PasswordHash = request.PasswordHash; // In production, this should be hashed
            }

            // Handle role changes if provided
            if (request.RoleIds != null)
            {
                // Convert string role IDs to integers
                var newRoleIds = new List<int>();
                foreach (var roleIdStr in request.RoleIds)
                {
                    if (int.TryParse(roleIdStr, out var roleId))
                    {
                        // Verify role exists
                        if (await _context.Roles.AnyAsync(r => r.Id == roleId))
                        {
                            newRoleIds.Add(roleId);
                        }
                    }
                }

                // Get current role IDs
                var currentRoleIds = user.UserRoles.Select(ur => ur.RoleId).ToList();

                // Find roles to remove (current roles not in new list)
                var rolesToRemove = currentRoleIds.Except(newRoleIds).ToList();

                // Find roles to add (new roles not in current list)
                var rolesToAdd = newRoleIds.Except(currentRoleIds).ToList();

                // Remove roles
                foreach (var roleId in rolesToRemove)
                {
                    var userRole = user.UserRoles.FirstOrDefault(ur => ur.RoleId == roleId);
                    if (userRole != null)
                    {
                        _context.UserRoles.Remove(userRole);
                    }
                }

                // Add new roles
                foreach (var roleId in rolesToAdd)
                {
                    var userRole = new UserRole
                    {
                        UserId = user.Id,
                        RoleId = roleId
                    };
                    _context.UserRoles.Add(userRole);
                }
            }

            await _context.SaveChangesAsync();

            // Reload user with updated roles
            user = await _context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == id);

            var userDto = new UserDto
            {
                Id = user!.Id.ToString(),
                Username = user.Username,
                Email = user.Email,
                IsImmutable = user.IsImmutable,
                Roles = user.UserRoles.Select(ur => new UserRoleDto
                {
                    Id = ur.Id.ToString(),
                    UserId = ur.UserId.ToString(),
                    RoleId = ur.RoleId.ToString(),
                    RoleName = ur.Role.Name,
                    CreatedAt = ur.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
                }).ToList()
            };

            return Ok(userDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user {UserId}", id);
            return StatusCode(500, "An error occurred while updating the user");
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteUser(int id)
    {
        try
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound($"User with ID {id} not found.");
            }

            // Check if user is immutable
            if (user.IsImmutable)
            {
                return BadRequest("Cannot delete an immutable user.");
            }

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting user {UserId}", id);
            return StatusCode(500, "An error occurred while deleting the user");
        }
    }
}