import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.zaloId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const orderId = url.searchParams.get('orderId');
    const paymentId = url.searchParams.get('paymentId');

    if (!orderId && !paymentId) {
      return NextResponse.json({ error: 'Missing orderId or paymentId' }, { status: 400 });
    }

    let payment;
    
    if (orderId) {
      payment = await prisma.payment.findUnique({
        where: { 
          sepayOrderId: orderId,
          userId: session.user.zaloId
        },
        include: { user: true }
      });
    } else if (paymentId) {
      payment = await prisma.payment.findUnique({
        where: { 
          id: paymentId,
          userId: session.user.zaloId
        },
        include: { user: true }
      });
    }

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: payment.id,
      orderId: payment.sepayOrderId,
      amount: payment.amount,
      status: payment.status,
      licenseType: payment.licenseType,
      accountPlus: payment.accountPlus,
      description: payment.description,
      createdAt: payment.createdAt,
      paidAt: payment.paidAt,
      expiresAt: payment.expiresAt
    });

  } catch (error) {
    console.error('Payment status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
