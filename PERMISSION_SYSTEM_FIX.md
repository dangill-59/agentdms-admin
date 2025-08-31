# Permission System Fix - Complete Solution

## Problem Statement
The comment in PR166 identified that the permission system was not following the correct architectural pattern:
> "permissions are assigned in roles- not in projects- projects are assigned roles- users are assigned roles- a user may be assigned multiple roles- a project may have multiple roles- a users permissions within a project are dictated by the project role the user belongs to- this pr doesn't address the proper workflow of user/role/project permissions"

## Root Cause Analysis
1. **Hardcoded Permission Bypass**: User ID 3 (gill.dan2) had a hardcoded bypass granting all permissions
2. **Incorrect Permission Logic**: System was using `CanView/CanEdit/CanDelete` fields in `ProjectRole` instead of proper role-permission relationships
3. **No Intersection Logic**: Multiple role assignments were being handled incorrectly

## Solution Architecture

### Correct Permission Flow
```
User → UserRole → Role → RolePermission → Permission
Project → ProjectRole → Role

User permissions in project = permissions of (User.Roles ∩ Project.Roles)
```

### Implementation Details

#### 1. AuthorizationService.cs Changes
- **Removed** hardcoded user ID 3 bypass in `UserHasPermissionAsync()`
- **Added** `GetUserProjectPermissionsAsync()` method with proper intersection logic:
  ```csharp
  // Get user's roles
  var userRoleIds = await _context.UserRoles.Where(ur => ur.UserId == userId).Select(ur => ur.RoleId).ToListAsync();
  
  // Get project's roles  
  var projectRoleIds = await _context.ProjectRoles.Where(pr => pr.ProjectId == projectId).Select(pr => pr.RoleId).ToListAsync();
  
  // Get intersection
  var effectiveRoleIds = userRoleIds.Intersect(projectRoleIds).ToList();
  
  // Get permissions for effective roles
  var permissions = await _context.RolePermissions.Where(rp => effectiveRoleIds.Contains(rp.RoleId)).Select(rp => rp.Permission.Name).ToListAsync();
  ```

#### 2. DocumentsController.cs Changes
- **Added** AuthorizationService dependency injection
- **Updated** `GetDocuments()` to filter by projects where user has view permissions
- **Added** project permission checks to `DeleteDocument()` and `UpdateDocumentMetadata()`
- **Proper** HTTP 403 responses for permission violations

#### 3. New Models
- **ProjectPermissions.cs**: Model for project-specific permission results

## Test Scenarios

### Scenario 1: Single Role User
- **User**: gill.dan2 with "User" role
- **Role Permissions**: "User" role has "document.view" only
- **Project Setup**: Sample Project has "User" role assigned
- **Result**: CanView=✅, CanEdit=❌, CanDelete=❌

### Scenario 2: Multi-Role Protection  
- **User**: hypothetical user with ["User", "Administrator"] roles
- **Project Setup**: Project only has "User" role assigned
- **Intersection**: ["User"] (Administrator doesn't apply)
- **Result**: Still constrained to User permissions, prevents escalation

## Verification

### Before Fix
```
gill.dan2 permissions:
- Global: ALL (due to hardcoded bypass)
- Project: ALL (due to union logic)
- Result: ❌ Unintended admin privileges
```

### After Fix
```
gill.dan2 permissions:
- Global: document.view only (from User role)
- Project: CanView=true, CanEdit=false, CanDelete=false
- Result: ✅ Properly constrained permissions
```

## Backward Compatibility
- Old `CanView/CanEdit/CanDelete` fields kept in ProjectRole model for admin interfaces
- Critical document operations now use correct role-based logic
- No breaking changes to existing admin functionality

## Files Modified
1. `src/AgentDmsAdmin.Api/Services/AuthorizationService.cs` - Core permission logic
2. `src/AgentDmsAdmin.Api/Services/IAuthorizationService.cs` - Interface update
3. `src/AgentDmsAdmin.Api/Controllers/DocumentsController.cs` - Document operations
4. `src/AgentDmsAdmin.Api/Models/ProjectPermissions.cs` - New model
5. `src/AgentDmsAdmin.Data/Models/ProjectRole.cs` - Added deprecation comments

## Impact
✅ **Fixes permission escalation** - Users can no longer bypass project role constraints  
✅ **Implements proper architecture** - Permissions flow through role-permission relationships  
✅ **Secures document operations** - Edit/delete require both global and project permissions  
✅ **Prevents privilege escalation** - Multi-role users constrained by project role intersection  
✅ **Maintains compatibility** - Admin interfaces continue to work  

## Conclusion
This implementation fully addresses the architectural concerns raised in the PR166 comment by implementing proper role-based project permissions with intersection logic, ensuring that "a users permissions within a project are dictated by the project role the user belongs to."