using Microsoft.AspNetCore.Mvc;
using AgentDmsAdmin.Api.Models;

namespace AgentDmsAdmin.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProjectsController : ControllerBase
{
    [HttpGet]
    public ActionResult<PaginatedResponse<ProjectDto>> GetProjects([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        // Sample project data
        var projects = new List<ProjectDto>
        {
            new ProjectDto
            {
                Id = "1",
                Name = "Sample Project 1",
                Description = "A sample project for testing",
                FileName = "DefaultFilename",
                CreatedAt = "2024-01-01T00:00:00Z",
                ModifiedAt = "2024-01-01T00:00:00Z"
            },
            new ProjectDto
            {
                Id = "2",
                Name = "Document Management System",
                Description = "Main DMS project",
                FileName = "DefaultFilename",
                CreatedAt = "2024-01-02T00:00:00Z",
                ModifiedAt = "2024-01-02T00:00:00Z"
            },
            new ProjectDto
            {
                Id = "3",
                Name = "Enterprise Project",
                Description = "Large scale enterprise system",
                FileName = "DefaultFilename",
                CreatedAt = "2024-01-03T00:00:00Z",
                ModifiedAt = "2024-01-03T00:00:00Z"
            }
        };

        // Calculate pagination
        var totalCount = projects.Count;
        var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);
        var pagedProjects = projects
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        var response = new PaginatedResponse<ProjectDto>
        {
            Data = pagedProjects,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = totalPages
        };

        return Ok(response);
    }
}