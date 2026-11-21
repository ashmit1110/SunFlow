import apiClient from './apiClient';

/**
 * Dashboard & Reporting Service
 * Conforms to API-Specification.md §15
 */
export const dashboardService = {
  /**
   * GET /api/dashboard/summary
   * @param {{ range?: 'today' | 'week' | 'month' }} params
   */
  async getSummary(params = { range: 'month' }) {
    return apiClient.get('/dashboard/summary', params);
  },

  /**
   * GET /api/dashboard/orders-profitability
   * Returns per-order estimated margin
   */
  async getOrdersProfitability() {
    return apiClient.get('/dashboard/orders-profitability');
  },

  /**
   * GET /api/dashboard/service-overview
   */
  async getServiceOverview() {
    return apiClient.get('/dashboard/service-overview');
  },
};

export default dashboardService;
