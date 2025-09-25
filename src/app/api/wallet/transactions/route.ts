import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { prisma } from '@/lib/prisma';
import { TransactionType } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.zaloId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const typeFilter = url.searchParams.get('type');

    // Get user wallet
    const wallet = await prisma.userWallet.findUnique({
      where: { userId: session.user.zaloId }
    });

    if (!wallet) {
      return NextResponse.json({ transactions: [], total: 0 });
    }

    // Build where clause
    const where: any = {
      walletId: wallet.id
    };

    if (typeFilter && typeFilter !== 'ALL') {
      where.type = typeFilter as TransactionType;
    }

    // Get transactions with pagination
    const [transactions, totalCount] = await Promise.all([
      prisma.walletTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.walletTransaction.count({
        where
      })
    ]);

    return NextResponse.json({
      transactions,
      total: totalCount,
      limit,
      offset
    });

  } catch (error) {
    console.error('Wallet transactions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
