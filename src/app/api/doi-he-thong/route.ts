import { parseDoiHeThong } from "@/lib/doi-he-thong-parser";
import { fetchWithProxy } from "@/lib/fetchWithProxy";
import prisma from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { ProxyAgent, fetch } from "undici";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth.config";

const db = new PrismaClient();

async function getProxy(proxyId: string) {
  if (proxyId === "random") {
    const proxies = await db.proxy.findMany({ where: { enabled: true } });
    if (proxies.length === 0) return null;
    return proxies[Math.floor(Math.random() * proxies.length)];
  }
  return db.proxy.findUnique({ where: { id: parseInt(proxyId) } });
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get("accountId");
  const proxyId = searchParams.get("proxyId") || "random";

  if (!accountId) {
    return NextResponse.json(
      { success: false, error: "Missing accountId" },
      { status: 400 }
    );
  }

  const account = await db.account.findUnique({ where: { id: Number(accountId), creatorId: session.user.id } });
  if (!account) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const baseUrlConfig = await prisma.config.findUnique({
    where: { key: "BASE_URL" },
  });
  const BASE_URL = baseUrlConfig?.value;

  if (!BASE_URL) {
    return NextResponse.json(
      { error: "BASE_URL is not configured" },
      { status: 500 }
    );
  }

  try {
    const html = await fetchWithProxy(
      `${BASE_URL}/cap-nhat-he-thong-tu-luyen`,
      accountId,
      proxyId
    );
    const parsedData = parseDoiHeThong(html);

    return NextResponse.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error("Error in doi-he-thong API:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { accountId, proxyId = "random", system } = await request.json();

  if (!accountId) {
    return NextResponse.json(
      { success: false, error: "Missing required fields" },
      { status: 400 }
    );
  }

  const account = await db.account.findUnique({
    where: { id: Number(accountId), creatorId: session.user.id },
  });
  if (!account || !account.cookie) {
    return NextResponse.json(
      { success: false, error: "Account not found or cookie is missing" },
      { status: 404 }
    );
  }

  const security =
    typeof account.security === "string"
      ? JSON.parse(account.security)
      : account.security;

  const baseUrlConfig = await prisma.config.findUnique({
    where: { key: "BASE_URL" },
  });
  const BASE_URL = baseUrlConfig?.value;

  if (!BASE_URL) {
    return NextResponse.json(
      { error: "BASE_URL is not configured" },
      { status: 500 }
    );
  }
  const body = {
    system: system,
  };

  const proxy = await getProxy(proxyId);
  const fetchOptions: any = {
    headers: {
      Cookie: account.cookie,
      "User-Agent": "XXX",
      "Content-Type": "application/json",
      "X-WP-Nonce": security.dailyNonce,
    },
    method: "POST",
    body: JSON.stringify(body),
  };

  if (proxy) {
    const proxyUrl = proxy.username
      ? `http://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`
      : `http://${proxy.host}:${proxy.port}`;
    fetchOptions.dispatcher = new ProxyAgent(proxyUrl);
  }

  try {
    if (!system) {
      return NextResponse.json(
        { success: false, error: "Missing system or nonce for change action" },
        { status: 400 }
      );
    }
    const url = `${BASE_URL}/wp-json/he-thong/v1/change-role-system`;
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      throw new Error(`Failed to change system: ${response.statusText}`);
    }

    return NextResponse.json(await response.json());
  } catch (error: any) {
    console.error("Error in doi-he-thong POST API:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
