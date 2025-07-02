"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useGlobalLoading } from "@/hooks/useGlobalLoading";
import { Eye, EyeOff, User, Lock, Grid3X3, AlertTriangle, Shield, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isMounted } = useAuth();
  const { showLoading, hideLoading } = useGlobalLoading();
  const [formData, setFormData] = useState({
    zaloId: "",
    password: "",
    rememberMe: false,
  });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isMounted, isAuthenticated, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    showLoading("Đang đăng nhập...");
    setError("");
    try {
      const credentials = {
        zaloId: formData.zaloId,
        password: formData.password,
        rememberMe: formData.rememberMe,
      };
      const result = await login(credentials);
      if (result.success) {
        router.push("/dashboard");
      } else {
        setError(result.message || "Đăng nhập thất bại. Vui lòng thử lại. 😓");
      }
    } catch (err) {
      setError("Đăng nhập thất bại. Vui lòng thử lại. 😓");
    } finally {
      setIsSubmitting(false);
      hideLoading();
    }
  };

  if (!mounted || (isMounted && isAuthenticated)) {
    return null;
  }

  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* Left Side - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 animate-gradient-shift" />
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-20 w-4 h-4 bg-blue-400 rounded-full animate-float opacity-60"></div>
        <div className="absolute top-40 right-32 w-6 h-6 bg-purple-400 rounded-full animate-float animation-delay-1000 opacity-40"></div>
        <div className="absolute bottom-32 left-16 w-3 h-3 bg-indigo-400 rounded-full animate-float animation-delay-2000 opacity-50"></div>
        
        <div className="relative flex flex-col justify-center items-center p-12 text-white animate-slide-in-left">
          <div className="max-w-md text-center space-y-8">
            <div className="relative animate-bounce-in">
              <div className="w-64 h-64 mx-auto relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-2xl opacity-40 animate-pulse-glow" />
                <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-white/30 shadow-2xl hover-glow">
                  <Image
                    src="/character-portrait.jpg"
                    alt="HH3D Character"
                    fill
                    className="object-cover transition-transform duration-700 hover:scale-110"
                    priority
                  />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-wiggle">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
            
            <div className="space-y-4 animate-fade-in animation-delay-500">
              <h1 className="text-4xl font-bold animate-typewriter">
                Chào mừng đến với <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 animate-gradient-shift">
                  HH3D Management
                </span>
              </h1>
              <p className="text-blue-100 text-lg leading-relaxed animate-slide-in-up animation-delay-1000">
                Hệ thống quản lý tài khoản game hiện đại với giao diện thân thiện và bảo mật cao
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 stagger-children">
              <div className="glass-effect rounded-md p-4 border border-white/20 hover-lift">
                <Shield className="w-8 h-8 text-blue-400 mx-auto mb-2 animate-pulse" />
                <p className="text-sm text-blue-100">Bảo mật đa lớp</p>
              </div>
              <div className="glass-effect rounded-md p-4 border border-white/20 hover-lift">
                <Grid3X3 className="w-8 h-8 text-purple-400 mx-auto mb-2 animate-heartbeat" />
                <p className="text-sm text-blue-100">Quản lý thông minh</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 via-background to-purple-50 p-4 lg:p-8 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-20 h-20 border border-blue-300 rounded-full animate-float"></div>
          <div className="absolute top-32 right-20 w-16 h-16 border border-purple-300 rounded-full animate-float animation-delay-1000"></div>
          <div className="absolute bottom-20 left-20 w-12 h-12 border border-indigo-300 rounded-full animate-float animation-delay-2000"></div>
        </div>

        <Card variant="glass" className="w-full max-w-md shadow-2xl border-0 backdrop-blur-sm animate-slide-in-right hover-glow">
          <CardHeader className="space-y-4 text-center animate-fade-in">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center shadow-lg hover-scale animate-pulse-glow">
              <Grid3X3 className="w-8 h-8 text-primary-foreground animate-wiggle" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold tracking-tight animate-slide-in-down">
                Đăng nhập
              </CardTitle>
              <CardDescription className="text-muted-foreground animate-fade-in animation-delay-500">
                Truy cập vào hệ thống quản lý HH3D 🎉
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <div className="flex items-center gap-3 p-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive animate-shake hover-lift">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 animate-wiggle" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2 animate-slide-in-up">
                <Label htmlFor="zaloId" className="text-sm font-medium">
                  Zalo ID
                </Label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 transition-colors duration-300 group-hover:text-primary" />
                  <Input
                    id="zaloId"
                    name="zaloId"
                    value={formData.zaloId}
                    onChange={handleInputChange}
                    required
                    placeholder="Nhập Zalo ID của bạn"
                    className="pl-10 hover-scale focus:scale-105"
                    variant="default"
                  />
                </div>
              </div>

              <div className="space-y-2 animate-slide-in-up animation-delay-500">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 z-10 transition-colors duration-300 group-hover:text-primary" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    placeholder="••••••••"
                    className="pl-10 pr-12 hover-scale focus:scale-105"
                    autoComplete="off"
                    variant="default"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowPassword(!showPassword);
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-all duration-300 z-20 p-1 rounded-sm hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 hover-scale"
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 animate-wiggle" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between animate-fade-in animation-delay-1000">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rememberMe"
                    checked={formData.rememberMe}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, rememberMe: checked as boolean }))
                    }
                    className="hover-scale"
                  />
                  <Label
                    htmlFor="rememberMe"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300 cursor-pointer"
                  >
                    Ghi nhớ đăng nhập
                  </Label>
                </div>
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:underline font-medium hover-scale transition-all duration-300"
                >
                  Quên mật khẩu?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full font-semibold bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 animate-glow-border"
                size="lg"
                loading={isSubmitting}
                icon={<Zap className="w-4 h-4" />}
              >
                {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập 🚀"}
              </Button>
            </form>

            {/* Register Link */}
            <div className="text-center pt-4 border-t border-border/50 animate-fade-in animation-delay-1500">
              <p className="text-sm text-muted-foreground">
                Chưa có tài khoản?{" "}
                <Link
                  href="/register"
                  className="text-primary hover:underline font-medium hover-scale transition-all duration-300"
                >
                  Đăng ký ngay
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
