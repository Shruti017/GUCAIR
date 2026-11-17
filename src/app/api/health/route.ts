import { connectDatabase } from '@/server/config/db';
import { productionConfigurationError } from '@/server/config/production';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (process.env.NODE_ENV === 'production' && productionConfigurationError()) {
      return Response.json({ status: 'error', service: 'gucair', database: 'unavailable', configuration: 'invalid' }, { status: 503 });
    }
    await connectDatabase(process.env.MONGODB_URI || '');
    return Response.json({ status: 'ok', service: 'gucair', database: 'connected', configuration: 'valid', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('GUCAIR health check failed:', error);
    return Response.json({ status: 'error', service: 'gucair', database: 'unavailable' }, { status: 503 });
  }
}
