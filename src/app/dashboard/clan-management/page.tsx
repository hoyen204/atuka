"use client";

import {
  Activity,
  ArrowUpDown,
  BarChart,
  Coins,
  Filter,
  Gem,
  Loader2,
  Settings,
  Shield,
  ShoppingCart,
  Trophy,
  Users,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { QuestionMarkCircledIcon } from "@radix-ui/react-icons";

interface ClanMember {
  id: string;
  rank: number;
  name: string;
  role: string;
  weeklyPoints: number;
  weeklyTreasury: number;
  totalScore: number;
  isOnline: boolean;
  lastActivity: string;
}

interface Account {
  id: string;
  name: string;
}

interface Proxy {
  id: string;
  host: string;
  port: number;
  username: string;
  password: string;
}

const ClanManagementPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [hasMoreAccounts, setHasMoreAccounts] = useState(true);
  const [accountsPage, setAccountsPage] = useState(1);
  const [isAccountLoading, setIsAccountLoading] = useState(false);
  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    searchParams.get("accountId")
  );
  const [selectedProxyId, setSelectedProxyId] = useState<string>(
    searchParams.get("proxyId") || "random"
  );

  const [isDataLoading, setIsDataLoading] = useState(true);
  const [clanDetail, setClanDetail] = useState<any>(null);
  const [isBuyingAll, setIsBuyingAll] = useState(false);
  const [isBuyingForAllAccounts, setIsBuyingForAllAccounts] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [activeShopTab, setActiveShopTab] = useState("tong-mon");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof ClanMember;
    direction: "ascending" | "descending";
  }>({ key: "totalScore", direction: "descending" });

  const fetchAccounts = useCallback(async (page = 1) => {
    setIsAccountLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: "999",
      });
      if (page > 1 && accounts.length > 0) {
        params.append("cursor", accounts[accounts.length - 1].id.toString());
      }

      const res = await fetch(`/api/accounts?${params}`);
      const data = await res.json();
      setAccounts((prev) =>
        page === 1 ? data.accounts : [...prev, ...data.accounts]
      );
      setHasMoreAccounts(data.nextCursor !== null);
    } catch (error) {
      console.error("Failed to fetch accounts:", error);
      toast.error("Tải danh sách tài khoản thất bại.");
    } finally {
      setIsAccountLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedAccountId) {
      setSelectedAccountId(accounts[0]?.id || "");
    }
  }, [accounts]);

  const handleLoadMoreAccounts = useCallback(() => {
    if (isAccountLoading) return;
    setAccountsPage((prevPage) => {
      const nextPage = prevPage + 1;
      fetchAccounts(nextPage);
      return nextPage;
    });
  }, [isAccountLoading, fetchAccounts]);

  const observer = useRef<IntersectionObserver | null>(null);
  const lastAccountElementRef = useCallback(
    (node: any) => {
      if (isAccountLoading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMoreAccounts) {
          handleLoadMoreAccounts();
        }
      });
      if (node) observer.current.observe(node);
    },
    [isAccountLoading, hasMoreAccounts, handleLoadMoreAccounts]
  );

  useEffect(() => {
    fetchAccounts(1);
  }, [fetchAccounts]);

  useEffect(() => {
    async function fetchInitialProxies() {
      const proxyRes = await fetch("/api/proxies");
      const proxyData = await proxyRes.json();
      setProxies(proxyData.proxies);
    }
    fetchInitialProxies();
  }, []);

  useEffect(() => {
    async function fetchClanDetail() {
      if (!selectedAccountId) {
        return;
      }

      setIsDataLoading(true);
      setClanDetail(null);

      try {
        const res = await fetch(
          `/api/clan/detail?accountId=${selectedAccountId}&proxyId=${selectedProxyId}`
        );
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Tải dữ liệu thất bại");
        }

        const data = await res.json();
        setClanDetail(data.clanDetail);
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setIsDataLoading(false);
      }
    }

    fetchClanDetail();
  }, [selectedAccountId, selectedProxyId, refreshKey]);

  const handleAccountChange = (accountId: string) => {
    setSelectedAccountId(accountId);
    router.push(
      `/dashboard/clan-management?accountId=${accountId}&proxyId=${selectedProxyId}`
    );
  };

  const handleProxyChange = (proxyId: string) => {
    setSelectedProxyId(proxyId);
    if (selectedAccountId) {
      router.push(
        `/dashboard/clan-management?accountId=${selectedAccountId}&proxyId=${proxyId}`
      );
    }
  };

  const sortedMembers = useMemo(() => {
    if (!clanDetail?.members) return [];
    let sortableMembers = [...clanDetail.members];
    sortableMembers.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "ascending" ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "ascending" ? 1 : -1;
      }
      return 0;
    });
    return sortableMembers;
  }, [clanDetail, sortConfig]);

  const requestSort = (key: keyof ClanMember) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const handleClickItem = async (itemId: string, action: string) => {
    const res = await fetch(
      `/api/clan/shop/${selectedAccountId}/${action}?proxyId=${selectedProxyId}`,
      {
        method: "POST",
        body: JSON.stringify({ item_id: itemId }),
      }
    );
    const data = await res.json();
    if (data.success) {
      toast.success(data.message);
    } else {
      toast.error(data.message);
    }
  };

  const handleBuyAllDanDuoc = async () => {
    if (!selectedAccountId) {
      toast.error("Vui lòng chọn tài khoản trước.");
      return;
    }
    setIsBuyingAll(true);
    toast.info("Bắt đầu tự động mua tất cả đan dược...");

    const danDuocItems = clanDetail?.shopData?.danDuocItems || [];
    const itemsToBuy = danDuocItems.filter(
      (item: any) => item.isEligible && item.usedCount < item.usageLimit
    );

    if (itemsToBuy.length === 0) {
      toast.info("Không có đan dược nào hợp lệ để mua.");
      setIsBuyingAll(false);
      return;
    }

    itemsToBuy.sort((a: any, b: any) => b.price - a.price);
    let successCount = 0;
    let errorCount = 0;

    for (const item of itemsToBuy) {
      for (let i = 0; i < item.usageLimit - item.usedCount; i++) {
        try {
          const res = await fetch(
            `/api/clan/shop/${selectedAccountId}/buy-dan-duoc-tm?proxyId=${selectedProxyId}`,
            {
              method: "POST",
              body: JSON.stringify({ item_id: item.id }),
              headers: { "Content-Type": "application/json" },
            }
          );
          const data = await res.json();
          if (res.ok && data.success) {
            successCount++;
            toast.success(data.message);
          } else {
            errorCount++;
            toast.error(
              `Mua ${item.name} thất bại: ${data.message || "Lỗi không xác định"
              }`
            );
          }
        } catch (e: any) {
          errorCount++;
          toast.error(`Lỗi khi mua ${item.name}: ${e.message}`);
        }
        // Add a small delay between requests
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    toast.info(
      `Hoàn tất! Thành công: ${successCount}, Thất bại: ${errorCount}. Đang tải lại dữ liệu...`
    );
    setIsBuyingAll(false);
    setRefreshKey((prev) => prev + 1); // Refresh data
  };

  const handleBuyAllDanDuocForAllAccounts = async () => {
    setIsBuyingForAllAccounts(true);
    toast.info(
      "Bắt đầu mua đan dược cho TẤT CẢ tài khoản. Quá trình này sẽ mất nhiều thời gian."
    );

    let totalSuccess = 0;
    let totalErrors = 0;

    for (const account of accounts) {
      toast.info(`[${account.name}] Bắt đầu xử lý...`);
      try {
        const detailRes = await fetch(
          `/api/clan/detail?accountId=${account.id}&proxyId=${selectedProxyId}`
        );
        if (!detailRes.ok) {
          throw new Error(`Tải dữ liệu thất bại cho ${account.name}`);
        }
        const detailData = await detailRes.json();
        const danDuocItems =
          detailData.clanDetail?.shopData?.danDuocItems || [];

        const itemsToBuy = danDuocItems.filter(
          (item: any) =>
            item.isEligible &&
            item.usedCount < item.usageLimit
        );

        itemsToBuy.sort((a: any, b: any) => b.price - a.price);

        if (itemsToBuy.length === 0) {
          toast.info(`[${account.name}] Không có gì để mua.`);
          continue;
        }

        for (const item of itemsToBuy) {
          const quantityToBuy = item.usageLimit - item.usedCount;
          for (let i = 0; i < quantityToBuy; i++) {
            try {
              const buyRes = await fetch(
                `/api/clan/shop/${account.id}/buy-dan-duoc-tm?proxyId=${selectedProxyId}`,
                {
                  method: "POST",
                  body: JSON.stringify({ item_id: item.id }),
                  headers: { "Content-Type": "application/json" },
                }
              );
              const buyData = await buyRes.json();
              if (buyRes.ok && buyData.success) {
                totalSuccess++;
                toast.success(`[${account.name}] Đã mua: ${item.name}`);
              } else {
                totalErrors++;
                toast.error(
                  `[${account.name}] Lỗi khi mua ${item.name}: ${buyData.message || "Lỗi không rõ"
                  }`
                );
              }
            } catch (e: any) {
              totalErrors++;
              toast.error(
                `[${account.name}] Lỗi nghiêm trọng khi mua ${item.name}: ${e.message}`
              );
            }
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }
      } catch (e: any) {
        totalErrors++;
        toast.error(`[${account.name}] Xảy ra lỗi: ${e.message}`);
      }
    }

    toast.info(
      `Hoàn tất! Tổng thành công: ${totalSuccess}, Tổng lỗi: ${totalErrors}.`
    );
    setIsBuyingForAllAccounts(false);
    setRefreshKey((prev) => prev + 1);
  };

  if (authLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div>Vui lòng đăng nhập để tiếp tục</div>;
  }

  if (isDataLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="animate-spin text-blue-600" size={64} />
      </div>
    );
  }

  if (!clanDetail) {
    return (
      <div className="text-center h-96 flex flex-col justify-center items-center">
        <Shield size={64} className="text-gray-400 mb-4" />
        <h2 className="text-2xl font-semibold">Chưa có dữ liệu</h2>
        <p className="text-gray-600">
          Vui lòng chọn một tài khoản để xem thông tin tông môn.
        </p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header with selectors */}
        <div className="flex flex-col md:flex-row gap-4 items-end justify-end mb-4">
          <div className="w-full md:w-auto">
            <Button
              onClick={handleBuyAllDanDuocForAllAccounts}
              disabled={isBuyingForAllAccounts || isDataLoading}
              variant="destructive"
              className="w-full"
            >
              {isBuyingForAllAccounts ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Mua hết Đan Dược (Tất cả)"
              )}
            </Button>
          </div>
          <div className="w-full md:w-1/4">
            <Select
              value={selectedAccountId || ""}
              onValueChange={handleAccountChange}
            >
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <SelectValue placeholder="Chọn tài khoản" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {accounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name}
                  </SelectItem>
                ))}
                {hasMoreAccounts && <div ref={lastAccountElementRef} />}
                {isAccountLoading && (
                  <div className="flex justify-center items-center p-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-1/4">
            <Select value={selectedProxyId} onValueChange={handleProxyChange}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn proxy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="random">Proxy Ngẫu Nhiên</SelectItem>
                {proxies.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {`${p.username}:${p.password}@${p.host}:${p.port}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-6 text-center">
              <Users size={32} className="mx-auto text-blue-600 mb-2" />
              <div className="text-3xl font-bold text-blue-800 mb-1">
                {clanDetail.header?.memberCount || 0}/
                {clanDetail.header?.memberLimit || 0}
              </div>
              <p className="text-sm text-blue-700">Thành viên</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-6 text-center">
              <Coins size={32} className="mx-auto text-green-600 mb-2" />
              <div className="text-2xl font-bold text-green-800 mb-1">
                {clanDetail.header?.treasury?.current.toLocaleString()} /{" "}
                {clanDetail.header?.treasury?.target.toLocaleString()}
              </div>
              <p className="text-sm text-green-700">Tông Khố</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-pink-50 to-pink-100">
            <CardContent className="p-6 text-center">
              <Gem size={32} className="mx-auto text-pink-600 mb-2" />
              <div className="text-3xl font-bold text-pink-800 mb-1">
                {clanDetail.points?.toLocaleString() || "..."}
              </div>
              <p className="text-sm text-pink-700">Điểm Cống Hiến</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-6 text-center">
              <Activity size={32} className="mx-auto text-purple-600 mb-2" />
              <div className="text-3xl font-bold text-purple-800 mb-1">
                {(
                  clanDetail.members.reduce(
                    (acc: number, member: any) => acc + member.weeklyPoints,
                    0
                  ) / clanDetail.members.length
                ).toFixed(2)}
              </div>
              <p className="text-sm text-purple-700">
                Hoạt động tuần trung bình
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100">
            <CardContent className="p-6 text-center">
              <Trophy size={32} className="mx-auto text-amber-600 mb-2" />
              <div className="text-3xl font-bold text-amber-800 mb-1">
                {
                  clanDetail.members.filter(
                    (member: any) =>
                      member.weeklyTreasury >= 25 * new Date().getDay()
                  ).length
                }{" "}
                / {clanDetail.members.length}
              </div>
              <p className="text-sm text-amber-700">
                Hiệu suất
                <Tooltip>
                  <TooltipTrigger>
                    <QuestionMarkCircledIcon className="w-4 h-4 inline ml-1 hover:cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Hiệu suất là số lượng thành viên đạt hơn 25 tông khố mỗi
                      ngày
                    </p>
                  </TooltipContent>
                </Tooltip>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="members" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="members">
              <Users className="w-4 h-4 mr-2" />
              Thành viên
            </TabsTrigger>
            <TabsTrigger value="shop">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Cửa hàng
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart className="w-4 h-4 mr-2" />
              Phân tích
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-2" />
              Cài đặt
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members">
            <Card>
              <CardHeader>
                <CardTitle>Danh Sách Thành Viên</CardTitle>
                <CardDescription>
                  Quản lý thành viên trong tông môn.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>Tên</TableHead>
                      <TableHead onClick={() => requestSort("role")}>
                        <span className="flex items-center cursor-pointer">
                          <ArrowUpDown className="mr-2 h-4 w-4" />
                          Chức vụ
                        </span>
                      </TableHead>
                      <TableHead onClick={() => requestSort("weeklyPoints")}>
                        <span className="flex items-center cursor-pointer">
                          <ArrowUpDown className="mr-2 h-4 w-4" />
                          Điểm tuần
                        </span>
                      </TableHead>
                      <TableHead onClick={() => requestSort("weeklyTreasury")}>
                        <span className="flex items-center cursor-pointer">
                          <ArrowUpDown className="mr-2 h-4 w-4" />
                          Tông Khố tuần
                        </span>
                      </TableHead>
                      <TableHead onClick={() => requestSort("totalScore")}>
                        <span className="flex items-center cursor-pointer">
                          <ArrowUpDown className="mr-2 h-4 w-4" />
                          Tu vi
                        </span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedMembers.map((member, index) => (
                      <TableRow key={member.id}>
                        <TableCell>{member.rank}</TableCell>
                        <TableCell>{member.name}</TableCell>
                        <TableCell>{member.role}</TableCell>
                        <TableCell>{member.weeklyPoints}</TableCell>
                        <TableCell>{member.weeklyTreasury}</TableCell>
                        <TableCell>{member.totalScore}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shop">
            <Card>
              <CardHeader>
                <CardTitle>Cửa Hàng Tông Môn</CardTitle>
                <CardDescription>
                  Mua và bán các mục trong cửa hàng.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs
                  defaultValue={activeShopTab}
                  onValueChange={setActiveShopTab}
                >
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="tong-mon">Tông Môn</TabsTrigger>
                    <TabsTrigger value="phap-bao">Pháp Bảo</TabsTrigger>
                    <TabsTrigger value="dan-duoc">Đan Dược</TabsTrigger>
                  </TabsList>
                  <TabsContent value="tong-mon">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {clanDetail.shopData.tongMonItems.map((item: any) => (
                        <Card
                          key={item.id}
                          className="flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-primary/50 hover:scale-105"
                        >
                          <CardContent className="p-4 flex flex-col flex-grow gap-1">
                            <CardTitle className="text-lg flex-grow">
                              {item.name}
                            </CardTitle>
                            <CardDescription className="text-sm flex-grow">
                              {item.description}
                            </CardDescription>
                            <p className="text-sm text-gray-600">
                              Giá: {item.price.toLocaleString()}{" "}
                              {item.priceType === "tong-kho"
                                ? "Tông Khố"
                                : "Cống hiến"}
                            </p>
                            <p className="text-sm text-gray-600">
                              Hiệu ứng: {item.congHienBonus}
                            </p>
                            <Button
                              disabled={!item.isEligible}
                              className="w-full mt-auto"
                              onClick={() =>
                                handleClickItem(
                                  item.id,
                                  `${item.actionType}-item-tong-mon`
                                )
                              }
                            >
                              {item.actionType === "buy" ? "Mua" : "Bán"}
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                  <TabsContent value="phap-bao">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {clanDetail.shopData.phapBaoItems.map((item: any) => (
                        <Card
                          key={item.id}
                          className="flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-primary/50 hover:scale-105"
                        >
                          <CardContent className="p-4 flex flex-col flex-grow gap-1">
                            <CardTitle className="text-lg flex-grow">
                              {item.name}
                            </CardTitle>
                            <p className="text-sm text-gray-600">
                              Tu vi: {<span className="font-bold text-green-400">{Number(item.tuViBonus).toLocaleString()}</span>}
                            </p>
                            <p className="text-sm text-gray-600">
                              Giá: {<span className="font-bold text-green-400">{item.price.toLocaleString()}</span>}{" "}
                              {item.priceType === "tong-kho"
                                ? "Tông Khố"
                                : "Cống hiến"}
                            </p>
                            <Button
                              disabled={!item.isEligible}
                              className="w-full"
                              onClick={() =>
                                handleClickItem(
                                  item.id,
                                  `${item.actionType}_pb_tong_mon`
                                )
                              }
                            >
                              {item.actionType === "buy" ? "Mua" : "Bán"}
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                  <TabsContent value="dan-duoc">
                    <div className="mb-4">
                      <Button
                        onClick={handleBuyAllDanDuoc}
                        disabled={isBuyingAll || isDataLoading}
                      >
                        {isBuyingAll ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Đang mua...
                          </>
                        ) : (
                          "Tự động mua tất cả"
                        )}
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {clanDetail.shopData.danDuocItems.map((item: any) => (
                        <Card
                          key={item.id}
                          className="flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-primary/50 hover:scale-105"
                        >
                          <CardContent className="p-4 flex flex-col flex-grow gap-1">
                            <CardTitle className="text-lg flex-grow">{item.name}</CardTitle>
                            <p className="text-sm text-gray-600">
                              Tu vi: {<span className="font-bold text-green-400">{Number(item.tuViBonus).toLocaleString()}</span>}
                            </p>
                            <p className="text-sm text-gray-600">
                              Giá: {<span className="font-bold text-green-400">{item.price.toLocaleString()}</span>}{" "}
                              {item.priceType === "tong-kho"
                                ? "Tông Khố"
                                : "Cống hiến"}
                            </p>
                            
                            <p className={`text-sm text-gray-600 ${item.usedCount >= item.usageLimit ? 'text-red-500' : ''}`}>
                              Đã dùng: {item.usedCount}/{item.usageLimit}
                            </p>
                            <Button
                              disabled={
                                !item.isEligible ||
                                item.usedCount >= item.usageLimit
                              }
                              className="w-full mt-auto"
                              onClick={() =>
                                handleClickItem(item.id, "buy-dan-duoc-tm")
                              }
                            >
                              Mua
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Phân Tích Tông Môn</CardTitle>
                <CardDescription>
                  Thống kê và phân tích hoạt động của tông môn.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Phân tích dữ liệu đang được phát triển.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Cài Đặt Tông Môn</CardTitle>
                <CardDescription>
                  Điều chỉnh các cài đặt cho tông môn.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Cài đặt đang được phát triển.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
};

export default ClanManagementPage;