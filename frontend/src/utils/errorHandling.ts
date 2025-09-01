/**
 * Enhanced error handling utilities for providing user-friendly error messages
 */

export interface EnhancedError {
  message: string;
  isPermissionError?: boolean;
  logMessage?: string;
}

/**
 * Enhances error messages, particularly for permission-related errors (403)
 * @param error - The original error object
 * @param context - Optional context about what operation failed
 * @returns Enhanced error with user-friendly message
 */
export function enhanceErrorMessage(error: unknown, context?: string): EnhancedError {
  // Check if this is an Axios error with response
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { 
      response?: { 
        status?: number; 
        data?: { message?: string }; 
        statusText?: string;
      };
      message?: string;
    };

    if (axiosError.response?.status === 403) {
      // 403 Forbidden - Permission error
      const operation = context ? ` ${context}` : ' this action';
      const userMessage = `You do not have permission to perform${operation}. Please log in with sufficient privileges or contact your administrator for access.`;
      
      // Log specific details for debugging (without exposing to user)
      const logMessage = `403 Permission error${context ? ` for ${context}` : ''}: ${axiosError.response?.data?.message || axiosError.response?.statusText || 'Forbidden'}`;
      
      return {
        message: userMessage,
        isPermissionError: true,
        logMessage
      };
    }

    if (axiosError.response?.status === 401) {
      // 401 Unauthorized - Authentication error
      return {
        message: 'Your session has expired. Please log in again to continue.',
        logMessage: `401 Authentication error: ${axiosError.response?.data?.message || axiosError.response?.statusText || 'Unauthorized'}`
      };
    }

    if (axiosError.response?.status) {
      // Other HTTP errors
      const backendMessage = axiosError.response?.data?.message;
      if (backendMessage) {
        return {
          message: backendMessage,
          logMessage: `HTTP ${axiosError.response.status} error: ${backendMessage}`
        };
      }
      
      return {
        message: `Request failed with status ${axiosError.response.status}. Please try again or contact support if the problem persists.`,
        logMessage: `HTTP ${axiosError.response.status} error: ${axiosError.response?.statusText || 'Unknown error'}`
      };
    }
  }

  // Network or other errors
  if (error instanceof Error) {
    // Check for common network errors
    if (error.message.includes('Network Error') || error.message.includes('timeout')) {
      return {
        message: 'Network connection failed. Please check your internet connection and try again.',
        logMessage: `Network error: ${error.message}`
      };
    }

    return {
      message: error.message,
      logMessage: error.message
    };
  }

  // Fallback for unknown errors
  const fallbackMessage = context 
    ? `Failed to ${context}. Please try again.`
    : 'An unexpected error occurred. Please try again.';

  return {
    message: fallbackMessage,
    logMessage: `Unknown error: ${String(error)}`
  };
}

/**
 * Logs error details for debugging purposes
 * @param enhancedError - The enhanced error object
 * @param component - Optional component name for context
 */
export function logError(enhancedError: EnhancedError, component?: string): void {
  const prefix = component ? `[${component}]` : '[Error]';
  
  if (enhancedError.isPermissionError) {
    console.warn(`${prefix} Permission error:`, enhancedError.logMessage);
  } else {
    console.error(`${prefix}`, enhancedError.logMessage);
  }
}