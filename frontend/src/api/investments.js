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

  update(id, data) {
    return client.put(`/investment_projects/${id}`, { investment_project: data });
  },

  delete(id) {
    return client.delete(`/investment_projects/${id}`);
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

export const porteurDashboardApi = {
  get() {
    return client.get('/porteur_dashboard');
  },
};

export const projectInvestorsApi = {
  list(projectId, params = {}) {
    return client.get(`/investment_projects/${projectId}/project_investors`, { params });
  },
};
