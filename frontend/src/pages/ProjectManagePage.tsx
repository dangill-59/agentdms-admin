import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type { Project } from '../types/api';
import { projectService } from '../services/projects';
import Header from '../components/Header';
import ProjectRoleManagement from '../components/ProjectRoleManagement';
import { useAuth } from '../hooks/useAuth';
import { userHasPermission } from '../utils/userHelpers';

const ProjectManagePage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'roles' | 'actions'>('overview');
  const [isProcessing, setIsProcessing] = useState(false);

  const isAdmin = userHasPermission(user, 'workspace.admin');

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) {
        navigate('/projects');
        return;
      }

      try {
        setIsLoading(true);
        setError('');
        const projectData = await projectService.getProject(projectId);
        setProject(projectData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load project');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [projectId, navigate]);

  const handleRoleChange = () => {
    // Refresh project data to update role display
    if (projectId) {
      projectService.getProject(projectId).then(setProject).catch(console.error);
    }
  };


  const handleManageFields = () => {
    navigate(`/projects/${project?.id}/fields`);
  };

  const handleEditProject = () => {
    // Navigate back to projects page with edit modal
    navigate('/projects', { state: { editProject: project } });
  };

  const handleCloneProject = async () => {
    if (!project || isProcessing) return;

    if (!confirm(`Are you sure you want to clone the project "${project.name}"?`)) {
      return;
    }

    try {
      setIsProcessing(true);
      // We'll need to implement this in the parent projects page
      // For now, navigate back with a signal to clone
      navigate('/projects', { state: { cloneProject: project } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clone project');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleArchiveProject = async () => {
    if (!project || isProcessing) return;

    const action = project.isArchived ? 'restore' : 'archive';
    if (!confirm(`Are you sure you want to ${action} this project?`)) {
      return;
    }

    try {
      setIsProcessing(true);
      await projectService.archiveProject(project.id, !project.isArchived);
      const updatedProject = await projectService.getProject(project.id);
      setProject(updatedProject);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} project`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!project || isProcessing) return;

    if (!confirm('Are you sure you want to permanently delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      setIsProcessing(true);
      await projectService.deleteProject(project.id, true);
      navigate('/projects');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900">Project not found</h2>
            <p className="mt-2 text-gray-600">The project you're looking for doesn't exist or has been deleted.</p>
            <button
              onClick={() => navigate('/projects')}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              Back to Projects
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <nav className="flex" aria-label="Breadcrumb">
                    <ol className="flex items-center space-x-4">
                      <li>
                        <Link
                          to="/projects"
                          className="text-gray-400 hover:text-gray-500"
                        >
                          Projects
                        </Link>
                      </li>
                      <li>
                        <div className="flex items-center">
                          <svg
                            className="flex-shrink-0 h-5 w-5 text-gray-300"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="ml-4 text-sm font-medium text-gray-500">
                            {project.name}
                          </span>
                        </div>
                      </li>
                      <li>
                        <div className="flex items-center">
                          <svg
                            className="flex-shrink-0 h-5 w-5 text-gray-300"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="ml-4 text-sm font-medium text-gray-500">
                            Management
                          </span>
                        </div>
                      </li>
                    </ol>
                  </nav>
                  <h1 className="mt-2 text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                    {project.name} - Management
                  </h1>
                </div>
                {project.isArchived && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                    Archived
                  </span>
                )}
              </div>
            </div>
            
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'overview'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Overview
                </button>

                <button
                  onClick={() => setActiveTab('roles')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'roles'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Roles & Permissions
                </button>
                <button
                  onClick={() => setActiveTab('actions')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'actions'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Actions
                </button>
              </nav>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-1 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className="bg-white shadow mt-6">
          {activeTab === 'overview' && (
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Project Overview</h3>
              <div className="bg-white shadow rounded-lg p-6">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{project.name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Description</dt>
                    <dd className="mt-1 text-sm text-gray-900">{project.description || 'No description provided'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="mt-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        project.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {project.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {project.isArchived && (
                        <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          Archived
                        </span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Created</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Modified</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(project.modifiedAt).toLocaleDateString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Modified By</dt>
                    <dd className="mt-1 text-sm text-gray-900">{project.modifiedBy || 'Unknown'}</dd>
                  </div>
                  {project.description && (
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500">Description</dt>
                      <dd className="mt-1 text-sm text-gray-900">{project.description}</dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Quick Actions */}
              <div className="mt-6">
                <h4 className="text-md font-medium text-gray-900 mb-3">Quick Actions</h4>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleEditProject}
                    disabled={project.isArchived}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      project.isArchived
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    Edit Project Information
                  </button>
                  <button
                    onClick={handleManageFields}
                    disabled={project.isArchived}
                    className={`px-4 py-2 text-sm font-medium border transition-colors ${
                      project.isArchived
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'
                    }`}
                  >
                    Manage Fields
                  </button>
                </div>
              </div>
            </div>
          )}


          {activeTab === 'roles' && (
            <div className="px-4 py-5 sm:p-6">
              <ProjectRoleManagement
                projectId={project.id}
                projectName={project.name}
                onRoleChange={handleRoleChange}
              />
            </div>
          )}

          {activeTab === 'actions' && (
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Project Actions</h3>
              
              <div className="space-y-6">
                {/* Clone Project */}
                {isAdmin && !project.isArchived && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Clone Project</h4>
                        <p className="text-sm text-gray-500">Create a copy of this project with all its settings and fields.</p>
                      </div>
                      <button
                        onClick={handleCloneProject}
                        disabled={isProcessing}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 text-sm font-medium transition-colors"
                      >
                        <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Clone Project
                      </button>
                    </div>
                  </div>
                )}

                {/* Archive/Restore Project */}
                {isAdmin && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {project.isArchived ? 'Restore Project' : 'Archive Project'}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {project.isArchived 
                            ? 'Restore this project to make it active again.'
                            : 'Archive this project to remove it from active use.'}
                        </p>
                      </div>
                      <button
                        onClick={handleArchiveProject}
                        disabled={isProcessing}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                          project.isArchived
                            ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white'
                            : 'bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white'
                        }`}
                      >
                        <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {project.isArchived ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8l4 4L19 2" />
                          )}
                        </svg>
                        {project.isArchived ? 'Restore Project' : 'Archive Project'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Delete Project */}
                {isAdmin && (
                  <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-red-900">Delete Project Permanently</h4>
                        <p className="text-sm text-red-600">This action cannot be undone. All data will be permanently lost.</p>
                      </div>
                      <button
                        onClick={handleDeleteProject}
                        disabled={isProcessing}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 text-sm font-medium transition-colors"
                      >
                        <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete Permanently
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Processing Overlay */}
              {isProcessing && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm text-gray-600">Processing...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectManagePage;