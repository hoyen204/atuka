import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth.config';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const accountId = parseInt(params.id);
    const body = await request.json();
    
    const { mineId, mineTimeRange, availableBuffAmount, toggle } = body;

    const updateData: any = {};
    
    if (mineId !== undefined) {
      updateData.mineId = mineId;
    }
    
    if (mineTimeRange !== undefined) {
      updateData.mineTimeRange = mineTimeRange;
    }
    
    if (availableBuffAmount !== undefined) {
      updateData.availableBuffAmount = parseInt(availableBuffAmount);
    }

    if (toggle !== undefined) {
      updateData.toggle = Boolean(toggle);
    }

    const updatedAccount = await prisma.account.update({
      where: { id: accountId },
      data: updateData,
      select: {
        id: true,
        name: true,
        mineId: true,
        mineTimeRange: true,
        availableBuffAmount: true,
        clanId: true,
        clanName: true,
        updatedAt: true
      }
    });

    return NextResponse.json(updatedAccount);
  } catch (error) {
    console.error('Error updating account:', error);
    return NextResponse.json({ error: 'Failed to update account' }, { status: 500 });
  }
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const accountId = parseInt(params.id);
    
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: {
        id: true,
        name: true,
        cookie: true,
        mineId: true,
        mineTimeRange: true,
        availableBuffAmount: true,
        clanId: true,
        clanName: true,
        toggle: true,
        cultivation: true,
        gem: true,
        creatorId: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    return NextResponse.json(account);
  } catch (error) {
    console.error('Error fetching account:', error);
    return NextResponse.json({ error: 'Failed to fetch account' }, { status: 500 });
  }
} 