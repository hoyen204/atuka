"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Edit, Plus, Trash2, Lock, ShieldX, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useResponsive } from "@/hooks/useResponsive";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PaginationComponent } from "@/components/ui/pagination";
import { Loading } from "@/components/ui/loading";
import { AccessDenied } from "@/components/ui/access-denied";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  UserDTO,
  UsersResponse,
  UpdateUserLicenseRequest,
  LicenseType,
} from "@/models/types";

export default function UserManagementPage() {
  const {
    user: currentUser,
    isAuthenticated,
    isLoading: authLoading,
    isMounted,
  } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>("");
  const [isCompactView, setIsCompactView] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserDTO | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showBanModal, setShowBanModal] = useState<boolean>(false);
  const [userToBan, setUserToBan] = useState<UserDTO | null>(null);
  const [licenseType, setLicenseType] = useState<LicenseType>("FREE");
  const [licenseExpired, setLicenseExpired] = useState<string>("");
  const { isMobile, isTablet } = useResponsive();

  // Check admin access
  useEffect(() => {
    if (isMounted && !authLoading) {
      if (!isAuthenticated) {
        router.push("/login");
        return;
      }

      if (!currentUser?.is_admin) {
        router.push("/dashboard");
        return;
      }
    }
  }, [isMounted, authLoading, isAuthenticated, currentUser, router]);

  useEffect(() => {
    // Only fetch data if user is admin
    if (currentUser?.is_admin) {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(searchTerm && { search: searchTerm }),
      });

      fetch(`/api/users?${params}`)
        .then((res) => res.json())
        .then((data: UsersResponse) => {
          setUsers(data.users);
          setTotal(data.total);
          setTotalPages(Math.ceil(data.total / pageSize));
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [page, pageSize, searchTerm, currentUser]);

  const handleSearch = () => {
    setSearchTerm(searchInput);
    setPage(1);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearchTerm("");
    setPage(1);
  };

  const openEditModal = (user: UserDTO) => {
    setSelectedUser(user);
    setLicenseType(user.licenseType);
    setLicenseExpired(
      user.licenseExpired ? user.licenseExpired.slice(0, 10) : ""
    );
    setShowModal(true);
  };

  const handleUpdateLicense = async () => {
    if (!selectedUser) return;

    const requestBody: UpdateUserLicenseRequest = {
      licenseType,
      licenseExpired: licenseExpired || undefined,
    };

    await fetch(`/api/users/${selectedUser.zaloId}/license`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });
    setShowModal(false);
    setSelectedUser(null);
    setLicenseType("FREE");
    setLicenseExpired("");

    // Refresh data
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      ...(searchTerm && { search: searchTerm }),
    });

    fetch(`/api/users?${params}`)
      .then((res) => res.json())
      .then((data: UsersResponse) => {
        setUsers(data.users);
        setTotal(data.total);
        setTotalPages(Math.ceil(data.total / pageSize));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const handleBanUser = (zaloId: string) => {
    const user = users.find((u) => u.zaloId === zaloId);
    if (!user) return;

    setUserToBan(user);
    setShowBanModal(true);
  };

  const confirmBanUser = async () => {
    if (!userToBan) return;

    const newBannedStatus = !userToBan.banned;

    try {
      const response = await fetch(`/api/users/${userToBan.zaloId}/ban`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ banned: newBannedStatus }),
      });

      if (response.ok) {
        setUsers(
          users.map((u) =>
            u.zaloId === userToBan.zaloId
              ? { ...u, banned: newBannedStatus }
              : u
          )
        );
      }
    } catch (error) {
      console.error("Error updating user ban status:", error);
    }

    setShowBanModal(false);
    setUserToBan(null);
  };

  const getLicenseBadgeVariant = (licenseType: string) => {
    switch (licenseType) {
      case "PRO":
        return "default";
      case "BASIC":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getStatusBadgeVariant = (banned: boolean) => {
    return banned ? "destructive" : "default";
  };

  const getExpiryBadgeVariant = (licenseExpired: string | null) => {
    if (!licenseExpired) return "secondary";
    return new Date(licenseExpired) > new Date() ? "default" : "destructive";
  };

  const getActiveUsersCount = () => {
    return users.filter((user) => !user.banned).length;
  };

  const getBannedUsersCount = () => {
    return users.filter((user) => user.banned).length;
  };

  const getProUsersCount = () => {
    return users.filter((user) => user.licenseType === "PRO").length;
  };

  // Show loading while checking authentication
  if (!isMounted || authLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loading size="lg" text="Đang kiểm tra quyền truy cập..." />
      </div>
    );
  }

  // Show access denied if not admin
  if (!currentUser?.is_admin) {
    return (
      <AccessDenied
        title="Truy cập bị từ chối"
        message="Bạn không có quyền truy cập vào trang quản lý người dùng. Chỉ admin mới có thể truy cập tính năng này."
        onGoBack={() => router.push("/dashboard")}
        backButtonText="Quay về Dashboard"
      />
    );
  }

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col p-6">
        <Card className="flex-1 flex flex-col overflow-hidden hover:shadow-lg transition-all duration-300">
          <CardHeader className="hover:bg-accent/10 transition-colors duration-200 rounded-t-xl flex-shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Danh sách người dùng</CardTitle>
                <CardDescription>
                  Tổng cộng {total.toLocaleString()} người dùng trong hệ thống
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Tìm kiếm người dùng..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pl-10 hover:border-primary/50 transition-colors focus:border-primary"
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  className="flex items-center gap-2 hover:gap-3 transition-all duration-200"
                >
                  Tìm kiếm
                </Button>
                {searchTerm && (
                  <Button
                    variant="outline"
                    onClick={clearSearch}
                    className="hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    Xóa
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          {!isMobile && (
            <CardContent className="flex-1 overflow-y-auto flex flex-col">
              {/* Thanh thông tin tóm tắt */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md mb-4 flex-shrink-0">
                <div className="flex items-center gap-6">
                  <div className="text-sm">
                    <span className="font-medium">Tổng người dùng:</span>{" "}
                    <span className="text-blue-600">
                      {total.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Hoạt động:</span>{" "}
                    <span className="text-green-600">
                      {getActiveUsersCount().toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Bị khóa:</span>{" "}
                    <span className="text-red-600">
                      {getBannedUsersCount().toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">PRO users:</span>{" "}
                    <span className="text-purple-600">
                      {getProUsersCount().toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Chế độ hiển thị: {isCompactView ? "Thu gọn" : "Mở rộng"}
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-12 flex-1">
                  <Loading size="lg" text="Đang tải dữ liệu..." />
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12 flex-1">
                  <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">
                    {searchTerm
                      ? "Không tìm thấy người dùng nào"
                      : "Không có người dùng nào"}
                  </p>
                  {searchTerm && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Thử tìm kiếm với từ khóa khác
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <div className="rounded-md border flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-auto">
                      <Table className={isCompactView ? "text-sm" : ""}>
                        <TableHeader className="sticky top-0 bg-white z-10">
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="font-semibold">Tên</TableHead>
                            <TableHead className="font-semibold">
                              Email
                            </TableHead>
                            <TableHead className="font-semibold">Gói</TableHead>
                            <TableHead className="font-semibold">
                              Hạn sử dụng
                            </TableHead>
                            <TableHead className="font-semibold">
                              Trạng thái
                            </TableHead>
                            <TableHead className="font-semibold w-20">
                              Thao tác
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {users.map((user) => (
                            <TableRow
                              key={user.zaloId}
                              className={`hover:bg-accent/50 transition-all duration-200 hover:shadow-sm group ${
                                isCompactView ? "h-12" : ""
                              }`}
                            >
                              <TableCell
                                className={`font-medium group-hover:text-primary transition-colors ${
                                  isCompactView ? "py-2" : ""
                                }`}
                              >
                                {user.name}
                              </TableCell>
                              <TableCell
                                className={`text-muted-foreground group-hover:text-foreground transition-colors ${
                                  isCompactView ? "py-2" : ""
                                }`}
                              >
                                {user.email || "Chưa cập nhật"}
                              </TableCell>
                              <TableCell
                                className={isCompactView ? "py-2" : ""}
                              >
                                <Badge
                                  variant={getLicenseBadgeVariant(
                                    user.licenseType
                                  )}
                                >
                                  {user.licenseType}
                                </Badge>
                              </TableCell>
                              <TableCell
                                className={isCompactView ? "py-2" : ""}
                              >
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge
                                      variant={getExpiryBadgeVariant(
                                        user.licenseExpired
                                      )}
                                    >
                                      {user.licenseExpired
                                        ? new Date(
                                            user.licenseExpired
                                          ).toLocaleDateString("vi-VN", {
                                            year: "numeric",
                                            month: "2-digit",
                                            day: "2-digit",
                                          })
                                        : "Vô hạn"}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      {user.licenseExpired
                                        ? new Date(user.licenseExpired) >
                                          new Date()
                                          ? "License còn hiệu lực"
                                          : "License đã hết hạn"
                                        : "License không có thời hạn"}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TableCell>
                              <TableCell
                                className={isCompactView ? "py-2" : ""}
                              >
                                <Badge
                                  variant={getStatusBadgeVariant(user.banned)}
                                >
                                  {user.banned ? "Bị khóa" : "Hoạt động"}
                                </Badge>
                              </TableCell>
                              <TableCell
                                className={`flex items-center gap-2 ${
                                  isCompactView ? "py-2" : ""
                                }`}
                              >
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openEditModal(user)}
                                      className="flex items-center gap-1 hover:gap-2 transition-all duration-200 hover:shadow-md"
                                    >
                                      <Edit className="w-3 h-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Chỉnh sửa thông tin license</p>
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleBanUser(user.zaloId)}
                                      className="flex items-center gap-1 hover:gap-2 transition-all duration-200 hover:shadow-md"
                                    >
                                      <Lock className="w-3 h-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      {user.banned
                                        ? "Mở khóa người dùng"
                                        : "Khóa người dùng"}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <div className="mt-4 flex-shrink-0">
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
                </>
              )}
            </CardContent>
          )}
        </Card>

        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5" />
                Cập nhật License
              </DialogTitle>
              <DialogDescription>
                Cập nhật thông tin license cho{" "}
                <strong>{selectedUser?.name}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="licenseType">Loại License</Label>
                <Select
                  value={licenseType}
                  onValueChange={(value) =>
                    setLicenseType(value as LicenseType)
                  }
                >
                  <SelectTrigger className="hover:border-primary/50 transition-colors">
                    <SelectValue placeholder="Chọn loại license" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRO">PRO</SelectItem>
                    <SelectItem value="BASIC">BASIC</SelectItem>
                    <SelectItem value="FREE">FREE</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="licenseExpired">Ngày hết hạn</Label>
                <Input
                  id="licenseExpired"
                  type="date"
                  value={licenseExpired}
                  onChange={(e) => setLicenseExpired(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                  className="hover:border-primary/50 transition-colors focus:border-primary"
                />
              </div>
            </div>

            <DialogFooter>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" onClick={() => setShowModal(false)}>
                    Hủy
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Đóng dialog và hủy thay đổi</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={handleUpdateLicense}>Cập nhật</Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Lưu thay đổi license</p>
                </TooltipContent>
              </Tooltip>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showBanModal} onOpenChange={setShowBanModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Xác nhận {userToBan?.banned ? "mở khóa" : "khóa"} người dùng
              </DialogTitle>
              <DialogDescription>
                Bạn có chắc chắn muốn {userToBan?.banned ? "mở khóa" : "khóa"}{" "}
                người dùng <strong>{userToBan?.name}</strong>?
                {!userToBan?.banned && (
                  <span className="block mt-2 text-destructive">
                    Người dùng sẽ không thể đăng nhập và sử dụng hệ thống.
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={() => setShowBanModal(false)}
                  >
                    Hủy
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Đóng dialog và hủy thao tác</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={userToBan?.banned ? "default" : "destructive"}
                    onClick={confirmBanUser}
                  >
                    {userToBan?.banned ? "Mở khóa" : "Khóa"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    Xác nhận {userToBan?.banned ? "mở khóa" : "khóa"} người dùng
                  </p>
                </TooltipContent>
              </Tooltip>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
