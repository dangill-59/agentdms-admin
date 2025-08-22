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
    /// Seeds the initial permissions if they don't exist
    /// </summary>
    public async Task SeedPermissionsAsync()
    {
        var permissions = new[]
        {
            new { Name = "workspace.admin", Description = "Full administrative access (manage projects, users, roles, settings)" },
            new { Name = "document.view", Description = "View documents" },
            new { Name = "document.edit", Description = "Edit documents" },
            new { Name = "document.delete", Description = "Delete documents" },
            new { Name = "document.print", Description = "Print, email, or download documents" },
            new { Name = "document.annotate", Description = "Annotate documents (add notes, highlights, comments)" }
        };

        foreach (var permissionData in permissions)
        {
            var existingPermission = await _context.Permissions
                .FirstOrDefaultAsync(p => p.Name == permissionData.Name);

            if (existingPermission == null)
            {
                var permission = new Permission
                {
                    Name = permissionData.Name,
                    Description = permissionData.Description
                };

                _context.Permissions.Add(permission);
            }
        }

        await _context.SaveChangesAsync();
    }

    /// <summary>
    /// Seeds the Super Admin user with all permissions if it doesn't exist
    /// </summary>
    public async Task SeedSuperAdminUserAsync()
    {
        // Check if super admin user already exists
        var existingSuperAdmin = await _context.Users
            .FirstOrDefaultAsync(u => u.Username == "superadmin");

        if (existingSuperAdmin != null)
        {
            return; // Super Admin user already exists
        }

        // Create the Super Admin user
        var superAdminUser = new User
        {
            Username = "superadmin",
            Email = "superadmin@agentdms.com",
            PasswordHash = "$2a$10$PhXBdV30qTJRoe.EPuZmMOwadN1D0mUq.jROdQDznH7wxbpBdEAta", // bcrypt hash for 'sarasa123'
            IsImmutable = true // Super Admin is immutable
        };

        _context.Users.Add(superAdminUser);
        await _context.SaveChangesAsync();

        // Create Super Admin role if it doesn't exist
        var superAdminRole = await _context.Roles
            .FirstOrDefaultAsync(r => r.Name == "Super Admin");

        if (superAdminRole == null)
        {
            superAdminRole = new Role
            {
                Name = "Super Admin",
                Description = "Super Administrator with all permissions"
            };

            _context.Roles.Add(superAdminRole);
            await _context.SaveChangesAsync();

            // Assign all permissions to Super Admin role
            var allPermissions = await _context.Permissions.ToListAsync();
            foreach (var permission in allPermissions)
            {
                var rolePermission = new RolePermission
                {
                    RoleId = superAdminRole.Id,
                    PermissionId = permission.Id
                };

                _context.RolePermissions.Add(rolePermission);
            }

            await _context.SaveChangesAsync();
        }

        // Assign Super Admin role to super admin user
        var userRole = new UserRole
        {
            UserId = superAdminUser.Id,
            RoleId = superAdminRole.Id
        };

        _context.UserRoles.Add(userRole);
        await _context.SaveChangesAsync();
    }

    /// <summary>
    /// Seeds the default administrator user if one does not exist
    /// </summary>
    public async Task SeedAdminUserAsync()
    {
        // Check if admin user already exists
        var existingAdmin = await _context.Users
            .FirstOrDefaultAsync(u => u.Username == "admin");

        if (existingAdmin != null)
        {
            return; // Admin user already exists
        }

        // Create the default admin user
        var adminUser = new User
        {
            Username = "admin",
            Email = "admin@agentdms.com", // Updated to match frontend demo credentials
            PasswordHash = "$2b$10$G9QZmbY/8I7gQ7lS.YY2zOQgf9U6Qf2iFsdj4A1EV8dS9Zq8KHQHq" // bcrypt hash for 'admin123'
        };

        _context.Users.Add(adminUser);
        await _context.SaveChangesAsync();

        // Create Administrator role if it doesn't exist
        var adminRole = await _context.Roles
            .FirstOrDefaultAsync(r => r.Name == "Administrator");

        if (adminRole == null)
        {
            adminRole = new Role
            {
                Name = "Administrator",
                Description = "Full system administrator with all permissions"
            };

            _context.Roles.Add(adminRole);
            await _context.SaveChangesAsync();
        }

        // Assign Administrator role to admin user
        var userRole = new UserRole
        {
            UserId = adminUser.Id,
            RoleId = adminRole.Id
        };

        _context.UserRoles.Add(userRole);
        await _context.SaveChangesAsync();
    }

    /// <summary>
    /// Seeds the gill.dan2@gmail.com user if one does not exist
    /// </summary>
    public async Task SeedGillDanUserAsync()
    {
        // Check if gill.dan2 user already exists
        var existingUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == "gill.dan2@gmail.com");

        if (existingUser != null)
        {
            return; // User already exists
        }

        // Create the gill.dan2@gmail.com user
        var gillDanUser = new User
        {
            Username = "gill.dan2",
            Email = "gill.dan2@gmail.com",
            PasswordHash = "$2a$11$rVpQmCCHHqEB.se5IpznFuzCkQSaLnuINZ2wKBLuCIm8d/ueDNp0e" // bcrypt hash for 'admin123'
        };

        _context.Users.Add(gillDanUser);
        await _context.SaveChangesAsync();

        // Get or create Administrator role
        var adminRole = await _context.Roles
            .FirstOrDefaultAsync(r => r.Name == "Administrator");

        if (adminRole == null)
        {
            adminRole = new Role
            {
                Name = "Administrator",
                Description = "Full system administrator with all permissions"
            };

            _context.Roles.Add(adminRole);
            await _context.SaveChangesAsync();
        }

        // Assign Administrator role to gill.dan2 user
        var userRole = new UserRole
        {
            UserId = gillDanUser.Id,
            RoleId = adminRole.Id
        };

        _context.UserRoles.Add(userRole);
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