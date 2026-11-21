import apiClient from './apiClient';

/**
 * Service Tickets Service
 * Conforms to API-Specification.md §13
 */
export const ticketService = {
  /**
   * POST /api/service-tickets
   */
  async createTicket(ticketData) {
    return apiClient.post('/service-tickets', ticketData);
  },

  /**
   * GET /api/service-tickets
   */
  async getTickets(params = {}) {
    return apiClient.get('/service-tickets', params);
  },

  /**
   * GET /api/service-tickets/:id
   */
  async getTicketById(id) {
    return apiClient.get(`/service-tickets/${id}`);
  },

  /**
   * PATCH /api/service-tickets/:id/status
   */
  async updateTicketStatus(id, status) {
    return apiClient.patch(`/service-tickets/${id}/status`, { status });
  },

  /**
   * POST /api/service-tickets/:id/charges
   */
  async addCharge(id, chargeData) {
    return apiClient.post(`/service-tickets/${id}/charges`, chargeData);
  },
};

export default ticketService;
