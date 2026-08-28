import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api/server-client';

export async function GET() {
  const result = await backendFetch('/sales-teams/all-performance');
  return NextResponse.json(result, { status: result.status });
}
