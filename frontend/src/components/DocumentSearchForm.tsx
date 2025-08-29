import React, { useState, useEffect } from 'react';
import type { Project, DocumentSearchFilters, CustomField } from '../types/api';
import { projectService } from '../services/projects';

interface DocumentSearchFormProps {
  filters: DocumentSearchFilters;
  onFiltersChange: (filters: DocumentSearchFilters) => void;
  onSearch: () => void;
  onClear: () => void;
  isLoading?: boolean;
}

const DocumentSearchForm: React.FC<DocumentSearchFormProps> = ({
  filters,
  onFiltersChange,
  onSearch,
  onClear,
  isLoading = false
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isLoadingFields, setIsLoadingFields] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoadingProjects(true);
        const response = await projectService.getProjects(1, 100); // Get all projects
        setProjects(response.data);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setIsLoadingProjects(false);
      }
    };

    fetchProjects();
  }, []);

  // Load custom fields when project changes
  useEffect(() => {
    const fetchCustomFields = async () => {
      if (!filters.projectId) {
        setCustomFields([]);
        return;
      }

      try {
        setIsLoadingFields(true);
        const fields = await projectService.getProjectCustomFields(filters.projectId);
        setCustomFields(fields);
      } catch (error) {
        console.error('Failed to fetch custom fields:', error);
        setCustomFields([]);
      } finally {
        setIsLoadingFields(false);
      }
    };

    fetchCustomFields();
  }, [filters.projectId]);

  const handleFilterChange = (key: keyof DocumentSearchFilters, value: string) => {
    if (key === 'projectId') {
      // Clear custom field filters when project changes
      onFiltersChange({
        ...filters,
        [key]: value || undefined,
        customFieldFilters: {}
      });
    } else {
      onFiltersChange({
        ...filters,
        [key]: value || undefined
      });
    }
  };

  const handleCustomFieldFilterChange = (fieldName: string, value: string) => {
    const newCustomFieldFilters = { ...filters.customFieldFilters };
    if (value) {
      newCustomFieldFilters[fieldName] = value;
    } else {
      delete newCustomFieldFilters[fieldName];
    }

    onFiltersChange({
      ...filters,
      customFieldFilters: newCustomFieldFilters
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  const handleClear = () => {
    onClear();
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-blue-900">Document Search</h1>
        <p className="mt-2 text-gray-600">
          Search and manage documents across your projects.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Project Selection */}
        <div>
          <label htmlFor="project" className="block text-sm font-medium text-gray-700 mb-2">
            Project
          </label>
          <select
            id="project"
            value={filters.projectId || ''}
            onChange={(e) => handleFilterChange('projectId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoadingProjects}
          >
            <option value="">Select a project...</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          {isLoadingProjects && (
            <p className="mt-1 text-sm text-gray-500">Loading projects...</p>
          )}
        </div>

        {/* Search Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Dynamic Custom Fields */}
          {customFields
            .filter(field => !field.isDefault) // Skip default fields like filename, dates
            .map((field) => (
              <div key={field.id}>
                <label htmlFor={`field-${field.id}`} className="block text-sm font-medium text-gray-700 mb-2">
                  {field.name}
                  {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                </label>
                {field.fieldType === 'Text' || field.fieldType === 'LongText' ? (
                  <input
                    type="text"
                    id={`field-${field.id}`}
                    value={filters.customFieldFilters[field.name] || ''}
                    onChange={(e) => handleCustomFieldFilterChange(field.name, e.target.value)}
                    placeholder={`Enter ${field.name.toLowerCase()}...`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : field.fieldType === 'Number' || field.fieldType === 'Currency' ? (
                  <input
                    type="number"
                    id={`field-${field.id}`}
                    value={filters.customFieldFilters[field.name] || ''}
                    onChange={(e) => handleCustomFieldFilterChange(field.name, e.target.value)}
                    placeholder={`Enter ${field.name.toLowerCase()}...`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : field.fieldType === 'Date' ? (
                  <input
                    type="date"
                    id={`field-${field.id}`}
                    value={filters.customFieldFilters[field.name] || ''}
                    onChange={(e) => handleCustomFieldFilterChange(field.name, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <input
                    type="text"
                    id={`field-${field.id}`}
                    value={filters.customFieldFilters[field.name] || ''}
                    onChange={(e) => handleCustomFieldFilterChange(field.name, e.target.value)}
                    placeholder={`Enter ${field.name.toLowerCase()}...`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                )}
                {field.description && (
                  <p className="mt-1 text-xs text-gray-500">{field.description}</p>
                )}
              </div>
            ))}

          {/* System Date Range Filters */}
          <div>
            <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 mb-2">
              Date From
            </label>
            <input
              type="date"
              id="dateFrom"
              value={filters.dateFrom || ''}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 mb-2">
              Date To
            </label>
            <input
              type="date"
              id="dateTo"
              value={filters.dateTo || ''}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Loading State for Custom Fields */}
          {isLoadingFields && filters.projectId && (
            <div className="col-span-full text-center py-4">
              <div className="inline-flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-gray-600">Loading search fields...</span>
              </div>
            </div>
          )}

          {/* No Fields Message */}
          {!isLoadingFields && filters.projectId && customFields.filter(f => !f.isDefault).length === 0 && (
            <div className="col-span-full text-center py-4">
              <p className="text-gray-500">No custom fields available for this project.</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClear}
            disabled={isLoading}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear
          </button>
          <button
            type="submit"
            disabled={isLoading || !filters.projectId}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isLoading && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            <span>Search</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default DocumentSearchForm;