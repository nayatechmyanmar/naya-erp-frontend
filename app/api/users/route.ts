import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api/server-client';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const queryString = searchParams.toString();
  const endpoint = `/users${queryString ? `?${queryString}` : ''}`;
  const result = await backendFetch(endpoint);
  return NextResponse.json(result, { status: result.status });
}

export async function POST(req: Request) {
  const body = await req.json();
  const result = await backendFetch('/users', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return NextResponse.json(result, { status: result.status });
}
