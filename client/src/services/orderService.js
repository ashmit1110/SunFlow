import apiClient from './apiClient';

/**
 * Installation Orders & Payments Service
 * Conforms to API-Specification.md §9 and §14
 */
export const orderService = {
  /**
   * GET /api/orders
   */
  async getOrders(params = {}) {
    return apiClient.get('/orders', params);
  },

  /**
   * GET /api/orders/:id
   */
  async getOrderById(id) {
    return apiClient.get(`/orders/${id}`);
  },

  /**
   * GET /api/orders/:id/picking-list
   */
  async getPickingList(id) {
    return apiClient.get(`/orders/${id}/picking-list`);
  },

  /**
   * POST /api/orders/:id/cancel
   */
  async cancelOrder(id) {
    return apiClient.post(`/orders/${id}/cancel`);
  },

  /**
   * POST /api/orders/:id/expenses
   */
  async addExpense(id, expenseData) {
    return apiClient.post(`/orders/${id}/expenses`, expenseData);
  },

  /**
   * POST /api/orders/:id/assign-technician
   */
  async assignTechnician(id, { technicianUserId, scheduledDate }) {
    return apiClient.post(`/orders/${id}/assign-technician`, {
      technicianUserId,
      scheduledDate,
    });
  },

  /**
   * POST /api/orders/:id/payments
   */
  async recordPayment(id, paymentData) {
    return apiClient.post(`/orders/${id}/payments`, paymentData);
  },

  /**
   * GET /api/orders/:id/payments
   */
  async getPayments(id) {
    return apiClient.get(`/orders/${id}/payments`);
  },
};

export default orderService;
