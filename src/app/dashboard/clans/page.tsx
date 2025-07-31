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
  Users,
  Activity,
  BarChart3,
  Filter,
  Grid3X3,
  List,
  RefreshCw,
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
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [filterLevel, setFilterLevel] = useState<string>("all");
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

  useEffect(() => {
    if (isMobile || isTablet) {
      setIsCompactView(true);
      setViewMode("grid");
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

  const getActiveClansCount = () => {
    return clans.filter((clan) => clan.activeMembers > 0).length;
  };

  const getFullClansCount = () => {
    return clans.filter((clan) => clan.memberCount >= clan.memberLimit).length;
  };

  const getFilteredClans = () => {
    let filtered = clans;
    if (filterLevel !== "all") {
      filtered = filtered.filter((clan) => clan.level === parseInt(filterLevel));
    }
    return filtered;
  };

  const ClanCard = ({ clan, index }: { clan: ClanDTO; index: number }) => {
    const levelBadgeConfig = getLevelBadgeVariant(clan.level);
    const levelTextColor = getLevelTextColor(clan.level);
    const levelIconColor = getLevelIconColor(clan.level);
    const stt = (page - 1) * pageSize + index + 1;
    const fillPercentage = (clan.memberCount / clan.memberLimit) * 100;

  return (
      <Card className="group hover:shadow-xl transition-all duration-300 hover:border-primary/50 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full">
                <Shield className={`w-5 h-5 ${levelIconColor}`} />
              </div>
              <div>
                <CardTitle className={`text-lg ${levelTextColor} group-hover:text-primary transition-colors`}>
                  {clan.name}
                </CardTitle>
                <CardDescription className="text-sm">
                  ID: {clan.id} • STT: {stt}
                </CardDescription>
              </div>
            </div>
            <Badge
              variant={levelBadgeConfig.variant}
              className={`${levelBadgeConfig.className} transition-colors`}
            >
              Level {clan.level}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Crown className="w-4 h-4 text-yellow-500" />
              <span className="text-muted-foreground">Bang chủ:</span>
              <span className="font-medium">{clan.leader}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-blue-500" />
              <span className="text-muted-foreground">Thành viên:</span>
              <span className="font-medium">
                {clan.memberCount}/{clan.memberLimit}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Activity className="w-4 h-4 text-green-500" />
              <span className="text-muted-foreground">Hoạt động:</span>
              <span className="font-medium">{clan.activeMembers}</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Tỷ lệ đầy</span>
                <span>{Math.round(fillPercentage)}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    fillPercentage >= 90
                      ? "bg-destructive"
                      : fillPercentage >= 70
                      ? "bg-orange-500"
                      : "bg-primary"
                  }`}
                  style={{ width: `${Math.min(100, fillPercentage)}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <TooltipProvider>
      <div className="container mx-auto p-6">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Quản lý tông môn</h1>
              <p className="text-muted-foreground mt-1">
                Tổng cộng {total.toLocaleString()} tông môn trong hệ thống
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchClans(page, searchTerm, pageSize, sortBy, sortOrder)}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Làm mới
              </Button>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === "table" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode(viewMode === "table" ? "grid" : "table")}
                  >
                    {viewMode === "table" ? (
                      <Grid3X3 className="w-4 h-4" />
                    ) : (
                      <List className="w-4 h-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Chuyển đổi chế độ hiển thị</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Tổng tông môn</p>
                    <p className="text-2xl font-bold text-blue-800">{total.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-green-600 font-medium">Có hoạt động</p>
                    <p className="text-2xl font-bold text-green-800">{getActiveClansCount().toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500 rounded-lg">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-red-600 font-medium">Đầy thành viên</p>
                    <p className="text-2xl font-bold text-red-800">{getFullClansCount().toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Tỷ lệ đầy TB</p>
                    <p className="text-2xl font-bold text-purple-800">
                      {clans.length > 0 
                        ? Math.round(clans.reduce((acc, clan) => acc + (clan.memberCount / clan.memberLimit), 0) / clans.length * 100)
                        : 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-muted-foreground" />
                  <h2 className="text-xl font-semibold">Bộ lọc & Tìm kiếm</h2>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                <div className="relative flex-1 sm:w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Tìm kiếm tông môn hoặc bang chủ..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                      className="pl-10"
                  />
                </div>
                  
                  <Select value={filterLevel} onValueChange={setFilterLevel}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Cấp tông" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả cấp</SelectItem>
                      <SelectItem value="8">Level 8</SelectItem>
                      <SelectItem value="7">Level 7</SelectItem>
                      <SelectItem value="6">Level 6</SelectItem>
                      <SelectItem value="5">Level 5</SelectItem>
                      <SelectItem value="4">Level 4</SelectItem>
                      <SelectItem value="3">Level 3</SelectItem>
                      <SelectItem value="2">Level 2</SelectItem>
                      <SelectItem value="1">Level 1</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button onClick={handleSearch} className="flex items-center gap-2">
                    <Search className="w-4 h-4" />
                  Tìm kiếm
                </Button>
                  
                {searchTerm && (
                  <Button
                    variant="outline"
                    onClick={clearSearch}
                      className="hover:bg-destructive/10 hover:text-destructive"
                  >
                    Xóa
                  </Button>
                )}
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="relative min-h-[400px]">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loading size="lg" text="Đang tải dữ liệu..." />
              </div>
            ) : getFilteredClans().length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
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
                </CardContent>
              </Card>
            ) : viewMode === "table" ? (
              <Card>
                <CardContent className="p-0">
                  <div className="rounded-md border overflow-hidden">
                    <Table className={isCompactView ? "text-sm" : ""}>
                      <TableHeader className="sticky top-0 bg-white z-10">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="font-semibold w-16">STT</TableHead>
                          <TableHead className="font-semibold">ID</TableHead>
                          <TableHead className="font-semibold">Tông môn</TableHead>
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
                          <TableHead className="font-semibold">Bang chủ</TableHead>
                          <TableHead className="font-semibold">Thành viên</TableHead>
                          <TableHead className="font-semibold">Hoạt động</TableHead>
                          <TableHead className="font-semibold">Tỷ lệ đầy</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getFilteredClans().map((clan, index) => {
                          const levelBadgeConfig = getLevelBadgeVariant(clan.level);
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
                                    navigator.clipboard.writeText(clan.id.toString());
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
                              <TableCell className={isCompactView ? "py-2" : ""}>
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
                              <TableCell className={isCompactView ? "py-2" : ""}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="secondary">
                                      {clan.memberCount}/{clan.memberLimit}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      {clan.memberCount} thành viên / {clan.memberLimit} tối đa
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TableCell>
                              <TableCell className={isCompactView ? "py-2" : ""}>
                                <div className="flex items-center gap-2">
                                  <UserCheck className="w-4 h-4 text-green-500" />
                                  <span className={isCompactView ? "text-xs" : "text-sm"}>
                                    {clan.activeMembers} hoạt động
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className={isCompactView ? "py-2" : ""}>
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
                                      width: `${Math.min(
                                        100,
                                        (clan.memberCount / clan.memberLimit) * 100
                                      )}%`,
                                    }}
                                  />
                                </div>
                                <span
                                  className={`text-muted-foreground mt-1 block ${
                                    isCompactView ? "text-[10px]" : "text-xs"
                                  }`}
                                >
                                  {Math.round((clan.memberCount / clan.memberLimit) * 100)}%
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {getFilteredClans().map((clan, index) => (
                  <ClanCard key={clan.id} clan={clan} index={index} />
                ))}
                </div>
            )}

            {getFilteredClans().length > 0 && (
              <div className="mt-6">
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
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
