'use client';

import * as React from 'react';
import {
  FileBarChart,
  TrendingUp,
  Boxes,
  ShoppingCart,
  Landmark,
  Download,
  Calendar,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { apiFetch } from '@/lib/api/bff-client';
import { useAuth } from '@/lib/auth/auth-context';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatQuantity, formatDate } from '@/lib/utils';
import {
  SalesOrder,
  PurchaseOrder,
  InventoryStock,
  InventoryMovement,
  Account,
  JournalEntry,
} from '@/types/erp';

export default function ReportsPage() {
  const { orgContext } = useAuth();

  const [activeTab, setActiveTab] = React.useState('sales');
  const [isLoading, setIsLoading] = React.useState(true);

  const [sales, setSales] = React.useState<SalesOrder[]>([]);
  const [purchases, setPurchases] = React.useState<PurchaseOrder[]>([]);
  const [stock, setStock] = React.useState<InventoryStock[]>([]);
  const [movements, setMovements] = React.useState<InventoryMovement[]>([]);
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [journalEntries, setJournalEntries] = React.useState<JournalEntry[]>([]);

  const loadReportsData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [sRes, pRes, stkRes, movRes, accRes, jeRes] = await Promise.all([
        apiFetch<SalesOrder[]>('/api/sales/sales-orders'),
        apiFetch<PurchaseOrder[]>('/api/purchase/purchase-orders'),
        apiFetch<InventoryStock[]>('/api/inventory/inventory'),
        apiFetch<InventoryMovement[]>('/api/inventory/movements'),
        apiFetch<Account[]>('/api/finance/accounts'),
        apiFetch<JournalEntry[]>('/api/finance/journal-entries'),
      ]);

      if (sRes.success && Array.isArray(sRes.data)) setSales(sRes.data);
      if (pRes.success && Array.isArray(pRes.data)) setPurchases(pRes.data);
      if (stkRes.success && Array.isArray(stkRes.data)) setStock(stkRes.data);
      if (movRes.success && Array.isArray(movRes.data)) setMovements(movRes.data);
      if (accRes.success && Array.isArray(accRes.data)) setAccounts(accRes.data);
      if (jeRes.success && Array.isArray(jeRes.data)) setJournalEntries(jeRes.data);
    } catch (e) {
      console.error('Error loading reports data:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadReportsData();
  }, [loadReportsData]);

  // Aggregate Calculations
  const totalStockQty = stock.reduce((sum, s) => sum + Number(s.onHandQty || 0), 0);
  const totalMovementCost = movements.reduce((sum, m) => sum + Number(m.totalCost || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Enterprise Analytical Reports
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Decision-making reports grouped by domain: Sales Performance, Stock Valuation, Procurement, and Financial Ledger.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadReportsData} className="gap-1.5 h-8 text-xs">
            <RefreshCw className={isLoading ? 'animate-spin h-3.5 w-3.5' : 'h-3.5 w-3.5'} />
            <span>Refresh</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="gap-1.5 h-8 text-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export / Print</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-zinc-100 dark:bg-zinc-800">
          <TabsTrigger value="sales">
            Sales Analysis
          </TabsTrigger>
          <TabsTrigger value="inventory">
            Inventory & Valuation
          </TabsTrigger>
          <TabsTrigger value="purchasing">
            Purchasing & Suppliers
          </TabsTrigger>
          <TabsTrigger value="accounting">
            Financials & Trial Balance
          </TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: SALES REPORTS ───────────────────────────────────── */}
        <TabsContent value="sales" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-zinc-500 uppercase">Total Sales Orders</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">{sales.length}</p>
                <p className="text-[11px] text-emerald-600 mt-1">
                  {sales.filter(s => s.status === 'FULLY_SHIPPED').length} fulfilled orders
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-zinc-500 uppercase">Pending Shipment Orders</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">
                  {sales.filter(s => s.status === 'CONFIRMED' || s.status === 'PARTIALLY_SHIPPED').length}
                </p>
                <p className="text-[11px] text-zinc-400 mt-1">Awaiting dispatch fulfillment</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-zinc-500 uppercase">Active Customers</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {new Set(sales.map(s => s.customerId)).size}
                </p>
                <p className="text-[11px] text-zinc-400 mt-1">Unique buying accounts</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <CardTitle>Sales Orders Log</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {sales.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-3.5 text-xs">
                    <div>
                      <p className="font-bold text-zinc-900 dark:text-zinc-100">{s.orderNo}</p>
                      <p className="text-zinc-500 text-[11px]">{s.customer?.name || 'Walk-in'} • {formatDate(s.orderDate)}</p>
                    </div>
                    <Badge variant={s.status === 'FULLY_SHIPPED' ? 'success' : 'default'}>{s.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── TAB 2: INVENTORY REPORTS ───────────────────────────────── */}
        <TabsContent value="inventory" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-zinc-500 uppercase">Total Stock Units</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">{totalStockQty.toLocaleString()}</p>
                <p className="text-[11px] text-zinc-400 mt-1">Across all warehouses</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-zinc-500 uppercase">Low Stock Alerts</p>
                <p className="text-2xl font-bold text-rose-600 mt-1">
                  {stock.filter(s => Number(s.onHandQty) <= 10).length}
                </p>
                <p className="text-[11px] text-zinc-400 mt-1">Items at or below threshold</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-zinc-500 uppercase">Total Movement Value</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(totalMovementCost)}</p>
                <p className="text-[11px] text-zinc-400 mt-1">Cumulative movement valuation</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <CardTitle>Warehouse Stock Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {stock.map(st => (
                  <div key={st.id} className="flex items-center justify-between p-3.5 text-xs">
                    <div>
                      <p className="font-bold text-zinc-900 dark:text-zinc-100">{st.product?.name || `Product #${st.productId}`}</p>
                      <p className="text-zinc-500 text-[11px]">Warehouse: {st.warehouse?.name}</p>
                    </div>
                    <span className="font-bold text-sm text-emerald-600">{Number(st.onHandQty).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── TAB 3: PURCHASING REPORTS ──────────────────────────────── */}
        <TabsContent value="purchasing" className="space-y-4">
          <Card>
            <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <CardTitle>Supplier Procurement Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {purchases.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3.5 text-xs">
                    <div>
                      <p className="font-bold text-zinc-900 dark:text-zinc-100">{p.poNo}</p>
                      <p className="text-zinc-500 text-[11px]">Supplier: {p.supplier?.name || `Supplier #${p.supplierId}`} • {formatDate(p.orderDate)}</p>
                    </div>
                    <Badge variant={p.status === 'FULLY_RECEIVED' ? 'success' : 'default'}>{p.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── TAB 4: FINANCIAL REPORTS ───────────────────────────────── */}
        <TabsContent value="accounting" className="space-y-4">
          <Card>
            <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <CardTitle>Chart of Accounts Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {accounts.map(acc => (
                  <div key={acc.id} className="flex items-center justify-between p-3.5 text-xs">
                    <div>
                      <span className="font-mono font-bold text-blue-600 mr-2">{acc.accountCode}</span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">{acc.accountName}</span>
                    </div>
                    <Badge variant="outline">{acc.accountType}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
