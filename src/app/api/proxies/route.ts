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
      prisma.proxy.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc"
        }
      }),
      prisma.proxy.count({ where })
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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.zalo_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { host, port, username, password, enabled = true } = body;

    if (!host || !port) {
      return NextResponse.json({ error: "Host and port are required" }, { status: 400 });
    }

    if (port < 1 || port > 65535) {
      return NextResponse.json({ error: "Port must be between 1 and 65535" }, { status: 400 });
    }

    const existingProxy = await prisma.proxy.findFirst({
      where: {
        host,
        port: parseInt(port),
        creatorId: session.user.zalo_id
      }
    });

    if (existingProxy) {
      return NextResponse.json({ error: "Proxy already exists" }, { status: 409 });
    }

    const proxy = await prisma.proxy.create({
      data: {
        host,
        port: parseInt(port),
        username: username || null,
        password: password || null,
        enabled: Boolean(enabled),
        creatorId: session.user.zalo_id
      }
    });

    return NextResponse.json({ proxy }, { status: 201 });

  } catch (error) {
    console.error("Error creating proxy:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 