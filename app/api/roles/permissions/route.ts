import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api/server-client';

export async function GET() {
  const result = await backendFetch('/roles/permissions/all');
  return NextResponse.json(result, { status: result.status });
}
