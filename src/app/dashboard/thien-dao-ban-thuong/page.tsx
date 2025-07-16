"use client";

import { AccountRewardsModal } from "@/components/thien-dao/AccountRewardsModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
import { useGlobalLoading } from "@/hooks/useGlobalLoading";
import { useToast } from "@/hooks/useToast";
import { Reward } from "@/lib/reward-extractor";
import {
  AlertCircle,
  Award,
  CheckCircle2,
  Gift,
  RefreshCw,
  Users,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useIsMobile } from "@/hooks/useResponsive";

interface Account {
  id: number;
  name: string;
}

interface AccountStatus {
  accountId: number;
  accountName: string;
  success: boolean;
  totalRewards: number;
  claimableRewards: number;
  claimedRewards: number;
  error?: string;
  rewards: Reward[];
}

interface ClaimDetail {
  id: string;
  title: string;
  success: boolean;
  message: string;
  reward?: any;
  error?: string;
}

interface ClaimResult {
  accountId: number;
  accountName: string;
  success: boolean;
  claimed: number;
  total: number;
  details: ClaimDetail[];
  error: string | null;
}

const ThienDaoBanThuongPage = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountStatuses, setAccountStatuses] = useState<AccountStatus[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<AccountStatus[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [accountsPerPage, setAccountsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortOrder, setSortOrder] = useState("asc");
  const [totalAccounts, setTotalAccounts] = useState(0);

  const [selectedAccountForModal, setSelectedAccountForModal] =
    useState<AccountStatus | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nonces, setNonces] = useState<Record<string, string>>({});

  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchResults, setBatchResults] = useState<ClaimResult[]>([]);
  const [isBatchLoading, setIsBatchLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const { setLoading } = useGlobalLoading();
    const { toast } = useToast();
    const isMobile = useIsMobile();
  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true, "Đang tải danh sách tài khoản...");
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: accountsPerPage.toString(),
      });

      if (currentPage > 1) {
        params.set("cursor", accounts[accounts.length - 1].id.toString());
      }
      const res = await fetch(`/api/accounts?${params.toString()}`);
      const data = await res.json();
      if (data && Array.isArray(data.accounts)) {
        setAccounts(data.accounts);
        setTotalAccounts(data.total);
      } else {
        setAccounts([]); // Set to empty array on failure
        console.error(
          "Failed to fetch accounts or data is not an array:",
          data
        );
      }
    } catch (error) {
      setAccounts([]);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách tài khoản.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [setLoading, toast, currentPage]);

  const fetchAccountStatuses = useCallback(async () => {
    if (accounts.length === 0) return;
    setLoading(true, "Đang kiểm tra trạng thái phần thưởng...");
    try {
      const response = await fetch("/api/thien-dao-ban-thuong/status", {
        method: "POST",
        body: JSON.stringify({
          accountIds: accounts.map((a) => a.id),
        }),
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setAccountStatuses(data.data);
      } else {
        setAccountStatuses([]);
        console.error(
          "Failed to fetch statuses or data is not an array:",
          data
        );
      }
    } catch (error) {
      console.error("Error fetching account statuses:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải trạng thái phần thưởng.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [accounts, setLoading, toast]);

  const fetchSingleAccountStatus = useCallback(async (accountId: number) => {
    try {
      const response = await fetch("/api/thien-dao-ban-thuong/status", {
        method: "POST",
        body: JSON.stringify({
          accountIds: [accountId],
        }),
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        const updatedAccountStatus = data.data[0];
        setAccountStatuses(prev => 
          prev.map(acc => 
            acc.accountId === accountId ? updatedAccountStatus : acc
          )
        );
      }
    } catch (error) {
      console.error("Error fetching single account status:", error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái tài khoản.",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    if (accounts.length > 0) {
      fetchAccountStatuses();
    }
  }, [accounts, fetchAccountStatuses]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchAccountStatuses();
      }, 30000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh, fetchAccountStatuses]);

  useEffect(() => {
    let filtered = accountStatuses;

    if (searchTerm) {
      filtered = filtered.filter((acc) =>
        acc.accountName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((acc) => {
        if (filterStatus === "claimable") return acc.claimableRewards > 0;
        if (filterStatus === "none")
          return acc.claimableRewards === 0 && acc.totalRewards > 0;
        if (filterStatus === "empty") return acc.totalRewards === 0;
        if (filterStatus === "error") return !acc.success;
        return true;
      });
    }
    // sort by id asc
    filtered.sort((a, b) => {
      if (sortOrder === "asc") {
        return a.accountId - b.accountId;
      } else {
        return b.accountId - a.accountId;
      }
    });

    setFilteredAccounts(filtered);
  }, [accountStatuses, searchTerm, filterStatus, sortOrder]);

  const openRewardsModal = async (accountId: number) => {
    const accountStatus = accountStatuses.find(
      (a) => a.accountId === accountId
    );
    if (!accountStatus) return;

    setLoading(
      true,
      `Đang tải phần thưởng cho ${accountStatus.accountName}...`
    );
    try {
      const res = await fetch(
        `/api/thien-dao-ban-thuong?accountId=${accountId}`
      );
      const data = await res.json();
      if (data.success) {
        const fullAccountStatus = {
          ...accountStatus,
          rewards: data.data.rewards,
        };
        setSelectedAccountForModal(fullAccountStatus);
        setNonces(data.data.nonces);
        setIsModalOpen(true);
      } else {
        toast({
          title: "Lỗi",
          description: data.error || "Không thể lấy danh sách phần thưởng.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.response?.data?.error || "Đã có lỗi xảy ra.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClaimReward = async (
    accountId: number,
    rewardId: string,
    rewardType: string = "normal"
  ) => {
    const nonce = nonces[rewardType] || nonces["default"];
    if (!nonce) {
      toast({
        title: "Lỗi",
        description: "Không tìm thấy mã bảo mật (nonce) để thực hiện.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true, "Đang nhận phần thưởng...");
    try {
      const res = await fetch("/api/thien-dao-ban-thuong", {
        method: "POST",
        body: JSON.stringify({
        accountId,
        rewardId,
        rewardType,
        nonce,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Thành công",
          description:
            data.data?.message || "Đã nhận phần thưởng thành công.",
        });

        if (isModalOpen && selectedAccountForModal?.accountId === accountId) {
          await openRewardsModal(accountId);
        }
        await fetchSingleAccountStatus(accountId);
      } else {
        toast({
          title: "Thất bại",
          description: data.data?.message || `Không thể nhận phần thưởng.`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.response?.data?.error || "Đã có lỗi xảy ra.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBatchClaim = async (accountId?: number) => {
    setIsBatchLoading(true);
    setBatchResults([]);
    setIsBatchModalOpen(true);

    if (isModalOpen) {
      setIsModalOpen(false);
    }

    try {
      const payload = accountId
        ? { accountIds: [accountId] }
        : { allAccounts: true };
      const res = await fetch("/api/thien-dao-ban-thuong/batch", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setBatchResults(data.data);
      } else {
        setBatchResults([]);
        console.error("Batch claim failed or data is not an array:", data);
        toast({
          title: "Lỗi Batch Claim",
          description: data.error || "Dữ liệu trả về không hợp lệ.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Lỗi Batch Claim",
        description:
          error.response?.data?.error || "Đã có lỗi nghiêm trọng xảy ra.",
        variant: "destructive",
      });
    } finally {
      setIsBatchLoading(false);
      if (accountId) {
        await fetchSingleAccountStatus(accountId);
      } else {
        await fetchAccountStatuses();
      }
    }
  };

  const StatusBadge = ({ status }: { status: AccountStatus }) => {
    if (!status.success) {
      return <Badge variant="destructive">Lỗi</Badge>;
    }
    if (status.claimableRewards > 0) {
      return (
        <Badge className="bg-green-600 hover:bg-green-700">
          Có thể nhận ({status.claimableRewards})
        </Badge>
      );
    }
    if (status.totalRewards > 0) {
      return <Badge variant="secondary">Hết</Badge>;
    }
    return <Badge variant="outline">Trống</Badge>;
  };
  const totalPages = Math.ceil(totalAccounts / accountsPerPage);

  const summary = {
    totalAccounts: accountStatuses.length,
    successfulAccounts: accountStatuses.filter((s) => s.success).length,
    claimable: accountStatuses.reduce((sum, s) => sum + s.claimableRewards, 0),
    error: accountStatuses.filter((s) => !s.success).length,
  };

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold">Thiên Đạo Ban Thưởng</h1>
      <Card className= {`min-h-[${isMobile ? "80vh" : "90vh"}] ${filteredAccounts.length === 0 ? "hidden" : ""}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Danh sách tài khoản</CardTitle>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-48"
              />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Lọc trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="claimable">Có thể nhận</SelectItem>
                  <SelectItem value="none">Không thể nhận</SelectItem>
                  <SelectItem value="empty">Không có quà</SelectItem>
                  <SelectItem value="error">Lỗi</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => fetchAccountStatuses()}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => handleBatchClaim()}
                disabled={isBatchLoading}
              >
                <Award className="mr-2 h-4 w-4" />
                Nhận tất cả
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table className="min-h-10/12">
            <TableHeader>
              <TableRow>
                <TableHead>Tài khoản</TableHead>
                <TableHead>Tổng</TableHead>
                <TableHead>Có thể nhận</TableHead>
                <TableHead>Đã nhận</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAccounts.map((acc) => (
                <TableRow key={acc.accountId}>
                  <TableCell className="font-medium">
                    {acc.accountName}
                  </TableCell>
                  <TableCell>{acc.totalRewards}</TableCell>
                  <TableCell className="text-green-600 font-bold">
                    {acc.claimableRewards}
                  </TableCell>
                  <TableCell>{acc.claimedRewards}</TableCell>
                  <TableCell>
                    <StatusBadge status={acc} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openRewardsModal(acc.accountId)}
                      >
                        Xem
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleBatchClaim(acc.accountId)}
                        disabled={acc.claimableRewards === 0 || isBatchLoading}
                        className="bg-green-500 hover:bg-green-600 text-white"
                      >
                        Nhận hết
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {totalPages > 0 && (
            <PaginationComponent
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={accountsPerPage}
              total={totalAccounts}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newPageSize) => {
                setAccountsPerPage(newPageSize);
                setCurrentPage(1);
              }}
            />
          )}
        </CardContent>
      </Card>

      <AccountRewardsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        account={selectedAccountForModal}
        onClaimSingle={async (accountId, rewardId) => {
          const reward = selectedAccountForModal?.rewards.find(
            (r) => r.id === rewardId
          );
          await handleClaimReward(
            accountId,
            rewardId,
            reward?.type || "normal"
          );
        }}
        onClaimAll={handleBatchClaim}
        onRefresh={openRewardsModal}
        isLoading={false}
      />

      {/* Batch Claim Modal */}
      <Dialog open={isBatchModalOpen} onOpenChange={setIsBatchModalOpen}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Kết quả nhận hàng loạt</DialogTitle>
            <DialogDescription>
              {isBatchLoading
                ? "Đang xử lý... vui lòng không đóng cửa sổ này."
                : "Đã hoàn tất xử lý các tài khoản."}
            </DialogDescription>
          </DialogHeader>
          {isBatchLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <RefreshCw className="h-16 w-16 animate-spin text-primary" />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto pr-4">
              <Accordion type="multiple" className="w-full">
                {batchResults.map((result) => (
                  <AccordionItem
                    key={result.accountId}
                    value={`item-${result.accountId}`}
                  >
                    <AccordionTrigger>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">
                            {result.accountName}
                          </span>
                          {result.success ? (
                            <Badge variant="default" className="bg-green-600">
                              Thành công
                            </Badge>
                          ) : (
                            <Badge variant="destructive">Thất bại</Badge>
                          )}
                        </div>
                        <Badge variant="secondary">
                          Đã nhận: {result.claimed}/{result.total}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      {result.error ? (
                        <div className="text-red-500 p-2 bg-red-50 rounded-md">
                          <p>
                            <strong>Lỗi nghiêm trọng:</strong> {result.error}
                          </p>
                        </div>
                      ) : (
                        <ul className="space-y-2">
                          {result.details.map((detail) => (
                            <li
                              key={detail.id}
                              className="flex items-start gap-3 p-2 rounded-md"
                            >
                              {detail.success ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500 mt-1" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-500 mt-1" />
                              )}
                              <div className="flex-1">
                                <p className="font-medium">{detail.title}</p>
                                <p
                                  className={`text-sm ${
                                    detail.success
                                      ? "text-gray-500"
                                      : "text-red-600"
                                  }`}
                                >
                                  {detail.message}
                                </p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ThienDaoBanThuongPage;
