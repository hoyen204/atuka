'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, MessageCircle, Clock, Wrench } from 'lucide-react';

export default function MaintenancePage() {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleZaloContact = () => {
    window.open("https://zalo.me/0945277748", "_blank");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-2xl mx-auto space-y-8">
          
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center animate-pulse">
                    <Settings className="w-12 h-12 text-white animate-spin" style={{ animationDuration: '3s' }} />
                  </div>
                  <div className="absolute -top-2 -right-2">
                    <Wrench className="w-8 h-8 text-orange-500 animate-bounce" />
                  </div>
                </div>
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Đang Bảo Trì
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 font-medium">
              Hệ thống tạm thời ngưng hoạt động
            </p>
          </div>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-2xl">
            <CardContent className="p-8 space-y-6">
              
              <div className="flex items-center justify-center gap-3 mb-6">
                <Badge variant="secondary" className="px-4 py-2 text-sm">
                  <Clock className="w-4 h-4 mr-2" />
                  Bảo trì vô thời hạn
                </Badge>
              </div>

              <div className="space-y-4 text-center">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                  Chúng tôi đang nâng cấp hệ thống
                </h2>
                
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Hệ thống hiện đang chống gián từ <b>Thái Cổ Yêu Tộc</b> và đồng bọn. 
                  Chúng tôi xin lỗi vì sự bất tiện này và sẽ thông báo ngay khi hoàn tất.
                </p>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md p-4 border border-blue-200 dark:border-blue-800">
                  <p className="text-blue-800 dark:text-blue-200 text-sm">
                    💡 <strong>Gợi ý:</strong> Bạn có thể tìm câu trả lời nhanh chóng thông qua bot zalo của chúng tôi.
                  </p>
                </div>
              </div>

              <div className="border-t pt-6">
                <div className="text-center space-y-4">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                    Cần hỗ trợ ngay?
                  </h3>
                  
                  <Button 
                    onClick={handleZaloContact}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Chat Zalo với Admin
                  </Button>
                  
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Nhấn để mở chat Zalo trực tiếp
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>Thời gian hiện tại:</span>
                  <span className="font-mono bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded">
                    {currentTime}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © 2024 Atuka System. Cảm ơn bạn đã kiên nhẫn chờ đợi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 