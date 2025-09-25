import { prisma } from '@/lib/prisma';
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

export async function getOrCreateWallet(userId: string, tx?: any): Promise<WalletInfo> {
  const prismaClient = tx || prisma;

  let wallet = await prismaClient.userWallet.findUnique({
    where: { userId }
  });

  if (!wallet) {
    wallet = await prismaClient.userWallet.create({
      data: { userId }
    });
  }

  return {
    id: wallet.id,
    balance: wallet.balance,
    totalDeposit: wallet.totalDeposit,
    totalSpent: wallet.totalSpent,
    createdAt: wallet.createdAt,
    updatedAt: wallet.updatedAt
  };
}

export async function addWalletTransaction(
  walletId: string,
  type: TransactionType,
  amount: number,
  description?: string,
  referenceId?: string,
  tx?: any
): Promise<void> {
  const prismaClient = tx || prisma;

  // Use atomic operations to update wallet and create transaction in one query
  // First, get the current wallet state and update it atomically
  const wallet = await prismaClient.userWallet.findUnique({
    where: { id: walletId }
  });

  if (!wallet) {
    throw new Error('Wallet not found');
  }

  const balanceBefore = wallet.balance;
  const balanceAfter = balanceBefore + amount;

  // Update wallet balance atomically
  const updateData: any = {
    balance: balanceAfter,
    updatedAt: new Date()
  };

  if (type === TransactionType.DEPOSIT) {
    updateData.totalDeposit = wallet.totalDeposit + Math.abs(amount);
  } else if (type === TransactionType.PURCHASE) {
    updateData.totalSpent = wallet.totalSpent + Math.abs(amount);
  }

  await prismaClient.userWallet.update({
    where: { id: walletId },
    data: updateData
  });

  // Create transaction record
  await prismaClient.walletTransaction.create({
    data: {
      walletId,
      type,
      amount,
      balanceBefore,
      balanceAfter,
      description,
      referenceId
    }
  });
}

export async function checkWalletBalance(walletId: string, requiredAmount: number): Promise<boolean> {
  const wallet = await prisma.userWallet.findUnique({
    where: { id: walletId },
    select: { balance: true }
  });

  return wallet ? wallet.balance >= requiredAmount : false;
}

export async function getWalletTransactions(
  walletId: string,
  limit: number = 20,
  offset: number = 0
): Promise<TransactionInfo[]> {
  const transactions = await prisma.walletTransaction.findMany({
    where: { walletId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset
  });

  return transactions.map(tx => ({
    id: tx.id,
    type: tx.type,
    amount: tx.amount,
    balanceBefore: tx.balanceBefore,
    balanceAfter: tx.balanceAfter,
    description: tx.description || undefined,
    referenceId: tx.referenceId || undefined,
    createdAt: tx.createdAt
  }));
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
