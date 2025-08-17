import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { settingsService } from '../services/settings';
import type { AppSettings } from '../services/settings';
import Header from '../components/Header';

interface UserProfile {
  name: string;
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
    name: user?.username || user?.name || user?.email || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // App settings state
  const [appSettings, setAppSettings] = useState<AppSettings>({
    maxFileSize: 50 * 1024 * 1024, // 50MB in bytes
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
    theme: 'light',
    defaultPageSize: 10,
    dateFormat: 'MM/dd/yyyy',
    timeFormat: '12h'
  });

  const tabs = [
    { id: 'profile', name: 'Profile', icon: 'user' },
    { id: 'app', name: 'Application', icon: 'cog' },
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
                              Full Name
                            </label>
                            <input
                              type="text"
                              value={userProfile.name}
                              onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
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