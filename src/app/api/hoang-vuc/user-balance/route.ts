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

  if (!accountId || !proxyId) {
    return NextResponse.json(
      { error: "accountId and proxyId are required" },
      { status: 400 }
    );
  }

  const account = await prisma.account.findUnique({
    where: { id: parseInt(accountId) },
  });

  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const security =
    typeof account.security === "string"
      ? JSON.parse(account.security)
      : account.security;

  let proxy = null;
  if (proxyId && proxyId !== "random") {
    proxy = await prisma.proxy.findUnique({
      where: { id: parseInt(proxyId) },
    });
  } else {
    proxy = await getRandomProxy();
  }

  const body = new URLSearchParams();
  body.set("action", "get_user_balances");

  const baseUrlConfig = await prisma.config.findUnique({
    where: { key: "BASE_URL" },
  });
  const BASE_URL = baseUrlConfig?.value;

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

  try {
    const response = await fetch(
      `${BASE_URL}/wp-content/themes/halimmovies-child/hh3d-ajax.php`,
      fetchOptions
    );
    const data = await response.json();
    console.log(data);
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch user balance" },
      { status: 500 }
    );
  }
}
