import apiClient from './apiClient';

/**
 * Quotations Service
 * Conforms to API-Specification.md §8
 */
export const quoteService = {
  /**
   * GET /api/quotes
   * @param {{ status?: string, page?: number, pageSize?: number }} params
   */
  async getQuotes(params = {}) {
    return apiClient.get('/quotes', params);
  },

  /**
   * POST /api/leads/:leadId/quotes
   * @param {string} leadId
   * @param {{ systemType: string, capacityKw: number, discount?: string, tax?: string, validUntil?: string }} quoteData
   */
  async createQuote(leadId, quoteData) {
    return apiClient.post(`/leads/${leadId}/quotes`, quoteData);
  },

  /**
   * GET /api/quotes/:id
   */
  async getQuoteById(id) {
    return apiClient.get(`/quotes/${id}`);
  },

  /**
   * PATCH /api/quotes/:id/items
   */
  async updateQuoteItems(id, items) {
    return apiClient.patch(`/quotes/${id}/items`, { items });
  },

  /**
   * POST /api/quotes/:id/send
   */
  async sendQuote(id) {
    return apiClient.post(`/quotes/${id}/send`);
  },

  /**
   * POST /api/quotes/:id/accept
   * Accepts quote and atomically creates confirmed InstallationOrder (FR-053)
   */
  async acceptQuote(id) {
    return apiClient.post(`/quotes/${id}/accept`);
  },

  /**
   * POST /api/quotes/:id/reject
   */
  async rejectQuote(id) {
    return apiClient.post(`/quotes/${id}/reject`);
  },
};

export default quoteService;
