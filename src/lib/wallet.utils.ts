import { TransactionType } from '@prisma/client';

export interface WalletInfo {
  id: string;
  balance: number;
  totalDeposit: number;
  totalSpent: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionInfo {
  id: string;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description?: string;
  referenceId?: string;
  createdAt: Date;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
}

export function getTransactionTypeLabel(type: TransactionType): string {
  switch (type) {
    case TransactionType.DEPOSIT:
      return 'Nạp tiền';
    case TransactionType.PURCHASE:
      return 'Mua gói';
    case TransactionType.REFUND:
      return 'Hoàn tiền';
    case TransactionType.BONUS:
      return 'Thưởng';
    default:
      return 'Khác';
  }
}

export function getTransactionTypeColor(type: TransactionType): string {
  switch (type) {
    case TransactionType.DEPOSIT:
      return 'text-green-600';
    case TransactionType.PURCHASE:
      return 'text-red-600';
    case TransactionType.REFUND:
      return 'text-blue-600';
    case TransactionType.BONUS:
      return 'text-yellow-600';
    default:
      return 'text-gray-600';
  }
}
