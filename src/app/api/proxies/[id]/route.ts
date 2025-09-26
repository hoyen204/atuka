import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.zalo_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const proxyId = parseInt(id);
    if (isNaN(proxyId)) {
      return NextResponse.json({ error: "Invalid proxy ID" }, { status: 400 });
    }

    const proxy = await prisma.proxy.findFirst({
      where: {
        id: proxyId,
        creatorId: session.user.zalo_id
      }
    });

    if (!proxy) {
      return NextResponse.json({ error: "Proxy not found" }, { status: 404 });
    }

    return NextResponse.json({ proxy });

  } catch (error) {
    console.error("Error fetching proxy:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.zalo_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const proxyId = parseInt(id);
    if (isNaN(proxyId)) {
      return NextResponse.json({ error: "Invalid proxy ID" }, { status: 400 });
    }

    const body = await request.json();
    const { host, port, username, password, enabled } = body;

    const existingProxy = await prisma.proxy.findFirst({
      where: {
        id: proxyId,
        creatorId: session.user.zalo_id
      }
    });

    if (!existingProxy) {
      return NextResponse.json({ error: "Proxy not found" }, { status: 404 });
    }

    if (host && port) {
      if (port < 1 || port > 65535) {
        return NextResponse.json({ error: "Port must be between 1 and 65535" }, { status: 400 });
      }

      const duplicateProxy = await prisma.proxy.findFirst({
        where: {
          host,
          port: parseInt(port),
          creatorId: session.user.zalo_id,
          id: { not: proxyId }
        }
      });

      if (duplicateProxy) {
        return NextResponse.json({ error: "Proxy with this host and port already exists" }, { status: 409 });
      }
    }

    const updateData: any = {};
    if (host) updateData.host = host;
    if (port) updateData.port = parseInt(port);
    if (username !== undefined) updateData.username = username || null;
    if (password !== undefined) updateData.password = password || null;
    if (enabled !== undefined) updateData.enabled = Boolean(enabled);

    const proxy = await prisma.proxy.update({
      where: { id: proxyId },
      data: updateData
    });

    return NextResponse.json({ proxy });

  } catch (error) {
    console.error("Error updating proxy:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.zalo_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const proxyId = parseInt(id);
    if (isNaN(proxyId)) {
      return NextResponse.json({ error: "Invalid proxy ID" }, { status: 400 });
    }

    const existingProxy = await prisma.proxy.findFirst({
      where: {
        id: proxyId,
        creatorId: session.user.zalo_id
      }
    });

    if (!existingProxy) {
      return NextResponse.json({ error: "Proxy not found" }, { status: 404 });
    }

    await prisma.proxy.delete({
      where: { id: proxyId }
    });

    return NextResponse.json({ message: "Proxy deleted successfully" });

  } catch (error) {
    console.error("Error deleting proxy:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 