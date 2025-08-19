# Permissions and Roles System

## Seeded Data

The AgentDMS Admin system automatically seeds the following data on startup:

### Permissions

The following permissions are automatically created:

| Permission | Description |
|------------|-------------|
| `workspace.admin` | Full administrative access (manage projects, users, roles, settings) |
| `document.view` | View documents |
| `document.edit` | Edit documents |
| `document.delete` | Delete documents |
| `document.print` | Print, email, or download documents |
| `document.annotate` | Annotate documents (add notes, highlights, comments) |

### Roles

#### Super Admin
- **Description**: Super Administrator with all permissions
- **Permissions**: All 6 permissions listed above
- **Users**: `superadmin` user

#### Administrator  
- **Description**: Full system administrator with all permissions
- **Permissions**: None (can be manually assigned)
- **Users**: `admin` user

### Users

#### superadmin
- **Email**: `superadmin@agentdms.com`
- **Password**: `admin123` (bcrypt hashed)
- **Role**: Super Admin
- **Immutable**: Yes - cannot be edited or deleted
- **Purpose**: System super administrator that cannot be accidentally modified

#### admin
- **Email**: `admin@agentdms.com`
- **Password**: `admin123` (bcrypt hashed)
- **Role**: Administrator
- **Immutable**: No - can be edited and deleted
- **Purpose**: Regular administrative user for daily operations

## Immutable User Protection

The `superadmin` user is protected from modification:

### Backend Protection
- API endpoints (`PUT /api/users/{id}` and `DELETE /api/users/{id}`) return HTTP 400 with error message "Cannot edit/delete an immutable user"
- User model includes `IsImmutable` boolean property

### Frontend Protection
- Edit and Delete buttons are hidden for immutable users
- "Protected" label is displayed instead
- Tooltip explains "This user cannot be modified"

## Extending Permissions

To add new permissions:

1. **Add to DataSeeder**: Update `SeedPermissionsAsync()` method in `DataSeeder.cs`
2. **Restart Application**: Permissions are seeded on startup in Development environment
3. **Assign to Roles**: Use the Roles management interface to assign new permissions to existing roles

Example of adding a new permission:

```csharp
new { Name = "report.generate", Description = "Generate system reports" }
```

## API Endpoints

### Users
- `GET /api/users` - List all users (includes `isImmutable` flag)
- `GET /api/users/{id}` - Get specific user
- `POST /api/users` - Create new user
- `PUT /api/users/{id}` - Update user (blocked for immutable users)
- `DELETE /api/users/{id}` - Delete user (blocked for immutable users)

### Permissions
- `GET /api/permissions` - List all permissions
- `POST /api/permissions` - Create new permission
- `PUT /api/permissions/{id}` - Update permission
- `DELETE /api/permissions/{id}` - Delete permission

### Roles
- `GET /api/roles` - List all roles
- `POST /api/roles` - Create new role
- `POST /api/roles/assign-permission` - Assign permission to role
- `DELETE /api/roles/role-permissions/{id}` - Remove permission from role

## Database Schema

### Users Table
- `IsImmutable` (boolean) - Prevents editing/deleting when true

### Permissions Table
- `Name` (string) - Unique permission identifier
- `Description` (string) - Human-readable description

### RolePermissions Table
- Links roles to permissions (many-to-many)

### UserRoles Table  
- Links users to roles (many-to-many)