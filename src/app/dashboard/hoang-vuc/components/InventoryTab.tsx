"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

interface InventoryItem {
  id: string;
  item_name: string;
  item_type: string;
  image: string;
  quantity: number;
  received_time: string;
}

interface Reward {
  type: string;
  name: string;
  amount: number;
  image: string;
}

export function InventoryTab({
  inventoryData,
  isLoading,
  selectedAccount,
  selectedProxy,
  onRefresh,
  toast,
}: {
  inventoryData: any;
  isLoading: boolean;
  selectedAccount: string | null;
  selectedProxy: string;
  onRefresh: () => void;
  toast: any;
}) {
  const [quantity, setQuantity] = useState(1);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [currentRewards, setCurrentRewards] = useState<Reward[]>([]);

  const handleUse = async (item: InventoryItem) => {
    if (!selectedAccount) return;

    try {
      const params = new URLSearchParams({
        accountId: selectedAccount,
        proxyId: selectedProxy,
        itemId: item.id,
        itemType: item.item_type,
        quantity: quantity.toString(),
      });

      const response = await fetch(`/api/hoang-vuc/inventory?${params}`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        toast.toast({
          title: "Thành công",
          description: data.data.message,
          variant: "success",
        });
        if (data.data.rewards && data.data.rewards.length > 0) {
          const rewards = data.data.rewards.sort((a: Reward, b: Reward) => {
            if (a.type < b.type) {
              return -1;
            }
            if (a.type > b.type) {
              return 1;
            }
            return 0;
          });
          setCurrentRewards(rewards);
          setShowRewardModal(true);
        } else {
          onRefresh();
        }
      } else {
        toast.toast({
          title: "Lỗi",
          description: data.message || "Không thể sử dụng vật phẩm.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast.toast({
        title: "Lỗi",
        description: "Không thể sử dụng vật phẩm.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="border rounded-lg p-4 flex flex-col items-center text-center"
            >
              <Skeleton className="w-16 h-16 rounded-full mb-2" />
              <Skeleton className="h-4 w-2/3 mb-2" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-10 w-24 mt-2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!inventoryData?.success) {
    return (
      <div className="p-4 text-center text-red-500">
        Lỗi: {inventoryData?.message || "Failed to fetch inventory"}
      </div>
    );
  }

  const inventory = inventoryData.data || [];

  const getImageFromType = (type: string) => {
    switch (type) {
      case "manh_ruong_linh_bao":
        return "/manh-ruong-linh-bao.webp";
      case "manh_ruong_phap_bao":
        return "/manh-ruong-phap-bao.png";
      case "tinh_huyet":
        return "/tinh-huyet.gif";
      case "chia_linh_bao":
        return "/chia-linh-bao.png";
      case "tuyet_sat_phu":
        return "/tuyet-sat-phu.webp";
      case "tuyet_sat_linh_bao":
        return "/ho-than-phu.webp";
      case "than_luc_phu":
        return "/than-luc-phu.webp";
      case "manh_ruong_than_phu":
        return "/manh-ruong-than-phu.webp";
      case "ruong_than_phu":
        return "/ruong-than-phu.webp";
      default:
        return "/ruong-linh-bao.webp";
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-foreground">Kho đồ</h2>
        <Button onClick={onRefresh} disabled={isLoading}>
          <span className="flex items-center gap-2">
            {isLoading ? "🔄 Đang tải..." : "🔄 Làm mới"}
          </span>
        </Button>
      </div>

      {inventory.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Túi đồ trống
          </h3>
          <p className="text-muted-foreground">
            Không có vật phẩm nào trong kho
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {inventory.map((item: InventoryItem) => (
            <div
              key={item.id}
              className="group border rounded-lg p-4 items-center text-center transition-all duration-300 hover:shadow-lg hover:scale-105"
            >
              <img
                src={getImageFromType(item.item_type)}
                alt={item.item_name}
                className="w-16 h-16 mx-auto mb-2 transition-all duration-300 group-hover:rotate-10"
              />
              <h3 className="font-bold text-foreground">{item.item_name}</h3>
              <p className="text-sm text-muted-foreground">
                Số lượng: <span className="font-bold">{item.quantity}</span>
              </p>
              {(item.item_type.startsWith("ruong") ||
                (!item.item_type.startsWith("manh_ruong") &&
                  item.item_type.endsWith("phu"))) && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button className="mt-3">
                      <span className="flex items-center gap-2">
                        ✨ Sử dụng
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <Label>Số lượng</Label>
                    <Input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                    />
                    <Button
                      className="mt-3 w-full"
                      onClick={() => handleUse(item)}
                    >
                      <span className="flex items-center gap-2">
                        ✨ Sử dụng
                      </span>
                    </Button>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          ))}
        </div>
      )}
      <Dialog
        open={showRewardModal}
        onOpenChange={(isOpen) => {
          setShowRewardModal(isOpen);
          if (!isOpen) {
            onRefresh();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-center">
              <span className="text-2xl">🎉</span> Chúc mừng!{" "}
              <span className="text-2xl">🎉</span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 items-center justify-center">
            {currentRewards.map((item) => (
              <div key={item.type} className="text-center">
                <p className="flex items-center gap-2">
                  {item.image ? (
                    <img
                      src={getImageFromType(item.type)}
                      alt={item.name}
                      className="w-8 h-8 mx-auto"
                    />
                  ) : (
                    "🎁"
                  )}
                  {item.name}: {item.amount}
                </p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
