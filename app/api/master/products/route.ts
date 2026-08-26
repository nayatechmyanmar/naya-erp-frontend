import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api/server-client';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search');
  const type = searchParams.get('type');
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (type) params.set('type', type);

  const qs = params.toString();
  const endpoint = qs ? `/master/products?${qs}` : '/master/products';
  const result = await backendFetch(endpoint);
  return NextResponse.json(result, { status: result.status });
}

export async function POST(req: Request) {
  const body = await req.json();
  const result = await backendFetch('/master/products', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return NextResponse.json(result, { status: result.status });
}
