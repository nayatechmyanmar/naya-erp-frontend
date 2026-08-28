import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api/server-client';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const { id, memberId } = await params;
  const body = await req.json();
  const result = await backendFetch(`/sales-teams/${id}/members/${memberId}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  return NextResponse.json(result, { status: result.status });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const { id, memberId } = await params;
  const result = await backendFetch(`/sales-teams/${id}/members/${memberId}`, {
    method: 'DELETE',
  });
  return NextResponse.json(result, { status: result.status });
}
