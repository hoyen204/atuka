import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { LicenseType } from '@prisma/client';
import crypto from 'crypto';

const SEPAY_BANK_NUMBER = process.env.SEPAY_BANK_NUMBER || ''; // Số tài khoản SePay
const SEPAY_BANK_NAME = process.env.SEPAY_BANK_NAME || 'SePay'; // Tên ngân hàng
const SEPAY_ACCOUNT_NAME = process.env.SEPAY_ACCOUNT_NAME || ''; // Tên chủ tài khoản

interface PaymentRequest {
  licenseType: LicenseType;
  accountPlus?: number;
}

interface LicensePackage {
  type: LicenseType;
  price: number;
  accountLimit: number;
  features: string[];
}

const LICENSE_PACKAGES: Record<LicenseType, LicensePackage> = {
  [LicenseType.FREE]: {
    type: LicenseType.FREE,
    price: 0,
    accountLimit: 2,
    features: [
      'Giới hạn 2 tài khoản',
      'Nhận thông báo tiệc cưới',
      'Tự động điểm danh, tế lễ, vấn đáp tông môn',
      'Tự động khoáng mạch (nhận khi đạt tối đa)',
      'Tự động hoang vực (không đổi ngũ hành)',
      'Tự động mở luận võ',
      'Tự động nhận rương phúc lợi',
      'Tự động thí luyện'
    ]
  },
  [LicenseType.BASIC]: {
    type: LicenseType.BASIC,
    price: 50000,
    accountLimit: 5,
    features: [
      'Giới hạn 5 tài khoản',
      'Tất cả tính năng của gói Free',
      'Đăng nhập bằng username/password',
      'Tự động đổ thạch thông minh',
      'Khoáng mạch chỉ nhận khi buff >= 100%',
      'Hoang vực tự đổi ngũ hành khi bị khắc',
      'Tự động nhận thưởng khi boss chết',
      'Tự động gửi luận võ cho người bật auto',
      'Tự động nhận mốc phúc lợi'
    ]
  },
  [LicenseType.PRO]: {
    type: LicenseType.PRO,
    price: 100000,
    accountLimit: 15,
    features: [
      'Giới hạn 15 tài khoản',
      'Tất cả tính năng gói Basic',
      'Tự động nhận code tân thủ',
      'Tự động chúc phúc & nhận lì xì tiệc cưới',
      'Khoáng mạch tự đoạt lại mỏ khi còn buff',
      'Tự động tối ưu ngũ hành cho hoang vực'
    ]
  }
};

function calculateAccountPlusPrice(accountPlus: number): number {
  const totalAccountsNeeded = accountPlus;
  const freeAccounts = Math.floor(totalAccountsNeeded / 10) * 2;
  const paidAccounts = Math.max(0, accountPlus - Math.max(0, freeAccounts));
  return paidAccounts * 10000;
}

function calculateTotalPrice(licenseType: LicenseType, accountPlus: number = 0): number {
  const licensePrice = LICENSE_PACKAGES[licenseType].price;
  const accountPlusPrice = calculateAccountPlusPrice(accountPlus);
  return licensePrice + accountPlusPrice;
}

function generateSepayQR(bankName: string, accountNumber: string, amount: number, orderId: string): string {
  // Theo tài liệu SePay PHP: https://qr.sepay.vn/img?bank={bank}&acc={account}&template=compact&amount={amount}&des=DH{order_id}
  const template = 'compact';
  const description = `DH${orderId}`; // Prefix DH + orderId theo SePay

  const qrUrl = `https://qr.sepay.vn/img?bank=${encodeURIComponent(bankName)}&acc=${accountNumber}&template=${template}&amount=${amount}&des=${encodeURIComponent(description)}`;
  return qrUrl;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.zaloId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: PaymentRequest = await request.json();
    const { licenseType, accountPlus = 0 } = body;

    if (!Object.values(LicenseType).includes(licenseType)) {
      return NextResponse.json({ error: 'Invalid license type' }, { status: 400 });
    }

    if (licenseType === LicenseType.FREE && accountPlus === 0) {
      return NextResponse.json({ error: 'Free license cannot be purchased' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { zaloId: session.user.zaloId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const totalAmount = calculateTotalPrice(licenseType, accountPlus);

    if (totalAmount <= 0) {
      return NextResponse.json({ error: 'Invalid payment amount' }, { status: 400 });
    }

    // Tạo mã đơn hàng theo format SePay
    const orderId = `HH3D_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Hết hạn sau 1 giờ

    // Tạo description cho chuyển khoản theo format SePay: DH{orderId}
    const description = `DH${orderId}`;

    const payment = await prisma.payment.create({
      data: {
        userId: session.user.zaloId,
        amount: totalAmount,
        licenseType,
        accountPlus,
        sepayOrderId: orderId,
        status: 'PENDING',
        expiresAt,
        description
      }
    });

    // Tạo QR code theo API SePay
    const qrCodeUrl = generateSepayQR(SEPAY_BANK_NAME, SEPAY_BANK_NUMBER, totalAmount, orderId);

    return NextResponse.json({
      paymentId: payment.id,
      orderId,
      amount: totalAmount,
      description,
      qrCode: qrCodeUrl,
      bankInfo: {
        bankNumber: SEPAY_BANK_NUMBER,
        bankName: SEPAY_BANK_NAME,
        accountName: SEPAY_ACCOUNT_NAME,
        amount: totalAmount,
        description: description
      },
      expiresAt: expiresAt.toISOString()
    });

  } catch (error) {
    console.error('Payment creation error:', error);
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
    const licenseType = url.searchParams.get('licenseType') as LicenseType;
    
    if (licenseType && !Object.values(LicenseType).includes(licenseType)) {
        return NextResponse.json({ error: 'Invalid license type' }, { status: 400 });
    }
    
    const user = await prisma.user.findUnique({
        where: { zaloId: session.user.zaloId }
    });
    
    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const accountPlus = user.accountPlus || 0;

    if (licenseType) {
      const totalAmount = calculateTotalPrice(licenseType, accountPlus);
      const licensePackage = LICENSE_PACKAGES[licenseType];
      const accountPlusPrice = calculateAccountPlusPrice(accountPlus);

      return NextResponse.json({
        licenseType,
        licensePrice: licensePackage.price,
        accountPlus,
        accountPlusPrice,
        totalAmount,
        package: licensePackage
      });
    }

    return NextResponse.json({
      packages: LICENSE_PACKAGES,
      currentUser: {
        licenseType: user.licenseType,
        accountPlus: accountPlus,
        licenseExpired: user.licenseExpired
      }
    });

  } catch (error) {
    console.error('Payment info error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
