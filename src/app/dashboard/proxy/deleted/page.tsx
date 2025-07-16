"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { useApiClient } from "@/lib/api.utils";
import {
  Trash2,
  Loader2,
  Globe,
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PaginationComponent } from "@/components/ui/pagination";

interface DeletedProxy {
  id: number;
  host: string;
  port: number;
  username?: string;
  password?: string;
  enabled: boolean;
  createdAt: string;
}

export default function DeletedProxiesPage() {
  const { user, isAuthenticated, isLoading, isMounted } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const api = useApiClient();

  const [proxies, setProxies] = useState<DeletedProxy[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isMounted && !isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, isMounted, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: pageSize.toString(),
          ...(searchTerm && { search: searchTerm }),
        });
        const data = await api.get(`/api/proxies/deleted?${params}`);
        setProxies(data.proxies);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      } catch (error: any) {
        toast({
          title: "Lỗi",
          description: error.message || "Không thể tải danh sách proxy",
          variant: "destructive",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, currentPage, pageSize, searchTerm]);

  const handlePermanentDelete = async (proxy: DeletedProxy) => {
    try {
      await api.delete(`/api/proxies/deleted?id=${proxy.id}`, {
        loadingText: "Đang xóa vĩnh viễn...",
      });
      toast({ title: "Thành công", description: "Đã xóa proxy" });
      setProxies((prev) => prev.filter((p) => p.id !== proxy.id));
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa proxy",
        variant: "destructive",
        type: "error",
      });
    }
  };

  if (!isMounted || isLoading || loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  return (
    <div className="h-full flex flex-col p-6">
      <div className="space-y-2 mb-6">
        <h1 className="text-4xl font-bold flex items-center gap-3">
          <Trash2 className="w-10 h-10 text-primary" />
          Proxy đã xóa
        </h1>
        <p className="text-muted-foreground text-lg">
          Danh sách proxy đã được xóa khỏi hệ thống
        </p>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Danh sách Proxy đã xóa</CardTitle>
              <CardDescription>
                Tổng cộng {total.toLocaleString()} proxy đã xóa
              </CardDescription>
            </div>
            <div className="relative w-80">
              <Input
                placeholder="Tìm kiếm proxy..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto flex flex-col">
          {proxies.length === 0 ? (
            <div className="text-center py-12 flex-1">
              <Trash2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Không có proxy</h3>
              <p className="text-muted-foreground mb-4">Không tìm thấy proxy</p>
            </div>
          ) : (
            <div className="rounded-md border flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-white z-10">
                    <TableRow>
                      <TableHead>Host</TableHead>
                      <TableHead>Port</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Ngày xóa</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {proxies.map((proxy) => (
                      <TableRow key={proxy.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-primary" />
                            {proxy.host}
                          </div>
                        </TableCell>
                        <TableCell>{proxy.port}</TableCell>
                        <TableCell>{proxy.username || "-"}</TableCell>
                        <TableCell>
                          {new Date(proxy.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handlePermanentDelete(proxy)}
                          >
                            Xóa vĩnh viễn
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
          <div className="mt-4">
            <PaginationComponent
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              total={total}
              onPageChange={(page) => setCurrentPage(page)}
              onPageSizeChange={(size) => setPageSize(size)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
