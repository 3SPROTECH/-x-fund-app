import client from './client';

export const delaysApi = {
  // List all delays for current user's projects
  list: (params = {}) => client.get('/project_delays', { params }),

  // List delays for a specific project
  listByProject: (projectId, params = {}) =>
    client.get(`/investment_projects/${projectId}/project_delays`, { params }),

  // Get a single delay
  get: (id) => client.get(`/project_delays/${id}`),

  // Create a delay for a project
  create: (projectId, data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'supporting_documents' && Array.isArray(value)) {
        value.forEach((file) => formData.append('supporting_documents[]', file));
      } else if (value !== null && value !== undefined) {
        formData.append(`project_delay[${key}]`, value);
      }
    });
    return client.post(`/investment_projects/${projectId}/project_delays`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Update a delay
  update: (id, data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'supporting_documents' && Array.isArray(value)) {
        value.forEach((file) => formData.append('supporting_documents[]', file));
      } else if (value !== null && value !== undefined) {
        formData.append(`project_delay[${key}]`, value);
      }
    });
    return client.patch(`/project_delays/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Delete a delay
  delete: (id) => client.delete(`/project_delays/${id}`),
};
