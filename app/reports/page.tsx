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
  Printer,
  TrendingDown,
  AlertTriangle,
  Users,
  CheckCircle2,
  DollarSign,
  Truck,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { apiFetch } from '@/lib/api/bff-client';
import { useAuth } from '@/lib/auth/auth-context';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatQuantity, formatDate } from '@/lib/utils';
import {
  SalesSummaryReport,
  StockSummaryReport,
  PurchaseSummaryReport,
  CashflowReport,
  TrialBalanceReport,
  ShipmentSummaryReport,
  DashboardKpis,
} from '@/types/erp';

export default function ReportsPage() {
  const { orgContext } = useAuth();

  const [activeTab, setActiveTab] = React.useState('sales');
  const [isLoading, setIsLoading] = React.useState(true);

  // Date range filters
  const [dateRange, setDateRange] = React.useState({
    from: '',
    to: '',
  });

  // Report States
  const [dashboardKpis, setDashboardKpis] = React.useState<DashboardKpis | null>(null);
  const [salesSummary, setSalesSummary] = React.useState<SalesSummaryReport | null>(null);
  const [stockSummary, setStockSummary] = React.useState<StockSummaryReport | null>(null);
  const [purchaseSummary, setPurchaseSummary] = React.useState<PurchaseSummaryReport | null>(null);
  const [cashflow, setCashflow] = React.useState<CashflowReport | null>(null);
  const [trialBalance, setTrialBalance] = React.useState<TrialBalanceReport | null>(null);
  const [shipmentSummary, setShipmentSummary] = React.useState<ShipmentSummaryReport | null>(null);

  const loadReportsData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const qParams = new URLSearchParams();
      if (dateRange.from) qParams.set('from', dateRange.from);
      if (dateRange.to) qParams.set('to', dateRange.to);
      const qs = qParams.toString() ? `?${qParams.toString()}` : '';

      const [kpiRes, sRes, stkRes, pRes, cfRes, tbRes, shpRes] = await Promise.all([
        apiFetch<DashboardKpis>('/api/reports/dashboard'),
        apiFetch<SalesSummaryReport>(`/api/reports/sales-summary${qs}`),
        apiFetch<StockSummaryReport>('/api/reports/stock-summary'),
        apiFetch<PurchaseSummaryReport>(`/api/reports/purchase-summary${qs}`),
        apiFetch<CashflowReport>(`/api/reports/cashflow${qs}`),
        apiFetch<TrialBalanceReport>('/api/reports/trial-balance'),
        apiFetch<ShipmentSummaryReport>(`/api/reports/shipment-summary${qs}`),
      ]);

      if (kpiRes.success && kpiRes.data) setDashboardKpis(kpiRes.data);
      if (sRes.success && sRes.data) setSalesSummary(sRes.data);
      if (stkRes.success && stkRes.data) setStockSummary(stkRes.data);
      if (pRes.success && pRes.data) setPurchaseSummary(pRes.data);
      if (cfRes.success && cfRes.data) setCashflow(cfRes.data);
      if (tbRes.success && tbRes.data) setTrialBalance(tbRes.data);
      if (shpRes.success && shpRes.data) setShipmentSummary(shpRes.data);
    } catch (e) {
      console.error('Error loading reports data:', e);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  React.useEffect(() => {
    loadReportsData();
  }, [loadReportsData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <FileBarChart className="h-6 w-6 text-blue-600" />
            <span>Enterprise Analytical Reports (လုပ်ငန်းသုံး စာရင်းအစီရင်ခံစာများ)</span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Real-time analytics: Sales Performance, Stock Valuation, Procurement, Cash Flow, and Balanced Double-Entry Trial Balance.
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
            <Printer className="h-3.5 w-3.5" />
            <span>Print / PDF ထုတ်ရန်</span>
          </Button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs">
        <span className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-blue-600" /> Date Range Filter:
        </span>
        <div className="flex items-center gap-2">
          <span className="text-zinc-400">From:</span>
          <Input
            type="date"
            className="h-8 text-xs w-36"
            value={dateRange.from}
            onChange={e => setDateRange({ ...dateRange, from: e.target.value })}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-zinc-400">To:</span>
          <Input
            type="date"
            className="h-8 text-xs w-36"
            value={dateRange.to}
            onChange={e => setDateRange({ ...dateRange, to: e.target.value })}
          />
        </div>
        {(dateRange.from || dateRange.to) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDateRange({ from: '', to: '' })}
            className="h-8 text-xs text-zinc-500 hover:text-zinc-800"
          >
            Clear Filter
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-zinc-100 dark:bg-zinc-800">
          <TabsTrigger value="sales">
            Sales Analysis (အရောင်းပိုင်း)
          </TabsTrigger>
          <TabsTrigger value="inventory">
            Stock Summary (စတော့အစီရင်ခံစာ)
          </TabsTrigger>
          <TabsTrigger value="purchasing">
            Procurement (အဝယ်ပိုင်း)
          </TabsTrigger>
          <TabsTrigger value="cashflow">
            Cash Flow (ငွေစီးဆင်းမှု)
          </TabsTrigger>
          <TabsTrigger value="trial-balance">
            Trial Balance (စမ်းသပ်ရှင်းတမ်း)
          </TabsTrigger>
          <TabsTrigger value="shipments">
            Team Shipments (အဖွဲ့အလိုက် ပို့ဆောင်မှု)
          </TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: SALES REPORTS ───────────────────────────────────── */}
        <TabsContent value="sales" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-zinc-500 uppercase">Total Sales Revenue (စုစုပေါင်း ရောင်းရငွေ)</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                  {formatCurrency(salesSummary?.totalRevenue ?? 0)}
                </p>
                <p className="text-[11px] text-zinc-400 mt-1">
                  From {salesSummary?.totalOrders ?? 0} total sales orders
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-zinc-500 uppercase">Total Orders (အမှာစာ စုစုပေါင်း)</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1 font-mono">
                  {salesSummary?.totalOrders ?? 0}
                </p>
                <p className="text-[11px] text-emerald-600 mt-1">
                  {salesSummary?.shippedOrders ?? 0} fully fulfilled
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-zinc-500 uppercase">Pending Fulfillment (ပို့ဆောင်ရန် ကျန်)</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 font-mono">
                  {Math.max((salesSummary?.totalOrders ?? 0) - (salesSummary?.shippedOrders ?? 0), 0)}
                </p>
                <p className="text-[11px] text-zinc-400 mt-1">Awaiting dispatch fulfillment</p>
              </CardContent>
            </Card>
          </div>

          {/* Top Customers Breakdown */}
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Top Customers by Volume (အရောင်းရဆုံး ဖောက်သည်များ)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              {salesSummary?.topCustomers && salesSummary.topCustomers.length > 0 ? (
                <div className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
                  {salesSummary.topCustomers.map((cust, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/60 font-bold text-[10px] text-blue-700 dark:text-blue-300">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">{cust.customerName}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-zinc-500">{cust.orderCount} order(s)</span>
                        <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                          {formatCurrency(cust.totalAmount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-zinc-400 text-xs">No sales data in selected range.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── TAB 2: INVENTORY STOCK SUMMARY ─────────────────────────── */}
        <TabsContent value="inventory" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-zinc-500 uppercase">Total Tracked Items (စတော့အမျိုးအစား စုစုပေါင်း)</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1 font-mono">
                  {stockSummary?.totalItems ?? 0}
                </p>
                <p className="text-[11px] text-zinc-400 mt-1">Across all warehouses</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-zinc-500 uppercase">Low Stock Alerts (စတော့နည်း သတိပေးချက်)</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 font-mono">
                  {stockSummary?.lowStockCount ?? 0}
                </p>
                <p className="text-[11px] text-amber-600 mt-1">Below safety reorder threshold</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-zinc-500 uppercase">Total Stock Quantity (စုစုပေါင်း လက်ကျန်အရေအတွက်)</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1 font-mono">
                  {dashboardKpis?.totalStockQty ?? 0}
                </p>
                <p className="text-[11px] text-zinc-400 mt-1">Units available</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Warehouse Stock Breakdown (ဂိုဒေါင်အလိုက် စတော့လက်ကျန် စာရင်း)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-100 dark:bg-zinc-800/60 text-[10px] text-zinc-500 uppercase">
                    <tr>
                      <th className="p-2.5">Warehouse</th>
                      <th className="p-2.5">Product Name</th>
                      <th className="p-2.5">SKU</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5 text-right">On Hand Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {(stockSummary?.items || []).map((it, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40">
                        <td className="p-2.5 font-medium">{it.warehouseName}</td>
                        <td className="p-2.5 font-semibold text-zinc-900 dark:text-zinc-100">{it.productName}</td>
                        <td className="p-2.5 font-mono text-zinc-500">{it.sku}</td>
                        <td className="p-2.5">
                          <Badge variant="outline" className="text-[10px]">
                            {it.productType}
                          </Badge>
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-zinc-900 dark:text-zinc-100">
                          {formatQuantity(it.onHandQty)} {it.uomName || ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── TAB 3: PROCUREMENT & PURCHASING ────────────────────────── */}
        <TabsContent value="purchasing" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-zinc-500 uppercase">Total Procurement Spend (စုစုပေါင်း အဝယ်တန်ဖိုး)</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1 font-mono">
                  {formatCurrency(purchaseSummary?.totalSpend ?? 0)}
                </p>
                <p className="text-[11px] text-zinc-400 mt-1">Across {purchaseSummary?.totalOrders ?? 0} Purchase Orders</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-zinc-500 uppercase">Received Purchase Orders (လက်ခံပြီး အဝယ်အမှာစာ)</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1 font-mono">
                  {purchaseSummary?.receivedOrders ?? 0}
                </p>
                <p className="text-[11px] text-zinc-400 mt-1">Fully received goods</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Top Suppliers by Spend (အများဆုံး ဝယ်ယူခဲ့သော ကုန်ပေးသွင်းသူများ)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              {purchaseSummary?.topSuppliers && purchaseSummary.topSuppliers.length > 0 ? (
                <div className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
                  {purchaseSummary.topSuppliers.map((supp, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/60 font-bold text-[10px] text-amber-700 dark:text-amber-300">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">{supp.supplierName}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-zinc-500">{supp.orderCount} order(s)</span>
                        <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                          {formatCurrency(supp.totalAmount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-zinc-400 text-xs">No procurement data in selected range.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── TAB 4: CASH FLOW ───────────────────────────────────────── */}
        <TabsContent value="cashflow" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-zinc-500 uppercase flex items-center gap-1">
                  <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" /> Cash Inflow (ငွေဝင် - ရောင်းရငွေ)
                </p>
                <p className="text-2xl font-bold text-emerald-600 mt-1 font-mono">
                  {formatCurrency(cashflow?.inflow ?? 0)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-zinc-500 uppercase flex items-center gap-1">
                  <ArrowDownRight className="h-3.5 w-3.5 text-red-600" /> Cash Outflow (ငွေထွက် - အဝယ်/အသုံးစရိတ်)
                </p>
                <p className="text-2xl font-bold text-red-600 mt-1 font-mono">
                  {formatCurrency(cashflow?.outflow ?? 0)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-zinc-500 uppercase">Net Cashflow (အသားတင် ငွေစီးဆင်းမှု)</p>
                <p className={`text-2xl font-bold mt-1 font-mono ${(cashflow?.net ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatCurrency(cashflow?.net ?? 0)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Recent Cash Transactions (လတ်တလော ငွေပေးငွေယူ စာရင်းများ)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-100 dark:bg-zinc-800/60 text-[10px] text-zinc-500 uppercase">
                    <tr>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Voucher #</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5">Method</th>
                      <th className="p-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {(cashflow?.payments || []).map((p, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40">
                        <td className="p-2.5">{formatDate(p.paymentDate)}</td>
                        <td className="p-2.5 font-mono font-bold text-blue-600">{p.paymentNo}</td>
                        <td className="p-2.5">
                          <Badge
                            variant={p.paymentType === 'CUSTOMER_PAYMENT' ? 'success' : 'outline'}
                            className="text-[10px]"
                          >
                            {p.paymentType}
                          </Badge>
                        </td>
                        <td className="p-2.5">{p.paymentMethod}</td>
                        <td className={`p-2.5 text-right font-mono font-bold ${p.paymentType === 'CUSTOMER_PAYMENT' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {p.paymentType === 'CUSTOMER_PAYMENT' ? '+' : '-'}{formatCurrency(p.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── TAB 5: TRIAL BALANCE (DOUBLE-ENTRY) ────────────────────── */}
        <TabsContent value="trial-balance" className="space-y-4">
          <Card>
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                General Ledger Trial Balance (စမ်းသပ်ရှင်းတမ်း - နှစ်ဖက်စာရင်းကိုက် စစ်ဆေးချက်)
              </CardTitle>
              <Badge variant={trialBalance?.isBalanced ? 'success' : 'destructive'}>
                {trialBalance?.isBalanced ? '✓ PERFECTLY BALANCED' : '⚠️ UNBALANCED'}
              </Badge>
            </CardHeader>

            <CardContent className="p-4 pt-2">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-100 dark:bg-zinc-800/60 text-[10px] text-zinc-500 uppercase">
                    <tr>
                      <th className="p-2.5">Account Code</th>
                      <th className="p-2.5">Account Name</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5 text-right">Debit Total</th>
                      <th className="p-2.5 text-right">Credit Total</th>
                      <th className="p-2.5 text-right">Net Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {(trialBalance?.accounts || []).map((acct, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40">
                        <td className="p-2.5 font-mono font-bold text-blue-600">{acct.accountCode}</td>
                        <td className="p-2.5 font-semibold text-zinc-900 dark:text-zinc-100">{acct.accountName}</td>
                        <td className="p-2.5">
                          <Badge variant="outline" className="text-[10px]">
                            {acct.accountType}
                          </Badge>
                        </td>
                        <td className="p-2.5 text-right font-mono">{formatCurrency(acct.totalDebit)}</td>
                        <td className="p-2.5 text-right font-mono">{formatCurrency(acct.totalCredit)}</td>
                        <td className="p-2.5 text-right font-mono font-bold">{formatCurrency(acct.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-zinc-100/80 dark:bg-zinc-800/80 font-bold border-t-2 border-zinc-300 dark:border-zinc-700">
                    <tr>
                      <td colSpan={3} className="p-2.5 text-right uppercase text-[11px]">
                        Grand Totals (စုစုပေါင်း):
                      </td>
                      <td className="p-2.5 text-right font-mono text-emerald-600">
                        {formatCurrency(trialBalance?.totalDebit ?? 0)}
                      </td>
                      <td className="p-2.5 text-right font-mono text-blue-600">
                        {formatCurrency(trialBalance?.totalCredit ?? 0)}
                      </td>
                      <td className="p-2.5 text-right font-mono">
                        {trialBalance?.isBalanced ? '✓ 0.00' : 'Diff'}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── TAB 6: TEAM SHIPMENTS ──────────────────────────────────── */}
        <TabsContent value="shipments" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-zinc-500 uppercase">Total Dispatches (စုစုပေါင်း ပို့ဆောင်မှု)</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1 font-mono">
                  {shipmentSummary?.totalShipments ?? 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-zinc-500 uppercase">Posted / Delivered (ပြီးစီးသော ပို့ဆောင်မှု)</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1 font-mono">
                  {shipmentSummary?.postedShipments ?? 0}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Shipment Breakdown by Sales Team (အရောင်းအဖွဲ့အလိုက် ပို့ဆောင်မှုပမာဏ)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              {(shipmentSummary?.teams || []).map((t, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 last:border-0 text-xs">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{t.teamName}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-zinc-500">{t.shipmentCount} total shipments</span>
                    <Badge variant="success" className="text-[10px]">
                      {t.postedCount} posted
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
