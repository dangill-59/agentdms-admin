using Microsoft.EntityFrameworkCore;
using AgentDmsAdmin.Data.Models;

namespace AgentDmsAdmin.Data.Data;

public class AgentDmsContext : DbContext
{
    public AgentDmsContext(DbContextOptions<AgentDmsContext> options) : base(options)
    {
    }

    public DbSet<Project> Projects { get; set; }
    public DbSet<CustomField> CustomFields { get; set; }
    public DbSet<Document> Documents { get; set; }
    public DbSet<DocumentFieldValue> DocumentFieldValues { get; set; }
    public DbSet<DocumentPage> DocumentPages { get; set; }
    public DbSet<User> Users { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure Project relationships
        modelBuilder.Entity<Project>()
            .HasMany(p => p.Documents)
            .WithOne(d => d.Project)
            .HasForeignKey(d => d.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Project>()
            .HasMany(p => p.CustomFields)
            .WithOne(cf => cf.Project)
            .HasForeignKey(cf => cf.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        // Configure Document relationships
        modelBuilder.Entity<Document>()
            .HasMany(d => d.DocumentFieldValues)
            .WithOne(dfv => dfv.Document)
            .HasForeignKey(dfv => dfv.DocumentId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Document>()
            .HasMany(d => d.DocumentPages)
            .WithOne(dp => dp.Document)
            .HasForeignKey(dp => dp.DocumentId)
            .OnDelete(DeleteBehavior.Cascade);

        // Configure CustomField relationships
        modelBuilder.Entity<CustomField>()
            .HasMany(cf => cf.DocumentFieldValues)
            .WithOne(dfv => dfv.CustomField)
            .HasForeignKey(dfv => dfv.CustomFieldId)
            .OnDelete(DeleteBehavior.Restrict); // Don't cascade delete field values when custom field is deleted

        // Configure indexes for better performance
        modelBuilder.Entity<Document>()
            .HasIndex(d => d.FileName);

        modelBuilder.Entity<DocumentPage>()
            .HasIndex(dp => new { dp.DocumentId, dp.PageNumber })
            .IsUnique();

        modelBuilder.Entity<DocumentFieldValue>()
            .HasIndex(dfv => new { dfv.DocumentId, dfv.CustomFieldId })
            .IsUnique();

        // Configure User entity constraints
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Username)
            .IsUnique();

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        // Configure BaseEntity properties
        // Note: SQLite doesn't support default value SQL expressions like GETUTCDATE()
        // DateTime defaults are handled in code via UpdateTimestamps() method

        // Seed default custom fields
        SeedDefaultFields(modelBuilder);
    }

    public override int SaveChanges()
    {
        UpdateTimestamps();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        UpdateTimestamps();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void UpdateTimestamps()
    {
        var entries = ChangeTracker.Entries<BaseEntity>();

        foreach (var entry in entries)
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = DateTime.UtcNow;
                    entry.Entity.ModifiedAt = DateTime.UtcNow;
                    break;
                case EntityState.Modified:
                    entry.Entity.ModifiedAt = DateTime.UtcNow;
                    break;
            }
        }
    }

    private void SeedDefaultFields(ModelBuilder modelBuilder)
    {
        // Note: In a real-world scenario, you might want to seed these differently
        // or create them programmatically when a project is created
        // This is a basic example showing how default fields could be seeded
        
        // These will be created for each project individually in the business logic
        // rather than as global seed data, but this shows the structure
    }
}