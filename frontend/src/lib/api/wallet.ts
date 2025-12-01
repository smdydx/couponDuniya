import apiClient from './client';
import type { Wallet, WalletTransaction, CashbackEvent, WithdrawalRequest, PaginatedResponse } from '@/types';

export interface WalletSummary {
  balance: number;
  pending_cashback: number;
  lifetime_earnings: number;
  total_withdrawn: number;
}

export interface TransactionFilters {
  page?: number;
  limit?: number;
  type?: string;
  from_date?: string;
  to_date?: string;
}

export interface WithdrawalCreateRequest {
  amount: number;
  method: 'bank_transfer' | 'upi' | 'paytm';
  upi_id?: string;
  bank_account_number?: string;
  bank_ifsc?: string;
  bank_account_name?: string;
}

export interface CashbackConversionRequest {
  amount?: number;
}

export const walletAPI = {
  getWallet: async (): Promise<WalletSummary> => {
    const response = await apiClient.get('/wallet/');
    return response.data.data;
  },

  getTransactions: async (filters?: TransactionFilters) => {
    const response = await apiClient.get('/wallet/transactions', { params: filters });
    return response.data.data;
  },

  convertCashback: async (request?: CashbackConversionRequest) => {
    const response = await apiClient.post('/wallet/convert-cashback', request || {});
    return response.data;
  },

  requestWithdrawal: async (request: WithdrawalCreateRequest) => {
    const response = await apiClient.post('/wallet/withdraw', request);
    return response.data;
  },

  getWithdrawals: async (status?: string, page = 1, limit = 20) => {
    const response = await apiClient.get('/wallet/withdrawals', {
      params: { status_filter: status, page, limit }
    });
    return response.data.data;
  },

  // Admin endpoints
  getAllWithdrawals: async (status?: string, page = 1, limit = 20) => {
    const response = await apiClient.get('/admin/withdrawals', {
      params: { status_filter: status, page, limit }
    });
    return response.data.data;
  },

  approveWithdrawal: async (
    withdrawalId: number,
    admin_notes?: string,
    transaction_id?: string
  ) => {
    const response = await apiClient.patch(`/admin/withdrawals/${withdrawalId}/approve`, {
      status: 'approved',
      admin_notes,
      transaction_id
    });
    return response.data;
  },

  rejectWithdrawal: async (withdrawalId: number, admin_notes?: string) => {
    const response = await apiClient.patch(`/admin/withdrawals/${withdrawalId}/reject`, {
      status: 'rejected',
      admin_notes
    });
    return response.data;
  },
};
