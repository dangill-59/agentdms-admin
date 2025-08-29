from django.db import models
from django.contrib.auth.models import AbstractUser
from core.models import BaseEntity


class User(AbstractUser):
    """
    Custom User model extending Django's AbstractUser.
    Equivalent to C# User entity.
    """
    email = models.EmailField(unique=True, max_length=255)
    password_hash = models.CharField(max_length=500)  # For custom password handling
    is_immutable = models.BooleanField(default=False, help_text="Cannot be edited or deleted")
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)
    modified_by = models.CharField(max_length=255, null=True, blank=True)

    # Use email as the unique identifier for authentication
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return f"{self.username} ({self.email})"


class Role(BaseEntity):
    """
    Role model for role-based access control.
    Equivalent to C# Role entity.
    """
    name = models.CharField(max_length=255, unique=True)
    description = models.CharField(max_length=500, null=True, blank=True)

    def __str__(self):
        return self.name


class Permission(BaseEntity):
    """
    Permission model for granular access control.
    Equivalent to C# Permission entity.
    """
    name = models.CharField(max_length=255, unique=True)
    description = models.CharField(max_length=500, null=True, blank=True)

    def __str__(self):
        return self.name


class UserRole(BaseEntity):
    """
    Many-to-many relationship between User and Role.
    Equivalent to C# UserRole entity.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_roles')
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='user_roles')

    class Meta:
        unique_together = ('user', 'role')

    def __str__(self):
        return f"{self.user.username} - {self.role.name}"


class RolePermission(BaseEntity):
    """
    Many-to-many relationship between Role and Permission.
    Equivalent to C# RolePermission entity.
    """
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='role_permissions')
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE, related_name='role_permissions')

    class Meta:
        unique_together = ('role', 'permission')

    def __str__(self):
        return f"{self.role.name} - {self.permission.name}"
