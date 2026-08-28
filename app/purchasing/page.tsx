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

  // PO Table Columns
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

  // Receipt Table Columns
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

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Purchasing & Goods Receipts (အဝယ်နှင့် ကုန်လက်ခံလွှာများ)
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Procurement workflow: Purchase Orders → Goods Receipts → Real-time Stock increment & AP General Ledger entries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadPurchasingData} className="gap-1.5 h-8 text-xs">
            <RefreshCw className={isLoading ? 'animate-spin h-3.5 w-3.5' : 'h-3.5 w-3.5'} />
            <span>Refresh</span>
          </Button>
          <Button variant="primary" size="sm" onClick={() => setPoDialogOpen(true)} className="gap-1.5 h-8 text-xs">
            <Plus className="h-3.5 w-3.5" />
            <span>+ New Purchase Order (အမှာစာအသစ်)</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-zinc-100 dark:bg-zinc-800">
          <TabsTrigger value="orders" count={orders.length}>
            Purchase Orders (အဝယ်အမှာစာများ)
          </TabsTrigger>
          <TabsTrigger value="receipts" count={receipts.length}>
            Goods Receipts (ကုန်လက်ခံလွှာများ)
          </TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: PURCHASE ORDERS ─────────────────────────────────── */}
        <TabsContent value="orders">
          <DataTable
            data={orders}
            columns={poColumns}
            searchPlaceholder="Search purchase orders by PO# or supplier..."
            searchKey="poNo"
            isLoading={isLoading}
            onRowClick={r => inspectPo(r)}
          />
        </TabsContent>

        {/* ─── TAB 2: GOODS RECEIPTS ──────────────────────────────────── */}
        <TabsContent value="receipts">
          <DataTable
            data={receipts}
            columns={receiptColumns}
            searchPlaceholder="Search receipts by GR# or PO#..."
            searchKey="receiptNo"
            isLoading={isLoading}
            onRowClick={r => inspectReceipt(r)}
          />
        </TabsContent>
      </Tabs>

      {/* ─── MODAL: NEW PURCHASE ORDER ──────────────────────────────── */}
      <Dialog open={poDialogOpen} onOpenChange={setPoDialogOpen} title="Create Purchase Order (အဝယ်အမှာစာအသစ်ဖွင့်ရန်)" maxWidth="2xl">
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
              label="Expected Delivery Date (မျှော်မှန်းရက်)"
              value={poForm.deliveryDate}
              onChange={e => setPoForm({ ...poForm, deliveryDate: e.target.value })}
            />
          </div>

          {/* Line items table */}
          <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Order Items (မှာယူမည့်ပစ္စည်းများ)
              </h4>
              <Button type="button" variant="outline" size="sm" onClick={addPoItem} className="h-7 text-xs gap-1">
                <Plus className="h-3 w-3" /> Add Item
              </Button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {poForm.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60">
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

                  <div className="w-24">
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

                  <div className="w-20">
                    <Input
                      type="number"
                      step="any"
                      placeholder="Qty"
                      value={item.qty}
                      onChange={e => updatePoItem(idx, 'qty', e.target.value)}
                      required
                    />
                  </div>

                  <div className="w-24">
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

                  <div className="flex items-center gap-1">
                    <label className="text-[11px] font-semibold text-zinc-500">FOC</label>
                    <input
                      type="checkbox"
                      checked={item.isFoc}
                      onChange={e => updatePoItem(idx, 'isFoc', e.target.checked)}
                      className="rounded border-zinc-300"
                    />
                  </div>

                  <div className="w-24 text-right font-semibold text-xs text-zinc-800 dark:text-zinc-200">
                    {item.isFoc ? <Badge variant="secondary">FOC</Badge> : formatCurrency(item.amount)}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removePoItem(idx)}
                    disabled={poForm.items.length === 1}
                    className="h-8 w-8 text-rose-500 hover:text-rose-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Total Footer */}
            <div className="flex justify-between items-center p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 font-bold text-sm">
              <span>Total Estimated Amount (စုစုပေါင်း ကျသင့်ငွေ):</span>
              <span className="text-blue-600 dark:text-blue-400 font-mono">{formatCurrency(poTotalAmount)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setPoDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Purchase Order
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── MODAL: NEW PURCHASE RECEIPT ────────────────────────────── */}
      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen} title="Create Goods Receipt (ကုန်လက်ခံလွှာ ဖန်တီးရန်)" maxWidth="xl">
        <form onSubmit={handleCreateReceipt} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
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

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase text-zinc-500">Items to Receive (လက်ခံမည့် ပစ္စည်းများ)</h4>
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-800">
              {receiptForm.items.map((it, idx) => {
                const prod = products.find(p => p.id === it.productId);
                const uom = uoms.find(u => u.id === it.uomId);
                return (
                  <div key={idx} className="flex items-center justify-between p-3 text-xs">
                    <div>
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">{prod?.name || `Item #${it.productId}`}</p>
                      <p className="text-[11px] text-zinc-500">
                        {it.isFoc ? 'FOC Free Item' : `Rate: ${formatCurrency(it.rate)} / ${uom?.symbol}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] text-zinc-500">Received Qty:</label>
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
                        className="w-20 rounded border border-zinc-300 p-1 text-center font-bold dark:border-zinc-700"
                      />
                      <span>{uom?.symbol}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setReceiptDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Goods Receipt (Draft)
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── MODAL: CANCEL PO CONFIRMATION ──────────────────────────── */}
      <Dialog open={cancelConfirmOpen} onOpenChange={setCancelConfirmOpen} title="Cancel Purchase Order">
        <div className="space-y-4">
          <p className="text-xs text-zinc-600 dark:text-zinc-300">
            Are you sure you want to cancel Purchase Order <span className="font-bold">{selectedPo?.poNo}</span>?
          </p>
          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setCancelConfirmOpen(false)}>
              No, Keep Active
            </Button>
            <Button type="button" variant="destructive" onClick={handleCancelPo}>
              Yes, Cancel PO
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
            <div className="flex items-center justify-between w-full">
              <div>
                {selectedPo.status === 'DRAFT' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCancelConfirmOpen(true)}
                    className="text-rose-600"
                  >
                    Cancel PO
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                {selectedPo.status === 'DRAFT' && (
                  <Button variant="primary" size="sm" onClick={() => handleConfirmPo(selectedPo.id)}>
                    Confirm PO
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
                    className="gap-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <PackageCheck className="h-4 w-4" /> Create Receipt
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
            <div className="grid grid-cols-2 gap-3 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
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
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                {(selectedPo.items || []).map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3">
                    <div>
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">{it.product?.name || `Product #${it.productId}`}</p>
                      <p className="text-[11px] text-zinc-500">
                        {it.qty} {it.uom?.symbol || ''} @ {formatCurrency(it.rate)} {it.isFoc && <Badge variant="secondary" className="ml-1">FOC</Badge>}
                      </p>
                    </div>
                    <span className="font-bold font-mono text-zinc-900 dark:text-zinc-100">
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
                <div className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                  {selectedPo.receipts?.map((r, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3">
                      <div>
                        <p className="font-mono font-bold text-emerald-600">{r.receiptNo}</p>
                        <p className="text-[11px] text-zinc-500">{formatDate(r.receivedDate)}</p>
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
                className="bg-emerald-600 hover:bg-emerald-700 gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" /> Post to Stock & General Ledger
              </Button>
            </div>
          )
        }
      >
        {selectedReceipt && (
          <div className="space-y-6 text-xs">
            <div className="grid grid-cols-2 gap-3 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
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
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                {(selectedReceipt.items || []).map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3">
                    <div>
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">{it.product?.name || `Product #${it.productId}`}</p>
                      <p className="text-[11px] text-zinc-500">
                        {it.qty} {it.uom?.symbol || ''} @ {formatCurrency(it.rate)} {it.isFoc && <Badge variant="secondary" className="ml-1">FOC</Badge>}
                      </p>
                    </div>
                    <span className="font-bold font-mono text-zinc-900 dark:text-zinc-100">
                      {it.isFoc ? '0.00' : formatCurrency(it.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
