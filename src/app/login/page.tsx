"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
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
  const [formData, setFormData] = useState({
    zaloId: "",
    password: "",
    rememberMe: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

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
    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  if (!mounted || (isMounted && isAuthenticated)) {
    return null;
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20" />
        
        <div className="relative flex flex-col justify-center items-center p-12 text-white">
          <div className="max-w-md text-center space-y-8">
            <div className="relative">
              <div className="w-64 h-64 mx-auto relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-2xl opacity-40 animate-pulse" />
                <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-white/30 shadow-2xl">
                  <Image
                    src="/character-portrait.jpg"
                    alt="HH3D Character"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl font-bold">
                Chào mừng đến với <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                  HH3D Management
                </span>
              </h1>
              <p className="text-blue-100 text-lg leading-relaxed">
                Hệ thống quản lý tài khoản game hiện đại với giao diện thân thiện và bảo mật cao
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <Shield className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <p className="text-sm text-blue-100">Bảo mật đa lớp</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <Grid3X3 className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <p className="text-sm text-blue-100">Quản lý thông minh</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 via-background to-purple-50 p-4 lg:p-8">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-4 text-center">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center shadow-lg">
              <Grid3X3 className="w-8 h-8 text-primary-foreground" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold tracking-tight">
                Đăng nhập
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Truy cập vào hệ thống quản lý HH3D 🎉
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
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
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
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
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rememberMe"
                    checked={formData.rememberMe}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, rememberMe: checked as boolean }))
                    }
                  />
                  <Label
                    htmlFor="rememberMe"
                    className="text-sm text-muted-foreground"
                  >
                    Ghi nhớ đăng nhập
                  </Label>
                </div>
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:underline font-medium"
                >
                  Quên mật khẩu?
                </Link>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full font-semibold bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Đang đăng nhập...
                  </>
                ) : (
                  "Đăng nhập 🚀"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
