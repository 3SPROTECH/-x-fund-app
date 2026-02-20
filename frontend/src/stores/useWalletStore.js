import { create } from 'zustand';
import { walletApi } from '../api/wallet';

const useWalletStore = create((set) => ({
  wallet: null,
  loading: false,
  fetchWallet: async () => {
    set({ loading: true });
    try {
      const res = await walletApi.getWallet();
      const wallet = res.data.data?.attributes || res.data;
      set({ wallet, loading: false });
    } catch {
      set({ loading: false });
    }
  },
}));

export default useWalletStore;
