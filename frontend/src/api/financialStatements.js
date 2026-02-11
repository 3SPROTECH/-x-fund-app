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
  update(projectId, id, data) {
    return client.put(`/investment_projects/${projectId}/financial_statements/${id}`, { financial_statement: data });
  },
  delete(projectId, id) {
    return client.delete(`/investment_projects/${projectId}/financial_statements/${id}`);
  },
};
