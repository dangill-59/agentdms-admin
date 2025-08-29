from django.db import models
from core.models import BaseEntity
from users.models import User, Role


class Project(BaseEntity):
    """
    Project model for document management projects.
    Equivalent to C# Project entity.
    """
    name = models.CharField(max_length=255)
    description = models.CharField(max_length=1000, null=True, blank=True)
    file_name = models.CharField(max_length=255)  # Default field
    is_active = models.BooleanField(default=True)
    is_archived = models.BooleanField(default=False)

    def __str__(self):
        return self.name


class CustomFieldType(models.TextChoices):
    """
    Enum for custom field types.
    Equivalent to C# CustomFieldType enum.
    """
    TEXT = 'Text', 'Text'
    NUMBER = 'Number', 'Number'
    DATE = 'Date', 'Date'
    BOOLEAN = 'Boolean', 'Boolean'
    LONGTEXT = 'LongText', 'Long Text'
    CURRENCY = 'Currency', 'Currency'
    USERLIST = 'UserList', 'User List'


class CustomField(BaseEntity):
    """
    Custom field definitions for projects.
    Equivalent to C# CustomField entity.
    """
    name = models.CharField(max_length=255)
    description = models.CharField(max_length=500, null=True, blank=True)
    field_type = models.CharField(max_length=20, choices=CustomFieldType.choices)
    is_required = models.BooleanField(default=False)
    is_default = models.BooleanField(default=False)  # For default fields like filename, date created, date modified
    default_value = models.CharField(max_length=500, null=True, blank=True)
    order = models.IntegerField(default=0)  # Field ordering
    role_visibility = models.CharField(max_length=500, default='all')  # Role-based visibility
    user_list_options = models.CharField(max_length=2000, null=True, blank=True)  # JSON for UserList type
    is_removable = models.BooleanField(default=True)  # Whether field can be removed
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='custom_fields')

    def __str__(self):
        return f"{self.project.name} - {self.name}"


class ProjectRole(BaseEntity):
    """
    Role permissions for specific projects.
    Equivalent to C# ProjectRole entity.
    """
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='project_roles')
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='project_roles')
    can_view = models.BooleanField(default=True)
    can_edit = models.BooleanField(default=False)
    can_delete = models.BooleanField(default=False)

    class Meta:
        unique_together = ('project', 'role')

    def __str__(self):
        return f"{self.project.name} - {self.role.name}"
