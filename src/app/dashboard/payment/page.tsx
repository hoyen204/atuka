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
import { CheckCircle, Crown, Star, Gift, Calculator, Wallet, CreditCard, Download, RefreshCw } from 'lucide-react';
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

  const downloadQR = async () => {
    if (!depositData?.qrCode) return;
    
    try {
      const response = await fetch(depositData.qrCode);
      if (!response.ok) throw new Error('Failed to fetch QR image');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `QR_NapTien_${depositData.depositId || 'unknown'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Thành công',
        description: 'QR Code đã được tải xuống.',
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải QR Code. Vui lòng thử lại.',
        variant: 'destructive',
      });
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

  // Update overall structure for desktop expansion
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-3 md:p-4 lg:p-5 space-y-4 md:space-y-6 lg:space-y-8 max-w-4xl md:max-w-6xl lg:max-w-7xl">
        
        {/* Hero - Balanced sizing */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-3 md:p-4 lg:p-5 text-white shadow-lg border border-white/20">
          <div className="absolute inset-0 bg-black/5"></div>
          <div className="relative z-10 text-center">
            <div className="flex items-center justify-center gap-2 md:gap-3 mb-3 md:mb-4">
              <div className="p-2 md:p-3 lg:p-4 bg-white/20 rounded-full">
                <Wallet className="h-5 md:h-6 lg:h-7 w-5 md:w-6 lg:w-7" />
              </div>
              <h1 className="text-lg md:text-xl lg:text-2xl font-bold">Ví & Nâng cấp</h1>
            </div>
            <p className="text-blue-100 text-sm md:text-base lg:text-lg leading-relaxed max-w-lg mx-auto">Quản lý ví tiền thông minh và nâng cấp trải nghiệm với các gói dịch vụ cao cấp</p>
          </div>
        </div>

        {/* Cards - Adjusted gaps and padding */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 lg:gap-6">
          {wallet && (
            <Card className="border-0 shadow-md bg-white rounded-2xl p-3 md:p-4 lg:p-6">
              <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                <div className="p-2 md:p-2.5 lg:p-3 bg-emerald-100 rounded-full">
                  <Wallet className="h-5 md:h-6 lg:h-7 w-5 md:w-6 lg:w-7 text-emerald-600" />
                </div>
                <h3 className="text-base md:text-lg lg:text-xl font-semibold text-gray-800">Số dư ví</h3>
              </div>
              <div className="space-y-3 md:space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-xs md:text-sm lg:text-base">Hiện tại</span>
                  <span className="text-xl md:text-2xl lg:text-3xl font-bold text-emerald-600">{formatPrice(wallet.balance)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 md:gap-3 lg:gap-4 text-xs md:text-sm lg:text-base">
                  <div className="bg-gray-50 p-2 md:p-3 lg:p-4 rounded-lg text-center">
                    <div className="text-green-600 font-medium text-sm md:text-base lg:text-lg">{formatPrice(wallet.totalDeposit)}</div>
                    <div className="text-gray-500 text-xs md:text-sm">Đã nạp</div>
                  </div>
                  <div className="bg-gray-50 p-2 md:p-3 lg:p-4 rounded-lg text-center">
                    <div className="text-red-600 font-medium text-sm md:text-base lg:text-lg">{formatPrice(wallet.totalSpent)}</div>
                    <div className="text-gray-500 text-xs md:text-sm">Đã tiêu</div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {currentUser && (
            <Card className="border-0 shadow-md bg-white rounded-2xl p-3 md:p-4 lg:p-6">
              <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                <div className="p-2 md:p-2.5 lg:p-3 bg-purple-100 rounded-full">
                  {getLicenseIcon(currentUser.licenseType)}
                </div>
                <h3 className="text-base md:text-lg lg:text-xl font-semibold text-gray-800">Gói hiện tại</h3>
              </div>
              <div className="grid grid-cols-3 gap-2 md:gap-3 lg:gap-6 text-center text-xs md:text-sm lg:text-base">
                <div>
                  <div className="font-semibold text-purple-600 text-sm md:text-base lg:text-lg">{currentUser.licenseType}</div>
                  <div className="text-gray-500 text-xs md:text-sm">Gói</div>
                </div>
                <div>
                  <div className="text-lg md:text-xl lg:text-2xl font-bold text-gray-800">{currentUser.accountPlus}</div>
                  <div className="text-gray-500 text-xs md:text-sm">Account Plus</div>
                </div>
                <div>
                  <div className="text-gray-600 text-xs md:text-sm lg:text-base">{formatDate(currentUser.licenseExpired)}</div>
                  <div className="text-gray-500 text-xs md:text-sm">Hết hạn</div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Tabs - Scaled appropriately */}
        <Tabs defaultValue="deposit" className="w-full">
          <TabsList className="grid grid-cols-2 bg-white rounded-xl shadow-sm border border-gray-200">
            <TabsTrigger value="deposit" className="gap-2 rounded-lg data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
              <CreditCard className="h-4 md:h-5 lg:h-6 w-4 md:w-5 lg:w-6 flex-shrink-0" />
              <span className="text-sm md:text-base lg:text-lg font-medium">Nạp tiền</span>
            </TabsTrigger>
            <TabsTrigger value="purchase" className="gap-2 rounded-lg data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
              <Crown className="h-4 md:h-5 lg:h-6 w-4 md:w-5 lg:w-6 flex-shrink-0" />
              <span className="text-sm md:text-base lg:text-lg font-medium">Mua gói</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="deposit" className="space-y-4 md:space-y-6 mt-4 md:mt-6">
            <Card className="border-0 shadow-md bg-white rounded-2xl p-3 md:p-4 lg:p-6">
              <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4 lg:mb-6">
                <div className="p-2 md:p-2.5 lg:p-3 bg-blue-100 rounded-full">
                  <CreditCard className="h-5 md:h-6 lg:h-7 w-5 md:w-6 lg:w-7 text-blue-600" />
                </div>
                <h3 className="text-base md:text-lg lg:text-xl font-semibold">Nạp tiền vào ví</h3>
              </div>
              <div className="space-y-3 md:space-y-4 lg:space-y-6">
                <div className="relative">
                  <Label htmlFor="depositAmount" className="text-xs md:text-sm lg:text-base font-medium text-gray-700 block mb-1 md:mb-2 text-left">
                    Số tiền
                  </Label>
                  <Input
                    id="depositAmount"
                    type="number"
                    min="50000"
                    step="50000"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(parseInt(e.target.value) || 0)}
                    placeholder="Nhập số tiền"
                    className="h-8 md:h-10 lg:h-12 pl-4 pr-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl text-base md:text-lg lg:text-xl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-1 md:gap-2 lg:gap-3">
                  {[50000, 100000, 200000, 500000].map((amount) => (
                    <Button
                      key={amount}
                      variant={depositAmount === amount ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDepositAmount(amount)}
                      className="h-8 md:h-10 lg:h-12 rounded-xl justify-center"
                    >
                      {amount.toLocaleString('vi-VN')}
                    </Button>
                  ))}
                </div>
                <Button
                  onClick={handleDeposit}
                  disabled={loading || depositAmount < 50000}
                  className="w-full h-12 md:h-14 lg:h-16 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-md transition-all text-sm md:text-base lg:text-lg"
                  size="lg"
                >
                  {loading ? (
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-5 md:w-6 lg:w-7 h-5 md:h-6 lg:h-7 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Đang xử lý
                    </div>
                  ) : (
                    `Nạp ${depositAmount.toLocaleString('vi-VN')} VNĐ`
                  )}
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="purchase" className="space-y-8 mt-6">
            <div className="text-center mb-8 lg:mb-12">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-2">Chọn gói dịch vụ</h2>
              <p className="text-gray-600 text-sm lg:text-base max-w-2xl mx-auto">Nâng cấp để mở khóa tính năng cao cấp và trải nghiệm tốt hơn</p>
            </div>

            <Tabs value={selectedLicense} onValueChange={(value) => setSelectedLicense(value as 'BASIC' | 'PRO')} className="w-full">
              <TabsList className="grid grid-cols-2 bg-white rounded-xl shadow-sm border border-gray-200 mb-6 md:mb-8 lg:mb-12">
                <TabsTrigger value="BASIC" className="gap-2 rounded-lg data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
                  <Star className="h-4 md:h-5 lg:h-6 w-4 md:w-5 lg:w-6 flex-shrink-0" />
                  <span className="text-sm md:text-base lg:text-lg font-medium">BASIC</span>
                </TabsTrigger>
                <TabsTrigger value="PRO" className="gap-2 rounded-lg data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
                  <Crown className="h-4 md:h-5 lg:h-6 w-4 md:w-5 lg:w-6 flex-shrink-0" />
                  <span className="text-sm md:text-base lg:text-lg font-medium">PRO</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="BASIC" className="space-y-6">
                <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-1 md:p-2 lg:p-3 text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-purple-500/10 rounded-2xl"></div>
                  <div className="relative z-10">
                    <div className="flex justify-center mb-4 lg:mb-6">
                      <div className="p-2 lg:p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full text-white shadow-lg">
                        <Star className="h-6 lg:h-8 w-6 lg:w-8" />
                      </div>
                    </div>
                    <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-800 mb-2 md:mb-3">Gói BASIC</h3>
                    <div className="flex items-center justify-center gap-1 md:gap-2 mb-3 md:mb-4 lg:mb-6">
                      <span className="text-2xl md:text-3xl lg:text-4xl font-bold text-blue-600">{formatPrice(50000)}</span>
                      <span className="text-xs md:text-sm lg:text-base text-gray-600">/tháng</span>
                    </div>
                    <div className="mt-6 lg:mt-8 space-y-3 lg:space-y-4">
                      <h4 className="font-semibold text-gray-700 flex items-center gap-2 justify-center text-sm lg:text-base">
                        <CheckCircle className="h-4 lg:h-5 w-4 lg:w-5 text-green-500" />
                        Tính năng
                      </h4>
                      <ul className="space-y-2 lg:space-y-3 text-sm lg:text-base text-gray-600 max-h-48 lg:max-h-none overflow-y-auto">
                        {packages.BASIC?.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-3 lg:gap-4">
                            <CheckCircle className="h-4 lg:h-5 w-4 lg:w-5 text-green-500 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="PRO" className="space-y-6">
                <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-pink-100 rounded-2xl p-1 md:p-2 lg:p-3 text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-pink-500/10 rounded-2xl"></div>
                  <div className="relative z-10">
                    <div className="flex justify-center mb-4 lg:mb-6">
                      <div className="p-2 lg:p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full text-white shadow-lg">
                        <Crown className="h-6 lg:h-8 w-6 lg:w-8" />
                      </div>
                    </div>
                    <h3 className="text-xl lg:text-3xl font-bold text-gray-800 mb-2">Gói PRO</h3>
                    <div className="flex items-center justify-center gap-2 mb-4 lg:mb-6">
                      <span className="text-2xl md:text-3xl lg:text-4xl font-bold text-purple-600">{formatPrice(100000)}</span>
                      <span className="text-gray-600 text-sm lg:text-base">/tháng</span>
                    </div>
                    <div className="mt-6 lg:mt-8 space-y-3 lg:space-y-4">
                      <h4 className="font-semibold text-gray-700 flex items-center gap-2 justify-center text-sm lg:text-base">
                        <CheckCircle className="h-4 lg:h-5 w-4 lg:w-5 text-green-500" />
                        Tính năng
                      </h4>
                      <ul className="space-y-2 lg:space-y-3 text-sm lg:text-base text-gray-600 max-h-48 lg:max-h-none overflow-y-auto">
                        {packages.PRO?.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-3 lg:gap-4">
                            <CheckCircle className="h-4 lg:h-5 w-4 lg:w-5 text-green-500 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Summary - Expanded on desktop */}
            {(paymentInfo.totalAmount || 0) > 0 && (
              <Card className="border-0 shadow-md bg-white rounded-2xl p-1 md:p-2 lg:p-3 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl opacity-50"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4 lg:mb-6">
                    <div className="p-1 md:p-2 lg:p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white">
                      <Calculator className="h-5 lg:h-6 w-5 lg:w-6" />
                    </div>
                    <h3 className="text-lg lg:text-xl font-semibold">Tổng kết đơn hàng</h3>
                  </div>
                  <div className="space-y-4 lg:space-y-6">
                    {selectedLicense && (
                      <div className="flex justify-between items-center p-1 md:p-2 lg:p-3 bg-blue-50 rounded-lg border-l-4 border-blue-200">
                        <span className="text-sm lg:text-base font-medium">Gói {selectedLicense}</span>
                        <span className="font-bold text-blue-600 text-lg lg:text-xl">{formatPrice(paymentInfo.licensePrice || 0)}</span>
                      </div>
                    )}
                    {paymentInfo.accountPlus && paymentInfo.accountPlus > 0 && (
                      <div className="flex justify-between items-center p-1 md:p-2 lg:p-3 bg-green-50 rounded-lg border-l-4 border-green-200">
                        <span className="text-sm lg:text-base font-medium">{paymentInfo.accountPlus} Account Plus</span>
                        <span className="font-bold text-green-600 text-lg lg:text-xl">{formatPrice(paymentInfo.accountPlusPrice || 0)}</span>
                      </div>
                    )}
                    <div className="border-t pt-4 lg:pt-6">
                      <div className="flex justify-between items-center p-1 md:p-2 lg:p-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg border border-purple-200">
                        <span className="text-xl lg:text-2xl font-bold">Tổng cộng</span>
                        <span className="text-2xl lg:text-3xl font-bold text-purple-600">{formatPrice(paymentInfo.totalAmount || 0)}</span>
                      </div>
                    </div>
                    {calculating && (
                      <div className="flex items-center justify-center gap-3 text-purple-600 p-1 md:p-2 lg:p-3 bg-purple-50 rounded-lg">
                        <div className="w-5 lg:w-6 h-5 lg:h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-base lg:text-lg font-medium">Đang tính toán...</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Purchase Button - Larger on desktop */}
            <Button
              onClick={handlePurchase}
              disabled={loading || calculating || (paymentInfo.totalAmount || 0) <= 0}
              className="w-full h-12 md:h-14 lg:h-16 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg transition-all text-base lg:text-lg"
              size="lg"
            >
              {loading ? (
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-5 lg:w-6 h-5 lg:h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang xử lý...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 md:gap-3">
                  <Wallet className="h-5 lg:h-6 w-5 lg:w-6" />
                  <span>Mua ngay từ ví</span>
                </div>
              )}
            </Button>

            {/* Alert - Styled for desktop */}
            {(paymentInfo.totalAmount || 0) > 0 && wallet && wallet.balance < (paymentInfo.totalAmount || 0) && (
              <Alert className="border-l-4 border-red-500 bg-red-50 rounded-lg p-1 md:p-2 lg:p-3">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="p-1 md:p-2 lg:p-3 bg-red-100 rounded-lg">
                    <span className="text-red-600 text-lg lg:text-xl">!</span>
                  </div>
                  <div className="flex-1">
                    <strong className="text-red-800 text-sm md:text-base lg:text-lg block">Không đủ số dư!</strong>
                    <p className="text-red-700 text-sm lg:text-base mt-1">Bạn cần nạp thêm {formatPrice((paymentInfo.totalAmount || 0) - wallet.balance)} vào ví để hoàn tất.</p>
                  </div>
                </div>
              </Alert>
            )}
          </TabsContent>
        </Tabs>

        {/* Modal - More moderate width */}
        <Dialog open={showDepositQR} onOpenChange={(open) => {
          if (!open) {
            handleCloseDepositModal();
          }
        }}>
          <DialogContent className="max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-5xl w-full bg-white rounded-2xl p-1 md:p-2 lg:p-3 shadow-2xl">
            {/* Header */}
            <DialogHeader className="text-center pb-6">
              <div className="flex justify-center mb-4">
                <div className="p-1 md:p-2 lg:p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full text-white shadow-lg">
                  <CreditCard className="h-6 lg:h-8 w-6 lg:w-8" />
                </div>
              </div>
              <DialogTitle className="text-xl lg:text-2xl font-bold text-gray-800">Quét QR để nạp tiền</DialogTitle>
              <DialogDescription className="text-sm lg:text-base font-medium text-gray-600">
                Mã nạp tiền: <span className="font-mono bg-blue-100 px-2 py-1 rounded text-blue-700">{depositData?.depositId}</span>
              </DialogDescription>
            </DialogHeader>

            {/* Content - Side-by-side on desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-3 lg:gap-4">
              {/* QR */}
              <div className="flex flex-col items-center">
                <div className="p-1 md:p-2 lg:p-3 bg-white rounded-2xl shadow-lg border">
                  <img
                    src={depositData?.qrCode}
                    alt="QR Code nạp tiền"
                    className="w-32 lg:w-48 h-32 lg:h-48 mx-auto"
                  />
                  <p className="mt-2 text-sm lg:text-base text-center text-gray-500">Quét mã QR để thanh toán</p>
                </div>
                {depositData?.qrCode && (
                  <Button variant="outline" size="sm" onClick={downloadQR} className="mt-2 md:mt-4 px-3 md:px-4 py-1 md:py-2 border-blue-200">
                    <Download className="h-4 w-4 mr-2" />
                    Tải QR Code
                  </Button>
                )}
              </div>

              {/* Bank Info */}
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-2xl p-4 lg:p-6 border">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-xs md:text-sm lg:text-base">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <CreditCard className="h-4 w-4 text-blue-600" />
                    </div>
                    Thông tin chuyển khoản
                  </h3>
                  <div className="space-y-3 text-xs md:text-sm lg:text-base">
                    <div className="flex justify-between items-center p-1 md:p-2 lg:p-3 bg-white rounded-lg">
                      <span className="font-medium text-gray-600">Ngân hàng:</span>
                      <span className="font-mono font-semibold">{depositData?.bankInfo.bankName}</span>
                    </div>
                    <div className="flex justify-between items-center p-1 md:p-2 lg:p-3 bg-white rounded-lg">
                      <span className="font-medium text-gray-600">Số tài khoản:</span>
                      <span className="font-mono font-semibold break-all">{depositData?.bankInfo.bankNumber}</span>
                    </div>
                    <div className="flex justify-between items-center p-1 md:p-2 lg:p-3 bg-white rounded-lg">
                      <span className="font-medium text-gray-600">Chủ tài khoản:</span>
                      <span className="font-mono font-semibold break-all">{depositData?.bankInfo.accountName}</span>
                    </div>
                    <div className="flex justify-between items-center p-1 md:p-2 lg:p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
                      <span className="font-medium text-gray-600">Số tiền:</span>
                      <span className="font-bold text-green-700">{formatPrice(depositData?.amount || 0)}</span>
                    </div>
                    <div className="flex justify-between items-start p-1 md:p-2 lg:p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                      <span className="font-medium text-gray-600">Nội dung:</span>
                      <div className="flex-1 ml-2 text-right">
                        <span className="font-mono font-bold text-gray-700 break-all">{depositData?.bankInfo.description}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Alert className="border-l-4 border-yellow-400 bg-yellow-50 rounded-lg p-1 md:p-2 lg:p-3">
                  <div className="flex items-start gap-3">
                    <div className="p-1 md:p-2 lg:p-3 bg-yellow-100 rounded-lg flex-shrink-0">
                      <span className="text-yellow-600">⚠️</span>
                    </div>
                    <div className="flex-1">
                      <strong className="font-semibold block text-xs md:text-sm lg:text-base">Quan trọng:</strong>
                      <p className="text-sm lg:text-base mt-1">Vui lòng chuyển khoản chính xác số tiền và nội dung để tiền được cộng tự động.</p>
                      <div className="flex items-center gap-2 mt-2 text-xs md:text-sm lg:text-base">
                        <RefreshCw className="h-4 w-4 animate-spin text-yellow-600" />
                        <span>Đang kiểm tra mỗi 5 giây...</span>
                      </div>
                    </div>
                  </div>
                </Alert>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
