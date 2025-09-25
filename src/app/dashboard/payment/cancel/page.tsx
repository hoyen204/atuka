'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function PaymentCancelPage() {
  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Thanh toán bị hủy</h1>
          <p className="text-muted-foreground">Giao dịch của bạn đã bị hủy</p>
        </div>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <XCircle className="h-6 w-6" />
              Giao dịch đã bị hủy
            </CardTitle>
            <CardDescription>
              Bạn đã hủy giao dịch thanh toán.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                Không có khoản phí nào được thu. Bạn có thể thử lại thanh toán bất cứ lúc nào.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <div className="flex gap-4 justify-center">
          <Button variant="outline" asChild>
            <Link href="/dashboard/payment">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Thử lại thanh toán
            </Link>
          </Button>
          
          <Button asChild>
            <Link href="/dashboard">
              Về Dashboard
            </Link>
          </Button>
        </div>

        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Nếu bạn gặp vấn đề với thanh toán, vui lòng liên hệ hỗ trợ.
          </p>
          
          <div className="space-y-2">
            <h3 className="font-semibold">Thông tin hỗ trợ:</h3>
            <p className="text-sm">Email: support@hh3d.com</p>
            <p className="text-sm">Hotline: 1900-xxxx</p>
          </div>
        </div>
      </div>
    </div>
  );
}
