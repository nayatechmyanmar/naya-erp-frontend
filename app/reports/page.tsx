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
  Building2,
  FileText,
  Check,
  Receipt,
  Scale,
} from 'lucide-react';
import { apiFetch } from '@/lib/api/bff-client';
import { useAuth } from '@/lib/auth/auth-context';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
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
  const { user, orgContext } = useAuth();

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

  // Print Configuration Dialog State
  const [printDialogOpen, setPrintDialogOpen] = React.useState(false);
  const [printConfig, setPrintConfig] = React.useState({
    paperSize: 'A4_STANDARD' as 'A4_STANDARD' | 'THERMAL_80MM',
    targetScope: 'ACTIVE_TAB' as 'ACTIVE_TAB' | 'ALL_EXECUTIVE',
    showSignatures: true,
    showLetterhead: true,
  });

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

  // Trigger Print with smooth timeout
  const handleExecutePrint = () => {
    setPrintDialogOpen(false);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  // Get Tab Display Titles
  const getTabTitle = (tabKey: string) => {
    switch (tabKey) {
      case 'sales':
        return 'Sales Performance & Customer Revenue Statement (အရောင်းနှင့် ဝင်ငွေ စာရင်းရှင်းတမ်း)';
      case 'inventory':
        return 'Warehouse Inventory & Stock Valuation Audit (ဂိုဒေါင်အလိုက် စတော့လက်ကျန် စစ်ဆေးချက်)';
      case 'purchasing':
        return 'Procurement & Supplier Spend Audit (ကုန်ပစ္စည်းဝယ်ယူမှုနှင့် ကုန်ကျစရိတ် စာရင်းရှင်းတမ်း)';
      case 'cashflow':
        return 'Cash Inflow / Outflow & Liquidity Statement (ငွေပေးငွေယူနှင့် စီးဆင်းမှု ရှင်းတမ်း)';
      case 'trial-balance':
        return 'Double-Entry General Ledger Trial Balance (စမ်းသပ်ရှင်းတမ်း - နှစ်ဖက်စာရင်းကိုက် ရှင်းတမ်း)';
      case 'shipments':
        return 'Sales Team Logistics & Dispatch Summary (အရောင်းအဖွဲ့အလိုက် ပို့ဆောင်မှု အစီရင်ခံစာ)';
      default:
        return 'Enterprise Management Audit Report';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full overflow-x-hidden min-w-0">
      {/* ─── PRINT CSS MEDIA OVERRIDES ──────────────────────────────── */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-report-area,
          #printable-report-area * {
            visibility: visible !important;
          }
          #printable-report-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: #ffffff !important;
            color: #000000 !important;
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Pyidaungsu", "Myanmar3" !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: ${printConfig.paperSize === 'THERMAL_80MM' ? '80mm auto' : 'A4 portrait'};
            margin: ${printConfig.paperSize === 'THERMAL_80MM' ? '4mm' : '10mm 14mm'};
          }
        }
      `}</style>

      {/* ─── HEADER & TOP BAR ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-4 pb-1 no-print">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <FileBarChart className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 shrink-0" />
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 truncate">
              လုပ်ငန်းသုံး စာရင်းအစီရင်ခံစာများ
            </h1>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
            Sales analytics, stock valuation, spend audit, cash flow, and trial balance
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button variant="outline" size="sm" onClick={loadReportsData} className="gap-1.5 h-8 text-xs shrink-0">
            <RefreshCw className={isLoading ? 'animate-spin h-3.5 w-3.5' : 'h-3.5 w-3.5'} />
            <span className="hidden sm:inline">Refresh (ပြန်ဖွင့်)</span>
            <span className="sm:hidden">Refresh</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setPrintDialogOpen(true)}
            className="gap-1.5 h-8 text-xs bg-blue-600 hover:bg-blue-700 shrink-0"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print / Export PDF (ပရင့်ထုတ်ရန်)</span>
          </Button>
        </div>
      </div>

      {/* ─── DATE FILTER BAR ───────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs shadow-xs no-print">
        <span className="font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-blue-600" /> Date Range Filter:
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-400 text-[11px]">From:</span>
          <Input
            type="date"
            className="h-8 text-xs w-36"
            value={dateRange.from}
            onChange={e => setDateRange({ ...dateRange, from: e.target.value })}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-400 text-[11px]">To:</span>
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
            Clear Filter (ရက်စွဲဖျက်ရန်)
          </Button>
        )}
      </div>

      {/* ─── TABS NAVIGATION (Scrollable M3 Segmented Bar) ─────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="no-print">
        <div className="overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0">
          <TabsList className="w-max sm:w-full justify-start">
            <TabsTrigger value="sales">
              📈 Sales Analysis (အရောင်းပိုင်း)
            </TabsTrigger>
            <TabsTrigger value="inventory">
              📦 Stock Summary (စတော့အစီရင်ခံစာ)
            </TabsTrigger>
            <TabsTrigger value="purchasing">
              🛒 Procurement (အဝယ်ပိုင်း)
            </TabsTrigger>
            <TabsTrigger value="cashflow">
              💵 Cash Flow (ငွေစီးဆင်းမှု)
            </TabsTrigger>
            <TabsTrigger value="trial-balance">
              ⚖️ Trial Balance (စမ်းသပ်ရှင်းတမ်း)
            </TabsTrigger>
            <TabsTrigger value="shipments">
              🚚 Team Shipments (ပို့ဆောင်မှုများ)
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ─── TAB 1: SALES REPORTS ───────────────────────────────────── */}
        <TabsContent value="sales" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <Card>
              <CardContent className="p-4 space-y-1">
                <p className="text-xs font-semibold text-zinc-500 uppercase">Total Sales Revenue (စုစုပေါင်း ရောင်းရငွေ)</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {formatCurrency(salesSummary?.totalRevenue ?? 0)}
                </p>
                <p className="text-[11px] text-zinc-400">
                  From {salesSummary?.totalOrders ?? 0} total sales orders
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-1">
                <p className="text-xs font-semibold text-zinc-500 uppercase">Total Orders (အမှာစာ စုစုပေါင်း)</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono">
                  {salesSummary?.totalOrders ?? 0}
                </p>
                <p className="text-[11px] text-emerald-600 font-medium">
                  {salesSummary?.shippedOrders ?? 0} fully fulfilled
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-1">
                <p className="text-xs font-semibold text-zinc-500 uppercase">Pending Fulfillment (ပို့ဆောင်ရန် ကျန်)</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">
                  {Math.max((salesSummary?.totalOrders ?? 0) - (salesSummary?.shippedOrders ?? 0), 0)}
                </p>
                <p className="text-[11px] text-zinc-400">Awaiting dispatch fulfillment</p>
              </CardContent>
            </Card>
          </div>

          {/* Top Customers Breakdown */}
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                အရောင်းရဆုံး ဖောက်သည်များ
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <Card>
              <CardContent className="p-4 space-y-1">
                <p className="text-xs font-semibold text-zinc-500 uppercase">Total Tracked Items (စတော့အမျိုးအစား စုစုပေါင်း)</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                  {stockSummary?.totalItems ?? 0}
                </p>
                <p className="text-[11px] text-zinc-400">Across all warehouses</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-1">
                <p className="text-xs font-semibold text-zinc-500 uppercase">Low Stock Alerts (စတော့နည်း သတိပေးချက်)</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">
                  {stockSummary?.lowStockCount ?? 0}
                </p>
                <p className="text-[11px] text-amber-600">Below safety reorder threshold</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-1">
                <p className="text-xs font-semibold text-zinc-500 uppercase">Total Stock Quantity (စုစုပေါင်း လက်ကျန်အရေအတွက်)</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono">
                  {dashboardKpis?.totalStockQty ?? 0}
                </p>
                <p className="text-[11px] text-zinc-400">Units available</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                ဂိုဒေါင်အလိုက် စတော့လက်ကျန် စာရင်း
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Card>
              <CardContent className="p-4 space-y-1">
                <p className="text-xs font-semibold text-zinc-500 uppercase">Total Procurement Spend (စုစုပေါင်း အဝယ်တန်ဖိုး)</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                  {formatCurrency(purchaseSummary?.totalSpend ?? 0)}
                </p>
                <p className="text-[11px] text-zinc-400">Across {purchaseSummary?.totalOrders ?? 0} Purchase Orders</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-1">
                <p className="text-xs font-semibold text-zinc-500 uppercase">Received Purchase Orders (လက်ခံပြီး အဝယ်အမှာစာ)</p>
                <p className="text-2xl font-bold text-emerald-600 font-mono">
                  {purchaseSummary?.receivedOrders ?? 0}
                </p>
                <p className="text-[11px] text-zinc-400">Fully received goods</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                အများဆုံး ဝယ်ယူခဲ့သော ကုန်ပေးသွင်းသူများ
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <Card>
              <CardContent className="p-4 space-y-1">
                <p className="text-xs font-semibold text-zinc-500 uppercase flex items-center gap-1">
                  <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" /> Cash Inflow (ငွေဝင် - ရောင်းရငွေ)
                </p>
                <p className="text-2xl font-bold text-emerald-600 font-mono">
                  {formatCurrency(cashflow?.inflow ?? 0)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-1">
                <p className="text-xs font-semibold text-zinc-500 uppercase flex items-center gap-1">
                  <ArrowDownRight className="h-3.5 w-3.5 text-red-600" /> Cash Outflow (ငွေထွက် - အဝယ်/အသုံးစရိတ်)
                </p>
                <p className="text-2xl font-bold text-red-600 font-mono">
                  {formatCurrency(cashflow?.outflow ?? 0)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-1">
                <p className="text-xs font-semibold text-zinc-500 uppercase">Net Cashflow (အသားတင် ငွေစီးဆင်းမှု)</p>
                <p className={`text-2xl font-bold font-mono ${(cashflow?.net ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatCurrency(cashflow?.net ?? 0)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                လတ်တလော ငွေပေးငွေယူ စာရင်းများ
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
                General Ledger စမ်းသပ်ရှင်းတမ်း - နှစ်ဖက်စာရင်းကိုက် စစ်ဆေးချက်
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Card>
              <CardContent className="p-4 space-y-1">
                <p className="text-xs font-semibold text-zinc-500 uppercase">Total Dispatches (စုစုပေါင်း ပို့ဆောင်မှု)</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                  {shipmentSummary?.totalShipments ?? 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-1">
                <p className="text-xs font-semibold text-zinc-500 uppercase">Posted / Delivered (ပြီးစီးသော ပို့ဆောင်မှု)</p>
                <p className="text-2xl font-bold text-emerald-600 font-mono">
                  {shipmentSummary?.postedShipments ?? 0}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                အရောင်းအဖွဲ့အလိုက် ပို့ဆောင်မှုပမာဏ
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

      {/* ─── PRINT CUSTOMIZER DIALOG (M3 Modal) ────────────────────── */}
      <Dialog
        open={printDialogOpen}
        onOpenChange={setPrintDialogOpen}
        title="Print & Export Document Options (စာရွက်ထုတ်ရန် ပုံစံရွေးချယ်ပါ)"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1.5">
              Printer Format / Paper Size (စာရွက်အရွယ်အစား ပုံစံ) *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div
                onClick={() => setPrintConfig({ ...printConfig, paperSize: 'A4_STANDARD' })}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${printConfig.paperSize === 'A4_STANDARD'
                  ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-1 ring-blue-600'
                  : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300'
                  }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span>📄 A4 / Letter (Office Statement)</span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Standard formal audit report with letterhead, metrics, full tables & signature blocks.
                </p>
              </div>

              <div
                onClick={() => setPrintConfig({ ...printConfig, paperSize: 'THERMAL_80MM' })}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${printConfig.paperSize === 'THERMAL_80MM'
                  ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-1 ring-blue-600'
                  : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300'
                  }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Receipt className="h-4 w-4 text-emerald-600" />
                  <span>🧾 80mm / 58mm Thermal (POS Slip)</span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Compact roll receipt format for bluetooth printers and instant mobile POS slips.
                </p>
              </div>
            </div>
          </div>

          <Select
            label="Report Scope (ထုတ်ယူမည့် အစီရင်ခံစာ အပိုင်း)"
            value={printConfig.targetScope}
            onChange={e => setPrintConfig({ ...printConfig, targetScope: e.target.value as 'ACTIVE_TAB' | 'ALL_EXECUTIVE' })}
          >
            <option value="ACTIVE_TAB">Current View: {getTabTitle(activeTab).split('(')[0]}</option>
            <option value="ALL_EXECUTIVE">Full Executive Business Summary (အလုံးစုံ စာရင်းချုပ် အစီရင်ခံစာ)</option>
          </Select>

          <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={printConfig.showLetterhead}
                onChange={e => setPrintConfig({ ...printConfig, showLetterhead: e.target.checked })}
                className="rounded border-zinc-300 h-4 w-4 text-blue-600"
              />
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                Include Official Enterprise Letterhead (လုပ်ငန်းခေါင်းစီးနှင့် လိပ်စာ ထည့်သွင်းမည်)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={printConfig.showSignatures}
                onChange={e => setPrintConfig({ ...printConfig, showSignatures: e.target.checked })}
                className="rounded border-zinc-300 h-4 w-4 text-blue-600"
              />
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                Include Signatures & Audit Seal Block (ပြုစုသူ/စစ်ဆေးသူ/အတည်ပြုသူ လက်မှတ်ကွက်များ)
              </span>
            </label>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setPrintDialogOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="button" variant="primary" onClick={handleExecutePrint} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 gap-1.5">
              <Printer className="h-4 w-4" />
              <span>Print Document (ပရင့်ထုတ်ပါ)</span>
            </Button>
          </div>
        </div>
      </Dialog>

      {/* ─── DEDICATED PRINT PAPER DOCUMENT ENGINE ───────────────────── */}
      <div id="printable-report-area" className="hidden">
        {printConfig.paperSize === 'THERMAL_80MM' ? (
          /* 🧾 80MM COMPACT THERMAL RECEIPT SLIP */
          <div className="max-w-[76mm] mx-auto text-black font-mono text-[11px] leading-tight p-1 space-y-2">
            <div className="text-center space-y-0.5 border-b border-dashed border-black pb-2">
              <h2 className="text-sm font-bold uppercase">{orgContext.tenantName || 'NAYA-ERA ERP'}</h2>
              <p className="text-[10px]">{orgContext.branchName || 'Head Office'}</p>
              <p className="text-[10px] uppercase font-bold mt-1">*** {getTabTitle(activeTab).split('(')[0]} ***</p>
              <p className="text-[9px]">Period: {dateRange.from || 'Start'} to {dateRange.to || 'Present'}</p>
              <p className="text-[9px]">Printed: {new Date().toLocaleString()}</p>
            </div>

            {/* Sales Summary Docket */}
            {(printConfig.targetScope === 'ALL_EXECUTIVE' || activeTab === 'sales') && (
              <div className="space-y-1 py-1 border-b border-dashed border-black">
                <div className="flex justify-between font-bold">
                  <span>TOTAL SALES:</span>
                  <span>{formatCurrency(salesSummary?.totalRevenue ?? 0)}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>Total Orders:</span>
                  <span>{salesSummary?.totalOrders ?? 0}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>Fulfilled:</span>
                  <span>{salesSummary?.shippedOrders ?? 0}</span>
                </div>
              </div>
            )}

            {/* Procurement Spend Docket */}
            {(printConfig.targetScope === 'ALL_EXECUTIVE' || activeTab === 'purchasing') && (
              <div className="space-y-1 py-1 border-b border-dashed border-black">
                <div className="flex justify-between font-bold">
                  <span>PROCUREMENT SPEND:</span>
                  <span>{formatCurrency(purchaseSummary?.totalSpend ?? 0)}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>Total PO Orders:</span>
                  <span>{purchaseSummary?.totalOrders ?? 0}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>Received POs:</span>
                  <span>{purchaseSummary?.receivedOrders ?? 0}</span>
                </div>
              </div>
            )}

            {/* Cashflow Docket */}
            {(printConfig.targetScope === 'ALL_EXECUTIVE' || activeTab === 'cashflow') && (
              <div className="space-y-1 py-1 border-b border-dashed border-black">
                <div className="flex justify-between text-[10px]">
                  <span>Cash Inflow:</span>
                  <span>+{formatCurrency(cashflow?.inflow ?? 0)}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>Cash Outflow:</span>
                  <span>-{formatCurrency(cashflow?.outflow ?? 0)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>NET BALANCE:</span>
                  <span>{formatCurrency(cashflow?.net ?? 0)}</span>
                </div>
              </div>
            )}

            {/* Stock Summary Docket */}
            {(printConfig.targetScope === 'ALL_EXECUTIVE' || activeTab === 'inventory') && (
              <div className="space-y-1 py-1 border-b border-dashed border-black">
                <div className="flex justify-between text-[10px]">
                  <span>Tracked Items:</span>
                  <span>{stockSummary?.totalItems ?? 0}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>Total Stock Qty:</span>
                  <span>{dashboardKpis?.totalStockQty ?? 0} units</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>Low Stock Warnings:</span>
                  <span>{stockSummary?.lowStockCount ?? 0}</span>
                </div>
              </div>
            )}

            {/* Team Shipments Docket */}
            {(printConfig.targetScope === 'ALL_EXECUTIVE' || activeTab === 'shipments') && (
              <div className="space-y-1 py-1 border-b border-dashed border-black">
                <div className="flex justify-between font-bold">
                  <span>TOTAL SHIPMENTS:</span>
                  <span>{shipmentSummary?.totalShipments ?? 0}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>Delivered / Posted:</span>
                  <span>{shipmentSummary?.postedShipments ?? 0}</span>
                </div>
              </div>
            )}

            {/* Trial Balance Status Docket */}
            {(printConfig.targetScope === 'ALL_EXECUTIVE' || activeTab === 'trial-balance') && (
              <div className="space-y-1 py-1 border-b border-dashed border-black text-[10px]">
                <div className="flex justify-between">
                  <span>Debit Total:</span>
                  <span>{formatCurrency(trialBalance?.totalDebit ?? 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Credit Total:</span>
                  <span>{formatCurrency(trialBalance?.totalCredit ?? 0)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>GL Balance:</span>
                  <span>{trialBalance?.isBalanced ? '✓ BALANCED' : '⚠️ UNBALANCED'}</span>
                </div>
              </div>
            )}

            <div className="text-center pt-2 text-[9px] space-y-0.5 border-t border-dashed border-black">
              <p className="font-bold">*** OFFICIAL RECEIPT DOCKET ***</p>
              <p>User: {user?.name || 'Authorized Staff'}</p>
              <p>NAYA-ERA Cloud ERP System</p>
            </div>
          </div>
        ) : (
          /* 📄 A4 FORMAL OFFICE / AUDIT STATEMENT */
          <div className="p-8 text-black space-y-6 max-w-4xl mx-auto font-sans">
            {/* Formal Letterhead */}
            {printConfig.showLetterhead && (
              <div className="flex items-start justify-between border-b-2 border-black pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-6 w-6 text-black" />
                    <h1 className="text-xl font-bold uppercase tracking-wider">
                      {orgContext.tenantName || 'NAYA-ERA ENTERPRISE RESOURCE PLANNING'}
                    </h1>
                  </div>
                  <p className="text-xs text-gray-700 font-medium">
                    Branch: {orgContext.branchName || 'Head Office (Mandalay)'} • Tenant ID: {orgContext.tenantId || 1}
                  </p>
                  <p className="text-[11px] text-gray-600">
                    Official Financial & Operations Audit System
                  </p>
                </div>

                <div className="text-right text-xs space-y-0.5">
                  <p className="font-bold font-mono">STATEMENT ID: STMT-{new Date().getFullYear()}-{String(Date.now()).slice(-6)}</p>
                  <p className="text-gray-600">Generated: {new Date().toLocaleString()}</p>
                  <p className="text-gray-600">Prepared By: {user?.name || 'Administrator'}</p>
                </div>
              </div>
            )}

            {/* Document Title Banner */}
            <div className="text-center py-2 bg-gray-100 border border-gray-300 rounded">
              <h2 className="text-base font-bold uppercase tracking-wide">
                {printConfig.targetScope === 'ALL_EXECUTIVE'
                  ? 'COMPREHENSIVE EXECUTIVE BUSINESS AUDIT STATEMENT (အလုံးစုံ စာရင်းချုပ် အစီရင်ခံစာ)'
                  : getTabTitle(activeTab)}
              </h2>
              <p className="text-xs text-gray-600 mt-0.5 font-medium">
                Reporting Period: <span className="font-bold">{dateRange.from || 'Beginning'}</span> to <span className="font-bold">{dateRange.to || 'Present'}</span>
              </p>
            </div>

            {/* 1. SALES SUMMARY SECTION */}
            {(printConfig.targetScope === 'ALL_EXECUTIVE' || activeTab === 'sales') && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider border-b border-gray-400 pb-1 flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4" />
                  <span>1. Sales Performance & Top Customers Breakdown</span>
                </h3>

                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="p-3 border border-gray-300 rounded bg-gray-50">
                    <span className="text-[10px] uppercase font-bold text-gray-600">Total Sales Revenue</span>
                    <p className="text-base font-bold font-mono mt-1">{formatCurrency(salesSummary?.totalRevenue ?? 0)}</p>
                  </div>
                  <div className="p-3 border border-gray-300 rounded bg-gray-50">
                    <span className="text-[10px] uppercase font-bold text-gray-600">Total Sales Orders</span>
                    <p className="text-base font-bold font-mono mt-1">{salesSummary?.totalOrders ?? 0}</p>
                  </div>
                  <div className="p-3 border border-gray-300 rounded bg-gray-50">
                    <span className="text-[10px] uppercase font-bold text-gray-600">Fulfilled Orders</span>
                    <p className="text-base font-bold font-mono mt-1">{salesSummary?.shippedOrders ?? 0}</p>
                  </div>
                </div>

                {salesSummary?.topCustomers && salesSummary.topCustomers.length > 0 && (
                  <table className="w-full text-xs border border-gray-300 mt-2">
                    <thead className="bg-gray-100 border-b border-gray-300 text-[10px] uppercase">
                      <tr>
                        <th className="p-2 text-left">No</th>
                        <th className="p-2 text-left">Customer Name</th>
                        <th className="p-2 text-right">Orders Count</th>
                        <th className="p-2 text-right">Total Revenue (MMK)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {salesSummary.topCustomers.map((c, i) => (
                        <tr key={i}>
                          <td className="p-2 font-bold">{i + 1}</td>
                          <td className="p-2 font-semibold">{c.customerName}</td>
                          <td className="p-2 text-right font-mono">{c.orderCount}</td>
                          <td className="p-2 text-right font-mono font-bold">{formatCurrency(c.totalAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* 2. INVENTORY STOCK VALUATION */}
            {(printConfig.targetScope === 'ALL_EXECUTIVE' || activeTab === 'inventory') && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider border-b border-gray-400 pb-1 flex items-center gap-1.5">
                  <Boxes className="h-4 w-4" />
                  <span>2. Warehouse Stock & Physical Inventory Audit</span>
                </h3>

                <table className="w-full text-xs border border-gray-300">
                  <thead className="bg-gray-100 border-b border-gray-300 text-[10px] uppercase">
                    <tr>
                      <th className="p-2 text-left">Warehouse</th>
                      <th className="p-2 text-left">Product Name</th>
                      <th className="p-2 text-left">SKU</th>
                      <th className="p-2 text-left">Type</th>
                      <th className="p-2 text-right">Physical On Hand</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(stockSummary?.items || []).slice(0, 30).map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-medium">{it.warehouseName}</td>
                        <td className="p-2 font-semibold">{it.productName}</td>
                        <td className="p-2 font-mono text-gray-600">{it.sku}</td>
                        <td className="p-2">{it.productType}</td>
                        <td className="p-2 text-right font-mono font-bold">
                          {formatQuantity(it.onHandQty)} {it.uomName || ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 3. PROCUREMENT & PURCHASING */}
            {(printConfig.targetScope === 'ALL_EXECUTIVE' || activeTab === 'purchasing') && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider border-b border-gray-400 pb-1 flex items-center gap-1.5">
                  <ShoppingCart className="h-4 w-4" />
                  <span>3. Procurement & Supplier Spend Audit</span>
                </h3>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 border border-gray-300 rounded bg-gray-50">
                    <span className="text-[10px] uppercase font-bold text-gray-600">Total Procurement Spend</span>
                    <p className="text-base font-bold font-mono mt-1">{formatCurrency(purchaseSummary?.totalSpend ?? 0)}</p>
                  </div>
                  <div className="p-3 border border-gray-300 rounded bg-gray-50">
                    <span className="text-[10px] uppercase font-bold text-gray-600">Received Purchase Orders</span>
                    <p className="text-base font-bold font-mono mt-1">{purchaseSummary?.receivedOrders ?? 0} / {purchaseSummary?.totalOrders ?? 0}</p>
                  </div>
                </div>

                {purchaseSummary?.topSuppliers && purchaseSummary.topSuppliers.length > 0 && (
                  <table className="w-full text-xs border border-gray-300 mt-2">
                    <thead className="bg-gray-100 border-b border-gray-300 text-[10px] uppercase">
                      <tr>
                        <th className="p-2 text-left">No</th>
                        <th className="p-2 text-left">Supplier Name</th>
                        <th className="p-2 text-right">Orders Count</th>
                        <th className="p-2 text-right">Total Spend (MMK)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {purchaseSummary.topSuppliers.map((s, i) => (
                        <tr key={i}>
                          <td className="p-2 font-bold">{i + 1}</td>
                          <td className="p-2 font-semibold">{s.supplierName}</td>
                          <td className="p-2 text-right font-mono">{s.orderCount}</td>
                          <td className="p-2 text-right font-mono font-bold">{formatCurrency(s.totalAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* 4. CASH FLOW & TREASURY */}
            {(printConfig.targetScope === 'ALL_EXECUTIVE' || activeTab === 'cashflow') && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider border-b border-gray-400 pb-1 flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4" />
                  <span>4. Cash Flow & Liquidity Statement</span>
                </h3>

                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="p-3 border border-gray-300 rounded bg-gray-50">
                    <span className="text-[10px] uppercase font-bold text-gray-600">Total Cash Inflow</span>
                    <p className="text-base font-bold font-mono mt-1 text-emerald-700">+{formatCurrency(cashflow?.inflow ?? 0)}</p>
                  </div>
                  <div className="p-3 border border-gray-300 rounded bg-gray-50">
                    <span className="text-[10px] uppercase font-bold text-gray-600">Total Cash Outflow</span>
                    <p className="text-base font-bold font-mono mt-1 text-red-700">-{formatCurrency(cashflow?.outflow ?? 0)}</p>
                  </div>
                  <div className="p-3 border border-gray-300 rounded bg-gray-50">
                    <span className="text-[10px] uppercase font-bold text-gray-600">Net Cash Balance</span>
                    <p className="text-base font-bold font-mono mt-1">{formatCurrency(cashflow?.net ?? 0)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 5. TEAM SHIPMENTS LOGISTICS */}
            {(printConfig.targetScope === 'ALL_EXECUTIVE' || activeTab === 'shipments') && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider border-b border-gray-400 pb-1 flex items-center gap-1.5">
                  <Truck className="h-4 w-4" />
                  <span>5. Sales Team Logistics & Fulfillment Audit</span>
                </h3>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 border border-gray-300 rounded bg-gray-50">
                    <span className="text-[10px] uppercase font-bold text-gray-600">Total Dispatches</span>
                    <p className="text-base font-bold font-mono mt-1">{shipmentSummary?.totalShipments ?? 0}</p>
                  </div>
                  <div className="p-3 border border-gray-300 rounded bg-gray-50">
                    <span className="text-[10px] uppercase font-bold text-gray-600">Delivered / Completed</span>
                    <p className="text-base font-bold font-mono mt-1 text-emerald-700">{shipmentSummary?.postedShipments ?? 0}</p>
                  </div>
                </div>

                {shipmentSummary?.teams && shipmentSummary.teams.length > 0 && (
                  <table className="w-full text-xs border border-gray-300 mt-2">
                    <thead className="bg-gray-100 border-b border-gray-300 text-[10px] uppercase">
                      <tr>
                        <th className="p-2 text-left">No</th>
                        <th className="p-2 text-left">Sales Team Name</th>
                        <th className="p-2 text-right">Total Shipments</th>
                        <th className="p-2 text-right">Delivered / Posted</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {shipmentSummary.teams.map((t, i) => (
                        <tr key={i}>
                          <td className="p-2 font-bold">{i + 1}</td>
                          <td className="p-2 font-semibold">{t.teamName}</td>
                          <td className="p-2 text-right font-mono">{t.shipmentCount}</td>
                          <td className="p-2 text-right font-mono font-bold text-emerald-700">{t.postedCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* 6. TRIAL BALANCE AUDIT */}
            {(printConfig.targetScope === 'ALL_EXECUTIVE' || activeTab === 'trial-balance') && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-gray-400 pb-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Scale className="h-4 w-4" />
                    <span>6. General Ledger Double-Entry Trial Balance</span>
                  </h3>
                  <span className="text-xs font-bold">
                    Status: {trialBalance?.isBalanced ? '✓ PERFECTLY BALANCED' : '⚠️ UNBALANCED'}
                  </span>
                </div>

                <table className="w-full text-xs border border-gray-300">
                  <thead className="bg-gray-100 border-b border-gray-300 text-[10px] uppercase">
                    <tr>
                      <th className="p-2 text-left">Code</th>
                      <th className="p-2 text-left">Account Name</th>
                      <th className="p-2 text-left">Type</th>
                      <th className="p-2 text-right">Debit (DR)</th>
                      <th className="p-2 text-right">Credit (CR)</th>
                      <th className="p-2 text-right">Net Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(trialBalance?.accounts || []).map((acct, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-mono font-bold">{acct.accountCode}</td>
                        <td className="p-2 font-semibold">{acct.accountName}</td>
                        <td className="p-2 text-gray-600">{acct.accountType}</td>
                        <td className="p-2 text-right font-mono">{formatCurrency(acct.totalDebit)}</td>
                        <td className="p-2 text-right font-mono">{formatCurrency(acct.totalCredit)}</td>
                        <td className="p-2 text-right font-mono font-bold">{formatCurrency(acct.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-100 font-bold border-t-2 border-black">
                    <tr>
                      <td colSpan={3} className="p-2 text-right uppercase">Total (စုစုပေါင်း):</td>
                      <td className="p-2 text-right font-mono">{formatCurrency(trialBalance?.totalDebit ?? 0)}</td>
                      <td className="p-2 text-right font-mono">{formatCurrency(trialBalance?.totalCredit ?? 0)}</td>
                      <td className="p-2 text-right font-mono">{trialBalance?.isBalanced ? '✓ 0.00' : 'Diff'}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* Formal Signatures & Corporate Seal Block */}
            {printConfig.showSignatures && (
              <div className="pt-8 border-t border-gray-300 mt-8 space-y-6">
                <div className="grid grid-cols-3 gap-6 text-center text-xs">
                  <div className="space-y-8">
                    <p className="font-bold uppercase text-[10px] text-gray-600">Prepared By (ပြုစုသူ)</p>
                    <div className="border-b border-gray-400 mx-4"></div>
                    <div>
                      <p className="font-semibold">{user?.name || 'Accountant / Staff'}</p>
                      <p className="text-[10px] text-gray-500">Date: ____/____/202___</p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <p className="font-bold uppercase text-[10px] text-gray-600">Checked By (စစ်ဆေးသူ)</p>
                    <div className="border-b border-gray-400 mx-4"></div>
                    <div>
                      <p className="font-semibold">Internal Audit / Manager</p>
                      <p className="text-[10px] text-gray-500">Date: ____/____/202___</p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <p className="font-bold uppercase text-[10px] text-gray-600">Approved By (အတည်ပြုသူ)</p>
                    <div className="border-b border-gray-400 mx-4"></div>
                    <div>
                      <p className="font-semibold">Managing Director / Seal</p>
                      <p className="text-[10px] text-gray-500">Date: ____/____/202___</p>
                    </div>
                  </div>
                </div>

                <div className="text-center text-[10px] text-gray-500 pt-4 border-t border-gray-200">
                  NAYA-ERA Official Enterprise ERP • System Automated Report • Certified Valid
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
