import { create } from 'zustand';
import type { WalletTransaction, CashbackEvent, WithdrawalRequest } from '@/types';
import { walletAPI, type WalletSummary } from '@/lib/api/wallet';

interface WalletState {
  wallet: WalletSummary | null;
  transactions: WalletTransaction[];
  cashbackEvents: CashbackEvent[];
  withdrawalRequests: WithdrawalRequest[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchWallet: () => Promise<void>;
  fetchTransactions: (page?: number, pageSize?: number) => Promise<void>;
  fetchCashbackEvents: (status?: string) => Promise<void>;
  fetchWithdrawalRequests: () => Promise<void>;
  requestWithdrawal: (amount: number, method: string, accountDetails: Record<string, string>) => Promise<void>;
  clearError: () => void;
}

export const useWalletStore = create<WalletState>()((set, get) => ({
  wallet: null,
  transactions: [],
  cashbackEvents: [],
  withdrawalRequests: [],
  isLoading: false,
  error: null,

  fetchWallet: async () => {
    set({ isLoading: true, error: null });
    try {
      const wallet = await walletAPI.getWallet();
      set({ wallet, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch wallet',
        isLoading: false,
      });
    }
  },

  fetchTransactions: async (page = 1, pageSize = 20) => {
    set({ isLoading: true, error: null });
    try {
      const response = await walletAPI.getTransactions({ page, limit: pageSize });
      set({ transactions: response.items || [], isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch transactions',
        isLoading: false,
      });
    }
  },

  fetchCashbackEvents: async (status?: string) => {
    set({ isLoading: true, error: null });
    try {
      // Cashback events would come from transactions with type 'cashback'
      const response = await walletAPI.getTransactions({ type: 'cashback' });
      set({ cashbackEvents: response.items || [], isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch cashback events',
        isLoading: false,
      });
    }
  },

  fetchWithdrawalRequests: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await walletAPI.getWithdrawals();
      set({ withdrawalRequests: response.items || [], isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch withdrawal requests',
        isLoading: false,
      });
    }
  },

  requestWithdrawal: async (amount: number, method: string, accountDetails: Record<string, string>) => {
    set({ isLoading: true, error: null });
    try {
      await walletAPI.requestWithdrawal({
        amount,
        method: method as 'bank_transfer' | 'upi' | 'paytm',
        ...accountDetails
      });
      // Refresh wallet and withdrawal requests
      await get().fetchWallet();
      await get().fetchWithdrawalRequests();
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to request withdrawal',
        isLoading: false,
      });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
