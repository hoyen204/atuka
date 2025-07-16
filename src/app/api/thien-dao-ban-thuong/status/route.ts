import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { extractRewards } from "@/lib/reward-extractor";
import { randomInt } from "crypto";
import { HttpsProxyAgent } from "https-proxy-agent";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import ApiRequestService from "@/app/services/ApiService";

interface AccountStatus {
  accountId: number;
  accountName: string;
  success: boolean;
  error?: string;
  totalRewards: number;
  claimableRewards: number;
  claimedRewards: number;
  rewards: RewardStatus[];
}

interface RewardStatus {
  id: string;
  title: string;
  description: string;
  claimed: boolean;
  canClaim: boolean;
  type?: string;
}

async function fetchPageContent(
  url: string,
  cookie: string,
  proxy?: string
): Promise<string> {
  const config: any = {
    headers: {
      cookie: cookie,
    },
  };

  const response = await ApiRequestService.gI().requestWithRetry(url, config, proxy);
  return response.data;
}

async function getAccountStatus(
  account: any,
  baseUrl: string
): Promise<AccountStatus> {
  const status: AccountStatus = {
    accountId: account.id,
    accountName: account.name,
    success: false,
    totalRewards: 0,
    claimableRewards: 0,
    claimedRewards: 0,
    rewards: [],
  };

  try {
    const url = `${baseUrl}/thien-dao-ban-thuong?t=${randomInt(
      1000000000,
      9999999999
    )}`;
    const html = await fetchPageContent(
      url,
      account.cookie,
      account.proxy || undefined
    );

    const rewards = extractRewards(html);

    status.rewards = rewards.map((r) => ({ ...r, type: r.type || "normal" }));
    status.totalRewards = rewards.length;
    status.claimableRewards = rewards.filter((r) => r.canClaim).length;
    status.claimedRewards = rewards.filter((r) => r.claimed).length;
    status.success = true;
  } catch (error: any) {
    status.error = error.message || "Unknown error";
  }

  return status;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.zalo_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { accountIds } = body;

    let accounts;

    if (accountIds && Array.isArray(accountIds) && accountIds.length > 0) {
       accounts = await prisma.account.findMany({
        where: {
          id: { in: accountIds.map(id => Number(id)) },
          creatorId: session.user.zalo_id,
          isLogout: false,
        },
        select: {
          id: true,
          name: true,
          cookie: true,
          proxy: true,
        },
      });
    } else {
       accounts = await prisma.account.findMany({
        where: {
          creatorId: session.user.zalo_id,
          isLogout: false,
          toggle: true,
        },
        select: {
          id: true,
          name: true,
          cookie: true,
          proxy: true,
        },
      });
    }

    if (!accounts || accounts.length === 0) {
      return NextResponse.json(
        { error: "No valid accounts found" },
        { status: 404 }
      );
    }

    const baseUrlConfig = await prisma.config.findUnique({
      where: { key: "BASE_URL" },
    });

    if (!baseUrlConfig) {
      return NextResponse.json(
        { error: "BASE_URL config not found" },
        { status: 500 }
      );
    }

    const baseUrl = baseUrlConfig.value;
    const results: AccountStatus[] = [];

    for (const account of accounts) {
      const status = await getAccountStatus(account, baseUrl);
      results.push(status);
      await new Promise((resolve) =>
        setTimeout(resolve, 500 + Math.random() * 500)
      );
    }

    const summary = {
      totalAccounts: results.length,
      successfulAccounts: results.filter((r) => r.success).length,
      totalClaimableRewards: results.reduce(
        (sum, r) => sum + r.claimableRewards,
        0
      ),
      totalClaimedRewards: results.reduce(
        (sum, r) => sum + r.claimedRewards,
        0
      ),
      totalRewards: results.reduce((sum, r) => sum + r.totalRewards, 0),
    };

    return NextResponse.json({
      success: true,
      data: results,
      summary,
    });
  } catch (error: any) {
    console.error("Error checking status via POST:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.zalo_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountIdsParam = searchParams.get("accountIds");
    const allAccounts = searchParams.get("allAccounts") === "true";

    let accounts;

    if (allAccounts) {
      accounts = await prisma.account.findMany({
        where: {
          creatorId: session.user.zalo_id,
          isLogout: false,
          toggle: true,
        },
        select: {
          id: true,
          name: true,
          cookie: true,
          proxy: true,
        },
      });
    } else if (accountIdsParam) {
      const accountIds = accountIdsParam
        .split(",")
        .map((id) => parseInt(id.trim()))
        .filter((id) => !isNaN(id));

      if (accountIds.length === 0) {
        return NextResponse.json(
          { error: "Invalid account IDs" },
          { status: 400 }
        );
      }

      accounts = await prisma.account.findMany({
        where: {
          id: { in: accountIds },
          creatorId: session.user.zalo_id,
          isLogout: false,
        },
        select: {
          id: true,
          name: true,
          cookie: true,
          proxy: true,
        },
      });
    } else {
      return NextResponse.json(
        {
          error: "Either accountIds parameter or allAccounts=true is required",
        },
        { status: 400 }
      );
    }

    if (accounts.length === 0) {
      return NextResponse.json(
        { error: "No valid accounts found" },
        { status: 404 }
      );
    }

    const baseUrlConfig = await prisma.config.findUnique({
      where: { key: "BASE_URL" },
    });

    if (!baseUrlConfig) {
      return NextResponse.json(
        { error: "BASE_URL config not found" },
        { status: 500 }
      );
    }

    console.log({ baseUrlConfig: baseUrlConfig.value });

    const baseUrl = baseUrlConfig.value;
    const results: AccountStatus[] = [];

    for (const account of accounts) {
      const status = await getAccountStatus(account, baseUrl);
      results.push(status);

      await new Promise((resolve) =>
        setTimeout(resolve, 500 + Math.random() * 500)
      );
    }

    const summary = {
      totalAccounts: results.length,
      successfulAccounts: results.filter((r) => r.success).length,
      totalClaimableRewards: results.reduce(
        (sum, r) => sum + r.claimableRewards,
        0
      ),
      totalClaimedRewards: results.reduce(
        (sum, r) => sum + r.claimedRewards,
        0
      ),
      totalRewards: results.reduce((sum, r) => sum + r.totalRewards, 0),
    };

    return NextResponse.json({
      success: true,
      data: results,
      summary,
    });
  } catch (error: any) {
    console.error("Error checking status:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
