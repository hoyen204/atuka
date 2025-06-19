import { NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database.service';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth.config';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ zaloId: string }> }
): Promise<NextResponse<{ message: string } | { error: string }>> {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is admin
  if (!session.user?.is_admin) {
    return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
  }

  try {
    const { zaloId } = await params;
    const { banned } = await request.json();

    if (typeof banned !== 'boolean') {
      return NextResponse.json({ error: 'Invalid banned status' }, { status: 400 });
    }

    const user = await DatabaseService.getUserByZaloId(zaloId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await DatabaseService.updateUserBanStatus(zaloId, banned);

    return NextResponse.json({
      message: `User ${banned ? 'banned' : 'unbanned'} successfully`
    });
  } catch (error) {
    console.error('Error updating user ban status:', error);
    return NextResponse.json({ error: 'Failed to update user ban status' }, { status: 500 });
  }
} 