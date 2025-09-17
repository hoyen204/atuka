import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth.config';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const search = searchParams.get('search') || '';

    const whereClause: any = {
      creatorId: session.user.zalo_id,
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { label: { contains: search } }
      ];
    }

    const total = await (prisma as any).userGroup.count({ where: whereClause });

    const userGroups = await (prisma as any).userGroup.findMany({
      where: whereClause,
      take: pageSize,
      skip: (page - 1) * pageSize,
      include: {
        _count: {
          select: {
            accountGroups: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      userGroups,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('Error fetching user groups:', error);
    return NextResponse.json({ error: 'Failed to fetch user groups' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { name, label } = body;

    if (!name || !label) {
      return NextResponse.json({ error: 'Name and label are required' }, { status: 400 });
    }

    const existingGroup = await (prisma as any).userGroup.findUnique({
      where: { label }
    });

    if (existingGroup) {
      return NextResponse.json({ error: 'Label already exists' }, { status: 400 });
    }

    const userGroup = await (prisma as any).userGroup.create({
      data: {
        name,
        label,
        creatorId: session.user.zalo_id,
      },
      include: {
        _count: {
          select: {
            accountGroups: true
          }
        }
      }
    });

    return NextResponse.json({ userGroup }, { status: 201 });
  } catch (error) {
    console.error('Error creating user group:', error);
    return NextResponse.json({ error: 'Failed to create user group' }, { status: 500 });
  }
}
