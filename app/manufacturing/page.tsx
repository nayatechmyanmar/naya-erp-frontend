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
  const [selectedProd, setSelectedProd] = React.useState<ProductionOrder | null>(null);
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
      error('Please complete all required fields');
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
      success('BOM Created', `Added recipe for ${bomForm.name}`);
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

  // Submit Production Order
  const handleCreateProdOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodForm.bomId || !prodForm.outputWarehouseId || Number(prodForm.plannedQty) <= 0) {
      error('Please select BOM, destination warehouse and planned output quantity');
      return;
    }

    const selectedBom = boms.find(b => b.id === Number(prodForm.bomId));
    if (!selectedBom) return;

    const payload = {
      bomId: Number(prodForm.bomId),
      outputProductId: selectedBom.outputProductId,
      outputUomId: selectedBom.outputUomId,
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
      success('Production Order Created', 'Calculated required raw materials from BOM automatically');
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
      success('Production Started', `Order #${id} is now IN PROGRESS`);
      loadManufacturingData();
      if (selectedProd?.id === id) setProdSheetOpen(false);
    } else {
      error('Failed to start order', res.message);
    }
  };

  // Open Complete Dialog
  const handleOpenCompleteDialog = async (prod: ProductionOrder) => {
    // Fetch full order details to get materials and outputs
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
      error('Please select raw material input warehouse');
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
        'Production Completed!',
        'Materials consumed from warehouse & finished goods added to finished warehouse.'
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
    { header: 'Output Product', cell: r => r.outputProduct?.name || `Product #${r.outputProductId}` },
    { header: 'BOM', cell: r => r.bom?.name || `BOM #${r.bomId}` },
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
            onClick={async () => {
              const detailRes = await apiFetch<ProductionOrder>(`/api/manufacturing/production-orders/${r.id}`);
              setSelectedProd(detailRes.success && detailRes.data ? detailRes.data : r);
              setProdSheetOpen(true);
            }}
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
    { header: 'BOM / Recipe Name', accessorKey: 'name', sortable: true, className: 'font-semibold' },
    { header: 'Target Output Product', cell: r => r.outputProduct?.name || `Product #${r.outputProductId}` },
    {
      header: 'Batch Yield',
      cell: r => `${formatQuantity(r.outputQty)} ${r.outputUom?.symbol || ''}`,
    },
    {
      header: 'Ingredients',
      cell: r => (
        <span className="text-xs text-zinc-500">
          {(r.ingredients || []).length} components
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Manufacturing & Production
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Bill of Materials (BOM) recipes, production runs, raw material consumption, and finished goods stock output.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadManufacturingData} className="gap-1.5 h-8 text-xs">
            <RefreshCw className={isLoading ? 'animate-spin h-3.5 w-3.5' : 'h-3.5 w-3.5'} />
            <span>Refresh</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setBomDialogOpen(true)} className="gap-1.5 h-8 text-xs">
            <Layers className="h-3.5 w-3.5" />
            <span>+ New BOM</span>
          </Button>
          <Button variant="primary" size="sm" onClick={() => setProdDialogOpen(true)} className="gap-1.5 h-8 text-xs">
            <Plus className="h-3.5 w-3.5" />
            <span>+ Production Run</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-zinc-100 dark:bg-zinc-800">
          <TabsTrigger value="orders" count={productionOrders.length}>
            Production Orders
          </TabsTrigger>
          <TabsTrigger value="boms" count={boms.length}>
            Bill of Materials (BOM)
          </TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: PRODUCTION ORDERS ───────────────────────────────── */}
        <TabsContent value="orders">
          <DataTable
            data={productionOrders}
            columns={prodColumns}
            searchPlaceholder="Search production orders..."
            searchKey="productionNo"
            isLoading={isLoading}
            onRowClick={async r => {
              const detailRes = await apiFetch<ProductionOrder>(`/api/manufacturing/production-orders/${r.id}`);
              setSelectedProd(detailRes.success && detailRes.data ? detailRes.data : r);
              setProdSheetOpen(true);
            }}
          />
        </TabsContent>

        {/* ─── TAB 2: BOMS ────────────────────────────────────────────── */}
        <TabsContent value="boms">
          <DataTable
            data={boms}
            columns={bomColumns}
            searchPlaceholder="Search recipes & BOMs..."
            searchKey="name"
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>

      {/* ─── MODAL: NEW BOM ─────────────────────────────────────────── */}
      <Dialog open={bomDialogOpen} onOpenChange={setBomDialogOpen} title="Create Bill of Materials (BOM)" maxWidth="xl">
        <form onSubmit={handleCreateBom} className="space-y-4">
          <Input
            label="BOM Name *"
            placeholder="e.g. Bean Cake 100 pcs Standard Batch"
            value={bomForm.name}
            onChange={e => setBomForm({ ...bomForm, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Output Finished Product *"
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
              label="Output Unit *"
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
              label="Batch Output Qty *"
              value={bomForm.outputQty}
              onChange={e => setBomForm({ ...bomForm, outputQty: Number(e.target.value) })}
              required
            />
          </div>

          {/* Ingredients list */}
          <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase text-zinc-500">Required Ingredients / Raw Materials</h4>
              <Button type="button" variant="outline" size="sm" onClick={addBomIngredient} className="h-7 text-xs gap-1">
                <Plus className="h-3 w-3" /> Add Ingredient
              </Button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {bomForm.ingredients.map((it, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60">
                  <div className="flex-1">
                    <Select
                      value={it.productId}
                      onChange={e => updateBomIngredient(idx, 'productId', e.target.value)}
                      required
                    >
                      <option value="">Select Material...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku})
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="w-24">
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
                    className="h-8 w-8 text-rose-500 hover:text-rose-700"
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setBomDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save BOM Recipe
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── MODAL: NEW PRODUCTION ORDER ────────────────────────────── */}
      <Dialog open={prodDialogOpen} onOpenChange={setProdDialogOpen} title="Launch Production Run" maxWidth="lg">
        <form onSubmit={handleCreateProdOrder} className="space-y-4">
          <Select
            label="Bill of Materials (BOM) *"
            value={prodForm.bomId}
            onChange={e => setProdForm({ ...prodForm, bomId: e.target.value })}
            required
          >
            <option value="">Select BOM Recipe...</option>
            {boms.map(b => (
              <option key={b.id} value={b.id}>
                {b.name} (Outputs: {b.outputProduct?.name || b.outputProductId})
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              step="any"
              label="Planned Output Quantity *"
              value={prodForm.plannedQty}
              onChange={e => setProdForm({ ...prodForm, plannedQty: Number(e.target.value) })}
              required
            />

            <Select
              label="Destination Warehouse *"
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
            label="Production Date *"
            value={prodForm.productionDate}
            onChange={e => setProdForm({ ...prodForm, productionDate: e.target.value })}
            required
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setProdDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create Production Order
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── MODAL: COMPLETE PRODUCTION RUN ─────────────────────────── */}
      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen} title="Complete Production Order" maxWidth="xl">
        <form onSubmit={handleCompleteProdOrder} className="space-y-4">
          <Select
            label="Raw Material Input Warehouse *"
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
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase text-zinc-500">Actual Materials Consumed (Stock Out)</h4>
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-800">
              {completeForm.materials.map((m, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 text-xs">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">{m.name}</span>
                  <div className="flex items-center gap-2">
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
                      className="w-24 rounded border border-zinc-300 p-1 text-center font-bold dark:border-zinc-700"
                    />
                    <span>{m.uom}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Produced Output Actuals */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase text-zinc-500">Actual Finished Output (Stock In)</h4>
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-800">
              {completeForm.outputs.map((o, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 text-xs">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">{o.name}</span>
                  <div className="flex items-center gap-2">
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
                      className="w-24 rounded border border-zinc-300 p-1 text-center font-bold dark:border-zinc-700"
                    />
                    <span>{o.uom}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setCompleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="bg-emerald-600 hover:bg-emerald-700">
              Complete & Post Movements
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── CONTEXTUAL SHEET: PRODUCTION ORDER INSPECTION ──────────── */}
      <Sheet
        open={prodSheetOpen}
        onOpenChange={setProdSheetOpen}
        title={`Production Run ${selectedProd?.productionNo || ''}`}
        description={`Output: ${selectedProd?.outputProduct?.name || ''}`}
        footer={
          selectedProd && (
            <div className="flex justify-end gap-2 w-full">
              {selectedProd.status === 'DRAFT' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleStartProdOrder(selectedProd.id)}
                  className="bg-purple-600 hover:bg-purple-700 gap-1.5"
                >
                  <Play className="h-4 w-4" /> Start Production
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
                  className="bg-emerald-600 hover:bg-emerald-700 gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" /> Complete Production
                </Button>
              )}
            </div>
          )
        }
      >
        {selectedProd && (
          <div className="space-y-6 text-xs">
            <div className="grid grid-cols-2 gap-3 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">Status</p>
                <div className="mt-1">
                  <StatusBadge status={selectedProd.status} />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">Planned Output</p>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-1">
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
                Material Consumption Breakdown
              </h4>
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                {(selectedProd.materials || []).map((m, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3">
                    <span className="font-semibold">{m.product?.name || `Material #${m.productId}`}</span>
                    <div className="text-right">
                      <span className="font-bold">
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
    </div>
  );
}
