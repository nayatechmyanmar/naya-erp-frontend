'use client';

import * as React from 'react';
import {
  Factory,
  Plus,
  Play,
  CheckCircle2,
  Eye,
  Trash2,
  RefreshCw,
  Layers,
  Sparkles,
  ArrowRight,
  Package,
  Calendar,
  Warehouse as WarehouseIcon,
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
import { formatQuantity, formatDate } from '@/lib/utils';
import {
  ProductionOrder,
  BOM,
  Product,
  UOM,
  Warehouse,
} from '@/types/erp';

export default function ManufacturingPage() {
  const { orgContext } = useAuth();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = React.useState('orders');
  const [isLoading, setIsLoading] = React.useState(true);

  const [productionOrders, setProductionOrders] = React.useState<ProductionOrder[]>([]);
  const [boms, setBoms] = React.useState<BOM[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [uoms, setUoms] = React.useState<UOM[]>([]);
  const [warehouses, setWarehouses] = React.useState<Warehouse[]>([]);

  // Dialog & Sheet States
  const [bomDialogOpen, setBomDialogOpen] = React.useState(false);
  const [prodDialogOpen, setProdDialogOpen] = React.useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = React.useState(false);
  const [deleteBomConfirmOpen, setDeleteBomConfirmOpen] = React.useState(false);
  const [selectedBom, setSelectedBom] = React.useState<BOM | null>(null);
  const [selectedProd, setSelectedProd] = React.useState<ProductionOrder | null>(null);
  const [bomSheetOpen, setBomSheetOpen] = React.useState(false);
  const [prodSheetOpen, setProdSheetOpen] = React.useState(false);

  // BOM Form State
  const [bomForm, setBomForm] = React.useState({
    name: '',
    outputProductId: '',
    outputUomId: '',
    outputQty: 1,
    ingredients: [{ productId: '', uomId: '', qty: 1 }],
  });

  // Production Order Form State
  const [prodForm, setProdForm] = React.useState({
    bomId: '',
    outputProductId: '',
    outputUomId: '',
    plannedQty: 100,
    outputWarehouseId: '',
    productionDate: new Date().toISOString().split('T')[0],
  });

  // Production Complete Form State
  const [completeForm, setCompleteForm] = React.useState({
    inputWarehouseId: '',
    materials: [] as { materialId: number; actualQty: number; name?: string; uom?: string }[],
    outputs: [] as { productId: number; uomId: number; qty: number; name?: string; uom?: string }[],
  });

  const loadManufacturingData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [poRes, bomRes, prodRes, uomRes, whRes] = await Promise.all([
        apiFetch<ProductionOrder[]>('/api/manufacturing/production-orders'),
        apiFetch<BOM[]>('/api/manufacturing/boms'),
        apiFetch<Product[]>('/api/master/products'),
        apiFetch<UOM[]>('/api/master/uoms'),
        apiFetch<Warehouse[]>('/api/master/warehouses'),
      ]);

      if (poRes.success && Array.isArray(poRes.data)) setProductionOrders(poRes.data);
      if (bomRes.success && Array.isArray(bomRes.data)) setBoms(bomRes.data);
      if (prodRes.success && Array.isArray(prodRes.data)) setProducts(prodRes.data);
      if (uomRes.success && Array.isArray(uomRes.data)) setUoms(uomRes.data);
      if (whRes.success && Array.isArray(whRes.data)) setWarehouses(whRes.data);
    } catch (err: any) {
      error('Failed to load manufacturing data', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  React.useEffect(() => {
    loadManufacturingData();
  }, [loadManufacturingData]);

  // BOM Ingredient Row Operations
  const addBomIngredient = () => {
    setBomForm(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { productId: '', uomId: '', qty: 1 }],
    }));
  };

  const removeBomIngredient = (index: number) => {
    if (bomForm.ingredients.length === 1) return;
    setBomForm(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  const updateBomIngredient = (index: number, field: string, value: any) => {
    setBomForm(prev => {
      const updated = [...prev.ingredients];
      const item = { ...updated[index], [field]: value };
      if (field === 'productId') {
        const prod = products.find(p => p.id === Number(value));
        if (prod) item.uomId = String(prod.baseUomId);
      }
      updated[index] = item;
      return { ...prev, ingredients: updated };
    });
  };

  // Submit BOM
  const handleCreateBom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bomForm.name || !bomForm.outputProductId || !bomForm.outputUomId) {
      error('Please complete all required fields (အချက်အလက်များ ပြည့်စုံစွာ ဖြည့်ပါ)');
      return;
    }

    const payload = {
      name: bomForm.name,
      outputProductId: Number(bomForm.outputProductId),
      outputUomId: Number(bomForm.outputUomId),
      outputQty: Number(bomForm.outputQty),
      ingredients: bomForm.ingredients.map(it => ({
        productId: Number(it.productId),
        uomId: Number(it.uomId),
        qty: Number(it.qty),
      })),
    };

    const res = await apiFetch('/api/manufacturing/boms', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.success) {
      success('BOM Recipe Created (ကုန်ကြမ်းဖော်စပ်နည်း သိမ်းဆည်းပြီးပါပြီ)');
      setBomDialogOpen(false);
      setBomForm({
        name: '',
        outputProductId: '',
        outputUomId: '',
        outputQty: 1,
        ingredients: [{ productId: '', uomId: '', qty: 1 }],
      });
      loadManufacturingData();
    } else {
      error('Failed to create BOM', res.message);
    }
  };

  // Delete BOM
  const handleDeleteBom = async () => {
    if (!selectedBom) return;
    const res = await apiFetch(`/api/manufacturing/boms/${selectedBom.id}`, { method: 'DELETE' });
    if (res.success) {
      success('BOM Deleted', `${selectedBom.name} removed`);
      setDeleteBomConfirmOpen(false);
      setBomSheetOpen(false);
      loadManufacturingData();
    } else {
      error('Delete failed', res.message);
    }
  };

  // Open Production Modal directly from a BOM
  const launchProductionFromBom = (bom: BOM) => {
    setBomSheetOpen(false);
    setProdForm({
      bomId: String(bom.id),
      outputProductId: String(bom.outputProductId),
      outputUomId: String(bom.outputUomId),
      plannedQty: bom.outputQty,
      outputWarehouseId: warehouses[0]?.id ? String(warehouses[0].id) : '',
      productionDate: new Date().toISOString().split('T')[0],
    });
    setProdDialogOpen(true);
  };

  // Submit Production Order
  const handleCreateProdOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodForm.bomId || !prodForm.outputWarehouseId || Number(prodForm.plannedQty) <= 0) {
      error('Please select BOM, destination warehouse and planned output quantity');
      return;
    }

    const b = boms.find(item => item.id === Number(prodForm.bomId));
    if (!b) return;

    const payload = {
      bomId: Number(prodForm.bomId),
      outputProductId: b.outputProductId,
      outputUomId: b.outputUomId,
      plannedQty: Number(prodForm.plannedQty),
      outputWarehouseId: Number(prodForm.outputWarehouseId),
      productionDate: prodForm.productionDate,
      branchId: orgContext.branchId,
    };

    const res = await apiFetch('/api/manufacturing/production-orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.success) {
      success('Production Order Launched (ထုတ်လုပ်မှု အမှာစာ ဖွင့်ပြီးပါပြီ)');
      setProdDialogOpen(false);
      loadManufacturingData();
    } else {
      error('Failed to create production order', res.message);
    }
  };

  // Start Production Order (DRAFT → IN_PROGRESS)
  const handleStartProdOrder = async (id: number) => {
    const res = await apiFetch(`/api/manufacturing/production-orders/${id}/start`, { method: 'PUT' });
    if (res.success) {
      success('Production Started (ထုတ်လုပ်မှု စတင်ပါပြီ)');
      loadManufacturingData();
      if (selectedProd?.id === id) inspectProd(selectedProd);
    } else {
      error('Failed to start order', res.message);
    }
  };

  // Inspect Production Order
  const inspectProd = async (prod: ProductionOrder) => {
    const detailRes = await apiFetch<ProductionOrder>(`/api/manufacturing/production-orders/${prod.id}`);
    setSelectedProd(detailRes.success && detailRes.data ? detailRes.data : prod);
    setProdSheetOpen(true);
  };

  // Inspect BOM
  const inspectBom = async (bom: BOM) => {
    const detailRes = await apiFetch<BOM>(`/api/manufacturing/boms/${bom.id}`);
    setSelectedBom(detailRes.success && detailRes.data ? detailRes.data : bom);
    setBomSheetOpen(true);
  };

  // Open Complete Dialog
  const handleOpenCompleteDialog = async (prod: ProductionOrder) => {
    const detailRes = await apiFetch<ProductionOrder>(`/api/manufacturing/production-orders/${prod.id}`);
    const fullOrder = detailRes.success && detailRes.data ? detailRes.data : prod;
    setSelectedProd(fullOrder);

    const materials = (fullOrder.materials || []).map(m => ({
      materialId: m.id!,
      actualQty: m.plannedQty,
      name: m.product?.name || `Material #${m.productId}`,
      uom: m.uom?.symbol || '',
    }));

    const outputs = [
      {
        productId: fullOrder.outputProductId,
        uomId: fullOrder.outputUomId,
        qty: fullOrder.plannedQty,
        name: fullOrder.outputProduct?.name || `Product #${fullOrder.outputProductId}`,
        uom: fullOrder.outputUom?.symbol || '',
      },
    ];

    setCompleteForm({
      inputWarehouseId: warehouses[0]?.id ? String(warehouses[0].id) : '',
      materials,
      outputs,
    });
    setCompleteDialogOpen(true);
  };

  // Complete Production Order
  const handleCompleteProdOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProd || !completeForm.inputWarehouseId) {
      error('Please select raw material input warehouse (ကုန်ကြမ်းထုတ်ယူမည့် ကုန်လှောင်ရုံရွေးပါ)');
      return;
    }

    const payload = {
      inputWarehouseId: Number(completeForm.inputWarehouseId),
      materials: completeForm.materials.map(m => ({
        materialId: m.materialId,
        actualQty: Number(m.actualQty),
      })),
      outputs: completeForm.outputs.map(o => ({
        productId: o.productId,
        uomId: o.uomId,
        qty: Number(o.qty),
      })),
    };

    const res = await apiFetch(`/api/manufacturing/production-orders/${selectedProd.id}/complete`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    if (res.success) {
      success(
        'Production Completed & Stock Updated! (ထုတ်လုပ်မှု အောင်မြင်ပြီး စတော့စာရင်း ဖြည့်သွင်းပြီးပါပြီ)',
        'Raw materials consumed & finished goods added to warehouse stock.'
      );
      setCompleteDialogOpen(false);
      loadManufacturingData();
      if (prodSheetOpen) setProdSheetOpen(false);
    } else {
      error('Completion failed', res.message);
    }
  };

  // Production Order Columns
  const prodColumns: Column<ProductionOrder>[] = [
    { header: 'Order No', accessorKey: 'productionNo', sortable: true, className: 'font-mono font-bold text-purple-600' },
    { header: 'Output Product (ထွက်ရှိမည့်ပစ္စည်း)', cell: r => r.outputProduct?.name || `Product #${r.outputProductId}` },
    { header: 'BOM Recipe', cell: r => r.bom?.name || `BOM #${r.bomId}` },
    {
      header: 'Planned Quantity',
      cell: r => `${formatQuantity(r.plannedQty)} ${r.outputUom?.symbol || ''}`,
      sortable: true,
    },
    { header: 'Output WH', cell: r => r.outputWarehouse?.name || `WH #${r.outputWarehouseId}` },
    { header: 'Date', cell: r => formatDate(r.productionDate), sortable: true },
    { header: 'Status', cell: r => <StatusBadge status={r.status} /> },
    {
      header: 'Actions',
      className: 'text-right',
      cell: r => (
        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => inspectProd(r)}
            className="h-7 text-xs"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>

          {r.status === 'DRAFT' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStartProdOrder(r.id)}
              className="h-7 text-xs text-purple-600 gap-1 hover:bg-purple-50 dark:hover:bg-purple-950/40"
            >
              <Play className="h-3 w-3" /> Start
            </Button>
          )}

          {r.status === 'IN_PROGRESS' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenCompleteDialog(r)}
              className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle2 className="h-3 w-3" /> Complete
            </Button>
          )}
        </div>
      ),
    },
  ];

  // BOM Columns
  const bomColumns: Column<BOM>[] = [
    { header: 'ID', accessorKey: 'id', sortable: true },
    { header: 'BOM / Recipe Name (ဖော်စပ်နည်းအမည်)', accessorKey: 'name', sortable: true, className: 'font-semibold' },
    { header: 'Target Output Product', cell: r => r.outputProduct?.name || `Product #${r.outputProductId}` },
    {
      header: 'Batch Yield',
      cell: r => `${formatQuantity(r.outputQty)} ${r.outputUom?.symbol || ''}`,
    },
    {
      header: 'Ingredients (ပါဝင်သော ကုန်ကြမ်းများ)',
      cell: r => (
        <span className="text-xs text-zinc-500 font-medium">
          {(r.ingredients || []).length} components
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: r => (
        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => inspectBom(r)}
            className="h-7 text-xs"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => launchProductionFromBom(r)}
            className="h-7 text-xs gap-1 text-purple-600"
          >
            <Play className="h-3 w-3" /> Run
          </Button>
        </div>
      ),
    },
  ];

  // ─── MOBILE M3 CARDS RENDERERS ──────────────────────────────────
  const renderProdCard = (po: ProductionOrder) => {
    return (
      <div className="rounded-2xl border border-zinc-200/90 bg-white p-3.5 sm:p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-3 transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
        {/* Top Bar: Order No and Status */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2.5 py-0.5 rounded-md">
            {po.productionNo}
          </span>
          <StatusBadge status={po.status} />
        </div>

        {/* Product Identity */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 font-bold text-xs">
              <Factory className="h-3.5 w-3.5" />
            </div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
              {po.outputProduct?.name || `Product #${po.outputProductId}`}
            </h4>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 pl-9">
            <span className="truncate">Recipe: {po.bom?.name || `BOM #${po.bomId}`}</span>
            <span>• WH: {po.outputWarehouse?.name || `WH #${po.outputWarehouseId}`}</span>
          </div>
        </div>

        {/* Output & Date Summary */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 text-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-zinc-400">Planned Output</span>
            <p className="font-mono font-bold text-purple-600 dark:text-purple-400 text-sm">
              {formatQuantity(po.plannedQty)} {po.outputUom?.symbol || ''}
            </p>
          </div>

          <div className="text-right space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-zinc-400">Production Date</span>
            <p className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
              {formatDate(po.productionDate)}
            </p>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs" onClick={e => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => inspectProd(po)}
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
                onClick={() => handleStartProdOrder(po.id)}
                className="h-8 px-3 text-xs text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 gap-1"
              >
                <Play className="h-3.5 w-3.5" /> Start Production
              </Button>
            )}

            {po.status === 'IN_PROGRESS' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleOpenCompleteDialog(po)}
                className="h-8 px-3 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Complete Run
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderBomCard = (b: BOM) => {
    const componentCount = b.ingredients?.length || 0;

    return (
      <div className="rounded-2xl border border-zinc-200/90 bg-white p-3.5 sm:p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-3 transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
        {/* Top Bar: BOM ID and Components Badge */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs font-bold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-md">
            BOM #{b.id}
          </span>
          <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
            {componentCount} ingredient{componentCount !== 1 ? 's' : ''}
          </Badge>
        </div>

        {/* Recipe Title & Output */}
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
            {b.name}
          </h4>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Yield: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{b.outputProduct?.name || `Product #${b.outputProductId}`}</span>
          </p>
        </div>

        {/* Batch Yield Metric */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 text-xs">
          <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            Batch Output Yield:
          </span>
          <span className="font-bold font-mono text-purple-600 dark:text-purple-400 text-sm">
            {formatQuantity(b.outputQty)} {b.outputUom?.symbol || ''}
          </span>
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs" onClick={e => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => inspectBom(b)}
            className="h-8 px-2.5 text-zinc-600 dark:text-zinc-300 gap-1"
            title="Inspect"
          >
            <Eye className="h-3.5 w-3.5" />
            <span className="text-xs">Detail</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => launchProductionFromBom(b)}
            className="h-8 px-3 text-xs text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 gap-1"
          >
            <Play className="h-3.5 w-3.5" /> Launch Run (ထုတ်လုပ်ပါ)
          </Button>
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
            <Factory className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 shrink-0" />
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 truncate">
              Manufacturing & Production (ထုတ်လုပ်မှု လုပ်ငန်းစဉ်များ)
            </h1>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
            BOM recipes, production runs, raw material consumption & finished goods output
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button variant="outline" size="sm" onClick={loadManufacturingData} className="gap-1.5 h-8 text-xs shrink-0">
            <RefreshCw className={isLoading ? 'animate-spin h-3.5 w-3.5' : 'h-3.5 w-3.5'} />
            <span className="hidden sm:inline">Refresh (ပြန်ဖွင့်)</span>
            <span className="sm:hidden">Refresh</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setBomDialogOpen(true)} className="gap-1.5 h-8 text-xs shrink-0">
            <Layers className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">+ New BOM (ဖော်စပ်နည်းအသစ်)</span>
            <span className="sm:hidden">+ BOM</span>
          </Button>
          <div className="hidden sm:block">
            <Button variant="primary" size="sm" onClick={() => setProdDialogOpen(true)} className="gap-1.5 h-8 text-xs bg-purple-600 hover:bg-purple-700">
              <Plus className="h-3.5 w-3.5" />
              <span>+ Production Run (ထုတ်လုပ်မှုစတင်ရန်)</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ─── TABS NAVIGATION (Scrollable M3 Segmented Bar) ─────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0">
          <TabsList className="w-max sm:w-full justify-start">
            <TabsTrigger value="orders" count={productionOrders.length}>
              🏭 Production Orders (ထုတ်လုပ်မှု အမှာစာများ)
            </TabsTrigger>
            <TabsTrigger value="boms" count={boms.length}>
              📋 Bill of Materials (BOM ဖော်စပ်နည်းများ)
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ─── TAB 1: PRODUCTION ORDERS ───────────────────────────────── */}
        <TabsContent value="orders">
          <DataTable
            data={productionOrders}
            columns={prodColumns}
            searchPlaceholder="Search production orders by PROD# or output product (အမှာစာရှာရန်)..."
            searchKey="productionNo"
            isLoading={isLoading}
            renderCard={renderProdCard}
            onRowClick={r => inspectProd(r)}
          />
        </TabsContent>

        {/* ─── TAB 2: BOMS ────────────────────────────────────────────── */}
        <TabsContent value="boms">
          <DataTable
            data={boms}
            columns={bomColumns}
            searchPlaceholder="Search recipes & BOMs by name (ဖော်စပ်နည်းရှာရန်)..."
            searchKey="name"
            isLoading={isLoading}
            renderCard={renderBomCard}
            onRowClick={r => inspectBom(r)}
          />
        </TabsContent>
      </Tabs>

      {/* ─── MODAL: NEW BOM ─────────────────────────────────────────── */}
      <Dialog
        open={bomDialogOpen}
        onOpenChange={setBomDialogOpen}
        title="Create Bill of Materials (BOM ဖော်စပ်နည်းအသစ်)"
        maxWidth="xl"
      >
        <form onSubmit={handleCreateBom} className="space-y-4">
          <Input
            label="BOM Recipe Name (ဖော်စပ်နည်းအမည်) *"
            placeholder="e.g. Bean Cake 100 pcs Standard Batch"
            value={bomForm.name}
            onChange={e => setBomForm({ ...bomForm, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Output Finished Product (ထွက်ရှိမည့် အချောထည်) *"
              value={bomForm.outputProductId}
              onChange={e => {
                const pId = e.target.value;
                const prod = products.find(p => p.id === Number(pId));
                setBomForm({
                  ...bomForm,
                  outputProductId: pId,
                  outputUomId: prod ? String(prod.baseUomId) : bomForm.outputUomId,
                });
              }}
              required
            >
              <option value="">Select Finished Good...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </Select>

            <Select
              label="Output Unit (ယူနစ်) *"
              value={bomForm.outputUomId}
              onChange={e => setBomForm({ ...bomForm, outputUomId: e.target.value })}
              required
            >
              <option value="">Select Unit...</option>
              {uoms.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.symbol})
                </option>
              ))}
            </Select>

            <Input
              type="number"
              step="any"
              label="Batch Output Qty (အရေအတွက်) *"
              value={bomForm.outputQty}
              onChange={e => setBomForm({ ...bomForm, outputQty: Number(e.target.value) })}
              required
            />
          </div>

          {/* Ingredients list */}
          <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Required Ingredients (ပါဝင်သော ကုန်ကြမ်းများ)
              </h4>
              <Button type="button" variant="outline" size="sm" onClick={addBomIngredient} className="h-7 text-xs gap-1">
                <Plus className="h-3 w-3" /> Add Ingredient (ကုန်ကြမ်းထည့်ရန်)
              </Button>
            </div>

            {/* Mobile View: Cards */}
            <div className="block md:hidden space-y-2.5 max-h-64 overflow-y-auto pr-0.5">
              {bomForm.ingredients.map((it, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-zinc-200 p-3 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/80 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold font-mono text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-md">
                      Ingredient #{idx + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeBomIngredient(idx)}
                      disabled={bomForm.ingredients.length === 1}
                      className="h-7 px-2 text-rose-500 hover:text-rose-700 text-xs gap-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </Button>
                  </div>

                  <Select
                    label="Raw Material (ကုန်ကြမ်းပစ္စည်း) *"
                    value={it.productId}
                    onChange={e => updateBomIngredient(idx, 'productId', e.target.value)}
                    required
                  >
                    <option value="">Select Raw Material...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </Select>

                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      label="Unit (ယူနစ်) *"
                      value={it.uomId}
                      onChange={e => updateBomIngredient(idx, 'uomId', e.target.value)}
                      required
                    >
                      <option value="">Unit...</option>
                      {uoms.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.symbol || u.name}
                        </option>
                      ))}
                    </Select>

                    <Input
                      type="number"
                      step="any"
                      label="Quantity (အရေအတွက်) *"
                      placeholder="Qty"
                      value={it.qty}
                      onChange={e => updateBomIngredient(idx, 'qty', e.target.value)}
                      required
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Table Rows */}
            <div className="hidden md:block space-y-2 max-h-56 overflow-y-auto pr-1">
              {bomForm.ingredients.map((it, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60">
                  <div className="flex-1">
                    <Select
                      value={it.productId}
                      onChange={e => updateBomIngredient(idx, 'productId', e.target.value)}
                      required
                    >
                      <option value="">Select Raw Material...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku})
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="w-28">
                    <Select
                      value={it.uomId}
                      onChange={e => updateBomIngredient(idx, 'uomId', e.target.value)}
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
                      value={it.qty}
                      onChange={e => updateBomIngredient(idx, 'qty', e.target.value)}
                      required
                    />
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeBomIngredient(idx)}
                    disabled={bomForm.ingredients.length === 1}
                    className="h-8 w-8 text-rose-500 hover:text-rose-700 shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setBomDialogOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700">
              Save BOM Recipe (ဖော်စပ်နည်းသိမ်းရန်)
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── MODAL: NEW PRODUCTION ORDER ────────────────────────────── */}
      <Dialog
        open={prodDialogOpen}
        onOpenChange={setProdDialogOpen}
        title="Launch Production Run (ထုတ်လုပ်မှု အမှာစာသစ်)"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateProdOrder} className="space-y-4">
          <Select
            label="Bill of Materials (BOM Recipe) *"
            value={prodForm.bomId}
            onChange={e => setProdForm({ ...prodForm, bomId: e.target.value })}
            required
          >
            <option value="">Select BOM Recipe...</option>
            {boms.map(b => (
              <option key={b.id} value={b.id}>
                {b.name} (Output: {b.outputProduct?.name || b.outputProductId})
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              type="number"
              step="any"
              label="Planned Output Quantity (ထုတ်လုပ်မည့် အရေအတွက်) *"
              value={prodForm.plannedQty}
              onChange={e => setProdForm({ ...prodForm, plannedQty: Number(e.target.value) })}
              required
            />

            <Select
              label="Destination Finished Goods WH (သိမ်းဆည်းမည့် ကုန်လှောင်ရုံ) *"
              value={prodForm.outputWarehouseId}
              onChange={e => setProdForm({ ...prodForm, outputWarehouseId: e.target.value })}
              required
            >
              <option value="">Select Finished Goods WH...</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </Select>
          </div>

          <Input
            type="date"
            label="Production Date (ထုတ်လုပ်မည့် ရက်စွဲ) *"
            value={prodForm.productionDate}
            onChange={e => setProdForm({ ...prodForm, productionDate: e.target.value })}
            required
          />

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setProdDialogOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700">
              Create Production Order (အမှာစာဖွင့်ရန်)
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── MODAL: COMPLETE PRODUCTION RUN ─────────────────────────── */}
      <Dialog
        open={completeDialogOpen}
        onOpenChange={setCompleteDialogOpen}
        title="Complete Production Order (ထုတ်လုပ်မှု အပြီးသတ်ခြင်း)"
        maxWidth="xl"
      >
        <form onSubmit={handleCompleteProdOrder} className="space-y-4">
          <Select
            label="Raw Material Input Warehouse (ကုန်ကြမ်း ထုတ်ယူသည့် ကုန်လှောင်ရုံ) *"
            value={completeForm.inputWarehouseId}
            onChange={e => setCompleteForm({ ...completeForm, inputWarehouseId: e.target.value })}
            required
          >
            <option value="">Select Source WH for Raw Materials...</option>
            {warehouses.map(w => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </Select>

          {/* Consumed Materials Actuals */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Actual Materials Consumed (အမှန်တကယ် သုံးစွဲခဲ့သော ကုန်ကြမ်းများ)
            </h4>
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900">
              {completeForm.materials.map((m, idx) => (
                <div key={idx} className="p-3 text-xs space-y-2 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-zinc-900 dark:text-zinc-100 truncate">{m.name}</p>
                    <p className="text-[11px] text-zinc-500">Unit: {m.uom}</p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-2 pt-1 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800">
                    <label className="text-[11px] font-semibold text-zinc-500 shrink-0">Consumed Qty:</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="any"
                        value={m.actualQty}
                        onChange={e => {
                          const val = Number(e.target.value);
                          const updated = [...completeForm.materials];
                          updated[idx] = { ...m, actualQty: val };
                          setCompleteForm({ ...completeForm, materials: updated });
                        }}
                        className="w-24 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-1.5 text-center font-bold text-xs"
                      />
                      <span className="text-zinc-500 font-semibold">{m.uom}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Produced Output Actuals */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Actual Finished Output (အမှန်တကယ် ထွက်ရှိလာသော အချောထည်)
            </h4>
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900">
              {completeForm.outputs.map((o, idx) => (
                <div key={idx} className="p-3 text-xs space-y-2 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-zinc-900 dark:text-zinc-100 truncate">{o.name}</p>
                    <p className="text-[11px] text-zinc-500">Unit: {o.uom}</p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-2 pt-1 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800">
                    <label className="text-[11px] font-semibold text-zinc-500 shrink-0">Finished Qty:</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="any"
                        value={o.qty}
                        onChange={e => {
                          const val = Number(e.target.value);
                          const updated = [...completeForm.outputs];
                          updated[idx] = { ...o, qty: val };
                          setCompleteForm({ ...completeForm, outputs: updated });
                        }}
                        className="w-24 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-1.5 text-center font-bold text-xs"
                      />
                      <span className="text-zinc-500 font-semibold">{o.uom}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setCompleteDialogOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700">
              Complete & Update Inventory (အပြီးသတ်၍ စတော့သွင်းမည်)
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── MODAL: DELETE BOM CONFIRMATION ─────────────────────────── */}
      <Dialog open={deleteBomConfirmOpen} onOpenChange={setDeleteBomConfirmOpen} title="Delete BOM Recipe (ဖော်စပ်နည်းဖျက်ရန်)">
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300">
            Are you sure you want to delete BOM recipe <span className="font-bold text-zinc-900 dark:text-zinc-100">{selectedBom?.name}</span>?
          </p>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setDeleteBomConfirmOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteBom} className="w-full sm:w-auto">
              Delete BOM (ဖျက်မည်)
            </Button>
          </div>
        </div>
      </Dialog>

      {/* ─── CONTEXTUAL SHEET: BOM INSPECTION ───────────────────────── */}
      <Sheet
        open={bomSheetOpen}
        onOpenChange={setBomSheetOpen}
        title={selectedBom?.name || 'BOM Recipe'}
        description={`Target Output: ${selectedBom?.outputProduct?.name || ''}`}
        footer={
          selectedBom && (
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteBomConfirmOpen(true)}
                className="text-rose-600 w-full sm:w-auto text-xs"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete BOM
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => launchProductionFromBom(selectedBom)}
                className="bg-purple-600 hover:bg-purple-700 gap-1 w-full sm:w-auto text-xs"
              >
                <Play className="h-3.5 w-3.5" /> Launch Production Run
              </Button>
            </div>
          )
        }
      >
        {selectedBom && (
          <div className="space-y-6 text-xs">
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 p-3.5 sm:p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">Batch Yield Output</p>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-1 font-mono">
                  {formatQuantity(selectedBom.outputQty)} {selectedBom.outputUom?.symbol || ''}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">Finished Product</p>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-1">{selectedBom.outputProduct?.name}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider text-xs">
                Ingredients Formula (ကုန်ကြမ်း ပါဝင်မှုနှုန်းထား)
              </h4>
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900">
                {(selectedBom.ingredients || []).map((ing, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{ing.product?.name || `Material #${ing.productId}`}</span>
                    <span className="font-bold font-mono text-zinc-900 dark:text-zinc-100">
                      {formatQuantity(ing.qty)} {ing.uom?.symbol || ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Sheet>

      {/* ─── CONTEXTUAL SHEET: PRODUCTION ORDER INSPECTION ──────────── */}
      <Sheet
        open={prodSheetOpen}
        onOpenChange={setProdSheetOpen}
        title={`Production Order: ${selectedProd?.productionNo || ''}`}
        description={`Output: ${selectedProd?.outputProduct?.name || ''}`}
        footer={
          selectedProd && (
            <div className="flex justify-end gap-2 w-full">
              {selectedProd.status === 'DRAFT' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleStartProdOrder(selectedProd.id)}
                  className="bg-purple-600 hover:bg-purple-700 gap-1.5 w-full sm:w-auto text-xs"
                >
                  <Play className="h-4 w-4" /> Start Production (ထုတ်လုပ်မှုစတင်ပါ)
                </Button>
              )}
              {selectedProd.status === 'IN_PROGRESS' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setProdSheetOpen(false);
                    handleOpenCompleteDialog(selectedProd);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 gap-1.5 w-full sm:w-auto text-xs"
                >
                  <CheckCircle2 className="h-4 w-4" /> Complete Production (အပြီးသတ်ပါ)
                </Button>
              )}
            </div>
          )
        }
      >
        {selectedProd && (
          <div className="space-y-6 text-xs">
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 p-3.5 sm:p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">Order Status</p>
                <div className="mt-1">
                  <StatusBadge status={selectedProd.status} />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">Planned Output</p>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-1 font-mono">
                  {formatQuantity(selectedProd.plannedQty)} {selectedProd.outputUom?.symbol || ''}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">BOM Recipe</p>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-1">{selectedProd.bom?.name}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">Output Warehouse</p>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-1">{selectedProd.outputWarehouse?.name}</p>
              </div>
            </div>

            {/* Consumed Materials */}
            <div className="space-y-2">
              <h4 className="font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider text-xs">
                Material Consumption Breakdown (ကုန်ကြမ်း သုံးစွဲမှု အခြေအနေ)
              </h4>
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900">
                {(selectedProd.materials || []).map((m, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{m.product?.name || `Material #${m.productId}`}</span>
                    <div className="text-right font-mono">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">
                        Planned: {formatQuantity(m.plannedQty)} {m.uom?.symbol}
                      </span>
                      {m.actualQty !== undefined && m.actualQty !== null && (
                        <p className="text-[10px] text-zinc-500">
                          Actual: {formatQuantity(m.actualQty)} {m.uom?.symbol}
                        </p>
                      )}
                    </div>
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
            if (activeTab === 'boms') setBomDialogOpen(true);
            else setProdDialogOpen(true);
          }}
          className="h-14 w-14 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-xl flex items-center justify-center p-0 active:scale-95 transition-transform"
          title="Create"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
