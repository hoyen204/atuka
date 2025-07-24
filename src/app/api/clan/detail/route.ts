import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetch, ProxyAgent } from 'undici';
import { ClanDetailParserImpl } from '@/lib/clan-detail-parser';

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
      // Assuming http protocol for now as it's not in the schema
      const proxyUrl = `http://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`;
      fetchOptions.dispatcher = new ProxyAgent(proxyUrl);
    }

    const targetUrl = `${BASE_URL}/danh-sach-thanh-vien-tong-mon`;
    const response = await fetch(targetUrl, fetchOptions);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    if (!html) {
      throw new Error('Failed to get HTML content from response');
    }

    const parser = new ClanDetailParserImpl();
    const clanData = parser.parseClanDetailHtml(html);

    return NextResponse.json(clanData);

  } catch (error: any) {
    console.error(`Error fetching clan detail for account ${accountId}:`, error.message);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
} 