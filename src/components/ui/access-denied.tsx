import { ShieldX, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface AccessDeniedProps {
  title?: string;
  message?: string;
  onGoBack?: () => void;
  backButtonText?: string;
}

export function AccessDenied({
  title = "Truy cập bị từ chối",
  message = "Bạn không có quyền truy cập vào trang này. Chỉ admin mới có thể truy cập tính năng này.",
  onGoBack,
  backButtonText = "Quay lại"
}: AccessDeniedProps) {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
      <Card className="max-w-md w-full border-0 shadow-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
        <CardContent className="p-8 text-center space-y-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-pink-500 rounded-full blur-lg opacity-30 animate-pulse"></div>
            <div className="relative w-20 h-20 mx-auto bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
              <ShieldX className="w-10 h-10 text-white" />
            </div>
          </div>
          
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              {message}
            </p>
          </div>
          
          {onGoBack && (
            <Button 
              onClick={onGoBack} 
              className="gap-2 w-full hover:gap-3 transition-all duration-200"
              size="lg"
            >
              <ArrowLeft className="w-4 h-4" />
              {backButtonText}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 