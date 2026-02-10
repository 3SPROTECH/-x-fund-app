import client from './client';

export const walletApi = {
  getWallet() {
    return client.get('/wallet');
  },

  deposit(amountCents) {
    return client.post('/wallet/deposit', { amount_cents: amountCents });
  },

  withdraw(amountCents) {
    return client.post('/wallet/withdraw', { amount_cents: amountCents });
  },

  getTransactions(params = {}) {
    return client.get('/wallet/transactions', { params });
  },
};
