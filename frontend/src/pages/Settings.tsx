import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { settingsService } from '../services/settings';
import type { AppSettings } from '../services/settings';
import Header from '../components/Header';
import { getUserDisplayName } from '../utils/userHelpers';

interface UserProfile {
  username: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // User profile state
  const [userProfile, setUserProfile] = useState<UserProfile>({
    username: getUserDisplayName(user),
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // App settings state
  const [appSettings, setAppSettings] = useState<AppSettings>({
    database: {
      type: 'sqlite',
      host: '',
      port: 0,
      databaseName: 'agentdms',
      username: '',
      password: '',
      connectionString: 'Data Source=agentdms.db',
      advanced: {
        enableSsl: false,
        connectionTimeout: 30,
        commandTimeout: 30,
        maxPoolSize: 100,
        minPoolSize: 0,
        enableConnectionPooling: true,
        additionalOptions: ''
      }
    },
    maxFileSize: 100 * 1024 * 1024, // 100MB in bytes
    allowedFileTypes: ['.jpg', '.jpeg', '.png', '.bmp', '.gif', '.tif', '.tiff', '.pdf', '.webp'],
    autoProcessUploads: true,
    processingTimeout: 300,
    retentionDays: 365,
    enableNotifications: true,
    emailNotifications: {
      uploadCompleted: true,
      processingStatus: true,
      systemErrors: true
    },
    pushNotifications: {
      uploadProgress: false,
      processingCompletion: true
    },
    sessionTimeout: 120,
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: false
    },
    imageStorage: {
      provider: 'local',
      local: {
        basePath: './uploads/images',
        createDirectoryIfNotExists: true
      },
      aws: {
        bucketName: '',
        region: 'us-east-1',
        accessKeyId: '',
        secretAccessKey: '',
        basePath: 'images/'
      },
      azure: {
        connectionString: '',
        containerName: 'images',
        basePath: 'images/'
      }
    },
    theme: 'light',
    defaultPageSize: 10,
    dateFormat: 'MM/dd/yyyy',
    timeFormat: '12h'
  });

  const tabs = [
    { id: 'profile', name: 'Profile', icon: 'user' },
    { id: 'app', name: 'Application', icon: 'cog' },
    { id: 'database', name: 'Database', icon: 'database' },
    { id: 'storage', name: 'Storage', icon: 'server' },
    { id: 'security', name: 'Security', icon: 'shield' },
    { id: 'notifications', name: 'Notifications', icon: 'bell' }
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const settings = await settingsService.getAppSettings();
      setAppSettings(settings);
    } catch (error) {
      console.warn('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      setIsLoading(true);
      
      // Validate passwords if changing
      if (userProfile.newPassword) {
        if (userProfile.newPassword !== userProfile.confirmPassword) {
          setError('New passwords do not match');
          return;
        }
        if (!userProfile.currentPassword) {
          setError('Current password is required to set a new password');
          return;
        }
      }

      // TODO: Update profile via API
      // await userService.updateProfile(userProfile);
      
      setSuccess('Profile updated successfully');
      setUserProfile({
        ...userProfile,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppSettingsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      setIsLoading(true);
      const updatedSettings = await settingsService.updateAppSettings(appSettings);
      setAppSettings(updatedSettings);
      setSuccess('Application settings updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDatabaseSettingsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      setIsLoading(true);
      const updatedSettings = await settingsService.updateAppSettings(appSettings);
      setAppSettings(updatedSettings);
      setSuccess('Database settings updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update database settings');
    } finally {
      setIsLoading(false);
    }
  };

  const getTabIcon = (iconType: string) => {
    switch (iconType) {
      case 'user':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'cog':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'database':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
          </svg>
        );
      case 'shield':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      case 'bell':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM12 9v3m0 0v3m0-3h3m-3 0H9m12-5a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="mt-2 text-gray-600">
              Manage your account settings and application preferences.
            </p>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="flex">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="ml-3">
                  <div className="text-red-800">{error}</div>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
              <div className="flex">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div className="ml-3">
                  <div className="text-green-800">{success}</div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="divide-y divide-gray-200 lg:grid lg:grid-cols-12 lg:divide-y-0 lg:divide-x">
              {/* Sidebar */}
              <aside className="py-6 lg:col-span-3">
                <nav className="space-y-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full group border-l-4 px-3 py-2 flex items-center text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'border-transparent text-gray-900 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <span className="truncate">
                        <div className="flex items-center">
                          {getTabIcon(tab.icon)}
                          <span className="ml-3">{tab.name}</span>
                        </div>
                      </span>
                    </button>
                  ))}
                </nav>
              </aside>

              {/* Main content */}
              <div className="divide-y divide-gray-200 lg:col-span-9">
                <div className="py-6 px-4 sm:p-6 lg:pb-8">
                  {/* Profile Tab */}
                  {activeTab === 'profile' && (
                    <div>
                      <div className="mb-6">
                        <h2 className="text-lg leading-6 font-medium text-gray-900">Profile Information</h2>
                        <p className="mt-1 text-sm text-gray-500">
                          Update your account profile information and password.
                        </p>
                      </div>

                      <form onSubmit={handleProfileUpdate} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Username
                            </label>
                            <input
                              type="text"
                              value={userProfile.username}
                              onChange={(e) => setUserProfile({ ...userProfile, username: e.target.value })}
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Email Address
                            </label>
                            <input
                              type="email"
                              value={userProfile.email}
                              onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })}
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                              required
                            />
                          </div>
                        </div>

                        <div className="border-t border-gray-200 pt-6">
                          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Change Password</h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Current Password
                              </label>
                              <input
                                type="password"
                                value={userProfile.currentPassword}
                                onChange={(e) => setUserProfile({ ...userProfile, currentPassword: e.target.value })}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Leave blank to keep current"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                New Password
                              </label>
                              <input
                                type="password"
                                value={userProfile.newPassword}
                                onChange={(e) => setUserProfile({ ...userProfile, newPassword: e.target.value })}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Leave blank to keep current"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Confirm Password
                              </label>
                              <input
                                type="password"
                                value={userProfile.confirmPassword}
                                onChange={(e) => setUserProfile({ ...userProfile, confirmPassword: e.target.value })}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Confirm new password"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="submit"
                            disabled={isLoading}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                          >
                            {isLoading ? 'Updating...' : 'Update Profile'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Application Settings Tab */}
                  {activeTab === 'app' && (
                    <div>
                      <div className="mb-6">
                        <h2 className="text-lg leading-6 font-medium text-gray-900">Application Settings</h2>
                        <p className="mt-1 text-sm text-gray-500">
                          Configure application behavior and file processing options.
                        </p>
                      </div>

                      <form onSubmit={handleAppSettingsUpdate} className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Maximum File Size (MB)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="500"
                            value={Math.round(appSettings.maxFileSize / 1024 / 1024)}
                            onChange={(e) => setAppSettings({ 
                              ...appSettings, 
                              maxFileSize: parseInt(e.target.value) * 1024 * 1024 
                            })}
                            className="mt-1 block w-full md:w-48 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          />
                          <p className="mt-1 text-sm text-gray-500">Maximum size for uploaded files</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Document Retention (Days)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="3650"
                            value={appSettings.retentionDays}
                            onChange={(e) => setAppSettings({ ...appSettings, retentionDays: parseInt(e.target.value) })}
                            className="mt-1 block w-full md:w-48 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          />
                          <p className="mt-1 text-sm text-gray-500">How long to keep processed documents</p>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center">
                            <input
                              id="auto-process"
                              type="checkbox"
                              checked={appSettings.autoProcessUploads}
                              onChange={(e) => setAppSettings({ ...appSettings, autoProcessUploads: e.target.checked })}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="auto-process" className="ml-2 block text-sm text-gray-900">
                              Auto-process uploaded files
                            </label>
                          </div>

                          <div className="flex items-center">
                            <input
                              id="enable-notifications"
                              type="checkbox"
                              checked={appSettings.enableNotifications}
                              onChange={(e) => setAppSettings({ ...appSettings, enableNotifications: e.target.checked })}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="enable-notifications" className="ml-2 block text-sm text-gray-900">
                              Enable system notifications
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Supported File Types
                          </label>
                          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                            {['.jpg', '.jpeg', '.png', '.bmp', '.gif', '.tif', '.tiff', '.pdf', '.webp'].map((type) => (
                              <div key={type} className="flex items-center">
                                <input
                                  id={`type-${type}`}
                                  type="checkbox"
                                  checked={appSettings.allowedFileTypes.includes(type)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setAppSettings({
                                        ...appSettings,
                                        allowedFileTypes: [...appSettings.allowedFileTypes, type]
                                      });
                                    } else {
                                      setAppSettings({
                                        ...appSettings,
                                        allowedFileTypes: appSettings.allowedFileTypes.filter(t => t !== type)
                                      });
                                    }
                                  }}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor={`type-${type}`} className="ml-1 block text-xs text-gray-900">
                                  {type}
                                </label>
                              </div>
                            ))}
                          </div>
                          <p className="mt-1 text-sm text-gray-500">Select which file types are allowed for upload</p>
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="submit"
                            disabled={isLoading}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                          >
                            {isLoading ? 'Updating...' : 'Update Settings'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Database Settings Tab */}
                  {activeTab === 'database' && (
                    <div>
                      <div className="mb-6">
                        <h2 className="text-lg leading-6 font-medium text-gray-900">Database Settings</h2>
                        <p className="mt-1 text-sm text-gray-500">
                          Configure database connection and performance options.
                        </p>
                      </div>

                      <form onSubmit={handleDatabaseSettingsUpdate} className="space-y-6">
                        {/* Database Type */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Database Type
                          </label>
                          <select
                            value={appSettings.database.type}
                            onChange={(e) => setAppSettings({
                              ...appSettings,
                              database: { ...appSettings.database, type: e.target.value }
                            })}
                            className="mt-1 block w-full md:w-48 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="sqlite">SQLite</option>
                            <option value="postgresql">PostgreSQL</option>
                            <option value="mysql">MySQL</option>
                            <option value="sqlserver">SQL Server</option>
                            <option value="mongodb">MongoDB</option>
                          </select>
                          <p className="mt-1 text-sm text-gray-500">Select the database provider to use</p>
                        </div>

                        {/* Connection String for SQLite */}
                        {appSettings.database.type === 'sqlite' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Database File Path
                            </label>
                            <input
                              type="text"
                              value={appSettings.database.connectionString}
                              onChange={(e) => setAppSettings({
                                ...appSettings,
                                database: { ...appSettings.database, connectionString: e.target.value }
                              })}
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Data Source=agentdms.db"
                            />
                            <p className="mt-1 text-sm text-gray-500">Path to the SQLite database file</p>
                          </div>
                        )}

                        {/* Host and Port for other databases */}
                        {appSettings.database.type !== 'sqlite' && (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Host
                                </label>
                                <input
                                  type="text"
                                  value={appSettings.database.host}
                                  onChange={(e) => setAppSettings({
                                    ...appSettings,
                                    database: { ...appSettings.database, host: e.target.value }
                                  })}
                                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="localhost"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Port
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  max="65535"
                                  value={appSettings.database.port || ''}
                                  onChange={(e) => setAppSettings({
                                    ...appSettings,
                                    database: { ...appSettings.database, port: parseInt(e.target.value) || 0 }
                                  })}
                                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="5432"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Database Name
                              </label>
                              <input
                                type="text"
                                value={appSettings.database.databaseName}
                                onChange={(e) => setAppSettings({
                                  ...appSettings,
                                  database: { ...appSettings.database, databaseName: e.target.value }
                                })}
                                className="mt-1 block w-full md:w-64 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                placeholder="agentdms"
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Username
                                </label>
                                <input
                                  type="text"
                                  value={appSettings.database.username}
                                  onChange={(e) => setAppSettings({
                                    ...appSettings,
                                    database: { ...appSettings.database, username: e.target.value }
                                  })}
                                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="username"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Password
                                </label>
                                <input
                                  type="password"
                                  value={appSettings.database.password}
                                  onChange={(e) => setAppSettings({
                                    ...appSettings,
                                    database: { ...appSettings.database, password: e.target.value }
                                  })}
                                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="password"
                                />
                              </div>
                            </div>
                          </>
                        )}

                        {/* Advanced Settings */}
                        <div className="border-t pt-6">
                          <h3 className="text-md font-medium text-gray-900 mb-4">Advanced Settings</h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Connection Timeout (seconds)
                              </label>
                              <input
                                type="number"
                                min="1"
                                max="300"
                                value={appSettings.database.advanced.connectionTimeout}
                                onChange={(e) => setAppSettings({
                                  ...appSettings,
                                  database: {
                                    ...appSettings.database,
                                    advanced: { ...appSettings.database.advanced, connectionTimeout: parseInt(e.target.value) || 30 }
                                  }
                                })}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Command Timeout (seconds)
                              </label>
                              <input
                                type="number"
                                min="1"
                                max="600"
                                value={appSettings.database.advanced.commandTimeout}
                                onChange={(e) => setAppSettings({
                                  ...appSettings,
                                  database: {
                                    ...appSettings.database,
                                    advanced: { ...appSettings.database.advanced, commandTimeout: parseInt(e.target.value) || 30 }
                                  }
                                })}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Max Pool Size
                              </label>
                              <input
                                type="number"
                                min="1"
                                max="1000"
                                value={appSettings.database.advanced.maxPoolSize}
                                onChange={(e) => setAppSettings({
                                  ...appSettings,
                                  database: {
                                    ...appSettings.database,
                                    advanced: { ...appSettings.database.advanced, maxPoolSize: parseInt(e.target.value) || 100 }
                                  }
                                })}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Min Pool Size
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={appSettings.database.advanced.minPoolSize}
                                onChange={(e) => setAppSettings({
                                  ...appSettings,
                                  database: {
                                    ...appSettings.database,
                                    advanced: { ...appSettings.database.advanced, minPoolSize: parseInt(e.target.value) || 0 }
                                  }
                                })}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                          </div>

                          <div className="mt-4">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={appSettings.database.advanced.enableConnectionPooling}
                                onChange={(e) => setAppSettings({
                                  ...appSettings,
                                  database: {
                                    ...appSettings.database,
                                    advanced: { ...appSettings.database.advanced, enableConnectionPooling: e.target.checked }
                                  }
                                })}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <label className="ml-2 block text-sm text-gray-900">
                                Enable Connection Pooling
                              </label>
                            </div>
                          </div>

                          <div className="mt-4">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={appSettings.database.advanced.enableSsl}
                                onChange={(e) => setAppSettings({
                                  ...appSettings,
                                  database: {
                                    ...appSettings.database,
                                    advanced: { ...appSettings.database.advanced, enableSsl: e.target.checked }
                                  }
                                })}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <label className="ml-2 block text-sm text-gray-900">
                                Enable SSL
                              </label>
                            </div>
                          </div>

                          <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Additional Options
                            </label>
                            <textarea
                              rows={3}
                              value={appSettings.database.advanced.additionalOptions}
                              onChange={(e) => setAppSettings({
                                ...appSettings,
                                database: {
                                  ...appSettings.database,
                                  advanced: { ...appSettings.database.advanced, additionalOptions: e.target.value }
                                }
                              })}
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Additional connection string parameters"
                            />
                            <p className="mt-1 text-sm text-gray-500">Additional connection string options (key=value pairs)</p>
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="submit"
                            disabled={isLoading}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                          >
                            {isLoading ? 'Updating...' : 'Update Database Settings'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Storage Settings Tab */}
                  {activeTab === 'storage' && (
                    <div>
                      <div className="mb-6">
                        <h2 className="text-lg leading-6 font-medium text-gray-900">Image Storage Settings</h2>
                        <p className="mt-1 text-sm text-gray-500">
                          Configure image storage provider and connection settings.
                        </p>
                      </div>

                      <form onSubmit={handleAppSettingsUpdate} className="space-y-6">
                        {/* Storage Provider */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Storage Provider
                          </label>
                          <select
                            value={appSettings.imageStorage.provider}
                            onChange={(e) => setAppSettings({
                              ...appSettings,
                              imageStorage: { ...appSettings.imageStorage, provider: e.target.value }
                            })}
                            className="mt-1 block w-full md:w-48 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="local">Local Storage</option>
                            <option value="aws">Amazon S3</option>
                            <option value="azure">Azure Blob Storage</option>
                          </select>
                          <p className="mt-1 text-sm text-gray-500">Select where images will be stored</p>
                        </div>

                        {/* Local Storage Settings */}
                        {appSettings.imageStorage.provider === 'local' && (
                          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                            <h3 className="text-sm font-medium text-gray-900">Local Storage Configuration</h3>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Base Path
                              </label>
                              <input
                                type="text"
                                value={appSettings.imageStorage.local.basePath}
                                onChange={(e) => setAppSettings({
                                  ...appSettings,
                                  imageStorage: {
                                    ...appSettings.imageStorage,
                                    local: { ...appSettings.imageStorage.local, basePath: e.target.value }
                                  }
                                })}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                placeholder="./uploads/images"
                              />
                              <p className="mt-1 text-sm text-gray-500">Local directory path for storing images</p>
                            </div>

                            <div className="flex items-center">
                              <input
                                id="create-directory"
                                type="checkbox"
                                checked={appSettings.imageStorage.local.createDirectoryIfNotExists}
                                onChange={(e) => setAppSettings({
                                  ...appSettings,
                                  imageStorage: {
                                    ...appSettings.imageStorage,
                                    local: { ...appSettings.imageStorage.local, createDirectoryIfNotExists: e.target.checked }
                                  }
                                })}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <label htmlFor="create-directory" className="ml-2 block text-sm text-gray-900">
                                Create directory if it doesn't exist
                              </label>
                            </div>
                          </div>
                        )}

                        {/* AWS S3 Settings */}
                        {appSettings.imageStorage.provider === 'aws' && (
                          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                            <h3 className="text-sm font-medium text-gray-900">Amazon S3 Configuration</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Bucket Name
                                </label>
                                <input
                                  type="text"
                                  value={appSettings.imageStorage.aws.bucketName}
                                  onChange={(e) => setAppSettings({
                                    ...appSettings,
                                    imageStorage: {
                                      ...appSettings.imageStorage,
                                      aws: { ...appSettings.imageStorage.aws, bucketName: e.target.value }
                                    }
                                  })}
                                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="my-bucket-name"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Region
                                </label>
                                <input
                                  type="text"
                                  value={appSettings.imageStorage.aws.region}
                                  onChange={(e) => setAppSettings({
                                    ...appSettings,
                                    imageStorage: {
                                      ...appSettings.imageStorage,
                                      aws: { ...appSettings.imageStorage.aws, region: e.target.value }
                                    }
                                  })}
                                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="us-east-1"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Access Key ID
                                </label>
                                <input
                                  type="text"
                                  value={appSettings.imageStorage.aws.accessKeyId}
                                  onChange={(e) => setAppSettings({
                                    ...appSettings,
                                    imageStorage: {
                                      ...appSettings.imageStorage,
                                      aws: { ...appSettings.imageStorage.aws, accessKeyId: e.target.value }
                                    }
                                  })}
                                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="AKIAIOSFODNN7EXAMPLE"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Secret Access Key
                                </label>
                                <input
                                  type="password"
                                  value={appSettings.imageStorage.aws.secretAccessKey}
                                  onChange={(e) => setAppSettings({
                                    ...appSettings,
                                    imageStorage: {
                                      ...appSettings.imageStorage,
                                      aws: { ...appSettings.imageStorage.aws, secretAccessKey: e.target.value }
                                    }
                                  })}
                                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Base Path
                              </label>
                              <input
                                type="text"
                                value={appSettings.imageStorage.aws.basePath}
                                onChange={(e) => setAppSettings({
                                  ...appSettings,
                                  imageStorage: {
                                    ...appSettings.imageStorage,
                                    aws: { ...appSettings.imageStorage.aws, basePath: e.target.value }
                                  }
                                })}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                placeholder="images/"
                              />
                              <p className="mt-1 text-sm text-gray-500">Path prefix for storing images in the bucket</p>
                            </div>
                          </div>
                        )}

                        {/* Azure Blob Storage Settings */}
                        {appSettings.imageStorage.provider === 'azure' && (
                          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                            <h3 className="text-sm font-medium text-gray-900">Azure Blob Storage Configuration</h3>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Connection String
                              </label>
                              <textarea
                                value={appSettings.imageStorage.azure.connectionString}
                                onChange={(e) => setAppSettings({
                                  ...appSettings,
                                  imageStorage: {
                                    ...appSettings.imageStorage,
                                    azure: { ...appSettings.imageStorage.azure, connectionString: e.target.value }
                                  }
                                })}
                                rows={3}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                placeholder="DefaultEndpointsProtocol=https;AccountName=myaccount;AccountKey=mykey;EndpointSuffix=core.windows.net"
                              />
                              <p className="mt-1 text-sm text-gray-500">Azure Storage account connection string</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Container Name
                                </label>
                                <input
                                  type="text"
                                  value={appSettings.imageStorage.azure.containerName}
                                  onChange={(e) => setAppSettings({
                                    ...appSettings,
                                    imageStorage: {
                                      ...appSettings.imageStorage,
                                      azure: { ...appSettings.imageStorage.azure, containerName: e.target.value }
                                    }
                                  })}
                                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="images"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Base Path
                                </label>
                                <input
                                  type="text"
                                  value={appSettings.imageStorage.azure.basePath}
                                  onChange={(e) => setAppSettings({
                                    ...appSettings,
                                    imageStorage: {
                                      ...appSettings.imageStorage,
                                      azure: { ...appSettings.imageStorage.azure, basePath: e.target.value }
                                    }
                                  })}
                                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="images/"
                                />
                                <p className="mt-1 text-sm text-gray-500">Path prefix for storing images in the container</p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex justify-end">
                          <button
                            type="submit"
                            disabled={isLoading}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                          >
                            {isLoading ? 'Updating...' : 'Update Settings'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Security Tab */}
                  {activeTab === 'security' && (
                    <div>
                      <div className="mb-6">
                        <h2 className="text-lg leading-6 font-medium text-gray-900">Security Settings</h2>
                        <p className="mt-1 text-sm text-gray-500">
                          Manage security features and authentication options.
                        </p>
                      </div>

                      <div className="space-y-6">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h3 className="text-sm font-medium text-gray-900 mb-2">Two-Factor Authentication</h3>
                          <p className="text-sm text-gray-600 mb-3">
                            Add an extra layer of security to your account with 2FA.
                          </p>
                          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                            Enable 2FA
                          </button>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h3 className="text-sm font-medium text-gray-900 mb-2">Active Sessions</h3>
                          <p className="text-sm text-gray-600 mb-3">
                            Manage your active login sessions across different devices.
                          </p>
                          <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                            Revoke All Sessions
                          </button>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h3 className="text-sm font-medium text-gray-900 mb-2">API Keys</h3>
                          <p className="text-sm text-gray-600 mb-3">
                            Generate API keys for programmatic access to the system.
                          </p>
                          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                            Generate API Key
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notifications Tab */}
                  {activeTab === 'notifications' && (
                    <div>
                      <div className="mb-6">
                        <h2 className="text-lg leading-6 font-medium text-gray-900">Notification Preferences</h2>
                        <p className="mt-1 text-sm text-gray-500">
                          Choose what notifications you'd like to receive and how.
                        </p>
                      </div>

                      <form className="space-y-6">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-4">Email Notifications</h3>
                          <div className="space-y-3">
                            <div className="flex items-center">
                              <input
                                id="email-uploads"
                                type="checkbox"
                                defaultChecked
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <label htmlFor="email-uploads" className="ml-2 block text-sm text-gray-900">
                                File upload completed
                              </label>
                            </div>
                            
                            <div className="flex items-center">
                              <input
                                id="email-processing"
                                type="checkbox"
                                defaultChecked
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <label htmlFor="email-processing" className="ml-2 block text-sm text-gray-900">
                                Document processing status updates
                              </label>
                            </div>

                            <div className="flex items-center">
                              <input
                                id="email-errors"
                                type="checkbox"
                                defaultChecked
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <label htmlFor="email-errors" className="ml-2 block text-sm text-gray-900">
                                System errors and failures
                              </label>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-4">Push Notifications</h3>
                          <div className="space-y-3">
                            <div className="flex items-center">
                              <input
                                id="push-uploads"
                                type="checkbox"
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <label htmlFor="push-uploads" className="ml-2 block text-sm text-gray-900">
                                Real-time upload progress
                              </label>
                            </div>

                            <div className="flex items-center">
                              <input
                                id="push-completion"
                                type="checkbox"
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <label htmlFor="push-completion" className="ml-2 block text-sm text-gray-900">
                                Processing completion alerts
                              </label>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                          >
                            Save Preferences
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;