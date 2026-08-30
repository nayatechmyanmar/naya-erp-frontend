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

    const isSecure = process.env.COOKIE_SECURE === 'true';

    const cookieOptions = {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    };

    const sessionCookieOptions = {
      httpOnly: false,
      secure: isSecure,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    };

    // Set HTTP-only cookie for accessToken
    cookieStore.set('auth_token', accessToken, cookieOptions);

    // Set user session cookie for fast client session hydration
    cookieStore.set('user_session', JSON.stringify(user), sessionCookieOptions);

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      data: { accessToken, user },
    });

    response.cookies.set('auth_token', accessToken, cookieOptions);
    response.cookies.set('user_session', JSON.stringify(user), sessionCookieOptions);

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
