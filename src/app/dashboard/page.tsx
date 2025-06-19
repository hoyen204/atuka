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
  Globe
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardWidget } from "@/components/ui/dashboard-widget";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { QuickAction } from "@/components/ui/quick-action";

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading, licenseStatus, isMounted } = useAuth();
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());

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
            <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-spin opacity-20"></div>
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary absolute top-4 left-1/2 transform -translate-x-1/2" />
          </div>
          <p className="text-muted-foreground font-medium">Đang tải dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const getLicenseBadgeVariant = (licenseType: string) => {
    switch (licenseType) {
      case "PRO":
        return "default";
      case "BASIC":
        return "secondary";
      default:
        return "outline";
    }
  };

  const quickActions = [
    {
      title: "Quản lý Accounts",
      description: "Thêm và quản lý tài khoản game",
      href: "/dashboard/accounts",
      icon: Users,
      bgColor: "bg-blue-500/10",
      textColor: "text-blue-600"
    },
    {
      title: "Quản lý Clans",
      description: "Tạo và quản lý các clan",
      href: "/dashboard/clans", 
      icon: Shield,
      bgColor: "bg-green-500/10",
      textColor: "text-green-600"
    },
    {
      title: "Quản lý Proxy",
      description: "Cấu hình và kiểm tra proxy",
      href: "/dashboard/proxies",
      icon: Server,
      bgColor: "bg-purple-500/10", 
      textColor: "text-purple-600"
    }
  ];

  // Add User Management quick action only for admin
  const adminQuickActions = [
    {
      title: "Quản lý Users",
      description: "Quản lý người dùng và quyền hạn",
      href: "/dashboard/user",
      icon: User,
      bgColor: "bg-orange-500/10",
      textColor: "text-orange-600"
    }
  ];

  const fullQuickActions = user?.is_admin ? [...quickActions, ...adminQuickActions] : quickActions;

  const dashboardStats = [
    {
      title: "Hoạt động",
      value: "Online",
      change: "+100%",
      icon: Activity,
      gradient: "from-emerald-500 to-emerald-600",
      bgGlow: "bg-emerald-500/20"
    },
    {
      title: "License",
      value: user.license_type,
      change: "Active",
      icon: Shield,
      gradient: "from-blue-500 to-blue-600", 
      bgGlow: "bg-blue-500/20"
    },
    {
      title: "Tài khoản",
      value: "Verified",
      change: "✓ Xác thực",
      icon: User,
      gradient: "from-purple-500 to-purple-600",
      bgGlow: "bg-purple-500/20"
    },
    {
      title: "Hệ thống",
      value: "99.9%",
      change: "+0.1%",
      icon: TrendingUp,
      gradient: "from-indigo-500 to-indigo-600",
      bgGlow: "bg-indigo-500/20"
    }
  ];

  const systemStatus = [
    {
      status: "online" as const,
      label: "Server Status",
      description: "Máy chủ hoạt động bình thường"
    },
    {
      status: "online" as const,
      label: "Database",
      description: "Kết nối cơ sở dữ liệu ổn định"
    },
    {
      status: "online" as const,
      label: "API Services",
      description: "Tất cả API hoạt động tốt"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10 rounded-3xl blur-3xl"></div>
          <div className="relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur-lg opacity-30 animate-pulse"></div>
                    <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-2xl text-white">
                      <User className="w-8 h-8" />
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
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {dashboardStats.map((stat, index) => (
            <DashboardWidget
              key={index}
              title={stat.title}
              value={stat.value}
              change={stat.change}
              icon={stat.icon}
              gradient={stat.gradient}
              bgGlow={stat.bgGlow}
            />
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Info Card */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden border-0 shadow-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 opacity-90" />
                <CardHeader className="relative text-white p-8">
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
              </div>
              
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
                          variant={getLicenseBadgeVariant(user.license_type)}
                          className="text-sm font-semibold px-4 py-2 gap-2"
                        >
                          <Zap className="w-3 h-3" />
                          {user.license_type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {user.license_expired && (
                  <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-xl flex items-center justify-center">
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
            <Card className="border-0 shadow-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl">
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
                {fullQuickActions.map((action, index) => (
                  <QuickAction
                    key={index}
                    title={action.title}
                    description={action.description}
                    href={action.href}
                    icon={action.icon}
                    bgColor={action.bgColor}
                    textColor={action.textColor}
                  />
                ))}
              </CardContent>
            </Card>

            {/* System Status */}
            <Card className="border-0 shadow-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Trạng thái hệ thống
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {systemStatus.map((status, index) => (
                  <StatusIndicator
                    key={index}
                    status={status.status}
                    label={status.label}
                    description={status.description}
                  />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
