import { PrismaClient } from '@prisma/client';
import { Proxy } from '@/models/types';
import { ProxyAgent, fetch } from 'undici';

const db = new PrismaClient();

async function getProxy(proxyId: string): Promise<Proxy | null> {
    if (proxyId === 'random') {
        const proxies = await db.proxy.findMany({ where: { enabled: true } });
        if (proxies.length === 0) return null;
        return proxies[Math.floor(Math.random() * proxies.length)] as Proxy;
    }
    const proxy = await db.proxy.findUnique({ where: { id: parseInt(proxyId) } });
    return proxy as Proxy | null;
}

export async function fetchWithProxy(url: string, accountId: string, proxyId: string): Promise<string> {
    const proxy = await getProxy(proxyId);
    const account = await db.account.findUnique({ where: { id: Number(accountId) } });

    if (!account) {
        throw new Error('Account not found');
    }

    let fetchOptions: any = {
        headers: {
            'Cookie': account.cookie || '',
            'User-Agent': 'XXX',
        },
    };

    if (proxy) {
        const proxyUrl = `http://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`;
        fetchOptions.dispatcher = new ProxyAgent(proxyUrl);
    }

    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
    }
    return response.text();
}