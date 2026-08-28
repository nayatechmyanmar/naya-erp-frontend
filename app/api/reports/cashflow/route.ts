import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api/server-client';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);

  const qs = params.toString();
  const endpoint = qs ? `/reports/cashflow?${qs}` : '/reports/cashflow';
  const result = await backendFetch(endpoint);
  return NextResponse.json(result, { status: result.status });
}
