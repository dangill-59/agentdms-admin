using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
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

// Configure JWT Authentication
var jwtKey = builder.Configuration.GetValue<string>("Jwt:SecretKey") ?? "your-very-long-secret-key-that-is-at-least-32-characters-long";
var jwtIssuer = builder.Configuration.GetValue<string>("Jwt:Issuer") ?? "AgentDmsAdmin";
var jwtAudience = builder.Configuration.GetValue<string>("Jwt:Audience") ?? "AgentDmsAdmin";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(jwtKey)),
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// Add controllers support
builder.Services.AddControllers();

// Configure form options for larger file uploads (100MB)
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 100 * 1024 * 1024; // 100MB
    options.ValueLengthLimit = int.MaxValue;
    options.ValueCountLimit = int.MaxValue;
    options.KeyLengthLimit = int.MaxValue;
});

// Configure Kestrel server limits for larger uploads
builder.Services.Configure<Microsoft.AspNetCore.Server.Kestrel.Core.KestrelServerOptions>(options =>
{
    options.Limits.MaxRequestBodySize = 100 * 1024 * 1024; // 100MB
});

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
        await seeder.SeedUser1Async(); // Seed user1@agentdms.com user
        await seeder.SetupDanUserProjectPermissionsAsync(); // Setup project permissions for dan user
        await seeder.SetupAdministratorProjectPermissionsAsync(); // Setup Administrator role permissions for all projects
    }
}

// Uncomment the following line if you have HTTPS configured locally.
// app.UseHttpsRedirection();

// Enable static file serving for uploads
app.UseStaticFiles();

// Configure custom static file serving for uploads directory
var uploadsPath = Path.Combine(app.Environment.WebRootPath ?? app.Environment.ContentRootPath, "uploads");
Directory.CreateDirectory(uploadsPath);

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads"
});

// Enable CORS for frontend requests
app.UseCors("AllowFrontend");

// Enable authentication and authorization middleware
app.UseAuthentication();
app.UseAuthorization();

// Map controllers to /api route
app.MapControllers();

// Root endpoint so you don’t get a 404 at /
app.MapGet("/", () => "AgentDMS Admin Service is running.");

// Basic health check endpoint
app.MapGet("/health", () => new { Status = "Healthy", Timestamp = DateTime.UtcNow });

app.Run();