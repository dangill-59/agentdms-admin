"""
URL configuration for agentdms_admin project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.utils import timezone


def root_view(request):
    """Root endpoint so you don't get a 404 at /"""
    return JsonResponse({'message': 'AgentDMS Admin Service is running.'})


def health_view(request):
    """Basic health check endpoint"""
    return JsonResponse({
        'status': 'Healthy',
        'timestamp': timezone.now().isoformat()
    })


urlpatterns = [
    path('admin/', admin.site.urls),
    path('', root_view, name='root'),
    path('health/', health_view, name='health'),
    path('api/auth/', include('authentication.urls')),
    path('api/projects/', include('projects.urls')),
    # TODO: Add other API routes
    # path('api/documents/', include('documents.urls')),
    # path('api/users/', include('users.urls')),
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
