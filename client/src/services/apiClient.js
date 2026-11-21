/**
 * SunFlow Centralized API Client
 * Built with native fetch, token management, and standard SunFlow error handling.
 * Conforms to System-Architecture.md §7 and API-Specification.md §1-2.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export class ApiError extends Error {
  constructor(message, status, code, fields = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

/**
 * Core HTTP request handler
 */
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const token = localStorage.getItem('sunflow_token');

  const headers = {
    ...options.headers,
  };

  // Only set Content-Type to application/json if not uploading FormData
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    // 204 No Content
    if (response.status === 204) {
      return { data: null };
    }

    const json = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorData = json.error || {};
      const errorMessage = errorData.message || response.statusText || 'Request failed';
      const errorCode = errorData.code || 'UNKNOWN_ERROR';
      const fields = errorData.fields || {};

      // Handle unauthenticated session expiry
      if (response.status === 401) {
        localStorage.removeItem('sunflow_token');
        localStorage.removeItem('sunflow_user');
        window.dispatchEvent(new CustomEvent('sunflow:auth-unauthorized'));
      }

      throw new ApiError(errorMessage, response.status, errorCode, fields);
    }

    return json;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    // Network or parser error
    throw new ApiError(err.message || 'Network connection failed', 0, 'NETWORK_ERROR');
  }
}

export const apiClient = {
  get: (endpoint, queryParams) => {
    let url = endpoint;
    if (queryParams) {
      const searchParams = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          searchParams.append(key, val);
        }
      });
      const qs = searchParams.toString();
      if (qs) url += `?${qs}`;
    }
    return request(url, { method: 'GET' });
  },

  post: (endpoint, data) => {
    const isFormData = data instanceof FormData;
    return request(endpoint, {
      method: 'POST',
      body: isFormData ? data : JSON.stringify(data),
    });
  },

  patch: (endpoint, data) => {
    return request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  put: (endpoint, data) => {
    return request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: (endpoint) => {
    return request(endpoint, { method: 'DELETE' });
  },
};

export default apiClient;
