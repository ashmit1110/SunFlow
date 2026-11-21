import apiClient from './apiClient';

/**
 * Authentication Service
 * Conforms to API-Specification.md §2
 */
export const authService = {
  /**
   * POST /api/auth/login
   * @param {{ email: string, password: string }} credentials
   */
  async login(credentials) {
    const res = await apiClient.post('/auth/login', credentials);
    if (res?.data?.token) {
      localStorage.setItem('sunflow_token', res.data.token);
      localStorage.setItem('sunflow_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  /**
   * GET /api/auth/me
   */
  async getMe() {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },

  /**
   * Clear local session
   */
  logout() {
    localStorage.removeItem('sunflow_token');
    localStorage.removeItem('sunflow_user');
  },

  getCurrentUser() {
    try {
      const stored = localStorage.getItem('sunflow_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  isAuthenticated() {
    return !!localStorage.getItem('sunflow_token');
  },
};

export default authService;
