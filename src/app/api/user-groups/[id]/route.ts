import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth.config';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const groupId = parseInt(id);
    if (isNaN(groupId)) {
      return NextResponse.json({ error: 'Invalid group ID' }, { status: 400 });
    }

    const userGroup = await (prisma as any).userGroup.findFirst({
      where: {
        id: groupId,
        creatorId: session.user.zalo_id,
      },
      include: {
        accountGroups: {
          include: {
            account: {
              select: {
                id: true,
                name: true,
                cultivation: true,
                gem: true,
                fairyGem: true,
                clanName: true,
                toggle: true,
              }
            }
          }
        },
        _count: {
          select: {
            accountGroups: true
          }
        }
      }
    });

    if (!userGroup) {
      return NextResponse.json({ error: 'User group not found' }, { status: 404 });
    }

    return NextResponse.json({ userGroup });
  } catch (error) {
    console.error('Error fetching user group:', error);
    return NextResponse.json({ error: 'Failed to fetch user group' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const groupId = parseInt(id);
    if (isNaN(groupId)) {
      return NextResponse.json({ error: 'Invalid group ID' }, { status: 400 });
    }

    const body = await request.json();
    const { name, label } = body;

    if (!name || !label) {
      return NextResponse.json({ error: 'Name and label are required' }, { status: 400 });
    }

    const existingGroup = await (prisma as any).userGroup.findFirst({
      where: {
        id: groupId,
        creatorId: session.user.zalo_id,
      }
    });

    if (!existingGroup) {
      return NextResponse.json({ error: 'User group not found' }, { status: 404 });
    }

    const labelConflict = await (prisma as any).userGroup.findFirst({
      where: {
        label,
        id: { not: groupId }
      }
    });

    if (labelConflict) {
      return NextResponse.json({ error: 'Label already exists' }, { status: 400 });
    }

    const userGroup = await (prisma as any).userGroup.update({
      where: { id: groupId },
      data: { name, label },
      include: {
        _count: {
          select: {
            accountGroups: true
          }
        }
      }
    });

    return NextResponse.json({ userGroup });
  } catch (error) {
    console.error('Error updating user group:', error);
    return NextResponse.json({ error: 'Failed to update user group' }, { status: 500 });
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

    const existingGroup = await (prisma as any).userGroup.findFirst({
      where: {
        id: groupId,
        creatorId: session.user.zalo_id,
      }
    });

    if (!existingGroup) {
      return NextResponse.json({ error: 'User group not found' }, { status: 404 });
    }

    await (prisma as any).userGroup.delete({
      where: { id: groupId }
    });

    return NextResponse.json({ message: 'User group deleted successfully' });
  } catch (error) {
    console.error('Error deleting user group:', error);
    return NextResponse.json({ error: 'Failed to delete user group' }, { status: 500 });
  }
}
