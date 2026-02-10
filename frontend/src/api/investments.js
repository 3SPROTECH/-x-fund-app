import client from './client';

export const investmentProjectsApi = {
  list(params = {}) {
    return client.get('/investment_projects', { params });
  },

  get(id) {
    return client.get(`/investment_projects/${id}`);
  },

  create(propertyId, data) {
    return client.post(`/properties/${propertyId}/investment_projects`, { investment_project: data });
  },
};

export const investmentsApi = {
  list(params = {}) {
    return client.get('/investments', { params });
  },

  get(id) {
    return client.get(`/investments/${id}`);
  },

  create(projectId, amountCents) {
    return client.post(`/investment_projects/${projectId}/investments`, {
      investment: { amount_cents: amountCents },
    });
  },
};

export const dashboardApi = {
  get() {
    return client.get('/dashboard');
  },
};
