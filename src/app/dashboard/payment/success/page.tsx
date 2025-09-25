'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [paymentStatus, setPaymentStatus] = useState<'checking' | 'success' | 'pending' | 'failed'>('checking');
  const orderId = searchParams.get('order_id');
  const amount = searchParams.get('amount');

  useEffect(() => {
    if (orderId) {
      checkPaymentStatus();
      
      const interval = setInterval(() => {
        checkPaymentStatus();
      }, 5000);

      const timeout = setTimeout(() => {
        clearInterval(interval);
        if (paymentStatus === 'checking') {
          setPaymentStatus('pending');
        }
      }, 60000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [orderId]);

  const checkPaymentStatus = async () => {
    if (!orderId) return;
    
    try {
      const response = await fetch(`/api/payments/status?orderId=${orderId}`);
      const data = await response.json();
      
      if (data.status === 'COMPLETED') {
        setPaymentStatus('success');
      } else if (data.status === 'FAILED') {
        setPaymentStatus('failed');
      } else {
        setPaymentStatus('pending');
      }
    } catch (error) {
      console.error('Payment status check error:', error);
      setPaymentStatus('pending');
    }
  };

  const formatPrice = (price: string | null) => {
    if (!price) return '';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(parseInt(price));
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Kết quả thanh toán</h1>
          <p className="text-muted-foreground">Mã đơn hàng: {orderId}</p>
        </div>

        {paymentStatus === 'checking' && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center space-x-2">
                <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
                <span>Đang kiểm tra trạng thái thanh toán...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {paymentStatus === 'success' && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-6 w-6" />
                Thanh toán thành công!
              </CardTitle>
              <CardDescription>
                License của bạn đã được nâng cấp thành công.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {amount && (
                <div className="flex justify-between">
                  <span>Số tiền:</span>
                  <span className="font-semibold">{formatPrice(amount)}</span>
                </div>
              )}
              <Alert>
                <AlertDescription>
                  License và Account Plus đã được cập nhật vào tài khoản của bạn. 
                  Bạn có thể bắt đầu sử dụng các tính năng mới ngay bây giờ.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {paymentStatus === 'pending' && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-700">
                <RefreshCw className="h-6 w-6" />
                Đang xử lý thanh toán
              </CardTitle>
              <CardDescription>
                Thanh toán của bạn đang được xử lý.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertDescription>
                  Thanh toán có thể mất vài phút để được xác nhận. 
                  Vui lòng kiên nhẫn chờ đợi hoặc liên hệ hỗ trợ nếu có vấn đề.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {paymentStatus === 'failed' && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-700">
                Thanh toán thất bại
              </CardTitle>
              <CardDescription>
                Có lỗi xảy ra trong quá trình thanh toán.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertDescription>
                  Vui lòng thử lại hoặc liên hệ hỗ trợ nếu vấn đề vẫn tiếp tục.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-4 justify-center">
          <Button variant="outline" asChild>
            <Link href="/dashboard/payment">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại thanh toán
            </Link>
          </Button>
          
          <Button asChild>
            <Link href="/dashboard">
              Về Dashboard
            </Link>
          </Button>
        </div>

        {paymentStatus === 'pending' && (
          <div className="text-center">
            <Button 
              variant="outline" 
              onClick={checkPaymentStatus}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Kiểm tra lại
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
