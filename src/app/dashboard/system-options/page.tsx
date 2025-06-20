"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { useApiClient } from "@/lib/api.utils";
import { useResponsive } from "@/hooks/useResponsive";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Settings,
  Key,
  FileText,
  Loader2,
  Save,
  X
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PaginationComponent } from "@/components/ui/pagination";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Config {
  key: string;
  value: string;
}

interface ConfigFormData {
  key: string;
  value: string;
}

const initialFormData: ConfigFormData = {
  key: "",
  value: ""
};

export default function SystemOptionsPage() {
  const { user, isAuthenticated, isLoading, isMounted } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const api = useApiClient();
  const { isMobile, isTablet } = useResponsive();

  const [configs, setConfigs] = useState<Config[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isCompactView, setIsCompactView] = useState(false);

  const [showDialog, setShowDialog] = useState(false);
  const [editingConfig, setEditingConfig] = useState<Config | null>(null);
  const [formData, setFormData] = useState<ConfigFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isMounted && !isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, isMounted, router]);

  useEffect(() => {
    if (isMounted && !isLoading && isAuthenticated && !user?.is_admin) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, isMounted, user, router]);

  useEffect(() => {
    if (isMobile || isTablet) {
      setIsCompactView(true);
    }
  }, [isMobile, isTablet]);

  useEffect(() => {
    if (!isAuthenticated || !user?.is_admin) return;

    const fetchConfigs = async () => {
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: pageSize.toString(),
          ...(searchTerm && { search: searchTerm })
        });

        const data = await api.get(`/api/configs?${params}`, {
          loadingText: "Đang tải cấu hình hệ thống..."
        });
        setConfigs(data.configs);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      } catch (error) {
        toast({
          title: "Lỗi",
          description: "Không thể tải cấu hình hệ thống",
          variant: "destructive"
        });
      }
    };

    fetchConfigs();
  }, [currentPage, pageSize, searchTerm, isAuthenticated, user]);

  const refreshConfigs = async () => {
    if (!isAuthenticated || !user?.is_admin) return;

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        ...(searchTerm && { search: searchTerm })
      });

      const data = await api.get(`/api/configs?${params}`, {
        loadingText: "Đang tải cấu hình hệ thống..."
      });
      setConfigs(data.configs);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải cấu hình hệ thống",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.key || !formData.value) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập đầy đủ key và value",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      const configData = {
        key: formData.key.trim(),
        value: formData.value.trim()
      };

      if (editingConfig) {
        await api.put(`/api/configs/${editingConfig.key}`, { value: configData.value }, {
          loadingText: "Đang cập nhật cấu hình..."
        });
      } else {
        await api.post("/api/configs", configData, {
          loadingText: "Đang thêm cấu hình..."
        });
      }

      toast({
        title: "Thành công",
        description: editingConfig ? "Cập nhật cấu hình thành công" : "Thêm cấu hình thành công"
      });

      setShowDialog(false);
      setEditingConfig(null);
      setFormData(initialFormData);
      refreshConfigs();
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

  const handleEdit = (config: Config) => {
    setEditingConfig(config);
    setFormData({
      key: config.key,
      value: config.value
    });
    setShowDialog(true);
  };

  const handleDelete = async (config: Config) => {
    if (!confirm(`Bạn có chắc muốn xóa cấu hình "${config.key}"?`)) return;

    try {
      await api.delete(`/api/configs/${config.key}`, {
        loadingText: "Đang xóa cấu hình..."
      });

      toast({
        title: "Thành công",
        description: "Xóa cấu hình thành công"
      });

      refreshConfigs();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa cấu hình",
        variant: "destructive"
      });
    }
  };

  const openAddDialog = () => {
    setEditingConfig(null);
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

  if (!user.is_admin) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Settings className="h-16 w-16 text-muted-foreground mx-auto" />
          <h3 className="text-lg font-semibold">Truy cập bị từ chối</h3>
          <p className="text-muted-foreground">
            Bạn không có quyền truy cập vào trang này
          </p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col p-6">

        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Danh sách cấu hình
                </CardTitle>
                <CardDescription>
                  Tổng cộng {total.toLocaleString()} cấu hình trong hệ thống
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Tìm kiếm cấu hình..."
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
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-4 flex-shrink-0">
              <div className="flex items-center gap-6">
                <div className="text-sm">
                  <span className="font-medium">Tổng cấu hình:</span>{" "}
                  <span className="text-blue-600">
                    {total.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Chế độ hiển thị: {isCompactView ? "Thu gọn" : "Mở rộng"}
              </div>
            </div>

            {configs.length === 0 ? (
              <div className="text-center py-12 flex-1">
                <Settings className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Chưa có cấu hình nào</h3>
                <p className="text-muted-foreground mb-4">
                  Bắt đầu bằng cách thêm cấu hình đầu tiên
                </p>
                <Button onClick={openAddDialog} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Thêm cấu hình
                </Button>
              </div>
            ) : (
              <>
                <div className="rounded-md border flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-auto">
                    <Table className={isCompactView ? "text-sm" : ""}>
                      <TableHeader className="sticky top-0 bg-white z-10">
                        <TableRow>
                          <TableHead>Key</TableHead>
                          <TableHead>Value</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {configs.map((config) => (
                          <TableRow 
                            key={config.key}
                            className={isCompactView ? "h-12" : ""}
                          >
                            <TableCell className={`font-medium ${isCompactView ? "py-2" : ""}`}>
                              <div className="flex items-center gap-2">
                                <Key className="w-4 h-4 text-primary" />
                                <Badge variant="outline" className="max-w-[200px] truncate">
                                  {config.key}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className={isCompactView ? "py-2" : ""}>
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-green-600" />
                                <div className="max-w-[300px] truncate font-mono text-sm bg-gray-50 px-2 py-1 rounded">
                                  {config.value}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className={`text-right ${isCompactView ? "py-2" : ""}`}>
                              <div className="flex items-center justify-end gap-2">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEdit(config)}
                                      className="gap-1"
                                    >
                                      <Edit className="w-3 h-3" />
                                      Edit
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Chỉnh sửa cấu hình</p>
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDelete(config)}
                                      className="gap-1 text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      Delete
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Xóa cấu hình</p>
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

                <div className="flex-shrink-0 mt-4">
                  <PaginationComponent
                    currentPage={currentPage}
                    totalPages={totalPages}
                    pageSize={pageSize}
                    total={total}
                    onPageChange={setCurrentPage}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                {editingConfig ? "Chỉnh sửa cấu hình" : "Thêm cấu hình mới"}
              </DialogTitle>
              <DialogDescription>
                {editingConfig 
                  ? "Cập nhật giá trị cấu hình hệ thống" 
                  : "Thêm cấu hình mới cho hệ thống"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="key">Key</Label>
                <Input
                  id="key"
                  placeholder="Nhập key cấu hình..."
                  value={formData.key}
                  onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
                  disabled={!!editingConfig}
                  className="font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="value">Value</Label>
                <Textarea
                  id="value"
                  placeholder="Nhập giá trị cấu hình..."
                  value={formData.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                  rows={4}
                  className="font-mono"
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                  disabled={submitting}
                >
                  <X className="w-4 h-4 mr-2" />
                  Hủy
                </Button>
                <Button type="submit" disabled={submitting} className="gap-2">
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {editingConfig ? "Cập nhật" : "Thêm"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
} 