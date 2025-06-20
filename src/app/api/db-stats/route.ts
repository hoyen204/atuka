import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth.config';
import { QueryAnalytics } from '@/lib/prisma-monitor';
import { dbMonitor } from '@/lib/db-monitor';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  // Only allow admin access
  if (!session?.user?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const queryStats = QueryAnalytics.getQueryStats();
    const monitorStats = dbMonitor.getStats();
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      queryAnalytics: queryStats,
      requestMonitor: monitorStats,
      recommendations: generateRecommendations(queryStats)
    });
  } catch (error) {
    console.error('Error fetching DB stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}

function generateRecommendations(stats: any): string[] {
  const recommendations: string[] = [];
  
  if (!stats) {
    recommendations.push('No query data available - monitor is working');
    return recommendations;
  }

  if (stats.avgDuration > 50) {
    recommendations.push('⚠️ Average query time is high (>50ms) - consider adding indexes');
  }

  if (stats.slowQueries > stats.totalQueries * 0.1) {
    recommendations.push('🐌 More than 10% of queries are slow - investigate N+1 problems');
  }

  if (stats.totalQueries > 20) {
    recommendations.push('📊 High query count detected - look for optimization opportunities');
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ Database performance looks good!');
  }

  return recommendations;
} 