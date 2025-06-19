"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Edit, Plus, Trash2, Lock, ShieldX } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PaginationComponent } from "@/components/ui/pagination";
import { Loading } from "@/components/ui/loading";
import { AccessDenied } from "@/components/ui/access-denied";
import { UserDTO, UsersResponse, UpdateUserLicenseRequest, LicenseType } from "@/models/types";

const PAGE_SIZE = 10;

export default function UserManagementPage() {
  const { user: currentUser, isAuthenticated, isLoading: authLoading, isMounted } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<UserDTO | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showBanModal, setShowBanModal] = useState<boolean>(false);
  const [userToBan, setUserToBan] = useState<UserDTO | null>(null);
  const [licenseType, setLicenseType] = useState<LicenseType>("FREE");
  const [licenseExpired, setLicenseExpired] = useState<string>("");

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
      fetch(`/api/users?page=${page}&pageSize=${PAGE_SIZE}`)
        .then((res) => res.json())
        .then((data: UsersResponse) => {
          setUsers(data.users);
          setTotal(data.total);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [page, currentUser]);

  const openEditModal = (user: UserDTO) => {
    setSelectedUser(user);
    setLicenseType(user.licenseType);
    setLicenseExpired(user.licenseExpired ? user.licenseExpired.slice(0, 10) : "");
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
    fetch(`/api/users?page=${page}&pageSize=${PAGE_SIZE}`)
      .then((res) => res.json())
      .then((data: UsersResponse) => {
        setUsers(data.users);
        setTotal(data.total);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const handleBanUser = (zaloId: string) => {
    const user = users.find(u => u.zaloId === zaloId);
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
        setUsers(users.map(u => 
          u.zaloId === userToBan.zaloId 
            ? { ...u, banned: newBannedStatus }
            : u
        ));
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
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
          <User className="w-10 h-10 text-primary" />
          Quản lý User
        </h1>
        <p className="text-muted-foreground text-lg">Quản lý User</p>
      </div>
      <Card className="hover:shadow-lg transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardHeader className="hover:bg-accent/10 transition-colors duration-200 rounded-t-xl">
            <CardTitle>Danh sách người dùng</CardTitle>
            <CardDescription>
              Tổng cộng {total} người dùng trong hệ thống
            </CardDescription>
          </CardHeader>
          <div className="flex p-6">
            <Button className="flex items-center gap-2 hover:gap-3 transition-all duration-200">
              <Plus className="w-4 h-4" />
              Thêm mới
            </Button>
          </div>
        </div>

        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loading size="lg" text="Đang tải dữ liệu..." />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                Không có người dùng nào
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold">Tên</TableHead>
                    <TableHead className="font-semibold">Email</TableHead>
                    <TableHead className="font-semibold">Gói</TableHead>
                    <TableHead className="font-semibold">Hạn sử dụng</TableHead>
                    <TableHead className="font-semibold">Trạng thái</TableHead>
                    <TableHead className="font-semibold w-20">
                      Thao tác
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow
                      key={user.zaloId}
                      className="hover:bg-accent/50 transition-all duration-200 hover:shadow-sm group"
                    >
                      <TableCell className="font-medium group-hover:text-primary transition-colors">
                        {user.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground group-hover:text-foreground transition-colors">
                        {user.email || "Chưa cập nhật"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getLicenseBadgeVariant(user.licenseType)}
                        >
                          {user.licenseType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getExpiryBadgeVariant(user.licenseExpired)}
                        >
                          {user.licenseExpired
                            ? new Date(user.licenseExpired).toLocaleDateString(
                                "vi-VN",
                                {
                                  year: "numeric",
                                  month: "2-digit",
                                  day: "2-digit",
                                }
                              )
                            : "Vô hạn"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(user.banned)}>
                          {user.banned ? "Bị khóa" : "Hoạt động"}
                        </Badge>
                      </TableCell>
                      <TableCell className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(user)}
                          className="flex items-center gap-1 hover:gap-2 transition-all duration-200 hover:shadow-md"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBanUser(user.zaloId)}
                          className="flex items-center gap-1 hover:gap-2 transition-all duration-200 hover:shadow-md"
                        >
                          <Lock className="w-3 h-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between mt-6 pt-4 border-t hover:bg-accent/10 transition-colors duration-200 rounded-b-lg px-2">
                <PaginationComponent
                  currentPage={page}
                  totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
                  onPageChange={setPage}
                />
              </div>
            </>
          )}
        </CardContent>
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
                onValueChange={(value) => setLicenseType(value as LicenseType)}
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
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Hủy
            </Button>
            <Button onClick={handleUpdateLicense}>Cập nhật</Button>
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
              Bạn có chắc chắn muốn {userToBan?.banned ? "mở khóa" : "khóa"} người dùng{" "}
              <strong>{userToBan?.name}</strong>?
              {!userToBan?.banned && (
                <span className="block mt-2 text-destructive">
                  Người dùng sẽ không thể đăng nhập và sử dụng hệ thống.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBanModal(false)}>
              Hủy
            </Button>
            <Button 
              variant={userToBan?.banned ? "default" : "destructive"}
              onClick={confirmBanUser}
            >
              {userToBan?.banned ? "Mở khóa" : "Khóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
