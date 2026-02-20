import client from './client';

export const analysteApi = {
  getProjects(params = {}) {
    return client.get('/analyste/projects', { params });
  },

  getProject(id) {
    return client.get(`/analyste/projects/${id}`);
  },

  submitOpinion(id, data) {
    return client.patch(`/analyste/projects/${id}/submit_opinion`, data);
  },

  requestInfo(id, fields, comment = '') {
    return client.post(`/analyste/projects/${id}/request_info`, { fields, comment });
  },

  approveProject(id, data = {}) {
    return client.patch(`/analyste/projects/${id}/approve`, data);
  },

  rejectProject(id, data = {}) {
    return client.patch(`/analyste/projects/${id}/reject`, data);
  },

  generateReport(id, data = {}) {
    return client.post(`/analyste/projects/${id}/generate_report`, data);
  },

  getReport(id) {
    return client.get(`/analyste/projects/${id}/report`);
  },
};
