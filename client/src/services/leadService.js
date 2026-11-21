import apiClient from './apiClient';

/**
 * Leads & Customers Service
 * Conforms to API-Specification.md §4
 */
export const leadService = {
  /**
   * GET /api/leads
   * @param {{ status?: string, page?: number, pageSize?: number }} params
   */
  async getLeads(params = {}) {
    return apiClient.get('/leads', params);
  },

  /**
   * GET /api/leads/:id
   */
  async getLeadById(id) {
    return apiClient.get(`/leads/${id}`);
  },

  /**
   * POST /api/leads
   */
  async createLead(leadData) {
    return apiClient.post('/leads', leadData);
  },

  /**
   * PATCH /api/leads/:id/qualify
   */
  async qualifyLead(id, qualifyData) {
    return apiClient.patch(`/leads/${id}/qualify`, qualifyData);
  },

  /**
   * PATCH /api/leads/:id/status
   */
  async updateStatus(id, status) {
    return apiClient.patch(`/leads/${id}/status`, { status });
  },

  /**
   * GET /api/customers/:id
   */
  async getCustomerById(id) {
    return apiClient.get(`/customers/${id}`);
  },
};

export default leadService;
