import apiClient from './apiClient';

/**
 * Dispatch Service
 * Conforms to API-Specification.md §10
 */
export const dispatchService = {
  /**
   * GET /api/dispatches
   * Tries /dispatches endpoint first; if not mounted, derives dispatches from /orders
   */
  async getDispatches(params = {}) {
    try {
      return await apiClient.get('/dispatches', params);
    } catch (err) {
      if (err.status === 404) {
        // Backend exposes dispatches through orders: GET /api/orders
        const ordersRes = await apiClient.get('/orders', { pageSize: 100 });
        const orders = ordersRes?.data || [];
        const aggregated = [];
        for (const o of orders) {
          if (Array.isArray(o.dispatches)) {
            for (const d of o.dispatches) {
              aggregated.push({
                ...d,
                orderId: o.id,
                customerName: o.customer?.name || o.quote?.customer?.name || 'Customer',
                scheduledDate: d.dispatchDate
                  ? new Date(d.dispatchDate).toLocaleDateString()
                  : (o.installationRecord?.scheduledDate ? new Date(o.installationRecord.scheduledDate).toLocaleDateString() : '-'),
                serializedCount: d.equipment?.length || 0,
                nonSerializedItemsCount: d.items?.length || 0,
                order: o,
              });
            }
          }
        }
        return { data: aggregated };
      }
      throw err;
    }
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
