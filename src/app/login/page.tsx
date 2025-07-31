"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useGlobalLoading } from "@/hooks/useGlobalLoading";
import { Eye, EyeOff, User, Lock, Grid3X3, AlertTriangle, Shield } from "lucide-react";
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
        setError(result.message || "Đăng nhập thất bại. Vui lòng thử lại.");
      }
    } catch (err) {
      setError("Đăng nhập thất bại. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
      hideLoading();
    }
  };

  if (!mounted || (isMounted && isAuthenticated)) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Hero - Hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900">
        <div className="relative flex flex-col justify-center items-center p-12 text-white">
          <div className="max-w-md text-center space-y-8">
            <div className="w-48 h-48 mx-auto relative">
              <div className="w-full h-full rounded-full overflow-hidden border-4 border-white/20 bg-white/10">
                <Image
                  src="/character-portrait.jpg"
                  alt="HH3D Character"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl font-bold">
                Chào mừng đến với <br />
                <span className="text-blue-300">
                  HH3D Management
                </span>
              </h1>
              <p className="text-blue-100 text-lg">
                Hệ thống quản lý tài khoản game hiện đại với giao diện thân thiện và bảo mật cao
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-md p-4 border border-white/20 bg-white/10">
                <Shield className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <p className="text-sm text-blue-100">Bảo mật đa lớp</p>
              </div>
              <div className="rounded-md p-4 border border-white/20 bg-white/10">
                <Grid3X3 className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <p className="text-sm text-blue-100">Quản lý thông minh</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Login Form - Full width on mobile */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
        <Card className="w-full max-w-md shadow-lg border">
          <CardHeader className="space-y-4 text-center">
            <div className="w-16 h-16 mx-auto bg-primary rounded-full flex items-center justify-center">
              <Grid3X3 className="w-8 h-8 text-primary-foreground" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold">
                Đăng nhập
              </CardTitle>
              <CardDescription>
                Truy cập vào hệ thống quản lý HH3D
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <div className="flex items-center gap-3 p-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="zaloId" className="text-sm font-medium">
                  Zalo ID
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted w-4 h-4" />
                  <Input
                    id="zaloId"
                    name="zaloId"
                    value={formData.zaloId}
                    onChange={handleInputChange}
                    required
                    placeholder="Nhập Zalo ID của bạn"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted w-4 h-4" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowPassword(!showPassword);
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted hover:text-primary"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <Checkbox
                    id="rememberMe"
                    checked={formData.rememberMe}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, rememberMe: checked as boolean }))
                    }
                  />
                  <Label
                    htmlFor="rememberMe"
                    className="text-muted"
                  >
                    Ghi nhớ đăng nhập
                  </Label>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-primary hover:underline font-medium"
                >
                  Quên mật khẩu?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full font-semibold"
                size="lg"
                loading={isSubmitting}
              >
                {isSubmitting ? "Đang xử lý..." : "Đăng nhập"}
              </Button>
            </form>

            {/* Register Link */}
            <div className="text-center pt-4 border-t">
              <p className="text-sm text-muted">
                Chưa có tài khoản?{" "}
                <Link
                  href="/register"
                  className="text-primary hover:underline font-medium"
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
