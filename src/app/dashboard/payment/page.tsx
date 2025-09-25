'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, Crown, Star, Gift, Calculator, Wallet, CreditCard } from 'lucide-react';
import { toast } from '@/hooks/useToast';

interface LicensePackage {
  type: 'FREE' | 'BASIC' | 'PRO';
  price: number;
  accountLimit: number;
  features: string[];
}

interface PaymentInfo {
  licenseType?: string;
  licensePrice?: number;
  accountPlus?: number;
  accountPlusPrice?: number;
  totalAmount?: number;
  package?: LicensePackage;
}

interface PackagesResponse {
  packages: Record<string, LicensePackage>;
  currentUser: {
    licenseType: string;
    accountPlus: number;
    licenseExpired: string;
  };
}

export default function PaymentPage() {
  const { data: session } = useSession();
  const [packages, setPackages] = useState<Record<string, LicensePackage>>({});
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);

  // Deposit states
  const [depositAmount, setDepositAmount] = useState<number>(50000);
  const [depositData, setDepositData] = useState<any>(null);
  const [showDepositQR, setShowDepositQR] = useState(false);

  // Purchase states
  const [selectedLicense, setSelectedLicense] = useState<'BASIC' | 'PRO'>('BASIC');
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({});
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);

  // Deposit interval reference
  const [depositInterval, setDepositInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchPackages();
    fetchWalletInfo();
  }, []);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (depositInterval) {
        clearInterval(depositInterval);
      }
    };
  }, [depositInterval]);

  useEffect(() => {
    if (selectedLicense) {
      calculatePrice();
    }
  }, [selectedLicense]);

  const fetchWalletInfo = async () => {
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

  const fetchPackages = async () => {
    try {
      const response = await fetch('/api/payments/create');
      const data: PackagesResponse = await response.json();
      setPackages(data.packages);
      setCurrentUser(data.currentUser);
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tải thông tin gói dịch vụ',
        variant: 'destructive'
      });
    }
  };

  const calculatePrice = async () => {
    if (!selectedLicense) return;

    setCalculating(true);
    try {
      const params = new URLSearchParams();
      if (selectedLicense) params.append('licenseType', selectedLicense);

      const response = await fetch(`/api/payments/create?${params}`);
      const data: PaymentInfo = await response.json();
      setPaymentInfo(data);
    } catch (error) {
      console.error('Calculation error:', error);
    } finally {
      setCalculating(false);
    }
  };

  const handleDeposit = async () => {
    if (depositAmount < 50000) {
      toast({
        title: 'Lỗi',
        description: 'Số tiền nạp tối thiểu là 50,000 VNĐ',
        variant: 'destructive'
      });
      return;
    }

    // Clear any existing interval before starting new deposit
    if (depositInterval) {
      clearInterval(depositInterval);
      setDepositInterval(null);
    }

    setLoading(true);
    try {
      const response = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: depositAmount })
      });

      const data = await response.json();

      if (response.ok) {
        setDepositData(data);
        setShowDepositQR(true);
        toast({
          title: 'Thành công',
          description: 'Đã tạo yêu cầu nạp tiền. Vui lòng quét QR để thanh toán.',
        });

        // Check status mỗi 5 giây
        const interval = setInterval(async () => {
          try {
            const statusResponse = await fetch(`/api/payments/status?orderId=${data.depositId}`);
            const statusData = await statusResponse.json();

            if (statusData.status === 'COMPLETED') {
              clearInterval(interval);
              setDepositInterval(null);
              setShowDepositQR(false);
              setDepositData(null);
              fetchWalletInfo(); // Refresh wallet balance
              toast({
                title: 'Nạp tiền thành công!',
                description: `Đã nạp ${depositAmount.toLocaleString('vi-VN')} VNĐ vào ví.`,
              });
            }
          } catch (error) {
            console.error('Status check error:', error);
          }
        }, 5000);

        setDepositInterval(interval);
        setTimeout(() => {
          if (interval) {
            clearInterval(interval);
            setDepositInterval(null);
          }
        }, 10 * 60 * 1000);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể tạo yêu cầu nạp tiền',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDepositModal = () => {
    setShowDepositQR(false);
    setDepositData(null);
    if (depositInterval) {
      clearInterval(depositInterval);
      setDepositInterval(null);
    }
  };

  const handlePurchase = async () => {
    if (!selectedLicense) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng chọn gói nâng cấp hoặc Account Plus',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/wallet/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseType: selectedLicense,
          accountPlus: 0
        })
      });

      const data = await response.json();

      if (response.ok) {
        fetchWalletInfo(); // Refresh wallet balance
        toast({
          title: 'Mua thành công!',
          description: 'Gói dịch vụ đã được kích hoạt.',
        });
        // Reload page to update user info
        setTimeout(() => window.location.reload(), 1000);
      } else {
        if (data.error === 'Insufficient wallet balance') {
          toast({
            title: 'Không đủ số dư',
            description: `Cần ${data.required?.toLocaleString('vi-VN')} VNĐ, hiện có ${data.current?.toLocaleString('vi-VN')} VNĐ`,
            variant: 'destructive'
          });
        } else {
          throw new Error(data.error);
        }
      }
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể mua gói dịch vụ',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getLicenseIcon = (type: string) => {
    switch (type) {
      case 'PRO': return <Crown className="h-6 w-6 text-yellow-500" />;
      case 'BASIC': return <Star className="h-6 w-6 text-blue-500" />;
      default: return <Gift className="h-6 w-6 text-green-500" />;
    }
  };

  const getLicenseColor = (type: string) => {
    switch (type) {
      case 'PRO': return 'from-yellow-500 to-orange-500';
      case 'BASIC': return 'from-blue-500 to-purple-500';
      default: return 'from-green-500 to-emerald-500';
    }
  };

  if (!session) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertDescription>Vui lòng đăng nhập để sử dụng tính năng này.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto p-4 space-y-4">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-4 text-white shadow-lg">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                <Wallet className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                Ví tiền & Nâng cấp
              </h1>
            </div>
            <p className="text-center text-blue-100 text-sm max-w-lg mx-auto leading-relaxed">
              Quản lý ví tiền thông minh và nâng cấp trải nghiệm với các gói dịch vụ cao cấp
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {wallet && (
            <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl -translate-y-8 translate-x-8"></div>
              <CardHeader className="relative z-10 pb-3">
                <CardTitle className="flex items-center gap-2 text-white">
                  <div className="p-1.5 bg-white/20 rounded-full backdrop-blur-sm">
                    <Wallet className="h-4 w-4" />
                  </div>
                  <span className="text-lg">Thông tin ví</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 space-y-3">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-emerald-100 text-sm">Số dư hiện tại:</span>
                    <span className="text-2xl font-bold text-white">{formatPrice(wallet.balance)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-green-500/20 rounded-lg p-2 border border-green-400/30">
                      <div className="text-xs text-green-100 mb-1">Tổng đã nạp</div>
                      <div className="font-semibold text-green-200 text-sm">{formatPrice(wallet.totalDeposit)}</div>
                    </div>
                    <div className="bg-red-500/20 rounded-lg p-2 border border-red-400/30">
                      <div className="text-xs text-red-100 mb-1">Tổng đã tiêu</div>
                      <div className="font-semibold text-red-200 text-sm">{formatPrice(wallet.totalSpent)}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {currentUser && (
            <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-lg -translate-y-6 translate-x-6"></div>
              <CardHeader className="relative z-10 pb-3">
                <CardTitle className="flex items-center gap-2 text-white">
                  <div className="p-1.5 bg-white/20 rounded-full backdrop-blur-sm">
                    {getLicenseIcon(currentUser.licenseType)}
                  </div>
                  <span className="text-lg">License hiện tại</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <div className="text-xs text-purple-100 mb-1">Gói hiện tại</div>
                      <Badge variant="secondary" className="bg-white/20 text-white border-white/30 px-2 py-0.5 text-xs">
                        {currentUser.licenseType}
                      </Badge>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-purple-100 mb-1">Account Plus</div>
                      <div className="text-xl font-bold text-white">{currentUser.accountPlus}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-purple-100 mb-1">Hết hạn</div>
                      <div className="text-xs font-semibold text-white">{formatDate(currentUser.licenseExpired)}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Tabs defaultValue="deposit" className="w-full">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-1.5 shadow-lg border border-white/20 mb-4">
            <TabsList className="grid w-full grid-cols-2 bg-transparent h-auto p-0.5">
              <TabsTrigger
                value="deposit"
                className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
              >
                <div className="p-1.5 bg-blue-100 rounded-full">
                  <CreditCard className="h-3 w-3 text-blue-600" />
                </div>
                <span>Nạp tiền</span>
              </TabsTrigger>
              <TabsTrigger
                value="purchase"
                className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
              >
                <div className="p-1.5 bg-purple-100 rounded-full">
                  <Crown className="h-3 w-3 text-purple-600" />
                </div>
                <span>Mua gói</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="deposit" className="space-y-4">
            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-100">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-200/30 rounded-full blur-xl -translate-y-8 translate-x-8"></div>
              <CardHeader className="relative z-10 pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="p-2 bg-blue-500 rounded-full text-white shadow-lg">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  Nạp tiền vào ví
                </CardTitle>
                <CardDescription className="text-sm">
                  Nạp tiền vào ví để mua các gói dịch vụ. Tối thiểu 10,000 VNĐ.
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10 space-y-4">
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/50 shadow-sm">
                  <Label htmlFor="depositAmount" className="text-sm font-semibold text-gray-700 mb-3 block">
                    Số tiền muốn nạp (VNĐ)
                  </Label>
                  <div className="relative">
                    <Input
                      id="depositAmount"
                      type="number"
                      min="50000"
                      step="50000"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(parseInt(e.target.value) || 0)}
                      placeholder="Ví dụ: 50000"
                      className="text-lg h-14 pl-6 pr-16 border-2 border-blue-200 focus:border-blue-400 rounded-xl shadow-sm"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                      VNĐ
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    {[50000, 100000, 200000, 500000].map((amount) => (
                      <Button
                        key={amount}
                        variant={depositAmount === amount ? "default" : "outline"}
                        size="sm"
                        onClick={() => setDepositAmount(amount)}
                        className={`flex-1 ${depositAmount === amount ? 'bg-blue-500 hover:bg-blue-600' : 'border-blue-200 hover:bg-blue-50'}`}
                      >
                        {amount.toLocaleString('vi-VN')}
                      </Button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleDeposit}
                  disabled={loading || depositAmount < 50000}
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                  size="lg"
                >
                  {loading ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Đang xử lý...
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5" />
                      Nạp {depositAmount.toLocaleString('vi-VN')} VNĐ
                    </div>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="purchase" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Chọn gói dịch vụ phù hợp</h2>
              <p className="text-gray-600">Nâng cấp tài khoản để trải nghiệm đầy đủ các tính năng cao cấp</p>
            </div>

            <Tabs value={selectedLicense} onValueChange={(value) => setSelectedLicense(value as 'BASIC' | 'PRO')}>
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-white/30 mb-8">
                <TabsList className="grid w-full grid-cols-2 bg-transparent h-auto p-1">
                  <TabsTrigger
                    value="BASIC"
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
                  >
                    <Star className="h-4 w-4" />
                    Gói BASIC
                  </TabsTrigger>
                  <TabsTrigger
                    value="PRO"
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
                  >
                    <Crown className="h-4 w-4" />
                    Gói PRO
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="BASIC" className="space-y-6">
                <Card className="relative overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-200 transform transition-all duration-500 hover:scale-105 hover:shadow-3xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-500/20"></div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-300/30 rounded-full blur-2xl -translate-y-16 translate-x-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-300/30 rounded-full blur-xl translate-y-12 -translate-x-12"></div>

                  <CardHeader className="relative z-10 text-center pb-8">
                    <div className="flex justify-center mb-4">
                      <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full text-white shadow-xl">
                        <Star className="h-8 w-8" />
                      </div>
                    </div>
                    <CardTitle className="text-3xl font-bold text-gray-800 mb-2">Gói BASIC</CardTitle>
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <span className="text-4xl font-bold text-blue-600">{formatPrice(50000)}</span>
                      <span className="text-gray-600">/tháng</span>
                    </div>
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200 px-4 py-2 text-sm font-medium">
                      Giới hạn 5 tài khoản
                    </Badge>
                  </CardHeader>

                  <CardContent className="relative z-10 px-8 pb-8">
                    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg">
                      <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        Tính năng nổi bật:
                      </h4>
                      <div className="space-y-3">
                        {packages.BASIC?.features.map((feature, index) => (
                          <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/50 transition-colors">
                            <div className="p-1 bg-green-100 rounded-full">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </div>
                            <span className="text-gray-700 font-medium">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="PRO" className="space-y-6">
                <Card className="relative overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-yellow-50 via-orange-100 to-red-200 transform transition-all duration-500 hover:scale-105 hover:shadow-3xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-orange-500/20"></div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-300/30 rounded-full blur-2xl -translate-y-16 translate-x-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-300/30 rounded-full blur-xl translate-y-12 -translate-x-12"></div>

                  <CardHeader className="relative z-10 text-center pb-8">
                    <div className="flex justify-center mb-4">
                      <div className="p-4 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full text-white shadow-xl">
                        <Crown className="h-8 w-8" />
                      </div>
                    </div>
                    <CardTitle className="text-3xl font-bold text-gray-800 mb-2">Gói PRO</CardTitle>
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <span className="text-4xl font-bold text-yellow-600">{formatPrice(100000)}</span>
                      <span className="text-gray-600">/tháng</span>
                    </div>
                    <Badge className="bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700 border-yellow-200 px-4 py-2 text-sm font-medium">
                      <Crown className="h-3 w-3 mr-1" />
                      Giới hạn 15 tài khoản - Ưu tiên cao nhất
                    </Badge>
                  </CardHeader>

                  <CardContent className="relative z-10 px-8 pb-8">
                    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg">
                      <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        Tính năng cao cấp:
                      </h4>
                      <div className="space-y-3">
                        {packages.PRO?.features.map((feature, index) => (
                          <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/50 transition-colors">
                            <div className="p-1 bg-green-100 rounded-full">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </div>
                            <span className="text-gray-700 font-medium">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {(paymentInfo.totalAmount || 0) > 0 && (
              <Card className="relative overflow-hidden border-0 shadow-2xl bg-gradient-to-r from-purple-50 to-pink-50">
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-200/30 rounded-full blur-xl -translate-y-8 translate-x-8"></div>
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white shadow-lg">
                      <Calculator className="h-6 w-6" />
                    </div>
                    Tổng kết đơn hàng
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg">
                    <div className="space-y-4">
                      {selectedLicense && (
                        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                          <span className="font-medium text-gray-700">Gói {selectedLicense}:</span>
                          <span className="font-bold text-blue-600">{formatPrice(paymentInfo.licensePrice || 0)}</span>
                        </div>
                      )}
                      {paymentInfo.accountPlus && paymentInfo.accountPlus > 0 && (
                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-100">
                          <span className="font-medium text-gray-700">{paymentInfo.accountPlus} Account Plus:</span>
                          <span className="font-bold text-green-600">{formatPrice(paymentInfo.accountPlusPrice || 0)}</span>
                        </div>
                      )}
                      <div className="border-t-2 border-gray-200 pt-4">
                        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg border-2 border-purple-200">
                          <span className="text-xl font-bold text-gray-800">Tổng cộng:</span>
                          <span className="text-2xl font-bold text-purple-600">{formatPrice(paymentInfo.totalAmount || 0)}</span>
                        </div>
                      </div>
                      {calculating && (
                        <div className="flex items-center justify-center gap-2 text-purple-600 bg-purple-50 p-3 rounded-lg">
                          <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-sm font-medium">Đang tính toán...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {wallet && (paymentInfo.totalAmount || 0) > 0 && (
              <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-r from-green-50 to-emerald-50">
                <CardContent className="relative z-10 p-6">
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">Số dư ví hiện tại:</span>
                      <span className={`font-bold text-lg ${wallet.balance >= (paymentInfo.totalAmount || 0) ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPrice(wallet.balance)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button
              onClick={handlePurchase}
              disabled={loading || calculating || (paymentInfo.totalAmount || 0) <= 0}
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
              size="lg"
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang xử lý...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Wallet className="h-5 w-5" />
                  <span>Mua ngay từ ví</span>
                </div>
              )}
            </Button>

            {(paymentInfo.totalAmount || 0) > 0 && wallet && wallet.balance < (paymentInfo.totalAmount || 0) && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700 font-medium">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-red-100 rounded-full">
                      <span className="text-red-600 text-sm">❌</span>
                    </div>
                    <span>
                      <strong>Không đủ số dư!</strong> Bạn cần nạp thêm {formatPrice((paymentInfo.totalAmount || 0) - wallet.balance)} vào ví.
                    </span>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>

        {/* Deposit QR Modal */}
        <Dialog open={showDepositQR} onOpenChange={(open) => {
          if (!open) {
            handleCloseDepositModal();
          }
        }}>
          <DialogContent
            layout="horizontal"
            className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-0 shadow-3xl p-4 md:p-6"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-lg"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/30 rounded-full blur-2xl -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-200/30 rounded-full blur-xl translate-y-12 -translate-x-12"></div>

            <DialogHeader className="relative z-10 text-center pb-4 md:col-span-2 md:text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full text-white shadow-xl">
                  <CreditCard className="h-8 w-8" />
                </div>
              </div>
              <DialogTitle className="text-2xl font-bold text-gray-800 text-center">Quét QR để nạp tiền</DialogTitle>
              <DialogDescription className="text-base font-medium text-center">
                Mã nạp tiền: <span className="font-mono bg-blue-100 px-2 py-1 rounded text-blue-700">{depositData?.depositId}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="relative z-10 space-y-6 md:space-y-0 md:grid md:grid-cols-2 md:gap-6">
              {/* QR Code Section */}
              <div className="flex justify-center items-center">
                <div className="p-4 bg-white rounded-2xl shadow-xl border-4 border-white">
                  <img
                    src={depositData?.qrCode}
                    alt="QR Code nạp tiền"
                    className="w-40 h-40 md:w-48 md:h-48 mx-auto"
                  />
                </div>
              </div>

              {/* Bank Info Section */}
              <div className="space-y-4">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-lg">
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <CreditCard className="h-4 w-4 text-blue-600" />
                    </div>
                    Thông tin chuyển khoản
                  </h3>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-600">Ngân hàng:</span>
                      <span className="font-mono font-semibold text-gray-800 text-xs">{depositData?.bankInfo.bankName}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-600">Số tài khoản:</span>
                      <span className="font-mono font-semibold text-gray-800 text-xs">{depositData?.bankInfo.bankNumber}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-600">Chủ tài khoản:</span>
                      <span className="font-mono font-semibold text-gray-800 text-xs">{depositData?.bankInfo.accountName}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg border-2 border-green-200">
                      <span className="font-medium text-gray-600">Số tiền:</span>
                      <span className="font-mono font-bold text-green-700">{formatPrice(depositData?.amount || 0)}</span>
                    </div>
                    <div className="flex justify-between items-start p-2 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg border-2 border-blue-200">
                      <span className="font-medium text-gray-600">Nội dung:</span>
                      <span className="font-mono font-bold text-gray-700 break-all text-right max-w-64 leading-tight">{depositData?.bankInfo.description}</span>
                    </div>
                  </div>
                </div>

                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertDescription className="text-yellow-800">
                    <div className="flex items-start gap-2">
                      <div className="p-1 bg-yellow-100 rounded-full mt-0.5">
                        <span className="text-yellow-600 text-xs">⚠️</span>
                      </div>
                      <div className="text-xs">
                        <strong className="font-semibold">Quan trọng:</strong> Vui lòng chuyển khoản chính xác số tiền và ghi đúng nội dung để tiền được cộng tự động vào ví.
                        <br />
                        <span className="text-xs mt-1 block">Đang kiểm tra nạp tiền mỗi 5 giây...</span>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
