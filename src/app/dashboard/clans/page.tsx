"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Search, Shield, Crown, UserCheck } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PaginationComponent } from "@/components/ui/pagination";
import { Loading } from "@/components/ui/loading";
import { ClanDTO, ClansResponse } from "@/models/types";

const PAGE_SIZE = 10;

export default function ClanManagementPage() {
  const [clans, setClans] = useState<ClanDTO[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>("");

  const fetchClans = useCallback(async (pageNum: number, search: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        pageSize: PAGE_SIZE.toString(),
        ...(search && { search })
      });
      
      const response = await fetch(`/api/clans?${params}`);
      const data: ClansResponse = await response.json();
      
      setClans(data.clans);
      setTotal(data.total);
    } catch (error) {
      console.error("Error fetching clans:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClans(page, searchTerm);
  }, [page, searchTerm, fetchClans]);

  const handleSearch = () => {
    setSearchTerm(searchInput);
    setPage(1);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearchTerm("");
    setPage(1);
  };

  const getLevelBadgeVariant = (level: number) => {
    if (level >= 50) return "default";
    if (level >= 25) return "secondary";
    return "outline";
  };

  const getMembersBadgeVariant = (current: number, limit: number) => {
    const ratio = current / limit;
    if (ratio >= 0.9) return "destructive";
    if (ratio >= 0.7) return "secondary";
    return "default";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
          <Shield className="w-10 h-10 text-primary" />
          Quản lý Tông Môn
        </h1>
        <p className="text-muted-foreground text-lg">
          Xem và tìm kiếm thông tin các tông môn trong hệ thống
        </p>
      </div>

      <Card className="hover:shadow-lg transition-all duration-300">
        <CardHeader className="hover:bg-accent/10 transition-colors duration-200 rounded-t-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Danh sách tông môn</CardTitle>
              <CardDescription>
                Tổng cộng {total} tông môn trong hệ thống
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Tìm kiếm tông môn hoặc bang chủ..."
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
                <Search className="w-4 h-4" />
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

        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loading size="lg" text="Đang tải dữ liệu..." />
            </div>
          ) : clans.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                {searchTerm ? "Không tìm thấy tông môn nào" : "Không có tông môn nào"}
              </p>
              {searchTerm && (
                <p className="text-sm text-muted-foreground mt-2">
                  Thử tìm kiếm với từ khóa khác
                </p>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold">Tên tông môn</TableHead>
                    <TableHead className="font-semibold">Level</TableHead>
                    <TableHead className="font-semibold">Bang chủ</TableHead>
                    <TableHead className="font-semibold">Thành viên</TableHead>
                    <TableHead className="font-semibold">Hoạt động</TableHead>
                    <TableHead className="font-semibold">Tỷ lệ đầy</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clans.map((clan) => (
                    <TableRow
                      key={clan.id}
                      className="hover:bg-accent/50 transition-all duration-200 hover:shadow-sm group"
                    >
                      <TableCell className="font-medium group-hover:text-primary transition-colors">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-primary" />
                          {clan.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getLevelBadgeVariant(clan.level)}>
                          Level {clan.level}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground group-hover:text-foreground transition-colors">
                        <div className="flex items-center gap-2">
                          <Crown className="w-4 h-4 text-yellow-500" />
                          {clan.leader}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getMembersBadgeVariant(clan.memberCount, clan.memberLimit)}>
                          {clan.memberCount}/{clan.memberLimit}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-green-500" />
                          <span className="text-sm">
                            {clan.activeMembers} hoạt động
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              clan.memberCount / clan.memberLimit >= 0.9
                                ? "bg-destructive"
                                : clan.memberCount / clan.memberLimit >= 0.7
                                ? "bg-orange-500"
                                : "bg-primary"
                            }`}
                            style={{
                              width: `${Math.min(100, (clan.memberCount / clan.memberLimit) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground mt-1 block">
                          {Math.round((clan.memberCount / clan.memberLimit) * 100)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between mt-6 pt-4 border-t hover:bg-accent/10 transition-colors duration-200 rounded-b-lg px-2">
                <div className="text-sm text-muted-foreground">
                  Hiển thị {clans.length} trên {total} tông môn
                  {searchTerm && (
                    <span className="ml-2 text-primary">
                      (Tìm kiếm: "{searchTerm}")
                    </span>
                  )}
                </div>
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
    </div>
  );
} 