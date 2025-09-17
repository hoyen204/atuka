import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth.config";
import { prisma } from "../../../../lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
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

    const { key } = await params;
    const config = await prisma.config.findUnique({
      where: { key }
    });

    if (!config) {
      return NextResponse.json({ error: "Config not found" }, { status: 404 });
    }

    return NextResponse.json({ config });

  } catch (error) {
    console.error("Error fetching config:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
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
    const { value } = body;

    if (!value) {
      return NextResponse.json({ error: "Value is required" }, { status: 400 });
    }

    const { key } = await params;
    const existingConfig = await prisma.config.findUnique({
      where: { key }
    });

    if (!existingConfig) {
      return NextResponse.json({ error: "Config not found" }, { status: 404 });
    }

    const config = await prisma.config.update({
      where: { key },
      data: { value }
    });

    return NextResponse.json({ config });

  } catch (error) {
    console.error("Error updating config:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
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

    const { key } = await params;
    const existingConfig = await prisma.config.findUnique({
      where: { key }
    });

    if (!existingConfig) {
      return NextResponse.json({ error: "Config not found" }, { status: 404 });
    }

    await prisma.config.delete({
      where: { key }
    });

    return NextResponse.json({ message: "Config deleted successfully" });

  } catch (error) {
    console.error("Error deleting config:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 