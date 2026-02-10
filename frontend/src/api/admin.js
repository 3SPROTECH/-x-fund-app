import client from './client';

export const adminApi = {
  // Users
  getUsers(params = {}) {
    return client.get('/admin/users', { params });
  },

  getUser(id) {
    return client.get(`/admin/users/${id}`);
  },

  updateUser(id, data) {
    return client.patch(`/admin/users/${id}`, { user: data });
  },

  deleteUser(id) {
    return client.delete(`/admin/users/${id}`);
  },

  verifyKyc(userId) {
    return client.patch(`/admin/users/${userId}/verify_kyc`);
  },

  rejectKyc(userId, reason) {
    return client.patch(`/admin/users/${userId}/reject_kyc`, { reason });
  },

  // Properties
  getProperties(params = {}) {
    return client.get('/admin/properties', { params });
  },

  getProperty(id) {
    return client.get(`/admin/properties/${id}`);
  },

  updateProperty(id, data) {
    return client.patch(`/admin/properties/${id}`, { property: data });
  },

  deleteProperty(id) {
    return client.delete(`/admin/properties/${id}`);
  },

  // Investment Projects
  getProjects(params = {}) {
    return client.get('/admin/investment_projects', { params });
  },

  getProject(id) {
    return client.get(`/admin/investment_projects/${id}`);
  },

  updateProject(id, data) {
    return client.patch(`/admin/investment_projects/${id}`, { investment_project: data });
  },

  approveProject(id, comment = '') {
    return client.patch(`/admin/investment_projects/${id}/approve`, { comment });
  },

  rejectProject(id, comment) {
    return client.patch(`/admin/investment_projects/${id}/reject`, { comment });
  },

  // Investments
  getInvestments(params = {}) {
    return client.get('/admin/investments', { params });
  },

  getInvestment(id) {
    return client.get(`/admin/investments/${id}`);
  },

  // Transactions
  getTransactions(params = {}) {
    return client.get('/admin/transactions', { params });
  },

  getTransaction(id) {
    return client.get(`/admin/transactions/${id}`);
  },

  // Dashboard
  getDashboard() {
    return client.get('/admin/dashboard');
  },

  // Audit logs
  getAuditLogs(params = {}) {
    return client.get('/admin/audit_logs', { params });
  },

  // Exports
  exportUsers(format = 'json') {
    return client.get('/admin/exports/users', { params: { format } });
  },

  exportInvestments(format = 'json') {
    return client.get('/admin/exports/investments', { params: { format } });
  },

  exportTransactions(format = 'json') {
    return client.get('/admin/exports/transactions', { params: { format } });
  },
};
