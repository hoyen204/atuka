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
import { useToast } from "@/hooks/useToast";
import {
  ChevronDown,
  Copy,
  Download,
  Edit,
  Filter,
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
  availableBuffAmount: number;
  clanId?: string;
  clanName?: string;
  toggle: boolean;
  cultivation?: number;
  gem?: number;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
}

interface Mine {
  id: number;
  name: string;
  type: string;
  isPeaceful: boolean;
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
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [clanFilter, setClanFilter] = useState("all");
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isBatchMineDialogOpen, setIsBatchMineDialogOpen] = useState(false);
  const [selectedAccounts, setSelectedAccounts] = useState<number[]>([]);
  const { toast } = useToast();

  const [editForm, setEditForm] = useState({
    mineId: "",
    mineTimeRange: "",
    availableBuffAmount: 100,
  });

  const [batchMineForm, setBatchMineForm] = useState({
    mineId: "none",
    mineTimeRange: "",
    availableBuffAmount: 100,
  });

  const fetchMines = async () => {
    try {
      const response = await fetch("/api/mines");
      const data: MinesResponse = await response.json();
      console.log(data);

      if (response.ok) {
        setMines(data.mines);
      }
    } catch (error) {
      console.error("Error fetching mines:", error);
    }
  };

  const fetchClans = async () => {
    try {
      const response = await fetch("/api/accounts/clans");
      const data: ClansResponse = await response.json();

      if (response.ok) {
        setClans(data.clans);
      }
    } catch (error) {
      console.error("Error fetching clans:", error);
    }
  };

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        search,
      });

      if (clanFilter && clanFilter !== "all") {
        params.append("clanId", clanFilter);
      }

      const response = await fetch(`/api/accounts?${params}`);
      const data: AccountsResponse = await response.json();

      if (response.ok) {
        setAccounts(data.accounts);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        // Reset selected accounts when data changes
        setSelectedAccounts((prev) =>
          prev.filter((id) =>
            data.accounts.some((account) => account.id === id)
          )
        );
      } else {
        toast({
          title: "Lỗi",
          description: "Không thể tải danh sách tài khoản",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi tải dữ liệu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMines();
    fetchClans();
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [page, search, clanFilter]);

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Thành công",
        description: `Đã copy ${type} vào clipboard`,
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: `Không thể copy ${type}`,
        variant: "destructive",
      });
    }
  };

  const getMineNameById = (mineId: string | undefined) => {
    if (!mineId || mineId === "none") return "Chưa thiết lập";
    const mine = mines.find((m) => m.id.toString() === mineId);
    return mine
      ? `${mine.name} (${
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
      const response = await fetch("/api/accounts/batch", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountIds: selectedAccounts,
          updateData: { toggle: enable },
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Thành công",
          description: `Đã ${enable ? "kích hoạt" : "tạm dừng"} ${
            result.updatedCount
          } tài khoản`,
        });

        setSelectedAccounts([]);
        fetchAccounts();
      } else {
        toast({
          title: "Lỗi",
          description: result.error || "Có lỗi xảy ra khi cập nhật tài khoản",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi cập nhật tài khoản",
        variant: "destructive",
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
        "Tu vi",
        "Tinh thạch",
      ].join(","),
      ...selectedAccountsData.map((account) =>
        [
          account.id,
          account.name,
          account.cookie,
          account.clanName || "",
          getMineNameById(account.mineId),
          account.cultivation || 0,
          account.gem || 0,
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
    });
  };

  const handleBatchMineUpdate = async () => {
    try {
      let mineTimeRange = null;
      if (batchMineForm.mineTimeRange.trim()) {
        try {
          mineTimeRange = JSON.parse(batchMineForm.mineTimeRange);
        } catch (e) {
          toast({
            title: "Lỗi",
            description: "Định dạng mineTimeRange không hợp lệ (JSON)",
            variant: "destructive",
          });
          return;
        }
      }

      const response = await fetch("/api/accounts/batch", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountIds: selectedAccounts,
          updateData: {
            mineId: batchMineForm.mineId,
            mineTimeRange,
            availableBuffAmount: batchMineForm.availableBuffAmount,
          },
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Thành công",
          description: `Đã cập nhật khoáng mạch cho ${result.updatedCount} tài khoản`,
        });

        setIsBatchMineDialogOpen(false);
        setSelectedAccounts([]);
        fetchAccounts();
      } else {
        toast({
          title: "Lỗi",
          description: result.error || "Có lỗi xảy ra khi cập nhật khoáng mạch",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi cập nhật khoáng mạch",
        variant: "destructive",
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
    setEditForm({
      mineId: account.mineId || "none",
      mineTimeRange: account.mineTimeRange
        ? JSON.stringify(account.mineTimeRange)
        : "",
      availableBuffAmount: account.availableBuffAmount,
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingAccount) return;

    try {
      let mineTimeRange = null;
      if (editForm.mineTimeRange.trim()) {
        try {
          mineTimeRange = JSON.parse(editForm.mineTimeRange);
        } catch (e) {
          toast({
            title: "Lỗi",
            description: "Định dạng mineTimeRange không hợp lệ (JSON)",
            variant: "destructive",
          });
          return;
        }
      }

      const response = await fetch(`/api/accounts/${editingAccount.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mineId:
            editForm.mineId && editForm.mineId !== "none"
              ? editForm.mineId
              : null,
          mineTimeRange,
          availableBuffAmount: parseInt(
            editForm.availableBuffAmount.toString()
          ),
        }),
      });

      if (response.ok) {
        toast({
          title: "Thành công",
          description: "Đã cập nhật thông tin khoáng mạch",
        });
        setIsEditDialogOpen(false);
        fetchAccounts();
      } else {
        toast({
          title: "Lỗi",
          description: "Không thể cập nhật thông tin",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi cập nhật",
        variant: "destructive",
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

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Quản lý tài khoản</span>
            <Badge variant="secondary">{total} tài khoản</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Tìm kiếm theo tên, ID hoặc tông môn..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
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
          </div>

          {selectedAccounts.length > 0 && (
            <div className="flex items-center gap-4 mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-sm font-medium text-blue-700">
                Đã chọn {selectedAccounts.length} tài khoản
              </span>
              <Select onValueChange={handleBatchAction}>
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedAccounts([])}
              >
                Bỏ chọn tất cả
              </Button>
            </div>
          )}

          <div className="rounded-md">
            <Table className="">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        accounts.length > 0 &&
                        selectedAccounts.length === accounts.length
                      }
                      onCheckedChange={handleSelectAll}
                      aria-label="Chọn tất cả"
                    />
                  </TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Tên tài khoản</TableHead>
                  <TableHead>Tông môn</TableHead>
                  <TableHead>Khoáng mạch</TableHead>
                  <TableHead>Thời gian đào</TableHead>
                  <TableHead>Buff Amount</TableHead>
                  <TableHead>Tu vi</TableHead>
                  <TableHead>Tinh thạch</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8">
                      Đang tải...
                    </TableCell>
                  </TableRow>
                ) : accounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8">
                      Không có tài khoản nào
                    </TableCell>
                  </TableRow>
                ) : (
                  accounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedAccounts.includes(account.id)}
                          onCheckedChange={(checked) =>
                            handleSelectAccount(account.id, checked as boolean)
                          }
                          aria-label={`Chọn tài khoản ${account.name}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {account.id}
                      </TableCell>
                      <TableCell>{account.name}</TableCell>
                      <TableCell>
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
                      <TableCell>
                        <span
                          className={
                            account.mineId ? "text-gray-900" : "text-gray-400"
                          }
                        >
                          {getMineNameById(account.mineId)}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-32 truncate">
                        {formatMineTimeRange(account.mineTimeRange)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {account.availableBuffAmount}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {account.cultivation
                          ? account.cultivation.toLocaleString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {account.gem ? account.gem.toLocaleString() : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={account.toggle ? "default" : "secondary"}
                        >
                          {account.toggle ? "Hoạt động" : "Tạm dừng"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              copyToClipboard(account.cookie, "cookie")
                            }
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditAccount(account)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <PaginationComponent
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </CardContent>
      </Card>

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
                    .sort((a, b) => (a.isPeaceful ? 1 : -1))
                    .map((mine) => (
                      <SelectItem
                        key={mine.id}
                        value={mine.id.toString()}
                        className={`${mine.isPeaceful && "font-bold"}`}
                      >
                        {mine.name} (
                        {mine.type === "gold"
                          ? "Thượng"
                          : mine.type === "silver"
                          ? "Trung"
                          : "Hạ"}
                        )
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="mineTimeRange">Thời gian đào (JSON)</Label>
              <Input
                id="mineTimeRange"
                value={editForm.mineTimeRange}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    mineTimeRange: e.target.value,
                  }))
                }
                placeholder='{"start": "08:00", "end": "18:00"}'
              />
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
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button onClick={handleSaveEdit}>Lưu</Button>
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
                  {mines.map((mine) => (
                    <SelectItem
                      key={mine.id}
                      value={mine.id.toString()}
                      className={`${mine.isPeaceful && "font-bold"}`}
                    >
                      {mine.name} (
                      {mine.type === "gold"
                        ? "Thượng"
                        : mine.type === "silver"
                        ? "Trung"
                        : "Hạ"}
                      )
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="batchMineTimeRange">Thời gian đào (JSON)</Label>
              <Input
                id="batchMineTimeRange"
                value={batchMineForm.mineTimeRange}
                onChange={(e) =>
                  setBatchMineForm((prev) => ({
                    ...prev,
                    mineTimeRange: e.target.value,
                  }))
                }
                placeholder='{"start": "08:00", "end": "18:00"}'
              />
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
              <Button
                variant="outline"
                onClick={() => setIsBatchMineDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button onClick={handleBatchMineUpdate}>
                Cập nhật {selectedAccounts.length} tài khoản
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
