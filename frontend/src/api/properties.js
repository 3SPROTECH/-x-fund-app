import client from './client';

export const propertiesApi = {
  list(params = {}) {
    return client.get('/properties', { params });
  },

  get(id) {
    return client.get(`/properties/${id}`);
  },

  create(data) {
    return client.post('/properties', data);
  },

  update(id, data) {
    return client.patch(`/properties/${id}`, data);
  },

  delete(id) {
    return client.delete(`/properties/${id}`);
  },
};
