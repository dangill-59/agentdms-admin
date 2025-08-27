using Microsoft.EntityFrameworkCore;
using AgentDmsAdmin.Data.Data;
using AgentDmsAdmin.Data.Models;

namespace AgentDmsAdmin.Api.Scripts;

public class SeedSampleDocuments
{
    public static async Task SeedDocuments(AgentDmsContext context)
    {
        // Check if documents already exist
        if (await context.Documents.AnyAsync())
        {
            Console.WriteLine("Documents already exist. Skipping seeding.");
            return;
        }

        // Get all projects
        var projects = await context.Projects.ToListAsync();
        if (!projects.Any())
        {
            Console.WriteLine("No projects found. Cannot seed documents.");
            return;
        }

        // Create sample documents for each project
        var allDocuments = new List<Document>();
        
        foreach (var project in projects)
        {
            var projectDocuments = new List<Document>
            {
                new Document
                {
                    ProjectId = project.Id,
                    FileName = $"Invoice_ABC123_{project.Name}.pdf",
                    StoragePath = $"/uploads/invoice_abc123_{project.Id}.pdf",
                    MimeType = "application/pdf",
                    FileSize = 245760, // 240 KB
                    CreatedAt = DateTime.UtcNow.AddDays(-30),
                    ModifiedAt = DateTime.UtcNow.AddDays(-30)
                },
                new Document
                {
                    ProjectId = project.Id,
                    FileName = $"Receipt_XYZ456_{project.Name}.pdf",
                    StoragePath = $"/uploads/receipt_xyz456_{project.Id}.pdf",
                    MimeType = "application/pdf",
                    FileSize = 1048576, // 1 MB
                    CreatedAt = DateTime.UtcNow.AddDays(-25),
                    ModifiedAt = DateTime.UtcNow.AddDays(-25)
                },
                new Document
                {
                    ProjectId = project.Id,
                    FileName = $"PO_DEF789_{project.Name}.pdf",
                    StoragePath = $"/uploads/po_def789_{project.Id}.pdf",
                    MimeType = "application/pdf",
                    FileSize = 512000, // 500 KB
                    CreatedAt = DateTime.UtcNow.AddDays(-20),
                    ModifiedAt = DateTime.UtcNow.AddDays(-20)
                }
            };
            
            allDocuments.AddRange(projectDocuments);
        }

        await context.Documents.AddRangeAsync(allDocuments);
        await context.SaveChangesAsync();

        Console.WriteLine($"Successfully seeded {allDocuments.Count} sample documents across {projects.Count} projects.");
    }
}