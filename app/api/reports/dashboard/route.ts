import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api/server-client';

export async function GET() {
  const result = await backendFetch('/reports/dashboard');
  return NextResponse.json(result, { status: result.status });
}
