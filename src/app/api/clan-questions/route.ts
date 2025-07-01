import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { question: { contains: search } },
            { answer: { contains: search } },
          ],
        }
      : {};

    const [questions, total] = await Promise.all([
      prisma.clanQuestion.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: offset,
        take: limit,
      }),
      prisma.clanQuestion.count({ where }),
    ]);

    return NextResponse.json({
      data: questions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching clan questions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
