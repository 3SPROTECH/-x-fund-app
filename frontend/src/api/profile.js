import client from './client';

export const profileApi = {
  getProfile() {
    return client.get('/profile');
  },

  updateProfile(data) {
    return client.patch('/profile', { user: data });
  },
};
