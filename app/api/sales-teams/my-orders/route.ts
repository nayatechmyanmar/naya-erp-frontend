import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api/server-client';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const page = searchParams.get('page');
  const limit = searchParams.get('limit');

  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (page) params.set('page', page);
  if (limit) params.set('limit', limit);

  const qs = params.toString();
  const endpoint = qs ? `/sales-teams/my-orders?${qs}` : '/sales-teams/my-orders';
  const result = await backendFetch(endpoint);
  return NextResponse.json(result, { status: result.status });
}
