import apiClient from './apiClient';

/**
 * Dispatch Service
 * Conforms to API-Specification.md §10
 */
export const dispatchService = {
  /**
   * GET /api/dispatches
   */
  async getDispatches(params = {}) {
    return apiClient.get('/dispatches', params);
  },

  /**
   * POST /api/orders/:id/dispatches
   */
  async createDispatch(orderId, dispatchData) {
    return apiClient.post(`/orders/${orderId}/dispatches`, dispatchData);
  },

  /**
   * POST /api/dispatches/:id/confirm
   */
  async confirmDispatch(id) {
    return apiClient.post(`/dispatches/${id}/confirm`);
  },

  /**
   * POST /api/dispatches/:id/deliver
   */
  async deliverDispatch(id) {
    return apiClient.post(`/dispatches/${id}/deliver`);
  },

  /**
   * GET /api/dispatches/:id
   */
  async getDispatchById(id) {
    return apiClient.get(`/dispatches/${id}`);
  },
};

export default dispatchService;
