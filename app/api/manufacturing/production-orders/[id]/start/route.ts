import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api/server-client';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await backendFetch(`/manufacturing/production-orders/${id}/start`, {
    method: 'PUT',
  });
  return NextResponse.json(result, { status: result.status });
}
