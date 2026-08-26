import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api/server-client';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await backendFetch('/auth/register-user', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    return NextResponse.json(
      { success: result.success, message: result.message, data: result.data },
      { status: result.status }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
