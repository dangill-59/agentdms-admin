using Microsoft.EntityFrameworkCore;
using AgentDmsAdmin.Data.Data;
using AgentDmsAdmin.Data.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddDbContext<AgentDmsContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection") 
        ?? "Data Source=agentdms.db"));

builder.Services.AddScoped<DataSeeder>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    // Seed data in development
    using (var scope = app.Services.CreateScope())
    {
        var seeder = scope.ServiceProvider.GetRequiredService<DataSeeder>();
        await seeder.SeedSampleDataAsync();
    }
}

// Uncomment the following line if you have HTTPS configured locally.
// app.UseHttpsRedirection();

// Root endpoint so you don’t get a 404 at /
app.MapGet("/", () => "AgentDMS Admin Service is running.");

// Basic health check endpoint
app.MapGet("/health", () => new { Status = "Healthy", Timestamp = DateTime.UtcNow });

app.Run();