import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api/server-client';

export async function GET() {
  const result = await backendFetch('/reports/trial-balance');
  return NextResponse.json(result, { status: result.status });
}
