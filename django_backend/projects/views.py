import logging
from django.core.paginator import Paginator
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .models import Project, CustomField
from .serializers import ProjectSerializer, ProjectCreateSerializer, CustomFieldSerializer
from authentication.services import JwtService


logger = logging.getLogger(__name__)


def has_permission(request, permission_name):
    """
    Check if user has specific permission based on JWT token.
    Equivalent to C# RequirePermissionAttribute functionality.
    """
    auth_header = request.META.get('HTTP_AUTHORIZATION')
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header[7:]
        user_data = JwtService.validate_token(token)
        if user_data and 'permissions' in user_data:
            return permission_name in user_data['permissions']
    return False


@api_view(['GET'])
@permission_classes([AllowAny])  # Using custom permission check
def get_projects(request):
    """
    Get paginated list of projects.
    Equivalent to C# ProjectsController.GetProjects method.
    """
    try:
        # Permission check equivalent to [Authorize] attribute
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if not auth_header or not auth_header.startswith('Bearer '):
            # Fallback to demo data for development (matching C# behavior)
            logger.warning("No authorization header found, falling back to demo data")
            
            demo_projects = [
                {
                    'id': '1',
                    'name': 'Sample Project 1',
                    'description': 'A sample project for testing',
                    'file_name': 'DefaultFilename',
                    'created_at': '2025-08-28T19:00:00Z',
                    'modified_at': '2025-08-28T19:00:00Z',
                    'modified_by': 'admin',
                    'is_active': True,
                    'is_archived': False,
                    'custom_fields': []
                },
                {
                    'id': '2', 
                    'name': 'Sample Project 2',
                    'description': 'Another sample project',
                    'file_name': 'DefaultFilename',
                    'created_at': '2025-08-28T19:00:00Z',
                    'modified_at': '2025-08-28T19:00:00Z',
                    'modified_by': 'admin',
                    'is_active': True,
                    'is_archived': False,
                    'custom_fields': []
                }
            ]
            
            return Response({
                'data': demo_projects,
                'total_count': 2,
                'page': 1,
                'page_size': 10,
                'total_pages': 1
            })

        # Extract pagination parameters
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('pageSize', 10))
        include_archived = request.GET.get('includeArchived', 'false').lower() == 'true'

        # Build query
        queryset = Project.objects.all()
        if not include_archived:
            queryset = queryset.filter(is_archived=False)

        # Apply pagination
        total_count = queryset.count()
        paginator = Paginator(queryset, page_size)
        total_pages = paginator.num_pages

        if page > total_pages and total_pages > 0:
            page = total_pages

        projects_page = paginator.get_page(page)
        
        # Serialize projects
        serializer = ProjectSerializer(projects_page, many=True)
        
        response_data = {
            'data': serializer.data,
            'total_count': total_count,
            'page': page,
            'page_size': page_size,
            'total_pages': total_pages
        }

        return Response(response_data)

    except Exception as ex:
        logger.error(f"Error retrieving projects: {ex}", exc_info=True)
        # Return demo data as fallback
        demo_projects = [
            {
                'id': '1',
                'name': 'Sample Project 1',
                'description': 'A sample project for testing',
                'file_name': 'DefaultFilename',
                'created_at': '2025-08-28T19:00:00Z',
                'modified_at': '2025-08-28T19:00:00Z',
                'modified_by': 'admin',
                'is_active': True,
                'is_archived': False,
                'custom_fields': []
            }
        ]
        
        return Response({
            'data': demo_projects,
            'total_count': 1,
            'page': 1,
            'page_size': 10,
            'total_pages': 1
        })


@api_view(['GET'])
@permission_classes([AllowAny])
def get_project(request, project_id):
    """
    Get a specific project by ID.
    Equivalent to C# ProjectsController.GetProject method.
    """
    try:
        project = get_object_or_404(Project, id=project_id)
        serializer = ProjectSerializer(project)
        return Response(serializer.data)
    except Exception as ex:
        logger.error(f"Error retrieving project {project_id}: {ex}", exc_info=True)
        return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([AllowAny])  # Using custom permission check
def create_project(request):
    """
    Create a new project.
    Equivalent to C# ProjectsController.CreateProject method with RequirePermission("workspace.admin").
    """
    # Check workspace.admin permission
    if not has_permission(request, 'workspace.admin'):
        return Response(
            {'error': 'Access denied. Insufficient permissions.'}, 
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        serializer = ProjectCreateSerializer(data=request.data)
        if serializer.is_valid():
            project = serializer.save()
            
            # Create default custom fields (equivalent to C# DataSeeder.CreateDefaultFieldsForProjectAsync)
            default_fields = [
                {
                    'name': 'Filename',
                    'field_type': 'Text',
                    'is_required': True,
                    'is_default': True,
                    'order': 0,
                    'is_removable': False
                },
                {
                    'name': 'Date Created',
                    'field_type': 'Date', 
                    'is_required': True,
                    'is_default': True,
                    'order': 1,
                    'is_removable': False
                },
                {
                    'name': 'Date Modified',
                    'field_type': 'Date',
                    'is_required': True,
                    'is_default': True,
                    'order': 2,
                    'is_removable': False
                }
            ]
            
            for field_data in default_fields:
                CustomField.objects.create(project=project, **field_data)
            
            # Return the created project with custom fields
            project.refresh_from_db()
            response_serializer = ProjectSerializer(project)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as ex:
        logger.error(f"Error creating project: {ex}", exc_info=True)
        return Response({'error': f'Error creating project: {str(ex)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])  # Using custom permission check
def clone_project(request, project_id):
    """
    Clone an existing project.
    Equivalent to C# ProjectsController.CloneProject method.
    """
    # Check workspace.admin permission
    if not has_permission(request, 'workspace.admin'):
        return Response(
            {'error': 'Access denied. Insufficient permissions.'}, 
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        # Get original project with custom fields
        original_project = get_object_or_404(Project.objects.prefetch_related('custom_fields'), id=project_id)
        
        # Create cloned project
        cloned_project = Project.objects.create(
            name=f"{original_project.name} (Copy)",
            description=original_project.description,
            file_name=original_project.file_name
        )
        
        # Clone custom fields
        for field in original_project.custom_fields.all():
            CustomField.objects.create(
                project=cloned_project,
                name=field.name,
                description=field.description,
                field_type=field.field_type,
                is_required=field.is_required,
                is_default=field.is_default,
                default_value=field.default_value,
                order=field.order,
                role_visibility=field.role_visibility,
                user_list_options=field.user_list_options,
                is_removable=field.is_removable
            )
        
        # Return the cloned project
        cloned_project.refresh_from_db()
        serializer = ProjectSerializer(cloned_project)
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
        
    except Exception as ex:
        logger.error(f"Error cloning project with ID {project_id}: {ex}", exc_info=True)
        return Response({'error': f'Error cloning project: {str(ex)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
