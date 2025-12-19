/**
 * 健康检查 API 端点
 * 用于 Docker 健康检查和监控
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  checks: {
    database: boolean;
    cache: boolean;
  };
}

/**
 * GET /api/health
 * 返回系统健康状态
 */
export async function GET() {
  try {
    const memoryUsage = process.memoryUsage();
    const totalMemory = memoryUsage.heapTotal;
    const usedMemory = memoryUsage.heapUsed;

    const health: HealthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: Math.round(usedMemory / 1024 / 1024), // MB
        total: Math.round(totalMemory / 1024 / 1024), // MB
        percentage: Math.round((usedMemory / totalMemory) * 100),
      },
      checks: {
        database: true, // 可以添加实际的数据库连接检查
        cache: true, // 可以添加实际的缓存检查
      },
    };

    // 如果内存使用超过 90%，标记为不健康
    if (health.memory.percentage > 90) {
      health.status = 'unhealthy';
    }

    return NextResponse.json(health, {
      status: health.status === 'healthy' ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
