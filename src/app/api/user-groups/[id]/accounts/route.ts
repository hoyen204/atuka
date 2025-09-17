import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth.config';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // path variable
    const { id } = await params;
    const groupId = parseInt(id);
    if (isNaN(groupId)) {
      return NextResponse.json({ error: 'Invalid group ID' }, { status: 400 });
    }

    const body = await request.json();
    const { accountIds } = body;

    if (!Array.isArray(accountIds) || accountIds.length === 0) {
      return NextResponse.json({ error: 'Account IDs array is required' }, { status: 400 });
    }

    const userGroup = await (prisma as any).userGroup.findFirst({
      where: {
        id: groupId,
        creatorId: session.user.zalo_id,
      }
    });

    if (!userGroup) {
      return NextResponse.json({ error: 'User group not found' }, { status: 404 });
    }

    const validAccounts = await prisma.account.findMany({
      where: {
        id: { in: accountIds },
        creatorId: session.user.zalo_id,
      },
      select: { id: true }
    });

    const validAccountIds = validAccounts.map(acc => acc.id);

    if (validAccountIds.length === 0) {
      return NextResponse.json({ error: 'No valid accounts found' }, { status: 400 });
    }

    const accountGroups = await (prisma as any).accountGroup.createMany({
      data: validAccountIds.map(accountId => ({
        accountId,
        groupId,
      })),
      skipDuplicates: true,
    });

    return NextResponse.json({
      message: `Added ${accountGroups.count} accounts to group`,
      added: accountGroups.count,
    });
  } catch (error) {
    console.error('Error adding accounts to group:', error);
    return NextResponse.json({ error: 'Failed to add accounts to group' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const groupId = parseInt(id);
    if (isNaN(groupId)) {
      return NextResponse.json({ error: 'Invalid group ID' }, { status: 400 });
    }

    const body = await request.json();
    const { accountIds } = body;

    if (!Array.isArray(accountIds) || accountIds.length === 0) {
      return NextResponse.json({ error: 'Account IDs array is required' }, { status: 400 });
    }

    const userGroup = await (prisma as any).userGroup.findFirst({
      where: {
        id: groupId,
        creatorId: session.user.zalo_id,
      }
    });

    if (!userGroup) {
      return NextResponse.json({ error: 'User group not found' }, { status: 404 });
    }

    const result = await (prisma as any).accountGroup.deleteMany({
      where: {
        groupId,
        accountId: { in: accountIds },
        account: {
          creatorId: session.user.zalo_id,
        }
      }
    });

    return NextResponse.json({
      message: `Removed ${result.count} accounts from group`,
      removed: result.count,
    });
  } catch (error) {
    console.error('Error removing accounts from group:', error);
    return NextResponse.json({ error: 'Failed to remove accounts from group' }, { status: 500 });
  }
}
