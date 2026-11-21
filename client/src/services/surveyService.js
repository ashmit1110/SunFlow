import apiClient from './apiClient';

/**
 * Site Surveys Service
 * Conforms to API-Specification.md §5
 */
export const surveyService = {
  /**
   * POST /api/leads/:leadId/surveys
   */
  async submitSurvey(leadId, surveyData) {
    return apiClient.post(`/leads/${leadId}/surveys`, surveyData);
  },

  /**
   * GET /api/surveys/:id
   */
  async getSurveyById(id) {
    return apiClient.get(`/surveys/${id}`);
  },

  /**
   * POST /api/surveys/:id/approve
   */
  async approveSurvey(id) {
    return apiClient.post(`/surveys/${id}/approve`);
  },

  /**
   * POST /api/surveys/:id/reject
   */
  async rejectSurvey(id, rejectionReason) {
    return apiClient.post(`/surveys/${id}/reject`, { rejectionReason });
  },
};

export default surveyService;
