import ApiRequestService from "@/app/services/ApiService";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { fetch, ProxyAgent } from 'undici';
import { extractNonces, extractRewards } from "@/lib/reward-extractor";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

interface ClaimDetail {
  id: string;
  title: string;
  success: boolean;
  message: string;
  reward?: any;
  error?: string;
}

interface ClaimResult {
  accountId: number;
  accountName: string;
  success: boolean;
  claimed: number;
  total: number;
  details: ClaimDetail[];
  error: string | null;
}

async function getRandomProxy() {
  const proxyCount = await prisma.proxy.count({ where: { enabled: true } });
  if (proxyCount === 0) return null;
  const skip = Math.floor(Math.random() * proxyCount);
  return await prisma.proxy.findFirst({
    where: { enabled: true },
    skip: skip,
  });
}

async function fetchPageContent(url: string, cookie: string): Promise<string> {
  const fetchOptions: any = {
    method: 'GET',
    headers: {
      'Cookie': cookie,
      'User-Agent': 'XXX',
    },
    // Undici's default timeout is 30 seconds, matching the original config
  };

  const proxy = await getRandomProxy();
  if (proxy) {
    const proxyUrl = proxy.username && proxy.password
      ? `http://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`
      : `http://${proxy.host}:${proxy.port}`;
    fetchOptions.dispatcher = new ProxyAgent(proxyUrl);
  }

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

async function claimReward(baseUrl: string, rewardId: string, nonce: string, cookie: string, rewardType: string = 'normal') {

  let postData;
  if (rewardType === 'anniversary' || rewardId === 'anniversary_reward') {
    postData = new URLSearchParams({
      action: 'claim_anniversary_reward',
      security: nonce
    });
  } else if (rewardType === 'guild' || rewardId === 'guild_reward') {
    postData = new URLSearchParams({
      action: 'claim_reward_tm',
      security: nonce
    });
  } else {
    postData = new URLSearchParams({
      action: 'claim_reward_tdbt',
      reward_id: rewardId,
      security: nonce
    });
  }

  const fetchOptions: any = {
    method: "POST",
    headers: {
      "Accept": "application/json, text/javascript, */*; q=0.01",
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "Cookie": cookie,
      "Referer": `${baseUrl}/thien-dao-ban-thuong`,
    },
    body: postData.toString(),
  };

  try {
    const proxy = await getRandomProxy();
    if (proxy) {
      const proxyUrl = proxy.username && proxy.password
        ? `http://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`
        : `http://${proxy.host}:${proxy.port}`;
      fetchOptions.dispatcher = new ProxyAgent(proxyUrl);
    }

    const response = await fetch(`${baseUrl}/wp-admin/admin-ajax.php`, fetchOptions);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to claim reward: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data: any = await response.json();
    return { success: true, data: data.message };
  } catch (error: any) {
    console.error("Error during batch claimReward API request:", error.message);
    return { success: false, data: { message: error.message } };
  }
}

async function processAccountRewards(account: any, baseUrl: string): Promise<ClaimResult> {
  const result: ClaimResult = {
    accountId: account.id,
    accountName: account.name,
    success: false,
    claimed: 0,
    total: 0,
    details: [],
    error: null,
  };

  try {
    const url = `${baseUrl}/thien-dao-ban-thuong?t=9e876`;
    const html = await fetchPageContent(url, account.cookie);

    const nonces = extractNonces(html);
    if (Object.keys(nonces).length === 0 || !nonces.default) {
      result.error = "Could not extract any nonce from page";
      return result;
    }

    const allRewards = extractRewards(html);
    const claimableRewards = allRewards.filter(r => r.canClaim);
    result.total = claimableRewards.length;

    if (claimableRewards.length === 0) {
      result.success = true;
      return result;
    }

    for (const reward of claimableRewards) {
      const claimDetail: ClaimDetail = {
        id: reward.id,
        title: reward.title,
        success: false,
        message: ''
      };

      const nonceForReward = nonces[reward.type] || nonces['default'];
      if (!nonceForReward) {
        claimDetail.success = false;
        claimDetail.error = `Could not find nonce for reward type: ${reward.type}`;
        result.details.push(claimDetail);
        continue;
      }

      try {


        const claimResponse = await claimReward(
          baseUrl,
          reward.id,
          nonceForReward,
          account.cookie,
          reward.type
        );

        if (claimResponse.success) {
          claimDetail.success = true;
          claimDetail.reward = claimResponse.data || claimResponse;
          claimDetail.message = claimResponse.data?.message || 'Claimed successfully';
          result.claimed++;
        } else {
          claimDetail.success = false;
          claimDetail.error = claimResponse.data?.message || 'Failed to claim';
        }
      } catch (e: any) {
        claimDetail.success = false;
        claimDetail.error = e.message;
      }
      result.details.push(claimDetail);
    }

    result.success = true;
  } catch (error: any) {
    result.error = error.message;
  }
  return result;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.zalo_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { accountIds, allAccounts = false } = body;

    let accounts;

    if (allAccounts) {
      accounts = await prisma.account.findMany({
        where: {
          creatorId: session.user.zalo_id,
          isLogout: false,
          toggle: true
        },
        select: {
          id: true,
          name: true,
          cookie: true,
          proxy: true
        }
      });
    } else if (accountIds && Array.isArray(accountIds)) {
      accounts = await prisma.account.findMany({
        where: {
          id: { in: accountIds.map((id: string) => parseInt(id)) },
          creatorId: session.user.zalo_id,
          isLogout: false
        },
        select: {
          id: true,
          name: true,
          cookie: true,
          proxy: true
        }
      });
    } else {
      return NextResponse.json({
        error: "Either accountIds array or allAccounts=true is required"
      }, { status: 400 });
    }

    if (accounts.length === 0) {
      return NextResponse.json({ error: "No valid accounts found" }, { status: 404 });
    }

    const baseUrlConfig = await prisma.config.findUnique({
      where: { key: 'BASE_URL' }
    });

    if (!baseUrlConfig) {
      return NextResponse.json({ error: "BASE_URL config not found" }, { status: 500 });
    }

    const baseUrl = baseUrlConfig.value;
    const results: ClaimResult[] = [];

    const CHUNK_SIZE = 5;
    for (let i = 0; i < accounts.length; i += CHUNK_SIZE) {
      const chunk = accounts.slice(i, i + CHUNK_SIZE);

      const chunkResults = await Promise.all(
        chunk.map(async (account) => {
          return processAccountRewards(account, baseUrl);
        })
      );

      results.push(...chunkResults);
    }

    const summary = {
      totalAccounts: results.length,
      successfulAccounts: results.filter(r => r.success).length,
      totalRewardsClaimed: results.reduce((sum, r) => sum + r.claimed, 0),
      totalRewardsAvailable: results.reduce((sum, r) => sum + r.total, 0)
    };

    return NextResponse.json({
      success: true,
      data: results,
      summary
    });

  } catch (error: any) {
    console.error("Error in batch claim:", error);
    return NextResponse.json({
      error: "Internal server error",
      message: error.message || "Unknown error"
    }, { status: 500 });
  }
}