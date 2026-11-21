import apiClient from './apiClient';

/**
 * Serialized Equipment & Equipment Passport Service
 * Conforms to API-Specification.md §11
 */
export const equipmentService = {
  /**
   * POST /api/equipment
   */
  async registerEquipment(equipmentData) {
    return apiClient.post('/equipment', equipmentData);
  },

  /**
   * GET /api/equipment
   */
  async getEquipmentList(params = {}) {
    return apiClient.get('/equipment', params);
  },

  /**
   * GET /api/equipment/:serial
   */
  async getEquipmentBySerial(serial) {
    return apiClient.get(`/equipment/${encodeURIComponent(serial)}`);
  },

  /**
   * GET /api/equipment/:serial/passport
   * Equipment Passport - Flagship lookup
   */
  async getEquipmentPassport(serial) {
    return apiClient.get(`/equipment/${encodeURIComponent(serial)}/passport`);
  },
};

export default equipmentService;
