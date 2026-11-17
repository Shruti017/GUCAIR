import { Buffer } from 'node:buffer';
import crypto from 'node:crypto';
import serverless from 'serverless-http';
import type { NextRequest } from 'next/server';
import { connectDatabase } from '@/server/config/db';
import { productionConfigurationError } from '@/server/config/production';
import { createApiApp } from '@/server/app';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const app = createApiApp();
const expressHandler = serverless(app, {
  binary: ['application/pdf', 'application/octet-stream']
});

async function dispatch(request: NextRequest): Promise<Response> {
  try {
    if (process.env.NODE_ENV === 'production') {
      const configurationError = productionConfigurationError();
      if (configurationError) {
        console.error(`GUCAIR production configuration error: ${configurationError}`);
        return Response.json({ message: 'Server configuration is incomplete.' }, { status: 500 });
      }
    }

    const method = request.method.toUpperCase();
    const safeMethod = method === 'GET' || method === 'HEAD' || method === 'OPTIONS';
    const cookies = request.cookies.getAll();
    const hasSessionCookie = cookies.some(({ name }) => name === 'gucair_access' || name === 'gucair_refresh');
    if (!safeMethod && hasSessionCookie) {
      const requestOrigin = new URL(request.url).origin;
      if (request.headers.get('origin') !== requestOrigin) {
        return Response.json({ message: 'Request origin could not be verified.' }, { status: 403 });
      }
    }
    await connectDatabase(process.env.MONGODB_URI || '');
    const url = new URL(request.url);
    const body = method === 'GET' || method === 'HEAD'
      ? undefined
      : await request.text();

    const headerRecord = Object.fromEntries(request.headers.entries());
    if (cookies.length) {
      headerRecord.cookie = cookies.map(({ name, value }) => `${name}=${value}`).join('; ');
    }
    const event = {
      resource: url.pathname,
      path: url.pathname,
      httpMethod: method,
      headers: headerRecord,
      multiValueHeaders: Object.fromEntries(
        Object.entries(headerRecord).map(([key, value]) => [key, [value]])
      ),
      queryStringParameters: Object.fromEntries(url.searchParams.entries()),
      multiValueQueryStringParameters: null,
      pathParameters: null,
      stageVariables: null,
      body: body || null,
      isBase64Encoded: false,
      requestContext: {
        accountId: 'gucair',
        apiId: 'gucair-next',
        protocol: 'HTTP/1.1',
        httpMethod: method,
        path: url.pathname,
        stage: '$default',
        requestId: crypto.randomUUID(),
        resourcePath: url.pathname,
        requestTimeEpoch: Date.now(),
        identity: { sourceIp: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1' }
      }
    };

    const result: any = await expressHandler(event as any, {} as any);
    const headers = new Headers(result.headers || {});
    for (const [key, values] of Object.entries(result.multiValueHeaders || {})) {
      for (const value of (Array.isArray(values) ? values : [values])) headers.append(key, String(value));
    }
    const responseBody = result.isBase64Encoded
      ? new Uint8Array(Buffer.from(result.body || '', 'base64'))
      : (result.body ?? null);

    return new Response(responseBody, {
      status: result.statusCode || 200,
      headers
    });
  } catch (error) {
    console.error('GUCAIR API request failed:', error);
    return Response.json(
      { message: 'The GUCAIR service is temporarily unavailable. Check the server configuration.' },
      { status: 500 }
    );
  }
}

export const GET = dispatch;
export const POST = dispatch;
export const PUT = dispatch;
export const PATCH = dispatch;
export const DELETE = dispatch;
export const OPTIONS = dispatch;
export const HEAD = dispatch;
