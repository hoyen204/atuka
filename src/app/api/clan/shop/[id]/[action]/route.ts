import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth.config";
import { ProxyAgent } from "undici";

async function getRandomProxy() {
  const proxyCount = await prisma.proxy.count({ where: { enabled: true } });
  if (proxyCount === 0) return null;
  const skip = Math.floor(Math.random() * proxyCount);
  return await prisma.proxy.findFirst({
    where: { enabled: true },
    skip: skip,
  });
}

export async function POST(
  request: Request,
  context: { params: { id: string; action: string } }
) {
  const { id, action } = await context.params;
  console.log(id, action);
  const accountId = parseInt(id);
  if (isNaN(accountId)) {
    return NextResponse.json({ error: "Invalid account ID" }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  if (!session) {
    console.log(session);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
    const proxyId = searchParams.get("proxyId");
    
  const body = await request.json();

  try {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { cookie: true, name: true, security: true },
    });

    if (!account?.cookie) {
      return NextResponse.json(
        { error: "Account not found or cookie is missing" },
        { status: 404 }
      );
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

    let proxy = null;
    if (proxyId && proxyId !== "random") {
      proxy = await prisma.proxy.findUnique({
        where: { id: parseInt(proxyId) },
      });
    } else {
      proxy = await getRandomProxy();
    }

    const security = typeof account.security === 'string' ? JSON.parse(account.security) : account.security;

    const fetchOptions: any = {
      headers: {
        Cookie: account.cookie,
        "User-Agent": "X",
        "Content-Type": "application/json",
        "X-WP-Nonce": security.dailyNonce,
        },
        method: "POST",
        body: JSON.stringify(body),
    };

    if (proxy) {
      const proxyUrl = `http://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`;
      fetchOptions.dispatcher = new ProxyAgent(proxyUrl);
    }

    const targetUrl = `${BASE_URL}/wp-json/tong-mon/v1/${action}`;
    const response = await fetch(targetUrl, fetchOptions);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch: ${response.status} ${response.statusText}`
      );
    }

    const responseBody = await response.json();

    return NextResponse.json(responseBody);
  } catch (error: any) {
    console.error(
      `Error fetching clan detail for account ${accountId}:`,
      error.message
    );
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}