/**
 * Application configuration utility
 * Manages environment variables and application settings
 */

export interface AppConfig {
  // API Configuration
  apiUrl: string;
  wsUrl: string;
  apiTimeout: number;
  retryAttempts: number;
  
  // Application Info
  appName: string;
  appVersion: string;
  environment: string;
  
  // Feature Flags
  enableDemoMode: boolean;
  enableSignalR: boolean;
  enableRealTimeUpdates: boolean;
  enableDebug: boolean;
  enableDarkMode: boolean;
  
  // File Upload
  maxFileSize: number;
  supportedFileTypes: string[];
  
  // Authentication
  tokenStorageKey: string;
  sessionTimeout: number;
  
  // UI Settings
  defaultPageSize: number;
  defaultTheme: 'light' | 'dark' | 'auto';
}

class ConfigService {
  private config: AppConfig;

  constructor() {
    this.config = {
      // API Configuration
      apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5267/api',
      wsUrl: import.meta.env.VITE_WS_URL || 'ws://localhost:5267/progressHub',
      apiTimeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
      retryAttempts: parseInt(import.meta.env.VITE_RETRY_ATTEMPTS || '3'),
      
      // Application Info
      appName: import.meta.env.VITE_APP_NAME || 'AgentDMS Admin',
      appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
      environment: 'production', // Always run in production mode for live testing
      
      // Feature Flags
      enableDemoMode: false, // Always disabled for live testing
      enableSignalR: import.meta.env.VITE_ENABLE_SIGNALR === 'true',
      enableRealTimeUpdates: import.meta.env.VITE_ENABLE_REAL_TIME_UPDATES === 'true',
      enableDebug: false, // Always disabled in production mode
      enableDarkMode: import.meta.env.VITE_ENABLE_DARK_MODE === 'true',
      
      // File Upload
      maxFileSize: parseInt(import.meta.env.VITE_MAX_FILE_SIZE || '52428800'), // 50MB
      supportedFileTypes: (import.meta.env.VITE_SUPPORTED_FILE_TYPES || '.jpg,.jpeg,.png,.bmp,.gif,.tif,.tiff,.pdf,.webp').split(','),
      
      // Authentication
      tokenStorageKey: import.meta.env.VITE_TOKEN_STORAGE_KEY || 'agentdms-admin-token',
      sessionTimeout: parseInt(import.meta.env.VITE_SESSION_TIMEOUT || '7200000'), // 2 hours
      
      // UI Settings
      defaultPageSize: parseInt(import.meta.env.VITE_DEFAULT_PAGE_SIZE || '10'),
      defaultTheme: (import.meta.env.VITE_DEFAULT_THEME as 'light' | 'dark' | 'auto') || 'light'
    };

    // Log configuration in development
    if (this.config.enableDebug) {
      console.log('AgentDMS Admin Configuration:', this.config);
    }
  }

  /**
   * Get the full application configuration
   */
  public getConfig(): AppConfig {
    return { ...this.config };
  }

  /**
   * Get a specific configuration value
   */
  public get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.config[key];
  }

  /**
   * Update a configuration value (for runtime changes)
   */
  public set<K extends keyof AppConfig>(key: K, value: AppConfig[K]): void {
    this.config[key] = value;
  }

  /**
   * Check if we're running in development mode
   */
  public isDevelopment(): boolean {
    return this.config.environment === 'development';
  }

  /**
   * Check if we're running in production mode
   */
  public isProduction(): boolean {
    return this.config.environment === 'production';
  }

  /**
   * Get formatted file size limit for display
   */
  public getFormattedMaxFileSize(): string {
    const sizeInMB = this.config.maxFileSize / (1024 * 1024);
    return `${Math.round(sizeInMB)}MB`;
  }

  /**
   * Validate if a file type is supported
   */
  public isSupportedFileType(fileExtension: string): boolean {
    return this.config.supportedFileTypes.includes(fileExtension.toLowerCase());
  }

  /**
   * Get API endpoint URL with path
   */
  public getApiUrl(path?: string): string {
    if (!path) return this.config.apiUrl;
    
    const baseUrl = this.config.apiUrl.endsWith('/') 
      ? this.config.apiUrl.slice(0, -1) 
      : this.config.apiUrl;
    
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    
    return `${baseUrl}${cleanPath}`;
  }

  /**
   * Get WebSocket URL
   */
  public getWsUrl(): string {
    return this.config.wsUrl;
  }

  /**
   * Initialize application based on configuration
   */
  public initialize(): void {
    // Set up global error handling
    if (this.config.enableDebug) {
      window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
      });
    }

    // Set initial theme
    this.applyTheme(this.config.defaultTheme);

    // Log app startup
    if (this.config.enableDebug) {
      console.log(`${this.config.appName} v${this.config.appVersion} starting in ${this.config.environment} mode`);
    }
  }

  /**
   * Apply theme to the application
   */
  private applyTheme(theme: 'light' | 'dark' | 'auto'): void {
    const root = document.documentElement;
    
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
    
    // Store theme preference
    localStorage.setItem('theme', theme);
  }

  /**
   * Get build information
   */
  public getBuildInfo(): {
    name: string;
    version: string;
    environment: string;
    buildDate: string;
  } {
    return {
      name: this.config.appName,
      version: this.config.appVersion,
      environment: this.config.environment,
      buildDate: new Date().toISOString()
    };
  }

  /**
   * Export configuration for debugging
   */
  public exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }
}

// Export singleton instance
export const config = new ConfigService();

// Initialize on module load
config.initialize();

export default config;