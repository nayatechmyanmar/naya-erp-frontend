import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api/server-client';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search');
  const endpoint = search ? `/master/suppliers?search=${encodeURIComponent(search)}` : '/master/suppliers';
  const result = await backendFetch(endpoint);
  return NextResponse.json(result, { status: result.status });
}

export async function POST(req: Request) {
  const body = await req.json();
  const result = await backendFetch('/master/suppliers', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return NextResponse.json(result, { status: result.status });
}
