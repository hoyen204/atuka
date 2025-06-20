"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chart, MetricCard } from "@/components/ui/chart";
import {
  DatePicker,
  FilterSelect,
  PeriodSelector,
} from "@/components/ui/date-picker";
import { Table } from "@/components/ui/table";
import { useEffect, useState } from "react";

interface WeddingReportData {
  period: string;
  dateRange: { start: string; end: string };
  summary: {
    totalGifts: number;
    totalAmount: number;
  };
  dailyData: Array<{
    date: string;
    count: number;
    total_amount: number;
    type: string;
  }>;
  hourlyData?: Array<{
    hour: number;
    count: number;
    total_amount: number;
  }>;
  giftsByType: Array<{
    type: string;
    count: number;
    total_amount: number;
  }>;
  topAccounts: Array<{
    accountId: number;
    accountName: string;
    count: number;
    total_amount: number;
  }>;
}

const giftTypeLabels = {
  TienNgoc: "Tiên Ngọc",
  TuVi: "Tu Vi",
  TinhThach: "Tinh Thạch",
  Xu: "Xu",
  XuKhoa: "Xu Khóa",
};

export default function WeddingReportsPage() {
  const [data, setData] = useState<WeddingReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    period: "day",
    date: new Date().toISOString().split("T")[0],
    accountId: "",
    type: "",
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append("period", filters.period);
      if (filters.date) params.append("date", filters.date);
      if (filters.accountId) params.append("accountId", filters.accountId);
      if (filters.type) params.append("type", filters.type);

      const response = await fetch(`/api/wedding-reports?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const updateFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);

    return `${startDate.toLocaleDateString(
      "vi-VN"
    )} - ${endDate.toLocaleDateString("vi-VN")}`;
  };

  const dailyChartData: { label: string; value: number }[] = data?.dailyData
    ? (Object.values(
        (data.dailyData as any[]).reduce((acc: any, item: any) => {
          const dateKey = item.date;
          if (!acc[dateKey]) {
            acc[dateKey] = {
              label: new Date(item.date).toLocaleDateString("vi-VN", {
                month: "short",
                day: "numeric",
              }),
              value: 0,
            };
          }
          acc[dateKey].value += Number(item.total_amount) || 0;
          return acc;
        }, {})
      ) as { label: string; value: number }[])
    : [];

  const hourlyChartData =
    data?.hourlyData?.map((item) => ({
      label: `${item.hour}h`,
      value: item.total_amount,
    })) || [];

  const giftTypeChartData =
    data?.giftsByType?.map((item) => ({
      label:
        giftTypeLabels[item.type as keyof typeof giftTypeLabels] || item.type,
      value: Number(item.total_amount) || 0,
    })) || [];

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Đang tải...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Wedding Reports</h1>
        <Button onClick={fetchData} disabled={loading}>
          {loading ? "Đang tải..." : "Làm mới"}
        </Button>
      </div>

      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold mb-4">Bộ lọc</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Khoảng thời gian
            </label>
            <PeriodSelector
              value={filters.period}
              onChange={(value) => updateFilter("period", value)}
            />
          </div>
        </div>
        {data && (
          <>
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Khoảng thời gian:{" "}
                {formatDateRange(data.dateRange.start, data.dateRange.end)}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <MetricCard
                title="Tổng số quà tặng"
                value={data.summary.totalGifts}
                icon={<div className="text-2xl">🎁</div>}
              />
              <MetricCard
                title="Tổng giá trị"
                value={data.summary.totalAmount}
                icon={<div className="text-2xl">💎</div>}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
              {filters.period === "day" && hourlyChartData.length > 0 && (
                <Chart
                  title="Quà tặng theo giờ"
                  data={hourlyChartData}
                  type="bar"
                  height={150}
                />
              )}
            </div>

            <div className="flex flex-row gap-4">
              <Chart
                title="Phân bố theo loại quà"
                data={giftTypeChartData}
                type="pie"
                height={300}
                className="w-[30%]"
              />
              <div className="w-[70%]">
                <h3 className="text-lg font-semibold mb-4">
                  Top 10 Account nhận quà nhiều nhất
                </h3>
                <div className="overflow-x-auto">
                  <Table>
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left">Thứ hạng</th>
                        <th className="px-4 py-2 text-left">ID</th>
                        <th className="px-4 py-2 text-left">Biệt danh</th>
                        <th className="px-4 py-2 text-right">Số lượng</th>
                        <th className="px-4 py-2 text-right">Tổng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.topAccounts.map((account, index) => (
                        <tr key={account.accountId} className="border-t">
                          <td className="px-4 py-2">#{index + 1}</td>
                          <td className="px-4 py-2">{account.accountId}</td>
                          <td className="px-4 py-2">{account.accountName}</td>
                          <td className="px-4 py-2 text-right">
                            {account.count}
                          </td>
                          <td className="px-4 py-2 text-right font-semibold">
                            {Number(account.total_amount || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </div>
            </div>
          </>
        )}
      </Card>

      {error && (
        <Card className="p-6 bg-red-50 border-red-200">
          <p className="text-red-600">Lỗi: {error}</p>
        </Card>
      )}
    </div>
  );
}
