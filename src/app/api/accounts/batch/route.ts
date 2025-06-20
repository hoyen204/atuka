import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth.config';

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { accountIds, updateData } = body;

    if (!accountIds || !Array.isArray(accountIds) || accountIds.length === 0) {
      return NextResponse.json({ error: 'accountIds is required and must be a non-empty array' }, { status: 400 });
    }

    if (!updateData || typeof updateData !== 'object') {
      return NextResponse.json({ error: 'updateData is required and must be an object' }, { status: 400 });
    }

    // Verify all accounts belong to the current user
    const accountsToUpdate = await prisma.account.findMany({
      where: {
        id: { in: accountIds },
        creatorId: session.user.zalo_id
      },
      select: { id: true }
    });

    if (accountsToUpdate.length !== accountIds.length) {
      return NextResponse.json({ 
        error: 'Some accounts not found or do not belong to you' 
      }, { status: 403 });
    }

    // Prepare update data
    const processedUpdateData: any = {};

    if (updateData.toggle !== undefined) {
      processedUpdateData.toggle = Boolean(updateData.toggle);
    }

    if (updateData.mineId !== undefined) {
      processedUpdateData.mineId = updateData.mineId === 'none' ? null : updateData.mineId;
    }

    if (updateData.mineTimeRange !== undefined) {
      processedUpdateData.mineTimeRange = updateData.mineTimeRange;
    }

    if (updateData.availableBuffAmount !== undefined) {
      processedUpdateData.availableBuffAmount = parseInt(updateData.availableBuffAmount);
    }

    if (updateData.mineType !== undefined) {
      processedUpdateData.mineType = updateData.mineType;
    }

    // Perform batch update
    const result = await prisma.account.updateMany({
      where: {
        id: { in: accountIds },
        creatorId: session.user.zalo_id
      },
      data: processedUpdateData
    });

    return NextResponse.json({
      message: 'Batch update successful',
      updatedCount: result.count,
      accountIds
    });

  } catch (error) {
    console.error('Error in batch update:', error);
    return NextResponse.json({ error: 'Failed to update accounts' }, { status: 500 });
  }
} 