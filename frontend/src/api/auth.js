import client from './client';

export const authApi = {
  signUp(userData) {
    return client.post('/auth/sign_up', { user: userData });
  },

  signIn(credentials) {
    return client.post('/auth/sign_in', { user: credentials });
  },

  signOut() {
    return client.delete('/auth/sign_out');
  },

  requestPasswordReset(email) {
    return client.post('/auth/password', { user: { email } });
  },

  resetPassword({ resetPasswordToken, password, passwordConfirmation }) {
    return client.put('/auth/password', {
      user: { reset_password_token: resetPasswordToken, password, password_confirmation: passwordConfirmation },
    });
  },
};
