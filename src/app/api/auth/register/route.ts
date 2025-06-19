import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { prisma } from '../../../../lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { name, email, zalo_id, password } = await request.json();

    if (!name || !password || (!email && !zalo_id)) {
      return NextResponse.json(
        { error: 'Vui lòng nhập đầy đủ thông tin' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Mật khẩu phải có ít nhất 6 ký tự' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: email ? { email } : { zaloId: zalo_id }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Tài khoản đã tồn tại' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        zaloId: zalo_id || `user_${Date.now()}`,
        password: hashedPassword,
        licenseType: 'FREE',
        isAdmin: false,
        isSubscribed: false,
        accountPlus: 0,
        canTakeover: false,
        banned: false,
      }
    });

    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json(
      { 
        message: 'Đăng ký thành công',
        user: userWithoutPassword 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Lỗi server' },
      { status: 500 }
    );
  }
} 