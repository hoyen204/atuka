"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import {
  Bell,
  Gift,
  Home,
  LogOut,
  Menu,
  Moon,
  Server,
  Settings,
  Shield,
  ShoppingBag,
  Sun,
  Swords,
  TestTube,
  Trash2,
  UserCheck,
  Users,
  X,
  Zap
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      title={`Chuyển sang chế độ ${theme === "light" ? "tối" : "sáng"}`}
      className="h-9 w-9"
    >
      {theme === "light" ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </Button>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading, isMounted, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isMounted && !isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, isMounted, router]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setSidebarOpen(false);
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
      name: "Tổng Quan",
      href: "/dashboard",
      icon: Home,
      description: "Tổng quan hệ thống",
    },
    {
      name: "Quản Lý Tài Khoản",
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
      name: "Đổi Hệ Thống",
      href: "/dashboard/doi-he-thong",
      icon: Zap,
      description: "Quản lý đổi hệ thống",
    },
    {
      name: "Hoang Vực",
      href: "/dashboard/hoang-vuc",
      icon: Server,
      description: "Quản lý hoang vực",
    },
    {
      name: "Danh Sách Tông Môn",
      href: "/dashboard/clans",
      icon: Shield,
      description: "Danh sách tông môn HH3D",
    },
    {
      name: "Quản Lý Tông Môn",
      href: "/dashboard/clan-management",
      icon: Users,
      description: "Quản lý tông môn HH3D",
    },
    {
      name: "Quản Lý Proxy",
      href: "/dashboard/proxy",
      icon: Server,
      description: "Quản lý proxy",
    },
    {
      name: "Proxy Đã Xóa",
      href: "/dashboard/proxy/deleted",
      icon: Trash2,
      description: "Proxy đã xóa",
    },
    {
      name: "Kiểm Tra Proxy",
      href: "/dashboard/proxy/checker",
      icon: TestTube,
      description: "Kiểm tra proxy",
    },
    {
      name: "Báo Cáo Quà Cưới",
      href: "/dashboard/wedding-reports",
      icon: Gift,
      description: "Báo cáo quà cưới",
    },
    {
      name: "Tụ Bảo Các",
      href: "/dashboard/user-shop",
      icon: ShoppingBag,
      description: "Quản lý cửa hàng người dùng",
    },
  ];

  // Add User Management only for admin
  const adminNavigation = [
    {
      name: "Quản Lý Người Dùng",
      href: "/dashboard/users",
      icon: Users,
      description: "Quản lý người dùng",
    },
    {
      name: "Cấu Hình Hệ Thống",
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
    <div className="h-screen flex flex-col bg-background">
      {/* Mobile Header - Mobile-first design */}
      <header className="lg:hidden bg-card border-b border-border sticky top-0 z-40 flex-shrink-0">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="touch-target"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                <Swords className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg text-primary">HH3D</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="touch-target">
              <Bell className="w-5 h-5" />
            </Button>
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="touch-target">
                  <div className="w-8 h-8 relative">
                    <Image
                      src="/character-hero.jpg"
                      alt="User Avatar"
                      fill
                      className="object-cover rounded-full"
                    />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div>
                    <p className="font-medium text-primary">{user.name}</p>
                    <p className="text-sm text-muted">{user.license_type}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive text-center"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Mobile Menu - High contrast */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-30">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-card border-r border-border shadow-xl safe-area overflow-y-auto">
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-primary">Menu</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="touch-target"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
            <nav className="p-4 space-y-1">
              {fullNavigation.map((item) => {
                const isActive = isActivePath(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center px-3 py-3 text-base font-medium rounded-lg transition-colors-subtle ${
                      isActive
                        ? "bg-primary/10 text-primary border-l-4 border-primary"
                        : "text-secondary hover:text-primary hover:bg-muted/50"
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium truncate">{item.name}</div>
                      {item.description && (
                        <div className="text-sm text-muted mt-0.5">
                          {item.description}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar - Simplified */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 xl:w-72 flex-shrink-0">
          <div className="flex flex-col h-full bg-card border-r border-border">
            {/* Logo - Fixed at top */}
            <div className="flex-shrink-0 p-6 border-b border-border">
              <Link href="/dashboard" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <Swords className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-primary">
                    HH3D Management
                  </h2>
                  <p className="text-sm text-muted">Admin Panel</p>
                </div>
              </Link>
            </div>

            {/* Navigation - Scrollable */}
            <nav className="flex-1 overflow-y-auto p-4">
              <div className="space-y-1">
                {fullNavigation.map((item) => {
                  const isActive = isActivePath(item.href);
                  const Icon = item.icon;
                  return (
                    <Link key={item.name} href={item.href}>
                      <div
                        className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors-subtle ${
                          isActive
                            ? "bg-primary/10 text-primary border-l-4 border-primary"
                            : "text-secondary hover:text-primary hover:bg-muted/50"
                        }`}
                      >
                        <Icon
                          className={`w-5 h-5 mr-3 flex-shrink-0 ${
                            isActive ? "text-primary" : "text-muted"
                          }`}
                        />
                        <div className="min-w-0">
                          <div className="font-medium truncate">
                            {item.name}
                          </div>
                          {item.description && (
                            <div className="text-xs text-muted mt-0.5">
                              {item.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </nav>

            {/* User Info & Logout - Fixed at bottom */}
            <div className="flex-shrink-0 p-4 border-t border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 relative">
                  <Image
                    src="/character-hero.jpg"
                    alt="User Avatar"
                    fill
                    className="object-cover rounded-full"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm text-primary truncate">
                    {user.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant={
                        user.license_type === "PRO"
                          ? "default"
                          : user.license_type === "BASIC"
                          ? "secondary"
                          : "outline"
                      }
                      className="text-xs px-2 py-0.5"
                    >
                      {user.license_type === "PRO" && "👑 "}
                      {user.license_type === "BASIC" && "⭐ "}
                      {user.license_type === "FREE" && "🔰 "}
                      {user.license_type}
                    </Badge>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="w-full flex text-destructive text-center hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Đăng xuất
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-0 h-full overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
