import React, { useState, useEffect, useCallback } from 'react';
import type { ProjectRole, Role, AssignProjectRoleRequest } from '../types/api';
import { roleService } from '../services/roles';

interface ProjectRoleManagementProps {
  projectId: string;
  projectName: string;
  onRoleChange?: () => void;
}

const ProjectRoleManagement: React.FC<ProjectRoleManagementProps> = ({ 
  projectId, 
  projectName,
  onRoleChange 
}) => {
  const [projectRoles, setProjectRoles] = useState<ProjectRole[]>([]);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newAssignment, setNewAssignment] = useState<AssignProjectRoleRequest>({
    projectId,
    roleId: '',
    canView: true,
    canEdit: true,
    canDelete: true
  });

  const fetchProjectRoles = useCallback(async () => {
    try {
      setIsLoading(true);
      const roles = await roleService.getProjectRoles(projectId);
      setProjectRoles(roles);
    } catch (err) {
      setError('Failed to load project roles');
      console.error('Error fetching project roles:', err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  const fetchAllRoles = useCallback(async () => {
    try {
      const response = await roleService.getRoles(1, 100);
      setAllRoles(response.data || []);
    } catch (err) {
      console.error('Error fetching roles:', err);
    }
  }, []);

  useEffect(() => {
    fetchProjectRoles();
    fetchAllRoles();
  }, [fetchProjectRoles, fetchAllRoles]);

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssignment.roleId) {
      setError('Please select a role');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      
      await roleService.assignProjectRole(newAssignment);
      await fetchProjectRoles();
      onRoleChange?.();
      
      setShowAssignModal(false);
      setNewAssignment({
        projectId,
        roleId: '',
        canView: true,
        canEdit: true,
        canDelete: true
      });
    } catch (err) {
      setError('Failed to assign role to project');
      console.error('Error assigning role:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveRole = async (projectRoleId: string) => {
    if (!confirm('Are you sure you want to remove this role assignment?')) {
      return;
    }

    try {
      await roleService.removeProjectRole(projectRoleId);
      await fetchProjectRoles();
      onRoleChange?.();
    } catch (err) {
      setError('Failed to remove role assignment');
      console.error('Error removing role:', err);
    }
  };

  const getAvailableRoles = () => {
    const assignedRoleIds = projectRoles.map(pr => pr.roleId);
    return allRoles.filter(role => !assignedRoleIds.includes(role.id));
  };

  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Project Roles</h3>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Project Roles</h3>
        <button
          onClick={() => setShowAssignModal(true)}
          disabled={getAvailableRoles().length === 0}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          <svg className="-ml-0.5 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Assign Role
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {projectRoles.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No roles assigned to this project.</p>
      ) : (
        <div className="space-y-4">
          {projectRoles.map((projectRole) => (
            <div key={projectRole.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-md font-medium text-gray-900">{projectRole.roleName}</h4>
                <button
                  onClick={() => handleRemoveRole(projectRole.id)}
                  className="text-red-600 hover:text-red-800"
                  title="Remove role assignment"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              
              <div className="mt-2">
                <div className="flex flex-wrap gap-1">
                  {projectRole.canView && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      View
                    </span>
                  )}
                  {projectRole.canEdit && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Edit
                    </span>
                  )}
                  {projectRole.canDelete && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Delete
                    </span>
                  )}
                </div>
                {!projectRole.canView && !projectRole.canEdit && !projectRole.canDelete && (
                  <p className="text-sm text-gray-500 italic">No permissions assigned</p>
                )}
              </div>
              
              <div className="mt-2 text-xs text-gray-500">
                Assigned: {new Date(projectRole.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assign Role Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Assign Role to {projectName}
              </h3>
              
              <form onSubmit={handleAssignRole}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Role
                  </label>
                  <select
                    value={newAssignment.roleId}
                    onChange={(e) => setNewAssignment({ ...newAssignment, roleId: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="">Select a role...</option>
                    {getAvailableRoles().map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                        {role.description && ` - ${role.description}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    Permissions will be defined by the role configuration.
                  </p>
                </div>

                <div className="flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Assigning...' : 'Assign Role'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectRoleManagement;