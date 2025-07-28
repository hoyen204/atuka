"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { shopItems } from "./items";
import { ShopItem } from "./ShopItem";

export function ShopTab({
  isLoading,
  selectedAccount,
  selectedProxy,
  userBalance,
  onRefresh,
  toast,
}: {
  isLoading: boolean;
  selectedAccount: string | null;
  selectedProxy: string;
  userBalance: any;
  onRefresh: () => void;
  toast: any;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="flex flex-col space-y-3">
            <Skeleton className="h-[125px] w-full rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {shopItems.map((item) => (
        <ShopItem
          key={item.id}
          item={item}
          accountId={selectedAccount}
          proxyId={selectedProxy}
          userBalance={userBalance}
          onRefresh={onRefresh}
          toast={toast}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
}
