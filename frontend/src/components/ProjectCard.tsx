import React, { useState } from 'react';
import type { Project } from '../types/api';
import { useNavigate } from 'react-router-dom';

interface ProjectCardProps {
  project: Project;
  onEdit?: (project: Project) => void;
  onClone?: (projectId: string) => Promise<void>;
  onDelete?: (projectId: string, hardDelete?: boolean) => Promise<void>;
  onRestore?: (projectId: string) => Promise<void>;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onEdit, onClone, onDelete, onRestore }) => {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleView = () => {
    navigate(`/projects/${project.id}`);
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(project);
    }
    setShowDropdown(false);
  };

  const handleClone = async () => {
    if (onClone && !isProcessing) {
      try {
        setIsProcessing(true);
        await onClone(project.id);
      } finally {
        setIsProcessing(false);
      }
    }
    setShowDropdown(false);
  };

  const handleDelete = async (hardDelete = false) => {
    if (onDelete && !isProcessing) {
      try {
        setIsProcessing(true);
        await onDelete(project.id, hardDelete);
      } finally {
        setIsProcessing(false);
      }
    }
    setShowDropdown(false);
  };

  const handleRestore = async () => {
    if (onRestore && !isProcessing) {
      try {
        setIsProcessing(true);
        await onRestore(project.id);
      } finally {
        setIsProcessing(false);
      }
    }
    setShowDropdown(false);
  };

  const handleManageFields = () => {
    navigate(`/projects/${project.id}/fields`);
    setShowDropdown(false);
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
        
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-4 flex-1">
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
          
          {/* Actions Dropdown */}
          <div className="relative ml-4">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-1 rounded-full hover:bg-gray-100 focus:outline-none"
              disabled={isProcessing}
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
              </svg>
            </button>

            {showDropdown && (
              <>
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowDropdown(false)}
                />
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-20">
                  <div className="py-1">
                    {!project.isArchived && (
                      <>
                        <button
                          onClick={handleEdit}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit Project
                        </button>
                        <button
                          onClick={handleManageFields}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                          </svg>
                          Manage Fields
                        </button>
                        <button
                          onClick={handleClone}
                          disabled={isProcessing}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center disabled:opacity-50"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Clone Project
                        </button>
                        <hr className="my-1 border-gray-200" />
                        <button
                          onClick={() => handleDelete(false)}
                          disabled={isProcessing}
                          className="w-full text-left px-4 py-2 text-sm text-orange-700 hover:bg-orange-50 flex items-center disabled:opacity-50"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8l4 4L19 2" />
                          </svg>
                          Archive Project
                        </button>
                        <button
                          onClick={() => handleDelete(true)}
                          disabled={isProcessing}
                          className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 flex items-center disabled:opacity-50"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete Permanently
                        </button>
                      </>
                    )}
                    
                    {project.isArchived && (
                      <>
                        <button
                          onClick={handleRestore}
                          disabled={isProcessing}
                          className="w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50 flex items-center disabled:opacity-50"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Restore Project
                        </button>
                        <hr className="my-1 border-gray-200" />
                        <button
                          onClick={() => handleDelete(true)}
                          disabled={isProcessing}
                          className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 flex items-center disabled:opacity-50"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete Permanently
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </>
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
        
        <div className="flex space-x-3">
          <button 
            onClick={handleView}
            disabled={project.isArchived}
            className={`px-6 py-2 text-sm font-medium transition-colors shadow-md flex-1 ${
              project.isArchived 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            View Documents
          </button>
          <button 
            onClick={handleManageFields}
            disabled={project.isArchived}
            className={`px-6 py-2 text-sm font-medium transition-colors border ${
              project.isArchived
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'
            }`}
          >
            Fields
          </button>
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
    </div>
  );
};

export default ProjectCard;