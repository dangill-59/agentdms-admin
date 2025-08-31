# Permission Fix Summary

## Problem Solved

The gill.dan2 user belonged to 2 roles (User and Administrator) and was receiving the union of all permissions from both roles, which gave them elevated privileges within projects beyond what was intended.

## Solution Implemented

### 1. **Fixed Global Permission Logic**
- Removed hardcoded special case for user ID 3 in `AuthorizationService.UserHasPermissionAsync`
- Global permissions still use union logic (appropriate for workspace-level permissions)

### 2. **Implemented Intersection-Based Project Permissions**
- Added `GetUserProjectPermissionsAsync` method that uses intersection logic
- Users can only perform actions that ALL their assigned roles allow within a project
- Created `ProjectPermissions` model to represent constrained permissions

### 3. **Updated DocumentsController**
- Added project permission checks to edit and delete operations  
- Added project filtering for document listing (non-admin users)
- Proper HTTP 403 error responses with clear messages

## Before vs After

### Before Fix:
```
gill.dan2 user with Administrator + User roles:
- Global permissions: All (workspace.admin, document.edit, document.delete, etc.)
- Project permissions: Union logic → CanView=True, CanEdit=True, CanDelete=True
- Result: User could edit/delete documents despite User role restrictions
```

### After Fix:
```
gill.dan2 user with Administrator + User roles:
- Global permissions: All (workspace.admin, document.edit, document.delete, etc.) 
- Project permissions: Intersection logic → CanView=True, CanEdit=False, CanDelete=False
- Result: User can only view documents, edit/delete operations blocked with 403
```

## Verification

✅ **Global permissions work correctly** - User has admin permissions for workspace management
✅ **Project permissions are constrained** - User limited to what ALL roles allow
✅ **Document operations enforced** - Edit/delete blocked with proper error messages
✅ **View operations filtered** - Users only see documents from accessible projects

## Key Changes Made

1. **AuthorizationService.cs**
   - Removed hardcoded user ID 3 special case
   - Added `GetUserProjectPermissionsAsync` with intersection logic

2. **IAuthorizationService.cs** 
   - Added interface method for project permissions

3. **ProjectPermissions.cs**
   - New model for project-specific permission results

4. **DocumentsController.cs**
   - Injected AuthorizationService dependency
   - Added project permission checks to edit/delete methods
   - Added project filtering to document listing
   - Fixed error handling for proper HTTP responses

The fix ensures that "User permissions within roles are limited to the role permissions" as requested in the problem statement.