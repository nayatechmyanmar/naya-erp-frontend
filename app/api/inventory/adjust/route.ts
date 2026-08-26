import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api/server-client';

export async function POST(req: Request) {
  const body = await req.json();
  const result = await backendFetch('/inventory/adjust', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return NextResponse.json(result, { status: result.status });
}
