import client from './client';

export const dividendsApi = {
  list(projectId) {
    return client.get(`/investment_projects/${projectId}/dividends`);
  },
  get(projectId, id) {
    return client.get(`/investment_projects/${projectId}/dividends/${id}`);
  },
  create(projectId, data) {
    return client.post(`/investment_projects/${projectId}/dividends`, data);
  },
  update(projectId, id, data) {
    return client.put(`/investment_projects/${projectId}/dividends/${id}`, { dividend: data });
  },
  delete(projectId, id) {
    return client.delete(`/investment_projects/${projectId}/dividends/${id}`);
  },
};
