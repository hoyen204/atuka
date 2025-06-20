import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth.config";
import { prisma } from "../../../lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.zalo_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { zaloId: session.user.zalo_id }
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    const where = search ? {
      OR: [
        { key: { contains: search } },
        { value: { contains: search } }
      ]
    } : {};

    const [configs, total] = await Promise.all([
      prisma.config.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          key: "asc"
        }
      }),
      prisma.config.count({ where })
    ]);

    return NextResponse.json({
      configs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Error fetching configs:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.zalo_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { zaloId: session.user.zalo_id }
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { key, value } = body;

    if (!key || !value) {
      return NextResponse.json({ error: "Key and value are required" }, { status: 400 });
    }

    const existingConfig = await prisma.config.findUnique({
      where: { key }
    });

    if (existingConfig) {
      return NextResponse.json({ error: "Config key already exists" }, { status: 409 });
    }

    const config = await prisma.config.create({
      data: {
        key,
        value
      }
    });

    return NextResponse.json({ config }, { status: 201 });

  } catch (error) {
    console.error("Error creating config:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 