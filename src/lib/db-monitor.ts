interface QueryLog {
  query: string;
  duration: number;
  timestamp: number;
  params?: any;
}

interface RequestMetrics {
  requestId: string;
  endpoint: string;
  queries: QueryLog[];
  startTime: number;
  totalQueries: number;
  totalDuration: number;
}

class DatabaseMonitor {
  private static instance: DatabaseMonitor;
  private requests: Map<string, RequestMetrics> = new Map();
  private isEnabled: boolean = process.env.NODE_ENV === 'development';

  static getInstance(): DatabaseMonitor {
    if (!DatabaseMonitor.instance) {
      DatabaseMonitor.instance = new DatabaseMonitor();
    }
    return DatabaseMonitor.instance;
  }

  startRequest(requestId: string, endpoint: string): void {
    if (!this.isEnabled) return;

    this.requests.set(requestId, {
      requestId,
      endpoint,
      queries: [],
      startTime: Date.now(),
      totalQueries: 0,
      totalDuration: 0
    });
  }

  logQuery(requestId: string, query: string, duration: number, params?: any): void {
    if (!this.isEnabled) return;

    const request = this.requests.get(requestId);
    if (!request) return;

    request.queries.push({
      query,
      duration,
      timestamp: Date.now(),
      params
    });
    request.totalQueries++;
    request.totalDuration += duration;
  }

  endRequest(requestId: string): void {
    if (!this.isEnabled) return;

    const request = this.requests.get(requestId);
    if (!request) return;

    const totalTime = Date.now() - request.startTime;
    
    // Detect potential N+1 problems
    const suspiciousPatterns = this.detectN1Problems(request);
    
    if (request.totalQueries > 10 || suspiciousPatterns.length > 0) {
      console.warn(`🚨 Potential performance issue detected:`);
      console.warn(`   Endpoint: ${request.endpoint}`);
      console.warn(`   Total queries: ${request.totalQueries}`);
      console.warn(`   DB time: ${request.totalDuration}ms`);
      console.warn(`   Total time: ${totalTime}ms`);
      
      if (suspiciousPatterns.length > 0) {
        console.warn(`   Suspected N+1 patterns:`);
        suspiciousPatterns.forEach(pattern => {
          console.warn(`     - ${pattern.query} (${pattern.count} times)`);
        });
      }
    } else if (request.totalQueries > 5) {
      console.log(`⚠️  Query count above normal: ${request.endpoint} (${request.totalQueries} queries)`);
    } else {
      console.log(`✅ ${request.endpoint}: ${request.totalQueries} queries in ${totalTime}ms`);
    }

    this.requests.delete(requestId);
  }

  private detectN1Problems(request: RequestMetrics): Array<{query: string, count: number}> {
    const queryPatterns = new Map<string, number>();
    
    request.queries.forEach(log => {
      // Normalize query by removing specific IDs/values
      const normalizedQuery = log.query
        .replace(/\d+/g, '?')
        .replace(/'[^']*'/g, '?')
        .replace(/= \?/g, '= ?')
        .trim();
      
      const count = queryPatterns.get(normalizedQuery) || 0;
      queryPatterns.set(normalizedQuery, count + 1);
    });

    // Return patterns that repeat more than 3 times (potential N+1)
    return Array.from(queryPatterns.entries())
      .filter(([_, count]) => count > 3)
      .map(([query, count]) => ({ query, count }));
  }

  getStats(): any {
    return {
      activeRequests: this.requests.size,
      isEnabled: this.isEnabled
    };
  }
}

export const dbMonitor = DatabaseMonitor.getInstance();

// Utility function to wrap API handlers with monitoring
export function withDBMonitoring<T extends (...args: any[]) => Promise<Response>>(
  handler: T,
  endpoint: string
): T {
  return (async (...args: any[]) => {
    const requestId = `${endpoint}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    dbMonitor.startRequest(requestId, endpoint);
    
    try {
      const result = await handler(...args);
      dbMonitor.endRequest(requestId);
      return result;
    } catch (error) {
      dbMonitor.endRequest(requestId);
      throw error;
    }
  }) as T;
} 