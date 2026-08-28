import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api/server-client';

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; uomId: string }> }
) {
  const { id, uomId } = await params;
  const result = await backendFetch(`/master/products/${id}/uoms/${uomId}`, {
    method: 'DELETE',
  });
  return NextResponse.json(result, { status: result.status });
}
