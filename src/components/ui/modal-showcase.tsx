'use client';

import { useState } from 'react';
import { Button } from './button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from './dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Badge } from './badge';

type AnimationType = "scale" | "slide" | "zoom" | "flip" | "bounce";

interface ModalDemo {
  type: AnimationType;
  title: string;
  description: string;
  badge: string;
  badgeVariant: any;
}

const modalDemos: ModalDemo[] = [
  {
    type: "scale",
    title: "Scale Animation",
    description: "Modal mở ra với hiệu ứng scale và độ mờ mượt mà",
    badge: "Mặc định",
    badgeVariant: "default"
  },
  {
    type: "slide", 
    title: "Slide Animation",
    description: "Modal trượt từ dưới lên với hiệu ứng mờ",
    badge: "Smooth",
    badgeVariant: "info"
  },
  {
    type: "zoom",
    title: "Zoom Animation", 
    description: "Modal phóng to với hiệu ứng xoay nhẹ",
    badge: "Dynamic",
    badgeVariant: "success"
  },
  {
    type: "flip",
    title: "Flip Animation",
    description: "Modal xoay 3D kịch tính từ trái sang phải",
    badge: "Spectacular",
    badgeVariant: "gradient"
  },
  {
    type: "bounce",
    title: "Bounce Animation",
    description: "Modal bật lên với hiệu ứng nảy đàn hồi",
    badge: "Playful",
    badgeVariant: "warning"
  }
];

export function ModalShowcase() {
  const [openModal, setOpenModal] = useState<AnimationType | null>(null);

  const currentDemo = modalDemos.find(demo => demo.type === openModal);

  return (
    <div className="p-6 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          🎭 Modal Animation Showcase
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Khám phá các hiệu ứng modal đẹp mắt với animations mượt mà
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modalDemos.map((demo) => (
          <Card key={demo.type} className="group hover-lift cursor-pointer transition-all duration-300">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{demo.title}</CardTitle>
                <Badge variant={demo.badgeVariant} className="animate-pulse-glow">
                  {demo.badge}
                </Badge>
              </div>
              <CardDescription className="text-sm leading-relaxed">
                {demo.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={openModal === demo.type} onOpenChange={(open) => setOpenModal(open ? demo.type : null)}>
                <DialogTrigger asChild>
                  <Button 
                    className="w-full hover:scale-105 transition-transform duration-200"
                    variant="outline"
                  >
                    🎪 Xem Demo
                  </Button>
                </DialogTrigger>
                <DialogContent animation={demo.type} className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      ✨ {demo.title}
                    </DialogTitle>
                    <DialogDescription>
                      Đây là demo hiệu ứng <strong>{demo.type}</strong> cho modal.
                      Hiệu ứng này tạo ra trải nghiệm người dùng mượt mà và hấp dẫn.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="py-4 space-y-4">
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-xl border border-blue-200/50 dark:border-blue-800/50">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                        🎨 Đặc điểm hiệu ứng
                      </h4>
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        {demo.description}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <div className="text-lg font-bold text-green-600">0.4s</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Thời gian mở</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <div className="text-lg font-bold text-purple-600">0.25s</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Thời gian đóng</div>
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpenModal(null)}>
                      Đóng
                    </Button>
                    <Button onClick={() => setOpenModal(null)}>
                      👍 Tuyệt vời!
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 p-6 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/30 dark:via-purple-950/30 dark:to-pink-950/30 rounded-2xl border border-indigo-200/50 dark:border-indigo-800/50">
        <h3 className="text-xl font-bold text-indigo-900 dark:text-indigo-100 mb-3 flex items-center gap-2">
          💡 Hướng dẫn sử dụng
        </h3>
        <div className="space-y-2 text-sm text-indigo-800 dark:text-indigo-200">
          <p>• <strong>Default (Scale):</strong> Phù hợp cho modal thông báo và form đơn giản</p>
          <p>• <strong>Slide:</strong> Tốt cho mobile và modal từ dưới lên</p>
          <p>• <strong>Zoom:</strong> Tạo sự chú ý cho modal quan trọng</p>
          <p>• <strong>Flip:</strong> Hiệu ứng ấn tượng cho showcase và gallery</p>
          <p>• <strong>Bounce:</strong> Thêm tính vui tươi cho modal interactive</p>
        </div>
      </div>
    </div>
  );
} 