import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api/server-client';

export async function PUT(req: Request) {
  const body = await req.json();
  const result = await backendFetch('/users/me/change-password', {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  return NextResponse.json(result, { status: result.status });
}
