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
};
