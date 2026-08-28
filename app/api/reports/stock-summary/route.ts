import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api/server-client';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const warehouseId = searchParams.get('warehouseId');
  const lowStockThreshold = searchParams.get('lowStockThreshold');

  const params = new URLSearchParams();
  if (warehouseId) params.set('warehouseId', warehouseId);
  if (lowStockThreshold) params.set('lowStockThreshold', lowStockThreshold);

  const qs = params.toString();
  const endpoint = qs ? `/reports/stock-summary?${qs}` : '/reports/stock-summary';
  const result = await backendFetch(endpoint);
  return NextResponse.json(result, { status: result.status });
}
