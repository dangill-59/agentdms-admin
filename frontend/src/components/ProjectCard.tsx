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
    <div className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-blue-500">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-500 flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
            <div className="flex-grow min-w-0">
              <h3 className="text-xl font-bold text-blue-900 mb-2">
                {project.name}
              </h3>
              {project.description && (
                <p className="text-gray-600 text-sm leading-relaxed">
                  {project.description}
                </p>
              )}
            </div>
          </div>
        </div>
        
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-500">
              <span className="font-semibold text-gray-700">Created:</span>
              <span className="ml-2">{formatDate(project.createdAt)}</span>
            </div>
            <div className="text-gray-500">
              <span className="font-semibold text-gray-700">Modified:</span>
              <span className="ml-2">{formatDate(project.modifiedAt)}</span>
            </div>
          </div>
          
          <div className="text-sm text-gray-500 border-t border-gray-200 pt-3">
            <span className="font-semibold text-gray-700">Default file:</span>
            <span className="ml-2 font-mono bg-gray-100 px-2 py-1 text-xs">{project.fileName}</span>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 text-sm font-medium transition-colors shadow-md flex-1">
            View
          </button>
          <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 text-sm font-medium transition-colors border border-gray-300">
            Edit
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;