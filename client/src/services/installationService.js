import apiClient from './apiClient';

/**
 * Technician Installations Service
 * Conforms to API-Specification.md §12
 */
export const installationService = {
  /**
   * GET /api/installations/my
   */
  async getMyInstallations() {
    return apiClient.get('/installations/my');
  },

  /**
   * GET /api/installations/:id
   */
  async getInstallationById(id) {
    return apiClient.get(`/installations/${id}`);
  },

  /**
   * PATCH /api/installations/:id/start
   */
  async startInstallation(id) {
    return apiClient.patch(`/installations/${id}/start`);
  },

  /**
   * PATCH /api/installations/:id/checklist
   */
  async updateChecklist(id, data) {
    return apiClient.patch(`/installations/${id}/checklist`, data);
  },

  /**
   * POST /api/installations/:id/photos
   */
  async uploadPhoto(id, formData) {
    return apiClient.post(`/installations/${id}/photos`, formData);
  },

  /**
   * POST /api/installations/:id/signature
   */
  async uploadSignature(id, formData) {
    return apiClient.post(`/installations/${id}/signature`, formData);
  },

  /**
   * POST /api/installations/:id/complete
   */
  async completeInstallation(id, completionData) {
    return apiClient.post(`/installations/${id}/complete`, completionData);
  },
};

export default installationService;
