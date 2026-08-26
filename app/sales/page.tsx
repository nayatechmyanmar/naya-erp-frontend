'use client';

import * as React from 'react';
import {
  TrendingUp,
  Plus,
  Truck,
  Users,
  CheckCircle2,
  Eye,
  Trash2,
  RefreshCw,
  PackageCheck,
  Building2,
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
import { formatCurrency, formatQuantity, formatDate } from '@/lib/utils';
import {
  SalesOrder,
  SalesShipment,
  Customer,
  SaleTeam,
  Product,
  UOM,
  Warehouse,
} from '@/types/erp';

export default function SalesPage() {
  const { orgContext } = useAuth();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = React.useState('orders');
  const [isLoading, setIsLoading] = React.useState(true);

  const [salesOrders, setSalesOrders] = React.useState<SalesOrder[]>([]);
  const [shipments, setShipments] = React.useState<SalesShipment[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [saleTeams, setSaleTeams] = React.useState<SaleTeam[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [uoms, setUoms] = React.useState<UOM[]>([]);
  const [warehouses, setWarehouses] = React.useState<Warehouse[]>([]);

  // Dialog & Sheet States
  const [soDialogOpen, setSoDialogOpen] = React.useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = React.useState(false);
  const [shipmentDialogOpen, setShipmentDialogOpen] = React.useState(false);
  const [postShipmentDialogOpen, setPostShipmentDialogOpen] = React.useState(false);
  const [selectedSo, setSelectedSo] = React.useState<SalesOrder | null>(null);
  const [selectedShipment, setSelectedShipment] = React.useState<SalesShipment | null>(null);
  const [soSheetOpen, setSoSheetOpen] = React.useState(false);
  const [shipmentSheetOpen, setShipmentSheetOpen] = React.useState(false);

  // SO Form
  const [soForm, setSoForm] = React.useState({
    customerId: '',
    orderDate: new Date().toISOString().split('T')[0],
    deliveryDate: '',
    items: [{ productId: '', uomId: '', qty: 1, rate: 0, amount: 0, isFoc: false }],
  });

  // Assign Form
  const [assignForm, setAssignForm] = React.useState({
    salesOrderId: '',
    salesTeamId: '',
    assignedDate: new Date().toISOString().split('T')[0],
  });

  // Shipment Form
  const [shipmentForm, setShipmentForm] = React.useState({
    salesOrderId: '',
    salesTeamId: '',
    warehouseId: '',
    shipmentDate: new Date().toISOString().split('T')[0],
    items: [] as { salesOrderItemId: number; productId: number; uomId: number; qty: number }[],
  });

  // Post Shipment Form
  const [postWhId, setPostWhId] = React.useState('');

  const loadSalesData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [soRes, shRes, custRes, stRes, prodRes, uomRes, whRes] = await Promise.all([
        apiFetch<SalesOrder[]>('/api/sales/sales-orders'),
        apiFetch<SalesShipment[]>('/api/sales/sales-shipments'),
        apiFetch<Customer[]>('/api/master/customers'),
        apiFetch<SaleTeam[]>('/api/master/sale-teams'),
        apiFetch<Product[]>('/api/master/products'),
        apiFetch<UOM[]>('/api/master/uoms'),
        apiFetch<Warehouse[]>('/api/master/warehouses'),
      ]);

      if (soRes.success && Array.isArray(soRes.data)) setSalesOrders(soRes.data);
      if (shRes.success && Array.isArray(shRes.data)) setShipments(shRes.data);
      if (custRes.success && Array.isArray(custRes.data)) setCustomers(custRes.data);
      if (stRes.success && Array.isArray(stRes.data)) setSaleTeams(stRes.data);
      if (prodRes.success && Array.isArray(prodRes.data)) setProducts(prodRes.data);
      if (uomRes.success && Array.isArray(uomRes.data)) setUoms(uomRes.data);
      if (whRes.success && Array.isArray(whRes.data)) setWarehouses(whRes.data);
    } catch (err: any) {
      error('Failed to load sales data', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  React.useEffect(() => {
    loadSalesData();
  }, [loadSalesData]);

  // SO Item row management
  const addSoItem = () => {
    setSoForm(prev => ({
      ...prev,
      items: [...prev.items, { productId: '', uomId: '', qty: 1, rate: 0, amount: 0, isFoc: false }],
    }));
  };

  const removeSoItem = (index: number) => {
    if (soForm.items.length === 1) return;
    setSoForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateSoItem = (index: number, field: string, value: any) => {
    setSoForm(prev => {
      const updated = [...prev.items];
      const item = { ...updated[index], [field]: value };
      if (field === 'productId') {
        const prod = products.find(p => p.id === Number(value));
        if (prod) item.uomId = String(prod.baseUomId);
      }
      if (field === 'qty' || field === 'rate') {
        item.amount = Number(item.qty || 0) * Number(item.rate || 0);
      }
      updated[index] = item;
      return { ...prev, items: updated };
    });
  };

  const soTotal = soForm.items.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);

  // Submit SO
  const handleCreateSo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!soForm.customerId || soForm.items.some(i => !i.productId || !i.uomId || i.qty <= 0)) {
      error('Please select customer and valid items');
      return;
    }

    const payload = {
      customerId: Number(soForm.customerId),
      orderDate: soForm.orderDate,
      deliveryDate: soForm.deliveryDate || undefined,
      branchId: orgContext.branchId,
      items: soForm.items.map(it => ({
        productId: Number(it.productId),
        uomId: Number(it.uomId),
        qty: Number(it.qty),
        rate: Number(it.rate),
        amount: Number(it.amount),
        isFoc: it.isFoc,
      })),
    };

    const res = await apiFetch('/api/sales/sales-orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.success) {
      success('Sales Order Created');
      setSoDialogOpen(false);
      setSoForm({
        customerId: '',
        orderDate: new Date().toISOString().split('T')[0],
        deliveryDate: '',
        items: [{ productId: '', uomId: '', qty: 1, rate: 0, amount: 0, isFoc: false }],
      });
      loadSalesData();
    } else {
      error('Failed to create order', res.message);
    }
  };

  // Confirm SO
  const handleConfirmSo = async (id: number) => {
    const res = await apiFetch(`/api/sales/sales-orders/${id}/confirm`, { method: 'PUT' });
    if (res.success) {
      success('Sales Order Confirmed', `Order #${id} status is now CONFIRMED`);
      loadSalesData();
      if (selectedSo?.id === id) setSoSheetOpen(false);
    } else {
      error('Confirmation failed', res.message);
    }
  };

  // Assign SO to team
  const handleAssignSo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignForm.salesOrderId || !assignForm.salesTeamId) {
      error('Please select sales order and team');
      return;
    }

    const res = await apiFetch('/api/sales/sales-orders/assign', {
      method: 'POST',
      body: JSON.stringify({
        salesOrderId: Number(assignForm.salesOrderId),
        salesTeamId: Number(assignForm.salesTeamId),
        assignedDate: assignForm.assignedDate,
      }),
    });

    if (res.success) {
      success('Order Assigned', 'Sales order assigned to delivery team');
      setAssignDialogOpen(false);
      loadSalesData();
    } else {
      error('Assignment failed', res.message);
    }
  };

  // Open Shipment Dialog from SO
  const handleOpenCreateShipment = async (so: SalesOrder) => {
    const detailRes = await apiFetch<SalesOrder>(`/api/sales/sales-orders/${so.id}`);
    const fullOrder = detailRes.success && detailRes.data ? detailRes.data : so;
    setSelectedSo(fullOrder);

    const items = (fullOrder.items || []).map(it => ({
      salesOrderItemId: it.id!,
      productId: it.productId,
      uomId: it.uomId,
      qty: it.qty,
    }));

    setShipmentForm({
      salesOrderId: String(fullOrder.id),
      salesTeamId: saleTeams[0]?.id ? String(saleTeams[0].id) : '',
      warehouseId: warehouses[0]?.id ? String(warehouses[0].id) : '',
      shipmentDate: new Date().toISOString().split('T')[0],
      items,
    });
    setShipmentDialogOpen(true);
  };

  // Submit Shipment
  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shipmentForm.salesOrderId || !shipmentForm.warehouseId || shipmentForm.items.length === 0) {
      error('Please complete all required shipment fields');
      return;
    }

    const payload = {
      salesOrderId: Number(shipmentForm.salesOrderId),
      salesTeamId: shipmentForm.salesTeamId ? Number(shipmentForm.salesTeamId) : undefined,
      warehouseId: Number(shipmentForm.warehouseId),
      shipmentDate: shipmentForm.shipmentDate,
      branchId: orgContext.branchId,
      items: shipmentForm.items.map(it => ({
        salesOrderItemId: it.salesOrderItemId,
        productId: it.productId,
        uomId: it.uomId,
        qty: Number(it.qty),
      })),
    };

    const res = await apiFetch('/api/sales/sales-shipments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.success) {
      success('Sales Shipment Created', 'Saved draft shipment');
      setShipmentDialogOpen(false);
      loadSalesData();
    } else {
      error('Shipment creation failed', res.message);
    }
  };

  // Post Shipment (Checks stock, creates movement, posts AR / Revenue / COGS / Inventory GL entries!)
  const handleOpenPostShipmentDialog = (sh: SalesShipment) => {
    setSelectedShipment(sh);
    setPostWhId(warehouses[0]?.id ? String(warehouses[0].id) : '');
    setPostShipmentDialogOpen(true);
  };

  const handlePostShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipment || !postWhId) {
      error('Please select source warehouse');
      return;
    }

    const res = await apiFetch(`/api/sales/sales-shipments/${selectedShipment.id}/post`, {
      method: 'PUT',
      body: JSON.stringify({ warehouseId: Number(postWhId) }),
    });

    if (res.success) {
      success(
        'Shipment Posted & GL Updated!',
        'Stock deducted, AR Dr, Revenue Cr, COGS Dr, and Inventory Cr recorded.'
      );
      setPostShipmentDialogOpen(false);
      loadSalesData();
      if (shipmentSheetOpen) setShipmentSheetOpen(false);
    } else {
      error('Post failed', res.message);
    }
  };

  // SO Columns
  const soColumns: Column<SalesOrder>[] = [
    { header: 'Order No', accessorKey: 'orderNo', sortable: true, className: 'font-mono font-bold text-blue-600' },
    { header: 'Customer', cell: r => r.customer?.name || `Customer #${r.customerId}` },
    { header: 'Order Date', cell: r => formatDate(r.orderDate), sortable: true },
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
              const detailRes = await apiFetch<SalesOrder>(`/api/sales/sales-orders/${r.id}`);
              setSelectedSo(detailRes.success && detailRes.data ? detailRes.data : r);
              setSoSheetOpen(true);
            }}
            className="h-7 text-xs"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>

          {r.status === 'DRAFT' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleConfirmSo(r.id)}
              className="h-7 text-xs text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
            >
              Confirm
            </Button>
          )}

          {(r.status === 'CONFIRMED' || r.status === 'PARTIALLY_SHIPPED') && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenCreateShipment(r)}
              className="h-7 text-xs gap-1 bg-blue-600 hover:bg-blue-700"
            >
              <Truck className="h-3.5 w-3.5" /> Dispatch
            </Button>
          )}
        </div>
      ),
    },
  ];

  // Shipment Columns
  const shipmentColumns: Column<SalesShipment>[] = [
    { header: 'Shipment No', accessorKey: 'shipmentNo', sortable: true, className: 'font-mono font-bold text-emerald-600' },
    { header: 'SO Reference', cell: r => r.salesOrder?.orderNo || `SO #${r.salesOrderId}` },
    { header: 'Sales Team', cell: r => r.salesTeam?.name || '-' },
    { header: 'Shipment Date', cell: r => formatDate(r.shipmentDate), sortable: true },
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
              const detailRes = await apiFetch<SalesShipment>(`/api/sales/sales-shipments/${r.id}`);
              setSelectedShipment(detailRes.success && detailRes.data ? detailRes.data : r);
              setShipmentSheetOpen(true);
            }}
            className="h-7 text-xs"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>

          {r.status === 'DRAFT' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenPostShipmentDialog(r)}
              className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Post & GL Sync
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
            Sales & Order Fulfillment
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Customer sales lifecycle: Sales Orders → Sales Team Routing → Shipments → Auto COGS & Revenue Journals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadSalesData} className="gap-1.5 h-8 text-xs">
            <RefreshCw className={isLoading ? 'animate-spin h-3.5 w-3.5' : 'h-3.5 w-3.5'} />
            <span>Refresh</span>
          </Button>
          <Button variant="primary" size="sm" onClick={() => setSoDialogOpen(true)} className="gap-1.5 h-8 text-xs">
            <Plus className="h-3.5 w-3.5" />
            <span>+ New Sales Order</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-zinc-100 dark:bg-zinc-800">
          <TabsTrigger value="orders" count={salesOrders.length}>
            Sales Orders
          </TabsTrigger>
          <TabsTrigger value="shipments" count={shipments.length}>
            Shipments & Deliveries
          </TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: SALES ORDERS ────────────────────────────────────── */}
        <TabsContent value="orders">
          <DataTable
            data={salesOrders}
            columns={soColumns}
            searchPlaceholder="Search sales orders..."
            searchKey="orderNo"
            isLoading={isLoading}
            onRowClick={async r => {
              const detailRes = await apiFetch<SalesOrder>(`/api/sales/sales-orders/${r.id}`);
              setSelectedSo(detailRes.success && detailRes.data ? detailRes.data : r);
              setSoSheetOpen(true);
            }}
          />
        </TabsContent>

        {/* ─── TAB 2: SHIPMENTS ───────────────────────────────────────── */}
        <TabsContent value="shipments">
          <DataTable
            data={shipments}
            columns={shipmentColumns}
            searchPlaceholder="Search shipments..."
            searchKey="shipmentNo"
            isLoading={isLoading}
            onRowClick={async r => {
              const detailRes = await apiFetch<SalesShipment>(`/api/sales/sales-shipments/${r.id}`);
              setSelectedShipment(detailRes.success && detailRes.data ? detailRes.data : r);
              setShipmentSheetOpen(true);
            }}
          />
        </TabsContent>
      </Tabs>

      {/* ─── MODAL: NEW SALES ORDER ─────────────────────────────────── */}
      <Dialog open={soDialogOpen} onOpenChange={setSoDialogOpen} title="Create Sales Order" maxWidth="2xl">
        <form onSubmit={handleCreateSo} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Customer *"
              value={soForm.customerId}
              onChange={e => setSoForm({ ...soForm, customerId: e.target.value })}
              required
            >
              <option value="">Select Customer...</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>

            <Input
              type="date"
              label="Order Date *"
              value={soForm.orderDate}
              onChange={e => setSoForm({ ...soForm, orderDate: e.target.value })}
              required
            />

            <Input
              type="date"
              label="Delivery Date"
              value={soForm.deliveryDate}
              onChange={e => setSoForm({ ...soForm, deliveryDate: e.target.value })}
            />
          </div>

          {/* Line items table */}
          <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase text-zinc-500">Order Items</h4>
              <Button type="button" variant="outline" size="sm" onClick={addSoItem} className="h-7 text-xs gap-1">
                <Plus className="h-3 w-3" /> Add Item
              </Button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {soForm.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60">
                  <div className="flex-1">
                    <Select
                      value={item.productId}
                      onChange={e => updateSoItem(idx, 'productId', e.target.value)}
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
                      onChange={e => updateSoItem(idx, 'uomId', e.target.value)}
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
                      onChange={e => updateSoItem(idx, 'qty', e.target.value)}
                      required
                    />
                  </div>

                  <div className="w-24">
                    <Input
                      type="number"
                      step="any"
                      placeholder="Rate"
                      value={item.rate}
                      onChange={e => updateSoItem(idx, 'rate', e.target.value)}
                      required
                    />
                  </div>

                  <div className="w-28 text-right font-semibold text-xs text-zinc-800 dark:text-zinc-200">
                    {formatCurrency(item.amount)}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSoItem(idx)}
                    disabled={soForm.items.length === 1}
                    className="h-8 w-8 text-rose-500 hover:text-rose-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Total Footer */}
            <div className="flex justify-between items-center p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 font-bold text-sm">
              <span>Order Grand Total:</span>
              <span className="text-blue-600 dark:text-blue-400">{formatCurrency(soTotal)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setSoDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Sales Order
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── MODAL: NEW SHIPMENT ────────────────────────────────────── */}
      <Dialog open={shipmentDialogOpen} onOpenChange={setShipmentDialogOpen} title="Create Sales Dispatch" maxWidth="xl">
        <form onSubmit={handleCreateShipment} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Source Warehouse *"
              value={shipmentForm.warehouseId}
              onChange={e => setShipmentForm({ ...shipmentForm, warehouseId: e.target.value })}
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
              label="Assigned Sales Team"
              value={shipmentForm.salesTeamId}
              onChange={e => setShipmentForm({ ...shipmentForm, salesTeamId: e.target.value })}
            >
              <option value="">Select Delivery Team...</option>
              {saleTeams.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>

            <Input
              type="date"
              label="Shipment Date *"
              value={shipmentForm.shipmentDate}
              onChange={e => setShipmentForm({ ...shipmentForm, shipmentDate: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase text-zinc-500">Dispatch Items</h4>
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-800">
              {shipmentForm.items.map((it, idx) => {
                const prod = products.find(p => p.id === it.productId);
                const uom = uoms.find(u => u.id === it.uomId);
                return (
                  <div key={idx} className="flex items-center justify-between p-3 text-xs">
                    <div>
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">{prod?.name || `Item #${it.productId}`}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] text-zinc-500">Qty:</label>
                      <input
                        type="number"
                        step="any"
                        value={it.qty}
                        onChange={e => {
                          const val = Number(e.target.value);
                          const updated = [...shipmentForm.items];
                          updated[idx] = { ...it, qty: val };
                          setShipmentForm({ ...shipmentForm, items: updated });
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
            <Button type="button" variant="outline" onClick={() => setShipmentDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Shipment Draft
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── MODAL: POST SHIPMENT WAREHOUSE CONFIRM ──────────────────── */}
      <Dialog
        open={postShipmentDialogOpen}
        onOpenChange={setPostShipmentDialogOpen}
        title="Post Sales Shipment"
        maxWidth="md"
      >
        <form onSubmit={handlePostShipment} className="space-y-4">
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Posting this shipment will verify on-hand stock, deduct items from the warehouse, and create automated double-entry GL journal entries (AR, Revenue, COGS, Inventory).
          </p>

          <Select
            label="Confirm Outbound Warehouse *"
            value={postWhId}
            onChange={e => setPostWhId(e.target.value)}
            required
          >
            <option value="">Select Warehouse...</option>
            {warehouses.map(w => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </Select>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setPostShipmentDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="bg-emerald-600 hover:bg-emerald-700">
              Confirm & Post to General Ledger
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── CONTEXTUAL SHEET: SALES ORDER INSPECTION ────────────────── */}
      <Sheet
        open={soSheetOpen}
        onOpenChange={setSoSheetOpen}
        title={`Sales Order ${selectedSo?.orderNo || ''}`}
        description={`Customer: ${selectedSo?.customer?.name || ''}`}
        footer={
          selectedSo && (
            <div className="flex justify-end gap-2 w-full">
              {selectedSo.status === 'DRAFT' && (
                <Button variant="primary" size="sm" onClick={() => handleConfirmSo(selectedSo.id)}>
                  Confirm Order
                </Button>
              )}
              {(selectedSo.status === 'CONFIRMED' || selectedSo.status === 'PARTIALLY_SHIPPED') && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setSoSheetOpen(false);
                    handleOpenCreateShipment(selectedSo);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 gap-1.5"
                >
                  <Truck className="h-4 w-4" /> Create Shipment Dispatch
                </Button>
              )}
            </div>
          )
        }
      >
        {selectedSo && (
          <div className="space-y-6 text-xs">
            <div className="grid grid-cols-2 gap-3 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">Status</p>
                <div className="mt-1">
                  <StatusBadge status={selectedSo.status} />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">Order Date</p>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-1">{formatDate(selectedSo.orderDate)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">Customer Phone</p>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-1">{selectedSo.customer?.phoneNumber || '-'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">Customer Address</p>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-1">{selectedSo.customer?.address || '-'}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider text-xs">
                Line Items
              </h4>
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                {(selectedSo.items || []).map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3">
                    <div>
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">{it.product?.name || `Product #${it.productId}`}</p>
                      <p className="text-[11px] text-zinc-500">
                        {it.qty} {it.uom?.symbol || ''} @ {formatCurrency(it.rate)}
                      </p>
                    </div>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">{formatCurrency(it.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Sheet>

      {/* ─── CONTEXTUAL SHEET: SHIPMENT INSPECTION ───────────────────── */}
      <Sheet
        open={shipmentSheetOpen}
        onOpenChange={setShipmentSheetOpen}
        title={`Sales Shipment ${selectedShipment?.shipmentNo || ''}`}
        description={`SO: ${selectedShipment?.salesOrder?.orderNo || ''}`}
        footer={
          selectedShipment && selectedShipment.status === 'DRAFT' && (
            <div className="flex justify-end gap-2 w-full">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setShipmentSheetOpen(false);
                  handleOpenPostShipmentDialog(selectedShipment);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" /> Post to Stock & GL
              </Button>
            </div>
          )
        }
      >
        {selectedShipment && (
          <div className="space-y-6 text-xs">
            <div className="grid grid-cols-2 gap-3 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">Status</p>
                <div className="mt-1">
                  <StatusBadge status={selectedShipment.status} />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">Shipment Date</p>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-1">{formatDate(selectedShipment.shipmentDate)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">Sales Team</p>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-1">{selectedShipment.salesTeam?.name || '-'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">GL Status</p>
                <p className="font-semibold text-emerald-600 mt-1">
                  {selectedShipment.status === 'POSTED' ? '✓ Auto-Posted to GL' : 'Pending Post'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider text-xs">
                Dispatched Items
              </h4>
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                {(selectedShipment.items || []).map((it, idx) => (
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
