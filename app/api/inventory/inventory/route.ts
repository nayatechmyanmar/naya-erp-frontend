import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api/server-client';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const warehouseId = searchParams.get('warehouseId');
  const productId = searchParams.get('productId');

  const params = new URLSearchParams();
  if (warehouseId) params.set('warehouseId', warehouseId);
  if (productId) params.set('productId', productId);

  const qs = params.toString();
  const endpoint = qs ? `/inventory/inventory?${qs}` : '/inventory/inventory';
  const result = await backendFetch(endpoint);
  return NextResponse.json(result, { status: result.status });
}
