import React from 'react';
import type { Project } from '../types/api';

interface ProjectCardProps {
  project: Project;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">
                {project.name}
              </h3>
              {project.description && (
                <p className="text-sm text-gray-500 mt-1">
                  {project.description}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex-shrink-0">
            <button className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1 rounded-md text-sm font-medium transition-colors">
              View
            </button>
          </div>
        </div>
        
        <div className="mt-6 border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div>
              <span className="font-medium">Created:</span>
              <span className="ml-1">{formatDate(project.createdAt)}</span>
            </div>
            <div>
              <span className="font-medium">Modified:</span>
              <span className="ml-1">{formatDate(project.modifiedAt)}</span>
            </div>
          </div>
          
          <div className="mt-2 text-sm text-gray-500">
            <span className="font-medium">Default file:</span>
            <span className="ml-1">{project.fileName}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;