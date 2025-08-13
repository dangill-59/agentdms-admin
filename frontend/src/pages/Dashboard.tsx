import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { Project } from '../types/api';
import { projectService } from '../services/projects';
import ProjectCard from '../components/ProjectCard';
import Header from '../components/Header';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await projectService.getProjects();
      setProjects(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  const handleCreateProject = () => {
    setShowCreateModal(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <Header />
      
      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-blue-900">
                  Welcome back, {user?.name}!
                </h1>
                <p className="mt-2 text-gray-600">
                  Manage your document projects and access your files.
                </p>
              </div>
              <div className="mt-4 sm:mt-0">
                <button
                  onClick={handleCreateProject}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-sm font-medium transition-colors flex items-center space-x-2 shadow-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>New Project</span>
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="flex">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="ml-3">
                  <div className="text-red-800">{error}</div>
                  <button
                    onClick={fetchProjects}
                    className="text-red-600 hover:text-red-800 text-sm font-medium mt-2"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Search and Filter */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-blue-50"
                  />
                  <svg className="w-5 h-5 text-blue-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>{filteredProjects.length} of {projects.length} projects</span>
              </div>
            </div>
          </div>

          {/* Projects Grid */}
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              {projects.length === 0 ? (
                <>
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <div className="text-gray-500 text-lg">No projects found</div>
                  <p className="text-gray-400 mt-2 mb-4">
                    Create your first project to get started with document processing.
                  </p>
                  <button
                    onClick={handleCreateProject}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-sm font-medium transition-colors shadow-md"
                  >
                    Create Project
                  </button>
                </>
              ) : (
                <>
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <div className="text-gray-500 text-lg">No projects match your search</div>
                  <p className="text-gray-400 mt-2">
                    Try adjusting your search term or create a new project.
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}

          {/* Project Statistics */}
          {projects.length > 0 && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 shadow-lg border-t-4 border-blue-500">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <div className="text-3xl font-bold text-blue-900">{projects.length}</div>
                    <div className="text-gray-600 font-medium">Total Projects</div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 shadow-lg border-t-4 border-green-500">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <div className="text-3xl font-bold text-blue-900">0</div>
                    <div className="text-gray-600 font-medium">Documents Processed</div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 shadow-lg border-t-4 border-yellow-500">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-yellow-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <div className="text-3xl font-bold text-blue-900">Today</div>
                    <div className="text-gray-600 font-medium">Recent Activity</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Create Project Modal - Placeholder */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-blue-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white shadow-2xl p-8 w-full max-w-md border-t-4 border-blue-500">
            <h3 className="text-xl font-bold text-blue-900 mb-4">Create New Project</h3>
            <p className="text-gray-600 mb-6">Project creation will be implemented in the next phase.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 text-sm font-medium transition-colors shadow-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;