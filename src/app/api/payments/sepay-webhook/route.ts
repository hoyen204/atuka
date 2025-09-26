import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { LicenseType, Prisma } from '@prisma/client';
import { getOrCreateWallet, addWalletTransaction } from '@/lib/wallet.utils';

interface SepayWebhookPayload {
  gateway: string;
  transaction_date: string;
  account_number: string;
  sub_account?: string;
  amount_in: number;
  amount_out: number;
  accumulated: number;
  code?: string;
  transaction_id: string;
  content: string;
}

function calculateLicenseExpiry(licenseType: LicenseType): Date {
  const now = new Date();
  const expiry = new Date(now);

  switch (licenseType) {
    case LicenseType.BASIC:
    case LicenseType.PRO:
      expiry.setMonth(expiry.getMonth() + 1);
      break;
    case LicenseType.FREE:
    default:
      expiry.setFullYear(expiry.getFullYear() + 100);
      break;
  }

  return expiry;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    console.log('Received webhook:', body);

    const payload: SepayWebhookPayload = JSON.parse(body);

    // Chỉ xử lý giao dịch vào (nạp tiền)
    if (payload.amount_in <= 0) {
      console.log('Not an incoming transaction, skipping');
      return NextResponse.json(
        { message: 'Not an incoming transaction' },
        { status: 200 }
      );
    }

    // Trích xuất orderId từ content
    // Ví dụ: "CT DEN:526814888278 SEVQRNAP1758811960311van1c63e0 FT25269558700806"
    const contents = payload.content.includes(' ') ? payload.content.split(' ') : payload.content.includes('-') ? payload.content.split('-') : [];
    if (contents.length === 0) {
      console.log('No contents found, skipping');
      return NextResponse.json(
        { message: 'No contents found' },
        { status: 200 }
      );
    }
    const pattern = /^(SEVQRNAP)\d+/;
    let orderId = '';

    for (const content of contents) {
      if (pattern.test(content)) {
        console.log('Content matches pattern:', content);
        orderId = content.substring('SEVQR'.length); // cắt prefix SEVQR
        console.log('Extracted orderId:', orderId);
      }
    }

    const payment = await prisma.payment.findFirst({
      where: {
        sepayOrderId: orderId,
      },
    });
    if (payment && payment.status === 'COMPLETED') {
      console.log('Payment already completed, skipping');
      return NextResponse.json(
        { message: 'Payment already completed' },
        { status: 200 }
      );
    }

    if (!payment) {
      console.log(
        'Payment not found for code:',
        payload.content,
        '-> orderId:',
        orderId
      );
      return NextResponse.json(
        { message: 'Payment not found' },
        { status: 200 }
      );
    }

    // Kiểm tra số tiền chính xác
    if (payload.amount_in < payment.amount) {
      console.log(
        `Payment amount mismatch: received ${payload.amount_in}, expected ${payment.amount}`
      );
      return NextResponse.json(
        { message: 'Payment amount mismatch' },
        { status: 200 }
      );
    }

    // Transaction đảm bảo atomic
    await prisma.$transaction(async (tx) => {
      // Cập nhật trạng thái payment
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          sepayTxnId: payload.transaction_id,
          paidAt: new Date(),
        },
      });

      // Đảm bảo user có ví
      const wallet = await getOrCreateWallet(payment.userId, tx);

      // Thêm giao dịch ví
      await addWalletTransaction(
        wallet.id,
        'DEPOSIT',
        payment.amount,
        `Nạp tiền: ${payment.amount.toLocaleString('vi-VN')} VNĐ`,
        payment.id,
        tx
      );

      console.log(
        'Deposit completed successfully:',
        payment.id,
        'Amount:',
        payment.amount
      );
    });

    return NextResponse.json(
      { message: 'Webhook processed successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
