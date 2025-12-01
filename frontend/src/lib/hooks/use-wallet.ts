import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { walletAPI, type TransactionFilters, type WithdrawalCreateRequest, type CashbackConversionRequest } from '@/lib/api/wallet';

// Query keys
export const walletKeys = {
  all: ['wallet'] as const,
  summary: () => [...walletKeys.all, 'summary'] as const,
  transactions: (filters?: TransactionFilters) => [...walletKeys.all, 'transactions', filters] as const,
  withdrawals: (status?: string, page?: number) => [...walletKeys.all, 'withdrawals', status, page] as const,
};

// Get wallet summary
export function useWalletSummary() {
  return useQuery({
    queryKey: walletKeys.summary(),
    queryFn: () => walletAPI.getWallet(),
  });
}

// Get transaction history
export function useWalletTransactions(filters?: TransactionFilters) {
  return useQuery({
    queryKey: walletKeys.transactions(filters),
    queryFn: () => walletAPI.getTransactions(filters),
  });
}

// Get withdrawal history
export function useWithdrawals(status?: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: walletKeys.withdrawals(status, page),
    queryFn: () => walletAPI.getWithdrawals(status, page, limit),
  });
}

// Convert cashback mutation
export function useConvertCashback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request?: CashbackConversionRequest) => walletAPI.convertCashback(request),
    onSuccess: () => {
      // Invalidate wallet summary and transactions
      queryClient.invalidateQueries({ queryKey: walletKeys.summary() });
      queryClient.invalidateQueries({ queryKey: walletKeys.transactions() });
    },
  });
}

// Request withdrawal mutation
export function useRequestWithdrawal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: WithdrawalCreateRequest) => walletAPI.requestWithdrawal(request),
    onSuccess: () => {
      // Invalidate wallet summary, transactions, and withdrawals
      queryClient.invalidateQueries({ queryKey: walletKeys.summary() });
      queryClient.invalidateQueries({ queryKey: walletKeys.transactions() });
      queryClient.invalidateQueries({ queryKey: walletKeys.withdrawals() });
    },
  });
}

// Admin: Get all withdrawals
export function useAdminWithdrawals(status?: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: ['admin', 'withdrawals', status, page],
    queryFn: () => walletAPI.getAllWithdrawals(status, page, limit),
  });
}

// Admin: Approve withdrawal
export function useApproveWithdrawal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      withdrawalId, 
      admin_notes, 
      transaction_id 
    }: { 
      withdrawalId: number; 
      admin_notes?: string; 
      transaction_id?: string;
    }) => walletAPI.approveWithdrawal(withdrawalId, admin_notes, transaction_id),
    onSuccess: () => {
      // Invalidate admin withdrawals list
      queryClient.invalidateQueries({ queryKey: ['admin', 'withdrawals'] });
    },
  });
}

// Admin: Reject withdrawal
export function useRejectWithdrawal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      withdrawalId, 
      admin_notes 
    }: { 
      withdrawalId: number; 
      admin_notes?: string;
    }) => walletAPI.rejectWithdrawal(withdrawalId, admin_notes),
    onSuccess: () => {
      // Invalidate admin withdrawals list
      queryClient.invalidateQueries({ queryKey: ['admin', 'withdrawals'] });
    },
  });
}
