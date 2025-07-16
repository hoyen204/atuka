import ApiRequestService from "@/app/services/ApiService";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../../../lib/auth.config";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.zalo_id) {
      return NextResponse.json(
        { error: "Bạn không có quyền truy cập" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { host, port, username, password } = body;

    if (!host || !port) {
      return NextResponse.json(
        { error: "Host và port không được để trống" },
        { status: 400 }
      );
    }

    try {
      let proxyUrl = `http://${host}:${port}`;
      if (username && password) {
        proxyUrl = `http://${username}:${password}@${host}:${port}`;
      }
      const url = await prisma.config.findUnique({
        where: {
          key: "BASE_URL",
        },
      });

      const request = ApiRequestService.gI();

      const response = await request.requestWithRetry(
        "https://api64.ipify.org?format=json",
        {
          method: "GET",
        },
        proxyUrl
      );

      const response2 = await request.requestWithRetry(
        `${url!.value}`,
        {
          method: "GET",
        },
        proxyUrl
      );
      let message = "Proxy hoạt động bình thường";
      let status = "success";
      if (response2.status === 200) {
        message = "Proxy hoạt động bình thường";
        status = "success";
      } else if (response.status === 200) {
        message = "Proxy hoạt động, nhưng không có kết nối đến HH3D";
        status = "warning";
      } else {
        message = "Proxy không hoạt động, vui lòng kiểm tra lại proxy";
        status = "error";
      }

      return NextResponse.json({
        success: status !== "error",
        status: status,
        message: message,
        ip: response.data.ip,
        responseTime: Date.now(),
      });
    } catch (testError: any) {
      return NextResponse.json(
        {
          success: false,
          message: "Kiểm tra proxy thất bại",
          error: testError.message || "Lỗi không xác định",
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error testing proxy:", error);
    return NextResponse.json({ error: "Lỗi không xác định" }, { status: 500 });
  }
}
