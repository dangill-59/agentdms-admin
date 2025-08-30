import { apiService } from './api';

export interface DatabaseAdvancedSettings {
  enableSsl: boolean;
  connectionTimeout: number; // seconds
  commandTimeout: number; // seconds
  maxPoolSize: number;
  minPoolSize: number;
  enableConnectionPooling: boolean;
  additionalOptions: string;
}

export interface DatabaseSettings {
  type: string; // sqlite, postgresql, mysql, sqlserver, mongodb
  host: string;
  port: number;
  databaseName: string;
  username: string;
  password: string;
  connectionString: string;
  advanced: DatabaseAdvancedSettings;
}

export interface AppSettings {
  // Database settings
  database: DatabaseSettings;
  // File processing settings
  maxFileSize: number; // in bytes
  allowedFileTypes: string[];
  autoProcessUploads: boolean;
  processingTimeout: number; // in seconds
  retentionDays: number;
  
  // Notification settings
  enableNotifications: boolean;
  emailNotifications: {
    uploadCompleted: boolean;
    processingStatus: boolean;
    systemErrors: boolean;
  };
  pushNotifications: {
    uploadProgress: boolean;
    processingCompletion: boolean;
  };
  
  // Security settings
  sessionTimeout: number; // in minutes
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };
  
  // UI settings
  theme: 'light' | 'dark' | 'auto';
  defaultPageSize: number;
  dateFormat: string;
  timeFormat: string;
}

export interface SystemInfo {
  version: string;
  buildDate: string;
  environment: string;
  uptime: string;
  systemHealth: {
    status: 'healthy' | 'warning' | 'error';
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    activeJobs: number;
  };
}

export interface NotificationPreferences {
  emailNotifications: {
    uploadCompleted: boolean;
    processingStatus: boolean;
    systemErrors: boolean;
    systemUpdates: boolean;
    securityAlerts: boolean;
  };
  pushNotifications: {
    uploadProgress: boolean;
    processingCompletion: boolean;
    systemAlerts: boolean;
  };
  inAppNotifications: {
    jobCompletion: boolean;
    systemMessages: boolean;
    errorAlerts: boolean;
  };
}

export class SettingsService {
  private readonly basePath = '/settings';

  // Application settings
  public async getAppSettings(): Promise<AppSettings> {
    try {
      const response = await apiService.get<AppSettings>(`${this.basePath}/app`);
      return response.data || response;
    } catch (error) {
      console.error('Failed to fetch app settings:', error);
      // Return default settings for development
      return {
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
        maxFileSize: 100 * 1024 * 1024, // 100MB
        allowedFileTypes: ['.jpg', '.jpeg', '.png', '.bmp', '.gif', '.tif', '.tiff', '.pdf', '.webp'],
        autoProcessUploads: true,
        processingTimeout: 300, // 5 minutes
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
        sessionTimeout: 120, // 2 hours
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
      };
    }
  }

  public async updateAppSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    const response = await apiService.put<AppSettings>(`${this.basePath}/app`, settings);
    return response.data || response;
  }

  // System information
  public async getSystemInfo(): Promise<SystemInfo> {
    try {
      const response = await apiService.get<SystemInfo>(`${this.basePath}/system`);
      return response.data || response;
    } catch (error) {
      console.error('Failed to fetch system info:', error);
      // Return mock system info for development
      return {
        version: '1.0.0',
        buildDate: new Date().toISOString(),
        environment: 'development',
        uptime: '2 hours',
        systemHealth: {
          status: 'healthy',
          cpuUsage: 25,
          memoryUsage: 60,
          diskUsage: 45,
          activeJobs: 0
        }
      };
    }
  }

  // User notification preferences
  public async getNotificationPreferences(): Promise<NotificationPreferences> {
    try {
      const response = await apiService.get<NotificationPreferences>(`${this.basePath}/notifications`);
      return response.data || response;
    } catch (error) {
      console.error('Failed to fetch notification preferences:', error);
      // Return default preferences for development
      return {
        emailNotifications: {
          uploadCompleted: true,
          processingStatus: true,
          systemErrors: true,
          systemUpdates: false,
          securityAlerts: true
        },
        pushNotifications: {
          uploadProgress: false,
          processingCompletion: true,
          systemAlerts: true
        },
        inAppNotifications: {
          jobCompletion: true,
          systemMessages: true,
          errorAlerts: true
        }
      };
    }
  }

  public async updateNotificationPreferences(preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const response = await apiService.put<NotificationPreferences>(`${this.basePath}/notifications`, preferences);
    return response.data || response;
  }

  // Security settings
  public async updateSecuritySettings(settings: {
    sessionTimeout?: number;
    passwordPolicy?: Partial<AppSettings['passwordPolicy']>;
    twoFactorAuth?: boolean;
  }): Promise<void> {
    await apiService.put(`${this.basePath}/security`, settings);
  }

  // Backup and restore
  public async exportSettings(): Promise<Blob> {
    const response = await fetch(`${apiService.getBaseURL()}${this.basePath}/export`, {
      headers: {
        'Authorization': `Bearer ${apiService.getToken()}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Settings export failed');
    }
    
    return await response.blob();
  }

  public async importSettings(file: File): Promise<void> {
    const formData = new FormData();
    formData.append('settings', file);

    const response = await fetch(`${apiService.getBaseURL()}${this.basePath}/import`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiService.getToken()}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Settings import failed');
    }
  }

  // System maintenance
  public async clearCache(): Promise<void> {
    await apiService.post(`${this.basePath}/maintenance/clear-cache`);
  }

  public async compactDatabase(): Promise<void> {
    await apiService.post(`${this.basePath}/maintenance/compact-db`);
  }

  public async generateSystemReport(): Promise<Blob> {
    const response = await fetch(`${apiService.getBaseURL()}${this.basePath}/maintenance/system-report`, {
      headers: {
        'Authorization': `Bearer ${apiService.getToken()}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate system report');
    }
    
    return await response.blob();
  }

  // Theme management
  public async updateTheme(theme: 'light' | 'dark' | 'auto'): Promise<void> {
    await apiService.put(`${this.basePath}/theme`, { theme });
    
    // Apply theme immediately
    this.applyTheme(theme);
  }

  private applyTheme(theme: 'light' | 'dark' | 'auto'): void {
    const root = document.documentElement;
    
    if (theme === 'auto') {
      // Use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
    
    // Store preference
    localStorage.setItem('theme', theme);
  }

  // Initialize theme on app start
  public initializeTheme(): void {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'auto' || 'light';
    this.applyTheme(savedTheme);
  }

  // Feature flags
  public async getFeatureFlags(): Promise<Record<string, boolean>> {
    try {
      const response = await apiService.get<Record<string, boolean>>(`${this.basePath}/features`);
      return response.data || response;
    } catch (error) {
      console.error('Failed to fetch feature flags:', error);
      return {};
    }
  }

  public async updateFeatureFlag(flag: string, enabled: boolean): Promise<void> {
    await apiService.put(`${this.basePath}/features/${flag}`, { enabled });
  }
}

export const settingsService = new SettingsService();