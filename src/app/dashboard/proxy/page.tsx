"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { useApiClient } from "@/lib/api.utils";
import { useResponsive } from "@/hooks/useResponsive";
import {
  Plus,
  Search,
  Trash2,
  Server,
  Eye,
  EyeOff,
  TestTube,
  Loader2,
  Globe,
  Shield,
  Copy,
  ChevronDown
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { PaginationComponent } from "@/components/ui/pagination";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Proxy {
  id: number;
  host: string;
  port: number;
  username?: string;
  password?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProxyFormData {
  host: string;
  port: string;
  username: string;
  password: string;
  enabled: boolean;
}

const initialFormData: ProxyFormData = {
  host: "",
  port: "",
  username: "",
  password: "",
  enabled: true
};

export default function ProxiesPage() {
  const { user, isAuthenticated, isLoading, isMounted } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const api = useApiClient();
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isCompactView, setIsCompactView] = useState(false);

  const [showDialog, setShowDialog] = useState(false);
  const [editingProxy, setEditingProxy] = useState<Proxy | null>(null);
  const [formData, setFormData] = useState<ProxyFormData>(initialFormData);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [testing, setTesting] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isMounted && !isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, isMounted, router]);

  // Auto set compact view on mobile/tablet
  useEffect(() => {
    if (isMobile || isTablet) {
      setIsCompactView(true);
    }
  }, [isMobile, isTablet]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchProxies = async () => {
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: pageSize.toString(),
          ...(searchTerm && { search: searchTerm })
        });

        const data = await api.get(`/api/proxies?${params}`, {
          loadingText: "Đang tải danh sách proxy..."
        });
        setProxies(data.proxies);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      } catch (error) {
        toast({
          title: "Lỗi",
          description: "Không thể tải danh sách proxy",
          variant: "destructive",
          type: "error"
        });
      }
    };

    fetchProxies();
  }, [currentPage, pageSize, searchTerm, isAuthenticated]);

  const refreshProxies = async () => {
    if (!isAuthenticated) return;

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        ...(searchTerm && { search: searchTerm })
      });

      const data = await api.get(`/api/proxies?${params}`, {
        loadingText: "Đang tải danh sách proxy..."
      });
      setProxies(data.proxies);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách proxy",
        variant: "destructive",
        type: "error"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.host || !formData.port) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập đầy đủ host và port",
        variant: "destructive",
        type: "error"
      });
      return;
    }

    const port = parseInt(formData.port);
    if (isNaN(port) || port < 1 || port > 65535) {
      toast({
        title: "Lỗi",
        description: "Port phải là số từ 1 đến 65535",
        variant: "destructive",
        type: "error"
      });
      return;
    }

    setSubmitting(true);
    try {
      const proxyData = {
        host: formData.host,
        port: parseInt(formData.port),
        username: formData.username || null,
        password: formData.password || null,
        enabled: formData.enabled
      };

      if (editingProxy) {
        await api.put(`/api/proxies/${editingProxy.id}`, proxyData, {
          loadingText: "Đang cập nhật proxy..."
        });
      } else {
        await api.post("/api/proxies", proxyData, {
          loadingText: "Đang thêm proxy..."
        });
      }

      toast({
        title: "Thành công",
        description: editingProxy ? "Cập nhật proxy thành công" : "Thêm proxy thành công",
        type: "success"
      });

      setShowDialog(false);
      setEditingProxy(null);
      setFormData(initialFormData);
      refreshProxies();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra",
        variant: "destructive",
        type: "error"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (proxy: Proxy) => {
    setEditingProxy(proxy);
    setFormData({
      host: proxy.host,
      port: proxy.port.toString(),
      username: proxy.username || "",
      password: proxy.password || "",
      enabled: proxy.enabled
    });
    setShowDialog(true);
  };

  const handleDelete = async (proxy: Proxy) => {
    if (!confirm(`Bạn có chắc muốn xóa proxy ${proxy.host}:${proxy.port}?`)) return;

    setDeleting(true);
    try {
      await api.delete(`/api/proxies/${proxy.id}`, {
        loadingText: "Đang xóa proxy..."
      });

      toast({
        title: "Thành công",
        description: "Xóa proxy thành công"
      });

      refreshProxies();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa proxy",
        variant: "destructive",
        type: "error"
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleTest = async (proxy: Proxy) => {
    setTesting(proxy.id);
    try {
      const result = await api.post("/api/proxies/test", {
        host: proxy.host,
        port: proxy.port,
        username: proxy.username,
        password: proxy.password
      }, {
        loadingText: "Đang test proxy..."
      });
      
      if (result.success) {
        toast({
          title: "Test thành công",
          description: `Proxy hoạt động bình thường. IP: ${result.ip}`
        });
      } else {
        toast({
          title: "Test thất bại",
          description: result.message || "Proxy không hoạt động",
          variant: "destructive",
          type: "error"
        });
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể test proxy",
        variant: "destructive",
        type: "error"
      });
    } finally {
      setTesting(null);
    }
  };

  const openAddDialog = () => {
    setEditingProxy(null);
    setFormData(initialFormData);
    setShowDialog(true);
  };

  const getActiveProxiesCount = () => {
    return proxies.filter(proxy => proxy.enabled).length;
  };

  const getInactiveProxiesCount = () => {
    return proxies.filter(proxy => !proxy.enabled).length;
  };

  const isAllSelected = selectedIds.length > 0 && selectedIds.length === proxies.length;
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(proxies.map(p => p.id));
    }
  };
  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };
  const copySelected = () => {
    if (selectedIds.length === 0) return;
    const lines = proxies
      .filter(p => selectedIds.includes(p.id))
      .map(p => {
        if (p.username) {
          return `${p.host}:${p.port}:${p.username}:${p.password || ""}`;
        }
        return `${p.host}:${p.port}`;
      });
    navigator.clipboard.writeText(lines.join("\n"));
    toast({ title: "Thành công", description: `Đã copy ${lines.length} proxy` });
  };
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setDeleting(true);
    try {
      await Promise.all(
        selectedIds.map(id => api.delete(`/api/proxies/${id}`, { showLoading: false }))
      );
      toast({ title: "Thành công", description: "Đã xóa proxy đã chọn" });
      setSelectedIds([]);
      refreshProxies();
    } catch (error: any) {
      toast({ title: "Lỗi", description: error.message || "Không thể xóa" , variant: "destructive", type: "error"});
    } finally {
      setDeleting(false);
    }
  };

  if (!isMounted || isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col p-6">
        <div className="flex items-center justify-between flex-shrink-0 mb-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
              <Server className="w-10 h-10 text-primary" />
              Quản lý Proxy
            </h1>
            <p className="text-muted-foreground text-lg">Quản lý Proxy</p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={openAddDialog} className="gap-2">
                <Plus className="w-4 h-4" />
                Thêm Proxy
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Thêm proxy mới vào hệ thống</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Danh sách Proxy
                </CardTitle>
                <CardDescription>
                  Tổng cộng {total.toLocaleString()} proxy trong hệ thống
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Tìm kiếm proxy..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
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
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto flex flex-col">
            {/* Thanh thông tin tóm tắt */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md mb-4 flex-shrink-0">
              <div className="flex items-center gap-6">
                <div className="text-sm">
                  <span className="font-medium">Tổng proxy:</span>{" "}
                  <span className="text-blue-600">
                    {total.toLocaleString()}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="font-medium">Đang hoạt động:</span>{" "}
                  <span className="text-green-600">
                    {getActiveProxiesCount().toLocaleString()}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="font-medium">Tạm dừng:</span>{" "}
                  <span className="text-red-600">
                    {getInactiveProxiesCount().toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Chế độ hiển thị: {isCompactView ? "Thu gọn" : "Mở rộng"}
              </div>
            </div>

            {selectedIds.length > 0 && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <span className="text-sm font-medium text-blue-800">
                  Đã chọn {selectedIds.length} proxy
                </span>
                <div className="flex gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                        <ChevronDown className="w-4 h-4 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => copySelected()}>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy proxy
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedIds([])}
                  >
                    Bỏ chọn tất cả
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleBulkDelete}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-1" />
                    )}
                    Xoá
                  </Button>
                </div>
              </div>
            )}

            {proxies.length === 0 ? (
              <div className="text-center py-12 flex-1">
                <Server className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Chưa có proxy nào</h3>
                <p className="text-muted-foreground mb-4">
                  Bắt đầu bằng cách thêm proxy đầu tiên
                </p>
                <Button onClick={openAddDialog} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Thêm Proxy
                </Button>
              </div>
            ) : (
              <>
                <div className="rounded-md border flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-hidden">
                    <Table className={isCompactView ? "text-sm" : ""}>
                      <TableHeader className="sticky top-0 bg-white z-10">
                        <TableRow>
                          <TableHead>
                            <Checkbox checked={isAllSelected} onCheckedChange={toggleSelectAll} />
                          </TableHead>
                          <TableHead>Host</TableHead>
                          <TableHead>Port</TableHead>
                          <TableHead>Username</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {proxies.map((proxy) => (
                          <TableRow 
                            key={proxy.id}
                            className={isCompactView ? "h-12" : ""}
                          >
                            <TableCell className={isCompactView ? "py-2" : ""}>
                              <Checkbox checked={selectedIds.includes(proxy.id)} onCheckedChange={() => toggleSelect(proxy.id)} />
                            </TableCell>
                            <TableCell className={`font-medium ${isCompactView ? "py-2" : ""}`}>
                              <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4 text-primary" />
                                {proxy.host}
                              </div>
                            </TableCell>
                            <TableCell className={isCompactView ? "py-2" : ""}>
                              <Badge variant="outline">
                                {proxy.port}
                              </Badge>
                            </TableCell>
                            <TableCell className={isCompactView ? "py-2" : ""}>
                              {proxy.username || "-"}
                            </TableCell>
                            <TableCell className={isCompactView ? "py-2" : ""}>
                              <Badge
                                variant={proxy.enabled ? "default" : "secondary"}
                              >
                                {proxy.enabled ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell className={`text-right ${isCompactView ? "py-2" : ""}`}>
                              <div className="flex items-center justify-end gap-2">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleTest(proxy)}
                                      disabled={testing === proxy.id}
                                      className="gap-1"
                                    >
                                      {testing === proxy.id ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <TestTube className="w-3 h-3" />
                                      )}
                                      Test
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Kiểm tra kết nối proxy</p>
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDelete(proxy)}
                                      className="gap-1 text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      Delete
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Xóa proxy khỏi hệ thống</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className="mt-4 flex-shrink-0">
                  <PaginationComponent
                    currentPage={currentPage}
                    totalPages={totalPages}
                    pageSize={pageSize}
                    total={total}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={(newPageSize) => {
                      setPageSize(newPageSize);
                      setCurrentPage(1);
                    }}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingProxy ? "Chỉnh sửa Proxy" : "Thêm Proxy mới"}
              </DialogTitle>
              <DialogDescription>
                {editingProxy
                  ? "Cập nhật thông tin proxy"
                  : "Nhập thông tin proxy để thêm vào hệ thống"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="host">Host *</Label>
                  <Input
                    id="host"
                    placeholder="192.168.1.1"
                    value={formData.host}
                    onChange={(e) =>
                      setFormData({ ...formData, host: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="port">Port *</Label>
                  <Input
                    id="port"
                    type="number"
                    placeholder="8080"
                    value={formData.port}
                    onChange={(e) =>
                      setFormData({ ...formData, port: e.target.value })
                    }
                    min="1"
                    max="65535"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Tùy chọn"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Tùy chọn"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enabled"
                  checked={formData.enabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, enabled: checked as boolean })
                  }
                />
                <Label htmlFor="enabled">Kích hoạt proxy</Label>
              </div>

              <DialogFooter>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowDialog(false)}
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
                    <Button type="submit" disabled={submitting}>
                      {submitting && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      {editingProxy ? "Cập nhật" : "Thêm"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{editingProxy ? "Lưu thay đổi proxy" : "Thêm proxy mới"}</p>
                  </TooltipContent>
                </Tooltip>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}