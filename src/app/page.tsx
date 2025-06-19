'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Shield, Gamepad2, Users } from 'lucide-react';
import Image from 'next/image';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading, isMounted } = useAuth();

  useEffect(() => {
    if (isMounted && !isLoading) {
      if (isAuthenticated) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [isAuthenticated, isLoading, isMounted, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10" />
      
      <div className="relative min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <div className="relative">
            <div className="w-48 h-48 mx-auto relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-xl opacity-30 animate-pulse" />
              <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-white/20 shadow-2xl">
                <Image
                  src="/character-hero.jpg"
                  alt="HH3D Character"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <h1 className="text-6xl font-bold text-white tracking-tight">
                HH3D <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Management</span>
              </h1>
              <p className="text-xl text-blue-100 font-medium">
                Hệ thống quản lý tài khoản game chuyên nghiệp
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <Shield className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Bảo mật cao</h3>
                <p className="text-blue-100 text-sm">Hệ thống bảo mật đa lớp</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <Gamepad2 className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Quản lý game</h3>
                <p className="text-blue-100 text-sm">Theo dõi tiến trình game</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <Users className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Đa người dùng</h3>
                <p className="text-blue-100 text-sm">Hỗ trợ nhiều tài khoản</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 mt-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            <p className="text-blue-200 font-medium text-lg">Đang khởi tạo hệ thống...</p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-900 to-transparent" />
    </div>
  );
}
