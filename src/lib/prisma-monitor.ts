import { Prisma } from '@prisma/client';

interface QueryInfo {
  query: string;
  params: string;
  duration: number;
  target: string;
}

export function createPrismaMonitor() {
  return Prisma.defineExtension({
    name: 'query-monitor',
    query: {
      $allModels: {
        async $allOperations({ operation, model, args, query }) {
          const start = Date.now();
          
          try {
            const result = await query(args);
            const duration = Date.now() - start;
            
            // Log slow queries (>100ms) or in development
            if (duration > 350 || process.env.NODE_ENV === "development") {
              const queryInfo: QueryInfo = {
                query: `${model}.${operation}`,
                params: JSON.stringify(args).substring(0, 200),
                duration,
                target: model || "unknown",
              };

              if (duration > 350) {
                console.warn(
                  `🐌 Slow query detected: ${queryInfo.query} (${duration}ms)`
                );
                console.warn(`   Params: ${queryInfo.params}`);
              } else {
                console.log(`📊 ${queryInfo.query}: ${duration}ms`);
              }
            }
            
            return result;
          } catch (error) {
            const duration = Date.now() - start;
            console.error(`❌ Query failed: ${model}.${operation} (${duration}ms)`, error);
            throw error;
          }
        },
      },
    },
  });
}

// Performance analytics
export class QueryAnalytics {
  private static queries: QueryInfo[] = [];
  private static readonly MAX_QUERIES = 100;

  static addQuery(info: QueryInfo) {
    this.queries.push(info);
    
    // Keep only recent queries
    if (this.queries.length > this.MAX_QUERIES) {
      this.queries = this.queries.slice(-this.MAX_QUERIES);
    }
  }

  static getSlowQueries(threshold: number = 100): QueryInfo[] {
    return this.queries.filter(q => q.duration > threshold);
  }

  static getQueryStats() {
    if (this.queries.length === 0) return null;

    const totalQueries = this.queries.length;
    const totalDuration = this.queries.reduce((sum, q) => sum + q.duration, 0);
    const avgDuration = totalDuration / totalQueries;
    const slowQueries = this.getSlowQueries();

    return {
      totalQueries,
      avgDuration: Math.round(avgDuration * 100) / 100,
      totalDuration,
      slowQueries: slowQueries.length,
      slowestQuery: slowQueries.reduce((max, q) => q.duration > max.duration ? q : max, { duration: 0 })
    };
  }

  static generateReport(): string {
    const stats = this.getQueryStats();
    if (!stats) return 'No query data available';

    return `
📊 Database Performance Report:
  - Total queries: ${stats.totalQueries}
  - Average duration: ${stats.avgDuration}ms
  - Total DB time: ${stats.totalDuration}ms
  - Slow queries: ${stats.slowQueries}
  - Slowest query: ${stats.slowestQuery.query} (${stats.slowestQuery.duration}ms)
    `;
  }

  static clear() {
    this.queries = [];
  }
} 