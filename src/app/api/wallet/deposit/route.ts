import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { prisma } from '@/lib/prisma';
import { getOrCreateWallet } from '@/lib/wallet.service.utils';

const SEPAY_BANK_NAME = process.env.SEPAY_BANK_NAME || '';
const SEPAY_BANK_NUMBER = process.env.SEPAY_BANK_NUMBER || '';
const SEPAY_ACCOUNT_NAME = process.env.SEPAY_ACCOUNT_NAME || '';

function generateSepayQR(bankName: string, accountNumber: string, amount: number, orderId: string, description: string): string {
  const template = 'compact';
  const qrUrl = `https://qr.sepay.vn/img?bank=${encodeURIComponent(bankName)}&acc=${accountNumber}&template=${template}&amount=${amount}&des=${encodeURIComponent(description)}`;
  return qrUrl;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.zaloId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount } = await request.json();

    if (!amount || amount < 2000) {
      return NextResponse.json({ error: 'Minimum deposit amount is 10,000 VNĐ' }, { status: 400 });
    }

    if (amount > 5000000) {
      return NextResponse.json({ error: 'Maximum deposit amount is 5,000,000 VNĐ' }, { status: 400 });
    }

    // Tạo wallet nếu chưa có
    await getOrCreateWallet(session.user.zaloId);

    // Tạo mã đơn nạp tiền
    const depositId = `NAP${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Hết hạn sau 1 giờ

    const description = `SEVQR${depositId}`;

    // Tạo payment record cho deposit
    const payment = await prisma.payment.create({
      data: {
        userId: session.user.zaloId,
        amount,
        licenseType: 'FREE', // Deposit không phải license
        accountPlus: 0,
        sepayOrderId: depositId,
        status: 'PENDING',
        expiresAt,
        description: `Nạp tiền: ${amount.toLocaleString('vi-VN')} VNĐ`
      }
    });

    // Tạo QR code
    const qrCodeUrl = generateSepayQR(SEPAY_BANK_NAME, SEPAY_BANK_NUMBER, amount, depositId, description);

    return NextResponse.json({
      depositId,
      amount,
      qrCode: qrCodeUrl,
      bankInfo: {
        bankName: SEPAY_BANK_NAME,
        bankNumber: SEPAY_BANK_NUMBER,
        accountName: SEPAY_ACCOUNT_NAME,
        amount,
        description
      },
      expiresAt: expiresAt.toISOString(),
      paymentId: payment.id
    });

  } catch (error) {
    console.error('Deposit creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.zaloId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status');

    const where: any = {
      userId: session.user.zaloId
    };

    // Nếu có status filter, chỉ lấy deposits (không phải purchases)
    if (status) {
      where.status = status;
      where.sepayOrderId = {
        startsWith: 'NAP' // Chỉ lấy deposits
      };
    } else {
      where.sepayOrderId = {
        startsWith: 'NAP' // Mặc định lấy deposits
      };
    }

    const deposits = await prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    return NextResponse.json({ deposits });

  } catch (error) {
    console.error('Deposit list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
