'use client';

import * as React from 'react';
import {
  Boxes,
  Plus,
  ArrowRightLeft,
  SlidersHorizontal,
  History,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  ArrowUpRight,
  ArrowDownLeft,
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

  // Dialog States
  const [adjustDialogOpen, setAdjustDialogOpen] = React.useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = React.useState(false);
  const [selectedTransfer, setSelectedTransfer] = React.useState<WarehouseTransfer | null>(null);
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
      error('Please complete all required fields');
      return;
    }

    const res = await apiFetch('/api/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify({
        warehouseId: Number(adjustForm.warehouseId),
        productId: Number(adjustForm.productId),
        uomId: Number(adjustForm.uomId),
        qty: Number(adjustForm.qty),
        reason: adjustForm.reason || undefined,
      }),
    });

    if (res.success) {
      success('Stock Adjusted', `Applied quantity adjustment: ${adjustForm.qty}`);
      setAdjustDialogOpen(false);
      setAdjustForm({ warehouseId: '', productId: '', uomId: '', qty: '', reason: '' });
      loadInventoryData();
    } else {
      error('Adjustment failed', res.message);
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

  // Submit Warehouse Transfer
  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferForm.fromWarehouseId || !transferForm.toWarehouseId) {
      error('Please select both source and destination warehouses');
      return;
    }
    if (transferForm.fromWarehouseId === transferForm.toWarehouseId) {
      error('Source and destination warehouse cannot be the same');
      return;
    }

    const payload = {
      fromWarehouseId: Number(transferForm.fromWarehouseId),
      toWarehouseId: Number(transferForm.toWarehouseId),
      transferDate: transferForm.transferDate,
      branchId: orgContext.branchId,
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
      success('Transfer Order Created', 'Draft warehouse transfer created');
      setTransferDialogOpen(false);
      setTransferForm({
        fromWarehouseId: '',
        toWarehouseId: '',
        transferDate: new Date().toISOString().split('T')[0],
        items: [{ productId: '', uomId: '', qty: 1 }],
      });
      loadInventoryData();
    } else {
      error('Transfer creation failed', res.message);
    }
  };

  // Post Transfer (Creates Outbound and Inbound movements)
  const handlePostTransfer = async (transferId: number) => {
    const res = await apiFetch(`/api/inventory/warehouse-transfers/${transferId}/post`, { method: 'PUT' });
    if (res.success) {
      success('Transfer Completed', 'Outbound and inbound inventory movements generated');
      loadInventoryData();
      if (selectedTransfer?.id === transferId) setTransferSheetOpen(false);
    } else {
      error('Post transfer failed', res.message);
    }
  };

  // Stock Columns
  const stockColumns: Column<InventoryStock>[] = [
    {
      header: 'Product Name',
      cell: r => (
        <div>
          <p className="font-semibold text-zinc-900 dark:text-zinc-100">{r.product?.name || `Product #${r.productId}`}</p>
          <p className="font-mono text-[11px] text-zinc-500">{r.product?.sku}</p>
        </div>
      ),
      sortable: true,
    },
    { header: 'Warehouse', cell: r => r.warehouse?.name || `WH #${r.warehouseId}` },
    {
      header: 'On-Hand Stock',
      accessorKey: 'onHandQty',
      sortable: true,
      cell: r => {
        const qty = Number(r.onHandQty);
        const isLow = qty <= 10;
        return (
          <div className="flex items-center gap-2">
            <span className={`font-bold text-sm ${isLow ? 'text-rose-600' : 'text-emerald-600'}`}>
              {qty.toLocaleString()}
            </span>
            {isLow && (
              <Badge variant="destructive" className="text-[10px] py-0 px-1 gap-1">
                <AlertTriangle className="h-3 w-3" /> Low Stock
              </Badge>
            )}
          </div>
        );
      },
    },
  ];

  // Movements Columns
  const movementColumns: Column<InventoryMovement>[] = [
    { header: 'Date', cell: r => formatDate(r.movementDate), sortable: true },
    {
      header: 'Movement Event',
      accessorKey: 'movementType',
      cell: r => {
        const typeVariants: Record<string, 'success' | 'destructive' | 'warning' | 'info' | 'secondary'> = {
          PURCHASE_RECEIPT: 'success',
          SALE_SHIPMENT: 'destructive',
          PRODUCTION_CONSUMPTION: 'destructive',
          PRODUCTION_OUTPUT: 'success',
          TRANSFER_IN: 'info',
          TRANSFER_OUT: 'warning',
          STOCK_ADJUSTMENT: 'secondary',
        };
        return (
          <Badge variant={typeVariants[r.movementType] || 'default'}>
            {r.movementType.replace(/_/g, ' ')}
          </Badge>
        );
      },
    },
    { header: 'Product', cell: r => r.product?.name || `Product #${r.productId}` },
    { header: 'Warehouse', cell: r => r.warehouse?.name || `WH #${r.warehouseId}` },
    {
      header: 'Quantity',
      cell: r => {
        const qty = Number(r.qty);
        const isPositive = qty > 0;
        return (
          <span
            className={`font-bold inline-flex items-center gap-1 ${
              isPositive ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {isPositive ? <ArrowDownLeft className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
            {isPositive ? `+${qty}` : qty} {r.uom?.symbol || ''}
          </span>
        );
      },
    },
    { header: 'Total Value', cell: r => formatCurrency(r.totalCost) },
    { header: 'Audit Reference', cell: r => r.referenceType ? `${r.referenceType} #${r.referenceId || ''}` : '-' },
  ];

  // Transfer Columns
  const transferColumns: Column<WarehouseTransfer>[] = [
    { header: 'Transfer No', accessorKey: 'transferNo', sortable: true, className: 'font-mono font-bold text-blue-600' },
    { header: 'From Warehouse', cell: r => r.fromWarehouse?.name || `WH #${r.fromWarehouseId}` },
    { header: 'To Warehouse', cell: r => r.toWarehouse?.name || `WH #${r.toWarehouseId}` },
    { header: 'Date', cell: r => formatDate(r.transferDate), sortable: true },
    { header: 'Status', cell: r => <StatusBadge status={r.status} /> },
    {
      header: 'Actions',
      className: 'text-right',
      cell: r => (
        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedTransfer(r);
              setTransferSheetOpen(true);
            }}
            className="h-7 text-xs"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>

          {r.status === 'DRAFT' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handlePostTransfer(r.id)}
              className="h-7 text-xs gap-1 bg-blue-600 hover:bg-blue-700"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Post Transfer
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Inventory & Warehouse Stock
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Real-time multi-location on-hand balances, immutable movement audit trails, and inter-warehouse stock transfers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadInventoryData} className="gap-1.5 h-8 text-xs">
            <RefreshCw className={isLoading ? 'animate-spin h-3.5 w-3.5' : 'h-3.5 w-3.5'} />
            <span>Refresh</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAdjustDialogOpen(true)} className="gap-1.5 h-8 text-xs">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Stock Adjustment</span>
          </Button>
          <Button variant="primary" size="sm" onClick={() => setTransferDialogOpen(true)} className="gap-1.5 h-8 text-xs">
            <ArrowRightLeft className="h-3.5 w-3.5" />
            <span>+ Transfer Stock</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-zinc-100 dark:bg-zinc-800">
          <TabsTrigger value="stock" count={stockList.length}>
            Stock On-Hand
          </TabsTrigger>
          <TabsTrigger value="movements" count={movements.length}>
            Movement Audit Trail
          </TabsTrigger>
          <TabsTrigger value="transfers" count={transfers.length}>
            Warehouse Transfers
          </TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: STOCK ON-HAND ───────────────────────────────────── */}
        <TabsContent value="stock">
          <DataTable
            data={stockList}
            columns={stockColumns}
            searchPlaceholder="Search stock by product or warehouse..."
            isLoading={isLoading}
          />
        </TabsContent>

        {/* ─── TAB 2: MOVEMENTS AUDIT TRAIL ───────────────────────────── */}
        <TabsContent value="movements">
          <DataTable
            data={movements}
            columns={movementColumns}
            searchPlaceholder="Search movements by product or type..."
            searchKey="movementType"
            isLoading={isLoading}
          />
        </TabsContent>

        {/* ─── TAB 3: WAREHOUSE TRANSFERS ─────────────────────────────── */}
        <TabsContent value="transfers">
          <DataTable
            data={transfers}
            columns={transferColumns}
            searchPlaceholder="Search transfer orders..."
            searchKey="transferNo"
            isLoading={isLoading}
            onRowClick={r => {
              setSelectedTransfer(r);
              setTransferSheetOpen(true);
            }}
          />
        </TabsContent>
      </Tabs>

      {/* ─── MODAL: MANUAL STOCK ADJUSTMENT ─────────────────────────── */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen} title="Manual Stock Adjustment" maxWidth="md">
        <form onSubmit={handleStockAdjustment} className="space-y-4">
          <Select
            label="Warehouse *"
            value={adjustForm.warehouseId}
            onChange={e => setAdjustForm({ ...adjustForm, warehouseId: e.target.value })}
            required
          >
            <option value="">Select Warehouse...</option>
            {warehouses.map(w => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </Select>

          <Select
            label="Product *"
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
            <option value="">Select Product...</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.sku})
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="UOM *"
              value={adjustForm.uomId}
              onChange={e => setAdjustForm({ ...adjustForm, uomId: e.target.value })}
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
              label="Adjustment Qty * (+ or -)"
              placeholder="e.g. 50 or -10"
              value={adjustForm.qty}
              onChange={e => setAdjustForm({ ...adjustForm, qty: e.target.value })}
              required
            />
          </div>

          <Input
            label="Adjustment Reason"
            placeholder="e.g. Physical stock count reconciliation"
            value={adjustForm.reason}
            onChange={e => setAdjustForm({ ...adjustForm, reason: e.target.value })}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setAdjustDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Post Adjustment
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── MODAL: WAREHOUSE TRANSFER ──────────────────────────────── */}
      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen} title="Create Warehouse Transfer" maxWidth="xl">
        <form onSubmit={handleCreateTransfer} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="From Warehouse *"
              value={transferForm.fromWarehouseId}
              onChange={e => setTransferForm({ ...transferForm, fromWarehouseId: e.target.value })}
              required
            >
              <option value="">Source WH...</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </Select>

            <Select
              label="To Warehouse *"
              value={transferForm.toWarehouseId}
              onChange={e => setTransferForm({ ...transferForm, toWarehouseId: e.target.value })}
              required
            >
              <option value="">Destination WH...</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </Select>

            <Input
              type="date"
              label="Transfer Date *"
              value={transferForm.transferDate}
              onChange={e => setTransferForm({ ...transferForm, transferDate: e.target.value })}
              required
            />
          </div>

          {/* Transfer items */}
          <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase text-zinc-500">Items to Transfer</h4>
              <Button type="button" variant="outline" size="sm" onClick={addTransferItem} className="h-7 text-xs gap-1">
                <Plus className="h-3 w-3" /> Add Item
              </Button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {transferForm.items.map((it, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60">
                  <div className="flex-1">
                    <Select
                      value={it.productId}
                      onChange={e => updateTransferItem(idx, 'productId', e.target.value)}
                      required
                    >
                      <option value="">Select Product...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="w-24">
                    <Select
                      value={it.uomId}
                      onChange={e => updateTransferItem(idx, 'uomId', e.target.value)}
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
                    className="h-8 w-8 text-rose-500 hover:text-rose-700"
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setTransferDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Transfer
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── CONTEXTUAL SHEET: TRANSFER INSPECTION ───────────────────── */}
      <Sheet
        open={transferSheetOpen}
        onOpenChange={setTransferSheetOpen}
        title={`Transfer ${selectedTransfer?.transferNo || ''}`}
        description={`From: ${selectedTransfer?.fromWarehouse?.name || ''} → To: ${selectedTransfer?.toWarehouse?.name || ''}`}
        footer={
          selectedTransfer && selectedTransfer.status === 'DRAFT' && (
            <div className="flex justify-end gap-2 w-full">
              <Button
                variant="primary"
                size="sm"
                onClick={() => handlePostTransfer(selectedTransfer.id)}
                className="bg-blue-600 hover:bg-blue-700 gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" /> Post Transfer to Movements
              </Button>
            </div>
          )
        }
      >
        {selectedTransfer && (
          <div className="space-y-6 text-xs">
            <div className="grid grid-cols-2 gap-3 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">Status</p>
                <div className="mt-1">
                  <StatusBadge status={selectedTransfer.status} />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">Transfer Date</p>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-1">{formatDate(selectedTransfer.transferDate)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider text-xs">
                Transfer Items
              </h4>
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                {(selectedTransfer.items || []).map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3">
                    <span className="font-semibold">{it.product?.name || `Product #${it.productId}`}</span>
                    <span className="font-bold">{it.qty} {it.uom?.symbol || ''}</span>
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
