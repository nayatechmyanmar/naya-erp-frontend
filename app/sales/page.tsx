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
      error('အရောင်းအချက်အလက်များ ရယူ၍မရပါ', err.message);
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
      error('ဝယ်သူနှင့် ပစ္စည်းများ သေချာစွာ ရွေးချယ်ပါ');
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
      success('အရောင်းအမှာစာ ဖွင့်ပြီးပါပြီ');
      setSoDialogOpen(false);
      setSoForm({
        customerId: '',
        orderDate: new Date().toISOString().split('T')[0],
        deliveryDate: '',
        items: [{ productId: '', uomId: '', qty: 1, rate: 0, amount: 0, isFoc: false }],
      });
      loadSalesData();
    } else {
      error('အမှာစာဖွင့်၍မရပါ', res.message);
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
      success('အရောင်းအမှာစာ အတည်ပြုပြီးပါပြီ');
      loadSalesData();
      if (selectedSo?.id === id) inspectSo(selectedSo);
    } else {
      error('အတည်ပြု၍မရပါ', res.message);
    }
  };

  // Cancel SO
  const handleCancelSo = async () => {
    if (!selectedSo) return;
    const res = await apiFetch(`/api/sales/sales-orders/${selectedSo.id}/cancel`, { method: 'PUT' });
    if (res.success) {
      success('အရောင်းအမှာစာ ဖျက်သိမ်းပြီးပါပြီ');
      setCancelSoConfirmOpen(false);
      setSoSheetOpen(false);
      loadSalesData();
    } else {
      error('ဖျက်သိမ်း၍မရပါ', res.message);
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
      error('အရောင်းအဖွဲ့ ရွေးချယ်ပါ');
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
      success('အရောင်းအဖွဲ့သို့ လွှဲအပ်ပြီးပါပြီ');
      setAssignDialogOpen(false);
      loadSalesData();
      if (selectedSo?.id === Number(assignForm.salesOrderId)) inspectSo(selectedSo);
    } else {
      error('လွှဲအပ်မှု မအောင်မြင်ပါ', res.message);
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
      error('ပို့ဆောင်မှု အချက်အလက်များ ပြည့်စုံစွာ ဖြည့်သွင်းပါ');
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
      success('အရောင်းပို့ဆောင်လွှာ မူကြမ်း သိမ်းဆည်းပြီးပါပြီ');
      setShipmentDialogOpen(false);
      loadSalesData();
    } else {
      error('ပို့ဆောင်လွှာ ဖွင့်၍မရပါ', res.message);
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
      error('ထုတ်ယူမည့် ဂိုဒေါင် ရွေးချယ်ပါ');
      return;
    }

    const res = await apiFetch(`/api/sales/sales-shipments/${selectedShipment.id}/post`, {
      method: 'PUT',
      body: JSON.stringify({ warehouseId: Number(postWhId) }),
    });

    if (res.success) {
      success(
        'ပစ္စည်းပို့ဆောင်ပြီး စာရင်းချုပ်သွင်းပြီးပါပြီ',
        'စတော့စာရင်းမှ ဖြတ်တောက်ပြီး အရောင်းရငွေနှင့် ရရန်ရှိငွေများ စာရင်းသွင်းပြီးပါပြီ။'
      );
      setPostShipmentDialogOpen(false);
      loadSalesData();
      if (shipmentSheetOpen) setShipmentSheetOpen(false);
    } else {
      error('စာရင်းချုပ်သွင်းမှု မအောင်မြင်ပါ', res.message);
    }
  };

  // SO Columns
  const soColumns: Column<SalesOrder>[] = [
    { header: 'အမှာစာအမှတ်', accessorKey: 'orderNo', sortable: true, className: 'font-mono font-bold text-blue-600' },
    { header: 'ဝယ်ယူသူ', cell: r => r.customer?.name || `Customer #${r.customerId}` },
    { header: 'အမှာစာ ရက်စွဲ', cell: r => formatDate(r.orderDate), sortable: true },
    { header: 'အခြေအနေ', cell: r => <StatusBadge status={r.status} /> },
    {
      header: 'လုပ်ဆောင်ချက်',
      className: 'text-right',
      cell: r => (
        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenPrintSo(r)}
            className="h-7 text-xs text-zinc-600 hover:text-blue-600"
            title="အရောင်းပြေစာ ပရင့်ထုတ်မည်"
          >
            <Printer className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => inspectSo(r)}
            className="h-7 text-xs"
            title="အသေးစိတ် ကြည့်ရှုမည်"
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
              အတည်ပြုမည်
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
                <UserCheck className="h-3.5 w-3.5" /> အဖွဲ့လွှဲမည်
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleOpenCreateShipment(r)}
                className="h-7 text-xs gap-1 bg-blue-600 hover:bg-blue-700"
              >
                <Truck className="h-3.5 w-3.5" /> ပို့ဆောင်မည်
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  // Shipment Columns
  const shipmentColumns: Column<SalesShipment>[] = [
    { header: 'ပို့ဆောင်လွှာအမှတ်', accessorKey: 'shipmentNo', sortable: true, className: 'font-mono font-bold text-emerald-600' },
    { header: 'အမှာစာအမှတ်', cell: r => r.salesOrder?.orderNo || `SO #${r.salesOrderId}` },
    { header: 'တာဝန်ကျအရောင်းအဖွဲ့', cell: r => r.salesTeam?.name || '-' },
    { header: 'ပို့ဆောင်သည့်ရက်စွဲ', cell: r => formatDate(r.shipmentDate), sortable: true },
    { header: 'အခြေအနေ', cell: r => <StatusBadge status={r.status} /> },
    {
      header: 'လုပ်ဆောင်ချက်',
      className: 'text-right',
      cell: r => (
        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenPrintShipment(r)}
            className="h-7 text-xs text-zinc-600 hover:text-emerald-600"
            title="ပစ္စည်းပို့ဆောင်လွှာ (DO) ပရင့်ထုတ်မည်"
          >
            <Printer className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => inspectShipment(r)}
            className="h-7 text-xs"
            title="အသေးစိတ် ကြည့်ရှုမည်"
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
              <CheckCircle2 className="h-3.5 w-3.5" /> အတည်ပြု စာရင်းသွင်းမည်
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
            အရောင်းအမှာစာများ၊ အရောင်းအဖွဲ့များထံ လွှဲအပ်မှု၊ ကုန်ပစ္စည်းပို့ဆောင်ခြင်းနှင့် စာရင်းချုပ်မှတ်တမ်းများ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadSalesData} className="gap-1.5 h-8 text-xs">
            <RefreshCw className={isLoading ? 'animate-spin h-3.5 w-3.5' : 'h-3.5 w-3.5'} />
            <span>ပြန်လည်ရယူရန်</span>
          </Button>
          <Link href="/sales-teams">
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs text-blue-600 border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40">
              <Users className="h-3.5 w-3.5" />
              <span>အရောင်းအဖွဲ့ လုပ်ငန်းခွင်သို့ →</span>
            </Button>
          </Link>
          <Button variant="primary" size="sm" onClick={() => setSoDialogOpen(true)} className="gap-1.5 h-8 text-xs bg-blue-600 hover:bg-blue-700">
            <Plus className="h-3.5 w-3.5" />
            <span>+ အရောင်းအမှာစာ အသစ်</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-zinc-100 dark:bg-zinc-800">
          <TabsTrigger value="orders" count={salesOrders.length}>
            🛒 အရောင်းအမှာစာများ (Orders)
          </TabsTrigger>
          <TabsTrigger value="shipments" count={shipments.length}>
            🚚 ပစ္စည်းပို့ဆောင်မှုများ (Shipments)
          </TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: SALES ORDERS ────────────────────────────────────── */}
        <TabsContent value="orders" className="space-y-4">
          <div className="hidden sm:block">
            <DataTable
              data={salesOrders}
              columns={soColumns}
              searchPlaceholder="အမှာစာအမှတ် သို့မဟုတ် ဝယ်ယူသူဖြင့် ရှာဖွေရန်..."
              searchKey="orderNo"
              isLoading={isLoading}
              onRowClick={r => inspectSo(r)}
            />
          </div>

          {/* Mobile View for Orders */}
          <div className="sm:hidden space-y-3">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-zinc-400">အမှာစာများ ရယူနေပါသည်...</div>
            ) : salesOrders.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-500">
                အရောင်းအမှာစာ မရှိသေးပါ။
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
                        <span>တာဝန်ကျအဖွဲ့: {assignedTeam || 'တာဝန်မပေးရသေး'}</span>
                        <span>ပစ္စည်း {so.items?.length || 0} မျိုး</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenPrintSo(so)}
                          className="h-8 px-2 text-zinc-600 dark:text-zinc-300 gap-1 hover:text-blue-600"
                          title="ပြေစာ ပရင့်ထုတ်မည်"
                        >
                          <Printer className="h-3.5 w-3.5" />
                          <span className="text-xs">ပရင့်</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => inspectSo(so)}
                          className="h-8 text-xs gap-1"
                        >
                          <Eye className="h-3.5 w-3.5" /> ကြည့်မည်
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
                            <CheckCircle2 className="h-3.5 w-3.5" /> အတည်ပြုမည်
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
                              <Users className="h-3.5 w-3.5" /> အဖွဲ့လွှဲမည်
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleOpenCreateShipment(so)}
                              className="h-8 text-xs gap-1 bg-blue-600 text-white"
                            >
                              <Truck className="h-3.5 w-3.5" /> ပို့ဆောင်မည်
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
              searchPlaceholder="ပို့ဆောင်လွှာအမှတ် သို့မဟုတ် အမှာစာအမှတ်ဖြင့် ရှာဖွေရန်..."
              searchKey="shipmentNo"
              isLoading={isLoading}
              onRowClick={r => inspectShipment(r)}
            />
          </div>

          {/* Mobile View for Shipments */}
          <div className="sm:hidden space-y-3">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-zinc-400">ပို့ဆောင်မှုများ ရယူနေပါသည်...</div>
            ) : shipments.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-500">
                ပို့ဆောင်မှု မှတ်တမ်း မရှိသေးပါ။
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
                      <div className="text-[10px] text-zinc-400">ရက်စွဲ: {formatDate(shp.shipmentDate)}</div>
                    </div>
                    <StatusBadge status={shp.status} />
                  </div>

                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 text-xs space-y-1 text-zinc-600 dark:text-zinc-300">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">အမှာစာအမှတ်:</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {shp.salesOrder?.orderNo || `SO #${shp.salesOrderId}`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">တာဝန်ကျအဖွဲ့:</span>
                      <span>{shp.salesTeam?.name || 'တာဝန်မပေးရသေး'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenPrintShipment(shp)}
                      className="h-8 px-2 text-zinc-600 dark:text-zinc-300 gap-1 hover:text-emerald-600"
                      title="ပို့ဆောင်လွှာ ပရင့်ထုတ်မည်"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span className="text-xs">DO ပရင့်</span>
                    </Button>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => inspectShipment(shp)}
                        className="h-8 text-xs gap-1"
                      >
                        <Eye className="h-3.5 w-3.5" /> ကြည့်မည်
                      </Button>
                      {shp.status === 'DRAFT' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenPostShipmentDialog(shp)}
                          className="h-8 text-xs gap-1 bg-emerald-600 text-white"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> အတည်ပြု စာရင်းသွင်းမည်
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
      <Dialog open={soDialogOpen} onOpenChange={setSoDialogOpen} title="အရောင်းအမှာစာ အသစ်ဖွင့်ရန် (New Sales Order)" maxWidth="3xl">
        <form onSubmit={handleCreateSo} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="ဝယ်ယူသူ (Customer) *"
              value={soForm.customerId}
              onChange={e => setSoForm({ ...soForm, customerId: e.target.value })}
              required
            >
              <option value="">ဝယ်ယူသူ ရွေးချယ်ပါ...</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>

            <Input
              type="date"
              label="မှာယူသည့်ရက်စွဲ *"
              value={soForm.orderDate}
              onChange={e => setSoForm({ ...soForm, orderDate: e.target.value })}
              required
            />

            <Input
              type="date"
              label="ပို့ဆောင်ရမည့်ရက်စွဲ (ရှိပါက)"
              value={soForm.deliveryDate}
              onChange={e => setSoForm({ ...soForm, deliveryDate: e.target.value })}
            />
          </div>

          {/* Line items table */}
          <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                ရောင်းချမည့် ပစ္စည်းများ (Order Items)
              </h4>
              <Button type="button" variant="outline" size="sm" onClick={addSoItem} className="h-7 text-xs gap-1">
                <Plus className="h-3 w-3" /> + ကုန်ပစ္စည်းထည့်ရန်
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
                        ပစ္စည်း #{idx + 1}
                      </span>
                      {item.isFoc && (
                        <Badge variant="secondary" className="text-[10px]">FOC (အခမဲ့)</Badge>
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
                    label="ကုန်ပစ္စည်း *"
                    value={item.productId}
                    onChange={e => updateSoItem(idx, 'productId', e.target.value)}
                    required
                  >
                    <option value="">ကုန်ပစ္စည်း ရွေးချယ်ပါ...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </Select>

                  <div className="grid grid-cols-3 gap-2">
                    <Select
                      label="ယူနစ် *"
                      value={item.uomId}
                      onChange={e => updateSoItem(idx, 'uomId', e.target.value)}
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
                      placeholder="Qty"
                      value={item.qty}
                      onChange={e => updateSoItem(idx, 'qty', e.target.value)}
                      required
                    />

                    <Input
                      type="number"
                      step="any"
                      label="ဈေးနှုန်း *"
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
                      <span>အခမဲ့ပေးပစ္စည်း (FOC)</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Table Rows */}
            <div className="hidden md:block space-y-2 max-h-60 overflow-y-auto pr-1">
              <div className="flex items-center gap-2 px-2 py-1 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                <div className="flex-1 min-w-[200px]">ကုန်ပစ္စည်း *</div>
                <div className="w-28 shrink-0">ယူနစ် *</div>
                <div className="w-24 shrink-0">အရေအတွက် *</div>
                <div className="w-28 shrink-0">ဈေးနှုန်း *</div>
                <div className="w-12 text-center shrink-0">FOC</div>
                <div className="w-28 text-right shrink-0">ကျသင့်ငွေ</div>
                <div className="w-8 shrink-0"></div>
              </div>

              {soForm.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60 transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
                  <div className="flex-1 min-w-[200px]">
                    <Select
                      value={item.productId}
                      onChange={e => updateSoItem(idx, 'productId', e.target.value)}
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
                      onChange={e => updateSoItem(idx, 'uomId', e.target.value)}
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
                      onChange={e => updateSoItem(idx, 'qty', e.target.value)}
                      required
                    />
                  </div>

                  <div className="w-28 shrink-0">
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

                  <div className="w-12 flex items-center justify-center shrink-0">
                    <input
                      type="checkbox"
                      checked={item.isFoc}
                      onChange={e => updateSoItem(idx, 'isFoc', e.target.checked)}
                      className="rounded border-zinc-300 h-3.5 w-3.5 text-blue-600"
                      title="Free of charge (အခမဲ့)"
                    />
                  </div>

                  <div className="w-28 text-right font-semibold text-xs text-zinc-800 dark:text-zinc-200 shrink-0 font-mono">
                    {item.isFoc ? <Badge variant="secondary">FOC</Badge> : formatCurrency(item.amount)}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSoItem(idx)}
                    disabled={soForm.items.length === 1}
                    className="h-8 w-8 text-rose-500 hover:text-rose-700 shrink-0"
                    title="ဖျက်သိမ်းရန်"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Total Footer */}
            <div className="flex justify-between items-center p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 font-bold text-xs sm:text-sm">
              <span className="text-zinc-700 dark:text-zinc-300">
                စုစုပေါင်း ကျသင့်ငွေ (Grand Total):
              </span>
              <span className="text-blue-600 dark:text-blue-400 font-mono text-sm sm:text-base">
                {formatCurrency(soTotal)}
              </span>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setSoDialogOpen(false)} className="w-full sm:w-auto">
              မလုပ်တော့ပါ
            </Button>
            <Button type="submit" variant="primary" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
              အရောင်းအမှာစာ ဖွင့်မည်
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── MODAL: ASSIGN TEAM ─────────────────────────────────────── */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen} title="အရောင်းအဖွဲ့သို့ လွှဲအပ်ရန် (Assign Team)" maxWidth="md">
        <form onSubmit={handleAssignSo} className="space-y-4">
          <Select
            label="တာဝန်ပေးမည့် အရောင်းအဖွဲ့ *"
            value={assignForm.salesTeamId}
            onChange={e => setAssignForm({ ...assignForm, salesTeamId: e.target.value })}
            required
          >
            <option value="">အရောင်းအဖွဲ့ ရွေးချယ်ပါ...</option>
            {saleTeams.map(t => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>

          <Input
            type="date"
            label="လွှဲအပ်သည့်ရက်စွဲ *"
            value={assignForm.assignedDate}
            onChange={e => setAssignForm({ ...assignForm, assignedDate: e.target.value })}
            required
          />

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setAssignDialogOpen(false)} className="w-full sm:w-auto">
              မလုပ်တော့ပါ
            </Button>
            <Button type="submit" variant="primary" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
              လွှဲအပ်မှု အတည်ပြုမည်
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── MODAL: NEW SHIPMENT ────────────────────────────────────── */}
      <Dialog open={shipmentDialogOpen} onOpenChange={setShipmentDialogOpen} title="ပစ္စည်းပို့ဆောင်လွှာ ဖွင့်ရန် (New Dispatch)" maxWidth="xl">
        <form onSubmit={handleCreateShipment} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="ထုတ်ယူမည့် ဂိုဒေါင် *"
              value={shipmentForm.warehouseId}
              onChange={e => setShipmentForm({ ...shipmentForm, warehouseId: e.target.value })}
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
              label="တာဝန်ကျ အရောင်းအဖွဲ့"
              value={shipmentForm.salesTeamId}
              onChange={e => setShipmentForm({ ...shipmentForm, salesTeamId: e.target.value })}
            >
              <option value="">အရောင်းအဖွဲ့ ရွေးချယ်ပါ...</option>
              {saleTeams.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>

            <Input
              type="date"
              label="ပို့ဆောင်သည့်ရက်စွဲ *"
              value={shipmentForm.shipmentDate}
              onChange={e => setShipmentForm({ ...shipmentForm, shipmentDate: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase text-zinc-500">ပို့ဆောင်မည့် ပစ္စည်းများ (Dispatch Items)</h4>
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
                      <label className="text-[11px] text-zinc-500">ပို့ဆောင်မည့် အရေအတွက်:</label>
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

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setShipmentDialogOpen(false)} className="w-full sm:w-auto">
              မလုပ်တော့ပါ
            </Button>
            <Button type="submit" variant="primary" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
              ပို့ဆောင်လွှာ မူကြမ်းသိမ်းမည်
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── MODAL: POST SHIPMENT WAREHOUSE CONFIRM ──────────────────── */}
      <Dialog
        open={postShipmentDialogOpen}
        onOpenChange={setPostShipmentDialogOpen}
        title="ပစ္စည်းပို့ဆောင်မှု အတည်ပြုခြင်းနှင့် စာရင်းချုပ်သွင်းခြင်း"
        maxWidth="md"
      >
        <form onSubmit={handlePostShipment} className="space-y-4">
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            ပို့ဆောင်မှုကို အတည်ပြုပါက စတော့စာရင်းမှ ဖြတ်တောက်မည်ဖြစ်ပြီး အရောင်းရငွေနှင့် ရရန်ရှိငွေများကို စာရင်းဇယားထဲသို့ အလိုအလျောက် ထည့်သွင်းပေးမည် ဖြစ်ပါသည်။
          </p>

          <Select
            label="ထုတ်ယူမည့် ဂိုဒေါင် *"
            value={postWhId}
            onChange={e => setPostWhId(e.target.value)}
            required
          >
            <option value="">ဂိုဒေါင် ရွေးချယ်ပါ...</option>
            {warehouses.map(w => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </Select>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setPostShipmentDialogOpen(false)} className="w-full sm:w-auto">
              မလုပ်တော့ပါ
            </Button>
            <Button type="submit" variant="primary" className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700">
              အတည်ပြု၍ စာရင်းချုပ်သွင်းမည်
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── MODAL: CANCEL SO CONFIRMATION ──────────────────────────── */}
      <Dialog open={cancelSoConfirmOpen} onOpenChange={setCancelSoConfirmOpen} title="အရောင်းအမှာစာ ဖျက်သိမ်းရန် အတည်ပြုခြင်း">
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300">
            အရောင်းအမှာစာ <span className="font-bold text-zinc-900 dark:text-zinc-100">{selectedSo?.orderNo}</span> ကို ဖျက်သိမ်းရန် သေချာပါသလား?
          </p>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setCancelSoConfirmOpen(false)} className="w-full sm:w-auto">
              မလုပ်တော့ပါ
            </Button>
            <Button type="button" variant="destructive" onClick={handleCancelSo} className="w-full sm:w-auto">
              အမှာစာ ဖျက်သိမ်းမည်
            </Button>
          </div>
        </div>
      </Dialog>

      {/* ─── CONTEXTUAL SHEET: SALES ORDER INSPECTION ────────────────── */}
      <Sheet
        open={soSheetOpen}
        onOpenChange={setSoSheetOpen}
        title={`အရောင်းအမှာစာ: ${selectedSo?.orderNo || ''}`}
        description={`ဝယ်ယူသူ: ${selectedSo?.customer?.name || ''}`}
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
                  <Printer className="h-4 w-4" /> ပြေစာ ပရင့်ထုတ်မည်
                </Button>
                {selectedSo.status === 'DRAFT' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCancelSoConfirmOpen(true)}
                    className="text-rose-600 w-full sm:w-auto text-xs"
                  >
                    အမှာစာ ဖျက်မည်
                  </Button>
                )}
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {selectedSo.status === 'DRAFT' && (
                  <Button variant="primary" size="sm" onClick={() => handleConfirmSo(selectedSo.id)} className="w-full sm:w-auto text-xs bg-emerald-600 hover:bg-emerald-700">
                    အမှာစာ အတည်ပြုမည်
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
                      <UserCheck className="h-4 w-4 mr-1" /> အဖွဲ့လွှဲမည်
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
                      <Truck className="h-4 w-4" /> ပို့ဆောင်လွှာ ဖွင့်မည်
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
                <p className="text-[10px] font-bold uppercase text-zinc-400">အမှာစာ အခြေအနေ</p>
                <div className="mt-1">
                  <StatusBadge status={selectedSo.status} />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">မှာယူသည့် ရက်စွဲ</p>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-1">{formatDate(selectedSo.orderDate)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">ဝယ်ယူသူ ဖုန်းနံပါတ်</p>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-1">{selectedSo.customer?.phoneNumber || '-'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">ဝယ်ယူသူ လိပ်စာ</p>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-1">{selectedSo.customer?.address || '-'}</p>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-2">
              <h4 className="font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider text-xs">
                ရောင်းချထားသော ပစ္စည်းများ (Ordered Products)
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
                ပို့ဆောင်ပြီးမှု မှတ်တမ်းများ (Fulfillment Shipments)
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
                <p className="text-zinc-400 italic">ပို့ဆောင်ထားသော မှတ်တမ်း မရှိသေးပါ။</p>
              )}
            </div>
          </div>
        )}
      </Sheet>

      {/* ─── CONTEXTUAL SHEET: SHIPMENT INSPECTION ───────────────────── */}
      <Sheet
        open={shipmentSheetOpen}
        onOpenChange={setShipmentSheetOpen}
        title={`ပစ္စည်းပို့ဆောင်လွှာ: ${selectedShipment?.shipmentNo || ''}`}
        description={`အမှာစာအမှတ်: ${selectedShipment?.salesOrder?.orderNo || ''}`}
        footer={
          selectedShipment && (
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenPrintShipment(selectedShipment)}
                className="gap-1.5 text-xs text-emerald-600 hover:text-emerald-700"
              >
                <Printer className="h-4 w-4" /> DO ပရင့်ထုတ်မည်
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
                  <CheckCircle2 className="h-4 w-4" /> အတည်ပြု စာရင်းချုပ်မည်
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
                <p className="text-[10px] font-bold uppercase text-zinc-400">အခြေအနေ</p>
                <div className="mt-1">
                  <StatusBadge status={selectedShipment.status} />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">ပို့ဆောင်သည့် ရက်စွဲ</p>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-1">{formatDate(selectedShipment.shipmentDate)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">တာဝန်ကျအရောင်းအဖွဲ့</p>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-1">{selectedShipment.salesTeam?.name || '-'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">စာရင်းချုပ်ပြီးစီးမှု</p>
                <p className="font-semibold text-emerald-600 mt-1">
                  {selectedShipment.status === 'SHIPPED' ? '✓ စာရင်းချုပ်ပြီး (AR DR / Revenue CR)' : 'စာရင်းမချုပ်ရသေးပါ'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider text-xs">
                ပို့ဆောင်သော ပစ္စည်းများ (Dispatched Items)
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
        title={printType === 'INVOICE' ? 'အရောင်းပြေစာ ပရင့်ထုတ်ရန်' : 'ပစ္စည်းပို့ဆောင်လွှာ (DO) ပရင့်ထုတ်ရန်'}
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          <div className="space-y-2">
            <label className="font-semibold text-zinc-700 dark:text-zinc-300">
              ပုံနှိပ်မည့် ပုံစံရွေးချယ်ပါ (Select Output Document Format)
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
                  <span>📄 A4 တရားဝင် ကုန်သွယ်လုပ်ငန်းသုံး စာရွက်စာတမ်း</span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  လုပ်ငန်းခေါင်းစီး၊ ကုန်ပစ္စည်းအသေးစိတ်ဇယားနှင့် လက်မှတ်/တံဆိပ်တုံး နေရာများပါဝင်သော ရုံးသုံးပုံစံ။
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
                  <span>🧾 80mm အပူပေးစလစ်ပြေစာ (POS Thermal Slip)</span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  ဘလူးတုသ်ပရင်တာများ၊ နယ်လှည့်အရောင်းဝန်ထမ်းများနှင့် ကားအရောင်းများအတွက် သင့်တော်သည်။
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
                လုပ်ငန်းခေါင်းစီးနှင့် လိပ်စာ ထည့်သွင်းမည် (Letterhead)
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
                အရောင်း / ပို့ဆောင် / ဝယ်ယူသူ လက်မှတ်ရေးထိုးရန် နေရာများ ထည့်သွင်းမည်
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
                <p className="text-[10px]">{orgContext.branchName || 'ရုံးချုပ်'}</p>
                <p className="text-[10px] uppercase font-bold mt-1">*** အရောင်းပြေစာ / INVOICE ***</p>
                <p className="text-[9px]">ပြေစာအမှတ်: {selectedPrintSo.orderNo}</p>
                <p className="text-[9px]">ရက်စွဲ: {formatDate(selectedPrintSo.orderDate)}</p>
              </div>

              <div className="border-b border-dashed border-black py-1 space-y-0.5 text-[10px]">
                <p>ဝယ်ယူသူ: <span className="font-bold">{selectedPrintSo.customer?.name || 'ဝယ်ယူသူ'}</span></p>
                {selectedPrintSo.customer?.phoneNumber && <p>ဖုန်း: {selectedPrintSo.customer.phoneNumber}</p>}
                {selectedPrintSo.customer?.address && <p className="truncate">လိပ်စာ: {selectedPrintSo.customer.address}</p>}
                <p>အရောင်းအဖွဲ့: {selectedPrintSo.assignments?.[0]?.salesTeam?.name || 'အရောင်းဌာန'}</p>
              </div>

              <div className="border-b border-dashed border-black py-1 space-y-1">
                <div className="grid grid-cols-12 font-bold text-[10px] border-b border-dashed border-black pb-1">
                  <span className="col-span-7">ပစ္စည်းအမည်</span>
                  <span className="col-span-2 text-right">အရေအတွက်</span>
                  <span className="col-span-3 text-right">ကျသင့်ငွေ</span>
                </div>
                {(selectedPrintSo.items || []).map((it, i) => (
                  <div key={i} className="grid grid-cols-12 text-[10px] py-0.5">
                    <div className="col-span-7 truncate">
                      <p className="font-bold">{it.product?.name || `ပစ္စည်း #${it.productId}`}</p>
                      <p className="text-[9px] text-gray-700 font-normal">@{formatCurrency(it.rate)} {it.isFoc ? '(လက်ဆောင်/FOC)' : ''}</p>
                    </div>
                    <span className="col-span-2 text-right font-bold">{it.qty} {it.uom?.symbol || ''}</span>
                    <span className="col-span-3 text-right font-bold">{it.isFoc ? '0' : formatCurrency(it.amount)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 py-1 text-[10px]">
                <div className="flex justify-between font-bold text-xs">
                  <span>စုစုပေါင်း ကျသင့်ငွေ:</span>
                  <span>
                    {formatCurrency(
                      (selectedPrintSo.items || []).reduce((s, it) => s + (it.isFoc ? 0 : Number(it.amount || 0)), 0)
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-[9px]">
                  <span>အခြေအနေ:</span>
                  <span className="uppercase font-bold">{selectedPrintSo.status}</span>
                </div>
              </div>

              <div className="pt-3 text-[9px] space-y-4 border-t border-dashed border-black">
                <div className="space-y-3">
                  <div>
                    <p>အရောင်းစာရေး လက်မှတ်: _________________</p>
                  </div>
                  <div>
                    <p>ဝယ်ယူသူ လက်ခံလက်မှတ်: _________________</p>
                  </div>
                </div>
                <div className="text-center text-[8px] pt-1">
                  <p>ဝယ်ယူအားပေးမှုအတွက် ကျေးဇူးတင်ပါသည်</p>
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
                      ဌာနခွဲ: {orgContext.branchName || 'ရုံးချုပ်'} • အရောင်းနှင့် ဖြန့်ချိရေးဌာန
                    </p>
                    <p className="text-[11px] text-gray-600">
                      တရားဝင် အရောင်းပြေစာ / Official Tax & Commercial Sales Invoice
                    </p>
                  </div>

                  <div className="text-right text-xs space-y-0.5">
                    <p className="font-bold font-mono text-sm">ပြေစာအမှတ်: {selectedPrintSo.orderNo}</p>
                    <p className="text-gray-600">အမှာစာရက်စွဲ: {formatDate(selectedPrintSo.orderDate)}</p>
                    <p className="text-gray-600">ပို့ဆောင်ရမည့်ရက်: {formatDate(selectedPrintSo.deliveryDate)}</p>
                    <p className="text-gray-600">အခြေအနေ: <span className="font-bold uppercase">{selectedPrintSo.status}</span></p>
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
                  <p className="font-bold uppercase text-[10px] text-gray-500">ဝယ်ယူသူ ဖောက်သည်အချက်အလက်</p>
                  <p className="font-bold text-sm">{selectedPrintSo.customer?.name || 'ဝယ်ယူသူ'}</p>
                  <p className="text-gray-600">ဖုန်း: {selectedPrintSo.customer?.phoneNumber || '-'}</p>
                  <p className="text-gray-600">လိပ်စာ: {selectedPrintSo.customer?.address || '-'}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="font-bold uppercase text-[10px] text-gray-500">တာဝန်ကျ အရောင်းအဖွဲ့</p>
                  <p className="font-bold text-sm">{selectedPrintSo.assignments?.[0]?.salesTeam?.name || 'တိုက်ရိုက်အရောင်းဌာန'}</p>
                  <p className="text-gray-600">ထုတ်ပေးသူ: {user?.name || 'အရောင်းဝန်ထမ်း'}</p>
                  <p className="text-gray-600">ငွေပေးချေမှုစနစ်: ပစ္စည်းရောက်ငွေချေ / ရက် ၃၀ ခရက်ဒစ်</p>
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider border-b border-gray-300 pb-1">
                  ရောင်းချသော ကုန်ပစ္စည်းစာရင်းများ (Itemized Order Lines)
                </h3>
                <table className="w-full text-xs border border-gray-300">
                  <thead className="bg-gray-100 border-b border-gray-300 text-[10px] uppercase">
                    <tr>
                      <th className="p-2 text-left w-12">စဉ်</th>
                      <th className="p-2 text-left">ကုန်ပစ္စည်းအမည် / ကုဒ်</th>
                      <th className="p-2 text-center">ယူနစ်</th>
                      <th className="p-2 text-right">အရေအတွက်</th>
                      <th className="p-2 text-right">နှုန်းထား (ကျပ်)</th>
                      <th className="p-2 text-right">ကျသင့်ငွေ (ကျပ်)</th>
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
                        <td className="p-2 text-right font-mono">{it.isFoc ? '0.00 (FOC)' : formatCurrency(it.rate)}</td>
                        <td className="p-2 text-right font-mono font-bold">{it.isFoc ? '0.00' : formatCurrency(it.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-100 font-bold border-t-2 border-black">
                    <tr>
                      <td colSpan={5} className="p-2 text-right uppercase">ကျသင့်ငွေ စုစုပေါင်း (Net Total):</td>
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
                      <p className="font-bold uppercase text-[10px] text-gray-600">အရောင်းတာဝန်ခံ (Sales Executive)</p>
                      <div className="border-b border-gray-400 mx-4"></div>
                      <div>
                        <p className="font-semibold">{user?.name || 'တာဝန်ခံ'}</p>
                        <p className="text-[10px] text-gray-500">ရက်စွဲ: ____/____/202___</p>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <p className="font-bold uppercase text-[10px] text-gray-600">ပစ္စည်းထုတ်ပေးသူ (Store / Dispatcher)</p>
                      <div className="border-b border-gray-400 mx-4"></div>
                      <div>
                        <p className="font-semibold">ဂိုဒေါင်မှူး</p>
                        <p className="text-[10px] text-gray-500">ရက်စွဲ: ____/____/202___</p>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <p className="font-bold uppercase text-[10px] text-gray-600">ဝယ်ယူလက်ခံသူ (Customer Receiver)</p>
                      <div className="border-b border-gray-400 mx-4"></div>
                      <div>
                        <p className="font-semibold">{selectedPrintSo.customer?.name || 'ဝယ်ယူသူ'}</p>
                        <p className="text-[10px] text-gray-500">ရက်စွဲ: ____/____/202___</p>
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
                <p className="text-[10px]">{selectedPrintShipment.salesTeam?.name || 'ပို့ဆောင်ရေးအဖွဲ့'}</p>
                <p className="text-[10px] uppercase font-bold mt-1">*** ပစ္စည်းပို့ဆောင်လွှာ (DO) ***</p>
                <p className="text-[9px]">DO#: {selectedPrintShipment.shipmentNo}</p>
                <p className="text-[9px]">အမှာစာအမှတ်: {selectedPrintShipment.salesOrder?.orderNo || '-'}</p>
                <p className="text-[9px]">ပို့ဆောင်သည့်ရက်: {formatDate(selectedPrintShipment.shipmentDate)}</p>
              </div>

              <div className="border-b border-dashed border-black py-1 space-y-0.5 text-[10px]">
                <p>ပို့ဆောင်မည့်နေရာ: <span className="font-bold">{selectedPrintShipment.salesOrder?.customer?.name || 'ဝယ်ယူသူ'}</span></p>
                {selectedPrintShipment.salesOrder?.customer?.address && (
                  <p className="truncate">လိပ်စာ: {selectedPrintShipment.salesOrder.customer.address}</p>
                )}
                {selectedPrintShipment.salesOrder?.customer?.phoneNumber && (
                  <p>ဖုန်း: {selectedPrintShipment.salesOrder.customer.phoneNumber}</p>
                )}
                <p>ယာဉ်/အဖွဲ့: {selectedPrintShipment.salesTeam?.name || 'ပို့ဆောင်ရေးယာဉ်'}</p>
              </div>

              <div className="border-b border-dashed border-black py-1 space-y-1">
                <div className="grid grid-cols-12 font-bold text-[10px] border-b border-dashed border-black pb-1">
                  <span className="col-span-8">ကုန်ပစ္စည်း</span>
                  <span className="col-span-4 text-right">အရေအတွက်</span>
                </div>
                {(selectedPrintShipment.items || []).map((it, i) => (
                  <div key={i} className="grid grid-cols-12 text-[10px] py-0.5">
                    <span className="col-span-8 truncate font-semibold">{it.product?.name || `Product #${it.productId}`}</span>
                    <span className="col-span-4 text-right font-bold font-mono">{it.qty} {it.uom?.symbol || ''}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 text-[9px] space-y-4 border-t border-dashed border-black">
                <p className="text-[8px] italic">ကုန်ပစ္စည်းများအား အပြည့်အဝ စစ်ဆေးလက်ခံရရှိပါသည်။</p>
                <div className="space-y-3">
                  <div>
                    <p>ယာဉ်မောင်း/ပို့ဆောင်သူ လက်မှတ်:</p>
                    <p className="pt-3 border-b border-black w-32"></p>
                  </div>
                  <div>
                    <p>ဝယ်ယူလက်ခံသူ လက်မှတ်:</p>
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
                      ဌာနခွဲ: {orgContext.branchName || 'ရုံးချုပ်'} • ကုန်စည်ပို့ဆောင်ရေးနှင့် ဖြန့်ချိရေးဌာန
                    </p>
                    <p className="text-[11px] text-gray-600">
                      တရားဝင် ပစ္စည်းပို့ဆောင်လွှာနှင့် ဂိတ်ဖြတ်လက်မှတ် / Official Delivery Order & Gate Pass
                    </p>
                  </div>

                  <div className="text-right text-xs space-y-0.5">
                    <p className="font-bold font-mono text-sm">ပို့ဆောင်လွှာအမှတ်: {selectedPrintShipment.shipmentNo}</p>
                    <p className="text-gray-600">အမှာစာအမှတ်: {selectedPrintShipment.salesOrder?.orderNo || '-'}</p>
                    <p className="text-gray-600">ပို့ဆောင်သည့်ရက်: {formatDate(selectedPrintShipment.shipmentDate)}</p>
                    <p className="text-gray-600">အခြေအနေ: <span className="font-bold uppercase">{selectedPrintShipment.status}</span></p>
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
                  <p className="font-bold uppercase text-[10px] text-gray-500">ပို့ဆောင်ရမည့် နေရာ</p>
                  <p className="font-bold text-sm">{selectedPrintShipment.salesOrder?.customer?.name || 'ဝယ်ယူသူ'}</p>
                  <p className="text-gray-600">ဖုန်း: {selectedPrintShipment.salesOrder?.customer?.phoneNumber || '-'}</p>
                  <p className="text-gray-600">လိပ်စာ: {selectedPrintShipment.salesOrder?.customer?.address || '-'}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="font-bold uppercase text-[10px] text-gray-500">ပို့ဆောင်ရေး ယာဉ်နှင့် အဖွဲ့</p>
                  <p className="font-bold text-sm">{selectedPrintShipment.salesTeam?.name || 'ဖြန့်ချိရေးယာဉ်'}</p>
                  <p className="text-gray-600">ပို့ဆောင်သူ: {user?.name || 'တာဝန်ခံ'}</p>
                  <p className="text-gray-600">စတော့အခြေအနေ: {selectedPrintShipment.status === 'SHIPPED' ? '✓ စာရင်းချုပ်ပြီး' : 'မူကြမ်းအဆင့်'}</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider border-b border-gray-300 pb-1">
                  ပို့ဆောင်သော ကုန်ပစ္စည်းစာရင်း (Consignment Line Items)
                </h3>
                <table className="w-full text-xs border border-gray-300">
                  <thead className="bg-gray-100 border-b border-gray-300 text-[10px] uppercase">
                    <tr>
                      <th className="p-2 text-left w-12">စဉ်</th>
                      <th className="p-2 text-left">ကုန်ပစ္စည်းအမည်</th>
                      <th className="p-2 text-left">ကုဒ် (SKU)</th>
                      <th className="p-2 text-center">ယူနစ်</th>
                      <th className="p-2 text-right">အရေအတွက်</th>
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
                      <td colSpan={4} className="p-2 text-right uppercase">ပို့ဆောင်သည့် ပစ္စည်းအရေအတွက် စုစုပေါင်း:</td>
                      <td className="p-2 text-right font-mono text-sm">
                        {(selectedPrintShipment.items || []).reduce((s, it) => s + Number(it.qty || 0), 0)} ခု/ထုပ်
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Receiver Confirmation Notice */}
              <div className="p-3 bg-gray-50 border border-gray-300 rounded text-xs italic text-gray-700">
                ဝယ်ယူလက်ခံသူ အတည်ပြုချက်: ဤပို့ဆောင်လွှာတွင် ဖော်ပြထားသော ကုန်ပစ္စည်းများအား အရေအတွက်ပြည့်စုံစွာ၊ ထုပ်ပိုးမှုကောင်းမွန်လျက် အပျက်အစီးမရှိ အပြည့်အဝ စစ်ဆေးလက်ခံရရှိပါသည်။
              </div>

              {/* Signatures */}
              {printConfig.showSignatures && (
                <div className="pt-8 border-t border-gray-300 mt-8 space-y-6">
                  <div className="grid grid-cols-3 gap-6 text-center text-xs">
                    <div className="space-y-8">
                      <p className="font-bold uppercase text-[10px] text-gray-600">ပစ္စည်းထုတ်ပေးသူ (Store Dispatcher)</p>
                      <div className="border-b border-gray-400 mx-4"></div>
                      <div>
                        <p className="font-semibold">{user?.name || 'ဂိုဒေါင်မှူး'}</p>
                        <p className="text-[10px] text-gray-500">ရက်စွဲ: ____/____/202___</p>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <p className="font-bold uppercase text-[10px] text-gray-600">ယာဉ်မောင်း / ပို့ဆောင်သူ (Driver)</p>
                      <div className="border-b border-gray-400 mx-4"></div>
                      <div>
                        <p className="font-semibold">{selectedPrintShipment.salesTeam?.name || 'ယာဉ်မောင်း'}</p>
                        <p className="text-[10px] text-gray-500">ရက်စွဲ: ____/____/202___</p>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <p className="font-bold uppercase text-[10px] text-gray-600">ဝယ်ယူလက်ခံသူ (Customer Receiver)</p>
                      <div className="border-b border-gray-400 mx-4"></div>
                      <div>
                        <p className="font-semibold">{selectedPrintShipment.salesOrder?.customer?.name || 'လက်ခံသူ'}</p>
                        <p className="text-[10px] text-gray-500">ရက်စွဲ: ____/____/202___</p>
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
