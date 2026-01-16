import type { AxiosError } from 'axios';
import type { ApiError } from '../types';

// Extract error message from API error
export const getErrorMessage = (error: unknown): string => {
  if (!error) return 'An unknown error occurred';

  // Axios error
  if ((error as AxiosError).isAxiosError) {
    const axiosError = error as AxiosError<ApiError>;
    
    if (axiosError.response?.data?.detail) {
      // Handle FastAPI validation errors (array of errors)
      const detail = axiosError.response.data.detail;
      if (Array.isArray(detail)) {
        return detail.map((err: any) => err.msg || err.message).join(', ');
      }
      return detail;
    }

    if (axiosError.response?.status === 404) {
      return 'Resource not found';
    }

    if (axiosError.response?.status === 401) {
      return 'Unauthorized. Please login again.';
    }

    if (axiosError.response?.status === 403) {
      return 'You do not have permission to perform this action';
    }

    if (axiosError.response?.status === 500) {
      return 'Server error. Please try again later.';
    }

    if (axiosError.message) {
      return axiosError.message;
    }
  }

  // Standard Error object
  if (error instanceof Error) {
    return error.message;
  }

  // String error
  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred';
};

// Format validation errors
export const formatValidationErrors = (errors: Record<string, string[]>): string => {
  return Object.entries(errors)
    .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
    .join('\n');
};
