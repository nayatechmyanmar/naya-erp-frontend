import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuthToken } from '@/lib/api/server-client';

export async function GET() {
  const cookieStore = await cookies();
  const token = await getAuthToken();
  const userSessionStr = cookieStore.get('user_session')?.value;

  if (!token) {
    return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
  }

  if (userSessionStr) {
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
      // Fall through to error
    }
  }

  return NextResponse.json({ success: false, message: 'Invalid session' }, { status: 401 });
}
