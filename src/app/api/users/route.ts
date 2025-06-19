import { NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database.service';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth.config';
import { UserDTO, UsersResponse } from '@/models/types';

function toUserDTO(user: any): UserDTO {
  return {
    zaloId: user.zaloId,
    name: user.name,
    email: user.email,
    licenseType: user.licenseType,
    licenseExpired: user.licenseExpired ? user.licenseExpired.toISOString() : null,
    banned: user.banned,
  };
}

export async function GET(request: Request): Promise<NextResponse<UsersResponse | { error: string }>> {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is admin
  if (!session.user?.is_admin) {
    return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * pageSize;

    const [users, total] = await Promise.all([
      DatabaseService.getAllUsers({ skip, take: pageSize, search }),
      DatabaseService.countUsers({ search }),
    ]);

    return NextResponse.json({
      users: users.map(toUserDTO),
      total,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
} 