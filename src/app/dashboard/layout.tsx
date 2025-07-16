"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import {
  Bell,
  ChevronDown,
  Gift,
  Home,
  LogOut,
  Menu,
  Search,
  Server,
  Settings,
  Shield,
  UserCheck,
  Users,
  X,
  Zap,
  Trash2,
  TestTube
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading, isMounted, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isMounted && !isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, isMounted, router]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  if (!isMounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 mx-auto relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-lg opacity-40 animate-pulse" />
              <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-white/30 bg-white/10 backdrop-blur-sm">
                <Image
                  src="/character-profile.jpg"
                  alt="Loading"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-white font-bold text-xl mb-2">
              HH3D Management
            </h2>
            <p className="text-white/70 font-medium">Đang tải hệ thống...</p>
          </div>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
      description: "Tổng quan hệ thống",
    },
    {
      name: "Account Management",
      href: "/dashboard/accounts",
      icon: UserCheck,
      description: "Quản lý tài khoản",
    },
    {
      name: "Thiên Đạo Ban Thuởng",
      href: "/dashboard/thien-dao-ban-thuong",
      icon: Gift,
      description: "Quản lý thiên đạo ban thuởng",
    },
    {
      name: "Clans Management",
      href: "/dashboard/clans",
      icon: Shield,
      description: "Quản lý clan",
    },
    {
      name: "Proxy Management",
      href: "/dashboard/proxy",
      icon: Server,
      description: "Quản lý proxy",
    },
    {
      name: "Deleted Proxies",
      href: "/dashboard/proxy/deleted",
      icon: Trash2,
      description: "Proxy đã xóa",
    },
    {
      name: "Proxy Checker",
      href: "/dashboard/proxy/checker",
      icon: TestTube,
      description: "Kiểm tra proxy",
    },
    {
      name: "Wedding Reports",
      href: "/dashboard/wedding-reports",
      icon: Gift,
      description: "Báo cáo quà cưới",
    },
  ];

  // Add User Management only for admin
  const adminNavigation = [
    {
      name: "User Management",
      href: "/dashboard/user",
      icon: Users,
      description: "Quản lý người dùng",
    },
    {
      name: "System Options",
      href: "/dashboard/system-options",
      icon: Settings,
      description: "Cấu hình hệ thống",
    },
  ];

  const fullNavigation = user?.is_admin
    ? [...navigation, ...adminNavigation]
    : [...navigation];

  const isActivePath = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    if (href === "/dashboard/proxy") {
      return pathname === "/dashboard/proxy";
    }
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50 flex-shrink-0">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-blue-600 rounded-md blur-sm opacity-30" />
                <div className="relative w-full h-full rounded-md overflow-hidden border border-primary/20">
                  <Image
                    src="/character-profile.jpg"
                    alt="HH3D Logo"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              <h1 className="font-bold text-lg">HH3D</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Bell className="w-5 h-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <div className="w-6 h-6 relative">
                    <Image
                      src="/character-hero.jpg"
                      alt="User Avatar"
                      fill
                      className="object-cover rounded-full"
                    />
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.license_type}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside
          className={`
          fixed lg:static inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out lg:transform-none
          ${
            isMobileMenuOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
          bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-2xl border-r border-slate-200 dark:border-slate-700
          flex flex-col h-screen
        `}
        >
          {/* Logo Section */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-slate-800/50 dark:to-slate-700/50">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-blue-600 rounded-md blur-md opacity-30" />
                <div className="relative w-12 h-12 rounded-md overflow-hidden border-2 border-primary/20 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
                  <Image
                    src="/character-profile.jpg"
                    alt="HH3D Logo"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              <div>
                <h2 className="font-bold text-xl text-slate-900 dark:text-white">
                  HH3D Management
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Admin Panel
                </p>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm..."
                className="pl-10 bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600"
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-4 flex-1 overflow-y-auto min-h-0">
            <div className="space-y-2">
              {fullNavigation.map((item) => {
                const isActive = isActivePath(item.href);
                const Icon = item.icon;

                return (
                  <Link key={item.name} href={item.href}>
                    <div
                      className={`group relative overflow-hidden rounded-md transition-all duration-300 ${
                        isActive
                          ? "bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg shadow-primary/25"
                          : "hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-slate-700 dark:hover:to-slate-600 text-slate-700 dark:text-slate-300 hover:text-primary"
                      }`}
                    >
                      {isActive && (
                        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent" />
                      )}
                      <div className="relative p-4 flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-md flex items-center justify-center transition-all duration-200 ${
                            isActive
                              ? "bg-white/20"
                              : "bg-slate-100 dark:bg-slate-700 group-hover:bg-primary/10"
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p
                            className={`text-xs ${
                              isActive
                                ? "text-white/80"
                                : "text-muted-foreground"
                            }`}
                          >
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* User Info & Logout */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-gradient-to-t from-slate-50/50 to-transparent dark:from-slate-800/50 dark:to-transparent">
            <Card className="mb-4 border-0 shadow-lg bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-slate-700/50 dark:to-slate-600/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary to-blue-600 rounded-full blur-sm opacity-30" />
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-primary/30">
                      <Image
                        src="/character-hero.jpg"
                        alt="User Avatar"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-slate-900 dark:text-white truncate">
                      {user.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="secondary"
                        className="text-xs px-2 py-0.5"
                      >
                        {user.license_type}
                      </Badge>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-950 transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
              Đăng xuất
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-0 h-full overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
