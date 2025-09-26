import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { prisma } from '@/lib/prisma';
import { addWalletTransaction } from '@/lib/wallet.service.utils';
import { TransactionType } from '@prisma/client';

interface AdjustmentRequest {
  userId: string;
  amount: number;
  type: 'BONUS' | 'PENALTY';
  description: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { userId, amount, type, description }: AdjustmentRequest = await request.json();

    if (!userId || !amount || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (amount <= 0) {
      return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 });
    }

    if (type !== 'BONUS' && type !== 'PENALTY') {
      return NextResponse.json({ error: 'Invalid adjustment type' }, { status: 400 });
    }

    // Check if user has wallet
    let wallet = await prisma.userWallet.findUnique({
      where: { userId }
    });

    if (!wallet) {
      return NextResponse.json({ error: 'User wallet not found' }, { status: 404 });
    }

    // For penalty, check if user has enough balance
    if (type === 'PENALTY' && wallet.balance < amount) {
      return NextResponse.json({
        error: 'Insufficient balance for penalty',
        current: wallet.balance,
        required: amount
      }, { status: 400 });
    }

    // Calculate adjustment amount
    const adjustmentAmount = type === 'BONUS' ? amount : -amount;
    const transactionType = type === 'BONUS' ? TransactionType.BONUS : TransactionType.PENALTY;

    // Create transaction record
    await addWalletTransaction(
      wallet.id,
      transactionType,
      adjustmentAmount,
      `[ADMIN] ${description}`,
      `admin_adjust_${Date.now()}`
    );

    return NextResponse.json({
      success: true,
      message: `Wallet adjusted successfully`,
      adjustment: {
        type,
        amount: adjustmentAmount,
        description
      }
    });

  } catch (error) {
    console.error('Admin wallet adjustment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
