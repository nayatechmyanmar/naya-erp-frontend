'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Plus,
  Truck,
  Users,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  RefreshCw,
  PackageCheck,
  Building2,
  UserCheck,
  DollarSign,
  Printer,
  Receipt,
  Scale,
  Calendar,
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
  SalesOrder,
  SalesShipment,
  Customer,
  SaleTeam,
  Product,
  UOM,
  Warehouse,
} from '@/types/erp';

export default function SalesPage() {
  const { user, orgContext } = useAuth();
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
  const [cancelSoConfirmOpen, setCancelSoConfirmOpen] = React.useState(false);
  const [selectedSo, setSelectedSo] = React.useState<SalesOrder | null>(null);
  const [selectedShipment, setSelectedShipment] = React.useState<SalesShipment | null>(null);
  const [soSheetOpen, setSoSheetOpen] = React.useState(false);
  const [shipmentSheetOpen, setShipmentSheetOpen] = React.useState(false);

  // Document Printing States
  const [printDialogOpen, setPrintDialogOpen] = React.useState(false);
  const [printType, setPrintType] = React.useState<'INVOICE' | 'DELIVERY_ORDER'>('INVOICE');
  const [selectedPrintSo, setSelectedPrintSo] = React.useState<SalesOrder | null>(null);
  const [selectedPrintShipment, setSelectedPrintShipment] = React.useState<SalesShipment | null>(null);
  const [printConfig, setPrintConfig] = React.useState<{
    paperSize: 'A4' | 'THERMAL_80MM';
    showLetterhead: boolean;
    showSignatures: boolean;
  }>({
    paperSize: 'A4',
    showLetterhead: true,
    showSignatures: true,
  });

  const handleOpenPrintSo = async (so: SalesOrder) => {
    if (!so.items || so.items.length === 0) {
      const detailRes = await apiFetch<SalesOrder>(`/api/sales/sales-orders/${so.id}`);
      setSelectedPrintSo(detailRes.success && detailRes.data ? detailRes.data : so);
    } else {
      setSelectedPrintSo(so);
    }
    setPrintType('INVOICE');
    setPrintDialogOpen(true);
  };

  const handleOpenPrintShipment = async (sh: SalesShipment) => {
    if (!sh.items || sh.items.length === 0) {
      const detailRes = await apiFetch<SalesShipment>(`/api/sales/sales-shipments/${sh.id}`);
      setSelectedPrintShipment(detailRes.success && detailRes.data ? detailRes.data : sh);
    } else {
      setSelectedPrintShipment(sh);
    }
    setPrintType('DELIVERY_ORDER');
    setPrintDialogOpen(true);
  };

  const handleExecutePrint = () => {
    window.print();
  };

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
      if (field === 'qty' || field === 'rate' || field === 'isFoc') {
        const q = Number(item.qty || 0);
        const r = Number(item.rate || 0);
        item.amount = item.isFoc ? 0 : q * r;
      }
      updated[index] = item;
      return { ...prev, items: updated };
    });
  };

  const soTotal = soForm.items.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);

  // Submit SO
  const handleCreateSo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!soForm.customerId || soForm.items.some(i => !i.productId || !i.uomId || Number(i.qty) <= 0)) {
      error('Please select customer and valid items (ဝယ်သူနှင့် ပစ္စည်းများ သေချာစွာ ရွေးချယ်ပါ)');
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
        amount: it.isFoc ? 0 : Number(it.amount),
        isFoc: Boolean(it.isFoc),
      })),
    };

    const res = await apiFetch('/api/sales/sales-orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.success) {
      success('Sales Order Created (အရောင်းအမှာစာ ဖွင့်ပြီးပါပြီ)');
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

  // Inspect SO
  const inspectSo = async (so: SalesOrder) => {
    const detailRes = await apiFetch<SalesOrder>(`/api/sales/sales-orders/${so.id}`);
    setSelectedSo(detailRes.success && detailRes.data ? detailRes.data : so);
    setSoSheetOpen(true);
  };

  // Confirm SO
  const handleConfirmSo = async (id: number) => {
    const res = await apiFetch(`/api/sales/sales-orders/${id}/confirm`, { method: 'PUT' });
    if (res.success) {
      success('Sales Order Confirmed (အရောင်းအမှာစာ အတည်ပြုပြီးပါပြီ)');
      loadSalesData();
      if (selectedSo?.id === id) inspectSo(selectedSo);
    } else {
      error('Confirmation failed', res.message);
    }
  };

  // Cancel SO
  const handleCancelSo = async () => {
    if (!selectedSo) return;
    const res = await apiFetch(`/api/sales/sales-orders/${selectedSo.id}/cancel`, { method: 'PUT' });
    if (res.success) {
      success('Sales Order Cancelled (အရောင်းအမှာစာ ဖျက်သိမ်းပြီးပါပြီ)');
      setCancelSoConfirmOpen(false);
      setSoSheetOpen(false);
      loadSalesData();
    } else {
      error('Cancel failed', res.message);
    }
  };

  // Open Assign Team Dialog
  const handleOpenAssignModal = (so: SalesOrder) => {
    setSelectedSo(so);
    setAssignForm({
      salesOrderId: String(so.id),
      salesTeamId: saleTeams[0]?.id ? String(saleTeams[0].id) : '',
      assignedDate: new Date().toISOString().split('T')[0],
    });
    setAssignDialogOpen(true);
  };

  // Submit Assign Team
  const handleAssignSo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignForm.salesOrderId || !assignForm.salesTeamId) {
      error('Please select sales team (အရောင်းအဖွဲ့ ရွေးချယ်ပါ)');
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
      success('Order Assigned to Team (အရောင်းအဖွဲ့သို့ လွှဲအပ်ပြီးပါပြီ)');
      setAssignDialogOpen(false);
      loadSalesData();
      if (selectedSo?.id === Number(assignForm.salesOrderId)) inspectSo(selectedSo);
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
      success('Sales Shipment Saved (အရောင်းပို့ဆောင်လွှာ မူကြမ်း သိမ်းဆည်းပြီးပါပြီ)');
      setShipmentDialogOpen(false);
      loadSalesData();
    } else {
      error('Shipment creation failed', res.message);
    }
  };

  // Inspect Shipment
  const inspectShipment = async (sh: SalesShipment) => {
    const detailRes = await apiFetch<SalesShipment>(`/api/sales/sales-shipments/${sh.id}`);
    setSelectedShipment(detailRes.success && detailRes.data ? detailRes.data : sh);
    setShipmentSheetOpen(true);
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
        'Shipment Posted & GL Updated! (ပစ္စည်းပို့ဆောင်ပြီး စာရင်းချုပ်သွင်းပြီးပါပြီ)',
        'Stock deducted, Accounts Receivable & Revenue recorded.'
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
    { header: 'Customer (ဝယ်ယူသူ)', cell: r => r.customer?.name || `Customer #${r.customerId}` },
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
            onClick={() => handleOpenPrintSo(r)}
            className="h-7 text-xs text-zinc-600 hover:text-blue-600"
            title="Print Sales Invoice (အရောင်းပြေစာ ပရင့်ထုတ်ပါ)"
          >
            <Printer className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => inspectSo(r)}
            className="h-7 text-xs"
            title="Inspect"
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
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenAssignModal(r)}
                className="h-7 text-xs gap-1 text-purple-600"
              >
                <UserCheck className="h-3.5 w-3.5" /> Assign
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleOpenCreateShipment(r)}
                className="h-7 text-xs gap-1 bg-blue-600 hover:bg-blue-700"
              >
                <Truck className="h-3.5 w-3.5" /> Dispatch
              </Button>
            </>
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
            onClick={() => handleOpenPrintShipment(r)}
            className="h-7 text-xs text-zinc-600 hover:text-emerald-600"
            title="Print Delivery Order (DO) (ပစ္စည်းပို့ဆောင်လွှာ ပရင့်ထုတ်ပါ)"
          >
            <Printer className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => inspectShipment(r)}
            className="h-7 text-xs"
            title="Inspect"
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
            အရောင်းနှင့် ပို့ဆောင်ရေး လုပ်ငန်းစဉ်
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Sales Orders → Sales Team Routing → Shipments → Auto COGS & Revenue Journals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadSalesData} className="gap-1.5 h-8 text-xs">
            <RefreshCw className={isLoading ? 'animate-spin h-3.5 w-3.5' : 'h-3.5 w-3.5'} />
            <span>Refresh</span>
          </Button>
          <Link href="/sales-teams">
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs text-blue-600 border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40">
              <Users className="h-3.5 w-3.5" />
              <span>Sales Teams Portal (အရောင်းအဖွဲ့ လုပ်ငန်းခွင်) →</span>
            </Button>
          </Link>
          <Button variant="primary" size="sm" onClick={() => setSoDialogOpen(true)} className="gap-1.5 h-8 text-xs bg-blue-600 hover:bg-blue-700">
            <Plus className="h-3.5 w-3.5" />
            <span>+ New Sales Order (အရောင်းအမှာစာသစ်)</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-zinc-100 dark:bg-zinc-800">
          <TabsTrigger value="orders" count={salesOrders.length}>
            Sales Orders (အရောင်းအမှာစာများ)
          </TabsTrigger>
          <TabsTrigger value="shipments" count={shipments.length}>
            Shipments & Deliveries (ပို့ဆောင်မှုများ)
          </TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: SALES ORDERS ────────────────────────────────────── */}
        <TabsContent value="orders" className="space-y-4">
          <div className="hidden sm:block">
            <DataTable
              data={salesOrders}
              columns={soColumns}
              searchPlaceholder="Search sales orders by SO# or customer..."
              searchKey="orderNo"
              isLoading={isLoading}
              onRowClick={r => inspectSo(r)}
            />
          </div>

          {/* Mobile View for Orders */}
          <div className="sm:hidden space-y-3">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-zinc-400">Loading orders...</div>
            ) : salesOrders.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-500">
                No sales orders found.
              </div>
            ) : (
              salesOrders.map(so => {
                const total = (so.items || []).reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
                const assignedTeam = so.assignments?.[0]?.salesTeam?.name;
                return (
                  <div
                    key={so.id}
                    className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
                          {so.orderNo}
                        </span>
                        <div className="text-[10px] text-zinc-400">{formatDate(so.orderDate)}</div>
                      </div>
                      <StatusBadge status={so.status} />
                    </div>

                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 space-y-1 text-xs">
                      <div className="flex items-center justify-between font-semibold text-zinc-900 dark:text-zinc-100">
                        <span>{so.customer?.name || `Customer #${so.customerId}`}</span>
                        <span className="font-mono text-blue-600 dark:text-blue-400">{formatCurrency(total)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-zinc-500">
                        <span>Team: {assignedTeam || 'Unassigned'}</span>
                        <span>{so.items?.length || 0} items</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenPrintSo(so)}
                          className="h-8 px-2 text-zinc-600 dark:text-zinc-300 gap-1 hover:text-blue-600"
                          title="Print Invoice"
                        >
                          <Printer className="h-3.5 w-3.5" />
                          <span className="text-xs">Print</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => inspectSo(so)}
                          className="h-8 text-xs gap-1"
                        >
                          <Eye className="h-3.5 w-3.5" /> View
                        </Button>
                      </div>

                      <div className="flex items-center gap-1">
                        {so.status === 'DRAFT' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleConfirmSo(so.id)}
                            className="h-8 text-xs gap-1 bg-emerald-600 text-white"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Confirm
                          </Button>
                        )}
                        {(so.status === 'CONFIRMED' || so.status === 'PARTIALLY_SHIPPED') && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenAssignModal(so)}
                              className="h-8 text-xs gap-1 text-blue-600"
                            >
                              <Users className="h-3.5 w-3.5" /> Assign
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleOpenCreateShipment(so)}
                              className="h-8 text-xs gap-1 bg-blue-600 text-white"
                            >
                              <Truck className="h-3.5 w-3.5" /> Dispatch
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* ─── TAB 2: SHIPMENTS ───────────────────────────────────────── */}
        <TabsContent value="shipments" className="space-y-4">
          <div className="hidden sm:block">
            <DataTable
              data={shipments}
              columns={shipmentColumns}
              searchPlaceholder="Search shipments by SHP# or SO#..."
              searchKey="shipmentNo"
              isLoading={isLoading}
              onRowClick={r => inspectShipment(r)}
            />
          </div>

          {/* Mobile View for Shipments */}
          <div className="sm:hidden space-y-3">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-zinc-400">Loading shipments...</div>
            ) : shipments.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-500">
                No shipments found.
              </div>
            ) : (
              shipments.map(shp => (
                <div
                  key={shp.id}
                  className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                        {shp.shipmentNo}
                      </span>
                      <div className="text-[10px] text-zinc-400">Date: {formatDate(shp.shipmentDate)}</div>
                    </div>
                    <StatusBadge status={shp.status} />
                  </div>

                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 text-xs space-y-1 text-zinc-600 dark:text-zinc-300">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">SO Reference:</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {shp.salesOrder?.orderNo || `SO #${shp.salesOrderId}`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Sales Team:</span>
                      <span>{shp.salesTeam?.name || 'Unassigned'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenPrintShipment(shp)}
                      className="h-8 px-2 text-zinc-600 dark:text-zinc-300 gap-1 hover:text-emerald-600"
                      title="Print DO"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span className="text-xs">Print DO</span>
                    </Button>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => inspectShipment(shp)}
                        className="h-8 text-xs gap-1"
                      >
                        <Eye className="h-3.5 w-3.5" /> View
                      </Button>
                      {shp.status === 'DRAFT' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenPostShipmentDialog(shp)}
                          className="h-8 text-xs gap-1 bg-emerald-600 text-white"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Post & GL Sync
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ─── MODAL: NEW SALES ORDER ─────────────────────────────────── */}
      <Dialog open={soDialogOpen} onOpenChange={setSoDialogOpen} title="Create Sales Order (အရောင်းအမှာစာ အသစ်ဖွင့်ရန်)" maxWidth="2xl">
        <form onSubmit={handleCreateSo} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Customer (ဝယ်ယူသူ) *"
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
              label="Order Date (မှာယူသည့်ရက်) *"
              value={soForm.orderDate}
              onChange={e => setSoForm({ ...soForm, orderDate: e.target.value })}
              required
            />

            <Input
              type="date"
              label="Delivery Date (ပို့ဆောင်ရမည့်ရက်)"
              value={soForm.deliveryDate}
              onChange={e => setSoForm({ ...soForm, deliveryDate: e.target.value })}
            />
          </div>

          {/* Line items table */}
          <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Order Items (ရောင်းချမည့် ပစ္စည်းများ)
              </h4>
              <Button type="button" variant="outline" size="sm" onClick={addSoItem} className="h-7 text-xs gap-1">
                <Plus className="h-3 w-3" /> Add Item (ပစ္စည်းထပ်ထည့်ရန်)
              </Button>
            </div>

            {/* Mobile View: Cards */}
            <div className="block md:hidden space-y-2.5 max-h-72 overflow-y-auto pr-0.5">
              {soForm.items.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-zinc-200 p-3 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/80 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
                        Item #{idx + 1}
                      </span>
                      {item.isFoc && (
                        <Badge variant="secondary" className="text-[10px]">FOC</Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                        {item.isFoc ? '0.00' : formatCurrency(item.amount)}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSoItem(idx)}
                        disabled={soForm.items.length === 1}
                        className="h-7 px-2 text-rose-500 hover:text-rose-700 text-xs gap-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <Select
                    label="Product (ကုန်ပစ္စည်း) *"
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

                  <div className="grid grid-cols-3 gap-2">
                    <Select
                      label="Unit *"
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

                    <Input
                      type="number"
                      step="any"
                      label="Qty *"
                      placeholder="Qty"
                      value={item.qty}
                      onChange={e => updateSoItem(idx, 'qty', e.target.value)}
                      required
                    />

                    <Input
                      type="number"
                      step="any"
                      label="Rate *"
                      placeholder="Rate"
                      value={item.rate}
                      onChange={e => updateSoItem(idx, 'rate', e.target.value)}
                      disabled={item.isFoc}
                      required={!item.isFoc}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-zinc-100 dark:border-zinc-800 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer text-zinc-600 dark:text-zinc-400">
                      <input
                        type="checkbox"
                        checked={item.isFoc}
                        onChange={e => updateSoItem(idx, 'isFoc', e.target.checked)}
                        className="rounded border-zinc-300 h-3.5 w-3.5 text-blue-600"
                      />
                      <span>Free of Charge (FOC အခမဲ့ပေးပစ္စည်း)</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Table Rows */}
            <div className="hidden md:block space-y-2 max-h-60 overflow-y-auto pr-1">
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

                  <div className="w-28">
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

                  <div className="w-24">
                    <Input
                      type="number"
                      step="any"
                      placeholder="Qty"
                      value={item.qty}
                      onChange={e => updateSoItem(idx, 'qty', e.target.value)}
                      required
                    />
                  </div>

                  <div className="w-28">
                    <Input
                      type="number"
                      step="any"
                      placeholder="Rate"
                      value={item.rate}
                      onChange={e => updateSoItem(idx, 'rate', e.target.value)}
                      disabled={item.isFoc}
                      required={!item.isFoc}
                    />
                  </div>

                  <div className="flex items-center gap-1 shrink-0 px-1">
                    <label className="text-[11px] font-semibold text-zinc-500 cursor-pointer">FOC</label>
                    <input
                      type="checkbox"
                      checked={item.isFoc}
                      onChange={e => updateSoItem(idx, 'isFoc', e.target.checked)}
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
                    onClick={() => removeSoItem(idx)}
                    disabled={soForm.items.length === 1}
                    className="h-8 w-8 text-rose-500 hover:text-rose-700 shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Total Footer */}
            <div className="flex justify-between items-center p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 font-bold text-xs sm:text-sm">
              <span className="text-zinc-700 dark:text-zinc-300">
                Order Grand Total (စုစုပေါင်း ကျသင့်ငွေ):
              </span>
              <span className="text-blue-600 dark:text-blue-400 font-mono text-sm sm:text-base">
                {formatCurrency(soTotal)}
              </span>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setSoDialogOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="w-full sm:w-auto">
              Create Sales Order (အမှာစာဖွင့်ရန်)
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── MODAL: ASSIGN TEAM ─────────────────────────────────────── */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen} title="Assign Sales Order to Team (အရောင်းအဖွဲ့သို့ လွှဲအပ်ရန်)" maxWidth="md">
        <form onSubmit={handleAssignSo} className="space-y-4">
          <Select
            label="Assigned Sales Team *"
            value={assignForm.salesTeamId}
            onChange={e => setAssignForm({ ...assignForm, salesTeamId: e.target.value })}
            required
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
            label="Assigned Date *"
            value={assignForm.assignedDate}
            onChange={e => setAssignForm({ ...assignForm, assignedDate: e.target.value })}
            required
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Confirm Assignment
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── MODAL: NEW SHIPMENT ────────────────────────────────────── */}
      <Dialog open={shipmentDialogOpen} onOpenChange={setShipmentDialogOpen} title="Create Sales Dispatch (ပစ္စည်းပို့ဆောင်လွှာ ဖွင့်ရန်)" maxWidth="xl">
        <form onSubmit={handleCreateShipment} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Source Warehouse (ထုတ်ယူမည့် ကုန်လှောင်ရုံ) *"
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
              label="Shipment Date (ပို့ဆောင်သည့်ရက်) *"
              value={shipmentForm.shipmentDate}
              onChange={e => setShipmentForm({ ...shipmentForm, shipmentDate: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase text-zinc-500">Dispatch Items (ပို့ဆောင်မည့် ပစ္စည်းများ)</h4>
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
                      <label className="text-[11px] text-zinc-500">Dispatch Qty:</label>
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
                        className="w-20 rounded border border-zinc-300 p-1 text-center font-bold font-mono dark:border-zinc-700"
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
        title="Post Sales Shipment (ပစ္စည်းပို့ဆောင်မှု အတည်ပြုပြီး စာရင်းချုပ်သွင်းရန်)"
        maxWidth="md"
      >
        <form onSubmit={handlePostShipment} className="space-y-4">
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Posting this shipment will verify on-hand stock, deduct items from warehouse, and create automated double-entry GL journal entries (Accounts Receivable & Revenue).
          </p>

          <Select
            label="Confirm Outbound Warehouse (ထုတ်ယူမည့် ကုန်လှောင်ရုံ) *"
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

      {/* ─── MODAL: CANCEL SO CONFIRMATION ──────────────────────────── */}
      <Dialog open={cancelSoConfirmOpen} onOpenChange={setCancelSoConfirmOpen} title="Cancel Sales Order">
        <div className="space-y-4">
          <p className="text-xs text-zinc-600 dark:text-zinc-300">
            Are you sure you want to cancel Sales Order <span className="font-bold">{selectedSo?.orderNo}</span>?
          </p>
          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setCancelSoConfirmOpen(false)}>
              No, Keep Active
            </Button>
            <Button type="button" variant="destructive" onClick={handleCancelSo}>
              Yes, Cancel Order
            </Button>
          </div>
        </div>
      </Dialog>

      {/* ─── CONTEXTUAL SHEET: SALES ORDER INSPECTION ────────────────── */}
      <Sheet
        open={soSheetOpen}
        onOpenChange={setSoSheetOpen}
        title={`Sales Order: ${selectedSo?.orderNo || ''}`}
        description={`Customer: ${selectedSo?.customer?.name || ''}`}
        footer={
          selectedSo && (
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 w-full">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenPrintSo(selectedSo)}
                  className="gap-1.5 text-xs text-blue-600 hover:text-blue-700"
                >
                  <Printer className="h-4 w-4" /> Print Invoice (အရောင်းပြေစာ ပရင့်ထုတ်ပါ)
                </Button>
                {selectedSo.status === 'DRAFT' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCancelSoConfirmOpen(true)}
                    className="text-rose-600 w-full sm:w-auto text-xs"
                  >
                    Cancel Order
                  </Button>
                )}
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {selectedSo.status === 'DRAFT' && (
                  <Button variant="primary" size="sm" onClick={() => handleConfirmSo(selectedSo.id)} className="w-full sm:w-auto text-xs">
                    Confirm Order
                  </Button>
                )}
                {(selectedSo.status === 'CONFIRMED' || selectedSo.status === 'PARTIALLY_SHIPPED') && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenAssignModal(selectedSo)}
                      className="text-purple-600 w-full sm:w-auto text-xs"
                    >
                      <UserCheck className="h-4 w-4 mr-1" /> Assign Team
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setSoSheetOpen(false);
                        handleOpenCreateShipment(selectedSo);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 gap-1.5 w-full sm:w-auto text-xs"
                    >
                      <Truck className="h-4 w-4" /> Create Shipment Dispatch
                    </Button>
                  </>
                )}
              </div>
            </div>
          )
        }
      >
        {selectedSo && (
          <div className="space-y-6 text-xs">
            <div className="grid grid-cols-2 gap-3 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">Order Status</p>
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

            {/* Line Items */}
            <div className="space-y-2">
              <h4 className="font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider text-xs">
                Ordered Products (ရောင်းချထားသော ပစ္စည်းများ)
              </h4>
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                {(selectedSo.items || []).map((it, idx) => (
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

            {/* Linked Shipments */}
            <div className="space-y-2">
              <h4 className="font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider text-xs">
                Fulfillment Shipments (ပို့ဆောင်ပြီးမှု မှတ်တမ်းများ)
              </h4>
              {(selectedSo.shipments || []).length > 0 ? (
                <div className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                  {selectedSo.shipments?.map((sh, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3">
                      <div>
                        <p className="font-mono font-bold text-emerald-600">{sh.shipmentNo}</p>
                        <p className="text-[11px] text-zinc-500">{formatDate(sh.shipmentDate)}</p>
                      </div>
                      <StatusBadge status={sh.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-400 italic">No shipments dispatched yet.</p>
              )}
            </div>
          </div>
        )}
      </Sheet>

      {/* ─── CONTEXTUAL SHEET: SHIPMENT INSPECTION ───────────────────── */}
      <Sheet
        open={shipmentSheetOpen}
        onOpenChange={setShipmentSheetOpen}
        title={`Sales Shipment: ${selectedShipment?.shipmentNo || ''}`}
        description={`SO Reference: ${selectedShipment?.salesOrder?.orderNo || ''}`}
        footer={
          selectedShipment && (
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenPrintShipment(selectedShipment)}
                className="gap-1.5 text-xs text-emerald-600 hover:text-emerald-700"
              >
                <Printer className="h-4 w-4" /> Print DO (ပစ္စည်းပို့လွှာ ပရင့်ထုတ်ပါ)
              </Button>
              {selectedShipment.status === 'DRAFT' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setShipmentSheetOpen(false);
                    handleOpenPostShipmentDialog(selectedShipment);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 gap-1.5 w-full sm:w-auto text-xs"
                >
                  <CheckCircle2 className="h-4 w-4" /> Post to Stock & GL
                </Button>
              )}
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
                <p className="text-[10px] font-bold uppercase text-zinc-400">GL Double-Entry Sync</p>
                <p className="font-semibold text-emerald-600 mt-1">
                  {selectedShipment.status === 'SHIPPED' ? '✓ Auto-Posted (AR DR / Revenue CR)' : 'Pending Post'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider text-xs">
                Dispatched Items (ပို့ဆောင်သော ပစ္စည်းများ)
              </h4>
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                {(selectedShipment.items || []).map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3">
                    <span className="font-semibold">{it.product?.name || `Product #${it.productId}`}</span>
                    <span className="font-bold font-mono">{it.qty} {it.uom?.symbol || ''}</span>
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
        title={printType === 'INVOICE' ? 'Print Commercial Sales Invoice' : 'Print Delivery Order (DO)'}
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          <div className="space-y-2">
            <label className="font-semibold text-zinc-700 dark:text-zinc-300">
              Select Output Document Format (ပုံနှိပ်မည့် ပုံစံရွေးချယ်ပါ)
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
                  <span>📄 A4 Formal Commercial Document</span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Full standard page with enterprise letterhead, itemized pricing, tax breakdown, and 3-column verification seal.
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
                  <span>🧾 80mm POS Thermal Slip</span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Compact roll format for wireless bluetooth receipt printers, field salesmen, and sales delivery vans.
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
                Include Official Enterprise Letterhead (လုပ်ငန်းခေါင်းစီးနှင့် လိပ်စာ)
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
                Include Signatures & Customer Acknowledgment Block (အရောင်း/ပို့ဆောင်/ဝယ်ယူသူ လက်မှတ်များ)
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
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-sales-area,
          #printable-sales-area * {
            visibility: visible !important;
          }
          #printable-sales-area {
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

      <div id="printable-sales-area" className="hidden">
        {printType === 'INVOICE' && selectedPrintSo && (
          printConfig.paperSize === 'THERMAL_80MM' ? (
            /* 🧾 80MM THERMAL SALES INVOICE SLIP */
            <div className="max-w-[76mm] mx-auto text-black font-mono text-[11px] leading-tight p-1 space-y-2">
              <div className="text-center space-y-0.5 border-b border-dashed border-black pb-2">
                <h2 className="text-sm font-bold uppercase">{orgContext.tenantName || 'NAYA-ERA ERP'}</h2>
                <p className="text-[10px]">{orgContext.branchName || 'Head Office'}</p>
                <p className="text-[10px] uppercase font-bold mt-1">*** CASH SALE / INVOICE ***</p>
                <p className="text-[9px]">Invoice#: {selectedPrintSo.orderNo}</p>
                <p className="text-[9px]">Date: {formatDate(selectedPrintSo.orderDate)}</p>
              </div>

              <div className="border-b border-dashed border-black py-1 space-y-0.5 text-[10px]">
                <p>Customer: <span className="font-bold">{selectedPrintSo.customer?.name || 'Walk-in Customer'}</span></p>
                {selectedPrintSo.customer?.phoneNumber && <p>Phone: {selectedPrintSo.customer.phoneNumber}</p>}
                {selectedPrintSo.customer?.address && <p className="truncate">Address: {selectedPrintSo.customer.address}</p>}
                <p>Team: {selectedPrintSo.assignments?.[0]?.salesTeam?.name || 'General Sales'}</p>
              </div>

              <div className="border-b border-dashed border-black py-1 space-y-1">
                <div className="grid grid-cols-12 font-bold text-[10px] border-b border-dashed border-black pb-1">
                  <span className="col-span-7">ITEM</span>
                  <span className="col-span-2 text-right">QTY</span>
                  <span className="col-span-3 text-right">AMOUNT</span>
                </div>
                {(selectedPrintSo.items || []).map((it, i) => (
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
                  <span>NET TOTAL:</span>
                  <span>
                    {formatCurrency(
                      (selectedPrintSo.items || []).reduce((s, it) => s + (it.isFoc ? 0 : Number(it.amount || 0)), 0)
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-[9px]">
                  <span>Status:</span>
                  <span className="uppercase font-bold">{selectedPrintSo.status}</span>
                </div>
              </div>

              <div className="pt-3 text-[9px] space-y-4 border-t border-dashed border-black">
                <div className="space-y-3">
                  <div>
                    <p>Salesperson Sign: _________________</p>
                  </div>
                  <div>
                    <p>Customer Received: _________________</p>
                  </div>
                </div>
                <div className="text-center text-[8px] pt-1">
                  <p>Thank You For Your Business!</p>
                  <p>NAYA-ERA Cloud ERP Point of Sale</p>
                </div>
              </div>
            </div>
          ) : (
            /* 📄 A4 FORMAL COMMERCIAL SALES INVOICE */
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
                      Branch: {orgContext.branchName || 'Head Office'} • Commercial Sales Dept
                    </p>
                    <p className="text-[11px] text-gray-600">
                      Official Tax & Commercial Sales Invoice
                    </p>
                  </div>

                  <div className="text-right text-xs space-y-0.5">
                    <p className="font-bold font-mono text-sm">INVOICE NO: {selectedPrintSo.orderNo}</p>
                    <p className="text-gray-600">Invoice Date: {formatDate(selectedPrintSo.orderDate)}</p>
                    <p className="text-gray-600">Delivery Date: {formatDate(selectedPrintSo.deliveryDate)}</p>
                    <p className="text-gray-600">Status: <span className="font-bold uppercase">{selectedPrintSo.status}</span></p>
                  </div>
                </div>
              )}

              <div className="text-center py-2 bg-gray-100 border border-gray-300 rounded">
                <h2 className="text-base font-bold uppercase tracking-wide">
                  COMMERCIAL SALES INVOICE / အရောင်းပြေစာ
                </h2>
                <p className="text-xs text-gray-600 mt-0.5 font-medium">
                  Official Bill of Sale & Accounts Receivable Document
                </p>
              </div>

              {/* Customer & Billing Details */}
              <div className="grid grid-cols-2 gap-4 text-xs p-3.5 border border-gray-300 rounded bg-gray-50">
                <div className="space-y-1">
                  <p className="font-bold uppercase text-[10px] text-gray-500">Billed To (ဝယ်ယူသူ ဖောက်သည်အချက်အလက်)</p>
                  <p className="font-bold text-sm">{selectedPrintSo.customer?.name || 'Customer'}</p>
                  <p className="text-gray-600">Phone: {selectedPrintSo.customer?.phoneNumber || '-'}</p>
                  <p className="text-gray-600">Address: {selectedPrintSo.customer?.address || '-'}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="font-bold uppercase text-[10px] text-gray-500">Sales Distribution Team</p>
                  <p className="font-bold text-sm">{selectedPrintSo.assignments?.[0]?.salesTeam?.name || 'Direct Sales Division'}</p>
                  <p className="text-gray-600">Issued By: {user?.name || 'Sales Representative'}</p>
                  <p className="text-gray-600">Payment Terms: Cash on Delivery / Net 30 Days</p>
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider border-b border-gray-300 pb-1">
                  Itemized Order Lines (ရောင်းချသော ကုန်ပစ္စည်းစာရင်းများ)
                </h3>
                <table className="w-full text-xs border border-gray-300">
                  <thead className="bg-gray-100 border-b border-gray-300 text-[10px] uppercase">
                    <tr>
                      <th className="p-2 text-left w-12">No.</th>
                      <th className="p-2 text-left">Item Description / SKU</th>
                      <th className="p-2 text-center">Unit</th>
                      <th className="p-2 text-right">Qty</th>
                      <th className="p-2 text-right">Unit Price (MMK)</th>
                      <th className="p-2 text-right">Amount (MMK)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(selectedPrintSo.items || []).map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-bold text-center">{idx + 1}</td>
                        <td className="p-2">
                          <p className="font-semibold">{it.product?.name || `Product #${it.productId}`}</p>
                          <p className="text-[10px] text-gray-500 font-mono">{it.product?.sku || '-'}</p>
                        </td>
                        <td className="p-2 text-center text-gray-600">{it.uom?.symbol || ''}</td>
                        <td className="p-2 text-right font-mono font-bold">{formatQuantity(it.qty)}</td>
                        <td className="p-2 text-right font-mono">{it.isFoc ? '0.00 (FOC Free)' : formatCurrency(it.rate)}</td>
                        <td className="p-2 text-right font-mono font-bold">{it.isFoc ? '0.00' : formatCurrency(it.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-100 font-bold border-t-2 border-black">
                    <tr>
                      <td colSpan={5} className="p-2 text-right uppercase">Net Total Payable (ကျသင့်ငွေ စုစုပေါင်း):</td>
                      <td className="p-2 text-right font-mono text-sm">
                        {formatCurrency(
                          (selectedPrintSo.items || []).reduce((s, it) => s + (it.isFoc ? 0 : Number(it.amount || 0)), 0)
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
                      <p className="font-bold uppercase text-[10px] text-gray-600">Sales Executive (အရောင်းစာရေး)</p>
                      <div className="border-b border-gray-400 mx-4"></div>
                      <div>
                        <p className="font-semibold">{user?.name || 'Authorized Staff'}</p>
                        <p className="text-[10px] text-gray-500">Date: ____/____/202___</p>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <p className="font-bold uppercase text-[10px] text-gray-600">Store / Dispatcher (ပစ္စည်းထုတ်ပေးသူ)</p>
                      <div className="border-b border-gray-400 mx-4"></div>
                      <div>
                        <p className="font-semibold">Warehouse Officer</p>
                        <p className="text-[10px] text-gray-500">Date: ____/____/202___</p>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <p className="font-bold uppercase text-[10px] text-gray-600">Customer Receiver (ဝယ်ယူသူ လက်ခံလက်မှတ်)</p>
                      <div className="border-b border-gray-400 mx-4"></div>
                      <div>
                        <p className="font-semibold">{selectedPrintSo.customer?.name || 'Customer'}</p>
                        <p className="text-[10px] text-gray-500">Date: ____/____/202___</p>
                      </div>
                    </div>
                  </div>

                  <div className="text-center text-[10px] text-gray-500 pt-4 border-t border-gray-200">
                    NAYA-ERA Official Enterprise ERP • System Automated Commercial Invoice • Certified Valid
                  </div>
                </div>
              )}
            </div>
          )
        )}

        {printType === 'DELIVERY_ORDER' && selectedPrintShipment && (
          printConfig.paperSize === 'THERMAL_80MM' ? (
            /* 🧾 80MM THERMAL DELIVERY ORDER SLIP */
            <div className="max-w-[76mm] mx-auto text-black font-mono text-[11px] leading-tight p-1 space-y-2">
              <div className="text-center space-y-0.5 border-b border-dashed border-black pb-2">
                <h2 className="text-sm font-bold uppercase">{orgContext.tenantName || 'NAYA-ERA ERP'}</h2>
                <p className="text-[10px]">{selectedPrintShipment.salesTeam?.name || 'Logistics Fleet'}</p>
                <p className="text-[10px] uppercase font-bold mt-1">*** DELIVERY ORDER (DO) ***</p>
                <p className="text-[9px]">DO#: {selectedPrintShipment.shipmentNo}</p>
                <p className="text-[9px]">SO Ref: {selectedPrintShipment.salesOrder?.orderNo || '-'}</p>
                <p className="text-[9px]">Dispatch Date: {formatDate(selectedPrintShipment.shipmentDate)}</p>
              </div>

              <div className="border-b border-dashed border-black py-1 space-y-0.5 text-[10px]">
                <p>Deliver To: <span className="font-bold">{selectedPrintShipment.salesOrder?.customer?.name || 'Customer Destination'}</span></p>
                {selectedPrintShipment.salesOrder?.customer?.address && (
                  <p className="truncate">Address: {selectedPrintShipment.salesOrder.customer.address}</p>
                )}
                {selectedPrintShipment.salesOrder?.customer?.phoneNumber && (
                  <p>Contact: {selectedPrintShipment.salesOrder.customer.phoneNumber}</p>
                )}
                <p>Team/Van: {selectedPrintShipment.salesTeam?.name || 'Direct Van'}</p>
              </div>

              <div className="border-b border-dashed border-black py-1 space-y-1">
                <div className="grid grid-cols-12 font-bold text-[10px] border-b border-dashed border-black pb-1">
                  <span className="col-span-8">PRODUCT</span>
                  <span className="col-span-4 text-right">DISPATCH QTY</span>
                </div>
                {(selectedPrintShipment.items || []).map((it, i) => (
                  <div key={i} className="grid grid-cols-12 text-[10px] py-0.5">
                    <span className="col-span-8 truncate font-semibold">{it.product?.name || `Product #${it.productId}`}</span>
                    <span className="col-span-4 text-right font-bold font-mono">{it.qty} {it.uom?.symbol || ''}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 text-[9px] space-y-4 border-t border-dashed border-black">
                <p className="text-[8px] italic">Goods received in sound & complete condition.</p>
                <div className="space-y-3">
                  <div>
                    <p>Driver / Salesman Sign:</p>
                    <p className="pt-3 border-b border-black w-32"></p>
                  </div>
                  <div>
                    <p>Customer Receiver Sign:</p>
                    <p className="pt-3 border-b border-black w-32"></p>
                  </div>
                </div>
                <div className="text-center text-[8px] pt-1">
                  <p>NAYA-ERA Mobile Logistics Dispatch</p>
                </div>
              </div>
            </div>
          ) : (
            /* 📄 A4 FORMAL DELIVERY ORDER (DO) */
            <div className="p-8 text-black space-y-6 max-w-4xl mx-auto font-sans">
              {printConfig.showLetterhead && (
                <div className="flex items-start justify-between border-b-2 border-black pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Truck className="h-6 w-6 text-black" />
                      <h1 className="text-xl font-bold uppercase tracking-wider">
                        {orgContext.tenantName || 'NAYA-ERA ENTERPRISE RESOURCE PLANNING'}
                      </h1>
                    </div>
                    <p className="text-xs text-gray-700 font-medium">
                      Branch: {orgContext.branchName || 'Head Office'} • Logistics & Distribution Division
                    </p>
                    <p className="text-[11px] text-gray-600">
                      Official Delivery Order, Gate Pass & Consignment Note
                    </p>
                  </div>

                  <div className="text-right text-xs space-y-0.5">
                    <p className="font-bold font-mono text-sm">DO NUMBER: {selectedPrintShipment.shipmentNo}</p>
                    <p className="text-gray-600">SO Reference: {selectedPrintShipment.salesOrder?.orderNo || '-'}</p>
                    <p className="text-gray-600">Dispatch Date: {formatDate(selectedPrintShipment.shipmentDate)}</p>
                    <p className="text-gray-600">Status: <span className="font-bold uppercase">{selectedPrintShipment.status}</span></p>
                  </div>
                </div>
              )}

              <div className="text-center py-2 bg-gray-100 border border-gray-300 rounded">
                <h2 className="text-base font-bold uppercase tracking-wide">
                  DELIVERY ORDER & DISPATCH NOTE (DO) / ပစ္စည်းပို့ဆောင်လွှာ
                </h2>
                <p className="text-xs text-gray-600 mt-0.5 font-medium">
                  Official Document Accompanying Material Transportation & Customer Handover
                </p>
              </div>

              {/* Destination & Logistics */}
              <div className="grid grid-cols-2 gap-4 text-xs p-3.5 border border-gray-300 rounded bg-gray-50">
                <div className="space-y-1">
                  <p className="font-bold uppercase text-[10px] text-gray-500">Delivery Destination (ပို့ဆောင်ရမည့် နေရာ)</p>
                  <p className="font-bold text-sm">{selectedPrintShipment.salesOrder?.customer?.name || 'Customer'}</p>
                  <p className="text-gray-600">Phone: {selectedPrintShipment.salesOrder?.customer?.phoneNumber || '-'}</p>
                  <p className="text-gray-600">Address: {selectedPrintShipment.salesOrder?.customer?.address || '-'}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="font-bold uppercase text-[10px] text-gray-500">Carrier & Logistics Unit</p>
                  <p className="font-bold text-sm">{selectedPrintShipment.salesTeam?.name || 'Central Distribution Van'}</p>
                  <p className="text-gray-600">Dispatch Officer: {user?.name || 'Logistics Lead'}</p>
                  <p className="text-gray-600">Inventory Status: {selectedPrintShipment.status === 'SHIPPED' ? '✓ Outward Posted' : 'Draft Dispatch'}</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider border-b border-gray-300 pb-1">
                  Physical Consignment Line Items (ပို့ဆောင်သော ကုန်ပစ္စည်းစာရင်း)
                </h3>
                <table className="w-full text-xs border border-gray-300">
                  <thead className="bg-gray-100 border-b border-gray-300 text-[10px] uppercase">
                    <tr>
                      <th className="p-2 text-left w-12">No.</th>
                      <th className="p-2 text-left">Product Name</th>
                      <th className="p-2 text-left">SKU Code</th>
                      <th className="p-2 text-center">Packaging / Unit</th>
                      <th className="p-2 text-right">Quantity to Deliver</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(selectedPrintShipment.items || []).map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-bold text-center">{idx + 1}</td>
                        <td className="p-2 font-semibold">{it.product?.name || `Product #${it.productId}`}</td>
                        <td className="p-2 font-mono text-gray-600">{it.product?.sku || '-'}</td>
                        <td className="p-2 text-center text-gray-600">{it.uom?.symbol || ''}</td>
                        <td className="p-2 text-right font-mono font-bold text-sm">{formatQuantity(it.qty)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-100 font-bold border-t-2 border-black">
                    <tr>
                      <td colSpan={4} className="p-2 text-right uppercase">Total Items Dispatched:</td>
                      <td className="p-2 text-right font-mono text-sm">
                        {(selectedPrintShipment.items || []).reduce((s, it) => s + Number(it.qty || 0), 0)} Units
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Receiver Confirmation Notice */}
              <div className="p-3 bg-gray-50 border border-gray-300 rounded text-xs italic text-gray-700">
                Customer Acknowledgment: The customer hereby confirms having inspected and received all products detailed in this delivery order in full quantity, sound packaging, and undamaged quality.
              </div>

              {/* Signatures */}
              {printConfig.showSignatures && (
                <div className="pt-8 border-t border-gray-300 mt-8 space-y-6">
                  <div className="grid grid-cols-3 gap-6 text-center text-xs">
                    <div className="space-y-8">
                      <p className="font-bold uppercase text-[10px] text-gray-600">Store Dispatcher (ပစ္စည်းထုတ်ပေးသူ)</p>
                      <div className="border-b border-gray-400 mx-4"></div>
                      <div>
                        <p className="font-semibold">{user?.name || 'Warehouse Staff'}</p>
                        <p className="text-[10px] text-gray-500">Date: ____/____/202___</p>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <p className="font-bold uppercase text-[10px] text-gray-600">Delivery Driver / Salesman (ပို့ဆောင်သူ)</p>
                      <div className="border-b border-gray-400 mx-4"></div>
                      <div>
                        <p className="font-semibold">{selectedPrintShipment.salesTeam?.name || 'Fleet Driver'}</p>
                        <p className="text-[10px] text-gray-500">Date: ____/____/202___</p>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <p className="font-bold uppercase text-[10px] text-gray-600">Customer Received By (လက်ခံရရှိသူ)</p>
                      <div className="border-b border-gray-400 mx-4"></div>
                      <div>
                        <p className="font-semibold">{selectedPrintShipment.salesOrder?.customer?.name || 'Authorized Receiver'}</p>
                        <p className="text-[10px] text-gray-500">Date: ____/____/202___</p>
                      </div>
                    </div>
                  </div>

                  <div className="text-center text-[10px] text-gray-500 pt-4 border-t border-gray-200">
                    NAYA-ERA Official Enterprise ERP • System Automated Delivery Order • Certified Valid
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}
