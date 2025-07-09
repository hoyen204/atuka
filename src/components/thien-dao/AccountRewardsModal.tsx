"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RewardCard } from "./RewardCard";
import { 
  RefreshCw, 
  Download, 
  User, 
  Gift,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AccountStatus {
  accountId: number;
  accountName: string;
  success: boolean;
  error?: string;
  totalRewards: number;
  claimableRewards: number;
  claimedRewards: number;
  rewards: Array<{
    id: string;
    title: string;
    description: string;
    claimed: boolean;
    canClaim: boolean;
    type?: string;
  }>;
}

interface AccountRewardsModalProps {
  account: AccountStatus | null;
  isOpen: boolean;
  onClose: () => void;
  onClaimSingle: (accountId: number, rewardId: string) => Promise<void>;
  onClaimAll: (accountId: number) => Promise<void>;
  onRefresh: (accountId: number) => Promise<void>;
  isLoading?: boolean;
}

export function AccountRewardsModal({
  account,
  isOpen,
  onClose,
  onClaimSingle,
  onClaimAll,
  onRefresh,
  isLoading = false
}: AccountRewardsModalProps) {
  const [processingRewards, setProcessingRewards] = useState<Set<string>>(new Set());

  if (!account) return null;

  const handleClaimSingle = async (rewardId: string) => {
    setProcessingRewards(prev => new Set(prev).add(rewardId));
    try {
      await onClaimSingle(account.accountId, rewardId);
    } finally {
      setProcessingRewards(prev => {
        const newSet = new Set(prev);
        newSet.delete(rewardId);
        return newSet;
      });
    }
  };

  const handleClaimAll = async () => {
    await onClaimAll(account.accountId);
  };

  const handleRefresh = async () => {
    await onRefresh(account.accountId);
  };

  const claimableRewards = account.rewards.filter(r => r.canClaim && !r.claimed);
  const claimedRewards = account.rewards.filter(r => r.claimed);
  const pendingRewards = account.rewards.filter(r => !r.canClaim && !r.claimed);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <User className="w-6 h-6 text-blue-500" />
                {account.accountName}
              </DialogTitle>
              <DialogDescription>
                ID: {account.accountId} • Chi tiết phần thưởng thiên đạo ban thưởng
              </DialogDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefresh}
                      disabled={isLoading}
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Làm mới dữ liệu</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {claimableRewards.length > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        onClick={handleClaimAll}
                        disabled={isLoading}
                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Nhận tất cả ({claimableRewards.length})
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Nhận tất cả phần thưởng có thể</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Account Status Card */}
          <Card className={`border-2 ${account.success ? 'border-green-200 bg-green-50/30' : 'border-red-200 bg-red-50/30'}`}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                {account.success ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
                Trạng thái tài khoản
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{account.totalRewards}</div>
                  <div className="text-sm text-gray-600">Tổng phần thưởng</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{account.claimableRewards}</div>
                  <div className="text-sm text-gray-600">Có thể nhận</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{account.claimedRewards}</div>
                  <div className="text-sm text-gray-600">Đã nhận</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{pendingRewards.length}</div>
                  <div className="text-sm text-gray-600">Chưa thể nhận</div>
                </div>
              </div>

              {!account.success && account.error && (
                <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="w-4 h-4" />
                    <span className="font-medium">Lỗi:</span>
                  </div>
                  <p className="text-red-600 text-sm mt-1">{account.error}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Claimable Rewards */}
          {claimableRewards.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Gift className="w-5 h-5 text-green-500" />
                <h3 className="text-lg font-semibold">Phần thưởng có thể nhận ({claimableRewards.length})</h3>
                <Badge variant="default" className="bg-green-500">
                  Có thể claim
                </Badge>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {claimableRewards.map(reward => (
                  <RewardCard
                    key={reward.id}
                    reward={reward}
                    onClaim={handleClaimSingle}
                    isLoading={processingRewards.has(reward.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Claimed Rewards */}
          {claimedRewards.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-semibold">Phần thưởng đã nhận ({claimedRewards.length})</h3>
                <Badge variant="secondary">
                  Đã hoàn thành
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {claimedRewards.map(reward => (
                  <RewardCard
                    key={reward.id}
                    reward={reward}
                    onClaim={handleClaimSingle}
                    isLoading={false}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Pending Rewards */}
          {pendingRewards.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-gray-500" />
                <h3 className="text-lg font-semibold">Phần thưởng chưa thể nhận ({pendingRewards.length})</h3>
                <Badge variant="outline">
                  Chờ điều kiện
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingRewards.map(reward => (
                  <RewardCard
                    key={reward.id}
                    reward={reward}
                    onClaim={handleClaimSingle}
                    isLoading={false}
                  />
                ))}
              </div>
            </div>
          )}

          {account.rewards.length === 0 && (
            <div className="text-center py-12">
              <Gift className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                Không có phần thưởng
              </h3>
              <p className="text-gray-500">
                Tài khoản này chưa có phần thưởng nào từ thiên đạo ban thưởng
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 