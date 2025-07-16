import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.zalo_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    const where = {
      creatorId: session.user.zalo_id,
      ...(search && {
        OR: [
          { host: { contains: search } },
          { username: { contains: search } }
        ]
      })
    };

    const [proxies, total] = await Promise.all([
      prisma.deletedProxy.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc"
        }
      }),
      prisma.deletedProxy.count({ where })
    ]);

    return NextResponse.json({
      proxies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Error fetching proxies:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.zalo_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const deletedProxy = await prisma.deletedProxy.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ deletedProxy }, { status: 200 });
  } catch (error) {
    console.error("Error deleting proxy:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}