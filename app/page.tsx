'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  ShoppingCart,
  Boxes,
  Factory,
  Landmark,
  ArrowUpRight,
  AlertTriangle,
  Clock,
  Plus,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { apiFetch } from '@/lib/api/bff-client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatCurrency, formatQuantity, formatDate } from '@/lib/utils';
import { InventoryMovement, PurchaseOrder, SalesOrder, ProductionOrder } from '@/types/erp';

export default function DashboardPage() {
  const { orgContext } = useAuth();

  const [isLoading, setIsLoading] = React.useState(true);
  const [salesOrders, setSalesOrders] = React.useState<SalesOrder[]>([]);
  const [purchaseOrders, setPurchaseOrders] = React.useState<PurchaseOrder[]>([]);
  const [productionOrders, setProductionOrders] = React.useState<ProductionOrder[]>([]);
  const [movements, setMovements] = React.useState<InventoryMovement[]>([]);
  const [stock, setStock] = React.useState<any[]>([]);

  const loadDashboardData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [soRes, poRes, prodRes, movRes, stockRes] = await Promise.all([
        apiFetch<SalesOrder[]>('/api/sales/sales-orders'),
        apiFetch<PurchaseOrder[]>('/api/purchase/purchase-orders'),
        apiFetch<ProductionOrder[]>('/api/manufacturing/production-orders'),
        apiFetch<InventoryMovement[]>('/api/inventory/movements'),
        apiFetch<any[]>('/api/inventory/inventory'),
      ]);

      if (soRes.success && Array.isArray(soRes.data)) setSalesOrders(soRes.data);
      if (poRes.success && Array.isArray(poRes.data)) setPurchaseOrders(poRes.data);
      if (prodRes.success && Array.isArray(prodRes.data)) setProductionOrders(prodRes.data);
      if (movRes.success && Array.isArray(movRes.data)) setMovements(movRes.data);
      if (stockRes.success && Array.isArray(stockRes.data)) setStock(stockRes.data);
    } catch (e) {
      console.error('Error loading dashboard data:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Derived Metrics
  const totalSalesCount = salesOrders.length;
  const pendingShipments = salesOrders.filter(o => o.status === 'CONFIRMED' || o.status === 'PARTIALLY_SHIPPED').length;
  const pendingReceipts = purchaseOrders.filter(p => p.status === 'CONFIRMED' || p.status === 'PARTIALLY_RECEIVED').length;
  const activeProduction = productionOrders.filter(pr => pr.status === 'IN_PROGRESS' || pr.status === 'DRAFT').length;
  const lowStockItems = stock.filter(s => Number(s.onHandQty) <= 10).length;

  return (
    <div className="space-y-6">
      {/* Header & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Executive Operations Workspace
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Active Tenant: <span className="font-semibold text-zinc-800 dark:text-zinc-200">{orgContext.tenantName}</span> •{' '}
            Branch: <span className="font-semibold text-zinc-800 dark:text-zinc-200">{orgContext.branchName}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadDashboardData} className="gap-1.5 h-8 text-xs">
            <RefreshCw className={isLoading ? 'animate-spin h-3.5 w-3.5' : 'h-3.5 w-3.5'} />
            <span>Refresh</span>
          </Button>
          <Link href="/sales">
            <Button variant="primary" size="sm" className="gap-1.5 h-8 text-xs">
              <Plus className="h-3.5 w-3.5" />
              <span>+ New Sales Order</span>
            </Button>
          </Link>
          <Link href="/purchasing">
            <Button variant="secondary" size="sm" className="gap-1.5 h-8 text-xs">
              <Plus className="h-3.5 w-3.5" />
              <span>+ New Purchase</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sales Orders KPI */}
        <Card className="hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Total Sales Orders</p>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{salesOrders.length}</div>
              <p className="text-[11px] text-zinc-400 flex items-center gap-1">
                <span className="text-emerald-600 font-semibold">{pendingShipments}</span> pending fulfillment
              </p>
            </div>
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Purchase Orders KPI */}
        <Card className="hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Purchase Orders</p>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{purchaseOrders.length}</div>
              <p className="text-[11px] text-zinc-400 flex items-center gap-1">
                <span className="text-amber-600 font-semibold">{pendingReceipts}</span> pending goods receipts
              </p>
            </div>
            <div className="rounded-xl bg-amber-50 p-3 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <ShoppingCart className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Manufacturing in Progress */}
        <Card className="hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Active Production</p>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{activeProduction}</div>
              <p className="text-[11px] text-zinc-400 flex items-center gap-1">
                <span>{productionOrders.filter(p => p.status === 'COMPLETED').length}</span> completed orders
              </p>
            </div>
            <div className="rounded-xl bg-purple-50 p-3 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
              <Factory className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Inventory Status / Low Stock */}
        <Card className="hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Low Stock Watch</p>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{lowStockItems}</div>
              <p className="text-[11px] text-zinc-400 flex items-center gap-1">
                <span>{stock.length}</span> total inventory tracked
              </p>
            </div>
            <div className="rounded-xl bg-rose-50 p-3 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
              <Boxes className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Recent Orders & Inventory Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <CardTitle>Recent Sales Orders</CardTitle>
              <p className="text-xs text-zinc-500">Customer requests and shipment lifecycle</p>
            </div>
            <Link href="/sales" className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {salesOrders.length === 0 ? (
                <div className="p-6 text-center text-xs text-zinc-500">No sales orders recorded yet.</div>
              ) : (
                salesOrders.slice(0, 5).map(order => (
                  <div key={order.id} className="flex items-center justify-between p-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">{order.orderNo}</span>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="text-[11px] text-zinc-500">
                        Customer: <span className="text-zinc-700 dark:text-zinc-300 font-medium">{order.customer?.name || 'Walk-in'}</span> •{' '}
                        {formatDate(order.orderDate)}
                      </p>
                    </div>
                    <Link href="/sales">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-zinc-800">
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Live Inventory Movements Audit Stream */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <CardTitle>Inventory Movement Audit</CardTitle>
              <p className="text-xs text-zinc-500">Real-time stock inflows, outflows and transfers</p>
            </div>
            <Link href="/inventory" className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {movements.length === 0 ? (
                <div className="p-6 text-center text-xs text-zinc-500">No stock movements recorded yet.</div>
              ) : (
                movements.slice(0, 5).map(mov => (
                  <div key={mov.id} className="flex items-center justify-between p-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                          {mov.product?.name || `Product #${mov.productId}`}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            Number(mov.qty) > 0
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                          }`}
                        >
                          {Number(mov.qty) > 0 ? `+${mov.qty}` : mov.qty} {mov.uom?.symbol || ''}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500">
                        {mov.movementType.replace(/_/g, ' ')} • WH: {mov.warehouse?.name || mov.warehouseId} •{' '}
                        {formatDate(mov.movementDate)}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      {formatCurrency(mov.totalCost)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Core ERP Business Flow Architecture Guide */}
      <Card className="border-blue-200 bg-blue-50/40 dark:border-blue-900/60 dark:bg-blue-950/20">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-blue-600 p-2.5 text-white">
              <Landmark className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Core ERP Automated Backbone & GL Sync
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                NaYa-ERP automates the complete operational loop: Goods Receipts immediately credit AP and update stock; Sales Shipments verify stock availability, deduct inventory, and post COGS/Revenue journals; Production complete operations automatically consume raw materials and output finished goods.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Link href="/products">
                  <Button variant="outline" size="sm" className="h-7 text-xs bg-white dark:bg-zinc-900">
                    Manage Master Catalog
                  </Button>
                </Link>
                <Link href="/purchasing">
                  <Button variant="outline" size="sm" className="h-7 text-xs bg-white dark:bg-zinc-900">
                    Manage Purchases
                  </Button>
                </Link>
                <Link href="/manufacturing">
                  <Button variant="outline" size="sm" className="h-7 text-xs bg-white dark:bg-zinc-900">
                    Manufacturing Orders
                  </Button>
                </Link>
                <Link href="/accounting">
                  <Button variant="outline" size="sm" className="h-7 text-xs bg-white dark:bg-zinc-900">
                    Double-Entry GL Ledger
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
