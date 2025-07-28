import { ProxyAgent, request } from "undici";

class ApiRequestService {
  private static instance: ApiRequestService;

  public static gI() {
    if (!this.instance) {
      this.instance = new ApiRequestService();
    }
    return this.instance;
  }

  constructor() {
    if (ApiRequestService.instance) {
      return ApiRequestService.instance;
    }
    ApiRequestService.instance = this;
  }

  public async requestWithRetry(
    url: string,
    config?: any,
    proxy?: string,
    retryCount = 0,
  ): Promise<any> {
    const options: any = {
      method: config?.method || "GET",
      headers: {
        "User-Agent": "PostmanRuntime/7.44.1",
        ...config?.headers,
      },
    };

    if (proxy) {
      const proxyAgent = new ProxyAgent(proxy);
      options.dispatcher = proxyAgent;
    }

    try {
      const { body, statusCode } = await request(url, options);
      const bodyText = await body.text();
      if (statusCode >= 200 && statusCode < 300) {
        try {
          try {
            const data = JSON.parse(bodyText);
            return {
              data,
              status: statusCode,
            };
          } catch (error) {
            return {
              data: bodyText,
              status: statusCode,
            };
          }
        } catch (error: any) {
          throw new Error(`Error reading response body: ${error.message}`);
        }
      }
      else { 
        return {
          data: bodyText,
          status: statusCode,
        };
      }
    } catch (error: any) {
      if (
        retryCount < 3 &&
        (error.code === "ECONNRESET" ||
          error.code === "ECONNREFUSED" ||
          error.code === "ETIMEDOUT")
      ) {
        const delay = Math.min(1000 * 2 ** retryCount, 5000);
        await new Promise((resolve) => setTimeout(resolve, delay));
        console.log(
          `Retrying request to ${config.url} (attempt ${retryCount + 1}/3)`
        );
        return this.requestWithRetry(url, config, proxy, retryCount + 1);
      }
      console.log("Request Error:", error);
      throw error;
    }
  }
}

export default ApiRequestService;
