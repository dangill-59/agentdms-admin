from django.urls import path
from . import views

app_name = 'projects'

urlpatterns = [
    path('', views.get_projects, name='get_projects'),
    path('<int:project_id>/', views.get_project, name='get_project'),
    path('create/', views.create_project, name='create_project'),
    path('<int:project_id>/clone/', views.clone_project, name='clone_project'),
]