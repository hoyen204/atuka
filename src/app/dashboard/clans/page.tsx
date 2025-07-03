"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loading } from "@/components/ui/loading";
import { PaginationComponent } from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useResponsive } from "@/hooks/useResponsive";
import { ClanDTO, ClansResponse } from "@/models/types";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Crown,
  Search,
  Shield,
  UserCheck,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export default function ClanManagementPage() {
  const [clans, setClans] = useState<ClanDTO[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>("");
  const [isCompactView, setIsCompactView] = useState(false);
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const { isMobile, isTablet, currentBreakpoint } = useResponsive();

  const fetchClans = useCallback(
    async (
      pageNum: number,
      search: string,
      size: number,
      sort: string,
      order: string
    ) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: pageNum.toString(),
          pageSize: size.toString(),
          sort: sort,
          order: order,
          ...(search && { search }),
        });

        const response = await fetch(`/api/clans?${params}`);
        const data: ClansResponse = await response.json();

        setClans(data.clans);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      } catch (error) {
        console.error("Error fetching clans:", error);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchClans(page, searchTerm, pageSize, sortBy, sortOrder);
  }, [page, searchTerm, pageSize, sortBy, sortOrder, fetchClans]);

  // Auto set compact view on mobile/tablet
  useEffect(() => {
    if (isMobile || isTablet) {
      setIsCompactView(true);
    }
  }, [isMobile, isTablet]);

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

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="w-4 h-4 text-muted-foreground" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="w-4 h-4 text-primary" />
    ) : (
      <ArrowDown className="w-4 h-4 text-primary" />
    );
  };

  const getLevelBadgeVariant = (level: number) => {
    if (level == 8)
      return {
        variant: "default" as const,
        className:
          "bg-gradient-to-r from-purple-800 to-cyan-800 hover:from-purple-900 hover:to-cyan-900 text-white shadow-lg border-0",
      };
    if (level == 7)
      return {
        variant: "default" as const,
        className:
          "bg-gradient-to-r from-indigo-700 to-purple-800 hover:from-indigo-800 hover:to-purple-900 text-white shadow-md border-0",
      };
    if (level == 6)
      return {
        variant: "default" as const,
        className:
          "bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white shadow-md border-0",
      };
    if (level == 5)
      return {
        variant: "default" as const,
        className:
          "bg-gradient-to-r from-emerald-700 to-green-700 hover:from-emerald-800 hover:to-green-800 text-white shadow-md border-0",
      };
    if (level == 4)
      return {
        variant: "default" as const,
        className:
          "bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white shadow-md border-0",
      };
    if (level == 3)
      return {
        variant: "default" as const,
        className:
          "bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-md border-0",
      };
    if (level == 2)
      return {
        variant: "default" as const,
        className:
          "bg-gradient-to-r from-red-600 to-cyan-600 hover:from-red-700 hover:to-cyan-700 text-white shadow-md border-0",
      };
    if (level == 1)
      return {
        variant: "default" as const,
        className:
          "bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white shadow-sm border-0",
      };
    return {
      variant: "outline" as const,
      className:
        "border-2 border-gray-400 text-gray-600 hover:border-gray-500 hover:text-gray-700 bg-gray-50",
    };
  };

  const getLevelTextColor = (level: number) => {
    if (level == 8) return "text-purple-800 group-hover:text-purple-900";
    if (level == 7) return "text-indigo-800 group-hover:text-indigo-900";
    if (level == 6) return "text-blue-800 group-hover:text-blue-900";
    if (level == 5) return "text-emerald-800 group-hover:text-emerald-900";
    if (level == 4) return "text-orange-700 group-hover:text-orange-800";
    if (level == 3) return "text-red-700 group-hover:text-red-800";
    if (level == 2) return "text-cyan-700 group-hover:text-cyan-800";
    if (level == 1) return "text-gray-700 group-hover:text-gray-800";
    return "text-gray-600 group-hover:text-gray-700";
  };

  const getLevelIconColor = (level: number) => {
    if (level == 8) return "text-purple-800 hover:text-purple-900";
    if (level == 7) return "text-indigo-800 hover:text-indigo-900";
    if (level == 6) return "text-blue-800 hover:text-blue-900";
    if (level == 5) return "text-emerald-800 hover:text-emerald-900";
    if (level == 4) return "text-orange-700 hover:text-orange-800";
    if (level == 3) return "text-red-700 hover:text-red-800";
    if (level == 2) return "text-cyan-700 hover:text-cyan-800";
    if (level == 1) return "text-gray-700 hover:text-gray-800";
    return "text-gray-600 hover:text-gray-700";
  };

  const getMembersBadgeVariant = () => {
    return "secondary";
  };

  const getActiveClansCount = () => {
    return clans.filter((clan) => clan.activeMembers > 0).length;
  };

  const getFullClansCount = () => {
    return clans.filter((clan) => clan.memberCount >= clan.memberLimit).length;
  };

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col p-6">
        <Card className="flex-1 flex flex-col overflow-hidden hover:shadow-lg transition-all duration-300">
          <CardHeader className="hover:bg-accent/10 transition-colors duration-200 rounded-t-xl flex-shrink-0">
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={sortBy === "level" ? "default" : "outline"}
                      onClick={() => handleSort("level")}
                      className="flex items-center gap-2 hover:gap-3 transition-all duration-200"
                    >
                      {getSortIcon("level")}
                      Level
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Sắp xếp theo cấp tông{" "}
                      {sortBy === "level"
                        ? sortOrder === "asc"
                          ? "tăng dần"
                          : "giảm dần"
                        : ""}
                    </p>
                  </TooltipContent>
                </Tooltip>
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
                  <span className="font-medium">Tổng tông môn:</span>{" "}
                  <span className="text-blue-600">
                    {total.toLocaleString()}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="font-medium">Có hoạt động:</span>{" "}
                  <span className="text-green-600">
                    {getActiveClansCount().toLocaleString()}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="font-medium">Đầy thành viên:</span>{" "}
                  <span className="text-red-600">
                    {getFullClansCount().toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Sắp xếp:{" "}
                {sortBy === "level"
                  ? "Cấp tông"
                  : sortBy === "name"
                  ? "Tên"
                  : "Mặc định"}{" "}
                {sortOrder === "asc" ? "↑" : "↓"} | Chế độ:{" "}
                {isCompactView ? "Thu gọn" : "Mở rộng"}
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12 flex-1">
                <Loading size="lg" text="Đang tải dữ liệu..." />
              </div>
            ) : clans.length === 0 ? (
              <div className="text-center py-12 flex-1">
                <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  {searchTerm
                    ? "Không tìm thấy tông môn nào"
                    : "Không có tông môn nào"}
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
                          <TableHead className="font-semibold w-16">
                            STT
                          </TableHead>
                          <TableHead className="font-semibold">ID</TableHead>
                          <TableHead className="font-semibold">
                            Tông môn
                          </TableHead>
                          <TableHead className="font-semibold">
                            <Button
                              variant="ghost"
                              onClick={() => handleSort("level")}
                              className="flex items-center gap-2 h-auto p-0 font-semibold hover:bg-transparent"
                            >
                              Cấp tông
                              {getSortIcon("level")}
                            </Button>
                          </TableHead>
                          <TableHead className="font-semibold">
                            Bang chủ
                          </TableHead>
                          <TableHead className="font-semibold">
                            Thành viên
                          </TableHead>
                          <TableHead className="font-semibold">
                            Hoạt động
                          </TableHead>
                          <TableHead className="font-semibold">
                            Tỷ lệ đầy
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clans.map((clan, index) => {
                                                      const levelBadgeConfig = getLevelBadgeVariant(
                              clan.level
                            );
                            const levelTextColor = getLevelTextColor(clan.level);
                            const levelIconColor = getLevelIconColor(clan.level);
                            const stt = (page - 1) * pageSize + index + 1;
                          return (
                            <TableRow
                              key={clan.id}
                              className={`hover:bg-accent/50 transition-all duration-200 hover:shadow-sm group ${
                                isCompactView ? "h-12" : ""
                              }`}
                            >
                              <TableCell
                                className={`text-center font-medium text-muted-foreground ${
                                  isCompactView ? "py-2" : ""
                                }`}
                              >
                                <span className="text-sm font-mono">{stt}</span>
                              </TableCell>
                              <TableCell
                                className={`font-medium group-hover:text-primary transition-colors ${
                                  isCompactView ? "py-2" : ""
                                } hover:cursor-pointer`}
                                onClick={() => {
                                  navigator.clipboard?.writeText &&
                                    navigator.clipboard.writeText(
                                      clan.id.toString()
                                    );
                                  toast({
                                    title: "Thành công",
                                    description: "Đã copy ID tông môn",
                                    type: "success",
                                  });
                                }}
                              >
                                <div className="flex items-center gap-2">
                                  <Shield className="w-4 h-4 text-primary" />
                                  {clan.id}
                                </div>
                              </TableCell>
                              <TableCell
                                className={`font-medium transition-colors ${
                                  isCompactView ? "py-2" : ""
                                } ${levelTextColor}`}
                              >
                                <div className="flex items-center gap-2">
                                  <Shield className={`w-4 h-4 ${levelIconColor}`} />
                                  {clan.name}
                                </div>
                              </TableCell>
                              <TableCell
                                className={isCompactView ? "py-2" : ""}
                              >
                                <Badge
                                  variant={levelBadgeConfig.variant}
                                  className={`${levelBadgeConfig.className} transition-colors`}
                                >
                                  Level {clan.level}
                                </Badge>
                              </TableCell>
                              <TableCell
                                className={`text-muted-foreground group-hover:text-foreground transition-colors ${
                                  isCompactView ? "py-2" : ""
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <Crown className="w-4 h-4 text-yellow-500" />
                                  {clan.leader}
                                </div>
                              </TableCell>
                              <TableCell
                                className={isCompactView ? "py-2" : ""}
                              >
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge
                                      variant="secondary"
                                    >
                                      {clan.memberCount}/{clan.memberLimit}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      {clan.memberCount} thành viên /{" "}
                                      {clan.memberLimit} tối đa
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TableCell>
                              <TableCell
                                className={isCompactView ? "py-2" : ""}
                              >
                                <div className="flex items-center gap-2">
                                  <UserCheck className="w-4 h-4 text-green-500" />
                                  <span
                                    className={
                                      isCompactView ? "text-xs" : "text-sm"
                                    }
                                  >
                                    {clan.activeMembers} hoạt động
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell
                                className={isCompactView ? "py-2" : ""}
                              >
                                <div className="w-full bg-secondary rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full transition-all duration-300 ${
                                      clan.memberCount / clan.memberLimit >= 0.9
                                        ? "bg-destructive"
                                        : clan.memberCount / clan.memberLimit >=
                                          0.7
                                        ? "bg-orange-500"
                                        : "bg-primary"
                                    }`}
                                    style={{
                                      width: `${Math.min(
                                        100,
                                        (clan.memberCount / clan.memberLimit) *
                                          100
                                      )}%`,
                                    }}
                                  />
                                </div>
                                <span
                                  className={`text-muted-foreground mt-1 block ${
                                    isCompactView ? "text-[10px]" : "text-xs"
                                  }`}
                                >
                                  {Math.round(
                                    (clan.memberCount / clan.memberLimit) * 100
                                  )}
                                  %
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
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
        </Card>
      </div>
    </TooltipProvider>
  );
}
