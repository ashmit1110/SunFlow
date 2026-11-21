import apiClient from './apiClient';

/**
 * Customers Service
 * Conforms to API-Specification.md §4 and customer.routes.js
 */
export const customerService = {
  /**
   * GET /api/customers
   * @param {{ search?: string, page?: number, pageSize?: number }} params
   */
  async getCustomers(params = {}) {
    return apiClient.get('/customers', params);
  },

  /**
   * GET /api/customers/:id
   */
  async getCustomerById(id) {
    return apiClient.get(`/customers/${id}`);
  },

  /**
   * POST /api/customers
   * @param {{ name: string, phone: string, email?: string, address: string }} customerData
   */
  async createCustomer(customerData) {
    return apiClient.post('/customers', customerData);
  },

  /**
   * PATCH /api/customers/:id
   */
  async updateCustomer(id, customerData) {
    return apiClient.patch(`/customers/${id}`, customerData);
  },
};

export default customerService;
