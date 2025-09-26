'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@//components/ui/table';
import { Wallet, TrendingUp, TrendingDown, Gift, ArrowLeftRight, CreditCard, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getTransactionTypeLabel, getTransactionTypeColor, formatCurrency } from '@/lib/wallet.utils';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

interface WalletInfo {
  id: string;
  balance: number;
  totalDeposit: number;
  totalSpent: number;
  createdAt: Date;
  updatedAt: Date;
}

interface TransactionInfo {
  id: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description?: string;
  referenceId?: string;
  createdAt: string;
}

export default function WalletPage() {
  const { data: session } = useSession();
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [transactions, setTransactions] = useState<TransactionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchWalletData();
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchTransactions();
    }
  }, [currentPage, filterType, session]);

  const fetchWalletData = async () => {
    try {
      const response = await fetch('/api/wallet');
      const data = await response.json();
      if (response.ok) {
        setWallet(data.wallet);
      }
    } catch (error) {
      console.error('Failed to fetch wallet info:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        offset: ((currentPage - 1) * itemsPerPage).toString()
      });

      if (filterType !== 'ALL') {
        params.append('type', filterType);
      }

      const response = await fetch(`/api/wallet/transactions?${params}`);
      const data = await response.json();
      if (response.ok) {
        setTransactions(data.transactions || []);
        // Estimate total pages based on returned data
        const estimatedTotal = data.transactions?.length === itemsPerPage ?
          currentPage * itemsPerPage + 1 : currentPage * itemsPerPage;
        setTotalPages(Math.ceil(estimatedTotal / itemsPerPage));
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'PURCHASE':
        return <CreditCard className="h-4 w-4 text-red-600" />;
      case 'REFUND':
        return <ArrowLeftRight className="h-4 w-4 text-blue-600" />;
      case 'BONUS':
        return <Gift className="h-4 w-4 text-yellow-600" />;
      default:
        return <Wallet className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Ví tiền</h1>
          <p className="text-muted-foreground">Vui lòng đăng nhập để xem ví tiền.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Ví tiền</h1>
          <p className="text-muted-foreground">Quản lý số dư và lịch sử giao dịch</p>
        </div>
        <Link
          href="/dashboard/payment"
          className={cn(
            buttonVariants({ variant: "default", size: "default" }),
            "no-underline"
          )}
        >
          <CreditCard className="h-4 w-4 mr-2" />
          Nạp tiền / Mua gói
        </Link>
      </div>

      {wallet && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Số dư hiện tại</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(wallet.balance)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng đã nạp</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(wallet.totalDeposit)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng đã tiêu</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(wallet.totalSpent)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lịch sử giao dịch</CardTitle>
              <CardDescription>
                Tất cả giao dịch nạp tiền và mua gói dịch vụ
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả</SelectItem>
                  <SelectItem value="DEPOSIT">Nạp tiền</SelectItem>
                  <SelectItem value="PURCHASE">Mua gói</SelectItem>
                  <SelectItem value="BONUS">Thưởng</SelectItem>
                  <SelectItem value="PENALTY">Phạt</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Chưa có giao dịch nào</p>
              <p className="text-sm">Hãy nạp tiền hoặc mua gói để bắt đầu!</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loại</TableHead>
                    <TableHead>Mô tả</TableHead>
                    <TableHead className="text-right">Số tiền</TableHead>
                    <TableHead className="text-right">Số dư sau</TableHead>
                    <TableHead>Thời gian</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTransactionIcon(transaction.type)}
                          <Badge
                            variant="outline"
                            className={getTransactionTypeColor(transaction.type as any)}
                          >
                            {getTransactionTypeLabel(transaction.type as any)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate" title={transaction.description}>
                          {transaction.description || 'Không có mô tả'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        <span className={transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {transaction.amount >= 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(transaction.balanceAfter)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(transaction.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Trang {currentPage} / {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Sau
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
