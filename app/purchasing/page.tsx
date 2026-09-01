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
  Printer,
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
  const { user, orgContext } = useAuth();
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

  // Document Printing States
  const [printDialogOpen, setPrintDialogOpen] = React.useState(false);
  const [printType, setPrintType] = React.useState<'PO' | 'RECEIPT'>('RECEIPT');
  const [selectedPrintPo, setSelectedPrintPo] = React.useState<PurchaseOrder | null>(null);
  const [selectedPrintReceipt, setSelectedPrintReceipt] = React.useState<PurchaseReceipt | null>(null);
  const [printConfig, setPrintConfig] = React.useState<{
    paperSize: 'A4' | 'THERMAL_80MM';
    showLetterhead: boolean;
    showSignatures: boolean;
  }>({
    paperSize: 'A4',
    showLetterhead: true,
    showSignatures: true,
  });

  const handleOpenPrintPo = async (po: PurchaseOrder) => {
    if (!po.items || po.items.length === 0) {
      const detailRes = await apiFetch<PurchaseOrder>(`/api/purchase/purchase-orders/${po.id}`);
      setSelectedPrintPo(detailRes.success && detailRes.data ? detailRes.data : po);
    } else {
      setSelectedPrintPo(po);
    }
    setPrintType('PO');
    setPrintDialogOpen(true);
  };

  const handleOpenPrintReceipt = async (receipt: PurchaseReceipt) => {
    if (!receipt.items || receipt.items.length === 0) {
      const detailRes = await apiFetch<PurchaseReceipt>(`/api/purchase/purchase-receipts/${receipt.id}`);
      setSelectedPrintReceipt(detailRes.success && detailRes.data ? detailRes.data : receipt);
    } else {
      setSelectedPrintReceipt(receipt);
    }
    setPrintType('RECEIPT');
    setPrintDialogOpen(true);
  };

  const handleExecutePrint = () => {
    window.print();
  };

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
      error('ကုန်သွင်းသူနှင့် အနည်းဆုံး ပစ္စည်းတစ်ခုကို မှန်ကန်စွာ ရွေးချယ်ပေးပါ');
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
      success('အဝယ်အမှာစာ ဖန်တီးပြီးပါပြီ');
      setPoDialogOpen(false);
      setPoForm({
        supplierId: '',
        orderDate: new Date().toISOString().split('T')[0],
        deliveryDate: '',
        items: [{ productId: '', uomId: '', qty: 1, rate: 0, amount: 0, isFoc: false }],
      });
      loadPurchasingData();
    } else {
      error('အဝယ်အမှာစာ ဖန်တီး၍မရပါ', res.message);
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
      success('အမှာစာ အတည်ပြုပြီးပါပြီ');
      loadPurchasingData();
      if (selectedPo?.id === poId) inspectPo(selectedPo);
    } else {
      error('အတည်ပြု၍ မရပါ', res.message);
    }
  };

  // Cancel PO
  const handleCancelPo = async () => {
    if (!selectedPo) return;
    const res = await apiFetch(`/api/purchase/purchase-orders/${selectedPo.id}/cancel`, { method: 'PUT' });
    if (res.success) {
      success('အမှာစာ ဖျက်သိမ်းပြီးပါပြီ');
      setCancelConfirmOpen(false);
      setPoSheetOpen(false);
      loadPurchasingData();
    } else {
      error('ဖျက်သိမ်း၍ မရပါ', res.message);
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
      error('အဝယ်အမှာစာနှင့် လက်ခံမည့် ဂိုဒေါင်ကို မှန်ကန်စွာ ရွေးချယ်ပေးပါ');
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
      success('ကုန်လက်ခံလွှာ မူကြမ်းသိမ်းဆည်းပြီးပါပြီ');
      setReceiptDialogOpen(false);
      loadPurchasingData();
    } else {
      error('ကုန်လက်ခံလွှာ သိမ်းဆည်း၍မရပါ', res.message);
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
        'စတော့စာရင်း တိုးပြီး စာရင်းချုပ်သွင်းပြီးပါပြီ',
        'ဂိုဒေါင်စတော့စာရင်းတိုးမြှင့်ပြီး အဝယ်စာရင်းချုပ် (AP Journal) အလိုအလျောက် ထည့်သွင်းပြီးပါပြီ။'
      );
      loadPurchasingData();
      if (selectedReceipt?.id === receiptId) inspectReceipt(selectedReceipt);
    } else {
      error('စာရင်းသွင်း၍ မရပါ', res.message);
    }
  };

  // PO Table Columns (Desktop)
  const poColumns: Column<PurchaseOrder>[] = [
    { header: 'အမှာစာအမှတ် (PO No)', accessorKey: 'poNo', sortable: true, className: 'font-mono font-bold text-blue-600 dark:text-blue-400' },
    { header: 'ကုန်သွင်းသူ', cell: r => r.supplier?.name || `ကုန်သွင်းသူ #${r.supplierId}` },
    { header: 'မှာယူသည့်ရက်စွဲ', cell: r => formatDate(r.orderDate), sortable: true },
    { header: 'ပို့ဆောင်ရမည့်ရက်', cell: r => formatDate(r.deliveryDate) },
    { header: 'အခြေအနေ', cell: r => <StatusBadge status={r.status} /> },
    {
      header: 'လုပ်ဆောင်ချက်',
      className: 'text-right',
      cell: r => (
        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenPrintPo(r)}
            className="h-7 text-xs text-zinc-600 hover:text-blue-600 dark:text-zinc-300 dark:hover:text-blue-400"
            title="အမှာစာ ပရင့်ထုတ်ရန်"
          >
            <Printer className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => inspectPo(r)}
            className="h-7 text-xs"
            title="အသေးစိတ်ကြည့်ရန်"
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
              အတည်ပြုမည်
            </Button>
          )}

          {(r.status === 'CONFIRMED' || r.status === 'PARTIALLY_RECEIVED') && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenCreateReceipt(r)}
              className="h-7 text-xs gap-1"
            >
              <PackageCheck className="h-3.5 w-3.5" /> ကုန်လက်ခံမည်
            </Button>
          )}
        </div>
      ),
    },
  ];

  // Receipt Table Columns (Desktop)
  const receiptColumns: Column<PurchaseReceipt>[] = [
    { header: 'လက်ခံလွှာအမှတ် (GRN No)', accessorKey: 'receiptNo', sortable: true, className: 'font-mono font-bold text-emerald-600 dark:text-emerald-400' },
    { header: 'အဝယ်အမှာစာ ရည်ညွှန်းချက်', cell: r => r.purchaseOrder?.poNo || `PO #${r.purchaseOrderId}` },
    { header: 'လက်ခံမည့်ဂိုဒေါင်', cell: r => r.warehouse?.name || `WH #${r.warehouseId}` },
    { header: 'လက်ခံရရှိသည့်ရက်စွဲ', cell: r => formatDate(r.receivedDate), sortable: true },
    { header: 'အခြေအနေ', cell: r => <StatusBadge status={r.status} /> },
    {
      header: 'လုပ်ဆောင်ချက်',
      className: 'text-right',
      cell: r => (
        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenPrintReceipt(r)}
            className="h-7 text-xs text-zinc-600 hover:text-emerald-600 dark:text-zinc-300 dark:hover:text-emerald-400"
            title="ပစ္စည်းလက်ခံပြေစာ ပရင့်ထုတ်ရန်"
          >
            <Printer className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => inspectReceipt(r)}
            className="h-7 text-xs"
            title="အသေးစိတ်ကြည့်ရန်"
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
              <CheckCircle2 className="h-3.5 w-3.5" /> စတော့နှင့် စာရင်းသွင်းမည်
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
              {po.supplier?.name || `ကုန်သွင်းသူ #${po.supplierId}`}
            </h4>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 pl-9">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3 text-zinc-400" />
              <span>{formatDate(po.orderDate)}</span>
            </span>
            {po.deliveryDate && (
              <span className="inline-flex items-center gap-1 text-zinc-400">
                <span>• ပို့ဆောင်ရမည့်ရက်: {formatDate(po.deliveryDate)}</span>
              </span>
            )}
          </div>
        </div>

        {/* Summary: Items count & Total Amount */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 text-xs">
          <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">
            မှာယူသည့်ပစ္စည်း {itemCount} မျိုး
          </span>
          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
            {formatCurrency(totalAmount)}
          </span>
        </div>

        {/* Action Buttons Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenPrintPo(po)}
              className="h-8 px-2 text-zinc-600 dark:text-zinc-300 gap-1 hover:text-blue-600"
              title="အမှာစာ ပရင့်ထုတ်ရန်"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="text-xs">ပရင့်</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => inspectPo(po)}
              className="h-8 px-2 text-zinc-600 dark:text-zinc-300 gap-1"
              title="အသေးစိတ်ကြည့်ရန်"
            >
              <Eye className="h-3.5 w-3.5" />
              <span className="text-xs">အသေးစိတ်</span>
            </Button>
          </div>

          <div className="flex items-center gap-1.5">
            {po.status === 'DRAFT' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleConfirmPo(po.id)}
                className="h-8 px-3 text-xs text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800"
              >
                အတည်ပြုမည်
              </Button>
            )}

            {(po.status === 'CONFIRMED' || po.status === 'PARTIALLY_RECEIVED') && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleOpenCreateReceipt(po)}
                className="h-8 px-3 text-xs gap-1 bg-blue-600 hover:bg-blue-700"
              >
                <PackageCheck className="h-3.5 w-3.5" /> ကုန်လက်ခံမည်
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
                {r.warehouse?.name || `ဂိုဒေါင် #${r.warehouseId}`}
              </h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                အမှာစာရည်ညွှန်း: {r.purchaseOrder?.poNo || `PO #${r.purchaseOrderId}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 pl-9">
            <Calendar className="h-3 w-3 text-zinc-400" />
            <span>လက်ခံသည့်ရက်: {formatDate(r.receivedDate)}</span>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenPrintReceipt(r)}
              className="h-8 px-2 text-zinc-600 dark:text-zinc-300 gap-1 hover:text-emerald-600"
              title="ပစ္စည်းလက်ခံပြေစာ ပရင့်ထုတ်ရန်"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="text-xs">ပရင့်</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => inspectReceipt(r)}
              className="h-8 px-2 text-zinc-600 dark:text-zinc-300 gap-1"
              title="အသေးစိတ်ကြည့်ရန်"
            >
              <Eye className="h-3.5 w-3.5" />
              <span className="text-xs">အသေးစိတ်</span>
            </Button>
          </div>

          {r.status === 'DRAFT' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handlePostReceipt(r.id)}
              className="h-8 px-3 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> စတော့နှင့် စာရင်းသွင်းမည်
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
              အဝယ်နှင့် ကုန်လက်ခံလွှာ
            </h1>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
            အဝယ်အမှာစာများ → ကုန်ပစ္စည်းလက်ခံခြင်း → စတော့နှင့် စာရင်းချုပ် အလိုအလျောက်ချိတ်ဆက်မှု
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button variant="outline" size="sm" onClick={loadPurchasingData} className="gap-1.5 h-8 text-xs shrink-0">
            <RefreshCw className={isLoading ? 'animate-spin h-3.5 w-3.5' : 'h-3.5 w-3.5'} />
            <span className="hidden sm:inline">ပြန်လည်ရယူရန်</span>
            <span className="sm:hidden">ပြန်လည်ရယူရန်</span>
          </Button>
          <div className="hidden sm:block">
            <Button variant="primary" size="sm" onClick={() => setPoDialogOpen(true)} className="gap-1.5 h-8 text-xs">
              <Plus className="h-3.5 w-3.5" />
              <span>+ အဝယ်အမှာစာ အသစ်</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ─── TABS NAVIGATION (Scrollable M3 Segmented Bar) ─────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0">
          <TabsList className="w-max sm:w-full justify-start">
            <TabsTrigger value="orders" count={orders.length}>
              📦 အဝယ်အမှာစာများ (Purchase Orders)
            </TabsTrigger>
            <TabsTrigger value="receipts" count={receipts.length}>
              🧾 ကုန်လက်ခံလွှာများ (Goods Receipts)
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ─── TAB 1: PURCHASE ORDERS ─────────────────────────────────── */}
        <TabsContent value="orders">
          <DataTable
            data={orders}
            columns={poColumns}
            searchPlaceholder="အမှာစာအမှတ် သို့မဟုတ် ကုန်သွင်းသူဖြင့် ရှာဖွေရန်..."
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
            searchPlaceholder="လက်ခံလွှာအမှတ် သို့မဟုတ် အမှာစာအမှတ်ဖြင့် ရှာဖွေရန်..."
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
        title="အဝယ်အမှာစာ အသစ်ဖွင့်ရန်"
        maxWidth="4xl"
      >
        <form onSubmit={handleCreatePo} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="ကုန်သွင်းသူ *"
              value={poForm.supplierId}
              onChange={e => setPoForm({ ...poForm, supplierId: e.target.value })}
              required
            >
              <option value="">ကုန်သွင်းသူ ရွေးချယ်ပါ...</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>

            <Input
              type="date"
              label="မှာယူသည့်ရက်စွဲ *"
              value={poForm.orderDate}
              onChange={e => setPoForm({ ...poForm, orderDate: e.target.value })}
              required
            />

            <Input
              type="date"
              label="မျှော်မှန်းပို့ဆောင်ရက်"
              value={poForm.deliveryDate}
              onChange={e => setPoForm({ ...poForm, deliveryDate: e.target.value })}
            />
          </div>

          {/* Line items section */}
          <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                  မှာယူမည့် ပစ္စည်းများ (Order Items)
                </h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  စုစုပေါင်း ပစ္စည်း {poForm.items.length} မျိုး ထည့်သွင်းထားသည်
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addPoItem} className="h-7 text-xs gap-1">
                <Plus className="h-3.5 w-3.5" /> + ပစ္စည်းအသစ်ထည့်ရန်
              </Button>
            </div>

            <div className="space-y-2.5 max-h-[50vh] sm:max-h-72 overflow-y-auto pr-0.5">
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
                          ပစ္စည်း #{idx + 1}
                        </span>
                        {item.isFoc && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            အခမဲ့ (FOC)
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
                            title="ဖျက်သိမ်းရန်"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Product Selector */}
                    <div>
                      <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">
                        ကုန်ပစ္စည်း *
                      </label>
                      <Select
                        value={item.productId}
                        onChange={e => updatePoItem(idx, 'productId', e.target.value)}
                        required
                      >
                        <option value="">ကုန်ပစ္စည်း ရွေးချယ်ပါ...</option>
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
                          ယူနစ် *
                        </label>
                        <Select
                          value={item.uomId}
                          onChange={e => updatePoItem(idx, 'uomId', e.target.value)}
                          required
                        >
                          <option value="">ယူနစ်...</option>
                          {uoms.map(u => (
                            <option key={u.id} value={u.id}>
                              {u.symbol || u.name}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">
                          အရေအတွက် *
                        </label>
                        <Input
                          type="number"
                          step="any"
                          placeholder="အရေအတွက်"
                          value={item.qty}
                          onChange={e => updatePoItem(idx, 'qty', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">
                          နှုန်းထား (ကျပ်) *
                        </label>
                        <Input
                          type="number"
                          step="any"
                          placeholder="နှုန်းထား"
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
                        <span>အခမဲ့ပစ္စည်း (FOC Item)</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table Row View (hidden md:block) */}
              <div className="hidden md:block space-y-2">
                <div className="flex items-center gap-2 px-2 py-1 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  <div className="flex-1 min-w-[200px]">ကုန်ပစ္စည်း *</div>
                  <div className="w-28 shrink-0">ယူနစ် *</div>
                  <div className="w-24 shrink-0">အရေအတွက် *</div>
                  <div className="w-28 shrink-0">နှုန်းထား *</div>
                  <div className="w-12 shrink-0 text-center">FOC</div>
                  <div className="w-28 shrink-0 text-right">ကျသင့်ငွေ</div>
                  <div className="w-8 shrink-0"></div>
                </div>

                {poForm.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2 rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60 transition-all hover:border-zinc-300 dark:hover:border-zinc-700"
                  >
                    <div className="flex-1 min-w-[200px]">
                      <Select
                        value={item.productId}
                        onChange={e => updatePoItem(idx, 'productId', e.target.value)}
                        required
                      >
                        <option value="">ကုန်ပစ္စည်း ရွေးချယ်ပါ...</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku})
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div className="w-28 shrink-0">
                      <Select
                        value={item.uomId}
                        onChange={e => updatePoItem(idx, 'uomId', e.target.value)}
                        required
                      >
                        <option value="">ယူနစ်...</option>
                        {uoms.map(u => (
                          <option key={u.id} value={u.id}>
                            {u.symbol || u.name}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div className="w-24 shrink-0">
                      <Input
                        type="number"
                        step="any"
                        placeholder="Qty"
                        value={item.qty}
                        onChange={e => updatePoItem(idx, 'qty', e.target.value)}
                        required
                      />
                    </div>

                    <div className="w-28 shrink-0">
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

                    <div className="w-12 flex items-center justify-center shrink-0">
                      <input
                        type="checkbox"
                        checked={item.isFoc}
                        onChange={e => updatePoItem(idx, 'isFoc', e.target.checked)}
                        className="rounded border-zinc-300 h-4 w-4 text-blue-600 cursor-pointer"
                        title="အခမဲ့ (FOC)"
                      />
                    </div>

                    <div className="w-28 text-right font-semibold text-xs text-zinc-800 dark:text-zinc-200 shrink-0 font-mono">
                      {item.isFoc ? <Badge variant="secondary">FOC</Badge> : formatCurrency(item.amount)}
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removePoItem(idx)}
                      disabled={poForm.items.length === 1}
                      className="h-8 w-8 text-rose-500 hover:text-rose-700 shrink-0"
                      title="ဖျက်သိမ်းရန်"
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
                စုစုပေါင်း ကျသင့်ငွေ (Total Estimated Amount):
              </span>
              <span className="text-blue-600 dark:text-blue-400 font-mono text-sm sm:text-base">
                {formatCurrency(poTotalAmount)}
              </span>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setPoDialogOpen(false)} className="w-full sm:w-auto">
              မလုပ်တော့ပါ
            </Button>
            <Button type="submit" variant="primary" className="w-full sm:w-auto">
              အဝယ်အမှာစာ သိမ်းဆည်းမည်
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── MODAL: NEW PURCHASE RECEIPT ────────────────────────────── */}
      <Dialog
        open={receiptDialogOpen}
        onOpenChange={setReceiptDialogOpen}
        title="ကုန်လက်ခံလွှာ ဖန်တီးရန်"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateReceipt} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="လက်ခံမည့် ဂိုဒေါင် *"
              value={receiptForm.warehouseId}
              onChange={e => setReceiptForm({ ...receiptForm, warehouseId: e.target.value })}
              required
            >
              <option value="">ဂိုဒေါင် ရွေးချယ်ပါ...</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </Select>

            <Input
              type="date"
              label="လက်ခံရရှိသည့်ရက်စွဲ *"
              value={receiptForm.receivedDate}
              onChange={e => setReceiptForm({ ...receiptForm, receivedDate: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              လက်ခံမည့် ပစ္စည်းများ (Items to Receive)
            </h4>
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900">
              {receiptForm.items.map((it, idx) => {
                const prod = products.find(p => p.id === it.productId);
                const uom = uoms.find(u => u.id === it.uomId);
                return (
                  <div key={idx} className="p-3 text-xs space-y-2 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {prod?.name || `ပစ္စည်း #${it.productId}`}
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {it.isFoc ? (
                          <Badge variant="secondary" className="text-[10px]">အခမဲ့ (FOC)</Badge>
                        ) : (
                          `နှုန်းထား: ${formatCurrency(it.rate)} / ${uom?.symbol || ''}`
                        )}
                      </p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-2 pt-1 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800">
                      <label className="text-[11px] font-semibold text-zinc-500 shrink-0">လက်ခံရရှိ အရေအတွက်:</label>
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
              မလုပ်တော့ပါ
            </Button>
            <Button type="submit" variant="primary" className="w-full sm:w-auto">
              ကုန်လက်ခံလွှာ သိမ်းဆည်းမည်
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── MODAL: CANCEL PO CONFIRMATION ──────────────────────────── */}
      <Dialog open={cancelConfirmOpen} onOpenChange={setCancelConfirmOpen} title="အဝယ်အမှာစာ ဖျက်သိမ်းရန်">
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300">
            အဝယ်အမှာစာ <span className="font-bold text-zinc-900 dark:text-zinc-100">{selectedPo?.poNo}</span> ကို ဖျက်သိမ်းမည်မှာ သေချာပါသလား? ဤလုပ်ဆောင်ချက်ကို ပြန်လည်ပြင်ဆင်၍ မရပါ။
          </p>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setCancelConfirmOpen(false)} className="w-full sm:w-auto">
              မဖျက်တော့ပါ
            </Button>
            <Button type="button" variant="destructive" onClick={handleCancelPo} className="w-full sm:w-auto">
              ဖျက်သိမ်းပါ
            </Button>
          </div>
        </div>
      </Dialog>

      {/* ─── CONTEXTUAL SHEET: PURCHASE ORDER INSPECTION ─────────────── */}
      <Sheet
        open={poSheetOpen}
        onOpenChange={setPoSheetOpen}
        title={`အဝယ်အမှာစာ: ${selectedPo?.poNo || ''}`}
        description={`ကုန်သွင်းသူ: ${selectedPo?.supplier?.name || ''}`}
        footer={
          selectedPo && (
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 w-full">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenPrintPo(selectedPo)}
                  className="gap-1.5 text-xs text-blue-600 hover:text-blue-700"
                >
                  <Printer className="h-4 w-4" /> အမှာစာ ပရင့်ထုတ်မည်
                </Button>
                {selectedPo.status === 'DRAFT' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCancelConfirmOpen(true)}
                    className="text-rose-600 w-full sm:w-auto text-xs"
                  >
                    အမှာစာ ဖျက်မည်
                  </Button>
                )}
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {selectedPo.status === 'DRAFT' && (
                  <Button variant="primary" size="sm" onClick={() => handleConfirmPo(selectedPo.id)} className="w-full sm:w-auto text-xs">
                    အမှာစာ အတည်ပြုမည်
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
                    <PackageCheck className="h-4 w-4" /> ကုန်လက်ခံလွှာ ဖွင့်မည်
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
                <p className="text-[10px] font-bold uppercase text-zinc-400">အမှာစာအခြေအနေ</p>
                <div className="mt-1">
                  <StatusBadge status={selectedPo.status} />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">မှာယူသည့်ရက်စွဲ</p>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-1">{formatDate(selectedPo.orderDate)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">ကုန်သွင်းသူ ဖုန်းနံပါတ်</p>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-1">{selectedPo.supplier?.phoneNumber || '-'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">မျှော်မှန်းပို့ဆောင်ရက်</p>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-1">{formatDate(selectedPo.deliveryDate)}</p>
              </div>
            </div>

            {/* Line items list */}
            <div className="space-y-2">
              <h4 className="font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider text-xs">
                မှာယူထားသော ပစ္စည်းများ (Ordered Products)
              </h4>
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900">
                {(selectedPo.items || []).map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3">
                    <div className="min-w-0 pr-2">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{it.product?.name || `ပစ္စည်း #${it.productId}`}</p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {it.qty} {it.uom?.symbol || ''} @ {formatCurrency(it.rate)} {it.isFoc && <Badge variant="secondary" className="ml-1 text-[10px]">အခမဲ့ (FOC)</Badge>}
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
                ချိတ်ဆက်ထားသော ကုန်လက်ခံလွှာများ (Linked Goods Receipts)
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
                <p className="text-zinc-400 italic">ကုန်လက်ခံလွှာ မရှိသေးပါ။</p>
              )}
            </div>
          </div>
        )}
      </Sheet>

      {/* ─── CONTEXTUAL SHEET: GOODS RECEIPT INSPECTION ──────────────── */}
      <Sheet
        open={receiptSheetOpen}
        onOpenChange={setReceiptSheetOpen}
        title={`ကုန်လက်ခံလွှာ: ${selectedReceipt?.receiptNo || ''}`}
        description={`အဝယ်အမှာစာ ရည်ညွှန်းချက်: ${selectedReceipt?.purchaseOrder?.poNo || ''}`}
        footer={
          selectedReceipt && (
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenPrintReceipt(selectedReceipt)}
                className="gap-1.5 text-xs text-emerald-600 hover:text-emerald-700"
              >
                <Printer className="h-4 w-4" /> လက်ခံပြေစာ ပရင့်ထုတ်မည်
              </Button>
              {selectedReceipt.status === 'DRAFT' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handlePostReceipt(selectedReceipt.id)}
                  className="bg-emerald-600 hover:bg-emerald-700 gap-1.5 w-full sm:w-auto text-xs"
                >
                  <CheckCircle2 className="h-4 w-4" /> စတော့နှင့် စာရင်းချုပ် သွင်းမည်
                </Button>
              )}
            </div>
          )
        }
      >
        {selectedReceipt && (
          <div className="space-y-6 text-xs">
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 p-3.5 sm:p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">အခြေအနေ</p>
                <div className="mt-1">
                  <StatusBadge status={selectedReceipt.status} />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">လက်ခံသည့်ဂိုဒေါင်</p>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-1">{selectedReceipt.warehouse?.name}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">လက်ခံရရှိသည့်ရက်စွဲ</p>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-1">{formatDate(selectedReceipt.receivedDate)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">စာရင်းချုပ် (GL) သွင်းမှု</p>
                <p className="font-semibold text-emerald-600 mt-1">
                  {selectedReceipt.status === 'POSTED' ? '✓ စာရင်းချုပ်သွင်းပြီး (Stock DR / AP CR)' : 'မူကြမ်းအဆင့်'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider text-xs">
                လက်ခံရရှိသော ပစ္စည်းများ (Received Products)
              </h4>
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900">
                {(selectedReceipt.items || []).map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3">
                    <div className="min-w-0 pr-2">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{it.product?.name || `ပစ္စည်း #${it.productId}`}</p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {it.qty} {it.uom?.symbol || ''} @ {formatCurrency(it.rate)} {it.isFoc && <Badge variant="secondary" className="ml-1 text-[10px]">အခမဲ့ (FOC)</Badge>}
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

      {/* ─── PRINT CUSTOMIZER DIALOG ─────────────────────────────────── */}
      <Dialog
        open={printDialogOpen}
        onOpenChange={setPrintDialogOpen}
        title={printType === 'RECEIPT' ? 'ကုန်ပစ္စည်းလက်ခံပြေစာ (GRN) ပရင့်ထုတ်ရန်' : 'အဝယ်အမှာစာ (PO) ပရင့်ထုတ်ရန်'}
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          <div className="space-y-2">
            <label className="font-semibold text-zinc-700 dark:text-zinc-300">
              ပုံနှိပ်မည့် စာရွက်ပုံစံ ရွေးချယ်ပါ (Select Output Document Format)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setPrintConfig({ ...printConfig, paperSize: 'A4' })}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${printConfig.paperSize === 'A4'
                  ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200'
                  : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300'
                  }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Scale className="h-4 w-4 text-blue-600" />
                  <span>📄 A4 စာရွက် အပြည့်အစုံ (Formal Voucher)</span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  ဂိုဒေါင်သိမ်းဆည်းရန်၊ ကုန်သွင်းသူသက်သေခံနှင့် စာရင်းစစ်ဆေးရန် တရားဝင် စာရွက်စာတမ်းပုံစံ။
                </p>
              </div>

              <div
                onClick={() => setPrintConfig({ ...printConfig, paperSize: 'THERMAL_80MM' })}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${printConfig.paperSize === 'THERMAL_80MM'
                  ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                  : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300'
                  }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Receipt className="h-4 w-4 text-emerald-600" />
                  <span>🧾 80mm သာမိုစလစ် (Thermal Receipt Slip)</span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  ဂိုဒေါင်အဝင်အထွက်နှင့် ချက်ချင်းလက်ခံလွှာအတွက် ပရင်တာအသေးစားသုံး စလစ်ပြေစာ။
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={printConfig.showLetterhead}
                onChange={e => setPrintConfig({ ...printConfig, showLetterhead: e.target.checked })}
                className="rounded border-zinc-300 h-4 w-4 text-blue-600"
              />
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                လုပ်ငန်းခေါင်းစီးနှင့် လိပ်စာ ထည့်သွင်းမည် (Include Official Letterhead)
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
                စစ်ဆေးသူ/လက်ခံသူ/ပို့ဆောင်သူ လက်မှတ်များ ထည့်သွင်းမည် (Signatures & Verification)
              </span>
            </label>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setPrintDialogOpen(false)} className="w-full sm:w-auto">
              မလုပ်တော့ပါ
            </Button>
            <Button type="button" variant="primary" onClick={handleExecutePrint} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 gap-1.5">
              <Printer className="h-4 w-4" />
              <span>ပရင့်ထုတ်မည်</span>
            </Button>
          </div>
        </div>
      </Dialog>

      {/* ─── DEDICATED PRINT PAPER DOCUMENT ENGINE ───────────────────── */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-purchasing-area,
          #printable-purchasing-area * {
            visibility: visible !important;
          }
          #printable-purchasing-area {
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

      <div id="printable-purchasing-area" className="hidden">
        {printType === 'RECEIPT' && selectedPrintReceipt && (
          printConfig.paperSize === 'THERMAL_80MM' ? (
            /* 🧾 80MM THERMAL GOODS RECEIVED SLIP */
            <div className="max-w-[76mm] mx-auto text-black font-mono text-[11px] leading-tight p-1 space-y-2">
              <div className="text-center space-y-0.5 border-b border-dashed border-black pb-2">
                <h2 className="text-sm font-bold uppercase">{orgContext.tenantName || 'NAYA-ERA ERP'}</h2>
                <p className="text-[10px]">{selectedPrintReceipt.warehouse?.name || 'Central Store'}</p>
                <p className="text-[10px] uppercase font-bold mt-1">*** GOODS RECEIVED NOTE (GRN) ***</p>
                <p className="text-[9px]">GRN#: {selectedPrintReceipt.receiptNo}</p>
                <p className="text-[9px]">PO Ref: {selectedPrintReceipt.purchaseOrder?.poNo || '-'}</p>
                <p className="text-[9px]">Date: {formatDate(selectedPrintReceipt.receivedDate)}</p>
              </div>

              <div className="border-b border-dashed border-black py-1 space-y-0.5 text-[10px]">
                <p>Supplier: <span className="font-bold">{selectedPrintReceipt.purchaseOrder?.supplier?.name || 'Registered Supplier'}</span></p>
                <p>Warehouse: {selectedPrintReceipt.warehouse?.name || '-'}</p>
                <p>Status: {selectedPrintReceipt.status}</p>
              </div>

              <div className="border-b border-dashed border-black py-1 space-y-1">
                <div className="grid grid-cols-12 font-bold text-[10px] border-b border-dashed border-black pb-1">
                  <span className="col-span-7">ITEM</span>
                  <span className="col-span-2 text-right">QTY</span>
                  <span className="col-span-3 text-right">TOTAL</span>
                </div>
                {(selectedPrintReceipt.items || []).map((it, i) => (
                  <div key={i} className="grid grid-cols-12 text-[10px] py-0.5">
                    <div className="col-span-7 truncate">
                      <p className="font-bold">{it.product?.name || `Item #${it.productId}`}</p>
                      <p className="text-[9px] text-gray-700 font-normal">@{formatCurrency(it.rate)} {it.isFoc ? '(FOC)' : ''}</p>
                    </div>
                    <span className="col-span-2 text-right font-bold">{it.qty} {it.uom?.symbol || ''}</span>
                    <span className="col-span-3 text-right font-bold">{it.isFoc ? '0' : formatCurrency(it.amount)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 py-1 text-[10px]">
                <div className="flex justify-between font-bold text-xs">
                  <span>TOTAL VALUATION:</span>
                  <span>
                    {formatCurrency(
                      (selectedPrintReceipt.items || []).reduce((s, it) => s + (it.isFoc ? 0 : Number(it.amount || 0)), 0)
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-[9px]">
                  <span>Total Items Received:</span>
                  <span>{selectedPrintReceipt.items?.length || 0} SKU(s)</span>
                </div>
              </div>

              <div className="pt-3 text-[9px] space-y-4 border-t border-dashed border-black">
                <div className="space-y-3">
                  <div>
                    <p>Received by (Storekeeper):</p>
                    <p className="pt-3 border-b border-black w-32"></p>
                  </div>
                  <div>
                    <p>Supplier / Carrier Sign:</p>
                    <p className="pt-3 border-b border-black w-32"></p>
                  </div>
                </div>
                <div className="text-center text-[8px] pt-1">
                  <p>Printed: {new Date().toLocaleString()}</p>
                  <p>NAYA-ERA Industrial Warehouse System</p>
                </div>
              </div>
            </div>
          ) : (
            /* 📄 A4 FORMAL GOODS RECEIVED NOTE (GRN) */
            <div className="p-8 text-black space-y-6 max-w-4xl mx-auto font-sans">
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
                      Branch: {orgContext.branchName || 'Head Office'} • Receiving Facility: {selectedPrintReceipt.warehouse?.name}
                    </p>
                    <p className="text-[11px] text-gray-600">
                      Warehouse Logistics & Quality Control Receiving Document
                    </p>
                  </div>

                  <div className="text-right text-xs space-y-0.5">
                    <p className="font-bold font-mono text-sm">GRN NO: {selectedPrintReceipt.receiptNo}</p>
                    <p className="text-gray-600">PO Ref: {selectedPrintReceipt.purchaseOrder?.poNo || 'Direct Inward'}</p>
                    <p className="text-gray-600">Received Date: {formatDate(selectedPrintReceipt.receivedDate)}</p>
                    <p className="text-gray-600">Status: <span className="font-bold uppercase">{selectedPrintReceipt.status}</span></p>
                  </div>
                </div>
              )}

              <div className="text-center py-2 bg-gray-100 border border-gray-300 rounded">
                <h2 className="text-base font-bold uppercase tracking-wide">
                  GOODS RECEIVED NOTE (GRN) / ကုန်ပစ္စည်းလက်ခံပြေစာ
                </h2>
                <p className="text-xs text-gray-600 mt-0.5 font-medium">
                  Official Record of Material Inward & Warehouse Stock Ingestion
                </p>
              </div>

              {/* Vendor and Warehouse Details */}
              <div className="grid grid-cols-2 gap-4 text-xs p-3.5 border border-gray-300 rounded bg-gray-50">
                <div className="space-y-1">
                  <p className="font-bold uppercase text-[10px] text-gray-500">Supplier / Vendor Details</p>
                  <p className="font-bold text-sm">{selectedPrintReceipt.purchaseOrder?.supplier?.name || 'Registered Supplier'}</p>
                  <p className="text-gray-600">Contact: {selectedPrintReceipt.purchaseOrder?.supplier?.phoneNumber || '-'}</p>
                  <p className="text-gray-600">Location: {selectedPrintReceipt.purchaseOrder?.supplier?.location || '-'}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="font-bold uppercase text-[10px] text-gray-500">Receiving Destination</p>
                  <p className="font-bold text-sm">{selectedPrintReceipt.warehouse?.name || 'Main Warehouse'}</p>
                  <p className="text-gray-600">Stock Integration: {selectedPrintReceipt.status === 'POSTED' ? '✓ Post Complete (Stock + GL)' : 'Draft Note'}</p>
                  <p className="text-gray-600">Operator: {user?.name || 'Storekeeper'}</p>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider border-b border-gray-300 pb-1">
                  Received Inventory Line Items (လက်ခံရရှိသော ပစ္စည်းစာရင်းများ)
                </h3>
                <table className="w-full text-xs border border-gray-300">
                  <thead className="bg-gray-100 border-b border-gray-300 text-[10px] uppercase">
                    <tr>
                      <th className="p-2 text-left w-12">No.</th>
                      <th className="p-2 text-left">Product / SKU</th>
                      <th className="p-2 text-center">Unit</th>
                      <th className="p-2 text-right">Qty Received</th>
                      <th className="p-2 text-right">Unit Rate (MMK)</th>
                      <th className="p-2 text-right">Total Amount (MMK)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(selectedPrintReceipt.items || []).map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-bold text-center">{idx + 1}</td>
                        <td className="p-2">
                          <p className="font-semibold">{it.product?.name || `Product #${it.productId}`}</p>
                          <p className="text-[10px] text-gray-500 font-mono">{it.product?.sku || '-'}</p>
                        </td>
                        <td className="p-2 text-center text-gray-600">{it.uom?.symbol || ''}</td>
                        <td className="p-2 text-right font-mono font-bold">{formatQuantity(it.qty)}</td>
                        <td className="p-2 text-right font-mono">{it.isFoc ? '0.00 (FOC)' : formatCurrency(it.rate)}</td>
                        <td className="p-2 text-right font-mono font-bold">{it.isFoc ? '0.00' : formatCurrency(it.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-100 font-bold border-t-2 border-black">
                    <tr>
                      <td colSpan={5} className="p-2 text-right uppercase">Grand Total Valuation (စုစုပေါင်း တန်ဖိုး):</td>
                      <td className="p-2 text-right font-mono text-sm">
                        {formatCurrency(
                          (selectedPrintReceipt.items || []).reduce((s, it) => s + (it.isFoc ? 0 : Number(it.amount || 0)), 0)
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Signatures & Quality Acceptance */}
              {printConfig.showSignatures && (
                <div className="pt-8 border-t border-gray-300 mt-8 space-y-6">
                  <div className="grid grid-cols-3 gap-6 text-center text-xs">
                    <div className="space-y-8">
                      <p className="font-bold uppercase text-[10px] text-gray-600">Received By (ပစ္စည်းလက်ခံသူ Storekeeper)</p>
                      <div className="border-b border-gray-400 mx-4"></div>
                      <div>
                        <p className="font-semibold">{user?.name || 'Store Officer'}</p>
                        <p className="text-[10px] text-gray-500">Date: ____/____/202___</p>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <p className="font-bold uppercase text-[10px] text-gray-600">Inspected By (အရည်အသွေးစစ်ဆေးသူ QC)</p>
                      <div className="border-b border-gray-400 mx-4"></div>
                      <div>
                        <p className="font-semibold">Quality Inspector / Manager</p>
                        <p className="text-[10px] text-gray-500">Date: ____/____/202___</p>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <p className="font-bold uppercase text-[10px] text-gray-600">Delivered By (ကုန်ပို့သူ/ကားမောင်းသူ)</p>
                      <div className="border-b border-gray-400 mx-4"></div>
                      <div>
                        <p className="font-semibold">{selectedPrintReceipt.purchaseOrder?.supplier?.name || 'Carrier Representative'}</p>
                        <p className="text-[10px] text-gray-500">Date: ____/____/202___</p>
                      </div>
                    </div>
                  </div>

                  <div className="text-center text-[10px] text-gray-500 pt-4 border-t border-gray-200">
                    NAYA-ERA Official Enterprise ERP • System Automated Warehouse Voucher • Certified Valid
                  </div>
                </div>
              )}
            </div>
          )
        )}

        {printType === 'PO' && selectedPrintPo && (
          printConfig.paperSize === 'THERMAL_80MM' ? (
            /* 🧾 80MM THERMAL PURCHASE ORDER SLIP */
            <div className="max-w-[76mm] mx-auto text-black font-mono text-[11px] leading-tight p-1 space-y-2">
              <div className="text-center space-y-0.5 border-b border-dashed border-black pb-2">
                <h2 className="text-sm font-bold uppercase">{orgContext.tenantName || 'NAYA-ERA ERP'}</h2>
                <p className="text-[10px] uppercase font-bold mt-1">*** PURCHASE ORDER (PO) ***</p>
                <p className="text-[9px]">PO#: {selectedPrintPo.poNo}</p>
                <p className="text-[9px]">Date: {formatDate(selectedPrintPo.orderDate)}</p>
              </div>

              <div className="border-b border-dashed border-black py-1 space-y-0.5 text-[10px]">
                <p>To Supplier: <span className="font-bold">{selectedPrintPo.supplier?.name || 'Supplier'}</span></p>
                <p>Delivery Target: {formatDate(selectedPrintPo.deliveryDate) || 'Immediate'}</p>
                <p>Status: {selectedPrintPo.status}</p>
              </div>

              <div className="border-b border-dashed border-black py-1 space-y-1">
                <div className="grid grid-cols-12 font-bold text-[10px] border-b border-dashed border-black pb-1">
                  <span className="col-span-7">PRODUCT</span>
                  <span className="col-span-2 text-right">QTY</span>
                  <span className="col-span-3 text-right">TOTAL</span>
                </div>
                {(selectedPrintPo.items || []).map((it, i) => (
                  <div key={i} className="grid grid-cols-12 text-[10px] py-0.5">
                    <div className="col-span-7 truncate">
                      <p className="font-bold">{it.product?.name || `Item #${it.productId}`}</p>
                      <p className="text-[9px] text-gray-700 font-normal">@{formatCurrency(it.rate)} {it.isFoc ? '(FOC)' : ''}</p>
                    </div>
                    <span className="col-span-2 text-right font-bold">{it.qty} {it.uom?.symbol || ''}</span>
                    <span className="col-span-3 text-right font-bold">{it.isFoc ? '0' : formatCurrency(it.amount)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 py-1 text-[10px]">
                <div className="flex justify-between font-bold text-xs">
                  <span>TOTAL SPEND:</span>
                  <span>
                    {formatCurrency(
                      (selectedPrintPo.items || []).reduce((s, it) => s + (it.isFoc ? 0 : Number(it.amount || 0)), 0)
                    )}
                  </span>
                </div>
              </div>

              <div className="pt-3 text-[9px] space-y-3 border-t border-dashed border-black">
                <div>
                  <p>Authorized Purchasing Sign:</p>
                  <p className="pt-3 border-b border-black w-32"></p>
                </div>
                <div className="text-center text-[8px]">
                  <p>NAYA-ERA Cloud ERP System</p>
                </div>
              </div>
            </div>
          ) : (
            /* 📄 A4 FORMAL PURCHASE ORDER VOUCHER */
            <div className="p-8 text-black space-y-6 max-w-4xl mx-auto font-sans">
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
                      Branch: {orgContext.branchName || 'Head Office'} • Procurement Dept
                    </p>
                    <p className="text-[11px] text-gray-600">
                      Official Commercial Purchase Order Contract
                    </p>
                  </div>

                  <div className="text-right text-xs space-y-0.5">
                    <p className="font-bold font-mono text-sm">PO NUMBER: {selectedPrintPo.poNo}</p>
                    <p className="text-gray-600">Order Date: {formatDate(selectedPrintPo.orderDate)}</p>
                    <p className="text-gray-600">Delivery Target: {formatDate(selectedPrintPo.deliveryDate)}</p>
                    <p className="text-gray-600">Status: <span className="font-bold uppercase">{selectedPrintPo.status}</span></p>
                  </div>
                </div>
              )}

              <div className="text-center py-2 bg-gray-100 border border-gray-300 rounded">
                <h2 className="text-base font-bold uppercase tracking-wide">
                  PURCHASE ORDER (PO) / အဝယ်အမှာစာ
                </h2>
                <p className="text-xs text-gray-600 mt-0.5 font-medium">
                  Official Authorization for Supply of Materials & Goods
                </p>
              </div>

              {/* Vendor Details */}
              <div className="grid grid-cols-2 gap-4 text-xs p-3.5 border border-gray-300 rounded bg-gray-50">
                <div className="space-y-1">
                  <p className="font-bold uppercase text-[10px] text-gray-500">Supplier / Vendor Information</p>
                  <p className="font-bold text-sm">{selectedPrintPo.supplier?.name || 'Registered Supplier'}</p>
                  <p className="text-gray-600">Phone: {selectedPrintPo.supplier?.phoneNumber || '-'}</p>
                  <p className="text-gray-600">Location: {selectedPrintPo.supplier?.location || '-'}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="font-bold uppercase text-[10px] text-gray-500">Purchasing Organization</p>
                  <p className="font-bold text-sm">{orgContext.tenantName || 'NaYa Enterprise'}</p>
                  <p className="text-gray-600">Requested By: {user?.name || 'Procurement Officer'}</p>
                  <p className="text-gray-600">Terms: Net 30 Days / Cash on Delivery</p>
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider border-b border-gray-300 pb-1">
                  Ordered Products & Material Specifications (မှာယူသော ပစ္စည်းစာရင်း)
                </h3>
                <table className="w-full text-xs border border-gray-300">
                  <thead className="bg-gray-100 border-b border-gray-300 text-[10px] uppercase">
                    <tr>
                      <th className="p-2 text-left w-12">No.</th>
                      <th className="p-2 text-left">Product / SKU</th>
                      <th className="p-2 text-center">Unit</th>
                      <th className="p-2 text-right">Order Qty</th>
                      <th className="p-2 text-right">Agreed Rate (MMK)</th>
                      <th className="p-2 text-right">Amount (MMK)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(selectedPrintPo.items || []).map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-bold text-center">{idx + 1}</td>
                        <td className="p-2">
                          <p className="font-semibold">{it.product?.name || `Product #${it.productId}`}</p>
                          <p className="text-[10px] text-gray-500 font-mono">{it.product?.sku || '-'}</p>
                        </td>
                        <td className="p-2 text-center text-gray-600">{it.uom?.symbol || ''}</td>
                        <td className="p-2 text-right font-mono font-bold">{formatQuantity(it.qty)}</td>
                        <td className="p-2 text-right font-mono">{it.isFoc ? '0.00 (FOC)' : formatCurrency(it.rate)}</td>
                        <td className="p-2 text-right font-mono font-bold">{it.isFoc ? '0.00' : formatCurrency(it.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-100 font-bold border-t-2 border-black">
                    <tr>
                      <td colSpan={5} className="p-2 text-right uppercase">Total Procurement Amount (စုစုပေါင်း ကုန်ကျစရိတ်):</td>
                      <td className="p-2 text-right font-mono text-sm">
                        {formatCurrency(
                          (selectedPrintPo.items || []).reduce((s, it) => s + (it.isFoc ? 0 : Number(it.amount || 0)), 0)
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Signatures */}
              {printConfig.showSignatures && (
                <div className="pt-8 border-t border-gray-300 mt-8 space-y-6">
                  <div className="grid grid-cols-3 gap-6 text-center text-xs">
                    <div className="space-y-8">
                      <p className="font-bold uppercase text-[10px] text-gray-600">Prepared By (အမှာစာဖွင့်သူ)</p>
                      <div className="border-b border-gray-400 mx-4"></div>
                      <div>
                        <p className="font-semibold">{user?.name || 'Purchasing Officer'}</p>
                        <p className="text-[10px] text-gray-500">Date: ____/____/202___</p>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <p className="font-bold uppercase text-[10px] text-gray-600">Approved By (အတည်ပြုသူ)</p>
                      <div className="border-b border-gray-400 mx-4"></div>
                      <div>
                        <p className="font-semibold">Procurement Director / Seal</p>
                        <p className="text-[10px] text-gray-500">Date: ____/____/202___</p>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <p className="font-bold uppercase text-[10px] text-gray-600">Supplier Acknowledged (ကုန်သွင်းသူ)</p>
                      <div className="border-b border-gray-400 mx-4"></div>
                      <div>
                        <p className="font-semibold">{selectedPrintPo.supplier?.name || 'Authorized Signatory'}</p>
                        <p className="text-[10px] text-gray-500">Date: ____/____/202___</p>
                      </div>
                    </div>
                  </div>

                  <div className="text-center text-[10px] text-gray-500 pt-4 border-t border-gray-200">
                    NAYA-ERA Official Enterprise ERP • System Automated Purchase Order • Certified Valid
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </div>

      {/* ─── MOBILE FLOATING ACTION BUTTON (M3 Standard) ───────────── */}
      <div className="fixed bottom-6 right-6 sm:hidden z-40">
        <Button
          type="button"
          onClick={() => setPoDialogOpen(true)}
          className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl flex items-center justify-center p-0 active:scale-95 transition-transform"
          title="အဝယ်အမှာစာ အသစ်ဖွင့်ရန်"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}

