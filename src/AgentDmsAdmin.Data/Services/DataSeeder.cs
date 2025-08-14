using AgentDmsAdmin.Data.Data;
using AgentDmsAdmin.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace AgentDmsAdmin.Data.Services;

public class DataSeeder
{
    private readonly AgentDmsContext _context;

    public DataSeeder(AgentDmsContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Creates default custom fields for a project: filename, date created, and date modified
    /// </summary>
    /// <param name="projectId">The ID of the project to create default fields for</param>
    /// <returns>A task representing the async operation</returns>
    public async Task CreateDefaultFieldsForProjectAsync(int projectId)
    {
        // Check if project exists
        var project = await _context.Projects.FindAsync(projectId);
        if (project == null)
        {
            throw new ArgumentException($"Project with ID {projectId} not found.", nameof(projectId));
        }

        // Check if default fields already exist
        var existingDefaultFields = await _context.CustomFields
            .Where(cf => cf.ProjectId == projectId && cf.IsDefault)
            .ToListAsync();

        if (existingDefaultFields.Any())
        {
            return; // Default fields already exist
        }

        var defaultFields = new List<CustomField>
        {
            new CustomField
            {
                Name = "Filename",
                Description = "Original filename of the document",
                FieldType = CustomFieldType.Text,
                IsRequired = true,
                IsDefault = true,
                IsRemovable = false,
                Order = 1,
                ProjectId = projectId
            },
            new CustomField
            {
                Name = "Date Created",
                Description = "Date when the document was created",
                FieldType = CustomFieldType.Date,
                IsRequired = true,
                IsDefault = true,
                IsRemovable = false,
                Order = 2,
                ProjectId = projectId
            },
            new CustomField
            {
                Name = "Date Modified",
                Description = "Date when the document was last modified",
                FieldType = CustomFieldType.Date,
                IsRequired = true,
                IsDefault = true,
                IsRemovable = false,
                Order = 3,
                ProjectId = projectId
            }
        };

        _context.CustomFields.AddRange(defaultFields);
        await _context.SaveChangesAsync();
    }

    /// <summary>
    /// Seeds sample data for testing and development
    /// </summary>
    public async Task SeedSampleDataAsync()
    {
        // Create sample project if none exist
        if (!await _context.Projects.AnyAsync())
        {
            var sampleProject = new Project
            {
                Name = "Sample Project",
                Description = "A sample project for testing",
                FileName = "sample-project.dms"
            };

            _context.Projects.Add(sampleProject);
            await _context.SaveChangesAsync();

            // Create default fields for the sample project
            await CreateDefaultFieldsForProjectAsync(sampleProject.Id);

            // Add a custom field
            var customField = new CustomField
            {
                Name = "Category",
                Description = "Document category",
                FieldType = CustomFieldType.Text,
                IsRequired = false,
                IsDefault = false,
                ProjectId = sampleProject.Id
            };

            _context.CustomFields.Add(customField);
            await _context.SaveChangesAsync();
        }
    }
}