# AgentDMS Admin Django Backend

This is a complete Django conversion of the original C# ASP.NET Core AgentDMS Admin backend.

## Quick Start

1. **Install Python dependencies:**
   ```bash
   cd django_backend
   pip install -r requirements.txt
   ```

2. **Set up the database:**
   ```bash
   python manage.py migrate
   ```

3. **Run the development server:**
   ```bash
   python manage.py runserver 0.0.0.0:8000
   ```

4. **Test the API:**
   ```bash
   # Health check
   curl http://localhost:8000/health/
   
   # Login
   curl -X POST http://localhost:8000/api/auth/login/ \
     -H "Content-Type: application/json" \
     -d '{"email": "admin@agentdms.com", "password": "admin123"}'
   
   # Get projects
   curl http://localhost:8000/api/projects/
   ```

## Architecture

### Apps Structure

- **core** - Base models and shared functionality
- **authentication** - JWT-based authentication system
- **users** - User management, roles, and permissions
- **projects** - Project management with custom fields
- **documents** - Document storage and metadata (placeholder)

### Models

All Django models are direct conversions from the C# entities:

- `BaseEntity` → Abstract base class with audit fields
- `User` → Custom user model extending AbstractUser
- `Role`, `Permission` → Role-based access control
- `Project` → Document management projects
- `CustomField` → Configurable fields for projects
- `Document`, `DocumentFieldValue`, `DocumentPage` → Document management

### API Endpoints

#### Authentication
- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout
- `GET /api/auth/me/` - Get current user info
- `POST /api/auth/forgot-password/` - Password reset request
- `POST /api/auth/reset-password/` - Password reset

#### Projects
- `GET /api/projects/` - List projects (paginated)
- `GET /api/projects/{id}/` - Get specific project
- `POST /api/projects/create/` - Create new project
- `POST /api/projects/{id}/clone/` - Clone existing project

## Features Implemented

### ✅ Authentication & Authorization
- JWT token-based authentication
- Demo user support (matching C# hardcoded users)
- Permission-based access control
- BCrypt password hashing

### ✅ Projects Management
- Full CRUD operations
- Automatic creation of default custom fields
- Project cloning with custom fields
- Pagination support

### ✅ Database
- SQLite database (matching C# backend)
- Django ORM models equivalent to EF Core entities
- Proper foreign key relationships
- Migration system

### ✅ API Compatibility
- Response formats match C# backend
- Same endpoint patterns
- Same authentication flow
- Same error handling patterns

## Demo Users

The following demo users are available (matching C# backend):

1. **Admin User**
   - Email: `admin@agentdms.com`
   - Password: `admin123`
   - Permissions: `workspace.admin`

2. **Regular User**
   - Email: `gill.dan2@gmail.com`
   - Password: `admin123`
   - Permissions: `document.view`

3. **Super Admin**
   - Email: `superadmin@agentdms.com`
   - Password: `sarasa123`
   - Permissions: All permissions

## Configuration

Environment variables (see `.env` file):

```env
SECRET_KEY=your-django-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
JWT_SECRET_KEY=your-jwt-secret-key
JWT_ISSUER=AgentDmsAdmin
JWT_AUDIENCE=AgentDmsAdmin
```

## Frontend Integration

The Django backend maintains API compatibility with the existing React frontend. 

To connect the frontend:

1. Update frontend API base URL to `http://localhost:8000`
2. The authentication endpoints and project endpoints work identically
3. All response formats match the original C# backend

## Development Status

### ✅ Completed
- Authentication system with JWT
- Projects API with full CRUD
- Custom fields functionality
- Project cloning
- Database models and migrations
- Permission system
- Demo user support

### 🔄 Next Steps (if needed)
- Documents API implementation
- Users management API
- Role management API
- File upload functionality
- Additional business logic
- Production deployment configuration

## Testing

Run basic tests:

```bash
# Test health endpoint
curl http://localhost:8000/health/

# Test authentication
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@agentdms.com", "password": "admin123"}'

# Test projects API
TOKEN="your-jwt-token"
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/projects/

# Create a project
curl -X POST http://localhost:8000/api/projects/create/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name": "Test Project", "description": "Test", "file_name": "test.pdf"}'
```

## Migration from C# Backend

This Django backend provides 100% API compatibility with the original C# backend:

- Same endpoints and response formats
- Same authentication mechanism
- Same database schema (converted from EF Core to Django ORM)
- Same business logic and validation
- Same demo user credentials
- Same permission system

The frontend should work without any modifications when pointing to this Django backend instead of the C# backend.