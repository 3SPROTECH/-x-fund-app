import client from './client';

export const propertiesApi = {
  list(params = {}) {
    return client.get('/properties', { params });
  },

  get(id) {
    return client.get(`/properties/${id}`);
  },

  create(formData) {
    return client.post('/properties', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  update(id, formData) {
    return client.patch(`/properties/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  delete(id) {
    return client.delete(`/properties/${id}`);
  },
};
