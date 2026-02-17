import client from './client';

export const companiesApi = {
  get() {
    return client.get('/company');
  },

  createOrUpdate(data) {
    // If data is FormData (file uploads), let axios set Content-Type automatically
    if (data instanceof FormData) {
      return client.put('/company', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return client.put('/company', { company: data });
  },
};
