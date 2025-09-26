import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { getOrCreateWallet, getWalletTransactions } from '@/lib/wallet.service.utils';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.zaloId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const wallet = await getOrCreateWallet(session.user.zaloId);

    const url = new URL(request.url);
    const includeTransactions = url.searchParams.get('transactions') === 'true';
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    let transactions: any[] = [];
    if (includeTransactions) {
      transactions = await getWalletTransactions(wallet.id, limit, offset);
    }

    return NextResponse.json({
      wallet,
      transactions
    });

  } catch (error) {
    console.error('Wallet fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.zaloId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Tạo wallet nếu chưa có
    const wallet = await getOrCreateWallet(session.user.zaloId);

    return NextResponse.json({
      message: 'Wallet created successfully',
      wallet
    });

  } catch (error) {
    console.error('Wallet creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
