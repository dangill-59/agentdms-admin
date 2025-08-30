using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using AgentDmsAdmin.Data.Services;
using System.IO;

namespace AgentDmsAdmin.Data.Data;

public class AgentDmsContextFactory : IDesignTimeDbContextFactory<AgentDmsContext>
{
    public AgentDmsContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<AgentDmsContext>();
        
        // Build configuration to read from appsettings.json in the API project
        var basePath = FindApiProjectPath();
        
        var configuration = new ConfigurationBuilder()
            .SetBasePath(basePath)
            .AddJsonFile("appsettings.json", optional: false)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .Build();

        // Use database configuration service to get the proper configuration
        var dbConfigService = new DatabaseConfigurationService(configuration);
        var databaseSettings = dbConfigService.GetDatabaseSettings();
        
        // For SQLite, ensure the database path is relative to the API project directory
        if (databaseSettings.Type.Equals("sqlite", StringComparison.OrdinalIgnoreCase))
        {
            var connectionString = databaseSettings.ConnectionString;
            if (connectionString.StartsWith("Data Source=") && !Path.IsPathRooted(connectionString.Substring(12)))
            {
                var dbFileName = connectionString.Substring(12);
                databaseSettings.ConnectionString = $"Data Source={Path.Combine(basePath, dbFileName)}";
            }
        }

        dbConfigService.ConfigureDbContext(optionsBuilder, databaseSettings);

        return new AgentDmsContext(optionsBuilder.Options);
    }
    
    private string FindApiProjectPath()
    {
        var currentDir = Directory.GetCurrentDirectory();
        
        // If we're in the Data project, go up and find the API project
        var apiPath = Path.Combine(currentDir, "..", "AgentDmsAdmin.Api");
        if (Directory.Exists(apiPath))
        {
            return Path.GetFullPath(apiPath);
        }
        
        // If we're in the API project already
        if (File.Exists(Path.Combine(currentDir, "appsettings.json")))
        {
            return currentDir;
        }
        
        // Search from solution root if we're somewhere else
        var searchDir = currentDir;
        while (searchDir != null && !File.Exists(Path.Combine(searchDir, "AgentDmsAdmin.sln")))
        {
            searchDir = Directory.GetParent(searchDir)?.FullName;
        }
        
        if (searchDir != null)
        {
            apiPath = Path.Combine(searchDir, "src", "AgentDmsAdmin.Api");
            if (Directory.Exists(apiPath))
            {
                return apiPath;
            }
        }
        
        throw new InvalidOperationException("Could not find AgentDmsAdmin.Api project directory. Please run EF commands from the API project directory for best results.");
    }
}