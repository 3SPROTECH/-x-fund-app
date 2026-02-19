import client from './client';

export const projectDraftsApi = {
  list() {
    return client.get('/project_drafts');
  },

  get(id) {
    return client.get(`/project_drafts/${id}`);
  },

  create(data) {
    return client.post('/project_drafts', { project_draft: data });
  },

  update(id, data) {
    return client.patch(`/project_drafts/${id}`, { project_draft: data });
  },

  delete(id) {
    return client.delete(`/project_drafts/${id}`);
  },

  submit(id) {
    return client.post(`/project_drafts/${id}/submit`);
  },
};
