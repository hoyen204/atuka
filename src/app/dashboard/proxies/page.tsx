"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Server,
  Eye,
  EyeOff,
  TestTube,
  Loader2,
  CheckCircle,
  XCircle,
  Globe,
  Shield,
  Clock
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { PaginationComponent } from "@/components/ui/pagination";

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

  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [showDialog, setShowDialog] = useState(false);
  const [editingProxy, setEditingProxy] = useState<Proxy | null>(null);
  const [formData, setFormData] = useState<ProxyFormData>(initialFormData);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [testing, setTesting] = useState<number | null>(null);

  useEffect(() => {
    if (isMounted && !isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, isMounted, router]);

  const fetchProxies = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/proxies?${params}`);
      if (!response.ok) throw new Error("Failed to fetch proxies");

      const data = await response.json();
      setProxies(data.proxies);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách proxy",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, isAuthenticated, toast]);

  useEffect(() => {
    fetchProxies();
  }, [fetchProxies]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.host || !formData.port) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập đầy đủ host và port",
        variant: "destructive"
      });
      return;
    }

    const port = parseInt(formData.port);
    if (isNaN(port) || port < 1 || port > 65535) {
      toast({
        title: "Lỗi",
        description: "Port phải là số từ 1 đến 65535",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      const url = editingProxy ? `/api/proxies/${editingProxy.id}` : "/api/proxies";
      const method = editingProxy ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: formData.host,
          port: parseInt(formData.port),
          username: formData.username || null,
          password: formData.password || null,
          enabled: formData.enabled
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      toast({
        title: "Thành công",
        description: editingProxy ? "Cập nhật proxy thành công" : "Thêm proxy thành công"
      });

      setShowDialog(false);
      setEditingProxy(null);
      setFormData(initialFormData);
      fetchProxies();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra",
        variant: "destructive"
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

    try {
      const response = await fetch(`/api/proxies/${proxy.id}`, {
        method: "DELETE"
      });

      if (!response.ok) throw new Error("Failed to delete proxy");

      toast({
        title: "Thành công",
        description: "Xóa proxy thành công"
      });

      fetchProxies();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa proxy",
        variant: "destructive"
      });
    }
  };

  const handleTest = async (proxy: Proxy) => {
    setTesting(proxy.id);
    try {
      const response = await fetch("/api/proxies/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: proxy.host,
          port: proxy.port,
          username: proxy.username,
          password: proxy.password
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Test thành công",
          description: `Proxy hoạt động bình thường. IP: ${result.ip}`
        });
      } else {
        toast({
          title: "Test thất bại",
          description: result.message || "Proxy không hoạt động",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể test proxy",
        variant: "destructive"
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
    <div className="container mx-auto p-6 space-y-8 max-h-[calc(100vh)] overflow-y-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
            <Server className="w-10 h-10 text-primary" />
            Quản lý Proxy
          </h1>
          <p className="text-muted-foreground text-lg">Quản lý Proxy</p>
        </div>
        <Button onClick={openAddDialog} className="gap-2">
          <Plus className="w-4 h-4" />
          Thêm Proxy
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Danh sách Proxy
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : proxies.length === 0 ? (
            <div className="text-center py-12">
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Host</TableHead>
                    <TableHead>Port</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proxies.map((proxy) => (
                    <TableRow key={proxy.id}>
                      <TableCell className="font-medium">
                        {proxy.host}
                      </TableCell>
                      <TableCell>{proxy.port}</TableCell>
                      <TableCell>{proxy.username || "-"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={proxy.enabled ? "default" : "secondary"}
                        >
                          {proxy.enabled ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(proxy)}
                            className="gap-1"
                          >
                            <Edit className="w-3 h-3" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(proxy)}
                            className="gap-1 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="mt-6">
                  <PaginationComponent
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
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
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDialog(false)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {editingProxy ? "Cập nhật" : "Thêm"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}