import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Project, CustomField, CreateCustomFieldRequest, UpdateCustomFieldRequest } from '../types/api';
import { projectService } from '../services/projects';
import Header from '../components/Header';

const ProjectFieldsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  
  const [project, setProject] = useState<Project | null>(null);
  const [fields, setFields] = useState<CustomField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    fieldType: 'Text',
    isRequired: false,
    defaultValue: '',
    order: 0,
    roleVisibility: 'all',
    userListOptions: ''
  });

  const fieldTypes = [
    { value: 'Text', label: 'Text' },
    { value: 'Number', label: 'Number' },
    { value: 'Date', label: 'Date' },
    { value: 'Boolean', label: 'Boolean' },
    { value: 'LongText', label: 'Long Text' },
    { value: 'Currency', label: 'Currency' },
    { value: 'UserList', label: 'User List' }
  ];

  const visibilityOptions = [
    { value: 'all', label: 'All Users' },
    { value: 'admin', label: 'Administrators Only' },
    { value: 'editor', label: 'Editors and Above' },
    { value: 'viewer', label: 'Viewers and Above' }
  ];

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    
    try {
      setIsLoading(true);
      setError('');
      
      const [projectData, fieldsData] = await Promise.all([
        projectService.getProject(projectId),
        projectService.getProjectCustomFields(projectId)
      ]);
      
      setProject(projectData);
      setFields(fieldsData.sort((a, b) => a.order - b.order));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project data');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateField = () => {
    const nextOrder = fields.length > 0 ? Math.max(...fields.map(f => f.order)) + 1 : 1;
    setFormData({
      name: '',
      description: '',
      fieldType: 'Text',
      isRequired: false,
      defaultValue: '',
      order: nextOrder,
      roleVisibility: 'all',
      userListOptions: ''
    });
    setShowCreateModal(true);
  };

  const handleEditField = (field: CustomField) => {
    setEditingField(field);
    setFormData({
      name: field.name,
      description: field.description || '',
      fieldType: field.fieldType,
      isRequired: field.isRequired,
      defaultValue: field.defaultValue || '',
      order: field.order,
      roleVisibility: field.roleVisibility || 'all',
      userListOptions: field.userListOptions || ''
    });
    setShowEditModal(true);
  };

  const handleDeleteField = async (fieldId: string) => {
    if (!projectId) return;
    
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;
    
    if (!field.isRemovable) {
      setError('This field cannot be deleted as it is a default system field.');
      return;
    }
    
    if (!confirm(`Are you sure you want to delete the field "${field.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setIsLoading(true);
      await projectService.deleteCustomField(projectId, fieldId);
      await fetchData();
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete field');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !formData.name.trim()) return;

    try {
      setIsSubmitting(true);
      setError('');
      
      const request: CreateCustomFieldRequest = {
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        fieldType: formData.fieldType,
        isRequired: formData.isRequired,
        defaultValue: formData.defaultValue?.trim() || undefined,
        order: formData.order,
        roleVisibility: formData.roleVisibility,
        userListOptions: formData.fieldType === 'UserList' ? formData.userListOptions?.trim() || undefined : undefined
      };

      await projectService.createCustomField(projectId, request);
      await fetchData();
      setShowCreateModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create field');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !formData.name.trim() || !editingField) return;

    try {
      setIsSubmitting(true);
      setError('');
      
      const request: UpdateCustomFieldRequest = {};
      
      if (formData.name !== editingField.name) {
        request.name = formData.name.trim();
      }
      if (formData.description !== (editingField.description || '')) {
        request.description = formData.description?.trim() || undefined;
      }
      if (formData.fieldType !== editingField.fieldType) {
        request.fieldType = formData.fieldType;
      }
      if (formData.isRequired !== editingField.isRequired) {
        request.isRequired = formData.isRequired;
      }
      if (formData.defaultValue !== (editingField.defaultValue || '')) {
        request.defaultValue = formData.defaultValue?.trim() || undefined;
      }
      if (formData.order !== editingField.order) {
        request.order = formData.order;
      }
      if (formData.roleVisibility !== (editingField.roleVisibility || 'all')) {
        request.roleVisibility = formData.roleVisibility;
      }
      if (formData.userListOptions !== (editingField.userListOptions || '')) {
        request.userListOptions = formData.fieldType === 'UserList' ? formData.userListOptions?.trim() || undefined : undefined;
      }

      await projectService.updateCustomField(projectId, editingField.id, request);
      await fetchData();
      setShowEditModal(false);
      setEditingField(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update field');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMoveField = async (fieldId: string, direction: 'up' | 'down') => {
    if (!projectId) return;
    
    const fieldIndex = fields.findIndex(f => f.id === fieldId);
    if (fieldIndex === -1) return;
    
    const newIndex = direction === 'up' ? fieldIndex - 1 : fieldIndex + 1;
    if (newIndex < 0 || newIndex >= fields.length) return;
    
    const field = fields[fieldIndex];
    const targetField = fields[newIndex];
    
    try {
      setIsLoading(true);
      
      // Swap the order values
      await Promise.all([
        projectService.updateCustomField(projectId, field.id, { order: targetField.order }),
        projectService.updateCustomField(projectId, targetField.id, { order: field.order })
      ]);
      
      await fetchData();
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder fields');
    } finally {
      setIsLoading(false);
    }
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setEditingField(null);
    setError('');
  };

  if (isLoading && !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
        <Header />
        <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
        <Header />
        <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900">Project not found</h2>
            <p className="mt-2 text-gray-600">The project you're looking for doesn't exist or has been deleted.</p>
            <button
              onClick={() => navigate('/projects')}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium transition-colors"
            >
              Back to Projects
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <Header />
      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <button
                onClick={() => navigate('/projects')}
                className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                </svg>
                Projects
              </button>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                </svg>
                <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">{project.name}</span>
              </div>
            </li>
            <li aria-current="page">
              <div className="flex items-center">
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                </svg>
                <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">Field Management</span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-blue-900">Index Fields</h1>
              <p className="mt-2 text-gray-600">
                Configure custom index fields for <strong>{project.name}</strong>
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <button
                onClick={handleCreateField}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 text-sm font-medium transition-colors flex items-center space-x-2 shadow-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Add Field</span>
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
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

        {/* Fields List */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Custom Index Fields</h3>
            <p className="mt-1 text-sm text-gray-500">
              Configure the fields that will be available when indexing documents in this project.
            </p>
          </div>

          {fields.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M8 14v20c0 4.418 7.163 8 16 8 1.381 0 2.721-.087 4-.252M8 14c0 4.418 7.163 8 16 8s16-3.582 16-8M8 14c0-4.418 7.163-8 16-8s16 3.582 16 8m0 0v14m-16-4c1.381 0 2.721-.087 4-.252" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No custom fields configured</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by adding a custom field for document indexing.
              </p>
              <div className="mt-6">
                <button
                  onClick={handleCreateField}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Add Field
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {fields.map((field, index) => (
                <div key={field.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      {/* Drag Handle */}
                      <div className="flex flex-col space-y-1">
                        <button
                          onClick={() => handleMoveField(field.id, 'up')}
                          disabled={index === 0 || isLoading}
                          className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleMoveField(field.id, 'down')}
                          disabled={index === fields.length - 1 || isLoading}
                          className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>

                      {/* Field Details */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-medium text-gray-900">{field.name}</h4>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {field.fieldType}
                          </span>
                          {field.isRequired && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Required
                            </span>
                          )}
                          {field.isDefault && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Default
                            </span>
                          )}
                          {!field.isRemovable && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              System
                            </span>
                          )}
                        </div>
                        
                        {field.description && (
                          <p className="mt-1 text-sm text-gray-500">{field.description}</p>
                        )}
                        
                        <div className="mt-2 flex items-center text-xs text-gray-500 space-x-4">
                          <span>Order: {field.order}</span>
                          <span>Visibility: {visibilityOptions.find(v => v.value === field.roleVisibility)?.label || field.roleVisibility}</span>
                          {field.fieldType === 'UserList' && field.userListOptions && (
                            <span>Options: {field.userListOptions.split(',').length} items</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditField(field)}
                        disabled={isLoading}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium disabled:opacity-50"
                      >
                        Edit
                      </button>
                      {field.isRemovable && (
                        <button
                          onClick={() => handleDeleteField(field.id)}
                          disabled={isLoading}
                          className="text-red-600 hover:text-red-900 text-sm font-medium disabled:opacity-50"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Loading Overlay */}
        {isLoading && fields.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 bg-white p-2 rounded"></div>
          </div>
        )}
      </main>

      {/* Create Field Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-blue-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white shadow-2xl rounded-lg p-8 w-full max-w-2xl border-t-4 border-blue-500 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-blue-900 mb-6">Add New Field</h3>
            <form onSubmit={handleSubmitCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Field Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter field name"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="fieldType" className="block text-sm font-medium text-gray-700 mb-1">
                    Field Type *
                  </label>
                  <select
                    id="fieldType"
                    value={formData.fieldType}
                    onChange={(e) => setFormData({ ...formData, fieldType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {fieldTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter field description"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="order" className="block text-sm font-medium text-gray-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    id="order"
                    min="1"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="roleVisibility" className="block text-sm font-medium text-gray-700 mb-1">
                    Visibility
                  </label>
                  <select
                    id="roleVisibility"
                    value={formData.roleVisibility}
                    onChange={(e) => setFormData({ ...formData, roleVisibility: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {visibilityOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="defaultValue" className="block text-sm font-medium text-gray-700 mb-1">
                  Default Value
                </label>
                <input
                  type="text"
                  id="defaultValue"
                  value={formData.defaultValue}
                  onChange={(e) => setFormData({ ...formData, defaultValue: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter default value"
                />
              </div>

              {formData.fieldType === 'UserList' && (
                <div>
                  <label htmlFor="userListOptions" className="block text-sm font-medium text-gray-700 mb-1">
                    User List Options *
                  </label>
                  <textarea
                    id="userListOptions"
                    value={formData.userListOptions}
                    onChange={(e) => setFormData({ ...formData, userListOptions: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter options separated by commas (e.g., John Doe, Jane Smith, Admin User)"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Enter a comma-separated list of user options for this field.
                  </p>
                </div>
              )}

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isRequired"
                  checked={formData.isRequired}
                  onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isRequired" className="ml-2 block text-sm text-gray-900">
                  This field is required
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeModals}
                  disabled={isSubmitting}
                  className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white px-6 py-2 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.name.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 text-sm font-medium transition-colors"
                >
                  {isSubmitting ? 'Creating...' : 'Create Field'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Field Modal */}
      {showEditModal && editingField && (
        <div className="fixed inset-0 bg-blue-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white shadow-2xl rounded-lg p-8 w-full max-w-2xl border-t-4 border-blue-500 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-blue-900 mb-6">Edit Field</h3>
            <form onSubmit={handleSubmitEdit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="editName" className="block text-sm font-medium text-gray-700 mb-1">
                    Field Name *
                  </label>
                  <input
                    type="text"
                    id="editName"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter field name"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="editFieldType" className="block text-sm font-medium text-gray-700 mb-1">
                    Field Type *
                  </label>
                  <select
                    id="editFieldType"
                    value={formData.fieldType}
                    onChange={(e) => setFormData({ ...formData, fieldType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {fieldTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label htmlFor="editDescription" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="editDescription"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter field description"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="editOrder" className="block text-sm font-medium text-gray-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    id="editOrder"
                    min="1"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="editRoleVisibility" className="block text-sm font-medium text-gray-700 mb-1">
                    Visibility
                  </label>
                  <select
                    id="editRoleVisibility"
                    value={formData.roleVisibility}
                    onChange={(e) => setFormData({ ...formData, roleVisibility: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {visibilityOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="editDefaultValue" className="block text-sm font-medium text-gray-700 mb-1">
                  Default Value
                </label>
                <input
                  type="text"
                  id="editDefaultValue"
                  value={formData.defaultValue}
                  onChange={(e) => setFormData({ ...formData, defaultValue: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter default value"
                />
              </div>

              {formData.fieldType === 'UserList' && (
                <div>
                  <label htmlFor="editUserListOptions" className="block text-sm font-medium text-gray-700 mb-1">
                    User List Options *
                  </label>
                  <textarea
                    id="editUserListOptions"
                    value={formData.userListOptions}
                    onChange={(e) => setFormData({ ...formData, userListOptions: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter options separated by commas (e.g., John Doe, Jane Smith, Admin User)"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Enter a comma-separated list of user options for this field.
                  </p>
                </div>
              )}

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="editIsRequired"
                  checked={formData.isRequired}
                  onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="editIsRequired" className="ml-2 block text-sm text-gray-900">
                  This field is required
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeModals}
                  disabled={isSubmitting}
                  className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white px-6 py-2 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.name.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 text-sm font-medium transition-colors"
                >
                  {isSubmitting ? 'Updating...' : 'Update Field'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectFieldsPage;