import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import prisma from "@/lib/prisma";

interface DateRange {
  start: Date;
  end: Date;
}

function getDateRange(period: string, date?: string): DateRange {
  const baseDate = date ? new Date(date) : new Date();

  switch (period) {
    case "day":
      const dayStart = new Date(baseDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(baseDate);
      dayEnd.setHours(23, 59, 59, 999);
      return { start: dayStart, end: dayEnd };

    case "week":
      const weekStart = new Date(baseDate);
      const dayOfWeek = weekStart.getDay();
      weekStart.setDate(weekStart.getDate() - dayOfWeek);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      return { start: weekStart, end: weekEnd };

    case "month":
      const monthStart = new Date(
        baseDate.getFullYear(),
        baseDate.getMonth(),
        1
      );
      const monthEnd = new Date(
        baseDate.getFullYear(),
        baseDate.getMonth() + 1,
        0
      );
      monthEnd.setHours(23, 59, 59, 999);
      return { start: monthStart, end: monthEnd };

    case "year":
      const yearStart = new Date(baseDate.getFullYear(), 0, 1);
      const yearEnd = new Date(baseDate.getFullYear(), 11, 31);
      yearEnd.setHours(23, 59, 59, 999);
      return { start: yearStart, end: yearEnd };

    default:
      throw new Error("Invalid period");
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const currentUser = session.user;

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get("period") || "day";
    const date = searchParams.get("date") || undefined;
    const accountId = searchParams.get("accountId") || undefined;
    const type = searchParams.get("type") || undefined;

    const { start, end } = getDateRange(period, date);

    let whereConditions = `WHERE createdAt >= '${start.toISOString()}' AND createdAt <= '${end.toISOString()}' AND accountCreatorId = '${currentUser.zalo_id}'`;

    if (accountId) {
      whereConditions += ` AND accountId = ${parseInt(accountId)}`;
    }

    if (type) {
      whereConditions += ` AND type = '${type}'`;
    }

    const [summaryResult, dailyResult, giftsByTypeResult, topAccountsResult] =
      await Promise.all([
        prisma.$queryRawUnsafe(`
        SELECT 
          COUNT(*) as totalGifts,
          SUM(amount) as totalAmount
        FROM wedding_received 
        ${whereConditions}
      `),

        prisma.$queryRawUnsafe(`
        SELECT 
          DATE(createdAt) as date,
          COUNT(*) as count,
          SUM(amount) as total_amount,
          type
        FROM wedding_received 
        ${whereConditions}
        GROUP BY DATE(createdAt), type
        ORDER BY date DESC
      `),

        prisma.$queryRawUnsafe(`
        SELECT 
          type,
          COUNT(*) as count,
          SUM(amount) as total_amount
        FROM wedding_received 
        ${whereConditions}
        GROUP BY type
      `),

        prisma.$queryRawUnsafe(`
        SELECT 
          accountId,
          accountName,
          COUNT(*) as count,
          SUM(amount) as total_amount
        FROM wedding_received 
        ${whereConditions}
        GROUP BY accountId, accountName
        ORDER BY SUM(amount) DESC
        LIMIT 10
      `),
      ]);

    const hourlyResult =
      period === "day"
        ? await prisma.$queryRawUnsafe(`
      SELECT 
        HOUR(createdAt) as hour,
        COUNT(*) as count,
        SUM(amount) as total_amount
      FROM wedding_received 
      ${whereConditions}
      GROUP BY HOUR(createdAt)
      ORDER BY hour
    `)
        : null;

    const summary =
      Array.isArray(summaryResult) && summaryResult.length > 0
        ? (summaryResult[0] as any)
        : { totalGifts: 0, totalAmount: 0 };

    // Convert BigInt to Number for JSON serialization
    const convertBigIntToNumber = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(convertBigIntToNumber);
      } else if (obj !== null && typeof obj === "object") {
        const converted: any = {};
        for (const key in obj) {
          converted[key] = convertBigIntToNumber(obj[key]);
        }
        return converted;
      } else if (typeof obj === "bigint") {
        return Number(obj);
      }
      return obj;
    };

    return NextResponse.json({
      period,
      dateRange: { start, end },
      summary: {
        totalGifts: Number(summary.totalGifts) || 0,
        totalAmount: Number(summary.totalAmount) || 0,
      },
      dailyData: convertBigIntToNumber(dailyResult),
      hourlyData: convertBigIntToNumber(hourlyResult),
      giftsByType: convertBigIntToNumber(giftsByTypeResult),
      topAccounts: convertBigIntToNumber(topAccountsResult),
    });
  } catch (error) {
    console.error("Wedding reports error:", error);
    return NextResponse.json(
      { error: "Failed to fetch wedding reports" },
      { status: 500 }
    );
  }
}
