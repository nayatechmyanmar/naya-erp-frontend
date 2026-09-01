'use client';

import * as React from 'react';
import {
  Users,
  TrendingUp,
  Truck,
  DollarSign,
  UserCheck,
  Shield,
  UserPlus,
  Plus,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertCircle,
  Phone,
  MapPin,
  Calendar,
  Building2,
  Trash2,
  Award,
  Clock,
  Send,
  FileCheck,
  Printer,
  Receipt,
  Scale,
} from 'lucide-react';
import { apiFetch } from '@/lib/api/bff-client';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from '@/components/ui/toast';
import { DataTable, Column } from '@/components/ui/data-table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
  SaleTeam,
  SaleTeamMember,
  SaleTeamPerformance,
  TeamPerformanceOverview,
  Customer,
  Product,
  UOM,
  Warehouse,
  Branch,
  UserProfile,
} from '@/types/erp';

export default function SalesTeamsPage() {
  const { user, orgContext } = useAuth();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = React.useState('my-orders');
  const [isLoading, setIsLoading] = React.useState(true);

  // Data States
  const [myOrders, setMyOrders] = React.useState<SalesOrder[]>([]);
  const [saleTeams, setSaleTeams] = React.useState<SaleTeam[]>([]);
  const [teamPerformances, setTeamPerformances] = React.useState<TeamPerformanceOverview[]>([]);
  const [users, setUsers] = React.useState<UserProfile[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [uoms, setUoms] = React.useState<UOM[]>([]);
  const [warehouses, setWarehouses] = React.useState<Warehouse[]>([]);
  const [branches, setBranches] = React.useState<Branch[]>([]);

  // Document Printing States
  const [printDialogOpen, setPrintDialogOpen] = React.useState(false);
  const [printType, setPrintType] = React.useState<'INVOICE' | 'DELIVERY_ORDER'>('INVOICE');
  const [selectedPrintOrder, setSelectedPrintOrder] = React.useState<SalesOrder | null>(null);
  const [selectedPrintShipment, setSelectedPrintShipment] = React.useState<SalesShipment | null>(null);
  const [printConfig, setPrintConfig] = React.useState<{
    paperSize: 'A4' | 'THERMAL_80MM';
    showLetterhead: boolean;
    showSignatures: boolean;
  }>({
    paperSize: 'THERMAL_80MM', // Default to 80mm for mobile field salesmen
    showLetterhead: true,
    showSignatures: true,
  });

  const handleOpenPrintOrder = async (order: SalesOrder) => {
    if (!order.items || order.items.length === 0) {
      const detailRes = await apiFetch<SalesOrder>(`/api/sales/sales-orders/${order.id}`);
      setSelectedPrintOrder(detailRes.success && detailRes.data ? detailRes.data : order);
    } else {
      setSelectedPrintOrder(order);
    }
    setPrintType('INVOICE');
    setPrintDialogOpen(true);
  };

  const handleOpenPrintShipment = async (shipment: SalesShipment) => {
    if (!shipment.items || shipment.items.length === 0) {
      const detailRes = await apiFetch<SalesShipment>(`/api/sales/sales-shipments/${shipment.id}`);
      setSelectedPrintShipment(detailRes.success && detailRes.data ? detailRes.data : shipment);
    } else {
      setSelectedPrintShipment(shipment);
    }
    setPrintType('DELIVERY_ORDER');
    setPrintDialogOpen(true);
  };

  const handleExecutePrint = () => {
    window.print();
  };

  // Selected Team Inspection
  const [selectedTeam, setSelectedTeam] = React.useState<SaleTeam | null>(null);
  const [teamSheetOpen, setTeamSheetOpen] = React.useState(false);
  const [teamMembers, setTeamMembers] = React.useState<SaleTeamMember[]>([]);
  const [teamOrders, setTeamOrders] = React.useState<SalesOrder[]>([]);
  const [teamShipments, setTeamShipments] = React.useState<SalesShipment[]>([]);
  const [teamKpi, setTeamKpi] = React.useState<SaleTeamPerformance | null>(null);
  const [teamDetailTab, setTeamDetailTab] = React.useState('members');

  // Selected Order / Inspection
  const [selectedOrder, setSelectedOrder] = React.useState<SalesOrder | null>(null);
  const [orderSheetOpen, setOrderSheetOpen] = React.useState(false);

  // Dialogs
  const [createTeamDialogOpen, setCreateTeamDialogOpen] = React.useState(false);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = React.useState(false);
  const [addMemberTab, setAddMemberTab] = React.useState<'select' | 'register'>('select');
  const [dispatchDialogOpen, setDispatchDialogOpen] = React.useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = React.useState(false);
  const [postShipmentDialogOpen, setPostShipmentDialogOpen] = React.useState(false);
  const [targetShipmentForPost, setTargetShipmentForPost] = React.useState<SalesShipment | null>(null);

  // Forms
  const [teamForm, setTeamForm] = React.useState({
    name: '',
    branchId: '',
  });

  const [memberForm, setMemberForm] = React.useState({
    userId: '',
    role: 'MEMBER' as 'LEADER' | 'MEMBER',
    joinedDate: new Date().toISOString().split('T')[0],
    isActive: true,
  });

  const [newSalesmanForm, setNewSalesmanForm] = React.useState({
    name: '',
    email: '',
    password: '',
    phoneNumber: '',
    address: '',
    branchId: '',
    role: 'MEMBER' as 'LEADER' | 'MEMBER',
    joinedDate: new Date().toISOString().split('T')[0],
  });

  const [dispatchForm, setDispatchForm] = React.useState({
    salesOrderId: '',
    salesTeamId: '',
    warehouseId: '',
    shipmentDate: new Date().toISOString().split('T')[0],
    items: [] as { salesOrderItemId: number; productId: number; uomId: number; qty: number; productName?: string; uomName?: string }[],
  });

  const [paymentForm, setPaymentForm] = React.useState({
    customerId: '',
    amount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'CASH' as 'CASH' | 'BANK' | 'OTHER',
    description: '',
  });

  const [postWarehouseId, setPostWarehouseId] = React.useState('');

  // ─── DATA LOADING ───────────────────────────────────────────────
  const loadPortalData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [myOrdersRes, teamsRes, perfRes, usersRes, custRes, prodRes, uomRes, whRes, brRes] = await Promise.all([
        apiFetch<SalesOrder[]>('/api/sales-teams/my-orders'),
        apiFetch<SaleTeam[]>('/api/master/sale-teams'),
        apiFetch<TeamPerformanceOverview[]>('/api/sales-teams/all-performance'),
        apiFetch<UserProfile[]>('/api/auth/users'),
        apiFetch<Customer[]>('/api/master/customers'),
        apiFetch<Product[]>('/api/master/products'),
        apiFetch<UOM[]>('/api/master/uoms'),
        apiFetch<Warehouse[]>('/api/master/warehouses'),
        apiFetch<Branch[]>('/api/master/branches'),
      ]);

      if (myOrdersRes.success && Array.isArray(myOrdersRes.data)) setMyOrders(myOrdersRes.data);
      if (teamsRes.success && Array.isArray(teamsRes.data)) setSaleTeams(teamsRes.data);
      if (perfRes.success && Array.isArray(perfRes.data)) setTeamPerformances(perfRes.data);
      if (usersRes.success && Array.isArray(usersRes.data)) setUsers(usersRes.data);
      if (custRes.success && Array.isArray(custRes.data)) setCustomers(custRes.data);
      if (prodRes.success && Array.isArray(prodRes.data)) setProducts(prodRes.data);
      if (uomRes.success && Array.isArray(uomRes.data)) setUoms(uomRes.data);
      if (whRes.success && Array.isArray(whRes.data)) setWarehouses(whRes.data);
      if (brRes.success && Array.isArray(brRes.data)) setBranches(brRes.data);
    } catch (err: any) {
      error('အချက်အလက် ရယူ၍မရပါ', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  React.useEffect(() => {
    loadPortalData();
  }, [loadPortalData]);

  // Load Single Team Details (Members, Orders, Shipments, KPIs)
  const inspectTeam = async (team: SaleTeam) => {
    setSelectedTeam(team);
    setTeamSheetOpen(true);
    try {
      const [membersRes, ordersRes, shipmentsRes, kpiRes] = await Promise.all([
        apiFetch<SaleTeamMember[]>(`/api/sales-teams/${team.id}/members`),
        apiFetch<SalesOrder[]>(`/api/sales-teams/${team.id}/orders`),
        apiFetch<SalesShipment[]>(`/api/sales-teams/${team.id}/shipments`),
        apiFetch<SaleTeamPerformance>(`/api/sales-teams/${team.id}/performance`),
      ]);

      if (membersRes.success && Array.isArray(membersRes.data)) setTeamMembers(membersRes.data);
      if (ordersRes.success && Array.isArray(ordersRes.data)) setTeamOrders(ordersRes.data);
      if (shipmentsRes.success && Array.isArray(shipmentsRes.data)) setTeamShipments(shipmentsRes.data);
      if (kpiRes.success && kpiRes.data) setTeamKpi(kpiRes.data);
    } catch (err: any) {
      error('အဖွဲ့အချက်အလက် ရယူ၍မရပါ', err.message);
    }
  };

  // Inspect Single Order
  const inspectOrder = async (order: SalesOrder) => {
    const res = await apiFetch<SalesOrder>(`/api/sales/sales-orders/${order.id}`);
    setSelectedOrder(res.success && res.data ? res.data : order);
    setOrderSheetOpen(true);
  };

  // ─── ACTIONS ────────────────────────────────────────────────────

  // 1. Create Sales Team
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamForm.name.trim()) {
      error('အရောင်းအဖွဲ့အမည် ထည့်သွင်းပါ');
      return;
    }

    const payload = {
      name: teamForm.name.trim(),
      branchId: teamForm.branchId ? Number(teamForm.branchId) : orgContext.branchId,
    };

    const res = await apiFetch('/api/master/sale-teams', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.success) {
      success('အရောင်းအဖွဲ့ အသစ်ဖွဲ့စည်းပြီးပါပြီ');
      setCreateTeamDialogOpen(false);
      setTeamForm({ name: '', branchId: '' });
      loadPortalData();
    } else {
      error('အရောင်းအဖွဲ့ ဖွဲ့စည်း၍မရပါ', res.message);
    }
  };

  // 2. Add Member to Team
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam || !memberForm.userId) {
      error('အဖွဲ့ဝင်အဖြစ် ထည့်သွင်းမည့် ဝန်ထမ်း ရွေးချယ်ပါ');
      return;
    }

    const payload = {
      userId: Number(memberForm.userId),
      role: memberForm.role,
      joinedDate: memberForm.joinedDate,
      isActive: Boolean(memberForm.isActive),
    };

    const res = await apiFetch(`/api/sales-teams/${selectedTeam.id}/members`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.success) {
      success('အဖွဲ့ဝင် ထည့်သွင်းပြီးပါပြီ');
      setAddMemberDialogOpen(false);
      setMemberForm({
        userId: '',
        role: 'MEMBER',
        joinedDate: new Date().toISOString().split('T')[0],
        isActive: true,
      });
      inspectTeam(selectedTeam);
      loadPortalData();
    } else {
      error('အဖွဲ့ဝင် ထည့်သွင်း၍မရပါ', res.message);
    }
  };

  // 2b. Register New User & Add as Salesman to Team
  const handleRegisterAndAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;
    if (!newSalesmanForm.name.trim() || !newSalesmanForm.email.trim() || !newSalesmanForm.password) {
      error('အမည်၊ အီးမေးလ်နှင့် စကားဝှက် ဖြည့်သွင်းပါ');
      return;
    }

    // 1. Create staff user
    const userRes = await apiFetch<UserProfile>('/api/auth/register-user', {
      method: 'POST',
      body: JSON.stringify({
        name: newSalesmanForm.name.trim(),
        email: newSalesmanForm.email.trim(),
        password: newSalesmanForm.password,
        phoneNumber: newSalesmanForm.phoneNumber.trim() || undefined,
        address: newSalesmanForm.address.trim() || undefined,
        branchId: newSalesmanForm.branchId ? Number(newSalesmanForm.branchId) : orgContext.branchId,
        roleId: 2, // Staff role
      }),
    });

    if (!userRes.success || !userRes.data?.id) {
      error('အကောင့်ဖွင့်မအောင်မြင်ပါ', userRes.message);
      return;
    }

    // 2. Link User to Team
    const memberRes = await apiFetch(`/api/sales-teams/${selectedTeam.id}/members`, {
      method: 'POST',
      body: JSON.stringify({
        userId: userRes.data.id,
        role: newSalesmanForm.role,
        joinedDate: newSalesmanForm.joinedDate,
        isActive: true,
      }),
    });

    if (memberRes.success) {
      success(
        'အရောင်းဝန်ထမ်း အကောင့်ဖွင့်ပြီး အဖွဲ့ဝင်အဖြစ် ထည့်သွင်းပြီးပါပြီ',
        `အီးမေးလ်: ${newSalesmanForm.email} ဖြင့် Login ဝင်ရောက်နိုင်ပါသည်။`
      );
      setAddMemberDialogOpen(false);
      setNewSalesmanForm({
        name: '',
        email: '',
        password: '',
        phoneNumber: '',
        address: '',
        branchId: '',
        role: 'MEMBER',
        joinedDate: new Date().toISOString().split('T')[0],
      });
      inspectTeam(selectedTeam);
      loadPortalData();
    } else {
      error('အကောင့်ဖွင့်ပြီးသော်လည်း အဖွဲ့ထဲသို့ ချိတ်ဆက်၍မရပါ', memberRes.message);
    }
  };

  // 3. Toggle Member Role / Active Status
  const handleUpdateMember = async (member: SaleTeamMember, updates: { role?: 'LEADER' | 'MEMBER'; isActive?: boolean }) => {
    if (!selectedTeam) return;
    const res = await apiFetch(`/api/sales-teams/${selectedTeam.id}/members/${member.id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });

    if (res.success) {
      success('အဖွဲ့ဝင် အချက်အလက် ပြင်ဆင်ပြီးပါပြီ');
      inspectTeam(selectedTeam);
      loadPortalData();
    } else {
      error('ပြင်ဆင်မှု မအောင်မြင်ပါ', res.message);
    }
  };

  // 4. Remove Member from Team
  const handleRemoveMember = async (memberId: number) => {
    if (!selectedTeam) return;
    const res = await apiFetch(`/api/sales-teams/${selectedTeam.id}/members/${memberId}`, {
      method: 'DELETE',
    });

    if (res.success) {
      success('အဖွဲ့ဝင်အား အဖွဲ့မှ ဖယ်ရှားပြီးပါပြီ');
      inspectTeam(selectedTeam);
      loadPortalData();
    } else {
      error('ဖယ်ရှားမှု မအောင်မြင်ပါ', res.message);
    }
  };

  // 5. Open Dispatch Modal for Salesman's Order
  const handleOpenDispatch = async (order: SalesOrder) => {
    const detailRes = await apiFetch<SalesOrder>(`/api/sales/sales-orders/${order.id}`);
    const full = detailRes.success && detailRes.data ? detailRes.data : order;
    setSelectedOrder(full);

    const items = (full.items || []).map(it => ({
      salesOrderItemId: it.id!,
      productId: it.productId,
      uomId: it.uomId,
      qty: it.qty,
      productName: it.product?.name,
      uomName: it.uom?.name || it.uom?.symbol,
    }));

    const assignedTeamId = full.assignments?.[0]?.salesTeamId || saleTeams[0]?.id;

    setDispatchForm({
      salesOrderId: String(full.id),
      salesTeamId: assignedTeamId ? String(assignedTeamId) : '',
      warehouseId: warehouses[0]?.id ? String(warehouses[0].id) : '',
      shipmentDate: new Date().toISOString().split('T')[0],
      items,
    });
    setDispatchDialogOpen(true);
  };

  // 6. Submit Dispatch
  const handleSubmitDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchForm.salesOrderId || !dispatchForm.warehouseId || dispatchForm.items.length === 0) {
      error('ပို့ဆောင်မှု အချက်အလက်များ ပြည့်စုံစွာ ဖြည့်သွင်းပါ');
      return;
    }

    const payload = {
      salesOrderId: Number(dispatchForm.salesOrderId),
      salesTeamId: dispatchForm.salesTeamId ? Number(dispatchForm.salesTeamId) : undefined,
      warehouseId: Number(dispatchForm.warehouseId),
      shipmentDate: dispatchForm.shipmentDate,
      branchId: orgContext.branchId,
      items: dispatchForm.items.map(it => ({
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
      success('ပို့ဆောင်လွှာ မူကြမ်း ဖွင့်ပြီးပါပြီ');
      setDispatchDialogOpen(false);
      loadPortalData();
      if (selectedTeam) inspectTeam(selectedTeam);
    } else {
      error('ပို့ဆောင်လွှာ ဖွင့်၍မရပါ', res.message);
    }
  };

  // 7. Open Payment Modal for Customer
  const handleOpenPayment = (order: SalesOrder) => {
    const total = (order.items || []).reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
    setPaymentForm({
      customerId: String(order.customerId),
      amount: total,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'CASH',
      description: `အမှာစာ #${order.orderNo} အတွက် ငွေလက်ခံ`,
    });
    setSelectedOrder(order);
    setPaymentDialogOpen(true);
  };

  // 8. Submit Customer Payment
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.customerId || Number(paymentForm.amount) <= 0) {
      error('ငွေပမာဏ မှန်ကန်စွာ ထည့်သွင်းပါ');
      return;
    }

    const payload = {
      paymentType: 'CUSTOMER_PAYMENT',
      customerId: Number(paymentForm.customerId),
      amount: Number(paymentForm.amount),
      paymentDate: paymentForm.paymentDate,
      paymentMethod: paymentForm.paymentMethod,
      description: paymentForm.description || `Sales Order Collection`,
      branchId: orgContext.branchId,
    };

    const res = await apiFetch('/api/finance/payments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.success) {
      success('ဖောက်သည်ထံမှ ငွေလက်ခံစာရင်း သွင်းပြီးပါပြီ', 'ငွေစာရင်းနှင့် ရရန်ရှိငွေ စာရင်းသွင်းမှုများ အလိုအလျောက် ပြုလုပ်ပြီးပါပြီ။');
      setPaymentDialogOpen(false);
      loadPortalData();
    } else {
      error('ငွေလက်ခံစာရင်း သွင်း၍မရပါ', res.message);
    }
  };

  // Open Post Shipment Dialog with full items loaded
  const openPostShipmentModal = async (sh: SalesShipment) => {
    if (!sh.items || sh.items.length === 0) {
      const detailRes = await apiFetch<SalesShipment>(`/api/sales/sales-shipments/${sh.id}`);
      setTargetShipmentForPost(detailRes.success && detailRes.data ? detailRes.data : sh);
    } else {
      setTargetShipmentForPost(sh);
    }
    setPostWarehouseId(warehouses[0]?.id ? String(warehouses[0].id) : '');
    setPostShipmentDialogOpen(true);
  };

  // 9. Post Shipment (GL Sync)
  const handlePostShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetShipmentForPost || !postWarehouseId) {
      error('ထုတ်ယူမည့် ဂိုဒေါင် ရွေးချယ်ပါ');
      return;
    }

    const res = await apiFetch(`/api/sales/sales-shipments/${targetShipmentForPost.id}/post`, {
      method: 'PUT',
      body: JSON.stringify({ warehouseId: Number(postWarehouseId) }),
    });

    if (res.success) {
      success('ပစ္စည်းပို့ဆောင်ပြီး စာရင်းချုပ်ပြီးပါပြီ', 'စတော့စာရင်းမှ ဖြတ်တောက်ပြီး အရောင်းရငွေနှင့် ရရန်ရှိငွေများ စာရင်းသွင်းပြီးပါပြီ။');
      setPostShipmentDialogOpen(false);
      setTargetShipmentForPost(null);
      loadPortalData();
      if (selectedTeam) inspectTeam(selectedTeam);
    } else {
      error('ပစ္စည်းပို့ဆောင်မှု အတည်ပြု၍မရပါ', res.message);
    }
  };

  // ─── COLUMNS CONFIGURATION ──────────────────────────────────────

  // My Orders Columns
  const myOrderColumns: Column<SalesOrder>[] = [
    {
      header: 'အမှာစာအမှတ်',
      accessorKey: 'orderNo',
      sortable: true,
      className: 'font-mono font-bold text-blue-600',
      cell: r => (
        <div className="flex flex-col">
          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{r.orderNo}</span>
          <span className="text-[10px] text-zinc-400">{formatDate(r.orderDate)}</span>
        </div>
      ),
    },
    {
      header: 'ဝယ်ယူသူနှင့် ဆက်သွယ်ရန်',
      cell: r => (
        <div className="flex flex-col">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{r.customer?.name || `Cust #${r.customerId}`}</span>
          {r.customer?.phoneNumber && (
            <span className="text-[11px] text-zinc-500 flex items-center gap-1">
              <Phone className="h-3 w-3 text-emerald-600" /> {r.customer.phoneNumber}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'စုစုပေါင်းတန်ဖိုး',
      cell: r => {
        const total = (r.items || []).reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
        return <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{formatCurrency(total)}</span>;
      },
    },
    {
      header: 'အခြေအနေ',
      cell: r => <StatusBadge status={r.status} />,
    },
    {
      header: 'လုပ်ဆောင်ချက်',
      className: 'text-right',
      cell: r => (
        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenPrintOrder(r)}
            className="h-7 text-xs text-zinc-600 hover:text-blue-600"
            title="အရောင်းပြေစာ ပရင့်ထုတ်မည်"
          >
            <Printer className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => inspectOrder(r)}
            className="h-7 text-xs"
            title="အသေးစိတ် ကြည့်ရှုမည်"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>

          {(r.status === 'CONFIRMED' || r.status === 'PARTIALLY_SHIPPED') && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenDispatch(r)}
              className="h-7 text-xs gap-1 bg-blue-600 hover:bg-blue-700"
            >
              <Truck className="h-3.5 w-3.5" />
              <span>ပို့ဆောင်မည်</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenPayment(r)}
            className="h-7 text-xs gap-1 text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
          >
            <DollarSign className="h-3.5 w-3.5" />
            <span>ငွေကောက်ခံမည်</span>
          </Button>
        </div>
      ),
    },
  ];

  // Team Performance Leaderboard Columns
  const leaderboardColumns: Column<TeamPerformanceOverview>[] = [
    {
      header: 'အရောင်းအဖွဲ့',
      accessorKey: 'teamName',
      sortable: true,
      className: 'font-bold text-zinc-900 dark:text-zinc-100',
      cell: r => (
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 font-bold text-xs">
            {r.teamName.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-zinc-900 dark:text-zinc-100">{r.teamName}</div>
            <div className="text-[10px] text-zinc-400">အဖွဲ့ဝင် {r.activeMembers} ဦး</div>
          </div>
        </div>
      ),
    },
    {
      header: 'တာဝန်ကျ အမှာစာ',
      accessorKey: 'totalAssignedOrders',
      sortable: true,
      cell: r => <span className="font-mono font-semibold">{r.totalAssignedOrders}</span>,
    },
    {
      header: 'ပို့ဆောင်ပြီးစီး',
      accessorKey: 'fullyShippedOrders',
      sortable: true,
      cell: r => <span className="font-mono font-semibold text-emerald-600">{r.fullyShippedOrders}</span>,
    },
    {
      header: 'ပို့ဆောင်မှု အကြိမ်ရေ',
      accessorKey: 'totalShipments',
      sortable: true,
      cell: r => <span className="font-mono font-semibold text-blue-600">{r.totalShipments}</span>,
    },
    {
      header: 'ပြီးစီးမှုနှုန်း',
      accessorKey: 'fulfillmentRate',
      sortable: true,
      cell: r => (
        <div className="flex items-center gap-2 min-w-[130px]">
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full ${r.fulfillmentRate >= 80 ? 'bg-emerald-500' : r.fulfillmentRate >= 50 ? 'bg-amber-500' : 'bg-blue-500'
                }`}
              style={{ width: `${Math.min(r.fulfillmentRate, 100)}%` }}
            />
          </div>
          <span className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 w-10 text-right">
            {r.fulfillmentRate}%
          </span>
        </div>
      ),
    },
    {
      header: 'လုပ်ဆောင်ချက်',
      className: 'text-right',
      cell: r => {
        const teamObj = saleTeams.find(t => t.id === r.teamId);
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => teamObj && inspectTeam(teamObj)}
            className="h-7 text-xs gap-1"
          >
            <Eye className="h-3.5 w-3.5" /> အဖွဲ့စီမံရန်
          </Button>
        );
      },
    },
  ];

  // ─── LEADERBOARD MOBILE CARD RENDERER ───────────────────────────
  const renderLeaderboardCard = (r: TeamPerformanceOverview, index?: number) => {
    const teamObj = saleTeams.find(t => t.id === r.teamId);
    const rank = (index ?? 0) + 1;
    const rankMedal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

    return (
      <div className="rounded-2xl border border-zinc-200/90 bg-white p-3.5 sm:p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-3 transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
        {/* Top Header: Rank + Team Name + Action */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              {rankMedal}
            </span>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                {r.teamName}
              </h4>
              <p className="text-[11px] text-zinc-500 truncate">
                အဖွဲ့ဝင် {r.activeMembers} ဦး
              </p>
            </div>
          </div>

          <Badge
            variant={r.fulfillmentRate >= 80 ? 'default' : 'secondary'}
            className={`text-[10px] px-2 py-0.5 shrink-0 ${r.fulfillmentRate >= 80 ? 'bg-emerald-600 text-white' : ''
              }`}
          >
            {r.fulfillmentRate}% ပြီးစီးမှု
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all ${r.fulfillmentRate >= 80
                ? 'bg-emerald-500'
                : r.fulfillmentRate >= 50
                  ? 'bg-blue-500'
                  : 'bg-amber-500'
                }`}
              style={{ width: `${Math.min(r.fulfillmentRate, 100)}%` }}
            />
          </div>
        </div>

        {/* 3-Column Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 text-center text-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-semibold text-zinc-400">တာဝန်ကျ</span>
            <p className="font-mono font-bold text-zinc-800 dark:text-zinc-200">
              {r.totalAssignedOrders}
            </p>
          </div>
          <div className="space-y-0.5 border-x border-zinc-200 dark:border-zinc-700/60">
            <span className="text-[10px] uppercase font-semibold text-zinc-400">ပို့ဆောင်မှု</span>
            <p className="font-mono font-bold text-blue-600 dark:text-blue-400">
              {r.totalShipments}
            </p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-semibold text-zinc-400">ရောက်ရှိပြီး</span>
            <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {r.fullyShippedOrders}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => teamObj && inspectTeam(teamObj)}
            className="h-8 w-full sm:w-auto text-xs gap-1.5 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/40"
          >
            <Eye className="h-3.5 w-3.5" /> အဖွဲ့စီမံရန်
          </Button>
        </div>
      </div>
    );
  };

  // Aggregate stats for My Orders
  const myTotalValue = myOrders.reduce((sum, o) => {
    const oTotal = (o.items || []).reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
    return sum + oTotal;
  }, 0);

  const myPendingDispatch = myOrders.filter(o => o.status === 'CONFIRMED' || o.status === 'PARTIALLY_SHIPPED').length;
  const myFulfilledOrders = myOrders.filter(o => o.status === 'FULLY_SHIPPED').length;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full overflow-x-hidden min-w-0">
      {/* ─── HEADER & TOP BAR ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-4 pb-1">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2.5 truncate">
            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 shrink-0" />
            <span className="truncate">အရောင်းအဖွဲ့နှင့် လုပ်ငန်းခွင်</span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
            အရောင်းဝန်ထမ်းများနှင့် အဖွဲ့ခေါင်းဆောင်များအတွက် အမှာစာများ၊ ပို့ဆောင်မှုများ၊ ငွေကောက်ခံမှုနှင့် စွမ်းဆောင်ရည် မှတ်တမ်းများ
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button variant="outline" size="sm" onClick={loadPortalData} className="gap-1.5 h-8 text-xs shrink-0">
            <RefreshCw className={isLoading ? 'animate-spin h-3.5 w-3.5' : 'h-3.5 w-3.5'} />
            <span className="hidden sm:inline">ပြန်လည်ရယူရန်</span>
            <span className="sm:hidden">ပြန်လည်ရယူရန်</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCreateTeamDialogOpen(true)}
            className="gap-1.5 h-8 text-xs bg-blue-600 hover:bg-blue-700 shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">+ အရောင်းအဖွဲ့ အသစ်</span>
            <span className="sm:hidden">+ အရောင်းအဖွဲ့ အသစ်</span>
          </Button>
        </div>
      </div>

      {/* ─── MAIN TABS ─────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0">
          <TabsList className="w-max sm:w-full justify-start">
            <TabsTrigger value="my-orders" count={myOrders.length}>
              📋 တာဝန်ကျ အမှာစာများ (My Orders)
            </TabsTrigger>
            <TabsTrigger value="teams" count={saleTeams.length}>
              👥 အရောင်းအဖွဲ့များနှင့် အဖွဲ့ဝင်များ (Teams)
            </TabsTrigger>
            <TabsTrigger value="leaderboard" count={teamPerformances.length}>
              🏆 စွမ်းဆောင်ရည် ဇယား (Leaderboard)
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ─── TAB 1: SALESMAN PORTAL (MY ORDERS) ───────────────────── */}
        <TabsContent value="my-orders" className="space-y-4">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">တာဝန်ကျအမှာစာ (My Orders)</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono">{myOrders.length}</p>
                  <p className="text-[11px] text-zinc-400">သင့်အဖွဲ့ထံ တာဝန်ပေးထားသော အမှာစာစုစုပေါင်း</p>
                </div>
                <div className="rounded-xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">ပို့ဆောင်ရန် ကျန်ရှိ (Pending Dispatch)</p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">{myPendingDispatch}</p>
                  <p className="text-[11px] text-emerald-600 font-medium">{myFulfilledOrders} စောင် အပြည့်အဝ ပို့ဆောင်ပြီး</p>
                </div>
                <div className="rounded-xl bg-amber-50 p-3 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                  <Truck className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">စုစုပေါင်း ရောင်းရငွေ (Total Sales)</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">{formatCurrency(myTotalValue)}</p>
                  <p className="text-[11px] text-zinc-400">တာဝန်ကျ အမှာစာများ၏ စုစုပေါင်းတန်ဖိုး</p>
                </div>
                <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                  <DollarSign className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block">
            <DataTable
              data={myOrders}
              columns={myOrderColumns}
              searchPlaceholder="အမှာစာအမှတ် သို့မဟုတ် ဝယ်ယူသူဖြင့် ရှာဖွေရန်..."
              searchKey="orderNo"
              isLoading={isLoading}
              onRowClick={r => inspectOrder(r)}
            />
          </div>

          {/* Mobile Card List View for Salesmen on Phone */}
          <div className="sm:hidden space-y-3">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-zinc-400">အမှာစာများ ရယူနေပါသည်...</div>
            ) : myOrders.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-500">
                သင့်အဖွဲ့အတွက် တာဝန်ပေးထားသော အမှာစာ မရှိသေးပါ။
              </div>
            ) : (
              myOrders.map(order => {
                const total = (order.items || []).reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
                return (
                  <div
                    key={order.id}
                    className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
                          {order.orderNo}
                        </span>
                        <div className="text-[10px] text-zinc-400">{formatDate(order.orderDate)}</div>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>

                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 space-y-1 text-xs">
                      <div className="flex items-center justify-between font-semibold text-zinc-900 dark:text-zinc-100">
                        <span>{order.customer?.name || `Customer #${order.customerId}`}</span>
                        <span className="font-mono text-blue-600 dark:text-blue-400">{formatCurrency(total)}</span>
                      </div>
                      {order.customer?.phoneNumber && (
                        <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-0.5">
                          <span className="truncate max-w-[180px]">{order.customer?.address || 'ဖောက်သည်လိပ်စာ'}</span>
                          <a
                            href={`tel:${order.customer.phoneNumber}`}
                            className="inline-flex items-center gap-1 font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md text-[11px]"
                          >
                            <Phone className="h-3 w-3" /> ဖုန်းခေါ်မည်
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenPrintOrder(order)}
                          className="h-8 px-2 text-zinc-600 dark:text-zinc-300 gap-1 hover:text-blue-600"
                          title="ပြေစာ ပရင့်ထုတ်မည်"
                        >
                          <Printer className="h-3.5 w-3.5" />
                          <span className="text-xs">ပရင့်</span>
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => inspectOrder(order)}
                          className="h-8 text-xs gap-1"
                        >
                          <Eye className="h-3.5 w-3.5" /> ကြည့်မည်
                        </Button>
                      </div>

                      <div className="flex items-center gap-1">
                        {(order.status === 'CONFIRMED' || order.status === 'PARTIALLY_SHIPPED') && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleOpenDispatch(order)}
                            className="h-8 text-xs gap-1 bg-blue-600 text-white"
                          >
                            <Truck className="h-3.5 w-3.5" /> ပို့ဆောင်မည်
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenPayment(order)}
                          className="h-8 text-xs gap-1 text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                        >
                          <DollarSign className="h-3.5 w-3.5" /> ငွေကောက်မည်
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* ─── TAB 2: SALES TEAMS & MEMBERS ─────────────────────────── */}
        <TabsContent value="teams" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {saleTeams.map(team => {
              const perf = teamPerformances.find(p => p.teamId === team.id);
              return (
                <Card
                  key={team.id}
                  className="hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer shadow-xs"
                  onClick={() => inspectTeam(team)}
                >
                  <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-sm">
                        {team.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <CardTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{team.name}</CardTitle>
                        <p className="text-[11px] text-zinc-500">ဌာနခွဲ: {team.branch?.name || 'ရုံးချုပ်'}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      #{team.id}
                    </Badge>
                  </CardHeader>

                  <CardContent className="p-4 pt-2 space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-zinc-100 dark:border-zinc-800/80">
                      <div>
                        <span className="text-zinc-500 block text-[10px]">လက်ရှိ အဖွဲ့ဝင်များ</span>
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">
                          {perf?.activeMembers ?? 0} ဦး
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[10px]">တာဝန်ကျ အမှာစာများ</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {perf?.totalAssignedOrders ?? 0} စောင်
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-500">ပြီးစီးမှုနှုန်း</span>
                        <span className="font-bold text-emerald-600">{perf?.fulfillmentRate ?? 0}%</span>
                      </div>
                      <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-1.5 rounded-full"
                          style={{ width: `${Math.min(perf?.fulfillmentRate ?? 0, 100)}%` }}
                        />
                      </div>
                    </div>

                    <Button variant="ghost" size="sm" className="w-full text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 h-7 mt-1">
                      အဖွဲ့ဝင်များနှင့် အသေးစိတ်ကြည့်ရန် →
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ─── TAB 3: PERFORMANCE LEADERBOARD ───────────────────────── */}
        <TabsContent value="leaderboard" className="space-y-4">
          <DataTable
            data={teamPerformances}
            columns={leaderboardColumns}
            searchPlaceholder="စွမ်းဆောင်ရည်ရှာရန်..."
            searchKey="teamName"
            isLoading={isLoading}
            renderCard={renderLeaderboardCard}
          />
        </TabsContent>
      </Tabs>

      {/* ─── SHEET: TEAM DETAILS & MEMBER MANAGEMENT ───────────────── */}
      <Sheet open={teamSheetOpen} onOpenChange={setTeamSheetOpen} title={selectedTeam?.name || 'အရောင်းအဖွဲ့ အသေးစိတ်'} width="xl">
        {selectedTeam && (
          <div className="space-y-5">
            {/* Header info */}
            <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900/60 p-4 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{selectedTeam.name}</h3>
                <p className="text-xs text-zinc-500">ဌာနခွဲ: {selectedTeam.branch?.name || 'ရုံးချုပ်'}</p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setAddMemberDialogOpen(true)}
                className="gap-1 text-xs bg-blue-600"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>+ အဖွဲ့ဝင်ထည့်မည်</span>
              </Button>
            </div>

            {/* Team Tabs */}
            <Tabs value={teamDetailTab} onValueChange={setTeamDetailTab}>
              <TabsList className="bg-zinc-100 dark:bg-zinc-800">
                <TabsTrigger value="members" count={teamMembers.length}>
                  အဖွဲ့ဝင်များ ({teamMembers.length})
                </TabsTrigger>
                <TabsTrigger value="orders" count={teamOrders.length}>
                  အမှာစာများ ({teamOrders.length})
                </TabsTrigger>
                <TabsTrigger value="shipments" count={teamShipments.length}>
                  ပို့ဆောင်မှုများ ({teamShipments.length})
                </TabsTrigger>
                <TabsTrigger value="kpis">
                  စွမ်းဆောင်ရည် သုံးသပ်ချက်
                </TabsTrigger>
              </TabsList>

              {/* Members List */}
              <TabsContent value="members" className="space-y-3 pt-2">
                {teamMembers.length === 0 ? (
                  <div className="text-center py-8 text-xs text-zinc-400">
                    ဤအဖွဲ့တွင် အဖွဲ့ဝင် မရှိသေးပါ။ &quot;+ အဖွဲ့ဝင်ထည့်မည်&quot; ကို နှိပ်၍ ဝန်ထမ်း ထည့်သွင်းပါ။
                  </div>
                ) : (
                  teamMembers.map(m => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 font-bold text-zinc-700 dark:text-zinc-300">
                          {m.user?.name?.substring(0, 1) || 'U'}
                        </div>
                        <div>
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                            <span>{m.user?.name || `User #${m.userId}`}</span>
                            {m.role === 'LEADER' && (
                              <Badge variant="default" className="text-[9px] px-1.5 py-0 bg-purple-600 text-white border-purple-700">
                                ခေါင်းဆောင် (LEADER)
                              </Badge>
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-400 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                            <span>📧 {m.user?.email}</span>
                            {m.user?.phoneNumber && <span>📞 {m.user.phoneNumber}</span>}
                            <span>• စတင်ရက်: {formatDate(m.joinedDate)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUpdateMember(m, { role: m.role === 'LEADER' ? 'MEMBER' : 'LEADER' })}
                          className="h-6 text-[10px] px-2"
                        >
                          {m.role === 'LEADER' ? 'အဖွဲ့ဝင်ပြောင်းမည်' : 'ခေါင်းဆောင်ခန့်မည်'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(m.id)}
                          className="h-6 text-[10px] text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 px-2"
                          title="အဖွဲ့မှ ဖယ်ရှားမည်"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>

              {/* Team Orders */}
              <TabsContent value="orders" className="space-y-2 pt-2">
                {teamOrders.map(o => (
                  <div
                    key={o.id}
                    className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between text-xs cursor-pointer hover:border-blue-300"
                    onClick={() => inspectOrder(o)}
                  >
                    <div>
                      <div className="font-mono font-bold text-blue-600">{o.orderNo}</div>
                      <div className="text-zinc-500">{o.customer?.name} • {formatDate(o.orderDate)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={o.status} />
                    </div>
                  </div>
                ))}
              </TabsContent>

              {/* Team Shipments */}
              <TabsContent value="shipments" className="space-y-2 pt-2">
                {teamShipments.map(sh => (
                  <div
                    key={sh.id}
                    className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-mono font-bold text-emerald-600">{sh.shipmentNo}</div>
                      <div className="text-zinc-500">ရက်စွဲ: {formatDate(sh.shipmentDate)}</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenPrintShipment(sh)}
                        className="h-6 text-[10px] text-zinc-600 dark:text-zinc-300 gap-1 hover:text-emerald-600 px-2"
                        title="ပို့ဆောင်လွှာ ပရင့်ထုတ်မည်"
                      >
                        <Printer className="h-3 w-3" />
                        <span>DO ပရင့်</span>
                      </Button>
                      <StatusBadge status={sh.status} />
                      {sh.status === 'DRAFT' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => openPostShipmentModal(sh)}
                          className="h-6 text-[10px] bg-emerald-600"
                        >
                          အတည်ပြု စာရင်းသွင်းမည်
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </TabsContent>

              {/* Team KPIs */}
              <TabsContent value="kpis" className="pt-2">
                {teamKpi ? (
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                      <span className="text-zinc-500 block text-[10px]">တာဝန်ကျ အမှာစာ စုစုပေါင်း</span>
                      <span className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
                        {teamKpi.summary.totalAssignedOrders}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                      <span className="text-zinc-500 block text-[10px]">အပြည့်အဝ ပို့ဆောင်ပြီး အမှာစာ</span>
                      <span className="text-xl font-bold font-mono text-emerald-600">
                        {teamKpi.summary.fullyShippedOrders}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                      <span className="text-zinc-500 block text-[10px]">ပို့ဆောင်မှု စုစုပေါင်း</span>
                      <span className="text-xl font-bold font-mono text-blue-600">
                        {teamKpi.summary.totalShipments}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                      <span className="text-zinc-500 block text-[10px]">ပြီးစီးမှုနှုန်း</span>
                      <span className="text-xl font-bold font-mono text-purple-600">
                        {teamKpi.summary.fulfillmentRate}%
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-zinc-400 text-xs">စွမ်းဆောင်ရည် တွက်ချက်နေပါသည်...</div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </Sheet>

      {/* ─── SHEET: ORDER INSPECTION ───────────────────────────────── */}
      <Sheet open={orderSheetOpen} onOpenChange={setOrderSheetOpen} title={selectedOrder ? `အမှာစာ ${selectedOrder.orderNo}` : 'အမှာစာ အသေးစိတ်'} width="xl">
        {selectedOrder && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <div>
                <span className="text-zinc-500 block text-[10px]">ဝယ်ယူသူ (Customer)</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{selectedOrder.customer?.name}</span>
                {selectedOrder.customer?.phoneNumber && (
                  <p className="text-[11px] text-zinc-500">{selectedOrder.customer.phoneNumber}</p>
                )}
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">အခြေအနေ</span>
                <StatusBadge status={selectedOrder.status} />
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">အမှာစာ ရက်စွဲ</span>
                <span>{formatDate(selectedOrder.orderDate)}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">ပို့ဆောင်ရမည့် ရက်စွဲ</span>
                <span>{selectedOrder.deliveryDate ? formatDate(selectedOrder.deliveryDate) : '-'}</span>
              </div>
            </div>

            {/* Items Breakdown */}
            <div>
              <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-2">မှာယူထားသော ပစ္စည်းများ (Order Items)</h4>
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-zinc-100 dark:bg-zinc-800/60 text-[10px] text-zinc-500 uppercase">
                    <tr>
                      <th className="p-2">ကုန်ပစ္စည်း</th>
                      <th className="p-2 text-right">အရေအတွက်</th>
                      <th className="p-2 text-right">ဈေးနှုန်း</th>
                      <th className="p-2 text-right">ကျသင့်ငွေ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {(selectedOrder.items || []).map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-medium">{it.product?.name || `Product #${it.productId}`}</td>
                        <td className="p-2 text-right font-mono">{formatQuantity(it.qty)} {it.uom?.name || ''}</td>
                        <td className="p-2 text-right font-mono">{formatCurrency(it.rate)}</td>
                        <td className="p-2 text-right font-mono font-semibold">{formatCurrency(it.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenPrintOrder(selectedOrder)}
                className="gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950/40"
              >
                <Printer className="h-3.5 w-3.5" /> ပြေစာ ပရင့်ထုတ်မည်
              </Button>

              {(selectedOrder.status === 'CONFIRMED' || selectedOrder.status === 'PARTIALLY_SHIPPED') && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setOrderSheetOpen(false);
                    handleOpenDispatch(selectedOrder);
                  }}
                  className="gap-1.5 bg-blue-600"
                >
                  <Truck className="h-3.5 w-3.5" /> ပစ္စည်းပို့ဆောင်လွှာ ဖွင့်မည်
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setOrderSheetOpen(false);
                  handleOpenPayment(selectedOrder);
                }}
                className="gap-1.5 text-emerald-600 border-emerald-300"
              >
                <DollarSign className="h-3.5 w-3.5" /> ငွေလက်ခံစာရင်း သွင်းမည်
              </Button>
            </div>
          </div>
        )}
      </Sheet>

      {/* ─── MODAL: CREATE SALES TEAM ──────────────────────────────── */}
      <Dialog open={createTeamDialogOpen} onOpenChange={setCreateTeamDialogOpen} title="အရောင်းအဖွဲ့ အသစ်ဖွဲ့စည်းရန်" maxWidth="md">
        <form onSubmit={handleCreateTeam} className="space-y-4">
          <Input
            label="အဖွဲ့အမည် *"
            placeholder="ဥပမာ - ရန်ကုန် လမ်းကြောင်း (A)၊ မန္တလေး လက်ကားအဖွဲ့"
            value={teamForm.name}
            onChange={e => setTeamForm({ ...teamForm, name: e.target.value })}
            required
          />

          <Select
            label="ဌာနခွဲ / လုပ်ငန်းတည်နေရာ"
            value={teamForm.branchId}
            onChange={e => setTeamForm({ ...teamForm, branchId: e.target.value })}
          >
            <option value="">မူလဌာနခွဲ ({orgContext.branchName})</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code})
              </option>
            ))}
          </Select>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setCreateTeamDialogOpen(false)} className="w-full sm:w-auto">
              မလုပ်တော့ပါ
            </Button>
            <Button type="submit" variant="primary" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
              အရောင်းအဖွဲ့ ဖွဲ့စည်းမည်
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── MODAL: ADD TEAM MEMBER ────────────────────────────────── */}
      <Dialog
        open={addMemberDialogOpen}
        onOpenChange={setAddMemberDialogOpen}
        title={selectedTeam ? `${selectedTeam.name} သို့ အဖွဲ့ဝင် ထည့်သွင်းရန်` : 'အဖွဲ့ဝင် ထည့်သွင်းရန်'}
        maxWidth="lg"
      >
        <div className="space-y-4">
          {/* Sub-tabs for Add Member */}
          <div className="flex border-b border-zinc-200 dark:border-zinc-800 -mx-1 overflow-x-auto pb-0.5">
            <button
              type="button"
              onClick={() => setAddMemberTab('select')}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${addMemberTab === 'select'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
            >
              👥 ရှိပြီးသား ဝန်ထမ်းရွေးရန်
            </button>
            <button
              type="button"
              onClick={() => setAddMemberTab('register')}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${addMemberTab === 'register'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
            >
              ✨ + အရောင်းဝန်ထမ်းသစ် ဖွင့်ရန်
            </button>
          </div>

          {/* TAB 1: SELECT EXISTING STAFF USER */}
          {addMemberTab === 'select' && (
            <form onSubmit={handleAddMember} className="space-y-3.5 pt-1">
              <Select
                label="ဝန်ထမ်း ရွေးချယ်ပါ *"
                value={memberForm.userId}
                onChange={e => setMemberForm({ ...memberForm, userId: e.target.value })}
                required
              >
                <option value="">ဝန်ထမ်း ရွေးချယ်ပါ...</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} — {u.email} {u.phoneNumber ? `(${u.phoneNumber})` : ''}
                  </option>
                ))}
              </Select>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  label="တာဝန် / ရာထူး *"
                  value={memberForm.role}
                  onChange={e => setMemberForm({ ...memberForm, role: e.target.value as 'LEADER' | 'MEMBER' })}
                  required
                >
                  <option value="MEMBER">အဖွဲ့ဝင် (Member / Salesman)</option>
                  <option value="LEADER">အဖွဲ့ခေါင်းဆောင် (Team Leader)</option>
                </Select>

                <Input
                  type="date"
                  label="စတင်သည့်ရက်စွဲ *"
                  value={memberForm.joinedDate}
                  onChange={e => setMemberForm({ ...memberForm, joinedDate: e.target.value })}
                  required
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <Button type="button" variant="outline" onClick={() => setAddMemberDialogOpen(false)} className="w-full sm:w-auto">
                  မလုပ်တော့ပါ
                </Button>
                <Button type="submit" variant="primary" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                  အဖွဲ့ထဲ ထည့်သွင်းမည်
                </Button>
              </div>
            </form>
          )}

          {/* TAB 2: REGISTER & ADD NEW SALESMAN USER */}
          {addMemberTab === 'register' && (
            <form onSubmit={handleRegisterAndAddMember} className="space-y-3.5 pt-1">
              <div className="p-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <UserPlus className="h-4 w-4 shrink-0" />
                  <span>ဝန်ထမ်းအကောင့် အသစ်ဖွင့်၍ တိုက်ရိုက် Login ပေးပို့ခြင်း</span>
                </p>
                <p className="text-[11px] leading-relaxed text-blue-600 dark:text-blue-400">
                  ဤနေရာတွင် အကောင့်ဖွင့်ပေးလိုက်ပါက အဆိုပါ ဝန်ထမ်းသည် <strong>Tenant ID: {orgContext.tenantId}</strong>၊ ဖြည့်သွင်းခဲ့သော <strong>Email</strong> နှင့် <strong>Password</strong> ဖြင့် စနစ်ထဲသို့ တိုက်ရိုက် Login ဝင်ရောက်နိုင်မည် ဖြစ်သည်။
                </p>
              </div>

              <Input
                label="ဝန်ထမ်းအမည် *"
                placeholder="ဥပမာ - ကိုကျော်ကျော်၊ မလှလှ"
                value={newSalesmanForm.name}
                onChange={e => setNewSalesmanForm({ ...newSalesmanForm, name: e.target.value })}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  type="email"
                  label="အီးမေးလ် (Login Email) *"
                  placeholder="e.g. kyawkyaw@naya.com"
                  value={newSalesmanForm.email}
                  onChange={e => setNewSalesmanForm({ ...newSalesmanForm, email: e.target.value })}
                  required
                />

                <Input
                  type="password"
                  label="စကားဝှက် (Password) *"
                  placeholder="အနည်းဆုံး ၆ လုံး"
                  value={newSalesmanForm.password}
                  onChange={e => setNewSalesmanForm({ ...newSalesmanForm, password: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="ဖုန်းနံပါတ်"
                  placeholder="ဥပမာ - 09123456789"
                  value={newSalesmanForm.phoneNumber}
                  onChange={e => setNewSalesmanForm({ ...newSalesmanForm, phoneNumber: e.target.value })}
                />

                <Input
                  label="လိပ်စာ / မြို့နယ်"
                  placeholder="ဥပမာ - ချမ်းအေးသာစံမြို့နယ်၊ မန္တလေး"
                  value={newSalesmanForm.address}
                  onChange={e => setNewSalesmanForm({ ...newSalesmanForm, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Select
                  label="ဌာနခွဲ"
                  value={newSalesmanForm.branchId}
                  onChange={e => setNewSalesmanForm({ ...newSalesmanForm, branchId: e.target.value })}
                >
                  <option value="">မူလဌာနခွဲ ({orgContext.branchName})</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </Select>

                <Select
                  label="တာဝန် / ရာထူး *"
                  value={newSalesmanForm.role}
                  onChange={e => setNewSalesmanForm({ ...newSalesmanForm, role: e.target.value as 'LEADER' | 'MEMBER' })}
                  required
                >
                  <option value="MEMBER">အဖွဲ့ဝင် (Member / Salesman)</option>
                  <option value="LEADER">အဖွဲ့ခေါင်းဆောင် (Team Leader)</option>
                </Select>

                <Input
                  type="date"
                  label="စတင်သည့်ရက်စွဲ *"
                  value={newSalesmanForm.joinedDate}
                  onChange={e => setNewSalesmanForm({ ...newSalesmanForm, joinedDate: e.target.value })}
                  required
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <Button type="button" variant="outline" onClick={() => setAddMemberDialogOpen(false)} className="w-full sm:w-auto">
                  မလုပ်တော့ပါ
                </Button>
                <Button type="submit" variant="primary" className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700">
                  အကောင့်ဖွင့်၍ အဖွဲ့ထဲထည့်မည်
                </Button>
              </div>
            </form>
          )}
        </div>
      </Dialog>

      {/* ─── MODAL: DISPATCH SHIPMENT ──────────────────────────────── */}
      <Dialog open={dispatchDialogOpen} onOpenChange={setDispatchDialogOpen} title="ပစ္စည်းပို့ဆောင်လွှာ ဖွင့်ရန်" maxWidth="lg">
        <form onSubmit={handleSubmitDispatch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="ထုတ်ယူမည့် ဂိုဒေါင် *"
              value={dispatchForm.warehouseId}
              onChange={e => setDispatchForm({ ...dispatchForm, warehouseId: e.target.value })}
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
              label="ပို့ဆောင်သည့်ရက်စွဲ *"
              value={dispatchForm.shipmentDate}
              onChange={e => setDispatchForm({ ...dispatchForm, shipmentDate: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
              ပို့ဆောင်မည့် ပစ္စည်းများ (Items to Dispatch)
            </label>
            <div className="space-y-2 border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/40">
              {dispatchForm.items.map((it, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3 text-xs">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate flex-1">
                    {it.productName || `Product #${it.productId}`}
                  </span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      className="w-24 h-8 text-right font-mono"
                      value={it.qty}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setDispatchForm(prev => {
                          const updated = [...prev.items];
                          updated[idx].qty = val;
                          return { ...prev, items: updated };
                        });
                      }}
                      required
                    />
                    <span className="text-zinc-500 w-10">{it.uomName || ''}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setDispatchDialogOpen(false)} className="w-full sm:w-auto">
              မလုပ်တော့ပါ
            </Button>
            <Button type="submit" variant="primary" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
              ပို့ဆောင်လွှာ မူကြမ်းဖွင့်မည်
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── MODAL: COLLECT CUSTOMER PAYMENT ───────────────────────── */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen} title="ဖောက်သည်ထံမှ ငွေလက်ခံစာရင်း သွင်းရန်" maxWidth="md">
        <form onSubmit={handleSubmitPayment} className="space-y-4">
          <Select
            label="ဝယ်ယူသူ *"
            value={paymentForm.customerId}
            onChange={e => setPaymentForm({ ...paymentForm, customerId: e.target.value })}
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
            type="number"
            min={1}
            label="လက်ခံရရှိငွေပမာဏ (ကျပ်) *"
            value={paymentForm.amount}
            onChange={e => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="ငွေပေးချေမှုပုံစံ *"
              value={paymentForm.paymentMethod}
              onChange={e => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value as any })}
              required
            >
              <option value="CASH">လက်ငင်းငွေသား (Cash)</option>
              <option value="BANK">ဘဏ်လွှဲငွေ (Bank)</option>
              <option value="OTHER">အခြား (Other)</option>
            </Select>

            <Input
              type="date"
              label="ရက်စွဲ *"
              value={paymentForm.paymentDate}
              onChange={e => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
              required
            />
          </div>

          <Input
            label="မှတ်ချက် / ပြေစာအမှတ်"
            placeholder="ဥပမာ - KBZPay လွှဲပြေစာအမှတ်၊ လက်ခံပြေစာ #12"
            value={paymentForm.description}
            onChange={e => setPaymentForm({ ...paymentForm, description: e.target.value })}
          />

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setPaymentDialogOpen(false)} className="w-full sm:w-auto">
              မလုပ်တော့ပါ
            </Button>
            <Button type="submit" variant="primary" className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700">
              ငွေလက်ခံစာရင်း သွင်းမည်
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── MODAL: POST SHIPMENT WAREHOUSE SELECT ──────────────────── */}
      <Dialog open={postShipmentDialogOpen} onOpenChange={setPostShipmentDialogOpen} title="ပစ္စည်းပို့ဆောင်မှု အတည်ပြုခြင်းနှင့် စာရင်းချုပ်ခြင်း" maxWidth="md">
        <form onSubmit={handlePostShipment} className="space-y-4">
          <p className="text-xs text-zinc-500">
            ပို့ဆောင်မှုကို အတည်ပြုပါက စတော့စာရင်းမှ ဖြတ်တောက်မည်ဖြစ်ပြီး အရောင်းရငွေနှင့် ရရန်ရှိငွေများကို စာရင်းဇယားထဲသို့ အလိုအလျောက် ထည့်သွင်းပေးမည် ဖြစ်ပါသည်။
          </p>

          <Select
            label="ထုတ်ယူမည့် ဂိုဒေါင် *"
            value={postWarehouseId}
            onChange={e => setPostWarehouseId(e.target.value)}
            required
          >
            <option value="">ဂိုဒေါင် ရွေးချယ်ပါ...</option>
            {warehouses.map(w => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </Select>

          {targetShipmentForPost?.items && targetShipmentForPost.items.length > 0 && (
            <div className="space-y-2 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 text-xs">
              <p className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider text-[10px]">
                ထုတ်ယူမည့် ပစ္စည်းစာရင်း ({targetShipmentForPost.items.length} မျိုး)
              </p>
              <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {targetShipmentForPost.items.map((it, idx) => {
                  const prod = products.find(p => p.id === it.productId);
                  return (
                    <div key={idx} className="flex items-center justify-between py-1.5">
                      <div>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                          {prod?.name || it.product?.name || `ပစ္စည်း #${it.productId}`}
                        </span>
                        {prod?.sku && <span className="text-[10px] text-zinc-400 font-mono ml-1.5">({prod.sku})</span>}
                      </div>
                      <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                        {formatQuantity(it.qty)} {it.uom?.symbol || ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setPostShipmentDialogOpen(false)} className="w-full sm:w-auto">
              မလုပ်တော့ပါ
            </Button>
            <Button type="submit" variant="primary" className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700">
              အတည်ပြု စာရင်းသွင်းမည်
            </Button>
          </div>
        </form>
      </Dialog>

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
              ပုံနှိပ်မည့် ပုံစံရွေးချယ်ပါ (Select Document Format)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setPrintConfig({ ...printConfig, paperSize: 'THERMAL_80MM' })}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${printConfig.paperSize === 'THERMAL_80MM'
                  ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                  : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300'
                  }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Receipt className="h-4 w-4 text-emerald-600" />
                  <span>🧾 80mm အပူပေးစလစ်ပြေစာ (Bluetooth Slip)</span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  နယ်လှည့်အရောင်းဝန်ထမ်းများ၊ ကားအရောင်းနှင့် မိုဘိုင်းဘလူးတုသ်ပရင်တာများဖြင့် ပြေစာထုတ်ပေးရန် သင့်တော်သည်။
                </p>
              </div>

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
                အရောင်းဝန်ထမ်း / ဖောက်သည် လက်မှတ်ရေးထိုးရန် နေရာများ ထည့်သွင်းမည်
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
          #printable-sales-teams-area,
          #printable-sales-teams-area * {
            visibility: visible !important;
          }
          #printable-sales-teams-area {
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

      <div id="printable-sales-teams-area" className="hidden">
        {printType === 'INVOICE' && selectedPrintOrder && (
          printConfig.paperSize === 'THERMAL_80MM' ? (
            /* 🧾 80MM THERMAL SALES BILL */
            <div className="max-w-[76mm] mx-auto text-black font-mono text-[11px] leading-tight p-1 space-y-2">
              <div className="text-center space-y-0.5 border-b border-dashed border-black pb-2">
                <h2 className="text-sm font-bold uppercase">{orgContext.tenantName || 'NAYA-ERA ERP'}</h2>
                <p className="text-[10px]">{orgContext.branchName || 'အရောင်းဌာန'}</p>
                <p className="text-[10px] uppercase font-bold mt-1">*** အရောင်းပြေစာ / INVOICE ***</p>
                <p className="text-[9px]">အမှာစာအမှတ်: {selectedPrintOrder.orderNo}</p>
                <p className="text-[9px]">ရက်စွဲ: {formatDate(selectedPrintOrder.orderDate)}</p>
              </div>

              <div className="border-b border-dashed border-black py-1 space-y-0.5 text-[10px]">
                <p>ဝယ်ယူသူ: <span className="font-bold">{selectedPrintOrder.customer?.name || 'ဝယ်ယူသူ'}</span></p>
                {selectedPrintOrder.customer?.phoneNumber && <p>ဖုန်း: {selectedPrintOrder.customer.phoneNumber}</p>}
                {selectedPrintOrder.customer?.address && <p className="truncate">လိပ်စာ: {selectedPrintOrder.customer.address}</p>}
                <p>အရောင်းဝန်ထမ်း: {user?.name || 'အရောင်းဝန်ထမ်း'}</p>
              </div>

              <div className="border-b border-dashed border-black py-1 space-y-1">
                <div className="grid grid-cols-12 font-bold text-[10px] border-b border-dashed border-black pb-1">
                  <span className="col-span-7">ပစ္စည်းအမည်</span>
                  <span className="col-span-2 text-right">အရေအတွက်</span>
                  <span className="col-span-3 text-right">ကျသင့်ငွေ</span>
                </div>
                {(selectedPrintOrder.items || []).map((it, i) => (
                  <div key={i} className="grid grid-cols-12 text-[10px] py-0.5">
                    <div className="col-span-7 truncate">
                      <p className="font-bold">{it.product?.name || `ပစ္စည်း #${it.productId}`}</p>
                      <p className="text-[9px] text-gray-700 font-normal">@{formatCurrency(it.rate)} {it.isFoc ? '(လက်ဆောင်/FOC)' : ''}</p>
                    </div>
                    <span className="col-span-2 text-right font-bold">{it.qty} {it.uom?.symbol || it.uom?.name || ''}</span>
                    <span className="col-span-3 text-right font-bold">{it.isFoc ? '0' : formatCurrency(it.amount)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 py-1 text-[10px]">
                <div className="flex justify-between font-bold text-xs">
                  <span>စုစုပေါင်း ကျသင့်ငွေ:</span>
                  <span>
                    {formatCurrency(
                      (selectedPrintOrder.items || []).reduce((s, it) => s + (it.isFoc ? 0 : Number(it.amount || 0)), 0)
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-[9px]">
                  <span>အခြေအနေ:</span>
                  <span className="uppercase font-bold">{selectedPrintOrder.status}</span>
                </div>
              </div>

              <div className="pt-3 text-[9px] space-y-4 border-t border-dashed border-black">
                <div className="space-y-3">
                  <div>
                    <p>အရောင်းဝန်ထမ်း လက်မှတ်: _________________</p>
                  </div>
                  <div>
                    <p>ဝယ်ယူသူ လက်ခံလက်မှတ်: _________________</p>
                  </div>
                </div>
                <div className="text-center text-[8px] pt-1">
                  <p>ဝယ်ယူအားပေးမှုအတွက် ကျေးဇူးတင်ပါသည်</p>
                  <p>NAYA-ERA Mobile Sales Portal</p>
                </div>
              </div>
            </div>
          ) : (
            /* 📄 A4 COMMERCIAL INVOICE */
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
                      တရားဝင် အရောင်းပြေစာ / Official Commercial Sales Bill & Order Invoice
                    </p>
                  </div>

                  <div className="text-right text-xs space-y-0.5">
                    <p className="font-bold font-mono text-sm">ပြေစာအမှတ်: {selectedPrintOrder.orderNo}</p>
                    <p className="text-gray-600">အမှာစာရက်စွဲ: {formatDate(selectedPrintOrder.orderDate)}</p>
                    <p className="text-gray-600">ပို့ဆောင်ရမည့်ရက်: {formatDate(selectedPrintOrder.deliveryDate)}</p>
                    <p className="text-gray-600">အခြေအနေ: <span className="font-bold uppercase">{selectedPrintOrder.status}</span></p>
                  </div>
                </div>
              )}

              <div className="text-center py-2 bg-gray-100 border border-gray-300 rounded">
                <h2 className="text-base font-bold uppercase tracking-wide">
                  COMMERCIAL SALES INVOICE / အရောင်းပြေစာ
                </h2>
              </div>

              {/* Customer & Billing Details */}
              <div className="grid grid-cols-2 gap-4 text-xs p-3.5 border border-gray-300 rounded bg-gray-50">
                <div className="space-y-1">
                  <p className="font-bold uppercase text-[10px] text-gray-500">ဝယ်ယူသူ အချက်အလက်</p>
                  <p className="font-bold text-sm">{selectedPrintOrder.customer?.name || 'ဝယ်ယူသူ'}</p>
                  <p className="text-gray-600">ဖုန်း: {selectedPrintOrder.customer?.phoneNumber || '-'}</p>
                  <p className="text-gray-600">လိပ်စာ: {selectedPrintOrder.customer?.address || '-'}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="font-bold uppercase text-[10px] text-gray-500">အရောင်းကိုယ်စားလှယ်</p>
                  <p className="font-bold text-sm">{user?.name || 'အရောင်းဝန်ထမ်း'}</p>
                  <p className="text-gray-600">အီးမေးလ်: {user?.email || '-'}</p>
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-2">
                <table className="w-full text-xs border border-gray-300">
                  <thead className="bg-gray-100 border-b border-gray-300 text-[10px] uppercase">
                    <tr>
                      <th className="p-2 text-left w-12">စဉ်</th>
                      <th className="p-2 text-left">ကုန်ပစ္စည်းအမည်</th>
                      <th className="p-2 text-center">ယူနစ်</th>
                      <th className="p-2 text-right">အရေအတွက်</th>
                      <th className="p-2 text-right">နှုန်းထား (ကျပ်)</th>
                      <th className="p-2 text-right">ကျသင့်ငွေ (ကျပ်)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(selectedPrintOrder.items || []).map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-bold text-center">{idx + 1}</td>
                        <td className="p-2 font-semibold">{it.product?.name || `Product #${it.productId}`}</td>
                        <td className="p-2 text-center text-gray-600">{it.uom?.symbol || it.uom?.name || ''}</td>
                        <td className="p-2 text-right font-mono font-bold">{formatQuantity(it.qty)}</td>
                        <td className="p-2 text-right font-mono">{it.isFoc ? '0.00 (FOC)' : formatCurrency(it.rate)}</td>
                        <td className="p-2 text-right font-mono font-bold">{it.isFoc ? '0.00' : formatCurrency(it.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-100 font-bold border-t-2 border-black">
                    <tr>
                      <td colSpan={5} className="p-2 text-right uppercase">စုစုပေါင်း ကျသင့်ငွေ (Net Total):</td>
                      <td className="p-2 text-right font-mono text-sm">
                        {formatCurrency(
                          (selectedPrintOrder.items || []).reduce((s, it) => s + (it.isFoc ? 0 : Number(it.amount || 0)), 0)
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Signatures */}
              {printConfig.showSignatures && (
                <div className="pt-8 border-t border-gray-300 mt-8 space-y-6">
                  <div className="grid grid-cols-2 gap-12 text-center text-xs">
                    <div className="space-y-8">
                      <p className="font-bold uppercase text-[10px] text-gray-600">အရောင်းတာဝန်ခံ (Salesman)</p>
                      <div className="border-b border-gray-400 mx-8"></div>
                      <div>
                        <p className="font-semibold">{user?.name || 'အရောင်းဝန်ထမ်း'}</p>
                        <p className="text-[10px] text-gray-500">ရက်စွဲ: ____/____/202___</p>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <p className="font-bold uppercase text-[10px] text-gray-600">ဝယ်ယူလက်ခံသူ (Customer)</p>
                      <div className="border-b border-gray-400 mx-8"></div>
                      <div>
                        <p className="font-semibold">{selectedPrintOrder.customer?.name || 'ဝယ်ယူသူ'}</p>
                        <p className="text-[10px] text-gray-500">ရက်စွဲ: ____/____/202___</p>
                      </div>
                    </div>
                  </div>

                  <div className="text-center text-[10px] text-gray-500 pt-4 border-t border-gray-200">
                    NAYA-ERA Official Enterprise ERP • Mobile Field Sales Portal • Certified Valid
                  </div>
                </div>
              )}
            </div>
          )
        )}

        {printType === 'DELIVERY_ORDER' && selectedPrintShipment && (
          printConfig.paperSize === 'THERMAL_80MM' ? (
            /* 🧾 80MM THERMAL DO SLIP */
            <div className="max-w-[76mm] mx-auto text-black font-mono text-[11px] leading-tight p-1 space-y-2">
              <div className="text-center space-y-0.5 border-b border-dashed border-black pb-2">
                <h2 className="text-sm font-bold uppercase">{orgContext.tenantName || 'NAYA-ERA ERP'}</h2>
                <p className="text-[10px] uppercase font-bold mt-1">*** ပစ္စည်းပို့ဆောင်လွှာ (DO) ***</p>
                <p className="text-[9px]">ပို့ဆောင်လွှာအမှတ်: {selectedPrintShipment.shipmentNo}</p>
                <p className="text-[9px]">ရက်စွဲ: {formatDate(selectedPrintShipment.shipmentDate)}</p>
              </div>

              <div className="border-b border-dashed border-black py-1 space-y-0.5 text-[10px]">
                <p>ပို့ဆောင်မည့်နေရာ: <span className="font-bold">{selectedPrintShipment.salesOrder?.customer?.name || 'ဝယ်ယူသူ'}</span></p>
                {selectedPrintShipment.salesOrder?.customer?.address && (
                  <p className="truncate">လိပ်စာ: {selectedPrintShipment.salesOrder.customer.address}</p>
                )}
                <p>အရောင်းအဖွဲ့: {selectedPrintShipment.salesTeam?.name || 'ယာဉ်အဖွဲ့'}</p>
              </div>

              <div className="border-b border-dashed border-black py-1 space-y-1">
                <div className="grid grid-cols-12 font-bold text-[10px] border-b border-dashed border-black pb-1">
                  <span className="col-span-8">ကုန်ပစ္စည်း</span>
                  <span className="col-span-4 text-right">အရေအတွက်</span>
                </div>
                {(selectedPrintShipment.items || []).map((it, i) => (
                  <div key={i} className="grid grid-cols-12 text-[10px] py-0.5">
                    <span className="col-span-8 truncate font-semibold">{it.product?.name || `ပစ္စည်း #${it.productId}`}</span>
                    <span className="col-span-4 text-right font-bold font-mono">{it.qty} {it.uom?.symbol || ''}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 text-[9px] space-y-4 border-t border-dashed border-black">
                <div className="space-y-3">
                  <div>
                    <p>ယာဉ်မောင်း/ပို့ဆောင်သူ လက်မှတ်: _________________</p>
                  </div>
                  <div>
                    <p>ဝယ်ယူလက်ခံသူ လက်မှတ်: _________________</p>
                  </div>
                </div>
                <div className="text-center text-[8px] pt-1">
                  <p>NAYA-ERA Mobile Logistics</p>
                </div>
              </div>
            </div>
          ) : (
            /* 📄 A4 DELIVERY ORDER */
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
                      ဌာနခွဲ: {orgContext.branchName || 'ရုံးချုပ်'} • ကုန်စည်ပို့ဆောင်ရေးဌာန
                    </p>
                    <p className="text-[11px] text-gray-600">
                      တရားဝင် ပစ္စည်းပို့ဆောင်လွှာနှင့် ဂိတ်ဖြတ်လက်မှတ် / Official Delivery Order & Gate Pass
                    </p>
                  </div>

                  <div className="text-right text-xs space-y-0.5">
                    <p className="font-bold font-mono text-sm">ပို့ဆောင်လွှာအမှတ်: {selectedPrintShipment.shipmentNo}</p>
                    <p className="text-gray-600">ပို့ဆောင်သည့်ရက်: {formatDate(selectedPrintShipment.shipmentDate)}</p>
                    <p className="text-gray-600">အခြေအနေ: <span className="font-bold uppercase">{selectedPrintShipment.status}</span></p>
                  </div>
                </div>
              )}

              <div className="text-center py-2 bg-gray-100 border border-gray-300 rounded">
                <h2 className="text-base font-bold uppercase tracking-wide">
                  DELIVERY ORDER & DISPATCH SLIP (DO) / ပစ္စည်းပို့ဆောင်လွှာ
                </h2>
              </div>

              {/* Destination */}
              <div className="grid grid-cols-2 gap-4 text-xs p-3.5 border border-gray-300 rounded bg-gray-50">
                <div className="space-y-1">
                  <p className="font-bold uppercase text-[10px] text-gray-500">ပို့ဆောင်မည့်နေရာ</p>
                  <p className="font-bold text-sm">{selectedPrintShipment.salesOrder?.customer?.name || 'ဝယ်ယူသူ'}</p>
                  <p className="text-gray-600">ဖုန်း: {selectedPrintShipment.salesOrder?.customer?.phoneNumber || '-'}</p>
                  <p className="text-gray-600">လိပ်စာ: {selectedPrintShipment.salesOrder?.customer?.address || '-'}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="font-bold uppercase text-[10px] text-gray-500">ပို့ဆောင်ရေးအဖွဲ့</p>
                  <p className="font-bold text-sm">{selectedPrintShipment.salesTeam?.name || 'ယာဉ်အဖွဲ့'}</p>
                  <p className="text-gray-600">ပို့ဆောင်သူ: {user?.name || 'တာဝန်ခံ'}</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <table className="w-full text-xs border border-gray-300">
                  <thead className="bg-gray-100 border-b border-gray-300 text-[10px] uppercase">
                    <tr>
                      <th className="p-2 text-left w-12">စဉ်</th>
                      <th className="p-2 text-left">ကုန်ပစ္စည်းအမည်</th>
                      <th className="p-2 text-center">ယူနစ်</th>
                      <th className="p-2 text-right">အရေအတွက်</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(selectedPrintShipment.items || []).map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-bold text-center">{idx + 1}</td>
                        <td className="p-2 font-semibold">{it.product?.name || `Product #${it.productId}`}</td>
                        <td className="p-2 text-center text-gray-600">{it.uom?.symbol || ''}</td>
                        <td className="p-2 text-right font-mono font-bold text-sm">{formatQuantity(it.qty)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Signatures */}
              {printConfig.showSignatures && (
                <div className="pt-8 border-t border-gray-300 mt-8 space-y-6">
                  <div className="grid grid-cols-2 gap-12 text-center text-xs">
                    <div className="space-y-8">
                      <p className="font-bold uppercase text-[10px] text-gray-600">ယာဉ်မောင်း / ပို့ဆောင်သူ (Delivery Driver)</p>
                      <div className="border-b border-gray-400 mx-8"></div>
                      <div>
                        <p className="font-semibold">{user?.name || 'ပို့ဆောင်သူ'}</p>
                        <p className="text-[10px] text-gray-500">ရက်စွဲ: ____/____/202___</p>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <p className="font-bold uppercase text-[10px] text-gray-600">ဝယ်ယူလက်ခံသူ (Customer Receiver)</p>
                      <div className="border-b border-gray-400 mx-8"></div>
                      <div>
                        <p className="font-semibold">{selectedPrintShipment.salesOrder?.customer?.name || 'ဝယ်ယူသူ'}</p>
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
