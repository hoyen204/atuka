import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { HttpsProxyAgent } from "https-proxy-agent";
import { extractRewards, extractNonces } from "@/lib/reward-extractor";
import ApiRequestService from "@/app/services/ApiService";

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

async function fetchPageContent(url: string, cookie: string, proxy?: string): Promise<string> {
  
  const config: any = {
    method: 'GET',
    url: url,
    headers: {
      'cookie': cookie,
      'user-agent': 'XXX'
    },
    timeout: 30000
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
  
  const config: any = {
    method: "POST",
    url: `${baseUrl}/wp-admin/admin-ajax.php`,
    headers: {
      accept: "application/json, text/javascript, */*; q=0.01",
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      cookie: cookie,
      referer: `${baseUrl}/thien-dao-ban-thuong`,
    },
    data: postData,
  };

  const url = `${baseUrl}/wp-admin/admin-ajax.php`;
  try {
    const response = await ApiRequestService.gI().requestWithRetry(url, config, proxy);
    return { success: true, data: response.data };
  } catch (error: any) {
    const errorMessage = error.response?.data?.data?.message || error.response?.data?.message || error.message;
    return { success: false, data: { message: errorMessage } };
  }
}

async function processAccountRewards(account: any, baseUrl:string): Promise<ClaimResult> {
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
    const html = await fetchPageContent(url, account.cookie, account.proxy || undefined);
    
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
        // Add a random delay to mimic human behavior
        await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500));
        
        const claimResponse = await claimReward(
          baseUrl,
          reward.id,
          nonceForReward,
          account.cookie,
          account.proxy || undefined,
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
    
    for (const account of accounts) {
      const result = await processAccountRewards(account, baseUrl);
      results.push(result);
      
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));
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