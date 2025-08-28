from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone


class BaseEntity(models.Model):
    """
    Abstract base model that provides audit fields for all entities.
    Equivalent to C# BaseEntity class.
    """
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)
    modified_by = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        abstract = True
