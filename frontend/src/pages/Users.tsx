import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useIsSuperAdmin } from '../hooks/usePermissions';
import type { User } from '../types/auth';
import type { Role } from '../types/api';
import { userService } from '../services/users';
import { roleService } from '../services/roles';
import Header from '../components/Header';
import { getUserDisplayName, userIsAdmin, getRoleColor, getRoleIcon } from '../utils/userHelpers';

interface NewUser {
  username: string;
  email: string;
  selectedRoles: string[];
  password: string;
}

// Type for flexible API response handling
interface FlexibleApiResponse {
  data?: User[] | { data?: User[] };
  users?: User[];
  items?: User[];
  results?: User[];
}

// Type for user response with possible nested data
interface FlexibleUserResponse extends User {
  data?: User;
}

const Users: React.FC = () => {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = useIsSuperAdmin();
  
  // Helper function to get first letter for avatar
  const getUserInitial = (user: User): string => {
    const displayName = getUserDisplayName(user);
    return displayName.charAt(0).toUpperCase();
  };

  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [changingPasswordUser, setChangingPasswordUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [newUser, setNewUser] = useState<NewUser>({
    username: '',
    email: '',
    selectedRoles: [],
    password: ''
  });

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await userService.getUsers();
      
      // Robust handling for both array and object API responses
      let userData: User[] = [];
      if (Array.isArray(response)) {
        // Direct array response
        userData = response;
      } else if (response && typeof response === 'object') {
        // Object response with data property
        if (Array.isArray(response.data)) {
          userData = response.data;
        } else if (response.data && typeof response.data === 'object' && 'data' in response.data && Array.isArray((response.data as { data: User[] }).data)) {
          // Nested data structure
          userData = (response.data as { data: User[] }).data;
        } else {
          // Fallback: check for common array properties
          const fallbackResponse = response as FlexibleApiResponse;
          userData = fallbackResponse.users || fallbackResponse.items || fallbackResponse.results || [];
        }
      }
      
      // Ensure we have a valid array
      setUsers(Array.isArray(userData) ? userData : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
      setUsers([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await roleService.getRoles(1, 100); // Get up to 100 roles
      
      // Robust handling for both array and object API responses
      let roleData: Role[] = [];
      if (Array.isArray(response)) {
        // Direct array response
        roleData = response;
      } else if (response && typeof response === 'object') {
        // Object response with data property
        if (Array.isArray(response.data)) {
          roleData = response.data;
        } else {
          // Fallback for other response structures
          roleData = [];
        }
      }
      
      // Ensure we have a valid array and set roles
      setRoles(Array.isArray(roleData) ? roleData : []);
    } catch (err) {
      console.warn('Failed to fetch roles, using fallback roles:', err);
      // Fallback to basic roles if the API fails
      setRoles([
        { id: '1', name: 'Administrator', description: 'Full system access', createdAt: '', modifiedAt: '' },
        { id: '2', name: 'Manager', description: 'Management access', createdAt: '', modifiedAt: '' },
        { id: '3', name: 'User', description: 'Basic user access', createdAt: '', modifiedAt: '' }
      ]);
    }
  };

  const filteredUsers = users.filter(user => {
    if (!user) return false;
    const displayName = getUserDisplayName(user).toLowerCase();
    const email = (user.email || '').toLowerCase();
    const allRoles = user.roles ? user.roles.map(role => role.roleName.toLowerCase()).join(' ') : '';
    const search = searchTerm.toLowerCase();
    if (search === '') return true;
    return (
      displayName.includes(search) ||
      email.includes(search) ||
      allRoles.includes(search)
    );
  });

  const handleCreateUser = async () => {
    try {
      const createdUser = await userService.createUser({
        username: newUser.username,
        email: newUser.email,
        passwordHash: newUser.password,
        roleIds: newUser.selectedRoles.length > 0 ? newUser.selectedRoles : undefined
      });
      
      // Robust handling of created user response
      const userResponse = createdUser as unknown as FlexibleUserResponse;
      const userToAdd = userResponse?.data || createdUser;
      if (userToAdd && userToAdd.id) {
        setUsers(prev => [...prev, userToAdd]);
        setShowCreateModal(false);
        setNewUser({ username: '', email: '', selectedRoles: [], password: '' });
      } else {
        throw new Error('Invalid user data received from server');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setNewUser({
      username: getUserDisplayName(user),
      email: user.email || '',
      selectedRoles: user.roles ? user.roles.map(role => role.roleId) : [],
      password: ''
    });
    // Refresh roles when editing to ensure latest roles are available
    fetchRoles();
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    
    try {
      const updatedUser = await userService.updateUser(editingUser.id, {
        username: newUser.username,
        email: newUser.email,
        ...(newUser.password && { passwordHash: newUser.password }),
        roleIds: newUser.selectedRoles
      });
      
      // Robust handling of updated user response
      const userResponse = updatedUser as unknown as FlexibleUserResponse;
      const userToUpdate = userResponse?.data || updatedUser;
      if (userToUpdate && userToUpdate.id) {
        setUsers(prev => prev.map(u => u.id === editingUser.id ? userToUpdate : u));
        setEditingUser(null);
        setNewUser({ username: '', email: '', selectedRoles: [], password: '' });
      } else {
        throw new Error('Invalid user data received from server');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await userService.deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  const handleChangePassword = async () => {
    if (!changingPasswordUser || !newPassword.trim()) return;
    
    try {
      await userService.changeUserPassword(changingPasswordUser.id, newPassword);
      setChangingPasswordUser(null);
      setNewPassword('');
      // You could show a success message here if desired
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    }
  };

  const openChangePasswordModal = (user: User) => {
    setChangingPasswordUser(user);
    setNewPassword('');
  };

  const handleOpenCreateModal = () => {
    setShowCreateModal(true);
    setNewUser({ 
      username: '', 
      email: '', 
      selectedRoles: [], 
      password: '' 
    });
    // Refresh roles when opening modal to ensure latest roles are available
    fetchRoles();
  };

  // Only administrators can access user management
  if (!userIsAdmin(currentUser)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div className="text-gray-500 text-lg">Access Denied</div>
            <p className="text-gray-400 mt-2">
              You don't have permission to access user management. This feature is only available to administrators.
            </p>
          </div>
        </div>
      </div>
    );
  }

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



  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                <p className="mt-2 text-gray-600">
                  Manage user accounts, roles, and permissions.
                </p>
              </div>
              <div className="mt-4 sm:mt-0">
                <button
                  onClick={handleOpenCreateModal}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Add User</span>
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
                    onClick={() => setError('')}
                    className="text-red-600 hover:text-red-800 text-sm font-medium mt-2"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className="ml-4 text-sm text-gray-600">
                {filteredUsers.length} of {users.length} users
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:p-6">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  <div className="text-gray-500 text-lg">No users found</div>
                  <p className="text-gray-400 mt-2">
                    {users.length === 0 ? 'Add your first user to get started.' : 'Try adjusting your search term.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-700">
                                  {getUserInitial(user)}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{getUserDisplayName(user)}</div>
                                <div className="text-sm text-gray-500">{user.email || 'No email'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-wrap gap-1">
                              {user.roles && user.roles.length > 0 ? (
                                user.roles.map((userRole) => (
                                  <span key={userRole.id} className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(userRole.roleName)}`}>
                                    <span>{getRoleIcon(userRole.roleName)}</span>
                                    <span>{userRole.roleName}</span>
                                  </span>
                                ))
                              ) : (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  <span>👤</span>
                                  <span>No Role</span>
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                              <span>Active</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              {!user.isImmutable && (
                                <button
                                  onClick={() => handleEditUser(user)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Edit user"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                              )}
                              {isSuperAdmin && (
                                <button
                                  onClick={() => openChangePasswordModal(user)}
                                  className="text-green-600 hover:text-green-900"
                                  title="Change password (Super Admin only)"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                  </svg>
                                </button>
                              )}
                              {user.id !== currentUser?.id && !user.isImmutable && (
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Delete user"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              )}
                              {user.isImmutable && (
                                <span className="text-gray-400 text-xs px-2 py-1 bg-gray-100 rounded" title="This user cannot be modified">
                                  Protected
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* User Statistics */}
          {users.length > 0 && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-gray-900">{users.length}</div>
                    <div className="text-gray-600">Total Users</div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-gray-900">
                      {users.filter(u => u && userIsAdmin(u)).length}
                    </div>
                    <div className="text-gray-600">Administrators</div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-gray-900">{users.length}</div>
                    <div className="text-gray-600">Active Users</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Create/Edit User Modal */}
      {(showCreateModal || editingUser) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingUser ? 'Edit User' : 'Create New User'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingUser(null);
                  setNewUser({ username: '', email: '', selectedRoles: [], password: '' });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Roles
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
                  {roles.length > 0 ? (
                    roles.map(role => (
                      <label key={role.id} className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={newUser.selectedRoles.includes(role.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewUser({ 
                                ...newUser, 
                                selectedRoles: [...newUser.selectedRoles, role.id] 
                              });
                            } else {
                              setNewUser({ 
                                ...newUser, 
                                selectedRoles: newUser.selectedRoles.filter(id => id !== role.id) 
                              });
                            }
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{role.name}</div>
                          {role.description && (
                            <div className="text-xs text-gray-500">{role.description}</div>
                          )}
                        </div>
                      </label>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500 italic">No roles available</div>
                  )}
                </div>
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter password"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingUser(null);
                  setNewUser({ username: '', email: '', selectedRoles: [], password: '' });
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={editingUser ? handleUpdateUser : handleCreateUser}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                disabled={!newUser.username || !newUser.email || (!editingUser && !newUser.password)}
              >
                {editingUser ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {changingPasswordUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Change Password for {getUserDisplayName(changingPasswordUser)}
              </h3>
              <button
                onClick={() => {
                  setChangingPasswordUser(null);
                  setNewPassword('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter new password"
                  autoFocus
                />
              </div>
              <div className="text-sm text-gray-600 bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <div className="flex">
                  <svg className="w-5 h-5 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <strong>Super Admin Action:</strong> You are changing the password for this user. 
                    This action bypasses normal security restrictions.
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setChangingPasswordUser(null);
                  setNewPassword('');
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                disabled={!newPassword.trim()}
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;