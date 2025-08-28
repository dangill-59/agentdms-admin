from django.db import models
from core.models import BaseEntity
from projects.models import Project, CustomField


class Document(BaseEntity):
    """
    Document model for files within projects.
    Equivalent to C# Document entity.
    """
    file_name = models.CharField(max_length=255)
    storage_path = models.CharField(max_length=500)
    mime_type = models.CharField(max_length=100, null=True, blank=True)
    file_size = models.BigIntegerField()
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='documents')

    def __str__(self):
        return f"{self.project.name} - {self.file_name}"


class DocumentFieldValue(BaseEntity):
    """
    Values for custom fields on documents.
    Equivalent to C# DocumentFieldValue entity.
    """
    value = models.TextField(null=True, blank=True)
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='field_values')
    custom_field = models.ForeignKey(CustomField, on_delete=models.CASCADE, related_name='field_values')

    class Meta:
        unique_together = ('document', 'custom_field')

    def __str__(self):
        return f"{self.document.file_name} - {self.custom_field.name}: {self.value}"


class DocumentPage(BaseEntity):
    """
    Page references for documents (for multi-page documents).
    Equivalent to C# DocumentPage entity.
    """
    page_number = models.IntegerField()
    image_path = models.CharField(max_length=500, null=True, blank=True)
    thumbnail_path = models.CharField(max_length=500, null=True, blank=True)
    width = models.IntegerField(null=True, blank=True)
    height = models.IntegerField(null=True, blank=True)
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='pages')

    class Meta:
        unique_together = ('document', 'page_number')
        ordering = ['page_number']

    def __str__(self):
        return f"{self.document.file_name} - Page {self.page_number}"
