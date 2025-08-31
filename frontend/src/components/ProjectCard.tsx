import React from 'react';
import type { Project } from '../types/api';
import { useNavigate } from 'react-router-dom';

interface ProjectCardProps {
  project: Project;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleManage = () => {
    navigate(`/projects/${project.id}/manage`);
  };

  return (
    <div className={`bg-white shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 relative ${
      project.isArchived ? 'border-gray-400 opacity-75' : 'border-blue-500'
    }`}>
      <div className="p-6">
        {/* Archived Badge */}
        {project.isArchived && (
          <div className="absolute top-2 right-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8l4 4L19 2" />
              </svg>
              Archived
            </span>
          </div>
        )}
        
        <div className="flex items-start space-x-4 mb-4">
          <div className="flex-shrink-0">
            <div className={`w-12 h-12 flex items-center justify-center ${
              project.isArchived ? 'bg-gray-400' : 'bg-blue-500'
            }`}>
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
          <div className="flex-grow min-w-0">
            <h3 className={`text-xl font-bold mb-2 truncate ${
              project.isArchived ? 'text-gray-600' : 'text-blue-900'
            }`}>
              {project.name}
            </h3>
            {project.description && (
              <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                {project.description}
              </p>
            )}
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
        
        <div className="flex justify-center">
          <button 
            onClick={handleManage}
            className={`px-8 py-3 text-sm font-medium transition-colors shadow-md ${
              project.isArchived 
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            disabled={project.isArchived}
          >
            <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Manage
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;