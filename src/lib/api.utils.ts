import { useGlobalLoading } from "@/hooks/useGlobalLoading";

interface ApiCallOptions {
  loadingText?: string;
  showLoading?: boolean;
}

export class ApiClient {
  private static instance: ApiClient;
  private globalLoading = useGlobalLoading.getState();

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
    const { loadingText = "Đang tải dữ liệu...", showLoading = true, ...fetchOptions } = options;

    try {
      if (showLoading) {
        this.globalLoading.showLoading(loadingText);
      }

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
        ...fetchOptions,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP Error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } finally {
      if (showLoading) {
        this.globalLoading.hideLoading();
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
    const { loadingText = "Đang tải dữ liệu...", showLoading = true, ...fetchOptions } = options;

    try {
      if (showLoading) {
        globalLoading.showLoading(loadingText);
      }

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
        ...fetchOptions,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP Error: ${response.status}`);
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
    
    delete: <T = any>(url: string, options: Omit<RequestInit & ApiCallOptions, 'method'> = {}) =>
      request<T>(url, { ...options, method: 'DELETE' }),
  };
}; 