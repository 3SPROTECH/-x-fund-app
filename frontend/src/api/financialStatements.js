import client from './client';

export const financialStatementsApi = {
  list(projectId) {
    return client.get(`/investment_projects/${projectId}/financial_statements`);
  },
  get(projectId, id) {
    return client.get(`/investment_projects/${projectId}/financial_statements/${id}`);
  },
  create(projectId, data) {
    return client.post(`/investment_projects/${projectId}/financial_statements`, data);
  },
};
