import client from './client';

export const investmentProjectsApi = {
  list(params = {}) {
    return client.get('/investment_projects', { params });
  },

  get(id) {
    return client.get(`/investment_projects/${id}`);
  },

  create(data) {
    const { property_ids, properties_data, form_snapshot, ...payload } = data;
    const body = { investment_project: payload };
    if (properties_data && properties_data.length > 0) {
      body.properties_data = properties_data;
    } else {
      body.property_ids = property_ids || [];
    }
    if (form_snapshot) {
      body.form_snapshot = form_snapshot;
    }
    return client.post('/investment_projects', body);
  },

  update(id, data) {
    return client.put(`/investment_projects/${id}`, { investment_project: data });
  },

  delete(id) {
    return client.delete(`/investment_projects/${id}`);
  },

  getAnalystReport(projectId) {
    return client.get(`/investment_projects/${projectId}/analyst_report`);
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

export const platformConfigApi = {
  get() {
    return client.get('/platform_config');
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
    return client.get(`/investment_projects/${projectId}/investors`, { params });
  },
};

export const mvpReportsApi = {
  list(projectId, params = {}) {
    return client.get(`/investment_projects/${projectId}/mvp_reports`, { params });
  },

  get(projectId, reportId) {
    return client.get(`/investment_projects/${projectId}/mvp_reports/${reportId}`);
  },

  create(projectId, data) {
    return client.post(`/investment_projects/${projectId}/mvp_reports`, { mvp_report: data });
  },

  update(projectId, reportId, data) {
    return client.patch(`/investment_projects/${projectId}/mvp_reports/${reportId}`, { mvp_report: data });
  },

  delete(projectId, reportId) {
    return client.delete(`/investment_projects/${projectId}/mvp_reports/${reportId}`);
  },

  submit(projectId, reportId) {
    return client.patch(`/investment_projects/${projectId}/mvp_reports/${reportId}/submit`);
  },
};
