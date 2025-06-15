import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import logger from './lib/logger'
import { turso } from '@/lib/turso'

const RATE_LIMIT_COUNT = 21;
const RATE_LIMIT_WINDOW = 60 * 1000;

const useTurso = process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN;

const inMemoryRateLimitStore = new Map<string, { count: number, windowStart: number }>();

async function getRateLimitRecord(ip: string) {
  if (useTurso) {
    try {
      const result = await turso.execute({
        sql: 'SELECT count, window_start FROM rate_limits WHERE ip = ?',
        args: [ip]
      });
      if (result.rows.length > 0) {
        return {
          count: result.rows[0].count as number,
          windowStart: result.rows[0].window_start as number
        };
      }
    } catch (error) {
      logger.error('Error fetching rate limit record from Turso', { ip, error });
    }
    return null;
  } else {
    return inMemoryRateLimitStore.get(ip);
  }
}

async function updateRateLimitRecord(ip: string, count: number, windowStart: number) {
  if (useTurso) {
    try {
      await turso.execute({
        sql: 'INSERT OR REPLACE INTO rate_limits (ip, count, window_start) VALUES (?, ?, ?)',
        args: [ip, count, windowStart]
      });
    } catch (error) {
      logger.error('Error updating rate limit record in Turso', { ip, error });
    }
  } else {
    inMemoryRateLimitStore.set(ip, { count, windowStart });
  }
}

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/chat')) {
    logger.info('Handling API chat request', { path: request.nextUrl.pathname });

    const internalToken = process.env.INTERNAL_API_TOKEN;
    const requestToken = request.headers.get('X-Internal-API-Token');

    if (!internalToken || requestToken !== internalToken) {
      logger.warn('Invalid or missing internal API token', { ip: request.headers.get('x-forwarded-for') });
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Forbidden' }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      );
    }

    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
    
    const clonedRequest = request.clone();
    let body;
    try {
        body = await clonedRequest.json();
    } catch (e) {
        logger.error('Error parsing request body', { error: e });
        return NextResponse.next();
    }
    
    if (body.modelAlias === 'NPT 1.5') {
      const record = await getRateLimitRecord(ip);
      const now = Date.now();

      if (record && (now - record.windowStart < RATE_LIMIT_WINDOW)) {
        if (record.count >= RATE_LIMIT_COUNT) {
          logger.warn('Rate limit exceeded', { ip, model: 'NPT 1.5', count: record.count, windowStart: record.windowStart });
          const resetTime = record.windowStart + RATE_LIMIT_WINDOW;
          const remainingSeconds = Math.ceil((resetTime - now) / 1000);
          
          return new NextResponse(
            JSON.stringify({
              success: false,
              message: 'Rate limit exceeded for this model.',
              retryAfter: remainingSeconds
            }),
            { status: 429, headers: { 'content-type': 'application/json' } }
          );
        }
        await updateRateLimitRecord(ip, record.count + 1, record.windowStart);
      } else {
        await updateRateLimitRecord(ip, 1, now);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
}