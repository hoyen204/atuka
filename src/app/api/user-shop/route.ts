import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetch, ProxyAgent } from 'undici';
import { userShopParser } from '@/lib/user-shop-parser';

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
  const accountId = searchParams.get('accountId');
  const proxyId = searchParams.get('proxyId');

  if (!accountId) {
    return NextResponse.json({ error: 'accountId is required' }, { status: 400 });
  }

  try {
    const account = await prisma.account.findUnique({
      where: { id: parseInt(accountId) },
      select: { cookie: true, name: true },
    });

    if (!account?.cookie) {
      return NextResponse.json({ error: 'Account not found or cookie is missing' }, { status: 404 });
    }

    const baseUrlConfig = await prisma.config.findUnique({ where: { key: 'BASE_URL' } });
    const BASE_URL = baseUrlConfig?.value;

    if (!BASE_URL) {
      return NextResponse.json({ error: 'BASE_URL is not configured' }, { status: 500 });
    }

    let proxy = null;
    if (proxyId && proxyId !== 'random') {
      proxy = await prisma.proxy.findUnique({ where: { id: parseInt(proxyId) } });
    } else {
      proxy = await getRandomProxy();
    }

    const fetchOptions: any = {
      headers: {
        'Cookie': account.cookie,
        'User-Agent': 'X',
      },
    };

    if (proxy) {
      const proxyUrl = `http://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`;
      fetchOptions.dispatcher = new ProxyAgent(proxyUrl);
    }

    const targetUrl = `${BASE_URL}/tu-bao-cac`;
    const response = await fetch(targetUrl, fetchOptions);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    if (!html) {
      throw new Error('Failed to get HTML content from response');
    }

    const shopData = userShopParser.parseUserShopHtml(html);

    // Extract Ajax_Shop from HTML
    let ajaxShop = null;
    if (RegExp(/\s*var\s+Ajax_Shop\s*=\s*/).exec(html)) {
        try {
          const ajaxShopMatch = RegExp(
            /var\s+Ajax_Shop\s*=\s*({[^;]*})/
          ).exec(html);
          if (!ajaxShopMatch?.[1]) {
            throw new Error('Failed to parse Ajax_Shop');
          }
          ajaxShop = JSON.parse(ajaxShopMatch[1]);
      } catch (e) {
        console.error("Failed to parse Ajax_Shop:", e);
      }
    }

    return NextResponse.json({ shopData, ajaxShop });
  } catch (error: any) {
    console.error(`Error fetching user shop for account ${accountId}:`, error.message);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
} 

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get('accountId');
  const proxyId = searchParams.get('proxyId');
  
  if (!accountId) {
    return NextResponse.json({ error: 'accountId is required' }, { status: 400 });
  }
  
  const body = await request.json();
  const { action, itemId, category, nonce, ajaxUrl } = body; // Assume client sends these
  
  if (!action || !itemId || !category || !nonce || !ajaxUrl) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }
  if (!['buy', 'sell'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
  
  try {
    const account = await prisma.account.findUnique({
      where: { id: parseInt(accountId) },
      select: { cookie: true },
    });
    
    if (!account?.cookie) {
      return NextResponse.json({ error: 'Account not found or cookie missing' }, { status: 404 });
    }
    
    let proxy = null;
    if (proxyId && proxyId !== 'random') {
      proxy = await prisma.proxy.findUnique({ where: { id: parseInt(proxyId) } });
    } else {
      proxy = await getRandomProxy();
    }
    
    const fetchOptions: any = {
      method: "POST",
      headers: {
        Cookie: account.cookie,
        "User-Agent": "X",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        action: `${
          category === "danduoc" ? "handle_" : ""
        }${action}_${category}`,
        ...(category === "danduoc"
          ? { danduoc_id: itemId }
          : { item_id: itemId }),
        nonce,
      }),
    };
    
    if (proxy) {
      const proxyUrl = `http://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`;
      fetchOptions.dispatcher = new ProxyAgent(proxyUrl);
    }
    
    const response = await fetch(ajaxUrl, fetchOptions);
    
    if (!response.ok) {
      throw new Error(`Action failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error(`Error performing ${action} for item ${itemId}:`, error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
} 