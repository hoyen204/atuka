"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Gift, 
  CheckCircle, 
  Clock, 
  Star, 
  Gem, 
  Coins,
  Heart,
  Crown,
  Zap,
  Trophy
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RewardCardProps {
  reward: {
    id: string;
    title: string;
    description: string;
    claimed: boolean;
    canClaim: boolean;
    type?: string;
  };
  onClaim: (rewardId: string) => void;
  isLoading?: boolean;
}

const getRewardIcon = (title: string, description: string, type?: string) => {
  // Anniversary rewards get special treatment
  if (type === 'anniversary' || title.includes('Kỷ Niệm')) {
    return <Trophy className="w-5 h-5 text-yellow-600" />;
  }
  
  // Guild rewards get special treatment
  if (type === 'guild' || title.includes('Tông Môn')) {
    return <Crown className="w-5 h-5 text-red-600" />;
  }
  
  const text = (title + " " + description).toLowerCase();
  
  if (text.includes('tu vi') || text.includes('tu-vi')) {
    return <Zap className="w-5 h-5 text-yellow-500" />;
  }
  if (text.includes('tinh thach') || text.includes('tinh-thach')) {
    return <Gem className="w-5 h-5 text-blue-500" />;
  }
  if (text.includes('tinh huyet') || text.includes('tinh-huyet')) {
    return <Heart className="w-5 h-5 text-red-500" />;
  }
  if (text.includes('xu khoa') || text.includes('xu-khoa')) {
    return <Coins className="w-5 h-5 text-orange-500" />;
  }
  if (text.includes('tam sinh thach') || text.includes('tam-sinh-thach')) {
    return <Star className="w-5 h-5 text-purple-500" />;
  }
  if (text.includes('khung avatar') || text.includes('avatar')) {
    return <Crown className="w-5 h-5 text-indigo-500" />;
  }
  if (text.includes('danh hieu') || text.includes('danh-hieu')) {
    return <Trophy className="w-5 h-5 text-green-500" />;
  }
  
  return <Gift className="w-5 h-5 text-gray-500" />;
};

const getRewardTypeFromText = (title: string, description: string, type?: string) => {
  if (type === 'anniversary' || title.includes('Kỷ Niệm')) {
    return 'Kỷ Niệm';
  }
  
  if (type === 'guild' || title.includes('Tông Môn')) {
    return 'Tông Môn';
  }
  
  const text = (title + " " + description).toLowerCase();
  
  if (text.includes('tu vi')) return 'Tu Vi';
  if (text.includes('tinh thach')) return 'Tinh Thạch';
  if (text.includes('tinh huyet')) return 'Tinh Huyết';
  if (text.includes('xu khoa')) return 'Xu Khóa';
  if (text.includes('tam sinh thach')) return 'Tam Sinh Thạch';
  if (text.includes('khung avatar')) return 'Khung Avatar';
  if (text.includes('danh hieu')) return 'Danh Hiệu';
  if (text.includes('song hanh chi lu')) return 'Song Hành Chi Lữ';
  
  return 'Phần Thưởng';
};

const extractAmountFromText = (text: string) => {
  const match = text.match(/(\d+[\d,]*)/);
  return match ? match[1] : null;
};

export function RewardCard({ reward, onClaim, isLoading = false }: RewardCardProps) {
  const rewardType = getRewardTypeFromText(reward.title, reward.description, reward.type);
  const amount = extractAmountFromText(reward.title + " " + reward.description);
  const icon = getRewardIcon(reward.title, reward.description, reward.type);

  return (
    <Card className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg border-2 ${
      reward.type === 'anniversary'
        ? (reward.claimed 
            ? 'border-yellow-300 bg-yellow-50/50' 
            : reward.canClaim 
              ? 'border-yellow-400 bg-yellow-100/50 hover:border-yellow-500' 
              : 'border-yellow-200 bg-yellow-50/30')
        : reward.type === 'guild'
          ? (reward.claimed 
              ? 'border-red-300 bg-red-50/50' 
              : reward.canClaim 
                ? 'border-red-400 bg-red-100/50 hover:border-red-500' 
                : 'border-red-200 bg-red-50/30')
          : (reward.claimed 
              ? 'border-green-200 bg-green-50/50' 
              : reward.canClaim 
                ? 'border-blue-200 bg-blue-50/50 hover:border-blue-300' 
                : 'border-gray-200 bg-gray-50/50')
    }`}>
      {/* Background Gradient */}
      <div className={`absolute inset-0 opacity-10 ${
        reward.type === 'anniversary'
          ? (reward.claimed 
              ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' 
              : reward.canClaim 
                ? 'bg-gradient-to-br from-yellow-400 to-orange-500' 
                : 'bg-gradient-to-br from-yellow-300 to-yellow-500')
          : reward.type === 'guild'
            ? (reward.claimed 
                ? 'bg-gradient-to-br from-red-400 to-red-600' 
                : reward.canClaim 
                  ? 'bg-gradient-to-br from-red-400 to-pink-500' 
                  : 'bg-gradient-to-br from-red-300 to-red-500')
            : (reward.claimed 
                ? 'bg-gradient-to-br from-green-400 to-green-600' 
                : reward.canClaim 
                  ? 'bg-gradient-to-br from-blue-400 to-purple-600' 
                  : 'bg-gradient-to-br from-gray-400 to-gray-600')
      }`} />
      
      <CardHeader className="relative pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              reward.type === 'anniversary'
                ? (reward.claimed 
                    ? 'bg-yellow-200' 
                    : reward.canClaim 
                      ? 'bg-yellow-100' 
                      : 'bg-yellow-50')
                : reward.type === 'guild'
                  ? (reward.claimed 
                      ? 'bg-red-200' 
                      : reward.canClaim 
                        ? 'bg-red-100' 
                        : 'bg-red-50')
                  : (reward.claimed 
                      ? 'bg-green-100' 
                      : reward.canClaim 
                        ? 'bg-blue-100' 
                        : 'bg-gray-100')
            }`}>
              {icon}
            </div>
            <div className="flex-1">
              <CardTitle className="text-base leading-tight">
                {reward.title || rewardType}
              </CardTitle>
              {amount && (
                <div className="flex items-center gap-1 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {amount}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {rewardType}
                  </Badge>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            {reward.claimed && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Đã nhận</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            {!reward.claimed && !reward.canClaim && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Clock className="w-5 h-5 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Chưa thể nhận</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative pt-0">
        {reward.description && reward.description !== reward.title && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {reward.description}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge 
              variant={reward.claimed ? "default" : reward.canClaim ? "default" : "secondary"}
              className={`text-xs ${
                reward.type === 'anniversary'
                  ? (reward.claimed 
                      ? 'bg-yellow-500' 
                      : reward.canClaim 
                        ? 'bg-yellow-600' 
                        : 'bg-yellow-400')
                  : reward.type === 'guild'
                    ? (reward.claimed 
                        ? 'bg-red-500' 
                        : reward.canClaim 
                          ? 'bg-red-600' 
                          : 'bg-red-400')
                    : (reward.claimed 
                        ? 'bg-green-500' 
                        : reward.canClaim 
                          ? 'bg-blue-500' 
                          : 'bg-gray-400')
              }`}
            >
              {reward.claimed ? 'Đã nhận' : reward.canClaim ? 'Có thể nhận' : 'Chưa thể nhận'}
            </Badge>
          </div>
          
          {reward.canClaim && !reward.claimed && (
            <Button
              size="sm"
              onClick={() => onClaim(reward.id)}
              disabled={isLoading}
              className={`text-white border-0 ${
                reward.type === 'anniversary'
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600'
                  : reward.type === 'guild'
                    ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600'
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                  Nhận...
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <Gift className="w-3 h-3" />
                  Nhận
                </div>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 