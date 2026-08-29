'use client';

import * as React from 'react';
import {
  ShoppingCart,
  Plus,
  CheckCircle2,
  XCircle,
  PackageCheck,
  Eye,
  Trash2,
  RefreshCw,
  Building2,
  Calendar,
  Truck,
  Scale,
  Receipt,
} from 'lucide-react';
import { apiFetch } from '@/lib/api/bff-client';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from '@/components/ui/toast';
import { DataTable, Column } from '@/components/ui/data-table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Sheet } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatCurrency, formatQuantity, formatDate } from '@/lib/utils';
import {
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseReceipt,
  Supplier,
  Product,
  UOM,
  Warehouse,
} from '@/types/erp';

export default function PurchasingPage() {
  const { orgContext } = useAuth();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = React.useState('orders');
  const [isLoading, setIsLoading] = React.useState(true);

  const [orders, setOrders] = React.useState<PurchaseOrder[]>([]);
  const [receipts, setReceipts] = React.useState<PurchaseReceipt[]>([]);
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [uoms, setUoms] = React.useState<UOM[]>([]);
  const [warehouses, setWarehouses] = React.useState<Warehouse[]>([]);

  // Dialog & Sheet States
  const [poDialogOpen, setPoDialogOpen] = React.useState(false);
  const [receiptDialogOpen, setReceiptDialogOpen] = React.useState(false);
  const [selectedPo, setSelectedPo] = React.useState<PurchaseOrder | null>(null);
  const [selectedReceipt, setSelectedReceipt] = React.useState<PurchaseReceipt | null>(null);
  const [poSheetOpen, setPoSheetOpen] = React.useState(false);
  const [receiptSheetOpen, setReceiptSheetOpen] = React.useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = React.useState(false);

  // PO Form State
  const [poForm, setPoForm] = React.useState({
    supplierId: '',
    orderDate: new Date().toISOString().split('T')[0],
    deliveryDate: '',
    items: [
      { productId: '', uomId: '', qty: 1, rate: 0, amount: 0, isFoc: false },
    ],
  });

  // Receipt Form State
  const [receiptForm, setReceiptForm] = React.useState({
    purchaseOrderId: '',
    warehouseId: '',
    receivedDate: new Date().toISOString().split('T')[0],
    items: [] as { purchaseOrderItemId: number; productId: number; uomId: number; qty: number; rate: number; amount: number; isFoc: boolean }[],
  });

  const loadPurchasingData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [poRes, recRes, supRes, prodRes, uomRes, whRes] = await Promise.all([
        apiFetch<PurchaseOrder[]>('/api/purchase/purchase-orders'),
        apiFetch<PurchaseReceipt[]>('/api/purchase/purchase-receipts'),
        apiFetch<Supplier[]>('/api/master/suppliers'),
        apiFetch<Product[]>('/api/master/products'),
        apiFetch<UOM[]>('/api/master/uoms'),
        apiFetch<Warehouse[]>('/api/master/warehouses'),
      ]);

      if (poRes.success && Array.isArray(poRes.data)) setOrders(poRes.data);
      if (recRes.success && Array.isArray(recRes.data)) setReceipts(recRes.data);
      if (supRes.success && Array.isArray(supRes.data)) setSuppliers(supRes.data);
      if (prodRes.success && Array.isArray(prodRes.data)) setProducts(prodRes.data);
      if (uomRes.success && Array.isArray(uomRes.data)) setUoms(uomRes.data);
      if (whRes.success && Array.isArray(whRes.data)) setWarehouses(whRes.data);
    } catch (err: any) {
      error('Failed to load purchasing data', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  React.useEffect(() => {
    loadPurchasingData();
  }, [loadPurchasingData]);

  // Handle PO Item Row Add / Remove / Change
  const addPoItem = () => {
    setPoForm(prev => ({
      ...prev,
      items: [...prev.items, { productId: '', uomId: '', qty: 1, rate: 0, amount: 0, isFoc: false }],
    }));
  };

  const removePoItem = (index: number) => {
    if (poForm.items.length === 1) return;
    setPoForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updatePoItem = (index: number, field: string, value: any) => {
    setPoForm(prev => {
      const updated = [...prev.items];
      const item = { ...updated[index], [field]: value };

      if (field === 'productId') {
        const prod = products.find(p => p.id === Number(value));
        if (prod) item.uomId = String(prod.baseUomId);
      }

      if (field === 'qty' || field === 'rate' || field === 'isFoc') {
        const q = Number(item.qty || 0);
        const r = Number(item.rate || 0);
        item.amount = item.isFoc ? 0 : q * r;
      }

      updated[index] = item;
      return { ...prev, items: updated };
    });
  };

  const poTotalAmount = poForm.items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);

  // Submit New PO
  const handleCreatePo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poForm.supplierId || poForm.items.some(i => !i.productId || !i.uomId || Number(i.qty) <= 0)) {
      error('Please select supplier and valid items with positive quantity');
      return;
    }

    const payload = {
      supplierId: Number(poForm.supplierId),
      orderDate: poForm.orderDate,
      deliveryDate: poForm.deliveryDate || undefined,
      branchId: orgContext.branchId,
      items: poForm.items.map(it => ({
        productId: Number(it.productId),
        uomId: Number(it.uomId),
        qty: Number(it.qty),
        rate: Number(it.rate),
        amount: it.isFoc ? 0 : Number(it.amount),
        isFoc: Boolean(it.isFoc),
      })),
    };

    const res = await apiFetch('/api/purchase/purchase-orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.success) {
      success('Purchase Order Created (အမှာစာ ဖန်တီးပြီးပါပြီ)');
      setPoDialogOpen(false);
      setPoForm({
        supplierId: '',
        orderDate: new Date().toISOString().split('T')[0],
        deliveryDate: '',
        items: [{ productId: '', uomId: '', qty: 1, rate: 0, amount: 0, isFoc: false }],
      });
      loadPurchasingData();
    } else {
      error('Failed to create PO', res.message);
    }
  };

  // Inspect PO Full Details
  const inspectPo = async (po: PurchaseOrder) => {
    const detailRes = await apiFetch<PurchaseOrder>(`/api/purchase/purchase-orders/${po.id}`);
    setSelectedPo(detailRes.success && detailRes.data ? detailRes.data : po);
    setPoSheetOpen(true);
  };

  // Confirm PO
  const handleConfirmPo = async (poId: number) => {
    const res = await apiFetch(`/api/purchase/purchase-orders/${poId}/confirm`, { method: 'PUT' });
    if (res.success) {
      success('PO Confirmed (အမှာစာ အတည်ပြုပြီးပါပြီ)');
      loadPurchasingData();
      if (selectedPo?.id === poId) inspectPo(selectedPo);
    } else {
      error('Confirmation failed', res.message);
    }
  };

  // Cancel PO
  const handleCancelPo = async () => {
    if (!selectedPo) return;
    const res = await apiFetch(`/api/purchase/purchase-orders/${selectedPo.id}/cancel`, { method: 'PUT' });
    if (res.success) {
      success('PO Cancelled (အမှာစာ ဖျက်သိမ်းပြီးပါပြီ)');
      setCancelConfirmOpen(false);
      setPoSheetOpen(false);
      loadPurchasingData();
    } else {
      error('Cancel failed', res.message);
    }
  };

  // Open Receipt Modal from PO
  const handleOpenCreateReceipt = async (po: PurchaseOrder) => {
    const detailRes = await apiFetch<PurchaseOrder>(`/api/purchase/purchase-orders/${po.id}`);
    const fullPo = detailRes.success && detailRes.data ? detailRes.data : po;
    setSelectedPo(fullPo);

    const receiptItems = (fullPo.items || []).map(it => ({
      purchaseOrderItemId: it.id!,
      productId: it.productId,
      uomId: it.uomId,
      qty: it.qty,
      rate: it.rate,
      amount: it.amount,
      isFoc: it.isFoc || false,
    }));

    setReceiptForm({
      purchaseOrderId: String(fullPo.id),
      warehouseId: warehouses[0]?.id ? String(warehouses[0].id) : '',
      receivedDate: new Date().toISOString().split('T')[0],
      items: receiptItems,
    });
    setReceiptDialogOpen(true);
  };

  // Submit Receipt
  const handleCreateReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptForm.purchaseOrderId || !receiptForm.warehouseId || receiptForm.items.length === 0) {
      error('Please select valid Purchase Order and receiving Warehouse');
      return;
    }

    const payload = {
      purchaseOrderId: Number(receiptForm.purchaseOrderId),
      warehouseId: Number(receiptForm.warehouseId),
      receivedDate: receiptForm.receivedDate,
      branchId: orgContext.branchId,
      items: receiptForm.items.map(it => ({
        purchaseOrderItemId: it.purchaseOrderItemId,
        productId: it.productId,
        uomId: it.uomId,
        qty: Number(it.qty),
        rate: Number(it.rate),
        amount: it.isFoc ? 0 : Number(it.amount),
        isFoc: Boolean(it.isFoc),
      })),
    };

    const res = await apiFetch('/api/purchase/purchase-receipts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.success) {
      success('Goods Receipt Saved (ကုန်လက်ခံလွှာ မူကြမ်းသိမ်းဆည်းပြီးပါပြီ)');
      setReceiptDialogOpen(false);
      loadPurchasingData();
    } else {
      error('Receipt creation failed', res.message);
    }
  };

  // Inspect Receipt Details
  const inspectReceipt = async (receipt: PurchaseReceipt) => {
    const detailRes = await apiFetch<PurchaseReceipt>(`/api/purchase/purchase-receipts/${receipt.id}`);
    setSelectedReceipt(detailRes.success && detailRes.data ? detailRes.data : receipt);
    setReceiptSheetOpen(true);
  };

  // Post Receipt (Triggers Inventory Stock + GL Double Entry Journal Entry!)
  const handlePostReceipt = async (receiptId: number) => {
    const res = await apiFetch(`/api/purchase/purchase-receipts/${receiptId}/post`, { method: 'PUT' });
    if (res.success) {
      success(
        'Receipt Posted & GL Synced! (စတော့စာရင်း တိုးပြီး စာရင်းချုပ်သွင်းပြီးပါပြီ)',
        'Inventory stock increased and double-entry AP journal entry auto-generated.'
      );
      loadPurchasingData();
      if (selectedReceipt?.id === receiptId) inspectReceipt(selectedReceipt);
    } else {
      error('Post failed', res.message);
    }
  };

  // PO Table Columns (Desktop)
  const poColumns: Column<PurchaseOrder>[] = [
    { header: 'PO Number', accessorKey: 'poNo', sortable: true, className: 'font-mono font-bold text-blue-600' },
    { header: 'Supplier (ကုန်သွင်းသူ)', cell: r => r.supplier?.name || `Supplier #${r.supplierId}` },
    { header: 'Order Date', cell: r => formatDate(r.orderDate), sortable: true },
    { header: 'Delivery Date', cell: r => formatDate(r.deliveryDate) },
    { header: 'Status', cell: r => <StatusBadge status={r.status} /> },
    {
      header: 'Actions',
      className: 'text-right',
      cell: r => (
        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => inspectPo(r)}
            className="h-7 text-xs"
            title="Inspect"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>

          {r.status === 'DRAFT' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleConfirmPo(r.id)}
              className="h-7 text-xs text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
            >
              Confirm
            </Button>
          )}

          {(r.status === 'CONFIRMED' || r.status === 'PARTIALLY_RECEIVED') && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenCreateReceipt(r)}
              className="h-7 text-xs gap-1"
            >
              <PackageCheck className="h-3.5 w-3.5" /> Receive Goods
            </Button>
          )}
        </div>
      ),
    },
  ];

  // Receipt Table Columns (Desktop)
  const receiptColumns: Column<PurchaseReceipt>[] = [
    { header: 'Receipt No', accessorKey: 'receiptNo', sortable: true, className: 'font-mono font-bold text-emerald-600' },
    { header: 'PO Reference', cell: r => r.purchaseOrder?.poNo || `PO #${r.purchaseOrderId}` },
    { header: 'Receiving Warehouse', cell: r => r.warehouse?.name || `WH #${r.warehouseId}` },
    { header: 'Received Date', cell: r => formatDate(r.receivedDate), sortable: true },
    { header: 'Status', cell: r => <StatusBadge status={r.status} /> },
    {
      header: 'Actions',
      className: 'text-right',
      cell: r => (
        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => inspectReceipt(r)}
            className="h-7 text-xs"
            title="Inspect"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>

          {r.status === 'DRAFT' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handlePostReceipt(r.id)}
              className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Post to Stock & GL
            </Button>
          )}
        </div>
      ),
    },
  ];

  // ─── MOBILE M3 CARDS RENDERERS ──────────────────────────────────
  const renderPoCard = (po: PurchaseOrder) => {
    const itemCount = po.items?.length || 0;
    const totalAmount = po.items?.reduce((s, it) => s + (it.isFoc ? 0 : Number(it.amount || 0)), 0) || 0;

    return (
      <div className="rounded-2xl border border-zinc-200/90 bg-white p-3.5 sm:p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-3 transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-md">
            {po.poNo}
          </span>
          <StatusBadge status={po.status} />
        </div>

        {/* Supplier & Dates */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 font-bold text-xs">
              <Truck className="h-3.5 w-3.5" />
            </div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
              {po.supplier?.name || `Supplier #${po.supplierId}`}
            </h4>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 pl-9">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3 text-zinc-400" />
              <span>{formatDate(po.orderDate)}</span>
            </span>
            {po.deliveryDate && (
              <span className="inline-flex items-center gap-1 text-zinc-400">
                <span>• Delivery: {formatDate(po.deliveryDate)}</span>
              </span>
            )}
          </div>
        </div>

        {/* Summary: Items count & Total Amount */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 text-xs">
          <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">
            {itemCount} item{itemCount !== 1 ? 's' : ''} ordered
          </span>
          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
            {formatCurrency(totalAmount)}
          </span>
        </div>

        {/* Action Buttons Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs" onClick={e => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => inspectPo(po)}
            className="h-8 px-2.5 text-zinc-600 dark:text-zinc-300 gap-1"
            title="Inspect"
          >
            <Eye className="h-3.5 w-3.5" />
            <span className="text-xs">Detail</span>
          </Button>

          <div className="flex items-center gap-1.5">
            {po.status === 'DRAFT' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleConfirmPo(po.id)}
                className="h-8 px-3 text-xs text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800"
              >
                Confirm
              </Button>
            )}

            {(po.status === 'CONFIRMED' || po.status === 'PARTIALLY_RECEIVED') && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleOpenCreateReceipt(po)}
                className="h-8 px-3 text-xs gap-1 bg-blue-600 hover:bg-blue-700"
              >
                <PackageCheck className="h-3.5 w-3.5" /> Receive Goods
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderReceiptCard = (r: PurchaseReceipt) => {
    return (
      <div className="rounded-2xl border border-zinc-200/90 bg-white p-3.5 sm:p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-3 transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-md">
            {r.receiptNo}
          </span>
          <StatusBadge status={r.status} />
        </div>

        {/* PO Reference & Warehouse */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 font-bold text-xs">
              <Building2 className="h-3.5 w-3.5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                {r.warehouse?.name || `Warehouse #${r.warehouseId}`}
              </h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                Ref: {r.purchaseOrder?.poNo || `PO #${r.purchaseOrderId}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 pl-9">
            <Calendar className="h-3 w-3 text-zinc-400" />
            <span>Received: {formatDate(r.receivedDate)}</span>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs" onClick={e => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => inspectReceipt(r)}
            className="h-8 px-2.5 text-zinc-600 dark:text-zinc-300 gap-1"
            title="Inspect"
          >
            <Eye className="h-3.5 w-3.5" />
            <span className="text-xs">Detail</span>
          </Button>

          {r.status === 'DRAFT' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handlePostReceipt(r.id)}
              className="h-8 px-3 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Post to Stock & GL
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full overflow-x-hidden min-w-0">
      {/* ─── WORKSPACE HEADER (M3 Responsive) ───────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-4 pb-1">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 shrink-0" />
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 truncate">
              Purchasing & Receipts (အဝယ်နှင့် ကုန်လက်ခံလွှာ)
            </h1>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
            Purchase Orders → Goods Receipts → Stock & GL Auto-Sync
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button variant="outline" size="sm" onClick={loadPurchasingData} className="gap-1.5 h-8 text-xs shrink-0">
            <RefreshCw className={isLoading ? 'animate-spin h-3.5 w-3.5' : 'h-3.5 w-3.5'} />
            <span className="hidden sm:inline">Refresh (ပြန်ဖွင့်)</span>
            <span className="sm:hidden">Refresh</span>
          </Button>
          <div className="hidden sm:block">
            <Button variant="primary" size="sm" onClick={() => setPoDialogOpen(true)} className="gap-1.5 h-8 text-xs">
              <Plus className="h-3.5 w-3.5" />
              <span>+ New Purchase Order (အမှာစာအသစ်)</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ─── TABS NAVIGATION (Scrollable M3 Segmented Bar) ─────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0">
          <TabsList className="w-max sm:w-full justify-start">
            <TabsTrigger value="orders" count={orders.length}>
              📦 Purchase Orders (အဝယ်အမှာစာများ)
            </TabsTrigger>
            <TabsTrigger value="receipts" count={receipts.length}>
              🧾 Goods Receipts (ကုန်လက်ခံလွှာများ)
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ─── TAB 1: PURCHASE ORDERS ─────────────────────────────────── */}
        <TabsContent value="orders">
          <DataTable
            data={orders}
            columns={poColumns}
            searchPlaceholder="Search purchase orders by PO# or supplier (အမှာစာရှာရန်)..."
            searchKey="poNo"
            isLoading={isLoading}
            renderCard={renderPoCard}
            onRowClick={r => inspectPo(r)}
          />
        </TabsContent>

        {/* ─── TAB 2: GOODS RECEIPTS ──────────────────────────────────── */}
        <TabsContent value="receipts">
          <DataTable
            data={receipts}
            columns={receiptColumns}
            searchPlaceholder="Search receipts by GR# or PO# (ကုန်လက်ခံလွှာရှာရန်)..."
            searchKey="receiptNo"
            isLoading={isLoading}
            renderCard={renderReceiptCard}
            onRowClick={r => inspectReceipt(r)}
          />
        </TabsContent>
      </Tabs>

      {/* ─── MODAL: NEW PURCHASE ORDER ──────────────────────────────── */}
      <Dialog
        open={poDialogOpen}
        onOpenChange={setPoDialogOpen}
        title="Create Purchase Order (အဝယ်အမှာစာအသစ်ဖွင့်ရန်)"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreatePo} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Supplier (ကုန်သွင်းသူ) *"
              value={poForm.supplierId}
              onChange={e => setPoForm({ ...poForm, supplierId: e.target.value })}
              required
            >
              <option value="">Select Supplier...</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>

            <Input
              type="date"
              label="Order Date (မှာယူသည့်ရက်) *"
              value={poForm.orderDate}
              onChange={e => setPoForm({ ...poForm, orderDate: e.target.value })}
              required
            />

            <Input
              type="date"
              label="Expected Delivery (မျှော်မှန်းရက်)"
              value={poForm.deliveryDate}
              onChange={e => setPoForm({ ...poForm, deliveryDate: e.target.value })}
            />
          </div>

          {/* Line items section */}
          <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                  Order Items (မှာယူမည့်ပစ္စည်းများ)
                </h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {poForm.items.length} item{poForm.items.length > 1 ? 's' : ''} in this order
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addPoItem} className="h-7 text-xs gap-1">
                <Plus className="h-3.5 w-3.5" /> + Add Item
              </Button>
            </div>

            <div className="space-y-2.5 max-h-[50vh] sm:max-h-64 overflow-y-auto pr-0.5">
              {/* Responsive Mobile Card View (block md:hidden) */}
              <div className="block md:hidden space-y-2.5">
                {poForm.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80 p-3 space-y-2.5 shadow-2xs"
                  >
                    {/* Card Header: Item # and Subtotal / Delete */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 px-2 py-0.5 rounded">
                          Item #{idx + 1}
                        </span>
                        {item.isFoc && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            FOC Free
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-zinc-900 dark:text-zinc-100">
                          {item.isFoc ? 'Ks 0' : formatCurrency(item.amount)}
                        </span>
                        {poForm.items.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removePoItem(idx)}
                            className="h-7 w-7 text-rose-500 hover:text-rose-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Product Selector */}
                    <div>
                      <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">
                        Product (ကုန်ပစ္စည်း) *
                      </label>
                      <Select
                        value={item.productId}
                        onChange={e => updatePoItem(idx, 'productId', e.target.value)}
                        required
                      >
                        <option value="">Select Product...</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku})
                          </option>
                        ))}
                      </Select>
                    </div>

                    {/* 3-Column Inputs: Unit, Qty, Rate */}
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">
                          Unit (ယူနစ်)
                        </label>
                        <Select
                          value={item.uomId}
                          onChange={e => updatePoItem(idx, 'uomId', e.target.value)}
                          required
                        >
                          <option value="">Unit...</option>
                          {uoms.map(u => (
                            <option key={u.id} value={u.id}>
                              {u.symbol || u.name}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">
                          Qty (အရေအတွက်)
                        </label>
                        <Input
                          type="number"
                          step="any"
                          placeholder="Qty"
                          value={item.qty}
                          onChange={e => updatePoItem(idx, 'qty', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">
                          Rate (စျေးနှုန်း)
                        </label>
                        <Input
                          type="number"
                          step="any"
                          placeholder="Rate"
                          value={item.rate}
                          onChange={e => updatePoItem(idx, 'rate', e.target.value)}
                          disabled={item.isFoc}
                          required={!item.isFoc}
                        />
                      </div>
                    </div>

                    {/* FOC Checkbox */}
                    <div className="flex items-center gap-2 pt-1 border-t border-zinc-200/60 dark:border-zinc-800">
                      <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={item.isFoc}
                          onChange={e => updatePoItem(idx, 'isFoc', e.target.checked)}
                          className="rounded border-zinc-300 h-4 w-4 text-blue-600"
                        />
                        <span>FOC Item (အခမဲ့/အပိုထည့်ပေးခြင်း)</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table Row View (hidden md:block) */}
              <div className="hidden md:block space-y-2">
                {poForm.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2 rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60"
                  >
                    <div className="flex-1">
                      <Select
                        value={item.productId}
                        onChange={e => updatePoItem(idx, 'productId', e.target.value)}
                        required
                      >
                        <option value="">Select Product...</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku})
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div className="w-28">
                      <Select
                        value={item.uomId}
                        onChange={e => updatePoItem(idx, 'uomId', e.target.value)}
                        required
                      >
                        <option value="">Unit...</option>
                        {uoms.map(u => (
                          <option key={u.id} value={u.id}>
                            {u.symbol || u.name}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div className="w-24">
                      <Input
                        type="number"
                        step="any"
                        placeholder="Qty"
                        value={item.qty}
                        onChange={e => updatePoItem(idx, 'qty', e.target.value)}
                        required
                      />
                    </div>

                    <div className="w-28">
                      <Input
                        type="number"
                        step="any"
                        placeholder="Rate"
                        value={item.rate}
                        onChange={e => updatePoItem(idx, 'rate', e.target.value)}
                        disabled={item.isFoc}
                        required={!item.isFoc}
                      />
                    </div>

                    <div className="flex items-center gap-1 shrink-0 px-1">
                      <label className="text-[11px] font-semibold text-zinc-500 cursor-pointer">FOC</label>
                      <input
                        type="checkbox"
                        checked={item.isFoc}
                        onChange={e => updatePoItem(idx, 'isFoc', e.target.checked)}
                        className="rounded border-zinc-300 h-3.5 w-3.5 text-blue-600"
                      />
                    </div>

                    <div className="w-28 text-right font-semibold text-xs text-zinc-800 dark:text-zinc-200 shrink-0">
                      {item.isFoc ? <Badge variant="secondary">FOC</Badge> : formatCurrency(item.amount)}
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removePoItem(idx)}
                      disabled={poForm.items.length === 1}
                      className="h-8 w-8 text-rose-500 hover:text-rose-700 shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Footer */}
            <div className="flex justify-between items-center p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 font-bold text-xs sm:text-sm">
              <span className="text-zinc-700 dark:text-zinc-300">
                Total Estimated Amount (စုစုပေါင်း ကျသင့်ငွေ):
              </span>
              <span className="text-blue-600 dark:text-blue-400 font-mono text-sm sm:text-base">
                {formatCurrency(poTotalAmount)}
              </span>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setPoDialogOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="w-full sm:w-auto">
              Save Purchase Order (အမှာစာသိမ်းရန်)
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── MODAL: NEW PURCHASE RECEIPT ────────────────────────────── */}
      <Dialog
        open={receiptDialogOpen}
        onOpenChange={setReceiptDialogOpen}
        title="Create Goods Receipt (ကုန်လက်ခံလွှာ ဖန်တီးရန်)"
        maxWidth="xl"
      >
        <form onSubmit={handleCreateReceipt} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Receiving Warehouse (လက်ခံမည့် ကုန်လှောင်ရုံ) *"
              value={receiptForm.warehouseId}
              onChange={e => setReceiptForm({ ...receiptForm, warehouseId: e.target.value })}
              required
            >
              <option value="">Select Warehouse...</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </Select>

            <Input
              type="date"
              label="Received Date (လက်ခံသည့်ရက်) *"
              value={receiptForm.receivedDate}
              onChange={e => setReceiptForm({ ...receiptForm, receivedDate: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Items to Receive (လက်ခံမည့် ပစ္စည်းများ)
            </h4>
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900">
              {receiptForm.items.map((it, idx) => {
                const prod = products.find(p => p.id === it.productId);
                const uom = uoms.find(u => u.id === it.uomId);
                return (
                  <div key={idx} className="p-3 text-xs space-y-2 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {prod?.name || `Item #${it.productId}`}
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {it.isFoc ? (
                          <Badge variant="secondary" className="text-[10px]">FOC Free Item</Badge>
                        ) : (
                          `Rate: ${formatCurrency(it.rate)} / ${uom?.symbol || ''}`
                        )}
                      </p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-2 pt-1 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800">
                      <label className="text-[11px] font-semibold text-zinc-500 shrink-0">Received Qty:</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="any"
                          value={it.qty}
                          onChange={e => {
                            const val = Number(e.target.value);
                            const updated = [...receiptForm.items];
                            updated[idx] = { ...it, qty: val, amount: it.isFoc ? 0 : val * it.rate };
                            setReceiptForm({ ...receiptForm, items: updated });
                          }}
                          className="w-24 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-1.5 text-center font-bold text-xs"
                        />
                        <span className="text-zinc-500 font-semibold">{uom?.symbol}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setReceiptDialogOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="w-full sm:w-auto">
              Save Goods Receipt (သိမ်းဆည်းပါ)
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── MODAL: CANCEL PO CONFIRMATION ──────────────────────────── */}
      <Dialog open={cancelConfirmOpen} onOpenChange={setCancelConfirmOpen} title="Cancel Purchase Order (အမှာစာဖျက်သိမ်းရန်)">
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300">
            Are you sure you want to cancel Purchase Order <span className="font-bold text-zinc-900 dark:text-zinc-100">{selectedPo?.poNo}</span>?
          </p>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setCancelConfirmOpen(false)} className="w-full sm:w-auto">
              No, Keep Active (မဖျက်ပါ)
            </Button>
            <Button type="button" variant="destructive" onClick={handleCancelPo} className="w-full sm:w-auto">
              Yes, Cancel PO (ဖျက်သိမ်းပါ)
            </Button>
          </div>
        </div>
      </Dialog>

      {/* ─── CONTEXTUAL SHEET: PURCHASE ORDER INSPECTION ─────────────── */}
      <Sheet
        open={poSheetOpen}
        onOpenChange={setPoSheetOpen}
        title={`Purchase Order: ${selectedPo?.poNo || ''}`}
        description={`Supplier: ${selectedPo?.supplier?.name || ''}`}
        footer={
          selectedPo && (
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 w-full">
              <div>
                {selectedPo.status === 'DRAFT' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCancelConfirmOpen(true)}
                    className="text-rose-600 w-full sm:w-auto text-xs"
                  >
                    Cancel PO
                  </Button>
                )}
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {selectedPo.status === 'DRAFT' && (
                  <Button variant="primary" size="sm" onClick={() => handleConfirmPo(selectedPo.id)} className="w-full sm:w-auto text-xs">
                    Confirm PO (အတည်ပြုပါ)
                  </Button>
                )}
                {(selectedPo.status === 'CONFIRMED' || selectedPo.status === 'PARTIALLY_RECEIVED') && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setPoSheetOpen(false);
                      handleOpenCreateReceipt(selectedPo);
                    }}
                    className="gap-1 bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto text-xs"
                  >
                    <PackageCheck className="h-4 w-4" /> Create Receipt (ကုန်လက်ခံပါ)
                  </Button>
                )}
              </div>
            </div>
          )
        }
      >
        {selectedPo && (
          <div className="space-y-6 text-xs">
            {/* Overview cards */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 p-3.5 sm:p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">Order Status</p>
                <div className="mt-1">
                  <StatusBadge status={selectedPo.status} />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">Order Date</p>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-1">{formatDate(selectedPo.orderDate)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">Supplier Contact</p>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-1">{selectedPo.supplier?.phoneNumber || '-'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">Delivery Target</p>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-1">{formatDate(selectedPo.deliveryDate)}</p>
              </div>
            </div>

            {/* Line items list */}
            <div className="space-y-2">
              <h4 className="font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider text-xs">
                Ordered Products (မှာယူထားသော ပစ္စည်းများ)
              </h4>
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900">
                {(selectedPo.items || []).map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3">
                    <div className="min-w-0 pr-2">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{it.product?.name || `Product #${it.productId}`}</p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {it.qty} {it.uom?.symbol || ''} @ {formatCurrency(it.rate)} {it.isFoc && <Badge variant="secondary" className="ml-1 text-[10px]">FOC</Badge>}
                      </p>
                    </div>
                    <span className="font-bold font-mono text-zinc-900 dark:text-zinc-100 shrink-0">
                      {it.isFoc ? '0.00' : formatCurrency(it.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Linked Receipts */}
            <div className="space-y-2">
              <h4 className="font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider text-xs">
                Linked Goods Receipts (လက်ခံရရှိမှု မှတ်တမ်းများ)
              </h4>
              {(selectedPo.receipts || []).length > 0 ? (
                <div className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900">
                  {selectedPo.receipts?.map((r, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3">
                      <div>
                        <p className="font-mono font-bold text-emerald-600">{r.receiptNo}</p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{formatDate(r.receivedDate)}</p>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-400 italic">No goods receipts posted yet.</p>
              )}
            </div>
          </div>
        )}
      </Sheet>

      {/* ─── CONTEXTUAL SHEET: GOODS RECEIPT INSPECTION ──────────────── */}
      <Sheet
        open={receiptSheetOpen}
        onOpenChange={setReceiptSheetOpen}
        title={`Goods Receipt: ${selectedReceipt?.receiptNo || ''}`}
        description={`PO Reference: ${selectedReceipt?.purchaseOrder?.poNo || ''}`}
        footer={
          selectedReceipt && selectedReceipt.status === 'DRAFT' && (
            <div className="flex justify-end gap-2 w-full">
              <Button
                variant="primary"
                size="sm"
                onClick={() => handlePostReceipt(selectedReceipt.id)}
                className="bg-emerald-600 hover:bg-emerald-700 gap-1.5 w-full sm:w-auto text-xs"
              >
                <CheckCircle2 className="h-4 w-4" /> Post to Stock & General Ledger (စာရင်းသွင်းပါ)
              </Button>
            </div>
          )
        }
      >
        {selectedReceipt && (
          <div className="space-y-6 text-xs">
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 p-3.5 sm:p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">Status</p>
                <div className="mt-1">
                  <StatusBadge status={selectedReceipt.status} />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">Receiving Warehouse</p>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-1">{selectedReceipt.warehouse?.name}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">Received Date</p>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-1">{formatDate(selectedReceipt.receivedDate)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">GL Double-Entry Sync</p>
                <p className="font-semibold text-emerald-600 mt-1">
                  {selectedReceipt.status === 'POSTED' ? '✓ Auto-Posted (Inventory DR / AP CR)' : 'Pending Post'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider text-xs">
                Received Products (လက်ခံရရှိသော ပစ္စည်းများ)
              </h4>
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900">
                {(selectedReceipt.items || []).map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3">
                    <div className="min-w-0 pr-2">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{it.product?.name || `Product #${it.productId}`}</p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {it.qty} {it.uom?.symbol || ''} @ {formatCurrency(it.rate)} {it.isFoc && <Badge variant="secondary" className="ml-1 text-[10px]">FOC</Badge>}
                      </p>
                    </div>
                    <span className="font-bold font-mono text-zinc-900 dark:text-zinc-100 shrink-0">
                      {it.isFoc ? '0.00' : formatCurrency(it.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Sheet>

      {/* ─── MOBILE FLOATING ACTION BUTTON (M3 Standard) ───────────── */}
      <div className="fixed bottom-6 right-6 sm:hidden z-40">
        <Button
          type="button"
          onClick={() => setPoDialogOpen(true)}
          className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl flex items-center justify-center p-0 active:scale-95 transition-transform"
          title="New Purchase Order"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
