import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { fetch, ProxyAgent } from "undici";

async function getRandomProxy() {
  const proxyCount = await prisma.proxy.count({ where: { enabled: true } });
  if (proxyCount === 0) return null;
  const skip = Math.floor(Math.random() * proxyCount);
  return await prisma.proxy.findFirst({
    where: { enabled: true },
    skip: skip,
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get("accountId");
  const proxyId = searchParams.get("proxyId");

  if (!accountId) {
    return NextResponse.json(
      { error: "accountId is required" },
      { status: 400 }
    );
  }

  try {
    const account = await prisma.account.findUnique({
      where: { id: parseInt(accountId) },
      select: { cookie: true, security: true },
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

    const security =
      typeof account.security === "string"
        ? JSON.parse(account.security)
        : account.security;

    console.log(security);

    const body = new URLSearchParams();
    body.set("action", "get_user_inventory_items");

    console.log();

    const fetchOptions: any = {
      method: "POST",
      headers: {
        Cookie: account.cookie,
        "User-Agent": "X",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        Referer: `${BASE_URL}/hoang-vuc`,
      },
      body: body.toString(),
    };

    if (proxy) {
      const proxyUrl = `http://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`;
      fetchOptions.dispatcher = new ProxyAgent(proxyUrl);
    }

    const targetUrl = `${BASE_URL}/wp-content/themes/halimmovies-child/hh3d-ajax.php`;
    const response = await fetch(targetUrl, fetchOptions);
    if (!response.ok) {
      const error = await response.text();
      console.log(error);
      throw new Error(
        `Failed to fetch: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error(
      `Error fetching hoang vuc inventory for account ${accountId}:`,
      error.message
    );
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get("accountId");
  const proxyId = searchParams.get("proxyId");
  const itemId = searchParams.get("itemId");
  const quantity = searchParams.get("quantity");
  const itemType = searchParams.get("itemType");

  if (!accountId || !itemId || !quantity || !itemType) {
    return NextResponse.json(
      { error: "accountId and itemId are required" },
      { status: 400 }
    );
  }

  try {
    const account = await prisma.account.findUnique({
      where: { id: parseInt(accountId) },
      select: { cookie: true, security: true },
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

    const security =
      typeof account.security === "string"
        ? JSON.parse(account.security)
        : account.security;

    const body = new URLSearchParams();
    body.set(
      "action",
      itemType.startsWith("ruong") ? "open_chest_item" : "activate_phu_item"
    );
    body.set("item_id", itemId);
    body.set("item_type", itemType);
    body.set("quantity", quantity);
    body.set("nonce", security.abyssNonce);

    const fetchOptions: any = {
      method: "POST",
      headers: {
        Cookie: account.cookie,
        "User-Agent": "X",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        Referer: `${BASE_URL}/hoang-vuc`,
      },
      body: body.toString(),
    };

    if (proxy) {
      const proxyUrl = `http://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`;
      fetchOptions.dispatcher = new ProxyAgent(proxyUrl);
    }

    const targetUrl = `${BASE_URL}/wp-content/themes/halimmovies-child/hh3d-ajax.php`;
    const response = await fetch(targetUrl, fetchOptions);

    if (!response.ok) {
      const error = await response.text();
      console.log(error);
      throw new Error(
        `Failed to fetch: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error(
      `Error using hoang vuc inventory item for account ${accountId}:`,
      error.message
    );
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
