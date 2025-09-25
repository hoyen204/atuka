"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatDateSafe } from "@/lib/date.utils";
import { 
  User, 
  Clock, 
  Shield, 
  Zap, 
  Mail, 
  Phone, 
  Loader2, 
  TrendingUp, 
  Activity, 
  Server,
  Users,
  BarChart3,
  Settings,
  Bell,
  Calendar,
  Globe,
  Sparkles,
  Crown,
  Star,
  Award,
  Target,
  CheckCircle,
  AlertCircle,
  CreditCard
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading, licenseStatus, isMounted } = useAuth();
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, isMounted, router]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!isMounted || isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse opacity-20"></div>
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary absolute top-4 left-1/2 transform -translate-x-1/2" />
          </div>
          <p className="text-muted-foreground font-medium animate-pulse">Đang tải dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const getLicenseIcon = (licenseType: string) => {
    switch (licenseType) {
      case "PRO":
        return <Crown className="w-4 h-4" />;
      case "BASIC":
        return <Star className="w-4 h-4" />;
      default:
        return <Award className="w-4 h-4" />;
    }
  };

  const getLicenseColor = (licenseType: string) => {
    switch (licenseType) {
      case "PRO":
        return "bg-gradient-to-r from-yellow-500 to-orange-500 text-white";
      case "BASIC":
        return "bg-gradient-to-r from-blue-500 to-purple-500 text-white";
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600 text-white";
    }
  };

  const stats = [
    {
      title: "Tổng tài khoản",
      value: "1,234",
      change: "+12%",
      changeType: "positive" as const,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20"
    },
    {
      title: "Clan đang hoạt động",
      value: "89",
      change: "+5%",
      changeType: "positive" as const,
      icon: Shield,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20"
    },
    {
      title: "Proxy hoạt động",
      value: "156",
      change: "+8%",
      changeType: "positive" as const,
      icon: Server,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/20"
    },
    {
      title: "Uptime hệ thống",
      value: "99.9%",
      change: "+0.1%",
      changeType: "positive" as const,
      icon: Activity,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100 dark:bg-emerald-900/20"
    }
  ];

  const quickActions = [
    {
      title: "Quản lý Accounts",
      description: "Thêm và quản lý tài khoản game",
      href: "/dashboard/accounts",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      borderColor: "border-blue-200 dark:border-blue-800"
    },
    {
      title: "Quản lý Clans",
      description: "Tạo và quản lý các clan",
      href: "/dashboard/clans", 
      icon: Shield,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      borderColor: "border-green-200 dark:border-green-800"
    },
    {
      title: "Quản lý Proxy",
      description: "Cấu hình và kiểm tra proxy",
      href: "/dashboard/proxy",
      icon: Server,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      borderColor: "border-purple-200 dark:border-purple-800"
    },
    {
      title: "Hoang Vực",
      description: "Quản lý shop và inventory",
      href: "/dashboard/hoang-vuc",
      icon: Target,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      borderColor: "border-orange-200 dark:border-orange-800"
    },
    {
      title: "Ví tiền",
      description: "Xem số dư và lịch sử giao dịch",
      href: "/dashboard/wallet",
      icon: CreditCard,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      borderColor: "border-blue-200 dark:border-blue-800"
    },
    {
      title: "Nạp tiền & Mua gói",
      description: "Nạp tiền vào ví và nâng cấp license",
      href: "/dashboard/payment",
      icon: Crown,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
      borderColor: "border-yellow-200 dark:border-yellow-800"
    }
  ];

  const systemStatus = [
    {
      name: "Server Status",
      status: "online" as const,
      description: "Máy chủ hoạt động bình thường",
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20"
    },
    {
      name: "Database",
      status: "online" as const,
      description: "Kết nối cơ sở dữ liệu ổn định",
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20"
    },
    {
      name: "API Services",
      status: "online" as const,
      description: "Tất cả API hoạt động tốt",
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      <div className="container mx-auto p-6 space-y-8">
        {/* Welcome Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10 rounded-3xl blur-3xl"></div>
          <Card className="relative backdrop-blur-xl border-0 shadow-2xl">
            <CardContent className="p-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur-lg opacity-30 animate-pulse"></div>
                      <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl text-white">
                        <Sparkles className="w-8 h-8" />
                      </div>
                    </div>
                    <div>
                      <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                        Chào mừng trở lại!
                      </h1>
                      <p className="text-xl text-muted-foreground">
                        {user.name} • {user.license_type} Account
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {currentTime.toLocaleTimeString('vi-VN')}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {currentTime.toLocaleDateString('vi-VN')}
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Vietnam
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Bell className="w-4 h-4" />
                    Thông báo
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Settings className="w-4 h-4" />
                    Cài đặt
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tổng tài khoản</p>
                  <p className="text-2xl font-bold">1,234</p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">+12%</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/20">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Clan đang hoạt động</p>
                  <p className="text-2xl font-bold">89</p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">+5%</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/20">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Proxy hoạt động</p>
                  <p className="text-2xl font-bold">156</p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">+8%</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/20">
                  <Server className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Uptime hệ thống</p>
                  <p className="text-2xl font-bold">99.9%</p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">+0.1%</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/20">
                  <Activity className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Info Card */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white">
                <CardTitle className="text-2xl flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <User className="w-6 h-6" />
                  </div>
                  Thông tin tài khoản
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Chi tiết về tài khoản và quyền hạn của bạn
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="group p-4 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-slate-700 dark:hover:to-slate-600 transition-all duration-300 border border-transparent hover:border-blue-200 dark:hover:border-slate-600">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">Tên hiển thị</span>
                      </div>
                      <p className="text-xl font-semibold pl-11">{user.name}</p>
                    </div>

                    <div className="group p-4 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-slate-700 dark:hover:to-slate-600 transition-all duration-300 border border-transparent hover:border-blue-200 dark:hover:border-slate-600">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
                          <Phone className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">Zalo ID</span>
                      </div>
                      <p className="text-xl font-semibold pl-11">{user.zalo_id}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="group p-4 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-slate-700 dark:hover:to-slate-600 transition-all duration-300 border border-transparent hover:border-blue-200 dark:hover:border-slate-600">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
                          <Mail className="w-4 h-4 text-purple-600" />
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">Email</span>
                      </div>
                      <p className="text-xl font-semibold pl-11">{user.email || "Chưa cập nhật"}</p>
                    </div>

                    <div className="group p-4 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-slate-700 dark:hover:to-slate-600 transition-all duration-300 border border-transparent hover:border-blue-200 dark:hover:border-slate-600">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/50 rounded-lg flex items-center justify-center">
                          <Shield className="w-4 h-4 text-amber-600" />
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">Loại License</span>
                      </div>
                      <div className="pl-11">
                        <Badge 
                          className={`${
                            user.license_type === 'PRO' ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white' :
                            user.license_type === 'BASIC' ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' :
                            'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
                          } text-sm font-semibold px-4 py-2 gap-2`}
                        >
                          {user.license_type === 'PRO' && <Crown className="w-4 h-4" />}
                          {user.license_type === 'BASIC' && <Star className="w-4 h-4" />}
                          {user.license_type === 'FREE' && <Award className="w-4 h-4" />}
                          {user.license_type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {user.license_expired && (
                  <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-lg flex items-center justify-center">
                        <Clock className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium text-amber-900 dark:text-amber-100">Ngày hết hạn License</p>
                        <p className="text-2xl font-bold text-amber-800 dark:text-amber-200">
                          {formatDateSafe(user.license_expired)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & System Status */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Thao tác nhanh
                </CardTitle>
                <CardDescription>
                  Truy cập nhanh các tính năng chính
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="ghost"
                  className="w-full justify-start p-4 h-auto border border-transparent hover:border-current transition-all duration-300"
                  onClick={() => router.push('/dashboard/accounts')}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Quản lý Accounts</p>
                      <p className="text-sm text-muted-foreground">Thêm và quản lý tài khoản game</p>
                    </div>
                  </div>
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start p-4 h-auto border border-transparent hover:border-current transition-all duration-300"
                  onClick={() => router.push('/dashboard/clans')}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                      <Shield className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Quản lý Clans</p>
                      <p className="text-sm text-muted-foreground">Tạo và quản lý các clan</p>
                    </div>
                  </div>
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start p-4 h-auto border border-transparent hover:border-current transition-all duration-300"
                  onClick={() => router.push('/dashboard/proxy')}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                      <Server className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Quản lý Proxy</p>
                      <p className="text-sm text-muted-foreground">Cấu hình và kiểm tra proxy</p>
                    </div>
                  </div>
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start p-4 h-auto border border-transparent hover:border-current transition-all duration-300"
                  onClick={() => router.push('/dashboard/hoang-vuc')}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                      <Target className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Hoang Vực</p>
                      <p className="text-sm text-muted-foreground">Quản lý shop và inventory</p>
                    </div>
                  </div>
                </Button>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Trạng thái hệ thống
                </CardTitle>
                <CardDescription>
                  Theo dõi tình trạng các dịch vụ
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Server Status</p>
                    <p className="text-xs text-muted-foreground">Máy chủ hoạt động bình thường</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    online
                  </Badge>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Database</p>
                    <p className="text-xs text-muted-foreground">Kết nối cơ sở dữ liệu ổn định</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    online
                  </Badge>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">API Services</p>
                    <p className="text-xs text-muted-foreground">Tất cả API hoạt động tốt</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    online
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
