import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth.config";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.zalo_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { host, port, username, password } = body;

    if (!host || !port) {
      return NextResponse.json({ error: "Host and port are required" }, { status: 400 });
    }

    try {
      const axios = require('axios');
      const HttpsProxyAgent = require('https-proxy-agent');
      
      let proxyUrl = `http://${host}:${port}`;
      if (username && password) {
        proxyUrl = `http://${username}:${password}@${host}:${port}`;
      }

      const agent = new HttpsProxyAgent(proxyUrl);
      
      const response = await axios.get('https://httpbin.org/ip', {
        httpsAgent: agent,
        timeout: 10000
      });

      return NextResponse.json({
        success: true,
        message: "Proxy connection successful",
        ip: response.data.origin,
        responseTime: Date.now()
      });

    } catch (testError: any) {
      return NextResponse.json({
        success: false,
        message: "Proxy connection failed",
        error: testError.message || "Unknown error"
      }, { status: 400 });
    }

  } catch (error) {
    console.error("Error testing proxy:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 