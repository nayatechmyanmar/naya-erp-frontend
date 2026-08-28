import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api/server-client';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const page = searchParams.get('page');
  const limit = searchParams.get('limit');

  const qParams = new URLSearchParams();
  if (status) qParams.set('status', status);
  if (page) qParams.set('page', page);
  if (limit) qParams.set('limit', limit);

  const qs = qParams.toString();
  const endpoint = qs ? `/sales-teams/${id}/orders?${qs}` : `/sales-teams/${id}/orders`;
  const result = await backendFetch(endpoint);
  return NextResponse.json(result, { status: result.status });
}
