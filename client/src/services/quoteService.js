import apiClient from './apiClient';

/**
 * Quotations Service
 * Conforms to API-Specification.md §8
 */
export const quoteService = {
  /**
   * POST /api/leads/:leadId/quotes
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
