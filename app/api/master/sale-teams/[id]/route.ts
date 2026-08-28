import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api/server-client';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const result = await backendFetch(`/master/sale-teams/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  return NextResponse.json(result, { status: result.status });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await backendFetch(`/master/sale-teams/${id}`, {
    method: 'DELETE',
  });
  return NextResponse.json(result, { status: result.status });
}
