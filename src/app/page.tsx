'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Shield, Gamepad2, Users, Zap, Star, Sparkles } from 'lucide-react';
import Image from 'next/image';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading, isMounted } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 animate-gradient-shift" />
      
      {/* Floating Background Elements */}
      <div className="absolute top-20 left-20 w-4 h-4 bg-blue-400 rounded-full animate-float opacity-60"></div>
      <div className="absolute top-40 right-32 w-6 h-6 bg-purple-400 rounded-full animate-float animation-delay-1000 opacity-40"></div>
      <div className="absolute bottom-32 left-16 w-3 h-3 bg-indigo-400 rounded-full animate-float animation-delay-2000 opacity-50"></div>
      <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-yellow-400 rounded-full animate-pulse animation-delay-1500 opacity-70"></div>
      <div className="absolute bottom-1/4 right-1/3 w-5 h-5 bg-pink-400 rounded-full animate-float animation-delay-3000 opacity-30"></div>
      
      <div className="relative min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-8 max-w-4xl mx-auto animate-fade-in">
          <div className="relative animate-bounce-in">
            <div className="w-48 h-48 mx-auto relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-xl opacity-30 animate-pulse-glow" />
              <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-white/20 shadow-2xl hover-glow group">
                <Image
                  src="/character-hero.jpg"
                  alt="HH3D Character"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
              {/* Sparkle Effects */}
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-wiggle">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center animate-heartbeat">
                <Star className="w-3 h-3 text-white" />
              </div>
            </div>
          </div>

          <div className="space-y-6 animate-slide-in-up animation-delay-500">
            <div className="space-y-3">
              <h1 className="text-6xl font-bold text-white tracking-tight animate-typewriter">
                HH3D <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 animate-gradient-shift">Management</span>
              </h1>
              <p className="text-xl text-blue-100 font-medium animate-slide-in-up animation-delay-1000">
                Hệ thống quản lý tài khoản game chuyên nghiệp
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 stagger-children">
              <div className="glass-effect rounded-md p-6 border border-white/20 hover-lift group">
                <Shield className="w-12 h-12 text-blue-400 mx-auto mb-4 animate-pulse group-hover:animate-wiggle" />
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors duration-300">Bảo mật cao</h3>
                <p className="text-blue-100 text-sm">Hệ thống bảo mật đa lớp</p>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
              
              <div className="glass-effect rounded-md p-6 border border-white/20 hover-lift group animation-delay-500">
                <Gamepad2 className="w-12 h-12 text-purple-400 mx-auto mb-4 animate-float group-hover:animate-bounce" />
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-300 transition-colors duration-300">Quản lý game</h3>
                <p className="text-blue-100 text-sm">Theo dõi tiến trình game</p>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
              
              <div className="glass-effect rounded-md p-6 border border-white/20 hover-lift group animation-delay-1000">
                <Users className="w-12 h-12 text-green-400 mx-auto mb-4 animate-heartbeat group-hover:animate-wiggle" />
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-green-300 transition-colors duration-300">Đa người dùng</h3>
                <p className="text-blue-100 text-sm">Hỗ trợ nhiều tài khoản</p>
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-transparent rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 mt-8 animate-fade-in animation-delay-2000">
            <div className="relative">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
              <div className="absolute inset-0 h-8 w-8 border-2 border-blue-400/30 rounded-full animate-pulse"></div>
            </div>
            <p className="text-blue-200 font-medium text-lg animate-typewriter">Đang khởi tạo hệ thống...</p>
          </div>

          {/* Loading Progress Bar */}
          <div className="w-64 mx-auto bg-white/10 rounded-full h-2 animate-fade-in animation-delay-2500">
            <div className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full animate-loading-bar" style={{
              animation: 'loading-progress 3s ease-in-out infinite'
            }}></div>
          </div>
        </div>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-900 to-transparent" />
      
      {/* Additional Styles */}
      <style jsx>{`
        @keyframes loading-progress {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
        
        @keyframes loading-bar {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
