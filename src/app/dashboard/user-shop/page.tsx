"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/useToast";
import { useApiClient } from "@/lib/api.utils";
import {
  BonMenhItem,
  DanDuocItem,
  DongHanhItem,
  NangCapItem,
  PhapBaoItem,
  UserShopExtractedData,
} from "@/types/shop/user-shop";
import { ArrowUpCircle, Dna, Gem, Heart, Loader2, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Account {
  id: string;
  name: string;
}
interface Proxy {
  id: number;
  host: string;
  port: number;
  username?: string;
  name?: string;
}

const ItemCard = ({
  item,
  onAction,
}: {
  item: PhapBaoItem | DongHanhItem | BonMenhItem | DanDuocItem | NangCapItem;
  onAction: (
    item: PhapBaoItem | DongHanhItem | BonMenhItem | DanDuocItem | NangCapItem
  ) => void;
}) => {
  const buttonText =
    item.actionType === "buy"
      ? "Mua Ngay"
      : item.actionType === "sell"
      ? "Bán"
      : "Không khả dụng";
  const isActionable = item.isEligible && item.actionType;

  return (
    <Card className="flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-primary/50">
      <CardContent className="p-4 flex flex-col flex-grow">
        <CardTitle className="text-lg mb-2 flex-grow">{item.name}</CardTitle>
        {item.category === "danduoc" && (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Tu vi sử dụng: {item.tuViRange}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Có thể sử dụng: {item.usedCount}/{item.usageLimit}
            </p>
          </>
        )}
        <div className="flex items-center text-lg font-bold text-primary mb-4">
          <Gem className="w-4 h-4 mr-2" /> {item.price.toLocaleString()}
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button disabled={!isActionable}>{buttonText}</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Xác nhận {item.actionType === "buy" ? "mua" : "bán"}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc muốn {item.actionType === "buy" ? "mua" : "bán"}{" "}
                {item.name} với giá {item.price} không?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction onClick={() => onAction(item)}>
                Xác nhận
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

export default function UserShopPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [selectedProxy, setSelectedProxy] = useState<string>("random");
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [shopData, setShopData] = useState<UserShopExtractedData | null>(null);
  const [ajaxShop, setAjaxShop] = useState<any>(null);
  const api = useApiClient();
  const toast = useToast();

  async function loadShop() {
    try {
      const params = new URLSearchParams({
        accountId: selectedAccount || "",
        proxyId: selectedProxy,
      });
      const data = await api.get<{
        shopData: UserShopExtractedData;
        ajaxShop: any;
      }>(`/api/user-shop?${params}`, { showLoading: false });
      setShopData(data.shopData);
      setAjaxShop(data.ajaxShop);
    } catch (error: any) {
      toast.toast({
        title: "Lỗi",
        description: error.message || "Không thể tải dữ liệu shop.",
        variant: "destructive",
      });
    } finally {
      setIsDataLoading(false);
      setIsLoading(false);
    }
  }

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setIsDataLoading(true);
      try {
        const [accRes, proxyRes] = await Promise.all([
          api.get<{ accounts: Account[] }>("/api/accounts?pageSize=1000", { showLoading: false }),
          api.get<{ proxies: Proxy[] }>("/api/proxies?limit=1000", { showLoading: false }),
        ]);
        setAccounts(accRes.accounts);
        setProxies(proxyRes.proxies);
        // Auto-select first account if available
        if (!selectedAccount && accRes.accounts.length > 0) {
          setSelectedAccount(accRes.accounts[0].id);
        }
      } catch (error) {
        toast.toast({
          title: "Lỗi",
          description: "Không thể tải danh sách tài khoản hoặc proxy.",
          variant: "destructive",
        });
        console.error("Fetch error:", error);
      } finally {
        setIsDataLoading(false);
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (!selectedAccount) return;
    setIsLoading(true);
    setIsDataLoading(true);
    setShopData(null);
    loadShop();
  }, [selectedAccount, selectedProxy]);

  const handleItemAction = async (
    item: PhapBaoItem | DongHanhItem | BonMenhItem | DanDuocItem | NangCapItem
  ) => {
    if (!item.actionType || !ajaxShop) return;
    setIsLoading(true);
    try {
      const response = await api.post(
        `/api/user-shop?accountId=${selectedAccount}&proxyId=${selectedProxy}`,
        {
          action: item.actionType,
          itemId: item.id,
          category: item.category,
          nonce: ajaxShop.nonce,
          ajaxUrl: ajaxShop.ajaxurl,
        },
        { showLoading: false }
      );

      if (response.success) {
        toast.toast({
          title: "Thành công",
          description: response.data.message,
        });
      } else {
        toast.toast({
          title: "Lỗi",
          description: response.data.message,
          variant: "destructive",
        });
      }
      loadShop();
    } catch (error: any) {
      toast.toast({
        title: "Lỗi",
        description: error.data.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuyAll = async (items: DanDuocItem[]) => {
    if (!confirm("Xác nhận mua tất cả đan dược khả dụng?")) return;
    setIsLoading(true);
    try {
      for (const item of items.filter(
        (i) =>
          i.actionType === "buy" &&
          i.isEligible &&
          !i.name.includes("Đột Phá Đan")
      )) {
        for (let i = 0; i < (item.usedCount || 0); i++) {
          const response = await api.post(
            `/api/user-shop?accountId=${selectedAccount}&proxyId=${selectedProxy}`,
            {
              action: item.actionType,
              itemId: item.id,
              category: item.category,
              nonce: ajaxShop.nonce,
              ajaxUrl: ajaxShop.ajaxurl,
            },
            { showLoading: false }
          );
          if (response.success) {
            toast.toast({
              title: "Thành công",
              description: response.data.message,
            });
          } else {
            toast.toast({
              title: "Lỗi",
              description: response.data.message,
              variant: "destructive",
            });
            return;
          }
        }
      }
      loadShop();
    } catch (error: any) {
      toast.toast({
        title: "Lỗi",
        description: error.message || "Không thể mua tất cả.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuyAllAllAccounts = async () => {
    if (!confirm("Xác nhận mua tất cả đan dược cho TẤT CẢ tài khoản?")) return;
    const results = [];
    setIsLoading(true);
    for (const acc of accounts) {
      
      try {
        const params = new URLSearchParams({
          accountId: acc.id,
          proxyId: "random",
        });
        const data = await api.get<{
          shopData: UserShopExtractedData;
          ajaxShop: any;
        }>(`/api/user-shop?${params}`, { showLoading: false });
        const items = data.shopData.danDuocItems.filter(
          (i) => i.actionType === "buy" && i.isEligible
        );
        for (const item of items) {
          await api.post(`/api/user-shop?accountId=${acc.id}&proxyId=random`, {
            action: item.actionType,
            itemId: item.id,
            category: item.category,
            nonce: data.ajaxShop.nonce,
            ajaxUrl: data.ajaxShop.ajaxurl,
          }, { showLoading: false });
        }
        results.push({ account: acc.name, success: true });
      } catch (err: any) {
        results.push({ account: acc.name, success: false, error: err.message });
      }
    }
    results.forEach((r) =>
      toast.toast({
        title: r.success ? "Thành công" : "Lỗi",
        description: `${r.account}: ${r.success ? "Đã mua tất cả" : r.error}`,
        variant: r.success ? "default" : "destructive",
      })
    );
    if (selectedAccount) loadShop();
    setIsLoading(false);
  };

  const renderItems = (
    items: (
      | PhapBaoItem
      | DongHanhItem
      | BonMenhItem
      | DanDuocItem
      | NangCapItem
    )[],
    category: string
  ) => {
    if (!items || items.length === 0) {
      return (
        <p className="text-center text-muted-foreground mt-8">
          Không có vật phẩm nào trong danh mục {category}.
        </p>
      );
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {items.map((item) => (
          <ItemCard
            key={item.id || item.name}
            item={item}
            onAction={handleItemAction}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row gap-4 items-end justify-end mb-4">
        <div className="w-1/6">
          <Button onClick={handleBuyAllAllAccounts} className="w-full" disabled={isLoading}>
            Mua Đan Dược Cho Tất Cả
          </Button>
        </div>
        <div className="w-1/6">
          <Select
            onValueChange={setSelectedAccount}
            value={selectedAccount || undefined}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn tài khoản" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((acc) => (
                <SelectItem key={acc.id} value={acc.id}>
                  {acc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-1/6">
          <Select onValueChange={setSelectedProxy} value={selectedProxy}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn proxy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="random">Ngẫu nhiên</SelectItem>
              {proxies.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.name || `${p.host}:${p.port}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="relative min-h-[300px]">
        {isDataLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
            <Loader2 className="animate-spin text-primary" size={48} />
          </div>
        )}
        {shopData && !isDataLoading && (
          <Tabs defaultValue="phapbao" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="phapbao">
                <Shield className="w-4 h-4 mr-2" />
                Pháp Bảo
              </TabsTrigger>
              <TabsTrigger value="donghanh">
                <Heart className="w-4 h-4 mr-2" />
                Đồng Hành
              </TabsTrigger>
              <TabsTrigger value="bonmenh">
                <Dna className="w-4 h-4 mr-2" />
                Bổn Mệnh
              </TabsTrigger>
              <TabsTrigger value="danduoc">
                <Gem className="w-4 h-4 mr-2" />
                Đan Dược
              </TabsTrigger>
              <TabsTrigger value="nangcap">
                <ArrowUpCircle className="w-4 h-4 mr-2" />
                Nâng Cấp
              </TabsTrigger>
            </TabsList>
            <TabsContent value="phapbao">
              {renderItems(shopData.phapBaoItems, "Pháp Bảo")}
            </TabsContent>
            <TabsContent value="donghanh">
              {renderItems(shopData.dongHanhItems, "Đồng Hành")}
            </TabsContent>
            <TabsContent value="bonmenh">
              {renderItems(shopData.bonMenhItems, "Bổn Mệnh")}
            </TabsContent>
            <TabsContent value="danduoc">
              <Button
                onClick={() => handleBuyAll(shopData?.danDuocItems || [])}
                disabled={isLoading ||
                  !shopData?.danDuocItems.some(
                    (i) => i.actionType === "buy" && i.isEligible
                  )
                }
                className="mb-4"
              >
                Mua Tất Cả
              </Button>
              {renderItems(shopData.danDuocItems, "Đan Dược")}
            </TabsContent>
            <TabsContent value="nangcap">
              {renderItems(shopData.nangCapItems, "Nâng Cấp")}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
