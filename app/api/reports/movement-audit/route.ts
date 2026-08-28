import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api/server-client';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const warehouseId = searchParams.get('warehouseId');
  const productId = searchParams.get('productId');
  const type = searchParams.get('type');
  const page = searchParams.get('page');
  const limit = searchParams.get('limit');

  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  if (warehouseId) params.set('warehouseId', warehouseId);
  if (productId) params.set('productId', productId);
  if (type) params.set('type', type);
  if (page) params.set('page', page);
  if (limit) params.set('limit', limit);

  const qs = params.toString();
  const endpoint = qs ? `/reports/movement-audit?${qs}` : '/reports/movement-audit';
  const result = await backendFetch(endpoint);
  return NextResponse.json(result, { status: result.status });
}
