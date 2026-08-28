import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api/server-client';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const qParams = new URLSearchParams();
  if (from) qParams.set('from', from);
  if (to) qParams.set('to', to);

  const qs = qParams.toString();
  const endpoint = qs ? `/sales-teams/${id}/performance?${qs}` : `/sales-teams/${id}/performance`;
  const result = await backendFetch(endpoint);
  return NextResponse.json(result, { status: result.status });
}
