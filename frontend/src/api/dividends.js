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
};
