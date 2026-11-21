import apiClient from './apiClient';

/**
 * Products & Inventory Service
 * Conforms to API-Specification.md §6
 */
export const productService = {
  /**
   * GET /api/products
   */
  async getProducts(params = {}) {
    return apiClient.get('/products', params);
  },

  /**
   * POST /api/products
   */
  async createProduct(productData) {
    return apiClient.post('/products', productData);
  },

  /**
   * PATCH /api/products/:id
   */
  async updateProduct(id, productData) {
    return apiClient.patch(`/products/${id}`, productData);
  },

  /**
   * GET /api/products/:id/stock-movements
   */
  async getStockMovements(id) {
    return apiClient.get(`/products/${id}/stock-movements`);
  },

  /**
   * GET /api/inventory
   */
  async getInventory(params = {}) {
    return apiClient.get('/inventory', params);
  },

  /**
   * POST /api/inventory/:productId/adjust
   */
  async adjustInventory(productId, adjustmentData) {
    return apiClient.post(`/inventory/${productId}/adjust`, adjustmentData);
  },
};

export default productService;
