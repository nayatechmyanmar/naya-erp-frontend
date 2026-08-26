import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { backendFetch } from '@/lib/api/server-client';
import { LoginResponseData } from '@/types/erp';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await backendFetch<LoginResponseData>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    if (!result.success || !result.data?.accessToken) {
      return NextResponse.json(
        { success: false, message: result.message || 'Login failed' },
        { status: result.status || 400 }
      );
    }

    const { accessToken, user } = result.data;
    const cookieStore = await cookies();

    // Set HTTP-only secure cookie for accessToken
    cookieStore.set('auth_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Set user session cookie for fast client session hydration
    cookieStore.set('user_session', JSON.stringify(user), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: { accessToken, user },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
