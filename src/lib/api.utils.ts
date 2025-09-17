import { useGlobalLoading } from "@/hooks/useGlobalLoading";

interface ApiCallOptions {
  loadingText?: string;
  showLoading?: boolean;
  timeout?: number; // Timeout in milliseconds
}

interface ApiError extends Error {
  status?: number;
  statusText?: string;
  data?: any;
}

export class ApiClient {
  private static instance: ApiClient;

  private constructor() {}

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  async request<T = any>(
    url: string,
    options: RequestInit & ApiCallOptions = {}
  ): Promise<T> {
    const { loadingText = "Đang tải dữ liệu...", showLoading = true, timeout = 30000, ...fetchOptions } = options;

    try {
      if (showLoading) {
        useGlobalLoading.getState().showLoading(loadingText);
      }

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      let response: Response;
      try {
        response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            ...fetchOptions.headers,
          },
          signal: controller.signal,
          ...fetchOptions,
        });
        clearTimeout(timeoutId);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          const timeoutError: ApiError = new Error('Request timeout');
          timeoutError.name = 'TimeoutError';
          throw timeoutError;
        }
        throw fetchError;
      }

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: response.statusText || 'Unknown error' };
        }

        const apiError: ApiError = new Error(errorData.error || `HTTP Error: ${response.status}`);
        apiError.status = response.status;
        apiError.statusText = response.statusText;
        apiError.data = errorData;
        throw apiError;
      }

      const data = await response.json();
      return data;
    } finally {
      if (showLoading) {
        useGlobalLoading.getState().hideLoading();
      }
    }
  }

  async get<T = any>(url: string, options: Omit<RequestInit & ApiCallOptions, 'method'> = {}): Promise<T> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  async post<T = any>(url: string, data?: any, options: Omit<RequestInit & ApiCallOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T = any>(url: string, data?: any, options: Omit<RequestInit & ApiCallOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = any>(url: string, data?: any, options: Omit<RequestInit & ApiCallOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = any>(url: string, options: Omit<RequestInit & ApiCallOptions, 'method'> = {}): Promise<T> {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  }
}

export const apiClient = ApiClient.getInstance();

export const useApiClient = () => {
  const globalLoading = useGlobalLoading();

  const request = async <T = any>(
    url: string,
    options: RequestInit & ApiCallOptions = {}
  ): Promise<T> => {
    const { loadingText = "Đang tải dữ liệu...", showLoading = true, timeout = 30000, ...fetchOptions } = options;

    try {
      if (showLoading) {
        globalLoading.showLoading(loadingText);
      }

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      let response: Response;
      try {
        response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            ...fetchOptions.headers,
          },
          signal: controller.signal,
          ...fetchOptions,
        });
        clearTimeout(timeoutId);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          const timeoutError: ApiError = new Error('Request timeout');
          timeoutError.name = 'TimeoutError';
          throw timeoutError;
        }
        throw fetchError;
      }

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: response.statusText || 'Unknown error' };
        }

        const apiError: ApiError = new Error(errorData.error || `HTTP Error: ${response.status}`);
        apiError.status = response.status;
        apiError.statusText = response.statusText;
        apiError.data = errorData;
        throw apiError;
      }

      const data = await response.json();
      return data;
    } finally {
      if (showLoading) {
        globalLoading.hideLoading();
      }
    }
  };

  return {
    get: <T = any>(url: string, options: Omit<RequestInit & ApiCallOptions, 'method'> = {}) =>
      request<T>(url, { ...options, method: 'GET' }),
    
    post: <T = any>(url: string, data?: any, options: Omit<RequestInit & ApiCallOptions, 'method' | 'body'> = {}) =>
      request<T>(url, {
        ...options,
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      }),
    
    patch: <T = any>(url: string, data?: any, options: Omit<RequestInit & ApiCallOptions, 'method' | 'body'> = {}) =>
      request<T>(url, {
        ...options,
        method: 'PATCH',
        body: data ? JSON.stringify(data) : undefined,
      }),
    
    put: <T = any>(url: string, data?: any, options: Omit<RequestInit & ApiCallOptions, 'method' | 'body'> = {}) =>
      request<T>(url, {
        ...options,
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      }),
    
    delete: <T = any>(url: string, data?: any, options: Omit<RequestInit & ApiCallOptions, 'method' | 'body'> = {}) =>
      request<T>(url, {
        ...options,
        method: 'DELETE',
        body: data ? JSON.stringify(data) : undefined,
      }),
  };
}; 