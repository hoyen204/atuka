"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCallback, useState } from "react";

interface ShopItemType {
  id: string;
  itemId: string;
  name: string;
  cost: number;
  currency: string;
  image: string;
  itemType: string;
}

const nomalizeCurrency = (currency: string) => {
  if ("Tinh Thạch".toLowerCase() === currency.toLowerCase())
    return "tinh_thach";
  if ("Tinh Huyết".toLowerCase() === currency.toLowerCase())
    return "tinh_huyet";
  if ("Mảnh Rương Pháp Bảo".toLowerCase() === currency.toLowerCase())
    return "manh_ruong_phap_bao";
  if ("Mảnh Rương Thần Phù".toLowerCase() === currency.toLowerCase())
    return "manh_ruong_than_phu";
  if ("Mảnh Rương Linh Bảo".toLowerCase() === currency.toLowerCase())
    return "manh_ruong_linh_bao";
  return currency;
};

interface UserBalance {
  tinh_thach: number | string;
  tinh_huyet: number | string;
  manh_ruong_phap_bao: number | string;
  manh_ruong_than_phu: number | string;
  manh_ruong_linh_bao: number | string;
}

interface ShopItemProps {
  item: ShopItemType;
  accountId: string | null;
  proxyId: string;
  userBalance: UserBalance;
  onRefresh: () => void;
  toast: any;
  isLoading: boolean;
}

const balanceConfig = [
  { key: "tinh_thach", label: "Tinh thạch" },
  { key: "tinh_huyet", label: "Tinh huyết" },
  { key: "manh_ruong_phap_bao", label: "Mảnh rương pháp bảo" },
  { key: "manh_ruong_than_phu", label: "Mảnh rương thần phù" },
  { key: "manh_ruong_linh_bao", label: "Mảnh rương linh bảo" },
] as const;

const UserBalanceDisplay = ({ userBalance }: { userBalance: UserBalance }) => (
  <div className="flex flex-col gap-2">
    <h3 className="text-sm font-bold text-center">Số dư của bạn</h3>
    {balanceConfig.map(({ key, label }) => (
      <span className="text-sm" key={key}>
        {label}: {Number(userBalance[key]).toLocaleString()}
      </span>
    ))}
  </div>
);

export function ShopItem({
  item,
  accountId,
  proxyId,
  userBalance,
  onRefresh,
  toast,
  isLoading,
}: ShopItemProps) {
  const [quantity, setQuantity] = useState(1);
  const normalizedCurrency = nomalizeCurrency(item.currency) as keyof UserBalance;
  const balanceAmount = userBalance ? Number(userBalance[normalizedCurrency] ?? 0) : 0;
  const maxQuantity = Math.floor(balanceAmount / item.cost) || 0;


  const handleBuy = useCallback(async () => {
    if (!accountId) return;

    try {
      const params = new URLSearchParams({
        accountId,
        proxyId,
        itemId: item.itemId,
        quantity: quantity.toString(),
        itemType: item.itemType,
      });

      const response = await fetch(`/api/hoang-vuc/shop?${params.toString()}`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to buy item");
      }

      if (data.success) {
        toast.toast({
          title: "Mua thành công",
          description: data.data.message,
          variant: "default",
        });
        onRefresh();
      } else {
        toast.toast({
          title: "Lỗi",
          description: data.data || "Lỗi khi mua item",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast.toast({
        title: "Lỗi",
        description:
          error instanceof Error ? error.message : "Failed to buy item",
        variant: "destructive",
      });
    }
  }, [accountId, proxyId, item, quantity, toast, onRefresh]);

  return (
    <Card
      key={item.id}
      className="group flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-105"
    >
      <CardHeader>
        <img 
          src={item.image} 
          alt={item.name} 
          className="w-20 h-20 mx-auto transition-all duration-300 group-hover:rotate-10" 
        />
      </CardHeader>
      <CardContent className="p-4 flex flex-col flex-grow text-center">
        <CardTitle className="text-lg mb-2">
          {item.name}
        </CardTitle>
        <CardDescription>
          <span className="text-lg font-bold">
            {item.cost}
          </span>
          <span className="ml-1">{item.currency}</span>
        </CardDescription>
      </CardContent>
      <CardFooter className="p-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button className="w-full mt-auto">
              <span className="flex items-center gap-2">
                🛒 Mua ngay
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="flex flex-col gap-4 p-4 rounded-lg">
            <UserBalanceDisplay userBalance={userBalance} />
            <div className="flex flex-row gap-2">
              <Input
                type="number"
                value={quantity}
                onChange={(e) => {
                  const newVal = Number(e.target.value);
                  setQuantity(isNaN(newVal) ? 0 : newVal);
                }}
                onBlur={(e) => {
                  let val = Number(e.target.value);
                  if (isNaN(val)) val = 1;
                  setQuantity(Math.min(Math.max(1, val), maxQuantity));
                }}
                min={1}
                max={maxQuantity}
              />
              <Button
                variant="outline"
                onClick={() => setQuantity(maxQuantity)}
                disabled={isLoading}
              >
                Tối đa
              </Button>
            </div>
            <span
              className={
                "text-sm font-medium " +
                (balanceAmount < quantity * item.cost
                  ? "text-red-400"
                  : "text-green-400")
              }
            >
              Cần: {(quantity * item.cost).toLocaleString()} {item.currency}
            </span>
            <Button
              className="w-full mt-auto"
              onClick={handleBuy}
              disabled={
                isLoading ||
                !accountId ||
                balanceAmount < quantity * item.cost ||
                quantity <= 0
              }
            >
              <span className="flex items-center gap-2">
                ✨ Xác nhận mua
              </span>
            </Button>
          </PopoverContent>
        </Popover>
      </CardFooter>
    </Card>
  );
}
