'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Wallet, Users, TrendingUp, TrendingDown, Gift, CreditCard, Plus, Minus, Eye, UserCheck } from 'lucide-react';
import { formatCurrency, getTransactionTypeLabel, getTransactionTypeColor } from '@/lib/wallet.utils';
import { toast } from '@/hooks/useToast';

interface UserWallet {
  id: string;
  userId: string;
  user: {
    name: string;
    zalo_id: string;
    email?: string;
  };
  balance: number;
  totalDeposit: number;
  totalSpent: number;
  createdAt: string;
  updatedAt: string;
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

interface AdjustmentData {
  userId: string;
  amount: number;
  type: 'BONUS' | 'PENALTY';
  description: string;
}

export default function WalletManagementPage() {
  const { data: session } = useSession();
  const [wallets, setWallets] = useState<UserWallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<UserWallet | null>(null);
  const [transactions, setTransactions] = useState<TransactionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [adjustmentOpen, setAdjustmentOpen] = useState(false);
  const [adjustmentData, setAdjustmentData] = useState<AdjustmentData>({
    userId: '',
    amount: 0,
    type: 'BONUS',
    description: ''
  });

  useEffect(() => {
    if (session?.user?.is_admin) {
      fetchWallets();
    }
  }, [session]);

  const fetchWallets = async () => {
    try {
      const response = await fetch('/api/admin/wallets');
      const data = await response.json();
      if (response.ok) {
        setWallets(data.wallets);
      }
    } catch (error) {
      console.error('Failed to fetch wallets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWalletTransactions = async (walletId: string) => {
    try {
      const response = await fetch(`/api/admin/wallets/${walletId}/transactions`);
      const data = await response.json();
      if (response.ok) {
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  };

  const handleAdjustment = async () => {
    if (!adjustmentData.userId || !adjustmentData.amount || !adjustmentData.description) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng điền đầy đủ thông tin',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await fetch('/api/admin/wallets/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adjustmentData)
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Thành công',
          description: `Đã ${adjustmentData.type === 'BONUS' ? 'cộng' : 'trừ'} ${formatCurrency(adjustmentData.amount)} cho user`
        });
        setAdjustmentOpen(false);
        setAdjustmentData({
          userId: '',
          amount: 0,
          type: 'BONUS',
          description: ''
        });
        fetchWallets(); // Refresh list
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể thực hiện điều chỉnh ví',
        variant: 'destructive'
      });
    }
  };

  const openWalletDetails = (wallet: UserWallet) => {
    setSelectedWallet(wallet);
    fetchWalletTransactions(wallet.id);
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
      case 'BONUS':
        return <Gift className="h-4 w-4 text-yellow-600" />;
      case 'PENALTY':
        return <Minus className="h-4 w-4 text-red-600" />;
      default:
        return <Wallet className="h-4 w-4 text-gray-600" />;
    }
  };

  if (!session?.user?.is_admin) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Truy cập bị từ chối</h1>
          <p className="text-muted-foreground">Bạn không có quyền truy cập trang này.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Quản Lý Ví Tiền</h1>
          <p className="text-muted-foreground">Quản lý ví tiền và giao dịch của tất cả users</p>
        </div>
        <Dialog open={adjustmentOpen} onOpenChange={setAdjustmentOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Điều Chỉnh Ví
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Điều Chỉnh Ví Tiền</DialogTitle>
              <DialogDescription>
                Cộng hoặc trừ tiền từ ví của user
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="userSelect">Chọn User</Label>
                <Select
                  value={adjustmentData.userId}
                  onValueChange={(value) => setAdjustmentData(prev => ({ ...prev, userId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn user" />
                  </SelectTrigger>
                  <SelectContent>
                    {wallets.map((wallet) => (
                      <SelectItem key={wallet.userId} value={wallet.userId}>
                        {wallet.user.name} ({wallet.user.zalo_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adjustmentType">Loại</Label>
                <Select
                  value={adjustmentData.type}
                  onValueChange={(value: 'BONUS' | 'PENALTY') => setAdjustmentData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BONUS">Cộng tiền (Thưởng/Bonus)</SelectItem>
                    <SelectItem value="PENALTY">Trừ tiền (Phạt)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Số tiền (VNĐ)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  value={adjustmentData.amount}
                  onChange={(e) => setAdjustmentData(prev => ({ ...prev, amount: parseInt(e.target.value) || 0 }))}
                  placeholder="Ví dụ: 50000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={adjustmentData.description}
                  onChange={(e) => setAdjustmentData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Lý do điều chỉnh..."
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleAdjustment} className="flex-1">
                  Xác Nhận
                </Button>
                <Button variant="outline" onClick={() => setAdjustmentOpen(false)} className="flex-1">
                  Hủy
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{wallets.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Số Dư</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(wallets.reduce((sum, w) => sum + w.balance, 0))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Đã Nạp</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(wallets.reduce((sum, w) => sum + w.totalDeposit, 0))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Đã Tiêu</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(wallets.reduce((sum, w) => sum + w.totalSpent, 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Danh Sách Ví Tiền</CardTitle>
            <CardDescription>
              Quản lý ví tiền của tất cả users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Số Dư</TableHead>
                  <TableHead className="text-right">Đã Nạp</TableHead>
                  <TableHead className="text-center">Thao Tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wallets.map((wallet) => (
                  <TableRow key={wallet.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{wallet.user.name}</div>
                        <div className="text-sm text-muted-foreground">{wallet.user.zalo_id}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(wallet.balance)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-green-600">
                      {formatCurrency(wallet.totalDeposit)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openWalletDetails(wallet)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {selectedWallet && (
          <Card>
            <CardHeader>
              <CardTitle>
                Lịch Sử Giao Dịch - {selectedWallet.user.name}
              </CardTitle>
              <CardDescription>
                Chi tiết giao dịch của user
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Chưa có giao dịch nào</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getTransactionIcon(transaction.type)}
                        <div>
                          <Badge
                            variant="outline"
                            className={getTransactionTypeColor(transaction.type as any)}
                          >
                            {getTransactionTypeLabel(transaction.type as any)}
                          </Badge>
                          <div className="text-sm text-muted-foreground mt-1">
                            {transaction.description || 'Không có mô tả'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-mono font-medium ${
                          transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.amount >= 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(transaction.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
