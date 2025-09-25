import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { prisma } from '@/lib/prisma';
import { getOrCreateWallet, addWalletTransaction, checkWalletBalance } from '@/lib/wallet.utils';
import { LicenseType } from '@prisma/client';

interface PurchaseRequest {
  licenseType: LicenseType;
  accountPlus?: number;
}

const LICENSE_PACKAGES: Record<LicenseType, { price: number; accountLimit: number }> = {
  [LicenseType.FREE]: {
    price: 0,
    accountLimit: 2
  },
  [LicenseType.BASIC]: {
    price: 50000,
    accountLimit: 5
  },
  [LicenseType.PRO]: {
    price: 100000,
    accountLimit: 15
  }
};

function calculateAccountPlusPrice(accountPlus: number, currentAccountPlus: number): number {
  const totalAccountsNeeded = currentAccountPlus + accountPlus;
  const freeAccounts = Math.floor(totalAccountsNeeded / 10) * 2;
  const paidAccounts = Math.max(0, accountPlus - Math.max(0, freeAccounts - currentAccountPlus));
  return paidAccounts * 10000;
}

function calculateTotalPrice(licenseType: LicenseType, accountPlus: number = 0, currentAccountPlus: number = 0): number {
  const licensePrice = LICENSE_PACKAGES[licenseType].price;
  const accountPlusPrice = calculateAccountPlusPrice(accountPlus, currentAccountPlus);
  return licensePrice + accountPlusPrice;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.zaloId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { licenseType, accountPlus = 0 }: PurchaseRequest = await request.json();

    if (!Object.values(LicenseType).includes(licenseType)) {
      return NextResponse.json({ error: 'Invalid license type' }, { status: 400 });
    }

    if (licenseType === LicenseType.FREE && accountPlus === 0) {
      return NextResponse.json({ error: 'Free license cannot be purchased' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { zaloId: session.user.zaloId },
      include: { wallet: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const wallet = await getOrCreateWallet(session.user.zaloId);
    const currentAccountPlus = user.accountPlus || 0;
    const totalPrice = calculateTotalPrice(licenseType, accountPlus, currentAccountPlus);

    if (totalPrice <= 0) {
      return NextResponse.json({ error: 'Invalid purchase amount' }, { status: 400 });
    }

    // Kiểm tra số dư ví
    const hasEnoughBalance = await checkWalletBalance(wallet.id, totalPrice);
    if (!hasEnoughBalance) {
      return NextResponse.json({
        error: 'Insufficient wallet balance',
        required: totalPrice,
        current: wallet.balance
      }, { status: 400 });
    }

    // Tạo purchase record
    const purchase = await prisma.payment.create({
      data: {
        userId: session.user.zaloId,
        amount: totalPrice,
        licenseType,
        accountPlus,
        status: 'COMPLETED', // Wallet purchase luôn completed ngay lập tức
        description: `Mua gói ${licenseType}${accountPlus > 0 ? ` + ${accountPlus} Account Plus` : ''}`,
        expiresAt: new Date()
      }
    });

    await prisma.$transaction(async (tx) => {
      // Cập nhật license cho user
      const currentLicenseExpiry = user.licenseExpired || new Date();
      const newExpiry = new Date();

      if (licenseType === LicenseType.BASIC || licenseType === LicenseType.PRO) {
        if (currentLicenseExpiry > new Date()) {
          // Gia hạn từ ngày hết hạn hiện tại
          newExpiry.setTime(currentLicenseExpiry.getTime() + (30 * 24 * 60 * 60 * 1000)); // +30 ngày
        } else {
          newExpiry.setTime(new Date().getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 ngày từ bây giờ
        }
      }

      await tx.user.update({
        where: { zaloId: session.user.zaloId },
        data: {
          licenseType,
          licenseExpired: licenseType !== LicenseType.FREE ? newExpiry : user.licenseExpired,
          accountPlus: currentAccountPlus + accountPlus
        }
      });

      // Tạo transaction record và cập nhật wallet
      await addWalletTransaction(
        wallet.id,
        'PURCHASE',
        -totalPrice, // Trừ tiền
        `Mua gói ${licenseType}${accountPlus > 0 ? ` + ${accountPlus} Account Plus` : ''}`,
        purchase.id,
        tx
      );
    });

    return NextResponse.json({
      success: true,
      purchase,
      newBalance: wallet.balance - totalPrice,
      message: 'Purchase successful'
    });

  } catch (error) {
    console.error('Purchase error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.zaloId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Lấy lịch sử mua hàng từ wallet transactions
    const wallet = await getOrCreateWallet(session.user.zaloId);
    const purchases = await prisma.walletTransaction.findMany({
      where: {
        walletId: wallet.id,
        type: 'PURCHASE'
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    return NextResponse.json({ purchases });

  } catch (error) {
    console.error('Purchase history error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
