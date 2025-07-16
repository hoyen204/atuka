import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { HttpsProxyAgent } from "https-proxy-agent";
import { randomInt } from "crypto";
import { extractRewards, extractNonces, Reward } from "@/lib/reward-extractor";
import ApiRequestService from "@/app/services/ApiService";

interface RewardInfo {
  rewards: Reward[];
  nonces: Record<string, string>;
  username: string;
  cookie: string;
  proxy: string | null;
}

interface PageInfo {
  rewards: Reward[];
  nonces: Record<string, string>;
  error?: string;
}

async function fetchWithProxy(url: string, cookie: string, proxy?: string): Promise<string> {
  
  const config: any = {
    headers: {
      'cookie': cookie,
    },
  };
  
  const response = await ApiRequestService.gI().requestWithRetry(url, config, proxy);
  return response.data;
}

async function claimReward(baseUrl: string, rewardId: string, nonce: string, cookie: string, proxy?: string, rewardType: string = 'normal') {
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
  
  const config = {
    method: 'POST',
    url: `${baseUrl}/wp-admin/admin-ajax.php`,
    headers: {
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'cookie': cookie,
      'origin': baseUrl,
      'referer': `${baseUrl}/thien-dao-ban-thuong`,
    },
    data: postData,
    timeout: 15000,
  };

  try {
    const response = await ApiRequestService.gI().requestWithRetry(config.url, config, proxy);
    return { success: true, data: response.data };
  } catch (error: any) {
    const errorMessage = error.response?.data?.data?.message || error.response?.data?.message || error.message;
    return { success: false, data: { message: errorMessage } };
  }
}

async function getRewardsInfo(account: any, baseUrl: string): Promise<PageInfo> {
  if (!account || !account.cookie) {
    return { rewards: [], nonces: {}, error: "Account cookie not found" };
  }

  try {
    const url = `${baseUrl}/thien-dao-ban-thuong?t=${randomInt(1000000000, 9999999999)}`;
    const html = await fetchWithProxy(url, account.cookie, account.proxy || undefined);

    const rewards = extractRewards(html);
    const nonces = extractNonces(html);
    
    if (Object.keys(nonces).length === 0 || !nonces.default) {
      return { rewards: [], nonces: {}, error: "Could not extract nonce from page" };
    }

    return { rewards, nonces };
  } catch (error: any) {
    return { rewards: [], nonces: {}, error: error.message };
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.zalo_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('accountId');
    
    if (!accountId) {
      return NextResponse.json({ error: "Account ID is required" }, { status: 400 });
    }

    const account = await prisma.account.findFirst({
      where: {
        id: parseInt(accountId),
        creatorId: session.user.zalo_id
      }
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const baseUrlConfig = await prisma.config.findUnique({
      where: { key: 'BASE_URL' }
    });
    
    if (!baseUrlConfig) {
      return NextResponse.json({ error: "BASE_URL config not found" }, { status: 500 });
    }

    const baseUrl = baseUrlConfig.value;
    const rewardsInfo = await getRewardsInfo(account, baseUrl);

    if (rewardsInfo.error) {
      return NextResponse.json({ error: rewardsInfo.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: rewardsInfo });

  } catch (error: any) {
    console.error("Error fetching thien dao ban thuong:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      message: error.message || "Unknown error"
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.zalo_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { accountId, rewardId, nonce, baseUrl, rewardType } = body;
    
    if (!accountId || !rewardId || !nonce || !baseUrl) {
      return NextResponse.json({ 
        error: "Missing required fields: accountId, rewardId, nonce, baseUrl" 
      }, { status: 400 });
    }

    const account = await prisma.account.findFirst({
      where: {
        id: parseInt(accountId),
        creatorId: session.user.zalo_id
      }
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const result = await claimReward(
      baseUrl,
      rewardId,
      nonce,
      account.cookie,
      account.proxy || undefined,
      rewardType || 'normal'
    );

    return NextResponse.json({ 
      success: true, 
      data: result,
      message: "Reward claimed successfully"
    });

  } catch (error: any) {
    console.error("Error claiming reward:", error);
    return NextResponse.json({ 
      error: "Failed to claim reward",
      message: error.message || "Unknown error"
    }, { status: 500 });
  }
} 