import apiClient from './apiClient';

/**
 * Solar Packages & BOM Service
 * Conforms to API-Specification.md §7
 */
export const bomService = {
  /**
   * GET /api/bom-templates
   */
  async getTemplates(params = {}) {
    return apiClient.get('/bom-templates', params);
  },

  /**
   * POST /api/bom-templates
   */
  async createTemplate(templateData) {
    return apiClient.post('/bom-templates', templateData);
  },

  /**
   * GET /api/bom-templates/:id
   */
  async getTemplateById(id) {
    return apiClient.get(`/bom-templates/${id}`);
  },

  /**
   * POST /api/bom-templates/resolve
   */
  async resolveBom({ systemType, capacityKw }) {
    return apiClient.post('/bom-templates/resolve', { systemType, capacityKw });
  },
};

export default bomService;
