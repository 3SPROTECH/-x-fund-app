import client from './client';

export const analysteApi = {
  getProjects(params = {}) {
    return client.get('/analyste/projects', { params });
  },

  getProject(id) {
    return client.get(`/analyste/projects/${id}`);
  },

  requestInfo(id, fields, comment = '') {
    return client.post(`/analyste/projects/${id}/request_info`, { fields, comment });
  },

  submitAnalysis(id, data) {
    return client.post(`/analyste/projects/${id}/submit_analysis`, data);
  },

  getReport(id) {
    return client.get(`/analyste/projects/${id}/report`);
  },

  // Analysis drafts
  getDraft(projectId) {
    return client.get(`/analyste/projects/${projectId}/analysis_draft`);
  },

  saveDraft(projectId, data) {
    return client.post(`/analyste/projects/${projectId}/analysis_draft`, { analysis_draft: data });
  },

  updateDraft(projectId, data) {
    return client.patch(`/analyste/projects/${projectId}/analysis_draft`, { analysis_draft: data });
  },

  deleteDraft(projectId) {
    return client.delete(`/analyste/projects/${projectId}/analysis_draft`);
  },

  // KYC management
  getKycList(params = {}) {
    return client.get('/analyste/kyc', { params });
  },

  getKycUser(id) {
    return client.get(`/analyste/kyc/${id}`);
  },

  verifyKyc(id) {
    return client.patch(`/analyste/kyc/${id}/verify`);
  },

  rejectKyc(id, reason) {
    return client.patch(`/analyste/kyc/${id}/reject`, { reason });
  },
};
