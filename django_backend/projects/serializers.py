from rest_framework import serializers
from .models import Project, CustomField, ProjectRole


class CustomFieldSerializer(serializers.ModelSerializer):
    """
    Serializer for CustomField model.
    Equivalent to C# CustomField entity serialization.
    """
    class Meta:
        model = CustomField
        fields = [
            'id', 'name', 'description', 'field_type', 'is_required', 
            'is_default', 'default_value', 'order', 'role_visibility',
            'user_list_options', 'is_removable', 'created_at', 'modified_at'
        ]


class ProjectSerializer(serializers.ModelSerializer):
    """
    Serializer for Project model.
    Equivalent to C# ProjectDto.
    """
    custom_fields = CustomFieldSerializer(many=True, read_only=True)
    
    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'file_name', 'is_active', 
            'is_archived', 'created_at', 'modified_at', 'modified_by',
            'custom_fields'
        ]

    def to_representation(self, instance):
        """Convert to match C# ProjectDto format"""
        data = super().to_representation(instance)
        # Convert datetime to match C# format
        if data['created_at']:
            data['created_at'] = instance.created_at.strftime("%Y-%m-%dT%H:%M:%SZ")
        if data['modified_at']:
            data['modified_at'] = instance.modified_at.strftime("%Y-%m-%dT%H:%M:%SZ")
        # Convert id to string to match C# format
        data['id'] = str(data['id'])
        return data


class ProjectCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new projects.
    """
    class Meta:
        model = Project
        fields = ['name', 'description', 'file_name']


class PaginatedResponseSerializer(serializers.Serializer):
    """
    Serializer for paginated responses.
    Equivalent to C# PaginatedResponse<T>.
    """
    data = serializers.ListField()
    total_count = serializers.IntegerField()
    page = serializers.IntegerField()
    page_size = serializers.IntegerField()
    total_pages = serializers.IntegerField()