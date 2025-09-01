import React, { useEffect, useState, useCallback } from 'react';
import type { 
  CustomField, 
  Role, 
  RoleFieldValueRestriction, 
  CreateRoleFieldValueRestrictionRequest
} from '../types/api';
import { roleService } from '../services/roles';

interface FieldValueRestrictionsProps {
  customField: CustomField;
  onRestrictionsChange?: () => void;
}

const FieldValueRestrictions: React.FC<FieldValueRestrictionsProps> = ({
  customField,
  onRestrictionsChange
}) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [restrictions, setRestrictions] = useState<RoleFieldValueRestriction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    roleId: '',
    values: [''],
    isAllowList: true
  });

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');

      // Fetch roles and field restrictions in parallel
      const [rolesResponse, restrictionsResponse] = await Promise.all([
        roleService.getRoles(1, 100),
        roleService.getFieldRestrictionsByField(customField.id)
      ]);

      setRoles(rolesResponse.data || []);
      setRestrictions(restrictionsResponse);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load field restrictions');
    } finally {
      setIsLoading(false);
    }
  }, [customField.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddValue = () => {
    setFormData(prev => ({
      ...prev,
      values: [...prev.values, '']
    }));
  };

  const handleRemoveValue = (index: number) => {
    setFormData(prev => ({
      ...prev,
      values: prev.values.filter((_, i) => i !== index)
    }));
  };

  const handleValueChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      values: prev.values.map((v, i) => i === index ? value : v)
    }));
  };

  const handleCreateRestriction = async () => {
    if (!formData.roleId) {
      setError('Please select a role');
      return;
    }

    const validValues = formData.values.filter(v => v.trim() !== '');
    if (validValues.length === 0) {
      setError('Please add at least one value');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const request: CreateRoleFieldValueRestrictionRequest = {
        roleId: parseInt(formData.roleId),
        customFieldId: parseInt(customField.id),
        values: validValues,
        isAllowList: formData.isAllowList
      };

      await roleService.createFieldRestriction(request);

      // Reset form and close modal
      setFormData({
        roleId: '',
        values: [''],
        isAllowList: true
      });
      setShowCreateModal(false);

      // Refresh data
      await fetchData();
      onRestrictionsChange?.();
    } catch (err) {
      console.error('Error creating restriction:', err);
      setError('Failed to create restriction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRestriction = async (restrictionId: string) => {
    if (!confirm('Are you sure you want to delete this restriction?')) {
      return;
    }

    try {
      setError('');
      await roleService.deleteFieldRestriction(restrictionId);
      await fetchData();
      onRestrictionsChange?.();
    } catch (err) {
      console.error('Error deleting restriction:', err);
      setError('Failed to delete restriction');
    }
  };

  const openCreateModal = () => {
    setFormData({
      roleId: '',
      values: [''],
      isAllowList: true
    });
    setError('');
    setShowCreateModal(true);
  };

  const getAvailableRoles = () => {
    const restrictedRoleIds = restrictions.map(r => r.roleId);
    return roles.filter(role => !restrictedRoleIds.includes(role.id));
  };

  if (isLoading) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h4 className="text-lg font-medium text-gray-900">Role Value Restrictions</h4>
          <p className="text-sm text-gray-600">
            Control which values different roles can set for this field
          </p>
        </div>
        <button
          onClick={openCreateModal}
          disabled={getAvailableRoles().length === 0}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          <svg className="-ml-0.5 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Restriction
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {restrictions.length === 0 ? (
        <p className="text-sm text-gray-500 italic">
          No role restrictions configured. All roles can set any value for this field.
        </p>
      ) : (
        <div className="space-y-3">
          {restrictions.map((restriction) => (
            <div key={restriction.id} className="bg-white p-3 rounded border">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h5 className="font-medium text-gray-900">{restriction.roleName}</h5>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      restriction.isAllowList 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {restriction.isAllowList ? 'Allow List' : 'Deny List'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">
                      {restriction.isAllowList ? 'Allowed values:' : 'Restricted values:'}
                    </span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {restriction.values.map((value, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-800"
                        >
                          {value}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteRestriction(restriction.id)}
                  className="text-red-600 hover:text-red-800 ml-4"
                  title="Delete restriction"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Restriction Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Role Restriction</h3>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="roleId" className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  id="roleId"
                  value={formData.roleId}
                  onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a role...</option>
                  {getAvailableRoles().map((role) => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Restriction Type
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={formData.isAllowList}
                      onChange={() => setFormData({ ...formData, isAllowList: true })}
                      className="mr-2"
                    />
                    <span className="text-sm">Allow List (only these values are allowed)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={!formData.isAllowList}
                      onChange={() => setFormData({ ...formData, isAllowList: false })}
                      className="mr-2"
                    />
                    <span className="text-sm">Deny List (these values are restricted)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Values
                </label>
                <div className="space-y-2">
                  {formData.values.map((value, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => handleValueChange(index, e.target.value)}
                        placeholder="Enter value..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {formData.values.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveValue(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleAddValue}
                  className="mt-2 text-sm text-indigo-600 hover:text-indigo-800"
                >
                  + Add another value
                </button>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                disabled={isSubmitting}
                className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white px-6 py-2 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateRestriction}
                disabled={isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-6 py-2 text-sm font-medium transition-colors"
              >
                {isSubmitting ? 'Creating...' : 'Create Restriction'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FieldValueRestrictions;