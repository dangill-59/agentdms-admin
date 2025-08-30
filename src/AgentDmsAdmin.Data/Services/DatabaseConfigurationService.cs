using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using AgentDmsAdmin.Data.Models;

namespace AgentDmsAdmin.Data.Services;

public interface IDatabaseConfigurationService
{
    string GetConnectionString(DatabaseSettings? databaseSettings = null);
    void ConfigureDbContext(DbContextOptionsBuilder optionsBuilder, DatabaseSettings? databaseSettings = null);
    DatabaseSettings GetDatabaseSettings();
}

public class DatabaseConfigurationService : IDatabaseConfigurationService
{
    private readonly IConfiguration _configuration;

    public DatabaseConfigurationService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public DatabaseSettings GetDatabaseSettings()
    {
        var databaseSettings = new DatabaseSettings();
        _configuration.GetSection("Database").Bind(databaseSettings);

        // Fallback to legacy ConnectionStrings if Database section is not configured
        if (string.IsNullOrEmpty(databaseSettings.Type) || databaseSettings.Type == "sqlite")
        {
            var legacyConnectionString = _configuration.GetConnectionString("DefaultConnection");
            if (!string.IsNullOrEmpty(legacyConnectionString))
            {
                databaseSettings.ConnectionString = legacyConnectionString;
                databaseSettings.Type = "sqlite";
            }
        }

        return databaseSettings;
    }

    public string GetConnectionString(DatabaseSettings? databaseSettings = null)
    {
        databaseSettings ??= GetDatabaseSettings();

        // If a custom connection string is provided, use it
        if (!string.IsNullOrEmpty(databaseSettings.ConnectionString) && 
            databaseSettings.Type.Equals("sqlite", StringComparison.OrdinalIgnoreCase))
        {
            return databaseSettings.ConnectionString;
        }

        // Build connection string based on database type
        return databaseSettings.Type.ToLower() switch
        {
            "postgresql" => BuildPostgreSqlConnectionString(databaseSettings),
            "mysql" => BuildMySqlConnectionString(databaseSettings),
            "sqlserver" => BuildSqlServerConnectionString(databaseSettings),
            "sqlite" => BuildSqliteConnectionString(databaseSettings),
            _ => databaseSettings.ConnectionString ?? "Data Source=agentdms.db"
        };
    }

    public void ConfigureDbContext(DbContextOptionsBuilder optionsBuilder, DatabaseSettings? databaseSettings = null)
    {
        databaseSettings ??= GetDatabaseSettings();
        var connectionString = GetConnectionString(databaseSettings);

        switch (databaseSettings.Type.ToLower())
        {
            case "postgresql":
                optionsBuilder.UseNpgsql(connectionString, options =>
                {
                    if (databaseSettings.Advanced.CommandTimeout > 0)
                        options.CommandTimeout(databaseSettings.Advanced.CommandTimeout);
                });
                break;

            case "mysql":
                optionsBuilder.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString), options =>
                {
                    if (databaseSettings.Advanced.CommandTimeout > 0)
                        options.CommandTimeout(databaseSettings.Advanced.CommandTimeout);
                });
                break;

            case "sqlserver":
                optionsBuilder.UseSqlServer(connectionString, options =>
                {
                    if (databaseSettings.Advanced.CommandTimeout > 0)
                        options.CommandTimeout(databaseSettings.Advanced.CommandTimeout);
                });
                break;

            case "sqlite":
            default:
                optionsBuilder.UseSqlite(connectionString);
                break;
        }
    }

    private string BuildPostgreSqlConnectionString(DatabaseSettings settings)
    {
        var builder = new System.Text.StringBuilder();
        builder.Append($"Host={settings.Host};");
        
        if (settings.Port > 0)
            builder.Append($"Port={settings.Port};");
        
        builder.Append($"Database={settings.DatabaseName};");
        builder.Append($"Username={settings.Username};");
        builder.Append($"Password={settings.Password};");

        if (settings.Advanced.EnableSsl)
            builder.Append("SSL Mode=Require;");

        if (settings.Advanced.ConnectionTimeout > 0)
            builder.Append($"Timeout={settings.Advanced.ConnectionTimeout};");

        if (settings.Advanced.EnableConnectionPooling)
        {
            if (settings.Advanced.MaxPoolSize > 0)
                builder.Append($"Maximum Pool Size={settings.Advanced.MaxPoolSize};");
            
            if (settings.Advanced.MinPoolSize > 0)
                builder.Append($"Minimum Pool Size={settings.Advanced.MinPoolSize};");
        }
        else
        {
            builder.Append("Pooling=false;");
        }

        if (!string.IsNullOrEmpty(settings.Advanced.AdditionalOptions))
            builder.Append($"{settings.Advanced.AdditionalOptions};");

        return builder.ToString().TrimEnd(';');
    }

    private string BuildMySqlConnectionString(DatabaseSettings settings)
    {
        var builder = new System.Text.StringBuilder();
        builder.Append($"Server={settings.Host};");
        
        if (settings.Port > 0)
            builder.Append($"Port={settings.Port};");
        
        builder.Append($"Database={settings.DatabaseName};");
        builder.Append($"Uid={settings.Username};");
        builder.Append($"Pwd={settings.Password};");

        if (settings.Advanced.EnableSsl)
            builder.Append("SslMode=Required;");

        if (settings.Advanced.ConnectionTimeout > 0)
            builder.Append($"Connection Timeout={settings.Advanced.ConnectionTimeout};");

        if (settings.Advanced.EnableConnectionPooling)
        {
            if (settings.Advanced.MaxPoolSize > 0)
                builder.Append($"Maximum Pool Size={settings.Advanced.MaxPoolSize};");
            
            if (settings.Advanced.MinPoolSize > 0)
                builder.Append($"Minimum Pool Size={settings.Advanced.MinPoolSize};");
        }
        else
        {
            builder.Append("Pooling=false;");
        }

        if (!string.IsNullOrEmpty(settings.Advanced.AdditionalOptions))
            builder.Append($"{settings.Advanced.AdditionalOptions};");

        return builder.ToString().TrimEnd(';');
    }

    private string BuildSqlServerConnectionString(DatabaseSettings settings)
    {
        var builder = new System.Text.StringBuilder();
        builder.Append($"Server={settings.Host}");
        
        if (settings.Port > 0)
            builder.Append($",{settings.Port}");
        
        builder.Append($";Database={settings.DatabaseName};");
        builder.Append($"User Id={settings.Username};");
        builder.Append($"Password={settings.Password};");

        if (settings.Advanced.EnableSsl)
            builder.Append("Encrypt=true;");

        if (settings.Advanced.ConnectionTimeout > 0)
            builder.Append($"Connection Timeout={settings.Advanced.ConnectionTimeout};");

        if (settings.Advanced.EnableConnectionPooling)
        {
            if (settings.Advanced.MaxPoolSize > 0)
                builder.Append($"Max Pool Size={settings.Advanced.MaxPoolSize};");
            
            if (settings.Advanced.MinPoolSize > 0)
                builder.Append($"Min Pool Size={settings.Advanced.MinPoolSize};");
        }
        else
        {
            builder.Append("Pooling=false;");
        }

        if (!string.IsNullOrEmpty(settings.Advanced.AdditionalOptions))
            builder.Append($"{settings.Advanced.AdditionalOptions};");

        return builder.ToString().TrimEnd(';');
    }

    private string BuildSqliteConnectionString(DatabaseSettings settings)
    {
        if (!string.IsNullOrEmpty(settings.ConnectionString))
            return settings.ConnectionString;

        var builder = new System.Text.StringBuilder();
        var dbPath = string.IsNullOrEmpty(settings.DatabaseName) ? "agentdms.db" : $"{settings.DatabaseName}.db";
        builder.Append($"Data Source={dbPath}");

        if (!string.IsNullOrEmpty(settings.Advanced.AdditionalOptions))
            builder.Append($";{settings.Advanced.AdditionalOptions}");

        return builder.ToString();
    }
}