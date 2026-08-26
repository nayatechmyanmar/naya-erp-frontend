import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  const userSessionStr = cookieStore.get('user_session')?.value;

  if (!token || !userSessionStr) {
    return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
  }

  try {
    const user = JSON.parse(userSessionStr);
    return NextResponse.json({
      success: true,
      data: {
        user,
        tenantId: user.tenantId,
      },
    });
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid session' }, { status: 401 });
  }
}
