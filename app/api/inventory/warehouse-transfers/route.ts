import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api/server-client';

export async function GET() {
  const result = await backendFetch('/inventory/warehouse-transfers');
  return NextResponse.json(result, { status: result.status });
}

export async function POST(req: Request) {
  const body = await req.json();
  const result = await backendFetch('/inventory/warehouse-transfers', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return NextResponse.json(result, { status: result.status });
}
