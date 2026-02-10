import client from './client';

export const kycApi = {
  getStatus() {
    return client.get('/kyc');
  },

  submit(formData) {
    return client.post('/kyc', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  update(formData) {
    return client.patch('/kyc', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
