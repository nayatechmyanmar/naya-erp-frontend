import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api/server-client';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const result = await backendFetch(`/users/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  return NextResponse.json(result, { status: result.status });
}
