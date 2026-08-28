import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api/server-client';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const result = await backendFetch(`/master/products/${id}/uoms`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return NextResponse.json(result, { status: result.status });
}
