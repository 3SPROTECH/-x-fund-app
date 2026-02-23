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

  createUser(data) {
    return client.post('/admin/users', { user: data });
  },

  // Properties
  getProperties(params = {}) {
    return client.get('/admin/properties', { params });
  },

  getProperty(id) {
    return client.get(`/admin/properties/${id}`);
  },

  createProperty(data) {
    return client.post('/admin/properties', { property: data });
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

  getProjectReport(projectId) {
    return client.get(`/admin/investment_projects/${projectId}/report`);
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

  requestInfo(id, comment) {
    return client.patch(`/admin/investment_projects/${id}/request_info`, { comment });
  },

  advanceStatus(id, status, comment = '') {
    return client.patch(`/admin/investment_projects/${id}/advance_status`, { status, comment });
  },

  assignAnalyst(projectId, analystId) {
    return client.patch(`/admin/investment_projects/${projectId}/assign_analyst`, { analyst_id: analystId });
  },

  // MVP Reports
  getMvpReports(projectId, params = {}) {
    return client.get(`/admin/investment_projects/${projectId}/mvp_reports`, { params });
  },

  getMvpReport(projectId, reportId) {
    return client.get(`/admin/investment_projects/${projectId}/mvp_reports/${reportId}`);
  },

  createMvpReport(projectId, data) {
    return client.post(`/admin/investment_projects/${projectId}/mvp_reports`, { mvp_report: data });
  },

  updateMvpReport(projectId, reportId, data) {
    return client.patch(`/admin/investment_projects/${projectId}/mvp_reports/${reportId}`, { mvp_report: data });
  },

  deleteMvpReport(projectId, reportId) {
    return client.delete(`/admin/investment_projects/${projectId}/mvp_reports/${reportId}`);
  },

  validateMvpReport(projectId, reportId, comment = '') {
    return client.patch(`/admin/investment_projects/${projectId}/mvp_reports/${reportId}/validate_report`, { comment });
  },

  rejectMvpReport(projectId, reportId, comment) {
    return client.patch(`/admin/investment_projects/${projectId}/mvp_reports/${reportId}/reject_report`, { comment });
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

  // Settings
  getSettings() {
    return client.get('/admin/settings');
  },

  updateSettings(settings) {
    return client.patch('/admin/settings', { settings });
  },

  // Platform Wallet
  getPlatformWallet() {
    return client.get('/admin/platform_wallet');
  },
};
