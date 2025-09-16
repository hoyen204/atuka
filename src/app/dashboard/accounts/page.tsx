"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PaginationComponent } from "@/components/ui/pagination";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useResponsive } from "@/hooks/useResponsive";
import { useToast } from "@/hooks/useToast";
import { useApiClient } from "@/lib/api.utils";
import {
  ChevronDown,
  Copy,
  Edit,
  Filter,
  Heart,
  Mountain,
  Power,
  PowerOff,
  Search,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";

interface Account {
  id: number;
  name: string;
  cookie: string;
  mineId?: string;
  mineTimeRange?: any;
  mineType?: "full" | "max" | "min";
  availableBuffAmount: number;
  clanId?: string;
  clanName?: string;
  toggle: boolean;
  cultivation?: number;
  bootleNeckCultivation?: number;
  gem?: number;
  fairyGem?: number;
  coin?: number;
  lockCoin?: number;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
}

interface Mine {
  id: number;
  name: string;
  type: string;
  isPeaceful: boolean;
  isFavorited?: boolean;
}

interface Clan {
  clanId: string;
  clanName: string;
}

interface AccountsResponse {
  accounts: Account[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface MinesResponse {
  mines: Mine[];
}

interface ClansResponse {
  clans: Clan[];
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [mines, setMines] = useState<Mine[]>([]);
  const [clans, setClans] = useState<Clan[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [isCompactView, setIsCompactView] = useState(false);
  const [search, setSearch] = useState("");
  const [clanFilter, setClanFilter] = useState("all");
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isBatchMineDialogOpen, setIsBatchMineDialogOpen] = useState(false);
  const [selectedAccounts, setSelectedAccounts] = useState<number[]>([]);
  const { toast } = useToast();
  const api = useApiClient();
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const [editForm, setEditForm] = useState({
    mineId: "",
    startTime: "",
    endTime: "",
    mineType: "min" as "full" | "max" | "min",
    availableBuffAmount: 100,
  });

  const [batchMineForm, setBatchMineForm] = useState({
    mineId: "none",
    startTime: "",
    endTime: "",
    mineType: "min" as "full" | "max" | "min",
    availableBuffAmount: 100,
  });

  // Auto set compact view on mobile
  useEffect(() => {
    if (isMobile) {
      setIsCompactView(true);
    }
  }, [isMobile]);

  // Validate time format (HH:MM)
  const validateTimeFormat = (time: string): boolean => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  };

  const fetchMines = async () => {
    try {
      const data: MinesResponse = await api.get("/api/mines", {
        loadingText: "Đang tải danh sách khoáng mạch...",
        showLoading: false,
      });
      setMines(data.mines);
    } catch (error) {
      console.error("Error fetching mines:", error);
    }
  };

  const toggleFavoriteMine = async (mineId: number, isCurrentlyFavorited: boolean) => {
    try {
      if (isCurrentlyFavorited) {
        // Remove from favorites
        await api.delete(`/api/mines/favorites?mineId=${mineId}`, {
          loadingText: "Đang xóa khỏi danh sách yêu thích...",
          showLoading: false,
        });
      } else {
        // Add to favorites
        await api.post("/api/mines/favorites", { mineId }, {
          loadingText: "Đang thêm vào danh sách yêu thích...",
          showLoading: false,
        });
      }

      // Update local state
      setMines(prevMines =>
        prevMines.map(mine =>
          mine.id === mineId
            ? { ...mine, isFavorited: !isCurrentlyFavorited }
            : mine
        )
      );

      toast({
        title: "Thành công",
        description: isCurrentlyFavorited
          ? "Đã xóa khỏi danh sách yêu thích"
          : "Đã thêm vào danh sách yêu thích",
        type: "success",
      });
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra khi cập nhật yêu thích",
        variant: "destructive",
        type: "error",
      });
    }
  };

  const fetchClans = async () => {
    try {
      const data: ClansResponse = await api.get("/api/accounts/clans", {
        loadingText: "Đang tải danh sách tông môn...",
        showLoading: false,
      });
      setClans(data.clans);
    } catch (error) {
      console.error("Error fetching clans:", error);
    }
  };

  const fetchAccounts = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        search,
      });

      if (page > 1 && accounts.length > 0) {
        params.append("cursor", accounts[accounts.length - 1].id.toString());
      }

      if (clanFilter && clanFilter !== "all") {
        params.append("clanId", clanFilter);
      }

      const data: AccountsResponse = await api.get(`/api/accounts?${params}`, {
        loadingText: "Đang tải danh sách tài khoản...",
      });

      setAccounts(data.accounts);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setSelectedAccounts((prev) =>
        prev.filter((id) => data.accounts.some((account) => account.id === id))
      );
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách tài khoản",
        variant: "destructive",
        type: "error",
      });
    }
  };

  useEffect(() => {
    fetchMines();
    fetchClans();
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [page, pageSize, search, clanFilter]);

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Thành công",
        description: `Đã copy ${type} vào clipboard`,
        type: "success",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: `Không thể copy ${type}`,
        variant: "destructive",
        type: "error",
      });
    }
  };

  const getMineNameById = (mineId: string | undefined) => {
    if (!mineId || mineId === "none") return "Chưa thiết lập";
    const mine = mines.find((m) => m.id.toString() === mineId);
    return mine
      ? `${mine.isFavorited ? "❤️ " : ""}${mine.name} (${
          mine.type === "gold"
            ? "Thượng"
            : mine.type === "silver"
            ? "Trung"
            : "Hạ"
        })`
      : `${mineId}`;
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAccounts(accounts.map((account) => account.id));
    } else {
      setSelectedAccounts([]);
    }
  };

  const handleSelectAccount = (accountId: number, checked: boolean) => {
    if (checked) {
      setSelectedAccounts((prev) => [...prev, accountId]);
    } else {
      setSelectedAccounts((prev) => prev.filter((id) => id !== accountId));
    }
  };

  const handleBatchAction = async (action: string) => {
    if (selectedAccounts.length === 0) {
      toast({
        title: "Thông báo",
        description: "Vui lòng chọn ít nhất một tài khoản",
        variant: "default",
      });
      return;
    }

    switch (action) {
      case "enable":
        await handleBatchToggle(true);
        break;
      case "disable":
        await handleBatchToggle(false);
        break;
      case "mine":
        setIsBatchMineDialogOpen(true);
        break;
      case "export":
        handleExportSelected();
        break;
      case "delete":
        handleBatchDelete();
        break;
    }
  };

  const handleBatchToggle = async (enable: boolean) => {
    try {
      const result = await api.patch(
        "/api/accounts/batch",
        {
          accountIds: selectedAccounts,
          updateData: { toggle: enable },
        },
        {
          loadingText: `Đang ${enable ? "kích hoạt" : "tạm dừng"} tài khoản...`,
        }
      );

      toast({
        title: "Thành công",
        description: `Đã ${enable ? "kích hoạt" : "tạm dừng"} ${
          result.updatedCount
        } tài khoản`,
        type: "success",
      });

      setSelectedAccounts([]);
      fetchAccounts();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra khi cập nhật tài khoản",
        variant: "destructive",
        type: "error",
      });
    }
  };

  const handleExportSelected = () => {
    const selectedAccountsData = accounts.filter((account) =>
      selectedAccounts.includes(account.id)
    );

    const csvContent = [
      [
        "ID",
        "Tên",
        "Cookie",
        "Tông môn",
        "Khoáng mạch",
        "Thời gian đào",
        "Loại nhận thưởng",
        "Buff Amount",
        "Tu vi",
        "Bottleneck Tu vi",
        "Tinh thạch",
        "Tiên ngọc",
        "Coin",
        "Lock Coin",
      ].join(","),
      ...selectedAccountsData.map((account) =>
        [
          account.id,
          account.name,
          account.cookie,
          account.clanName || "",
          getMineNameById(account.mineId),
          formatMineTimeRange(account.mineTimeRange),
          account.mineType || "min",
          account.availableBuffAmount,
          account.cultivation || 0,
          account.bootleNeckCultivation || 0,
          account.gem || 0,
          account.fairyGem || 0,
          account.coin || 0,
          account.lockCoin || 0,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `accounts_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    toast({
      title: "Thành công",
      description: `Đã xuất ${selectedAccounts.length} tài khoản`,
      type: "success",
    });
  };

  const handleBatchMineUpdate = async () => {
    try {
      let mineTimeRange = null;
      if (batchMineForm.startTime.trim() && batchMineForm.endTime.trim()) {
        if (
          !validateTimeFormat(batchMineForm.startTime) ||
          !validateTimeFormat(batchMineForm.endTime)
        ) {
          toast({
            title: "Lỗi",
            description:
              "Định dạng thời gian không hợp lệ. Vui lòng nhập theo format HH:MM (vd: 08:30)",
            variant: "destructive",
          });
          return;
        }
        mineTimeRange = {
          start: batchMineForm.startTime,
          end: batchMineForm.endTime,
        };
      }

      const result = await api.patch(
        "/api/accounts/batch",
        {
          accountIds: selectedAccounts,
          updateData: {
            mineId: batchMineForm.mineId,
            mineTimeRange,
            mineType: batchMineForm.mineType,
            availableBuffAmount: batchMineForm.availableBuffAmount,
          },
        },
        {
          loadingText: "Đang cập nhật khoáng mạch...",
        }
      );

      toast({
        title: "Thành công",
        description: `Đã cập nhật khoáng mạch cho ${result.updatedCount} tài khoản`,
        type: "success",
      });

      setIsBatchMineDialogOpen(false);
      setSelectedAccounts([]);
      fetchAccounts();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra khi cập nhật khoáng mạch",
        variant: "destructive",
        type: "error",
      });
    }
  };

  const handleBatchDelete = () => {
    toast({
      title: "Thông báo",
      description: "Tính năng xóa hàng loạt chưa được triển khai",
      variant: "default",
    });
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    let startTime = "";
    let endTime = "";
    if (account.mineTimeRange) {
      if (
        typeof account.mineTimeRange === "object" &&
        account.mineTimeRange.start &&
        account.mineTimeRange.end
      ) {
        startTime = account.mineTimeRange.start;
        endTime = account.mineTimeRange.end;
      }
    }
    setEditForm({
      mineId: account.mineId || "none",
      startTime,
      endTime,
      mineType: account.mineType || "min",
      availableBuffAmount: account.availableBuffAmount,
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingAccount) return;

    try {
      let mineTimeRange = null;
      if (editForm.startTime.trim() && editForm.endTime.trim()) {
        if (
          !validateTimeFormat(editForm.startTime) ||
          !validateTimeFormat(editForm.endTime)
        ) {
          toast({
            title: "Lỗi",
            description:
              "Định dạng thời gian không hợp lệ. Vui lòng nhập theo format HH:MM (vd: 08:30)",
            variant: "destructive",
          });
          return;
        }
        mineTimeRange = {
          start: editForm.startTime,
          end: editForm.endTime,
        };
      }

      await api.patch(
        `/api/accounts/${editingAccount.id}`,
        {
          mineId:
            editForm.mineId && editForm.mineId !== "none"
              ? editForm.mineId
              : null,
          mineTimeRange,
          mineType: editForm.mineType,
          availableBuffAmount: parseInt(
            editForm.availableBuffAmount.toString()
          ),
        },
        {
          loadingText: "Đang cập nhật thông tin tài khoản...",
        }
      );

      toast({
        title: "Thành công",
        description: "Đã cập nhật thông tin khoáng mạch",
        type: "success",
      });
      setIsEditDialogOpen(false);
      fetchAccounts();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra khi cập nhật",
        variant: "destructive",
        type: "error",
      });
    }
  };

  const formatMineTimeRange = (mineTimeRange: any) => {
    if (!mineTimeRange) return "Chưa thiết lập";
    if (typeof mineTimeRange === "string") return mineTimeRange;
    if (mineTimeRange.start && mineTimeRange.end) {
      return `${mineTimeRange.start} - ${mineTimeRange.end}`;
    }
    return JSON.stringify(mineTimeRange);
  };

  const formatMineInfo = (account: Account) => {
    const mineName = getMineNameById(account.mineId);
    const timeRange = formatMineTimeRange(account.mineTimeRange);
    const mineTypeText =
      account.mineType === "full"
        ? "Nhận khi đạt tối đa"
        : account.mineType === "max"
        ? "Nhận lâu nhất có thể"
        : "Nhận sớm nhất có thể (mỗi phút)";

    return {
      mineName,
      timeRange,
      buffAmount: account.availableBuffAmount,
      mineTypeText,
    };
  };

  const formatAccountStats = (account: Account) => {
    const cultivation = account.cultivation
      ? account.cultivation.toLocaleString()
      : "0";
    const gem = account.gem ? account.gem.toLocaleString() : "0";
    const fairyGem = account.fairyGem ? account.fairyGem.toLocaleString() : "0";
    const coin = account.coin ? account.coin.toLocaleString() : "0";
    const lockCoin = account.lockCoin ? account.lockCoin.toLocaleString() : "0";

    return {
      cultivation: `${cultivation}`,
      gem,
      fairyGem,
      coin,
      lockCoin,
    };
  };

  return (
    <TooltipProvider>
      <div
        className={`h-full flex flex-col ${isMobile ? "bg-gray-50" : "p-6"}`}
      >
        {isMobile ? (
          // Mobile layout - no Card
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            <div className="border-b p-4 flex-shrink-0">
              <h1 className="text-lg font-semibold flex items-center gap-2">
                <span>Quản lý tài khoản</span>
                <Badge variant="secondary" className="text-xs">
                  {total}
                </Badge>
              </h1>
            </div>
            <div className="flex-1 overflow-auto">
              <div className={`pb-4 border-b mb-4 px-4 pt-4`}>
                <div className={`flex gap-4 ${isMobile ? "flex-col" : ""}`}>
                  <div className={`flex gap-2 ${isMobile ? "flex-col" : ""}`}>
                    <div className={isMobile ? "w-full" : "w-64"}>
                      <Select
                        value={clanFilter}
                        onValueChange={setClanFilter}
                        defaultValue="all"
                      >
                        <SelectTrigger className="w-full">
                          <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-gray-400" />
                            <SelectValue placeholder="Lọc theo tông môn" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tất cả tông môn</SelectItem>
                          {clans.map((clan) => (
                            <SelectItem key={clan.clanId} value={clan.clanId}>
                              {clan.clanName} (ID: {clan.clanId})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {!isMobile && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant={isCompactView ? "default" : "outline"}
                            onClick={() => setIsCompactView(!isCompactView)}
                            className="h-10 px-4"
                          >
                            {isCompactView ? "Mở rộng" : "Thu gọn"}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Chuyển đổi chế độ hiển thị{" "}
                            {isCompactView ? "mở rộng" : "thu gọn"}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>
              </div>

              {
                <div
                  className={`top-36 bg-blue-50 z-10 p-3 rounded-md border border-blue-200 mb-4`}
                >
                  <div
                    className={`flex items-center gap-4 ${
                      isMobile ? "flex-col items-start" : ""
                    }`}
                  >
                    <span className="text-sm font-medium text-blue-700">
                      Đã chọn {selectedAccounts.length} tài khoản
                    </span>
                    <div
                      className={`flex gap-2 ${
                        isMobile ? "w-full flex-col" : ""
                      }`}
                    >
                      <Select onValueChange={handleBatchAction} disabled={selectedAccounts.length === 0}>
                        <SelectTrigger className={isMobile ? "w-full" : "w-48"}>
                          <div className="flex items-center gap-2">
                            <ChevronDown className="h-4 w-4" />
                            <span>Hành động</span>
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="enable">
                            <div className="flex items-center gap-2">
                              <Power className="h-4 w-4 text-green-600" />
                              <span>Kích hoạt</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="disable">
                            <div className="flex items-center gap-2">
                              <PowerOff className="h-4 w-4 text-red-600" />
                              <span>Tạm dừng</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="mine">
                            <div className="flex items-center gap-2">
                              <Mountain className="h-4 w-4 text-amber-600" />
                              <span>Cập nhật khoáng mạch</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="delete">
                            <div className="flex items-center gap-2">
                              <Trash2 className="h-4 w-4 text-red-600" />
                              <span>Xóa</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="default"
                            onClick={() => setSelectedAccounts([])}
                            className={isMobile ? "w-full" : ""}
                            disabled={selectedAccounts.length === 0}
                          >
                            Bỏ chọn tất cả
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Xóa lựa chọn tất cả tài khoản</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              }

              <div className="rounded-md border flex-1 flex flex-col">
                <div className={`flex-1 ${isMobile ? "px-2" : ""}`}>
                  <Table className={`${isCompactView ? "text-sm" : ""}`}>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Checkbox
                                checked={
                                  accounts.length > 0 &&
                                  selectedAccounts.length === accounts.length
                                }
                                onCheckedChange={handleSelectAll}
                                aria-label="Chọn tất cả"
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Chọn hoặc bỏ chọn tất cả tài khoản</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableHead>
                        <TableHead>ID</TableHead>
                        <TableHead>Tên tài khoản</TableHead>
                        <TableHead>Tông môn</TableHead>
                        <TableHead className={isMobile ? "hidden" : ""}>
                          Thông tin khoáng mạch
                        </TableHead>
                        <TableHead className={isMobile ? "hidden" : ""}>
                          Thống kê tài khoản
                        </TableHead>
                        <TableHead className={isMobile ? "hidden" : ""}>
                          Trạng thái
                        </TableHead>
                        <TableHead>Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {accounts.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={isMobile ? 5 : 8}
                            className="text-center py-8"
                          >
                            Không có tài khoản nào
                          </TableCell>
                        </TableRow>
                      ) : (
                        accounts.map((account) => {
                          const mineInfo = formatMineInfo(account);
                          const stats = formatAccountStats(account);

                          return (
                            <TableRow
                              key={account.id}
                              className={isCompactView ? "h-12" : ""}
                            >
                              <TableCell
                                className={isCompactView ? "py-2" : ""}
                              >
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Checkbox
                                      checked={selectedAccounts.includes(
                                        account.id
                                      )}
                                      onCheckedChange={(checked) =>
                                        handleSelectAccount(
                                          account.id,
                                          checked as boolean
                                        )
                                      }
                                      aria-label={`Chọn tài khoản ${account.name}`}
                                    />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      Chọn tài khoản {account.name} để thực hiện
                                      hành động hàng loạt
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TableCell>
                              <TableCell
                                className={`font-medium ${
                                  isCompactView ? "py-2" : ""
                                }`}
                              >
                                {account.id}
                              </TableCell>
                              <TableCell
                                className={isCompactView ? "py-2" : ""}
                              >
                                {account.name}
                              </TableCell>
                              <TableCell
                                className={isCompactView ? "py-2" : ""}
                              >
                                {account.clanName ? (
                                  <div>
                                    <div className="font-medium">
                                      {account.clanName}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      ID: {account.clanId}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-gray-400">
                                    Chưa có tông môn
                                  </span>
                                )}
                              </TableCell>
                              <TableCell
                                className={`max-w-48 ${
                                  isCompactView ? "py-2" : ""
                                } ${isMobile ? "hidden" : ""}`}
                              >
                                <div
                                  className={
                                    isCompactView ? "space-y-0.5" : "space-y-1"
                                  }
                                >
                                  <div
                                    className={`font-medium ${
                                      account.mineId
                                        ? "text-gray-900"
                                        : "text-gray-400"
                                    } ${
                                      isCompactView ? "text-xs" : ""
                                    } dark:text-foreground/70`}
                                  >
                                    {mineInfo.mineName}
                                  </div>
                                  <div
                                    className={`text-xs text-gray-600 ${
                                      isCompactView ? "hidden" : ""
                                    }`}
                                  >
                                    {mineInfo.timeRange}
                                  </div>
                                  <div
                                    className={`flex items-center gap-2 ${
                                      isCompactView ? "hidden" : ""
                                    }`}
                                  >
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      Buff: {mineInfo.buffAmount}
                                    </Badge>
                                  </div>
                                  <div
                                    className={`text-xs text-blue-600 ${
                                      isCompactView ? "text-[10px]" : ""
                                    }`}
                                  >
                                    {mineInfo.mineTypeText}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell
                                className={`max-w-40 ${
                                  isCompactView ? "py-2" : ""
                                } ${isMobile ? "hidden" : ""}`}
                              >
                                <div
                                  className={
                                    isCompactView ? "space-y-0" : "space-y-1"
                                  }
                                >
                                  <div
                                    className={
                                      isCompactView ? "text-xs" : "text-sm"
                                    }
                                  >
                                    <span className="text-gray-500">
                                      Tu vi:
                                    </span>{" "}
                                    {stats.cultivation}
                                  </div>
                                  {!isCompactView && (
                                    <>
                                      <div className="text-xs text-gray-600">
                                        <span className="text-gray-500">
                                          Tinh thạch:
                                        </span>{" "}
                                        {stats.gem}
                                      </div>
                                      <div className="text-xs text-gray-600">
                                        <span className="text-gray-500">
                                          Tiên ngọc:
                                        </span>{" "}
                                        {stats.fairyGem}
                                      </div>
                                      <div className="text-xs text-gray-600">
                                        <span className="text-gray-500">
                                          Xu:
                                        </span>{" "}
                                        {stats.coin}
                                      </div>
                                      <div className="text-xs text-gray-600">
                                        <span className="text-gray-500">
                                          Xu khóa:
                                        </span>{" "}
                                        {stats.lockCoin}
                                      </div>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell
                                className={`${isCompactView ? "py-2" : ""} ${
                                  isMobile ? "hidden" : ""
                                }`}
                              >
                                <Badge
                                  variant={
                                    account.toggle ? "default" : "secondary"
                                  }
                                >
                                  {account.toggle ? "Running" : "Stop"}
                                </Badge>
                              </TableCell>
                              <TableCell
                                className={isCompactView ? "py-2" : ""}
                              >
                                <div
                                  className={`flex gap-2 ${
                                    isCompactView ? "gap-1" : ""
                                  }`}
                                >
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          copyToClipboard(
                                            account.cookie,
                                            "cookie"
                                          )
                                        }
                                      >
                                        <Copy className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Copy cookie</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          handleEditAccount(account)
                                        }
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Chỉnh sửa khoáng mạch</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className={`${isMobile ? "p-4" : ""} mt-4 flex-shrink-0`}>
                <PaginationComponent
                  currentPage={page}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  total={total}
                  onPageChange={setPage}
                  onPageSizeChange={(newPageSize) => {
                    setPageSize(newPageSize);
                    setPage(1);
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          // Desktop layout - with Card
          <Card className="flex-1 flex flex-col overflow-hidden">
            <CardHeader className="border-b flex-shrink-0">
              <CardTitle className="flex items-center gap-2">
                <span>Quản lý tài khoản</span>
                <Badge variant="secondary">{total} tài khoản</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-6">
              <div className="pb-4 border-b mb-4">
                <div className="flex gap-4 pt-4">
                  <div className="flex gap-2">
                    <div className="w-64">
                      <Select
                        value={clanFilter}
                        onValueChange={setClanFilter}
                        defaultValue="all"
                      >
                        <SelectTrigger className="w-full">
                          <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-gray-400" />
                            <SelectValue placeholder="Lọc theo tông môn" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tất cả tông môn</SelectItem>
                          {clans.map((clan) => (
                            <SelectItem key={clan.clanId} value={clan.clanId}>
                              {clan.clanName} (ID: {clan.clanId})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={isCompactView ? "default" : "outline"}
                          onClick={() => setIsCompactView(!isCompactView)}
                          className="h-10 px-4"
                        >
                          {isCompactView ? "Mở rộng" : "Thu gọn"}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Chuyển đổi chế độ hiển thị{" "}
                          {isCompactView ? "mở rộng" : "thu gọn"}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>

              {
                <div className="bg-blue-50 z-10 p-3 rounded-md border border-blue-200 mb-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-blue-700">
                      Đã chọn {selectedAccounts.length} tài khoản
                    </span>
                    <div className="flex gap-2">
                      <Select onValueChange={handleBatchAction} disabled={selectedAccounts.length === 0}>
                        <SelectTrigger className="w-48">
                          <div className="flex items-center gap-2">
                            <ChevronDown className="h-4 w-4" />
                            <span>Hành động</span>
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="enable">
                            <div className="flex items-center gap-2">
                              <Power className="h-4 w-4 text-green-600" />
                              <span>Kích hoạt</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="disable">
                            <div className="flex items-center gap-2">
                              <PowerOff className="h-4 w-4 text-red-600" />
                              <span>Tạm dừng</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="mine">
                            <div className="flex items-center gap-2">
                              <Mountain className="h-4 w-4 text-amber-600" />
                              <span>Cập nhật khoáng mạch</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="delete">
                            <div className="flex items-center gap-2">
                              <Trash2 className="h-4 w-4 text-red-600" />
                              <span>Xóa</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="default"
                            onClick={() => setSelectedAccounts([])}
                            disabled={selectedAccounts.length === 0}
                          >
                            Bỏ chọn tất cả
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Xóa lựa chọn tất cả tài khoản</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              }

              <div className="rounded-md border">
                <Table className={`${isCompactView ? "text-sm" : ""}`}>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Checkbox
                              checked={
                                accounts.length > 0 &&
                                selectedAccounts.length === accounts.length
                              }
                              onCheckedChange={handleSelectAll}
                              aria-label="Chọn tất cả"
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Chọn hoặc bỏ chọn tất cả tài khoản</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Tên tài khoản</TableHead>
                      <TableHead>Tông môn</TableHead>
                      <TableHead>Thông tin khoáng mạch</TableHead>
                      <TableHead>Thống kê tài khoản</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          Không có tài khoản nào
                        </TableCell>
                      </TableRow>
                    ) : (
                      accounts.map((account) => {
                        const mineInfo = formatMineInfo(account);
                        const stats = formatAccountStats(account);

                        return (
                          <TableRow
                            key={account.id}
                            className={isCompactView ? "h-12" : ""}
                          >
                            <TableCell className={isCompactView ? "py-2" : ""}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Checkbox
                                    checked={selectedAccounts.includes(
                                      account.id
                                    )}
                                    onCheckedChange={(checked) =>
                                      handleSelectAccount(
                                        account.id,
                                        checked as boolean
                                      )
                                    }
                                    aria-label={`Chọn tài khoản ${account.name}`}
                                  />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    Chọn tài khoản {account.name} để thực hiện
                                    hành động hàng loạt
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>
                            <TableCell
                              className={`font-medium ${
                                isCompactView ? "py-2" : ""
                              }`}
                            >
                              {account.id}
                            </TableCell>
                            <TableCell className={isCompactView ? "py-2" : ""}>
                              {account.name}
                            </TableCell>
                            <TableCell className={isCompactView ? "py-2" : ""}>
                              {account.clanName ? (
                                <div>
                                  <div className="font-medium">
                                    {account.clanName}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    ID: {account.clanId}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-gray-400">
                                  Chưa có tông môn
                                </span>
                              )}
                            </TableCell>
                            <TableCell
                              className={`max-w-48 ${
                                isCompactView ? "py-2" : ""
                              }`}
                            >
                              <div
                                className={
                                  isCompactView ? "space-y-0.5" : "space-y-1"
                                }
                              >
                                <div
                                  className={`font-medium ${
                                    account.mineId
                                      ? "text-gray-900"
                                      : "text-gray-400"
                                  } ${
                                    isCompactView ? "text-xs" : ""
                                  } dark:text-foreground/70`}
                                >
                                  {mineInfo.mineName}
                                </div>
                                <div
                                  className={`text-xs text-gray-600 ${
                                    isCompactView ? "hidden" : ""
                                  }`}
                                >
                                  {mineInfo.timeRange}
                                </div>
                                <div
                                  className={`flex items-center gap-2 ${
                                    isCompactView ? "hidden" : ""
                                  }`}
                                >
                                  <Badge variant="outline" className="text-xs">
                                    Buff: {mineInfo.buffAmount}
                                  </Badge>
                                </div>
                                <div
                                  className={`text-xs text-blue-600 ${
                                    isCompactView ? "text-[10px]" : ""
                                  }`}
                                >
                                  {mineInfo.mineTypeText}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell
                              className={`max-w-40 ${
                                isCompactView ? "py-2" : ""
                              }`}
                            >
                              <div
                                className={
                                  isCompactView ? "space-y-0" : "space-y-1"
                                }
                              >
                                <div
                                  className={
                                    isCompactView ? "text-xs" : "text-sm"
                                  }
                                >
                                  <span className="text-gray-500">Tu vi:</span>{" "}
                                  {stats.cultivation}
                                </div>
                                {!isCompactView && (
                                  <>
                                    <div className="text-xs text-gray-600">
                                      <span className="text-gray-500">
                                        Tinh thạch:
                                      </span>{" "}
                                      {stats.gem}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                      <span className="text-gray-500">
                                        Tiên ngọc:
                                      </span>{" "}
                                      {stats.fairyGem}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                      <span className="text-gray-500">Xu:</span>{" "}
                                      {stats.coin}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                      <span className="text-gray-500">
                                        Xu khóa:
                                      </span>{" "}
                                      {stats.lockCoin}
                                    </div>
                                  </>
                                )}
                              </div>
                            </TableCell>
                            <TableCell
                              className={`${isCompactView ? "py-2" : ""}`}
                            >
                              <Badge
                                variant={
                                  account.toggle ? "default" : "secondary"
                                }
                              >
                                {account.toggle ? "Running" : "Stop"}
                              </Badge>
                            </TableCell>
                            <TableCell className={isCompactView ? "py-2" : ""}>
                              <div
                                className={`flex gap-2 ${
                                  isCompactView ? "gap-1" : ""
                                }`}
                              >
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        copyToClipboard(
                                          account.cookie,
                                          "cookie"
                                        )
                                      }
                                    >
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Copy cookie</p>
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleEditAccount(account)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Chỉnh sửa khoáng mạch</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4">
                <PaginationComponent
                  currentPage={page}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  total={total}
                  onPageChange={setPage}
                  onPageSizeChange={(newPageSize) => {
                    setPageSize(newPageSize);
                    setPage(1);
                  }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Chỉnh sửa khoáng mạch</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="mineId">Khoáng mạch</Label>
                <Select
                  value={editForm.mineId}
                  onValueChange={(value) =>
                    setEditForm((prev) => ({ ...prev, mineId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn khoáng mạch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Không chọn</SelectItem>
                    {mines
                      .sort((a, b) => {
                        // Sort by favorite status first, then by peaceful status
                        if (a.isFavorited && !b.isFavorited) return -1;
                        if (!a.isFavorited && b.isFavorited) return 1;
                        if (a.isPeaceful && !b.isPeaceful) return 1;
                        if (!a.isPeaceful && b.isPeaceful) return -1;
                        return a.name.localeCompare(b.name);
                      })
                      .map((mine) => (
                        <div key={mine.id} className="flex items-center justify-between w-full px-2 py-1.5 hover:bg-accent hover:text-accent-foreground cursor-pointer">
                          <div className="flex items-center gap-2 flex-1">
                            <SelectItem
                              value={mine.id.toString()}
                              className={`${mine.isPeaceful && "font-bold"} flex-1 border-none bg-transparent p-0 h-auto cursor-pointer`}
                            >
                              <div className="flex items-center gap-2">
                                {mine.isFavorited && (
                                  <Heart className="h-4 w-4 text-red-500 fill-current" />
                                )}
                                <span>
                                  {mine.name} (
                                  {mine.type === "gold"
                                    ? "Thượng"
                                    : mine.type === "silver"
                                    ? "Trung"
                                    : "Hạ"}
                                  )
                                </span>
                              </div>
                            </SelectItem>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 hover:bg-transparent"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavoriteMine(mine.id, mine.isFavorited || false);
                            }}
                          >
                            <Heart
                              className={`h-4 w-4 ${
                                mine.isFavorited
                                  ? "text-red-500 fill-current"
                                  : "text-gray-400 hover:text-red-500"
                              }`}
                            />
                          </Button>
                        </div>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Favorite Toggle Section */}
              {editForm.mineId && editForm.mineId !== "none" && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center gap-2">
                    <Heart
                      className={`h-5 w-5 ${
                        mines.find(m => m.id.toString() === editForm.mineId)?.isFavorited
                          ? "text-red-500 fill-current"
                          : "text-gray-400"
                      }`}
                    />
                    <span className="text-sm font-medium">
                      {mines.find(m => m.id.toString() === editForm.mineId)?.name}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const mine = mines.find(m => m.id.toString() === editForm.mineId);
                      if (mine) {
                        toggleFavoriteMine(mine.id, mine.isFavorited || false);
                      }
                    }}
                    className="flex items-center gap-2"
                  >
                    <Heart
                      className={`h-4 w-4 ${
                        mines.find(m => m.id.toString() === editForm.mineId)?.isFavorited
                          ? "text-red-500 fill-current"
                          : "text-gray-400"
                      }`}
                    />
                    {mines.find(m => m.id.toString() === editForm.mineId)?.isFavorited
                      ? "Bỏ yêu thích"
                      : "Thêm yêu thích"}
                  </Button>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">Thời gian bắt đầu</Label>
                  <Input
                    id="startTime"
                    value={editForm.startTime}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        startTime: e.target.value,
                      }))
                    }
                    placeholder="HH:MM (vd: 08:00)"
                    pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">Thời gian kết thúc</Label>
                  <Input
                    id="endTime"
                    value={editForm.endTime}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        endTime: e.target.value,
                      }))
                    }
                    placeholder="HH:MM (vd: 18:00)"
                    pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="mineType">Loại nhận thưởng</Label>
                <Select
                  value={editForm.mineType}
                  onValueChange={(value) =>
                    setEditForm((prev) => ({
                      ...prev,
                      mineType: value as "full" | "max" | "min",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại nhận thưởng" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="min">
                      Nhận sớm nhất có thể (mỗi phút)
                    </SelectItem>
                    <SelectItem value="max">Nhận lâu nhất có thể</SelectItem>
                    <SelectItem value="full">Nhận khi đạt tối đa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="availableBuffAmount">Buff Amount</Label>
                <Input
                  id="availableBuffAmount"
                  type="number"
                  min="0"
                  value={editForm.availableBuffAmount}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      availableBuffAmount: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="flex justify-end gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditDialogOpen(false)}
                    >
                      Hủy
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Đóng dialog và hủy thay đổi</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={handleSaveEdit}>Lưu</Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Lưu thông tin khoáng mạch</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isBatchMineDialogOpen}
          onOpenChange={setIsBatchMineDialogOpen}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Cập nhật khoáng mạch hàng loạt</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-sm text-gray-600 mb-4">
                Đang cập nhật cho {selectedAccounts.length} tài khoản đã chọn
              </div>
              <div>
                <Label htmlFor="batchMineId">Khoáng mạch</Label>
                <Select
                  value={batchMineForm.mineId}
                  onValueChange={(value) =>
                    setBatchMineForm((prev) => ({ ...prev, mineId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn khoáng mạch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Không chọn</SelectItem>
                    {mines
                      .sort((a, b) => {
                        // Sort by favorite status first, then by peaceful status
                        if (a.isFavorited && !b.isFavorited) return -1;
                        if (!a.isFavorited && b.isFavorited) return 1;
                        if (a.isPeaceful && !b.isPeaceful) return 1;
                        if (!a.isPeaceful && b.isPeaceful) return -1;
                        return a.name.localeCompare(b.name);
                      })
                      .map((mine) => (
                        <div key={mine.id} className="flex items-center justify-between w-full px-2 py-1.5 hover:bg-accent hover:text-accent-foreground cursor-pointer">
                          <div className="flex items-center gap-2 flex-1">
                            <SelectItem
                              value={mine.id.toString()}
                              className={`${mine.isPeaceful && "font-bold"} flex-1 border-none bg-transparent p-0 h-auto cursor-pointer`}
                            >
                              <div className="flex items-center gap-2">
                                {mine.isFavorited && (
                                  <Heart className="h-4 w-4 text-red-500 fill-current" />
                                )}
                                <span>
                                  {mine.name} (
                                  {mine.type === "gold"
                                    ? "Thượng"
                                    : mine.type === "silver"
                                    ? "Trung"
                                    : "Hạ"}
                                  )
                                </span>
                              </div>
                            </SelectItem>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 hover:bg-transparent"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavoriteMine(mine.id, mine.isFavorited || false);
                            }}
                          >
                            <Heart
                              className={`h-4 w-4 ${
                                mine.isFavorited
                                  ? "text-red-500 fill-current"
                                  : "text-gray-400 hover:text-red-500"
                              }`}
                            />
                          </Button>
                        </div>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="batchStartTime">Thời gian bắt đầu</Label>
                  <Input
                    id="batchStartTime"
                    value={batchMineForm.startTime}
                    onChange={(e) =>
                      setBatchMineForm((prev) => ({
                        ...prev,
                        startTime: e.target.value,
                      }))
                    }
                    placeholder="HH:MM (vd: 08:00)"
                    pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
                  />
                </div>
                <div>
                  <Label htmlFor="batchEndTime">Thời gian kết thúc</Label>
                  <Input
                    id="batchEndTime"
                    value={batchMineForm.endTime}
                    onChange={(e) =>
                      setBatchMineForm((prev) => ({
                        ...prev,
                        endTime: e.target.value,
                      }))
                    }
                    placeholder="HH:MM (vd: 18:00)"
                    pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="batchMineType">Loại nhận thưởng</Label>
                <Select
                  value={batchMineForm.mineType}
                  onValueChange={(value) =>
                    setBatchMineForm((prev) => ({
                      ...prev,
                      mineType: value as "full" | "max" | "min",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại nhận thưởng" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="min">
                      Nhận sớm nhất có thể (mỗi phút)
                    </SelectItem>
                    <SelectItem value="max">Nhận lâu nhất có thể</SelectItem>
                    <SelectItem value="full">Nhận khi đạt tối đa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="batchAvailableBuffAmount">Buff Amount</Label>
                <Input
                  id="batchAvailableBuffAmount"
                  type="number"
                  min="0"
                  value={batchMineForm.availableBuffAmount}
                  onChange={(e) =>
                    setBatchMineForm((prev) => ({
                      ...prev,
                      availableBuffAmount: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="flex justify-end gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={() => setIsBatchMineDialogOpen(false)}
                    >
                      Hủy
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Đóng dialog và hủy cập nhật hàng loạt</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={handleBatchMineUpdate}>
                      Cập nhật {selectedAccounts.length} tài khoản
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Cập nhật thông tin khoáng mạch cho tất cả tài khoản đã
                      chọn
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
