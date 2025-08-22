using Microsoft.EntityFrameworkCore;
using AgentDmsAdmin.Data.Data;
using AgentDmsAdmin.Data.Services;
using AgentDmsAdmin.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddDbContext<AgentDmsContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection") 
        ?? "Data Source=agentdms.db"));

builder.Services.AddScoped<DataSeeder>();

// Add JWT service for authentication
builder.Services.AddScoped<IJwtService, JwtService>();

// Add authorization service
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IAuthorizationService, AuthorizationService>();

// Add controllers support
builder.Services.AddControllers();

// Add CORS policy for frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy => policy
            .WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()
    );
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    // Ensure database is created and seed data in development
    using (var scope = app.Services.CreateScope())
    {
        var context = scope.ServiceProvider.GetRequiredService<AgentDmsContext>();
        await context.Database.EnsureCreatedAsync();
        
        var seeder = scope.ServiceProvider.GetRequiredService<DataSeeder>();
        await seeder.SeedSampleDataAsync();
        await seeder.SeedPermissionsAsync(); // Seed permissions first
        await seeder.SeedSuperAdminUserAsync(); // Seed Super Admin with all permissions
        await seeder.SeedAdminUserAsync(); // Seed regular admin user
        await seeder.SeedGillDanUserAsync(); // Seed gill.dan2@gmail.com user
        await seeder.SetupDanUserProjectPermissionsAsync(); // Setup project permissions for dan user
    }
}

// Uncomment the following line if you have HTTPS configured locally.
// app.UseHttpsRedirection();

// Enable CORS for frontend requests
app.UseCors("AllowFrontend");

// Map controllers to /api route
app.MapControllers();

// Root endpoint so you don’t get a 404 at /
app.MapGet("/", () => "AgentDMS Admin Service is running.");

// Basic health check endpoint
app.MapGet("/health", () => new { Status = "Healthy", Timestamp = DateTime.UtcNow });

app.Run();