'use client';

import * as React from 'react';
import {
  Boxes,
  Plus,
  ArrowRightLeft,
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  ArrowUpRight,
  ArrowDownLeft,
  Warehouse as WarehouseIcon,
  Filter,
  Calendar,
  Trash2,
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
  InventoryStock,
  InventoryMovement,
  WarehouseTransfer,
  Warehouse,
  Product,
  UOM,
} from '@/types/erp';

export default function InventoryPage() {
  const { orgContext } = useAuth();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = React.useState('stock');
  const [isLoading, setIsLoading] = React.useState(true);

  const [stockList, setStockList] = React.useState<InventoryStock[]>([]);
  const [movements, setMovements] = React.useState<InventoryMovement[]>([]);
  const [transfers, setTransfers] = React.useState<WarehouseTransfer[]>([]);
  const [warehouses, setWarehouses] = React.useState<Warehouse[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [uoms, setUoms] = React.useState<UOM[]>([]);

  // Filter States
  const [warehouseFilter, setWarehouseFilter] = React.useState<string>('ALL');
  const [movementTypeFilter, setMovementTypeFilter] = React.useState<string>('ALL');

  // Dialog & Sheet States
  const [adjustDialogOpen, setAdjustDialogOpen] = React.useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = React.useState(false);
  const [selectedStock, setSelectedStock] = React.useState<InventoryStock | null>(null);
  const [selectedMovement, setSelectedMovement] = React.useState<InventoryMovement | null>(null);
  const [selectedTransfer, setSelectedTransfer] = React.useState<WarehouseTransfer | null>(null);
  const [stockSheetOpen, setStockSheetOpen] = React.useState(false);
  const [movementSheetOpen, setMovementSheetOpen] = React.useState(false);
  const [transferSheetOpen, setTransferSheetOpen] = React.useState(false);

  // Adjustment Form State
  const [adjustForm, setAdjustForm] = React.useState({
    warehouseId: '',
    productId: '',
    uomId: '',
    qty: '',
    reason: '',
  });

  // Transfer Form State
  const [transferForm, setTransferForm] = React.useState({
    fromWarehouseId: '',
    toWarehouseId: '',
    transferDate: new Date().toISOString().split('T')[0],
    items: [{ productId: '', uomId: '', qty: 1 }],
  });

  const loadInventoryData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [stkRes, movRes, trfRes, whRes, prodRes, uomRes] = await Promise.all([
        apiFetch<InventoryStock[]>('/api/inventory/inventory'),
        apiFetch<InventoryMovement[]>('/api/inventory/movements'),
        apiFetch<WarehouseTransfer[]>('/api/inventory/warehouse-transfers'),
        apiFetch<Warehouse[]>('/api/master/warehouses'),
        apiFetch<Product[]>('/api/master/products'),
        apiFetch<UOM[]>('/api/master/uoms'),
      ]);

      if (stkRes.success && Array.isArray(stkRes.data)) setStockList(stkRes.data);
      if (movRes.success && Array.isArray(movRes.data)) setMovements(movRes.data);
      if (trfRes.success && Array.isArray(trfRes.data)) setTransfers(trfRes.data);
      if (whRes.success && Array.isArray(whRes.data)) setWarehouses(whRes.data);
      if (prodRes.success && Array.isArray(prodRes.data)) setProducts(prodRes.data);
      if (uomRes.success && Array.isArray(uomRes.data)) setUoms(uomRes.data);
    } catch (err: any) {
      error('Failed to load inventory data', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  React.useEffect(() => {
    loadInventoryData();
  }, [loadInventoryData]);

  // Handle Adjustment Submit
  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustForm.warehouseId || !adjustForm.productId || !adjustForm.uomId || !adjustForm.qty) {
      error('အချက်အလက်များ ပြည့်စုံစွာ ဖြည့်သွင်းပေးပါ');
      return;
    }

    const payload = {
      warehouseId: Number(adjustForm.warehouseId),
      productId: Number(adjustForm.productId),
      uomId: Number(adjustForm.uomId),
      qty: Number(adjustForm.qty),
      reason: adjustForm.reason || undefined,
    };

    const res = await apiFetch('/api/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.success) {
      success('စတော့ ချိန်ညှိပြီးပါပြီ', `ချိန်ညှိအရေအတွက်: ${adjustForm.qty}`);
      setAdjustDialogOpen(false);
      setAdjustForm({ warehouseId: '', productId: '', uomId: '', qty: '', reason: '' });
      loadInventoryData();
    } else {
      error('စတော့ ချိန်ညှိ၍မရပါ', res.message);
    }
  };

  // Transfer Items Management
  const addTransferItem = () => {
    setTransferForm(prev => ({
      ...prev,
      items: [...prev.items, { productId: '', uomId: '', qty: 1 }],
    }));
  };

  const removeTransferItem = (index: number) => {
    if (transferForm.items.length === 1) return;
    setTransferForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateTransferItem = (index: number, field: string, value: any) => {
    setTransferForm(prev => {
      const updated = [...prev.items];
      const item = { ...updated[index], [field]: value };
      if (field === 'productId') {
        const prod = products.find(p => p.id === Number(value));
        if (prod) item.uomId = String(prod.baseUomId);
      }
      updated[index] = item;
      return { ...prev, items: updated };
    });
  };

  // Available on-hand quantity helper for source warehouse
  const getSourceOnHand = (productId: string) => {
    if (!transferForm.fromWarehouseId || !productId) return null;
    const stock = stockList.find(
      s => String(s.warehouseId) === String(transferForm.fromWarehouseId) && String(s.productId) === String(productId)
    );
    return stock ? Number(stock.onHandQty) : 0;
  };

  // Submit Warehouse Transfer (can be immediate post or draft)
  const handleCreateTransfer = async (e: React.FormEvent, autoPost: boolean = true) => {
    e.preventDefault();
    if (!transferForm.fromWarehouseId || !transferForm.toWarehouseId) {
      error('မူလဂိုဒေါင်နှင့် လက်ခံမည့်ဂိုဒေါင် နှစ်ခုစလုံးကို ရွေးချယ်ပေးပါ');
      return;
    }
    if (transferForm.fromWarehouseId === transferForm.toWarehouseId) {
      error('မူလဂိုဒေါင်နှင့် လက်ခံမည့်ဂိုဒေါင် တူညီ၍မရပါ');
      return;
    }

    const payload = {
      fromWarehouseId: Number(transferForm.fromWarehouseId),
      toWarehouseId: Number(transferForm.toWarehouseId),
      transferDate: transferForm.transferDate,
      branchId: orgContext.branchId,
      autoPost,
      items: transferForm.items.map(it => ({
        productId: Number(it.productId),
        uomId: Number(it.uomId),
        qty: Number(it.qty),
      })),
    };

    const res = await apiFetch('/api/inventory/warehouse-transfers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.success) {
      success(
        autoPost
          ? 'ကုန်လွှဲပြောင်းမှု ပြီးစီးပြီး စတော့စာရင်းများ အဆင့်မြှင့်တင်ပြီးပါပြီ'
          : 'ကုန်လွှဲပြောင်းလွှာ မူကြမ်း သိမ်းဆည်းပြီးပါပြီ'
      );
      setTransferDialogOpen(false);
      setTransferForm({
        fromWarehouseId: '',
        toWarehouseId: '',
        transferDate: new Date().toISOString().split('T')[0],
        items: [{ productId: '', uomId: '', qty: 1 }],
      });
      loadInventoryData();
      if (autoPost) setActiveTab('stock');
    } else {
      error('ကုန်လွှဲပြောင်းလွှာ ဖန်တီး၍မရပါ', res.message);
    }
  };

  // Inspect full transfer detail
  const inspectTransfer = async (t: WarehouseTransfer) => {
    const detailRes = await apiFetch<WarehouseTransfer>(`/api/inventory/warehouse-transfers/${t.id}`);
    setSelectedTransfer(detailRes.success && detailRes.data ? detailRes.data : t);
    setTransferSheetOpen(true);
  };

  // Cancel DRAFT transfer
  const handleCancelTransfer = async (transferId: number) => {
    const res = await apiFetch(`/api/inventory/warehouse-transfers/${transferId}/cancel`, { method: 'PUT' });
    if (res.success) {
      success('ကုန်လွှဲပြောင်းလွှာ ပယ်ဖျက်ပြီးပါပြီ');
      loadInventoryData();
      if (selectedTransfer?.id === transferId) setTransferSheetOpen(false);
    } else {
      error('ပယ်ဖျက်၍မရပါ', res.message);
    }
  };

  // Post Transfer (Creates Outbound and Inbound movements)
  const handlePostTransfer = async (transferId: number) => {
    const res = await apiFetch(`/api/inventory/warehouse-transfers/${transferId}/post`, { method: 'PUT' });
    if (res.success) {
      success('ကုန်လွှဲပြောင်းမှု ပြီးစီးပြီး စတော့စာရင်းများ အဆင့်မြှင့်တင်ပြီးပါပြီ');
      loadInventoryData();
      if (selectedTransfer?.id === transferId) setTransferSheetOpen(false);
    } else {
      error('လွှဲပြောင်းမှု မအောင်မြင်ပါ', res.message);
    }
  };

  // Filtered Stock & Movements
  const filteredStock = React.useMemo(() => {
    if (warehouseFilter === 'ALL') return stockList;
    return stockList.filter(s => String(s.warehouseId) === warehouseFilter);
  }, [stockList, warehouseFilter]);

  const filteredMovements = React.useMemo(() => {
    return movements.filter(m => {
      const whMatch = warehouseFilter === 'ALL' || String(m.warehouseId) === warehouseFilter;
      const typeMatch = movementTypeFilter === 'ALL' || m.movementType === movementTypeFilter;
      return whMatch && typeMatch;
    });
  }, [movements, warehouseFilter, movementTypeFilter]);

  const movementTypeMap: Record<string, { label: string; variant: 'success' | 'destructive' | 'warning' | 'info' | 'secondary' }> = {
    PURCHASE_RECEIPT: { label: 'အဝယ်ကုန်လက်ခံ', variant: 'success' },
    SALE_SHIPMENT: { label: 'အရောင်းပို့ဆောင်', variant: 'destructive' },
    PRODUCTION_CONSUMPTION: { label: 'ကုန်ကြမ်းသုံးစွဲ', variant: 'destructive' },
    PRODUCTION_OUTPUT: { label: 'အချောထည်ထွက်', variant: 'success' },
    WAREHOUSE_TRANSFER_IN: { label: 'လွှဲပြောင်းဝင်', variant: 'info' },
    WAREHOUSE_TRANSFER_OUT: { label: 'လွှဲပြောင်းထွက်', variant: 'warning' },
    STOCK_ADJUSTMENT: { label: 'စတော့ချိန်ညှိမှု', variant: 'secondary' },
  };

  // Stock Columns
  const stockColumns: Column<InventoryStock>[] = [
    {
      header: 'ကုန်ပစ္စည်းအမည် / SKU',
      cell: r => (
        <div>
          <p className="font-semibold text-zinc-900 dark:text-zinc-100">{r.product?.name || `ကုန်ပစ္စည်း #${r.productId}`}</p>
          <p className="font-mono text-[11px] text-zinc-500">{r.product?.sku}</p>
        </div>
      ),
      sortable: true,
    },
    { header: 'ဂိုဒေါင်', cell: r => r.warehouse?.name || `ဂိုဒေါင် #${r.warehouseId}` },
    {
      header: 'လက်ကျန်အရေအတွက်',
      accessorKey: 'onHandQty',
      sortable: true,
      cell: r => {
        const qty = Number(r.onHandQty);
        const isLow = qty <= 10;
        return (
          <div className="flex items-center gap-2">
            <span className={`font-bold font-mono text-sm ${isLow ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {qty.toLocaleString()} {r.product?.baseUom?.symbol || ''}
            </span>
            {isLow && (
              <Badge variant="destructive" className="text-[10px] py-0 px-1 gap-1">
                <AlertTriangle className="h-3 w-3" /> လက်ကျန်နည်း
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      header: 'လုပ်ဆောင်ချက်',
      className: 'text-right',
      cell: r => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedStock(r);
            setStockSheetOpen(true);
          }}
          className="h-7 text-xs"
          title="အသေးစိတ်ကြည့်ရန်"
        >
          <Eye className="h-3.5 w-3.5 mr-1" /> အသေးစိတ်
        </Button>
      ),
    },
  ];

  // Movements Columns
  const movementColumns: Column<InventoryMovement>[] = [
    { header: 'ရက်စွဲ', cell: r => formatDate(r.movementDate), sortable: true },
    {
      header: 'လှုပ်ရှားမှုအမျိုးအစား',
      accessorKey: 'movementType',
      cell: r => {
        const conf = movementTypeMap[r.movementType] || { label: r.movementType.replace(/_/g, ' '), variant: 'default' };
        return (
          <Badge variant={conf.variant}>
            {conf.label}
          </Badge>
        );
      },
    },
    { header: 'ကုန်ပစ္စည်း', cell: r => r.product?.name || `ကုန်ပစ္စည်း #${r.productId}` },
    { header: 'ဂိုဒေါင်', cell: r => r.warehouse?.name || `ဂိုဒေါင် #${r.warehouseId}` },
    {
      header: 'အရေအတွက်',
      cell: r => {
        const qty = Number(r.qty);
        const isPositive = qty > 0;
        return (
          <span
            className={`font-bold font-mono inline-flex items-center gap-1 ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
          >
            {isPositive ? <ArrowDownLeft className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
            {isPositive ? `+${qty}` : qty} {r.uom?.symbol || ''}
          </span>
        );
      },
    },
    { header: 'စုစုပေါင်းတန်ဖိုး', cell: r => formatCurrency(r.totalCost) },
    { header: 'မူရင်းစာရွက်စာတမ်း', cell: r => r.referenceType ? `${r.referenceType} #${r.referenceId || ''}` : '-' },
  ];

  // Transfer Columns
  const transferColumns: Column<WarehouseTransfer>[] = [
    { header: 'လွှဲပြောင်းလွှာအမှတ်', accessorKey: 'transferNo', sortable: true, className: 'font-mono font-bold text-blue-600 dark:text-blue-400' },
    { header: 'လွှဲပေးသည့်ဂိုဒေါင်', cell: r => r.fromWarehouse?.name || `ဂိုဒေါင် #${r.fromWarehouseId}` },
    { header: 'လက်ခံမည့်ဂိုဒေါင်', cell: r => r.toWarehouse?.name || `ဂိုဒေါင် #${r.toWarehouseId}` },
    {
      header: 'လွှဲပြောင်းသည့် ပစ္စည်းများ',
      cell: r => {
        const items = r.items || [];
        if (items.length === 0) return <span className="text-zinc-400 text-xs">-</span>;
        return (
          <div className="space-y-0.5 max-w-[220px]">
            {items.map((it, idx) => (
              <div key={idx} className="text-xs truncate">
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {it.product?.name || `Product #${it.productId}`}
                </span>
                <span className="font-mono text-zinc-500 ml-1">
                  ({formatQuantity(it.qty)} {it.uom?.symbol || ''})
                </span>
              </div>
            ))}
          </div>
        );
      },
    },
    { header: 'ရက်စွဲ', cell: r => formatDate(r.transferDate), sortable: true },
    { header: 'အခြေအနေ', cell: r => <StatusBadge status={r.status} /> },
    {
      header: 'လုပ်ဆောင်ချက်',
      className: 'text-right',
      cell: r => (
        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => inspectTransfer(r)}
            className="h-7 text-xs"
            title="အသေးစိတ်ကြည့်ရန်"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>

          {r.status === 'DRAFT' && (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handlePostTransfer(r.id)}
                className="h-7 text-xs gap-1 bg-blue-600 hover:bg-blue-700"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> အတည်ပြုမည်
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCancelTransfer(r.id)}
                className="h-7 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                title="ပယ်ဖျက်မည်"
              >
                ပယ်ဖျက်
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  // ─── MOBILE M3 CARDS RENDERERS ──────────────────────────────────
  const renderStockCard = (s: InventoryStock) => {
    const qty = Number(s.onHandQty);
    const isLow = qty <= 10;

    return (
      <div className="rounded-2xl border border-zinc-200/90 bg-white p-3.5 sm:p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-3 transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
        {/* Top Bar: SKU and Warehouse */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-md truncate max-w-[140px]">
            {s.product?.sku || `SKU-${s.productId}`}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-md font-medium truncate max-w-[180px]">
            <WarehouseIcon className="h-3 w-3 shrink-0 text-zinc-500" />
            <span className="truncate">{s.warehouse?.name || `ဂိုဒေါင် #${s.warehouseId}`}</span>
          </span>
        </div>

        {/* Product Identity */}
        <div>
          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
            {s.product?.name || `ကုန်ပစ္စည်း #${s.productId}`}
          </h4>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
            အမျိုးအစား: {s.product?.category?.name || 'အထွေထွေ'} • အခြေခံယူနစ်: {s.product?.baseUom?.symbol || s.product?.baseUom?.name || 'Unit'}
          </p>
        </div>

        {/* Stock Status Box */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800">
          <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            လက်ကျန်အရေအတွက်:
          </span>
          <div className="flex items-center gap-2">
            <span className={`font-bold font-mono text-base ${isLow ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {qty.toLocaleString()} {s.product?.baseUom?.symbol || ''}
            </span>
            {isLow && (
              <Badge variant="destructive" className="text-[10px] py-0 px-1.5 gap-1">
                <AlertTriangle className="h-3 w-3" /> လက်ကျန်နည်း
              </Badge>
            )}
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs" onClick={e => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedStock(s);
              setStockSheetOpen(true);
            }}
            className="h-8 px-2.5 text-zinc-600 dark:text-zinc-300 gap-1"
            title="အသေးစိတ်ကြည့်ရန်"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>အသေးစိတ်</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setAdjustForm({
                warehouseId: String(s.warehouseId),
                productId: String(s.productId),
                uomId: s.product?.baseUomId ? String(s.product.baseUomId) : '',
                qty: '',
                reason: '',
              });
              setAdjustDialogOpen(true);
            }}
            className="h-8 px-3 text-xs text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 gap-1"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>စတော့ချိန်ညှိမည်</span>
          </Button>
        </div>
      </div>
    );
  };

  const renderMovementCard = (m: InventoryMovement) => {
    const qty = Number(m.qty);
    const isPositive = qty > 0;
    const conf = movementTypeMap[m.movementType] || { label: m.movementType.replace(/_/g, ' '), variant: 'default' };

    return (
      <div className="rounded-2xl border border-zinc-200/90 bg-white p-3.5 sm:p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-2.5 transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
        {/* Top Bar: Date and Movement Type */}
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
            <Calendar className="h-3 w-3 text-zinc-400" />
            <span>{formatDate(m.movementDate)}</span>
          </span>
          <Badge variant={conf.variant} className="text-[10px] px-2 py-0.5">
            {conf.label}
          </Badge>
        </div>

        {/* Product Identity */}
        <div>
          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
            {m.product?.name || `ကုန်ပစ္စည်း #${m.productId}`}
          </h4>
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
            <WarehouseIcon className="h-3 w-3 text-zinc-400 shrink-0" />
            <span className="truncate">{m.warehouse?.name || `ဂိုဒေါင် #${m.warehouseId}`}</span>
            {m.referenceType && (
              <span className="text-zinc-400 font-mono truncate">
                • {m.referenceType} #{m.referenceId || ''}
              </span>
            )}
          </div>
        </div>

        {/* Quantity and Value Grid */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 text-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-zinc-400">အရေအတွက်</span>
            <div>
              <span
                className={`font-bold font-mono inline-flex items-center gap-1 text-sm ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}
              >
                {isPositive ? <ArrowDownLeft className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                {isPositive ? `+${qty}` : qty} {m.uom?.symbol || ''}
              </span>
            </div>
          </div>

          <div className="text-right space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-zinc-400">စုစုပေါင်းတန်ဖိုး</span>
            <p className="font-mono font-bold text-zinc-800 dark:text-zinc-200">
              {formatCurrency(m.totalCost)}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end pt-1" onClick={e => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedMovement(m);
              setMovementSheetOpen(true);
            }}
            className="h-7 px-2 text-zinc-600 dark:text-zinc-300 gap-1 text-xs"
          >
            <Eye className="h-3 w-3" /> အသေးစိတ်ကြည့်ရန်
          </Button>
        </div>
      </div>
    );
  };

  const renderTransferCard = (t: WarehouseTransfer) => {
    const itemCount = t.items?.length || 0;

    return (
      <div className="rounded-2xl border border-zinc-200/90 bg-white p-3.5 sm:p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-3 transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
        {/* Top Bar: Transfer # and Status */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-md">
            {t.transferNo}
          </span>
          <StatusBadge status={t.status} />
        </div>

        {/* Transfer Route */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 font-bold">
              <ArrowRightLeft className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                {t.fromWarehouse?.name || `ဂိုဒေါင် #${t.fromWarehouseId}`}
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                → လက်ခံမည့်ဂိုဒေါင်: {t.toWarehouse?.name || `ဂိုဒေါင် #${t.toWarehouseId}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 pl-9">
            <Calendar className="h-3 w-3 text-zinc-400" />
            <span>ရက်စွဲ: {formatDate(t.transferDate)}</span>
            <span>• ပစ္စည်း {itemCount} မျိုး</span>
          </div>

          {/* Transferred items preview */}
          {t.items && t.items.length > 0 && (
            <div className="pl-9 space-y-1">
              {t.items.slice(0, 2).map((it, idx) => (
                <p key={idx} className="text-[11px] text-zinc-700 dark:text-zinc-300 truncate">
                  • {it.product?.name || `Product #${it.productId}`} ({formatQuantity(it.qty)} {it.uom?.symbol || ''})
                </p>
              ))}
              {t.items.length > 2 && (
                <p className="text-[10px] text-zinc-400">+{t.items.length - 2} items more...</p>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs" onClick={e => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => inspectTransfer(t)}
            className="h-8 px-2.5 text-zinc-600 dark:text-zinc-300 gap-1"
            title="အသေးစိတ်ကြည့်ရန်"
          >
            <Eye className="h-3.5 w-3.5" />
            <span className="text-xs">အသေးစိတ်</span>
          </Button>

          {t.status === 'DRAFT' && (
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCancelTransfer(t.id)}
                className="h-8 px-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                ပယ်ဖျက်
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handlePostTransfer(t.id)}
                className="h-8 px-3 text-xs gap-1 bg-blue-600 hover:bg-blue-700"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> အတည်ပြုမည်
              </Button>
            </div>
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
            <Boxes className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 shrink-0" />
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 truncate">
              စတော့နှင့် သိုလှောင်ရုံ
            </h1>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
            လက်ကျန်စတော့စာရင်းများ၊ ပစ္စည်းလှုပ်ရှားမှုမှတ်တမ်းနှင့် ဂိုဒေါင်အချင်းချင်း ကုန်လွှဲပြောင်းမှုများ
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button variant="outline" size="sm" onClick={loadInventoryData} className="gap-1.5 h-8 text-xs shrink-0">
            <RefreshCw className={isLoading ? 'animate-spin h-3.5 w-3.5' : 'h-3.5 w-3.5'} />
            <span className="hidden sm:inline">ပြန်လည်ရယူရန်</span>
            <span className="sm:hidden">Refresh</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAdjustDialogOpen(true)} className="gap-1.5 h-8 text-xs shrink-0">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">စတော့ ချိန်ညှိမည်</span>
            <span className="sm:hidden">Adjust</span>
          </Button>
          <div className="hidden sm:block">
            <Button variant="primary" size="sm" onClick={() => setTransferDialogOpen(true)} className="gap-1.5 h-8 text-xs">
              <ArrowRightLeft className="h-3.5 w-3.5" />
              <span>+ ကုန်လွှဲပြောင်းလွှာ အသစ်</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ─── FILTER BAR ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 p-3 rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60 text-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 font-semibold text-zinc-700 dark:text-zinc-300 shrink-0">
            <Filter className="h-4 w-4 text-blue-600" />
            <span>ဂိုဒေါင်:</span>
          </div>
          <select
            value={warehouseFilter}
            onChange={e => setWarehouseFilter(e.target.value)}
            className="flex-1 sm:w-56 rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800"
          >
            <option value="ALL">ဂိုဒေါင် အားလုံး</option>
            {warehouses.map(w => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>

        {activeTab === 'movements' && (
          <div className="flex items-center gap-2 w-full sm:w-auto sm:border-l sm:border-zinc-200 dark:sm:border-zinc-800 sm:pl-3">
            <span className="font-semibold text-zinc-700 dark:text-zinc-300 shrink-0">လှုပ်ရှားမှု အမျိုးအစား:</span>
            <select
              value={movementTypeFilter}
              onChange={e => setMovementTypeFilter(e.target.value)}
              className="flex-1 sm:w-56 rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800"
            >
              <option value="ALL">အားလုံး</option>
              <option value="PURCHASE_RECEIPT">အဝယ်ကုန်လက်ခံ (Purchase Receipt)</option>
              <option value="SALE_SHIPMENT">အရောင်းပို့ဆောင် (Sales Shipment)</option>
              <option value="PRODUCTION_CONSUMPTION">ကုန်ကြမ်းသုံးစွဲ (Production Consumption)</option>
              <option value="PRODUCTION_OUTPUT">အချောထည်ထွက် (Production Output)</option>
              <option value="WAREHOUSE_TRANSFER_IN">ဂိုဒေါင်လွှဲပြောင်းဝင် (Transfer In)</option>
              <option value="WAREHOUSE_TRANSFER_OUT">ဂိုဒေါင်လွှဲပြောင်းထွက် (Transfer Out)</option>
              <option value="STOCK_ADJUSTMENT">စတော့ချိန်ညှိမှု (Stock Adjustment)</option>
            </select>
          </div>
        )}
      </div>

      {/* ─── TABS NAVIGATION (Scrollable M3 Segmented Bar) ─────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0">
          <TabsList className="w-max sm:w-full justify-start">
            <TabsTrigger value="stock" count={filteredStock.length}>
              📦 လက်ကျန်စတော့ (Stock On-Hand)
            </TabsTrigger>
            <TabsTrigger value="movements" count={filteredMovements.length}>
              📊 ကုန်လှုပ်ရှားမှု မှတ်တမ်း (Movement Audit)
            </TabsTrigger>
            <TabsTrigger value="transfers" count={transfers.length}>
              🔄 ဂိုဒေါင်လွှဲပြောင်းမှုများ (Transfers)
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ─── TAB 1: STOCK ON-HAND ───────────────────────────────────── */}
        <TabsContent value="stock">
          <DataTable
            data={filteredStock}
            columns={stockColumns}
            searchPlaceholder="ကုန်ပစ္စည်းအမည် သို့မဟုတ် SKU ဖြင့် ရှာဖွေရန်..."
            isLoading={isLoading}
            renderCard={renderStockCard}
            onRowClick={r => {
              setSelectedStock(r);
              setStockSheetOpen(true);
            }}
          />
        </TabsContent>

        {/* ─── TAB 2: MOVEMENTS AUDIT TRAIL ───────────────────────────── */}
        <TabsContent value="movements">
          <DataTable
            data={filteredMovements}
            columns={movementColumns}
            searchPlaceholder="ကုန်ပစ္စည်း သို့မဟုတ် လှုပ်ရှားမှုဖြင့် ရှာဖွေရန်..."
            searchKey="movementType"
            isLoading={isLoading}
            renderCard={renderMovementCard}
            onRowClick={r => {
              setSelectedMovement(r);
              setMovementSheetOpen(true);
            }}
          />
        </TabsContent>

        {/* ─── TAB 3: WAREHOUSE TRANSFERS ─────────────────────────────── */}
        <TabsContent value="transfers">
          <DataTable
            data={transfers}
            columns={transferColumns}
            searchPlaceholder="လွှဲပြောင်းလွှာအမှတ်ဖြင့် ရှာဖွေရန်..."
            searchKey="transferNo"
            isLoading={isLoading}
            renderCard={renderTransferCard}
            onRowClick={r => inspectTransfer(r)}
          />
        </TabsContent>
      </Tabs>

      {/* ─── MODAL: MANUAL STOCK ADJUSTMENT ─────────────────────────── */}
      <Dialog
        open={adjustDialogOpen}
        onOpenChange={setAdjustDialogOpen}
        title="စတော့ ချိန်ညှိရန်"
        maxWidth="lg"
      >
        <form onSubmit={handleStockAdjustment} className="space-y-4">
          <Select
            label="ဂိုဒေါင် *"
            value={adjustForm.warehouseId}
            onChange={e => setAdjustForm({ ...adjustForm, warehouseId: e.target.value })}
            required
          >
            <option value="">ဂိုဒေါင် ရွေးချယ်ပါ...</option>
            {warehouses.map(w => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </Select>

          <Select
            label="ကုန်ပစ္စည်း *"
            value={adjustForm.productId}
            onChange={e => {
              const pId = e.target.value;
              const prod = products.find(p => p.id === Number(pId));
              setAdjustForm({
                ...adjustForm,
                productId: pId,
                uomId: prod ? String(prod.baseUomId) : adjustForm.uomId,
              });
            }}
            required
          >
            <option value="">ကုန်ပစ္စည်း ရွေးချယ်ပါ...</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.sku})
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="ယူနစ် *"
              value={adjustForm.uomId}
              onChange={e => setAdjustForm({ ...adjustForm, uomId: e.target.value })}
              required
            >
              <option value="">ယူနစ် ရွေးချယ်ပါ...</option>
              {uoms.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.symbol})
                </option>
              ))}
            </Select>

            <Input
              type="number"
              step="any"
              label="ချိန်ညှိမည့် အရေအတွက် * (+ သို့မဟုတ် -)"
              placeholder="ဥပမာ 50 သို့မဟုတ် -10"
              value={adjustForm.qty}
              onChange={e => setAdjustForm({ ...adjustForm, qty: e.target.value })}
              required
            />
          </div>

          <Input
            label="အကြောင်းပြချက်"
            placeholder="ဥပမာ - စာရင်းစစ်ဆေးချိန်ညှိမှု / ပျက်စီးဆုံးရှုံးမှု"
            value={adjustForm.reason}
            onChange={e => setAdjustForm({ ...adjustForm, reason: e.target.value })}
          />

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setAdjustDialogOpen(false)} className="w-full sm:w-auto">
              မလုပ်တော့ပါ
            </Button>
            <Button type="submit" variant="primary" className="w-full sm:w-auto">
              အတည်ပြုသွင်းမည်
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── MODAL: WAREHOUSE TRANSFER ──────────────────────────────── */}
      <Dialog
        open={transferDialogOpen}
        onOpenChange={setTransferDialogOpen}
        title="ဂိုဒေါင် ကုန်လွှဲပြောင်းလွှာ ဖွင့်ရန်"
        maxWidth="4xl"
      >
        <form onSubmit={handleCreateTransfer} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="လွှဲပေးမည့် ဂိုဒေါင် *"
              value={transferForm.fromWarehouseId}
              onChange={e => setTransferForm({ ...transferForm, fromWarehouseId: e.target.value })}
              required
            >
              <option value="">မူလဂိုဒေါင် ရွေးပါ...</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </Select>

            <Select
              label="လက်ခံမည့် ဂိုဒေါင် *"
              value={transferForm.toWarehouseId}
              onChange={e => setTransferForm({ ...transferForm, toWarehouseId: e.target.value })}
              required
            >
              <option value="">လက်ခံမည့်ဂိုဒေါင် ရွေးပါ...</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </Select>

            <Input
              type="date"
              label="လွှဲပြောင်းသည့်ရက်စွဲ *"
              value={transferForm.transferDate}
              onChange={e => setTransferForm({ ...transferForm, transferDate: e.target.value })}
              required
            />
          </div>

          {/* Transfer items */}
          <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  လွှဲပြောင်းမည့် ပစ္စည်းများ (Items to Transfer)
                </h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  စုစုပေါင်း ပစ္စည်း {transferForm.items.length} မျိုး
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addTransferItem} className="h-7 text-xs gap-1">
                <Plus className="h-3 w-3" /> + ပစ္စည်းအသစ်ထည့်ရန်
              </Button>
            </div>

            {/* Mobile View: Cards */}
            <div className="block md:hidden space-y-2.5 max-h-64 overflow-y-auto pr-0.5">
              {transferForm.items.map((it, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-zinc-200 p-3 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/80 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
                      ပစ္စည်း #{idx + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTransferItem(idx)}
                      disabled={transferForm.items.length === 1}
                      className="h-7 px-2 text-rose-500 hover:text-rose-700 text-xs gap-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> ဖျက်မည်
                    </Button>
                  </div>

                  <Select
                    label="ကုန်ပစ္စည်း *"
                    value={it.productId}
                    onChange={e => updateTransferItem(idx, 'productId', e.target.value)}
                    required
                  >
                    <option value="">ကုန်ပစ္စည်း ရွေးချယ်ပါ...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </Select>

                  {it.productId && getSourceOnHand(it.productId) !== null && (
                    <p className="text-[11px] text-zinc-500 font-medium">
                      ဂိုဒေါင်လက်ကျန်: <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{getSourceOnHand(it.productId)}</span>
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      label="ယူနစ် *"
                      value={it.uomId}
                      onChange={e => updateTransferItem(idx, 'uomId', e.target.value)}
                      required
                    >
                      <option value="">ယူနစ်...</option>
                      {uoms.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.symbol || u.name}
                        </option>
                      ))}
                    </Select>

                    <Input
                      type="number"
                      step="any"
                      label="အရေအတွက် *"
                      placeholder="အရေအတွက်"
                      value={it.qty}
                      onChange={e => updateTransferItem(idx, 'qty', e.target.value)}
                      required
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Table Rows */}
            <div className="hidden md:block space-y-2 max-h-56 overflow-y-auto pr-1">
              <div className="flex items-center gap-2 px-2 py-1 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                <div className="flex-1 min-w-[200px]">ကုန်ပစ္စည်း *</div>
                <div className="w-32 shrink-0">ယူနစ် *</div>
                <div className="w-28 shrink-0">အရေအတွက် *</div>
                <div className="w-8 shrink-0"></div>
              </div>

              {transferForm.items.map((it, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60 transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
                  <div className="flex-1 min-w-[200px]">
                    <Select
                      value={it.productId}
                      onChange={e => updateTransferItem(idx, 'productId', e.target.value)}
                      required
                    >
                      <option value="">ကုန်ပစ္စည်း ရွေးချယ်ပါ...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku})
                        </option>
                      ))}
                    </Select>
                    {it.productId && getSourceOnHand(it.productId) !== null && (
                      <p className="text-[10px] text-zinc-500 font-medium mt-0.5">
                        ဂိုဒေါင်လက်ကျန်: <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{getSourceOnHand(it.productId)}</span>
                      </p>
                    )}
                  </div>

                  <div className="w-32 shrink-0">
                    <Select
                      value={it.uomId}
                      onChange={e => updateTransferItem(idx, 'uomId', e.target.value)}
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

                  <div className="w-28 shrink-0">
                    <Input
                      type="number"
                      step="any"
                      placeholder="Qty"
                      value={it.qty}
                      onChange={e => updateTransferItem(idx, 'qty', e.target.value)}
                      required
                    />
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeTransferItem(idx)}
                    disabled={transferForm.items.length === 1}
                    className="h-8 w-8 text-rose-500 hover:text-rose-700 shrink-0"
                    title="ဖျက်သိမ်းရန်"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setTransferDialogOpen(false)} className="w-full sm:w-auto">
              မလုပ်တော့ပါ
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={(e) => handleCreateTransfer(e, false)}
              className="w-full sm:w-auto text-zinc-700 dark:text-zinc-300"
            >
              မူကြမ်း သိမ်းမည် (Save Draft)
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={(e) => handleCreateTransfer(e, true)}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" /> ချက်ချင်း လွှဲပြောင်းမည် (Transfer Now)
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── CONTEXTUAL SHEET: STOCK INSPECTION ──────────────────────── */}
      <Sheet
        open={stockSheetOpen}
        onOpenChange={setStockSheetOpen}
        title={selectedStock?.product?.name || 'စတော့အသေးစိတ်'}
        description={`SKU: ${selectedStock?.product?.sku || ''} • ဂိုဒေါင်: ${selectedStock?.warehouse?.name || ''}`}
        footer={
          selectedStock && (
            <div className="flex justify-end gap-2 w-full">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setStockSheetOpen(false);
                  setAdjustForm({
                    warehouseId: String(selectedStock.warehouseId),
                    productId: String(selectedStock.productId),
                    uomId: selectedStock.product?.baseUomId ? String(selectedStock.product.baseUomId) : '',
                    qty: '',
                    reason: '',
                  });
                  setAdjustDialogOpen(true);
                }}
                className="gap-1.5 w-full sm:w-auto text-xs"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" /> စတော့ ချိန်ညှိမည်
              </Button>
            </div>
          )
        }
      >
        {selectedStock && (
          <div className="space-y-6 text-xs">
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 p-3.5 sm:p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
              <div className="col-span-2">
                <p className="text-[10px] font-bold uppercase text-zinc-400">လက်ရှိ လက်ကျန်အရေအတွက်</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {Number(selectedStock.onHandQty).toLocaleString()} {selectedStock.product?.baseUom?.symbol || ''}
                  </p>
                  {Number(selectedStock.onHandQty) <= 10 && (
                    <Badge variant="destructive" className="text-[10px] py-0 px-1.5 gap-1">
                      <AlertTriangle className="h-3 w-3" /> လက်ကျန်နည်း
                    </Badge>
                  )}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">ကုန်ပစ္စည်းကုဒ် (SKU)</p>
                <p className="font-mono font-semibold text-zinc-800 dark:text-zinc-200 mt-1">{selectedStock.product?.sku || '-'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">ဂိုဒေါင်</p>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-1">{selectedStock.warehouse?.name}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">အမျိုးအစား</p>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-1">{selectedStock.product?.category?.name || 'အထွေထွေ'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">အခြေခံယူနစ်</p>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-1">{selectedStock.product?.baseUom?.name || selectedStock.product?.baseUom?.symbol || '-'}</p>
              </div>
            </div>
          </div>
        )}
      </Sheet>

      {/* ─── CONTEXTUAL SHEET: MOVEMENT INSPECTION ──────────────────── */}
      <Sheet
        open={movementSheetOpen}
        onOpenChange={setMovementSheetOpen}
        title={selectedMovement?.product?.name || 'ကုန်လှုပ်ရှားမှု မှတ်တမ်း'}
        description={`လှုပ်ရှားမှု: ${movementTypeMap[selectedMovement?.movementType || '']?.label || selectedMovement?.movementType || ''} • ရက်စွဲ: ${formatDate(selectedMovement?.movementDate)}`}
      >
        {selectedMovement && (
          <div className="space-y-6 text-xs">
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 p-3.5 sm:p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">လှုပ်ရှားမှု အမျိုးအစား</p>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-1">{movementTypeMap[selectedMovement.movementType]?.label || selectedMovement.movementType.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">ဂိုဒေါင်</p>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-1">{selectedMovement.warehouse?.name || `ဂိုဒေါင် #${selectedMovement.warehouseId}`}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">လှုပ်ရှားမှု အရေအတွက်</p>
                <p className={`font-bold font-mono text-sm mt-1 ${Number(selectedMovement.qty) > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {Number(selectedMovement.qty) > 0 ? `+${selectedMovement.qty}` : selectedMovement.qty} {selectedMovement.uom?.symbol || ''}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">စုစုပေါင်း တန်ဖိုး</p>
                <p className="font-bold font-mono text-zinc-800 dark:text-zinc-200 mt-1">{formatCurrency(selectedMovement.totalCost)}</p>
              </div>
              {selectedMovement.referenceType && (
                <div className="col-span-2 pt-2 border-t border-zinc-200 dark:border-zinc-700">
                  <p className="text-[10px] font-bold uppercase text-zinc-400">မူရင်းစာရွက်စာတမ်း ရည်ညွှန်းချက်</p>
                  <p className="font-mono font-semibold text-blue-600 dark:text-blue-400 mt-1">
                    {selectedMovement.referenceType} #{selectedMovement.referenceId || ''}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </Sheet>

      {/* ─── CONTEXTUAL SHEET: TRANSFER INSPECTION ───────────────────── */}
      <Sheet
        open={transferSheetOpen}
        onOpenChange={setTransferSheetOpen}
        title={`လွှဲပြောင်းလွှာ: ${selectedTransfer?.transferNo || ''}`}
        description={`လွှဲပေးသည့်ဂိုဒေါင်: ${selectedTransfer?.fromWarehouse?.name || ''} → လက်ခံမည့်ဂိုဒေါင်: ${selectedTransfer?.toWarehouse?.name || ''}`}
        footer={
          selectedTransfer && (
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 w-full">
              {selectedTransfer.status === 'DRAFT' ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCancelTransfer(selectedTransfer.id)}
                    className="text-rose-600 border-rose-300 w-full sm:w-auto text-xs hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> ပယ်ဖျက်မည်
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handlePostTransfer(selectedTransfer.id)}
                    className="bg-blue-600 hover:bg-blue-700 gap-1.5 w-full sm:w-auto text-xs"
                  >
                    <CheckCircle2 className="h-4 w-4" /> လွှဲပြောင်းအတည်ပြုမည်
                  </Button>
                </>
              ) : selectedTransfer.status === 'POSTED' ? (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 py-1">
                  <CheckCircle2 className="h-4 w-4" /> လွှဲပြောင်းမှု ပြီးစီးပြီး စတော့စာရင်း ချိန်ညှိပြီးပါပြီ
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-500 py-1">
                  ပယ်ဖျက်ထားသော လွှဲပြောင်းလွှာ ဖြစ်ပါသည်
                </div>
              )}
            </div>
          )
        }
      >
        {selectedTransfer && (
          <div className="space-y-6 text-xs">
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 p-3.5 sm:p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">အခြေအနေ</p>
                <div className="mt-1">
                  <StatusBadge status={selectedTransfer.status} />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">လွှဲပြောင်းသည့်ရက်စွဲ</p>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-1">{formatDate(selectedTransfer.transferDate)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider text-xs">
                လွှဲပြောင်းသည့် ပစ္စည်းစာရင်း (Transfer Items)
              </h4>
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900">
                {(selectedTransfer.items || []).map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3">
                    <div>
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">{it.product?.name || `ကုန်ပစ္စည်း #${it.productId}`}</p>
                      {it.product?.sku && <p className="text-[10px] text-zinc-400 font-mono">{it.product.sku}</p>}
                    </div>
                    <span className="font-bold font-mono text-zinc-900 dark:text-zinc-100">{formatQuantity(it.qty)} {it.uom?.symbol || ''}</span>
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
          onClick={() => {
            if (activeTab === 'transfers') setTransferDialogOpen(true);
            else setAdjustDialogOpen(true);
          }}
          className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl flex items-center justify-center p-0 active:scale-95 transition-transform"
          title="အသစ်ထည့်ရန်"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
