using Microsoft.AspNetCore.Mvc;
using AgentDmsAdmin.Api.Models;

namespace AgentDmsAdmin.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
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