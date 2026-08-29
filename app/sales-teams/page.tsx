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
      error('Failed to load portal data (အချက်အလက် ရယူ၍မရပါ)', err.message);
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
      error('Failed to load team details', err.message);
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
      error('Team name is required (အရောင်းအဖွဲ့အမည် ထည့်သွင်းပါ)');
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
      success('Sales Team Created (အရောင်းအဖွဲ့ အသစ်ဖွဲ့စည်းပြီးပါပြီ)');
      setCreateTeamDialogOpen(false);
      setTeamForm({ name: '', branchId: '' });
      loadPortalData();
    } else {
      error('Failed to create team', res.message);
    }
  };

  // 2. Add Member to Team
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam || !memberForm.userId) {
      error('Please select a valid user (အဖွဲ့ဝင်အဖြစ် ထည့်သွင်းမည့် User ရွေးပါ)');
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
      success('Member Added to Team (အဖွဲ့ဝင် ထည့်သွင်းပြီးပါပြီ)');
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
      error('Failed to add member', res.message);
    }
  };

  // 2b. Register New User & Add as Salesman to Team
  const handleRegisterAndAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;
    if (!newSalesmanForm.name.trim() || !newSalesmanForm.email.trim() || !newSalesmanForm.password) {
      error('Please fill in name, email and password (အမည်၊ အီးမေးလ်နှင့် စကားဝှက် ဖြည့်သွင်းပါ)');
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
      error('Failed to register user account (အကောင့်ဖွင့်မအောင်မြင်ပါ)', userRes.message);
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
        'Salesman Registered & Added to Team! (အရောင်းဝန်ထမ်း အကောင့်ဖွင့်ပြီး အဖွဲ့ဝင်အဖြစ် ထည့်သွင်းပြီးပါပြီ)',
        `Login with Email: ${newSalesmanForm.email}`
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
      error('User registered, but failed to link to team', memberRes.message);
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
      success('Member updated (အဖွဲ့ဝင် အချက်အလက် ပြင်ဆင်ပြီးပါပြီ)');
      inspectTeam(selectedTeam);
      loadPortalData();
    } else {
      error('Update failed', res.message);
    }
  };

  // 4. Remove Member from Team
  const handleRemoveMember = async (memberId: number) => {
    if (!selectedTeam) return;
    const res = await apiFetch(`/api/sales-teams/${selectedTeam.id}/members/${memberId}`, {
      method: 'DELETE',
    });

    if (res.success) {
      success('Member removed from team (အဖွဲ့မှ ဖယ်ရှားပြီးပါပြီ)');
      inspectTeam(selectedTeam);
      loadPortalData();
    } else {
      error('Remove failed', res.message);
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
      error('Please complete all dispatch details (ပို့ဆောင်မှု အချက်အလက်များ ဖြည့်စွက်ပါ)');
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
      success('Shipment Draft Created (ပို့ဆောင်လွှာ မူကြမ်း ဖွင့်ပြီးပါပြီ)');
      setDispatchDialogOpen(false);
      loadPortalData();
      if (selectedTeam) inspectTeam(selectedTeam);
    } else {
      error('Dispatch creation failed', res.message);
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
      description: `Settlement for SO #${order.orderNo}`,
    });
    setSelectedOrder(order);
    setPaymentDialogOpen(true);
  };

  // 8. Submit Customer Payment
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.customerId || Number(paymentForm.amount) <= 0) {
      error('Please enter a valid payment amount (ငွေပမာဏ မှန်ကန်စွာ ထည့်သွင်းပါ)');
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
      success('Payment Recorded & GL Updated! (ဖောက်သည်ထံမှ ငွေလက်ခံစာရင်း သွင်းပြီးပါပြီ)', 'Cash/Bank DR and AR CR journals auto-posted.');
      setPaymentDialogOpen(false);
      loadPortalData();
    } else {
      error('Payment recording failed', res.message);
    }
  };

  // 9. Post Shipment (GL Sync)
  const handlePostShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetShipmentForPost || !postWarehouseId) {
      error('Please select source warehouse (ထုတ်ယူမည့် ဂိုဒေါင် ရွေးပါ)');
      return;
    }

    const res = await apiFetch(`/api/sales/sales-shipments/${targetShipmentForPost.id}/post`, {
      method: 'PUT',
      body: JSON.stringify({ warehouseId: Number(postWarehouseId) }),
    });

    if (res.success) {
      success('Shipment Delivered & GL Synchronized (ပစ္စည်းပို့ဆောင်ပြီး စာရင်းချုပ်ပြီးပါပြီ)', 'Stock deducted, AR & Revenue posted to ledger.');
      setPostShipmentDialogOpen(false);
      setTargetShipmentForPost(null);
      loadPortalData();
      if (selectedTeam) inspectTeam(selectedTeam);
    } else {
      error('Post shipment failed', res.message);
    }
  };

  // ─── COLUMNS CONFIGURATION ──────────────────────────────────────

  // My Orders Columns
  const myOrderColumns: Column<SalesOrder>[] = [
    {
      header: 'Order No',
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
      header: 'Customer & Contact',
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
      header: 'Total Value',
      cell: r => {
        const total = (r.items || []).reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
        return <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{formatCurrency(total)}</span>;
      },
    },
    {
      header: 'Status',
      cell: r => <StatusBadge status={r.status} />,
    },
    {
      header: 'Fulfillment & Actions',
      className: 'text-right',
      cell: r => (
        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenPrintOrder(r)}
            className="h-7 text-xs text-zinc-600 hover:text-blue-600"
            title="Print Sales Invoice (အရောင်းပြေစာ ပရင့်ထုတ်ပါ)"
          >
            <Printer className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => inspectOrder(r)}
            className="h-7 text-xs"
            title="Inspect Order"
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
              <span>Dispatch</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenPayment(r)}
            className="h-7 text-xs gap-1 text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
          >
            <DollarSign className="h-3.5 w-3.5" />
            <span>Collect Pay</span>
          </Button>
        </div>
      ),
    },
  ];

  // Team Performance Leaderboard Columns
  const leaderboardColumns: Column<TeamPerformanceOverview>[] = [
    {
      header: 'Sales Team (အရောင်းအဖွဲ့)',
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
            <div className="text-[10px] text-zinc-400">{r.activeMembers} active member(s)</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Assigned Orders',
      accessorKey: 'totalAssignedOrders',
      sortable: true,
      cell: r => <span className="font-mono font-semibold">{r.totalAssignedOrders}</span>,
    },
    {
      header: 'Fully Shipped',
      accessorKey: 'fullyShippedOrders',
      sortable: true,
      cell: r => <span className="font-mono font-semibold text-emerald-600">{r.fullyShippedOrders}</span>,
    },
    {
      header: 'Total Shipments',
      accessorKey: 'totalShipments',
      sortable: true,
      cell: r => <span className="font-mono font-semibold text-blue-600">{r.totalShipments}</span>,
    },
    {
      header: 'Fulfillment Rate (ပြီးစီးမှု)',
      accessorKey: 'fulfillmentRate',
      sortable: true,
      cell: r => (
        <div className="flex items-center gap-2 min-w-[130px]">
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full ${
                r.fulfillmentRate >= 80 ? 'bg-emerald-500' : r.fulfillmentRate >= 50 ? 'bg-amber-500' : 'bg-blue-500'
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
      header: 'Actions',
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
            <Eye className="h-3.5 w-3.5" /> Manage Team
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
                {r.activeMembers} active member{r.activeMembers !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <Badge
            variant={r.fulfillmentRate >= 80 ? 'default' : 'secondary'}
            className={`text-[10px] px-2 py-0.5 shrink-0 ${
              r.fulfillmentRate >= 80 ? 'bg-emerald-600 text-white' : ''
            }`}
          >
            {r.fulfillmentRate}% Fulfilled
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all ${
                r.fulfillmentRate >= 80
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
            <span className="text-[10px] uppercase font-semibold text-zinc-400">Assigned</span>
            <p className="font-mono font-bold text-zinc-800 dark:text-zinc-200">
              {r.totalAssignedOrders}
            </p>
          </div>
          <div className="space-y-0.5 border-x border-zinc-200 dark:border-zinc-700/60">
            <span className="text-[10px] uppercase font-semibold text-zinc-400">Shipped</span>
            <p className="font-mono font-bold text-blue-600 dark:text-blue-400">
              {r.totalShipments}
            </p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-semibold text-zinc-400">Delivered</span>
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
            <Eye className="h-3.5 w-3.5" /> Manage Team (အဖွဲ့စီမံရန်)
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
            <span className="truncate">Sales Teams & Salesman Operations (အရောင်းအဖွဲ့နှင့် လုပ်ငန်းခွင်)</span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
            Dedicated portal for Salesmen & Team Leaders: Orders, deliveries, collections & performance
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button variant="outline" size="sm" onClick={loadPortalData} className="gap-1.5 h-8 text-xs shrink-0">
            <RefreshCw className={isLoading ? 'animate-spin h-3.5 w-3.5' : 'h-3.5 w-3.5'} />
            <span className="hidden sm:inline">Refresh (ပြန်ဖွင့်)</span>
            <span className="sm:hidden">Refresh</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCreateTeamDialogOpen(true)}
            className="gap-1.5 h-8 text-xs bg-blue-600 hover:bg-blue-700 shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">+ New Sales Team (အရောင်းအဖွဲ့သစ်)</span>
            <span className="sm:hidden">+ Team</span>
          </Button>
        </div>
      </div>

      {/* ─── MAIN TABS ─────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0">
          <TabsList className="w-max sm:w-full justify-start">
            <TabsTrigger value="my-orders" count={myOrders.length}>
              📋 My Assigned Orders (ကျွန်ုပ်တာဝန်ကျ အမှာစာများ)
            </TabsTrigger>
            <TabsTrigger value="teams" count={saleTeams.length}>
              👥 Sales Teams & Members (အရောင်းအဖွဲ့များ)
            </TabsTrigger>
            <TabsTrigger value="leaderboard" count={teamPerformances.length}>
              🏆 Performance Leaderboard (စွမ်းဆောင်ရည် နှိုင်းယှဉ်ချက်)
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
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">My Assigned Orders (တာဝန်ကျအမှာစာ)</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono">{myOrders.length}</p>
                  <p className="text-[11px] text-zinc-400">Total orders routed to your team</p>
                </div>
                <div className="rounded-xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Pending Dispatch (ပို့ဆောင်ရန် ကျန်ရှိ)</p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">{myPendingDispatch}</p>
                  <p className="text-[11px] text-emerald-600 font-medium">{myFulfilledOrders} orders fully delivered</p>
                </div>
                <div className="rounded-xl bg-amber-50 p-3 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                  <Truck className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Total Sales Value (စုစုပေါင်း ရောင်းရငွေ)</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">{formatCurrency(myTotalValue)}</p>
                  <p className="text-[11px] text-zinc-400">Total monetary value of assigned orders</p>
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
              searchPlaceholder="Search my orders by SO# or customer..."
              searchKey="orderNo"
              isLoading={isLoading}
              onRowClick={r => inspectOrder(r)}
            />
          </div>

          {/* Mobile Card List View for Salesmen on Phone */}
          <div className="sm:hidden space-y-3">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-zinc-400">Loading orders...</div>
            ) : myOrders.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-500">
                No assigned orders found for your team.
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
                          <span className="truncate max-w-[180px]">{order.customer?.address || 'Customer Location'}</span>
                          <a
                            href={`tel:${order.customer.phoneNumber}`}
                            className="inline-flex items-center gap-1 font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md text-[11px]"
                          >
                            <Phone className="h-3 w-3" /> Call Customer
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
                          title="Print Receipt"
                        >
                          <Printer className="h-3.5 w-3.5" />
                          <span className="text-xs">Print</span>
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => inspectOrder(order)}
                          className="h-8 text-xs gap-1"
                        >
                          <Eye className="h-3.5 w-3.5" /> View
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
                            <Truck className="h-3.5 w-3.5" /> Dispatch
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenPayment(order)}
                          className="h-8 text-xs gap-1 text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                        >
                          <DollarSign className="h-3.5 w-3.5" /> Collect
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
                        <p className="text-[11px] text-zinc-500">Branch: {team.branch?.name || 'Head Office'}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      #{team.id}
                    </Badge>
                  </CardHeader>

                  <CardContent className="p-4 pt-2 space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-zinc-100 dark:border-zinc-800/80">
                      <div>
                        <span className="text-zinc-500 block text-[10px]">Active Members</span>
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">
                          {perf?.activeMembers ?? 0} members
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[10px]">Assigned Orders</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {perf?.totalAssignedOrders ?? 0} orders
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-500">Fulfillment Rate</span>
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
                      View Team Details & Members →
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
            searchPlaceholder="Search team performance (စွမ်းဆောင်ရည်ရှာရန်)..."
            searchKey="teamName"
            isLoading={isLoading}
            renderCard={renderLeaderboardCard}
          />
        </TabsContent>
      </Tabs>

      {/* ─── SHEET: TEAM DETAILS & MEMBER MANAGEMENT ───────────────── */}
      <Sheet open={teamSheetOpen} onOpenChange={setTeamSheetOpen} title={selectedTeam?.name || 'Sales Team Details'} width="xl">
        {selectedTeam && (
          <div className="space-y-5">
            {/* Header info */}
            <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900/60 p-4 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{selectedTeam.name}</h3>
                <p className="text-xs text-zinc-500">Branch: {selectedTeam.branch?.name || 'Head Office (Mandalay)'}</p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setAddMemberDialogOpen(true)}
                className="gap-1 text-xs bg-blue-600"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>+ Add Member</span>
              </Button>
            </div>

            {/* Team Tabs */}
            <Tabs value={teamDetailTab} onValueChange={setTeamDetailTab}>
              <TabsList className="bg-zinc-100 dark:bg-zinc-800">
                <TabsTrigger value="members" count={teamMembers.length}>
                  Members (အဖွဲ့ဝင်များ)
                </TabsTrigger>
                <TabsTrigger value="orders" count={teamOrders.length}>
                  Orders (အမှာစာများ)
                </TabsTrigger>
                <TabsTrigger value="shipments" count={teamShipments.length}>
                  Shipments (ပို့ဆောင်မှုများ)
                </TabsTrigger>
                <TabsTrigger value="kpis">
                  KPIs & Analytics
                </TabsTrigger>
              </TabsList>

              {/* Members List */}
              <TabsContent value="members" className="space-y-3 pt-2">
                {teamMembers.length === 0 ? (
                  <div className="text-center py-8 text-xs text-zinc-400">
                    No members in this team yet. Click &quot;+ Add Member&quot; to assign staff.
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
                                LEADER (ခေါင်းဆောင်)
                              </Badge>
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-400 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                            <span>📧 {m.user?.email}</span>
                            {m.user?.phoneNumber && <span>📞 {m.user.phoneNumber}</span>}
                            <span>• Joined: {formatDate(m.joinedDate)}</span>
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
                          {m.role === 'LEADER' ? 'Make Member' : 'Make Leader'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(m.id)}
                          className="h-6 text-[10px] text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 px-2"
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
                      <div className="text-zinc-500">Date: {formatDate(sh.shipmentDate)}</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenPrintShipment(sh)}
                        className="h-6 text-[10px] text-zinc-600 dark:text-zinc-300 gap-1 hover:text-emerald-600 px-2"
                        title="Print Delivery Slip"
                      >
                        <Printer className="h-3 w-3" />
                        <span>Print DO</span>
                      </Button>
                      <StatusBadge status={sh.status} />
                      {sh.status === 'DRAFT' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setTargetShipmentForPost(sh);
                            setPostWarehouseId(warehouses[0]?.id ? String(warehouses[0].id) : '');
                            setPostShipmentDialogOpen(true);
                          }}
                          className="h-6 text-[10px] bg-emerald-600"
                        >
                          Post & GL Sync
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
                      <span className="text-zinc-500 block text-[10px]">Total Assigned Orders</span>
                      <span className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
                        {teamKpi.summary.totalAssignedOrders}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                      <span className="text-zinc-500 block text-[10px]">Fully Shipped Orders</span>
                      <span className="text-xl font-bold font-mono text-emerald-600">
                        {teamKpi.summary.fullyShippedOrders}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                      <span className="text-zinc-500 block text-[10px]">Total Shipments</span>
                      <span className="text-xl font-bold font-mono text-blue-600">
                        {teamKpi.summary.totalShipments}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                      <span className="text-zinc-500 block text-[10px]">Fulfillment Rate</span>
                      <span className="text-xl font-bold font-mono text-purple-600">
                        {teamKpi.summary.fulfillmentRate}%
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-zinc-400 text-xs">Loading KPIs...</div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </Sheet>

      {/* ─── SHEET: ORDER INSPECTION ───────────────────────────────── */}
      <Sheet open={orderSheetOpen} onOpenChange={setOrderSheetOpen} title={selectedOrder ? `Sales Order ${selectedOrder.orderNo}` : 'Order Details'} width="xl">
        {selectedOrder && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <div>
                <span className="text-zinc-500 block text-[10px]">Customer (ဝယ်ယူသူ)</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{selectedOrder.customer?.name}</span>
                {selectedOrder.customer?.phoneNumber && (
                  <p className="text-[11px] text-zinc-500">{selectedOrder.customer.phoneNumber}</p>
                )}
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">Status</span>
                <StatusBadge status={selectedOrder.status} />
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">Order Date</span>
                <span>{formatDate(selectedOrder.orderDate)}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">Delivery Target Date</span>
                <span>{selectedOrder.deliveryDate ? formatDate(selectedOrder.deliveryDate) : '-'}</span>
              </div>
            </div>

            {/* Items Breakdown */}
            <div>
              <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-2">Order Items (မှာယူထားသော ပစ္စည်းများ)</h4>
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-zinc-100 dark:bg-zinc-800/60 text-[10px] text-zinc-500 uppercase">
                    <tr>
                      <th className="p-2">Product</th>
                      <th className="p-2 text-right">Qty</th>
                      <th className="p-2 text-right">Rate</th>
                      <th className="p-2 text-right">Amount</th>
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
                <Printer className="h-3.5 w-3.5" /> Print Invoice (ပြေစာ ပရင့်ထုတ်ပါ)
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
                  <Truck className="h-3.5 w-3.5" /> Dispatch Shipment (ပစ္စည်းပို့ဆောင်လွှာဖွင့်ရန်)
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
                <DollarSign className="h-3.5 w-3.5" /> Collect Payment (ငွေကောက်ခံရန်)
              </Button>
            </div>
          </div>
        )}
      </Sheet>

      {/* ─── MODAL: CREATE SALES TEAM ──────────────────────────────── */}
      <Dialog open={createTeamDialogOpen} onOpenChange={setCreateTeamDialogOpen} title="Create Sales Team (အရောင်းအဖွဲ့ အသစ်ဖွဲ့စည်းရန်)" maxWidth="md">
        <form onSubmit={handleCreateTeam} className="space-y-4">
          <Input
            label="Team Name (အဖွဲ့အမည်) *"
            placeholder="e.g. Yangon Route A, Mandalay Wholesale"
            value={teamForm.name}
            onChange={e => setTeamForm({ ...teamForm, name: e.target.value })}
            required
          />

          <Select
            label="Branch (ဘဏ်ခွဲ / လုပ်ငန်းတည်နေရာ)"
            value={teamForm.branchId}
            onChange={e => setTeamForm({ ...teamForm, branchId: e.target.value })}
          >
            <option value="">Default Branch ({orgContext.branchName})</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code})
              </option>
            ))}
          </Select>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setCreateTeamDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create Team
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── MODAL: ADD TEAM MEMBER ────────────────────────────────── */}
      <Dialog
        open={addMemberDialogOpen}
        onOpenChange={setAddMemberDialogOpen}
        title={selectedTeam ? `Add Member to ${selectedTeam.name} (အဖွဲ့ဝင်ထည့်ရန်)` : 'Add Team Member (အဖွဲ့ဝင်ထည့်ရန်)'}
        maxWidth="lg"
      >
        <div className="space-y-4">
          {/* Sub-tabs for Add Member */}
          <div className="flex border-b border-zinc-200 dark:border-zinc-800 -mx-1 overflow-x-auto pb-0.5">
            <button
              type="button"
              onClick={() => setAddMemberTab('select')}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                addMemberTab === 'select'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              👥 Select Existing Staff (ရှိပြီးသား ဝန်ထမ်းရွေးရန်)
            </button>
            <button
              type="button"
              onClick={() => setAddMemberTab('register')}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                addMemberTab === 'register'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              ✨ + Register New Salesman (အရောင်းဝန်ထမ်းသစ် ဖွင့်ရန်)
            </button>
          </div>

          {/* TAB 1: SELECT EXISTING STAFF USER */}
          {addMemberTab === 'select' && (
            <form onSubmit={handleAddMember} className="space-y-3.5 pt-1">
              <Select
                label="Select Staff Member (ဝန်ထမ်း ရွေးချယ်ပါ) *"
                value={memberForm.userId}
                onChange={e => setMemberForm({ ...memberForm, userId: e.target.value })}
                required
              >
                <option value="">Choose staff user...</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} — {u.email} {u.phoneNumber ? `(${u.phoneNumber})` : ''}
                  </option>
                ))}
              </Select>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  label="Team Role (တာဝန်/ရာထူး) *"
                  value={memberForm.role}
                  onChange={e => setMemberForm({ ...memberForm, role: e.target.value as 'LEADER' | 'MEMBER' })}
                  required
                >
                  <option value="MEMBER">MEMBER (အရောင်းဝန်ထမ်း)</option>
                  <option value="LEADER">LEADER (အဖွဲ့ခေါင်းဆောင်)</option>
                </Select>

                <Input
                  type="date"
                  label="Joined Date (စတင်သည့်ရက်) *"
                  value={memberForm.joinedDate}
                  onChange={e => setMemberForm({ ...memberForm, joinedDate: e.target.value })}
                  required
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <Button type="button" variant="outline" onClick={() => setAddMemberDialogOpen(false)} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button type="submit" variant="primary" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                  Add to Team (အဖွဲ့ထဲထည့်မည်)
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
                  <span>Instant Account Creation & Login Access</span>
                </p>
                <p className="text-[11px] leading-relaxed text-blue-600 dark:text-blue-400">
                  ဤနေရာတွင် အကောင့်ဖွင့်ပေးလိုက်ပါက အဆိုပါ ဝန်ထမ်းသည် <strong>Tenant ID: {orgContext.tenantId}</strong>၊ ဖြည့်သွင်းခဲ့သော <strong>Email</strong> နှင့် <strong>Password</strong> ဖြင့် စနစ်ထဲသို့ တိုက်ရိုက် Login ဝင်ရောက်နိုင်မည် ဖြစ်သည်။
                </p>
              </div>

              <Input
                label="Full Name (ဝန်ထမ်းအမည်) *"
                placeholder="e.g. Ko Kyaw Kyaw, Ma Hla Hla"
                value={newSalesmanForm.name}
                onChange={e => setNewSalesmanForm({ ...newSalesmanForm, name: e.target.value })}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  type="email"
                  label="Login Email (အီးမေးလ်) *"
                  placeholder="e.g. kyawkyaw@naya.com"
                  value={newSalesmanForm.email}
                  onChange={e => setNewSalesmanForm({ ...newSalesmanForm, email: e.target.value })}
                  required
                />

                <Input
                  type="password"
                  label="Password (စကားဝှက်) *"
                  placeholder="Min 6 characters"
                  value={newSalesmanForm.password}
                  onChange={e => setNewSalesmanForm({ ...newSalesmanForm, password: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Phone Number (ဖုန်းနံပါတ်)"
                  placeholder="e.g. 09123456789"
                  value={newSalesmanForm.phoneNumber}
                  onChange={e => setNewSalesmanForm({ ...newSalesmanForm, phoneNumber: e.target.value })}
                />

                <Input
                  label="Address / Township (လိပ်စာ/မြို့နယ်)"
                  placeholder="e.g. Chanayethazan, Mandalay"
                  value={newSalesmanForm.address}
                  onChange={e => setNewSalesmanForm({ ...newSalesmanForm, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Select
                  label="Branch (ဘဏ်ခွဲ / ဌာနခွဲ)"
                  value={newSalesmanForm.branchId}
                  onChange={e => setNewSalesmanForm({ ...newSalesmanForm, branchId: e.target.value })}
                >
                  <option value="">Default Branch ({orgContext.branchName})</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </Select>

                <Select
                  label="Role in Team (ရာထူး) *"
                  value={newSalesmanForm.role}
                  onChange={e => setNewSalesmanForm({ ...newSalesmanForm, role: e.target.value as 'LEADER' | 'MEMBER' })}
                  required
                >
                  <option value="MEMBER">MEMBER (အရောင်းဝန်ထမ်း)</option>
                  <option value="LEADER">LEADER (အဖွဲ့ခေါင်းဆောင်)</option>
                </Select>

                <Input
                  type="date"
                  label="Joined Date (စတင်သည့်ရက်) *"
                  value={newSalesmanForm.joinedDate}
                  onChange={e => setNewSalesmanForm({ ...newSalesmanForm, joinedDate: e.target.value })}
                  required
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <Button type="button" variant="outline" onClick={() => setAddMemberDialogOpen(false)} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button type="submit" variant="primary" className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700">
                  Register & Add to Team (အကောင့်ဖွင့်၍ အဖွဲ့သွင်းမည်)
                </Button>
              </div>
            </form>
          )}
        </div>
      </Dialog>

      {/* ─── MODAL: DISPATCH SHIPMENT ──────────────────────────────── */}
      <Dialog open={dispatchDialogOpen} onOpenChange={setDispatchDialogOpen} title="Dispatch Shipment (ပစ္စည်းပို့ဆောင်လွှာ ဖွင့်ရန်)" maxWidth="lg">
        <form onSubmit={handleSubmitDispatch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Source Warehouse (ထုတ်ယူမည့် ဂိုဒေါင်) *"
              value={dispatchForm.warehouseId}
              onChange={e => setDispatchForm({ ...dispatchForm, warehouseId: e.target.value })}
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
              label="Shipment Date (ပို့ဆောင်သည့်ရက်) *"
              value={dispatchForm.shipmentDate}
              onChange={e => setDispatchForm({ ...dispatchForm, shipmentDate: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
              Items to Dispatch (ပို့ဆောင်မည့် ပစ္စည်းပမာဏများ)
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

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setDispatchDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="bg-blue-600">
              Create Shipment Draft
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── MODAL: COLLECT CUSTOMER PAYMENT ───────────────────────── */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen} title="Collect Customer Payment (ဖောက်သည်ထံမှ ငွေလက်ခံစာရင်း သွင်းရန်)" maxWidth="md">
        <form onSubmit={handleSubmitPayment} className="space-y-4">
          <Select
            label="Customer (ဝယ်ယူသူ) *"
            value={paymentForm.customerId}
            onChange={e => setPaymentForm({ ...paymentForm, customerId: e.target.value })}
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
            type="number"
            min={1}
            label="Payment Amount (လက်ခံရရှိငွေပမာဏ - MMK) *"
            value={paymentForm.amount}
            onChange={e => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Payment Method (ငွေပေးချေမှုပုံစံ) *"
              value={paymentForm.paymentMethod}
              onChange={e => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value as any })}
              required
            >
              <option value="CASH">CASH (လက်ငင်းငွေသား)</option>
              <option value="BANK">BANK (ဘဏ်လွှဲငွေ)</option>
              <option value="OTHER">OTHER (အခြား)</option>
            </Select>

            <Input
              type="date"
              label="Payment Date (ရက်စွဲ) *"
              value={paymentForm.paymentDate}
              onChange={e => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
              required
            />
          </div>

          <Input
            label="Notes / Voucher Ref (မှတ်ချက် / ပြေစာအမှတ်)"
            placeholder="e.g. KBZPay transfer ref, Cash voucher #12"
            value={paymentForm.description}
            onChange={e => setPaymentForm({ ...paymentForm, description: e.target.value })}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="bg-emerald-600 hover:bg-emerald-700">
              Record Payment & Post GL
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── MODAL: POST SHIPMENT WAREHOUSE SELECT ──────────────────── */}
      <Dialog open={postShipmentDialogOpen} onOpenChange={setPostShipmentDialogOpen} title="Confirm Shipment Delivery & GL Posting" maxWidth="sm">
        <form onSubmit={handlePostShipment} className="space-y-4">
          <p className="text-xs text-zinc-500">
            Confirming this shipment will deduct stock quantities and auto-post Accounts Receivable & Revenue entries to General Ledger.
          </p>

          <Select
            label="Source Warehouse (ထုတ်ယူမည့် ဂိုဒေါင်) *"
            value={postWarehouseId}
            onChange={e => setPostWarehouseId(e.target.value)}
            required
          >
            <option value="">Select Warehouse...</option>
            {warehouses.map(w => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </Select>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setPostShipmentDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="bg-emerald-600">
              Confirm & Post GL
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── PRINT CUSTOMIZER DIALOG ─────────────────────────────────── */}
      <Dialog
        open={printDialogOpen}
        onOpenChange={setPrintDialogOpen}
        title={printType === 'INVOICE' ? 'Print Sales Invoice / Receipt' : 'Print Delivery Order (DO)'}
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          <div className="space-y-2">
            <label className="font-semibold text-zinc-700 dark:text-zinc-300">
              Select Output Document Format (ပုံနှိပ်မည့် ပုံစံရွေးချယ်ပါ)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setPrintConfig({ ...printConfig, paperSize: 'THERMAL_80MM' })}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  printConfig.paperSize === 'THERMAL_80MM'
                    ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Receipt className="h-4 w-4 text-emerald-600" />
                  <span>🧾 80mm Mobile Bluetooth Thermal Slip</span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Optimized for portable handheld van receipt printers, mobile salesmen, and instant customer bills.
                </p>
              </div>

              <div
                onClick={() => setPrintConfig({ ...printConfig, paperSize: 'A4' })}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  printConfig.paperSize === 'A4'
                    ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Scale className="h-4 w-4 text-blue-600" />
                  <span>📄 A4 Formal Commercial Document</span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Official multi-column page with letterhead, item breakdown, and 3-column verification seals.
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
                Include Signatures & Verification Block (အရောင်းဝန်ထမ်း/ပစ္စည်းပို့သူ/ဖောက်သည် လက်မှတ်များ)
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
                <p className="text-[10px]">{orgContext.branchName || 'Sales Division'}</p>
                <p className="text-[10px] uppercase font-bold mt-1">*** SALES BILL / INVOICE ***</p>
                <p className="text-[9px]">SO#: {selectedPrintOrder.orderNo}</p>
                <p className="text-[9px]">Date: {formatDate(selectedPrintOrder.orderDate)}</p>
              </div>

              <div className="border-b border-dashed border-black py-1 space-y-0.5 text-[10px]">
                <p>Customer: <span className="font-bold">{selectedPrintOrder.customer?.name || 'Customer'}</span></p>
                {selectedPrintOrder.customer?.phoneNumber && <p>Phone: {selectedPrintOrder.customer.phoneNumber}</p>}
                {selectedPrintOrder.customer?.address && <p className="truncate">Address: {selectedPrintOrder.customer.address}</p>}
                <p>Salesman: {user?.name || 'Sales Staff'}</p>
              </div>

              <div className="border-b border-dashed border-black py-1 space-y-1">
                <div className="grid grid-cols-12 font-bold text-[10px] border-b border-dashed border-black pb-1">
                  <span className="col-span-7">ITEM</span>
                  <span className="col-span-2 text-right">QTY</span>
                  <span className="col-span-3 text-right">AMOUNT</span>
                </div>
                {(selectedPrintOrder.items || []).map((it, i) => (
                  <div key={i} className="grid grid-cols-12 text-[10px] py-0.5">
                    <div className="col-span-7 truncate">
                      <p className="font-bold">{it.product?.name || `Item #${it.productId}`}</p>
                      <p className="text-[9px] text-gray-700 font-normal">@{formatCurrency(it.rate)} {it.isFoc ? '(FOC)' : ''}</p>
                    </div>
                    <span className="col-span-2 text-right font-bold">{it.qty} {it.uom?.symbol || it.uom?.name || ''}</span>
                    <span className="col-span-3 text-right font-bold">{it.isFoc ? '0' : formatCurrency(it.amount)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 py-1 text-[10px]">
                <div className="flex justify-between font-bold text-xs">
                  <span>TOTAL PAYABLE:</span>
                  <span>
                    {formatCurrency(
                      (selectedPrintOrder.items || []).reduce((s, it) => s + (it.isFoc ? 0 : Number(it.amount || 0)), 0)
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-[9px]">
                  <span>Status:</span>
                  <span className="uppercase font-bold">{selectedPrintOrder.status}</span>
                </div>
              </div>

              <div className="pt-3 text-[9px] space-y-4 border-t border-dashed border-black">
                <div className="space-y-3">
                  <div>
                    <p>Salesman Sign: _________________</p>
                  </div>
                  <div>
                    <p>Customer Received: _________________</p>
                  </div>
                </div>
                <div className="text-center text-[8px] pt-1">
                  <p>Thank You For Ordering!</p>
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
                      Branch: {orgContext.branchName || 'Head Office'} • Field Operations
                    </p>
                    <p className="text-[11px] text-gray-600">
                      Official Commercial Sales Bill & Order Invoice
                    </p>
                  </div>

                  <div className="text-right text-xs space-y-0.5">
                    <p className="font-bold font-mono text-sm">INVOICE NO: {selectedPrintOrder.orderNo}</p>
                    <p className="text-gray-600">Order Date: {formatDate(selectedPrintOrder.orderDate)}</p>
                    <p className="text-gray-600">Delivery Target: {formatDate(selectedPrintOrder.deliveryDate)}</p>
                    <p className="text-gray-600">Status: <span className="font-bold uppercase">{selectedPrintOrder.status}</span></p>
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
                  <p className="font-bold uppercase text-[10px] text-gray-500">Customer Details</p>
                  <p className="font-bold text-sm">{selectedPrintOrder.customer?.name || 'Customer'}</p>
                  <p className="text-gray-600">Phone: {selectedPrintOrder.customer?.phoneNumber || '-'}</p>
                  <p className="text-gray-600">Address: {selectedPrintOrder.customer?.address || '-'}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="font-bold uppercase text-[10px] text-gray-500">Sales Representative</p>
                  <p className="font-bold text-sm">{user?.name || 'Sales Officer'}</p>
                  <p className="text-gray-600">Email: {user?.email || '-'}</p>
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-2">
                <table className="w-full text-xs border border-gray-300">
                  <thead className="bg-gray-100 border-b border-gray-300 text-[10px] uppercase">
                    <tr>
                      <th className="p-2 text-left w-12">No.</th>
                      <th className="p-2 text-left">Item Description</th>
                      <th className="p-2 text-center">Unit</th>
                      <th className="p-2 text-right">Qty</th>
                      <th className="p-2 text-right">Unit Price (MMK)</th>
                      <th className="p-2 text-right">Amount (MMK)</th>
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
                      <td colSpan={5} className="p-2 text-right uppercase">Net Total (စုစုပေါင်း ကျသင့်ငွေ):</td>
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
                      <p className="font-bold uppercase text-[10px] text-gray-600">Salesman (အရောင်းစာရေး)</p>
                      <div className="border-b border-gray-400 mx-8"></div>
                      <div>
                        <p className="font-semibold">{user?.name || 'Sales Staff'}</p>
                        <p className="text-[10px] text-gray-500">Date: ____/____/202___</p>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <p className="font-bold uppercase text-[10px] text-gray-600">Customer Received By (ဝယ်ယူသူ)</p>
                      <div className="border-b border-gray-400 mx-8"></div>
                      <div>
                        <p className="font-semibold">{selectedPrintOrder.customer?.name || 'Customer'}</p>
                        <p className="text-[10px] text-gray-500">Date: ____/____/202___</p>
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
                <p className="text-[10px] uppercase font-bold mt-1">*** DELIVERY ORDER (DO) ***</p>
                <p className="text-[9px]">DO#: {selectedPrintShipment.shipmentNo}</p>
                <p className="text-[9px]">Date: {formatDate(selectedPrintShipment.shipmentDate)}</p>
              </div>

              <div className="border-b border-dashed border-black py-1 space-y-0.5 text-[10px]">
                <p>Deliver To: <span className="font-bold">{selectedPrintShipment.salesOrder?.customer?.name || 'Customer'}</span></p>
                {selectedPrintShipment.salesOrder?.customer?.address && (
                  <p className="truncate">Address: {selectedPrintShipment.salesOrder.customer.address}</p>
                )}
                <p>Team: {selectedPrintShipment.salesTeam?.name || 'Van Unit'}</p>
              </div>

              <div className="border-b border-dashed border-black py-1 space-y-1">
                <div className="grid grid-cols-12 font-bold text-[10px] border-b border-dashed border-black pb-1">
                  <span className="col-span-8">PRODUCT</span>
                  <span className="col-span-4 text-right">QTY</span>
                </div>
                {(selectedPrintShipment.items || []).map((it, i) => (
                  <div key={i} className="grid grid-cols-12 text-[10px] py-0.5">
                    <span className="col-span-8 truncate font-semibold">{it.product?.name || `Product #${it.productId}`}</span>
                    <span className="col-span-4 text-right font-bold font-mono">{it.qty} {it.uom?.symbol || ''}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 text-[9px] space-y-4 border-t border-dashed border-black">
                <div className="space-y-3">
                  <div>
                    <p>Driver / Delivery Sign: _________________</p>
                  </div>
                  <div>
                    <p>Customer Receiver Sign: _________________</p>
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
                      Branch: {orgContext.branchName || 'Head Office'} • Logistics Division
                    </p>
                    <p className="text-[11px] text-gray-600">
                      Official Delivery Order & Gate Pass
                    </p>
                  </div>

                  <div className="text-right text-xs space-y-0.5">
                    <p className="font-bold font-mono text-sm">DO NO: {selectedPrintShipment.shipmentNo}</p>
                    <p className="text-gray-600">Dispatch Date: {formatDate(selectedPrintShipment.shipmentDate)}</p>
                    <p className="text-gray-600">Status: <span className="font-bold uppercase">{selectedPrintShipment.status}</span></p>
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
                  <p className="font-bold uppercase text-[10px] text-gray-500">Destination</p>
                  <p className="font-bold text-sm">{selectedPrintShipment.salesOrder?.customer?.name || 'Customer'}</p>
                  <p className="text-gray-600">Phone: {selectedPrintShipment.salesOrder?.customer?.phoneNumber || '-'}</p>
                  <p className="text-gray-600">Address: {selectedPrintShipment.salesOrder?.customer?.address || '-'}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="font-bold uppercase text-[10px] text-gray-500">Logistics Unit</p>
                  <p className="font-bold text-sm">{selectedPrintShipment.salesTeam?.name || 'Field Fleet'}</p>
                  <p className="text-gray-600">Driver/Officer: {user?.name || 'Staff'}</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <table className="w-full text-xs border border-gray-300">
                  <thead className="bg-gray-100 border-b border-gray-300 text-[10px] uppercase">
                    <tr>
                      <th className="p-2 text-left w-12">No.</th>
                      <th className="p-2 text-left">Product Name</th>
                      <th className="p-2 text-center">Unit</th>
                      <th className="p-2 text-right">Quantity</th>
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
                      <p className="font-bold uppercase text-[10px] text-gray-600">Delivery Driver / Salesman (ပို့ဆောင်သူ)</p>
                      <div className="border-b border-gray-400 mx-8"></div>
                      <div>
                        <p className="font-semibold">{user?.name || 'Driver'}</p>
                        <p className="text-[10px] text-gray-500">Date: ____/____/202___</p>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <p className="font-bold uppercase text-[10px] text-gray-600">Customer Receiver (လက်ခံရရှိသူ)</p>
                      <div className="border-b border-gray-400 mx-8"></div>
                      <div>
                        <p className="font-semibold">{selectedPrintShipment.salesOrder?.customer?.name || 'Customer'}</p>
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
