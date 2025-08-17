# AgentDMS Admin Backend

A .NET 8 solution for managing AgentDMS admin data with Entity Framework Core and SQLite. This backend provides data access and API functionality for managing projects, documents, custom fields, and document indexing.

## Project Structure

```
AgentDmsAdmin/
├── src/
│   ├── AgentDmsAdmin.Data/          # Core data access library
│   │   ├── Models/                  # Entity Framework models
│   │   │   ├── BaseEntity.cs        # Base entity with audit fields
│   │   │   ├── Project.cs           # Project entity
│   │   │   ├── CustomField.cs       # Custom field definitions
│   │   │   ├── Document.cs          # Document metadata
│   │   │   ├── DocumentFieldValue.cs # Document field values
│   │   │   └── DocumentPage.cs      # Document page references
│   │   ├── Data/                    # DbContext and configurations
│   │   │   └── AgentDmsContext.cs   # Main EF DbContext
│   │   ├── Services/                # Business logic services
│   │   │   └── DataSeeder.cs        # Data seeding utilities
│   │   └── Migrations/              # EF Core migrations
│   └── AgentDmsAdmin.Api/           # ASP.NET Core Web API
│       ├── Program.cs               # Application entry point
│       ├── appsettings.json         # Configuration
│       └── ...
├── frontend/                        # React + TypeScript frontend
│   ├── src/
│   │   ├── auth/                    # Authentication context
│   │   ├── components/              # Reusable UI components
│   │   ├── pages/                   # Page components
│   │   ├── services/                # API service layer
│   │   └── types/                   # TypeScript definitions
│   ├── package.json                 # Frontend dependencies
│   └── README.md                    # Frontend documentation
└── AgentDmsAdmin.sln                # Solution file
```

## Core Entities

### Project
- **Purpose**: Represents a document management project
- **Key Fields**: Name, Description, FileName (default field)
- **Relationships**: 
  - One-to-many with Documents
  - One-to-many with CustomFields

### CustomField
- **Purpose**: Defines custom and default fields for projects
- **Key Fields**: Name, FieldType, IsRequired, IsDefault
- **Default Fields**: Filename, Date Created, Date Modified
- **Field Types**: Text, Number, Date, Boolean, LongText

### Document  
- **Purpose**: Represents documents linked to projects
- **Key Fields**: FileName, StoragePath, MimeType, FileSize
- **Relationships**:
  - Many-to-one with Project
  - One-to-many with DocumentFieldValues
  - One-to-many with DocumentPages

### DocumentFieldValue
- **Purpose**: Stores manual/custom index field values for documents
- **Key Fields**: Value
- **Relationships**: Links Document and CustomField

### DocumentPage
- **Purpose**: References per-page images and thumbnails
- **Key Fields**: PageNumber, ImagePath, ThumbnailPath, Width, Height
- **Relationships**: Many-to-one with Document

## Entity Relationships

```
Project (1) ──────── (*) Document
   │                     │
   │                     │
   └── (*) CustomField   └── (*) DocumentFieldValue ── (*) CustomField
                             │
                         Document ── (*) DocumentPage
```

## Setup Instructions

### Prerequisites
- .NET 8.0 SDK or later
- SQLite (included with .NET runtime)
- Visual Studio 2022 or VS Code with C# extension

## Setup Instructions

### Prerequisites
- .NET 8.0 SDK or later
- SQLite (included with .NET runtime)
- Visual Studio 2022 or VS Code with C# extension
- Node.js 18+ and npm (for frontend)

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd agentdms-admin
   ```

2. **Restore packages**
   ```bash
   dotnet restore
   ```

3. **Apply database migrations**
   ```bash
   cd src/AgentDmsAdmin.Api
   dotnet ef database update --project ../AgentDmsAdmin.Data
   ```
   
   This will create the SQLite database file (`agentdms.db`) in the API project directory.

4. **Run the backend API**
   ```bash
   dotnet run --project src/AgentDmsAdmin.Api
   ```

5. **Verify backend setup**
   Navigate to `http://localhost:5267/health` to confirm the API is running.

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   The default configuration should work with the backend running on `http://localhost:5267`.

4. **Start the frontend development server**
   ```bash
   npm run dev
   ```
   
   The frontend will be available at `http://localhost:5173`.

### Full Stack Setup

To run both backend and frontend simultaneously:

1. **Terminal 1 - Backend**
   ```bash
   dotnet run --project src/AgentDmsAdmin.Api
   ```

2. **Terminal 2 - Frontend**
   ```bash
   cd frontend && npm run dev
   ```

3. **Access the application**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:5267`
   - Login with: `admin@agentdms.com` / `admin123`

## Frontend Technologies

The React frontend includes:

### Core Technologies
- **React 19** with TypeScript for type-safe component development
- **Vite** for fast development and optimized production builds
- **React Router v6** for client-side routing with protected routes
- **Tailwind CSS** for modern, responsive styling

### Authentication & Security
- **JWT Authentication** with localStorage token management
- **Protected Routes** with automatic redirect to login
- **Auth Context** for global authentication state
- **Automatic Token Injection** in API requests

### API Integration
- **Axios** HTTP client with interceptors
- **Type-safe API responses** with TypeScript interfaces
- **Error handling** for authentication failures
- **Mock data** for development (easily replaceable with real APIs)

### Development Features
- **Hot Module Replacement** for fast development
- **ESLint** for code quality
- **TypeScript strict mode** for maximum type safety
- **Environment variables** for configuration management

## Database Configuration

This project uses **SQLite** for local development and testing. The database file (`agentdms.db`) is created automatically when migrations are applied.

### Connection String
The default connection string in `appsettings.json` and `appsettings.Development.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=agentdms.db"
  }
}
```

### Development Features
- **Enhanced Logging**: `appsettings.Development.json` includes EF Core command logging for debugging
- **Automatic Data Seeding**: Sample data is automatically created in development environment
- **File-based Database**: Easy to reset by simply deleting the `agentdms.db` file

## Database Management

### Important: Migration Database Targeting
Entity Framework migrations will automatically target the correct SQLite database file (`agentdms.db` in the API directory) based on the configuration in `appsettings.json`. The design-time factory reads the same connection string as the running application to ensure consistency.

### Creating New Migrations
When you modify entity models, create a new migration:

```bash
cd src/AgentDmsAdmin.Api
dotnet ef migrations add <MigrationName> --project ../AgentDmsAdmin.Data
```

### Applying Migrations
```bash
cd src/AgentDmsAdmin.Api
dotnet ef database update --project ../AgentDmsAdmin.Data
```

This will apply migrations to the `agentdms.db` file in the API directory, which is the same database used by the running application.

### Rollback Migrations
```bash
cd src/AgentDmsAdmin.Api
dotnet ef database update <PreviousMigrationName> --project ../AgentDmsAdmin.Data
```

### Verifying Migration Target
To verify that migrations are targeting the correct database:
1. Run the migration commands from the `src/AgentDmsAdmin.Api` directory
2. Check that the `agentdms.db` file is created/updated in that directory
3. The API application should run without schema errors

**Note**: Always run EF commands from the API project directory to ensure the design-time factory can locate the correct configuration files.

## Data Seeding

The solution includes a `DataSeeder` service that:
- Creates default custom fields (Filename, Date Created, Date Modified) for new projects
- Seeds sample data in development environment
- Provides utilities for initializing project data

### Manual Data Seeding
```csharp
using var scope = app.Services.CreateScope();
var seeder = scope.ServiceProvider.GetRequiredService<DataSeeder>();
await seeder.SeedSampleDataAsync();
```

## Default Fields

Each project automatically gets three default custom fields:
1. **Filename** (Text, Required) - Original filename of the document
2. **Date Created** (Date, Required) - When the document was created  
3. **Date Modified** (Date, Required) - When the document was last modified

These are created automatically via the `DataSeeder.CreateDefaultFieldsForProjectAsync()` method.

## Testing Model Relationships

The entities include proper navigation properties and foreign key constraints. Key relationships to test:

1. **Project → Documents**: A project can have multiple documents
2. **Project → CustomFields**: A project defines its own custom fields including defaults
3. **Document → DocumentFieldValues**: Documents have values for custom fields
4. **Document → DocumentPages**: Documents can have multiple page images
5. **CustomField → DocumentFieldValues**: Custom fields are used across multiple documents

## Next Steps

This foundation provides:
- ✅ Entity Framework models with proper relationships
- ✅ Database migrations ready for deployment
- ✅ Seed data logic for default fields
- ✅ ASP.NET Core API project structure
- ✅ React + TypeScript frontend with Vite
- ✅ JWT-based authentication system
- ✅ Protected routes and navigation
- ✅ Responsive UI with Tailwind CSS
- ✅ API service layer with Axios

**Recommended next development steps:**
1. Add API controllers for CRUD operations
2. Implement business logic services
3. Add validation and error handling
4. Implement file upload/storage functionality
5. Add authentication and authorization to backend
6. Connect frontend to real backend APIs (remove mock data)
7. Create unit and integration tests
8. Add logging and monitoring
9. Implement document processing (OCR, thumbnails)

## Security Best Practices

### Authentication & Authorization
- **JWT Token Security**: Tokens are stored in localStorage with automatic expiration handling
- **Protected Routes**: All application routes require authentication except `/login`
- **API Security**: All API requests include Bearer token authentication
- **Session Management**: Invalid or expired tokens trigger automatic logout

### Data Protection
- **Input Validation**: Implement proper validation on all user inputs (both frontend and backend)
- **SQL Injection Prevention**: Use Entity Framework parameterized queries and LINQ
- **XSS Protection**: Sanitize user inputs and use proper content security policies
- **CORS Configuration**: Configure CORS policies appropriately for your deployment environment

### Environment Security
- **Environment Variables**: Store sensitive configuration in environment variables, not code
- **Secret Management**: Never commit API keys, connection strings, or other secrets to source control
- **Database Security**: Use appropriate database authentication and access controls in production
- **HTTPS Only**: Always use HTTPS in production environments

### Development Security
- **Demo Credentials**: Change default demo credentials before production deployment
- **Debug Information**: Disable detailed error messages in production
- **Logging**: Avoid logging sensitive information (passwords, tokens, personal data)
- **Dependencies**: Regularly audit and update dependencies for security vulnerabilities

## Project Hygiene Guidelines

### Code Quality
- **TypeScript**: Use TypeScript strict mode for maximum type safety
- **Linting**: Run ESLint and fix all warnings before committing
- **Code Review**: All changes must go through pull request review process
- **Testing**: Write unit tests for business logic and integration tests for API endpoints

### Git Workflow
- **Branching**: Use feature branches for all changes, never commit directly to main
- **Commit Messages**: Write clear, descriptive commit messages following conventional commits
- **Pull Requests**: Use the provided PR template and complete all checklist items
- **Issue Tracking**: Link PRs to issues using "Fixes #issue-number" format

### Documentation
- **README Updates**: Keep README.md current with any architectural or setup changes
- **CHANGELOG**: Document all notable changes following [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format
- **Code Comments**: Comment complex business logic and architectural decisions
- **API Documentation**: Document API endpoints and data models

### Dependency Management
- **Package Updates**: Regularly update dependencies and test for compatibility
- **Security Audits**: Run `npm audit` and `dotnet list package --vulnerable` regularly
- **Lock Files**: Commit package-lock.json and ensure consistent dependency versions
- **Minimal Dependencies**: Only add dependencies that provide clear value

### Build & Deployment
- **Build Validation**: Ensure all code builds successfully before merging
- **Environment Parity**: Keep development, staging, and production environments as similar as possible
- **Configuration Management**: Use environment-specific configuration files
- **Database Migrations**: Test all database migrations in non-production environments first

### Contributing Guidelines
1. **Fork and Clone**: Fork the repository and clone your fork locally
2. **Create Feature Branch**: Create a descriptive branch name (e.g., `feature/document-upload`, `fix/auth-redirect`)
3. **Make Changes**: Implement your changes following existing code patterns
4. **Write Tests**: Add or update tests to cover your changes
5. **Run Tests**: Ensure all tests pass locally before pushing
6. **Update Documentation**: Update README, CHANGELOG, and inline documentation as needed
7. **Submit PR**: Use the pull request template and request review
8. **Address Feedback**: Respond to review comments and make requested changes

## Configuration

Key configuration options in `appsettings.json`:
- **ConnectionStrings:DefaultConnection** - SQLite database connection string
- **Logging** - Logging configuration
- **AllowedHosts** - Allowed host headers

### Development vs Production
- **Development**: Uses SQLite with enhanced logging and automatic data seeding
- **Production**: Can be configured to use any EF Core supported database provider

## Development Notes

- All entities inherit from `BaseEntity` providing `Id`, `CreatedAt`, and `ModifiedAt` fields
- Timestamps are automatically managed via `SaveChanges` override in code (no database defaults needed)
- Foreign key cascading is configured appropriately (cascade for owned entities, restrict for shared references)
- Indexes are added for performance on commonly queried fields
- The solution uses Entity Framework 9.0 with SQLite provider for development
- SQLite database file (`agentdms.db`) is portable and can be easily backed up or shared

## Database Provider Migration

This project has been migrated from SQL Server to SQLite for improved local development experience:
- **Simplified setup**: No SQL Server installation required
- **Portable database**: Single file database that can be easily shared or backed up
- **Cross-platform**: Works consistently across Windows, macOS, and Linux
- **Faster development**: Instant database creation and reset capabilities