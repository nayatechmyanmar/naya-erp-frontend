'use client';

import * as React from 'react';
import {
  Landmark,
  Plus,
  Receipt,
  Scale,
  CalendarDays,
  Lock,
  Eye,
  CheckCircle2,
  RefreshCw,
  Printer,
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
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Payment,
  DailyClosing,
  Account,
  JournalEntry,
  Customer,
  Supplier,
  PaymentType,
  PaymentMethod,
  AccountType,
} from '@/types/erp';

export default function AccountingPage() {
  const { user, orgContext } = useAuth();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = React.useState('accounts');
  const [isLoading, setIsLoading] = React.useState(true);

  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [dailyClosings, setDailyClosings] = React.useState<DailyClosing[]>([]);
  const [journalEntries, setJournalEntries] = React.useState<JournalEntry[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);

  // Filter States
  const [accountTypeFilter, setAccountTypeFilter] = React.useState<string>('ALL');

  // Dialog & Sheet States
  const [accountDialogOpen, setAccountDialogOpen] = React.useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = React.useState(false);
  const [closingDialogOpen, setClosingDialogOpen] = React.useState(false);
  const [closeRegisterDialogOpen, setCloseRegisterDialogOpen] = React.useState(false);
  const [selectedClosing, setSelectedClosing] = React.useState<DailyClosing | null>(null);
  const [selectedPayment, setSelectedPayment] = React.useState<Payment | null>(null);
  const [selectedJe, setSelectedJe] = React.useState<JournalEntry | null>(null);
  const [jeSheetOpen, setJeSheetOpen] = React.useState(false);
  const [paymentSheetOpen, setPaymentSheetOpen] = React.useState(false);

  // Document Printing States
  const [printDialogOpen, setPrintDialogOpen] = React.useState(false);
  const [selectedPrintPayment, setSelectedPrintPayment] = React.useState<Payment | null>(null);
  const [printConfig, setPrintConfig] = React.useState<{
    paperSize: 'A4' | 'THERMAL_80MM';
    showLetterhead: boolean;
    showSignatures: boolean;
  }>({
    paperSize: 'A4',
    showLetterhead: true,
    showSignatures: true,
  });

  const handleOpenPrintPayment = (p: Payment) => {
    setSelectedPrintPayment(p);
    setPrintDialogOpen(true);
  };

  const handleExecutePrint = () => {
    window.print();
  };

  // Form States
  const [accountForm, setAccountForm] = React.useState({
    accountCode: '',
    accountName: '',
    accountType: 'ASSET' as AccountType,
  });

  const [paymentForm, setPaymentForm] = React.useState({
    paymentType: 'CUSTOMER_PAYMENT' as PaymentType,
    customerId: '',
    supplierId: '',
    paymentDate: new Date().toISOString().split('T')[0],
    amount: '',
    paymentMethod: 'CASH' as PaymentMethod,
    description: '',
  });

  const [openClosingForm, setOpenClosingForm] = React.useState({
    closingDate: new Date().toISOString().split('T')[0],
    openingCash: '0',
  });

  const [closeRegisterForm, setCloseRegisterForm] = React.useState({
    cashReceived: '0',
    cashPaid: '0',
  });

  const loadAccountingData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [accRes, payRes, closeRes, jeRes, custRes, supRes] = await Promise.all([
        apiFetch<Account[]>('/api/finance/accounts'),
        apiFetch<Payment[]>('/api/finance/payments'),
        apiFetch<DailyClosing[]>('/api/finance/daily-closings'),
        apiFetch<JournalEntry[]>('/api/finance/journal-entries'),
        apiFetch<Customer[]>('/api/master/customers'),
        apiFetch<Supplier[]>('/api/master/suppliers'),
      ]);

      if (accRes.success && Array.isArray(accRes.data)) setAccounts(accRes.data);
      if (payRes.success && Array.isArray(payRes.data)) setPayments(payRes.data);
      if (closeRes.success && Array.isArray(closeRes.data)) setDailyClosings(closeRes.data);
      if (jeRes.success && Array.isArray(jeRes.data)) setJournalEntries(jeRes.data);
      if (custRes.success && Array.isArray(custRes.data)) setCustomers(custRes.data);
      if (supRes.success && Array.isArray(supRes.data)) setSuppliers(supRes.data);
    } catch (err: any) {
      error('Failed to load accounting data', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  React.useEffect(() => {
    loadAccountingData();
  }, [loadAccountingData]);

  // Create Account
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountForm.accountCode || !accountForm.accountName) {
      error('Please complete account code and name');
      return;
    }

    const res = await apiFetch('/api/finance/accounts', {
      method: 'POST',
      body: JSON.stringify(accountForm),
    });

    if (res.success) {
      success('Account Created (စာရင်းခေါင်းစဉ် အသစ်ဖွင့်ပြီးပါပြီ)', `${accountForm.accountCode} - ${accountForm.accountName}`);
      setAccountDialogOpen(false);
      setAccountForm({ accountCode: '', accountName: '', accountType: 'ASSET' });
      loadAccountingData();
    } else {
      error('Creation failed', res.message);
    }
  };

  // Record Payment
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.amount || Number(paymentForm.amount) <= 0) {
      error('Please specify valid positive amount (ငွေပမာဏ မှန်ကန်စွာ ထည့်ပါ)');
      return;
    }

    const payload = {
      paymentType: paymentForm.paymentType,
      customerId: paymentForm.paymentType === 'CUSTOMER_PAYMENT' && paymentForm.customerId ? Number(paymentForm.customerId) : undefined,
      supplierId: paymentForm.paymentType === 'SUPPLIER_PAYMENT' && paymentForm.supplierId ? Number(paymentForm.supplierId) : undefined,
      paymentDate: paymentForm.paymentDate,
      amount: Number(paymentForm.amount),
      paymentMethod: paymentForm.paymentMethod,
      description: paymentForm.description || undefined,
      branchId: orgContext.branchId,
    };

    const res = await apiFetch('/api/finance/payments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.success) {
      success('Payment Recorded & GL Entry Posted (ငွေပေးချေမှု မှတ်တမ်းတင်ပြီး စာရင်းသွင်းပြီးပါပြီ)');
      setPaymentDialogOpen(false);
      setPaymentForm({
        paymentType: 'CUSTOMER_PAYMENT',
        customerId: '',
        supplierId: '',
        paymentDate: new Date().toISOString().split('T')[0],
        amount: '',
        paymentMethod: 'CASH',
        description: '',
      });
      loadAccountingData();
    } else {
      error('Payment record failed', res.message);
    }
  };

  // Open Daily Closing
  const handleOpenDailyClosing = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      closingDate: openClosingForm.closingDate,
      openingCash: Number(openClosingForm.openingCash || 0),
      branchId: orgContext.branchId,
    };

    const res = await apiFetch('/api/finance/daily-closings', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.success) {
      success('Daily Cash Register Opened (မနက်ပိုင်း ငွေစာရင်း ဖွင့်ပြီးပါပြီ)');
      setClosingDialogOpen(false);
      loadAccountingData();
    } else {
      error('Opening register failed', res.message);
    }
  };

  // Close Register
  const handleCloseDailyClosing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClosing) return;

    const res = await apiFetch(`/api/finance/daily-closings/${selectedClosing.id}/close`, {
      method: 'PUT',
      body: JSON.stringify({
        cashReceived: Number(closeRegisterForm.cashReceived || 0),
        cashPaid: Number(closeRegisterForm.cashPaid || 0),
      }),
    });

    if (res.success) {
      success('Daily Cash Register Closed (နေ့စဉ် ငွေစာရင်း ချုပ်ပြီးပါပြီ)', `Closing Cash: ${formatCurrency(res.data?.closingCash)}`);
      setCloseRegisterDialogOpen(false);
      loadAccountingData();
    } else {
      error('Close register failed', res.message);
    }
  };

  // Inspect Journal Entry
  const inspectJe = async (je: JournalEntry) => {
    const detailRes = await apiFetch<JournalEntry>(`/api/finance/journal-entries/${je.id}`);
    setSelectedJe(detailRes.success && detailRes.data ? detailRes.data : je);
    setJeSheetOpen(true);
  };

  // Filtered Accounts
  const filteredAccounts = React.useMemo(() => {
    if (accountTypeFilter === 'ALL') return accounts;
    return accounts.filter(a => a.accountType === accountTypeFilter);
  }, [accounts, accountTypeFilter]);

  // Account Columns
  const accountColumns: Column<Account>[] = [
    { header: 'Account Code', accessorKey: 'accountCode', sortable: true, className: 'font-mono font-bold text-blue-600' },
    { header: 'Account Name (စာရင်းခေါင်းစဉ်)', accessorKey: 'accountName', sortable: true, className: 'font-semibold' },
    {
      header: 'Type (အမျိုးအစား)',
      accessorKey: 'accountType',
      cell: r => {
        const typeVariants: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info'> = {
          ASSET: 'info',
          LIABILITY: 'warning',
          EQUITY: 'default',
          REVENUE: 'success',
          EXPENSE: 'destructive',
        };
        return <Badge variant={typeVariants[r.accountType] || 'default'}>{r.accountType}</Badge>;
      },
    },
    {
      header: 'Status',
      cell: r => (r.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="destructive">Inactive</Badge>),
    },
  ];

  // Payment Columns
  const paymentColumns: Column<Payment>[] = [
    { header: 'Payment No', accessorKey: 'paymentNo', sortable: true, className: 'font-mono font-bold' },
    {
      header: 'Payment Type',
      accessorKey: 'paymentType',
      cell: r => {
        const typeMap: Record<string, { label: string; variant: 'success' | 'destructive' | 'secondary' }> = {
          CUSTOMER_PAYMENT: { label: 'Customer Payment (ငွေရ)', variant: 'success' },
          SUPPLIER_PAYMENT: { label: 'Supplier Payment (ငွေပေး)', variant: 'destructive' },
          EXPENSE_PAYMENT: { label: 'Expense Payment (အသုံးစရိတ်)', variant: 'secondary' },
        };
        const item = typeMap[r.paymentType] || { label: r.paymentType, variant: 'secondary' };
        return <Badge variant={item.variant}>{item.label}</Badge>;
      },
    },
    {
      header: 'Partner / Memo',
      cell: r => r.customer?.name || r.supplier?.name || (r.description ? r.description : '-'),
    },
    {
      header: 'Amount (ကျသင့်ငွေ)',
      cell: r => <span className="font-bold font-mono text-zinc-900 dark:text-zinc-100">{formatCurrency(r.amount)}</span>,
      sortable: true,
    },
    { header: 'Method', cell: r => <Badge variant="outline">{r.paymentMethod}</Badge> },
    { header: 'Date', cell: r => formatDate(r.paymentDate), sortable: true },
    {
      header: 'Actions',
      className: 'text-right',
      cell: r => (
        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenPrintPayment(r)}
            className="h-7 text-xs text-zinc-600 hover:text-blue-600"
            title={r.paymentType === 'CUSTOMER_PAYMENT' ? 'Print Money Receipt' : 'Print Payment Voucher'}
          >
            <Printer className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedPayment(r);
              setPaymentSheetOpen(true);
            }}
            className="h-7 text-xs"
            title="View Details"
          >
            <Eye className="h-3.5 w-3.5 mr-1" /> View
          </Button>
        </div>
      ),
    },
  ];

  // Daily Closing Columns
  const closingColumns: Column<DailyClosing>[] = [
    { header: 'Closing Date (ရက်စွဲ)', cell: r => formatDate(r.closingDate), sortable: true, className: 'font-bold' },
    { header: 'Opening Cash (မနက်ပိုင်း မူလလက်ကျန်)', cell: r => formatCurrency(r.openingCash) },
    { header: 'Cash Received (ရငွေပေါင်း)', cell: r => formatCurrency(r.cashReceived ?? 0) },
    { header: 'Cash Paid (ပေးငွေပေါင်း)', cell: r => formatCurrency(r.cashPaid ?? 0) },
    {
      header: 'Closing Cash (ချုပ်ငွေ)',
      cell: r => (
        <span className="font-bold font-mono text-blue-600 dark:text-blue-400">
          {r.closingCash !== null && r.closingCash !== undefined ? formatCurrency(r.closingCash) : 'In Session'}
        </span>
      ),
    },
    { header: 'Status', cell: r => <StatusBadge status={r.status} /> },
    {
      header: 'Actions',
      className: 'text-right',
      cell: r =>
        r.status === 'OPEN' ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedClosing(r);
              setCloseRegisterForm({ cashReceived: '0', cashPaid: '0' });
              setCloseRegisterDialogOpen(true);
            }}
            className="h-7 text-xs text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40"
          >
            <Lock className="h-3 w-3 mr-1" /> Close Register (စာရင်းချုပ်ရန်)
          </Button>
        ) : (
          <span className="text-[11px] text-zinc-400">Closed</span>
        ),
    },
  ];

  // Journal Entry Columns
  const jeColumns: Column<JournalEntry>[] = [
    { header: 'Entry No', accessorKey: 'entryNo', sortable: true, className: 'font-mono font-bold text-blue-600' },
    { header: 'Date (ရက်စွဲ)', cell: r => formatDate(r.entryDate), sortable: true },
    { header: 'Description (ဖော်ပြချက်)', accessorKey: 'description' },
    { header: 'Reference Document', cell: r => r.referenceType ? `${r.referenceType} #${r.referenceId || ''}` : 'Direct' },
    { header: 'Status', cell: r => <StatusBadge status={r.status} /> },
    {
      header: 'Actions',
      className: 'text-right',
      cell: r => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => inspectJe(r)}
          className="h-7 text-xs"
        >
          <Eye className="h-3.5 w-3.5 mr-1" /> Inspect GL
        </Button>
      ),
    },
  ];

  // ─── MOBILE M3 CARDS RENDERERS ──────────────────────────────────
  const renderAccountCard = (acc: Account) => {
    const typeVariants: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info'> = {
      ASSET: 'info',
      LIABILITY: 'warning',
      EQUITY: 'default',
      REVENUE: 'success',
      EXPENSE: 'destructive',
    };

    return (
      <div className="rounded-2xl border border-zinc-200/90 bg-white p-3.5 sm:p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-3 transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
        {/* Top Header: Account Code & Status */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-md">
            {acc.accountCode}
          </span>
          <Badge variant={acc.isActive ? 'success' : 'destructive'} className="text-[10px] px-2 py-0.5">
            {acc.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        {/* Account Identity */}
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
            {acc.accountName}
          </h4>
        </div>

        {/* Account Type Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
          <span className="text-[11px] text-zinc-500">Account Classification:</span>
          <Badge variant={typeVariants[acc.accountType] || 'default'} className="text-xs font-medium">
            {acc.accountType}
          </Badge>
        </div>
      </div>
    );
  };

  const renderPaymentCard = (p: Payment) => {
    const typeMap: Record<string, { label: string; variant: 'success' | 'destructive' | 'secondary' }> = {
      CUSTOMER_PAYMENT: { label: 'Customer Payment (ငွေရ)', variant: 'success' },
      SUPPLIER_PAYMENT: { label: 'Supplier Payment (ငွေပေး)', variant: 'destructive' },
      EXPENSE_PAYMENT: { label: 'Expense (အသုံးစရိတ်)', variant: 'secondary' },
    };
    const item = typeMap[p.paymentType] || { label: p.paymentType, variant: 'secondary' };

    return (
      <div className="rounded-2xl border border-zinc-200/90 bg-white p-3.5 sm:p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-3 transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
        {/* Top Header: Payment No & Type Badge */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-md">
            {p.paymentNo}
          </span>
          <Badge variant={item.variant} className="text-[10px] px-2 py-0.5">
            {item.label}
          </Badge>
        </div>

        {/* Partner & Method */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
              {p.customer?.name || p.supplier?.name || (p.description ? p.description : 'Direct Payment')}
            </span>
            <Badge variant="outline" className="text-[10px] font-mono">
              {p.paymentMethod}
            </Badge>
          </div>
          <p className="text-[11px] text-zinc-400">Date: {formatDate(p.paymentDate)}</p>
        </div>

        {/* Amount Box */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 text-xs">
          <span className="text-[11px] font-semibold text-zinc-500">Payment Amount:</span>
          <span className="font-bold font-mono text-sm text-zinc-900 dark:text-zinc-100">
            {formatCurrency(p.amount)}
          </span>
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs" onClick={e => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenPrintPayment(p)}
            className="h-8 px-2.5 text-zinc-600 dark:text-zinc-300 gap-1 hover:text-blue-600"
            title="Print Voucher / Receipt"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedPayment(p);
              setPaymentSheetOpen(true);
            }}
            className="h-8 px-2.5 text-zinc-600 dark:text-zinc-300 gap-1"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>View Detail</span>
          </Button>
        </div>
      </div>
    );
  };

  const renderClosingCard = (dc: DailyClosing) => {
    return (
      <div className="rounded-2xl border border-zinc-200/90 bg-white p-3.5 sm:p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-3 transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
        {/* Top Header: Date & Status */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-bold text-xs text-zinc-900 dark:text-zinc-100">
            <CalendarDays className="h-4 w-4 text-blue-600 shrink-0" />
            <span>{formatDate(dc.closingDate)}</span>
          </div>
          <StatusBadge status={dc.status} />
        </div>

        {/* 3-Column Cash Summary */}
        <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 text-center text-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-semibold text-zinc-400">Opening</span>
            <p className="font-mono font-bold text-zinc-800 dark:text-zinc-200 text-[11px]">
              {formatCurrency(dc.openingCash)}
            </p>
          </div>
          <div className="space-y-0.5 border-x border-zinc-200 dark:border-zinc-700/60">
            <span className="text-[10px] uppercase font-semibold text-zinc-400">Received (+)</span>
            <p className="font-mono font-bold text-emerald-600 text-[11px]">
              {formatCurrency(dc.cashReceived ?? 0)}
            </p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-semibold text-zinc-400">Paid (-)</span>
            <p className="font-mono font-bold text-rose-600 text-[11px]">
              {formatCurrency(dc.cashPaid ?? 0)}
            </p>
          </div>
        </div>

        {/* Closing Cash Total */}
        <div className="flex items-center justify-between px-2 text-xs">
          <span className="text-zinc-500 font-medium">Closing Cash (ချုပ်ငွေ):</span>
          <span className="font-bold font-mono text-blue-600 dark:text-blue-400 text-sm">
            {dc.closingCash !== null && dc.closingCash !== undefined ? formatCurrency(dc.closingCash) : 'In Session'}
          </span>
        </div>

        {/* Action Button */}
        {dc.status === 'OPEN' && (
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-end" onClick={e => e.stopPropagation()}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedClosing(dc);
                setCloseRegisterForm({ cashReceived: '0', cashPaid: '0' });
                setCloseRegisterDialogOpen(true);
              }}
              className="h-8 w-full sm:w-auto text-xs gap-1.5 text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40"
            >
              <Lock className="h-3.5 w-3.5" /> Close Register (စာရင်းချုပ်ရန်)
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderJeCard = (je: JournalEntry) => {
    return (
      <div className="rounded-2xl border border-zinc-200/90 bg-white p-3.5 sm:p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-3 transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
        {/* Top Header: Entry No & Status */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-md">
            {je.entryNo}
          </span>
          <StatusBadge status={je.status} />
        </div>

        {/* Description & Reference */}
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
            {je.description || 'General Ledger Entry'}
          </h4>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
            <span>Date: {formatDate(je.entryDate)}</span>
            <span>• Ref: {je.referenceType ? `${je.referenceType} #${je.referenceId || ''}` : 'Direct Entry'}</span>
          </div>
        </div>

        {/* Balanced Banner & Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs" onClick={e => e.stopPropagation()}>
          <Badge variant="success" className="text-[10px] gap-1 px-2 py-0.5">
            <CheckCircle2 className="h-3 w-3" /> Auto-Posted Double Entry
          </Badge>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => inspectJe(je)}
            className="h-8 px-2.5 text-zinc-600 dark:text-zinc-300 gap-1"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Inspect GL</span>
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
            <Landmark className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 shrink-0" />
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 truncate">
              ဘဏ္ဍာရေးနှင့် စာရင်းကိုင်
            </h1>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
            Chart of accounts, double-entry GL, payments, and cashier daily closings
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          <Button variant="outline" size="sm" onClick={loadAccountingData} className="gap-1.5 h-8 text-xs shrink-0">
            <RefreshCw className={isLoading ? 'animate-spin h-3.5 w-3.5' : 'h-3.5 w-3.5'} />
            <span className="hidden sm:inline">Refresh (ပြန်ဖွင့်)</span>
            <span className="sm:hidden">Refresh</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAccountDialogOpen(true)} className="gap-1.5 h-8 text-xs shrink-0">
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">+ New Account (စာရင်းသစ်ဖွင့်ရန်)</span>
            <span className="sm:hidden">+ Account</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setClosingDialogOpen(true)} className="gap-1.5 h-8 text-xs shrink-0">
            <CalendarDays className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Open Register (မနက်ပိုင်းဖွင့်ရန်)</span>
            <span className="sm:hidden">Register</span>
          </Button>
          <div className="hidden sm:block">
            <Button variant="primary" size="sm" onClick={() => setPaymentDialogOpen(true)} className="gap-1.5 h-8 text-xs bg-blue-600 hover:bg-blue-700">
              <Receipt className="h-3.5 w-3.5" />
              <span>+ Record Payment (ငွေပေး/ငွေရ သွင်းရန်)</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ─── TABS NAVIGATION (Scrollable M3 Segmented Bar) ─────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0">
          <TabsList className="w-max sm:w-full justify-start">
            <TabsTrigger value="accounts" count={filteredAccounts.length}>
              🏛️ Chart of Accounts (စာရင်းခေါင်းစဉ်များ)
            </TabsTrigger>
            <TabsTrigger value="payments" count={payments.length}>
              💳 Payments (ငွေပေး/ငွေရ မှတ်တမ်းများ)
            </TabsTrigger>
            <TabsTrigger value="closings" count={dailyClosings.length}>
              🔒 Daily Closings (နေ့စဉ် ငွေစာရင်းချုပ်)
            </TabsTrigger>
            <TabsTrigger value="journal" count={journalEntries.length}>
              ⚖️ General Ledger (Double-Entry စာရင်းများ)
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ─── TAB 1: CHART OF ACCOUNTS ───────────────────────────────── */}
        <TabsContent value="accounts" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-xs">
            <span className="font-semibold text-zinc-500">Account Type Filter:</span>
            <select
              value={accountTypeFilter}
              onChange={e => setAccountTypeFilter(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 w-full sm:w-auto"
            >
              <option value="ALL">All Account Types (အားလုံး)</option>
              <option value="ASSET">ASSET (ပိုင်ဆိုင်မှုများ)</option>
              <option value="LIABILITY">LIABILITY (ကြွေးမြီနှင့် ပေးရန်များ)</option>
              <option value="EQUITY">EQUITY (မတည်ရင်းနှီးငွေ)</option>
              <option value="REVENUE">REVENUE (အရောင်းရငွေ)</option>
              <option value="EXPENSE">EXPENSE (အသုံးစရိတ်များ)</option>
            </select>
          </div>

          <DataTable
            data={filteredAccounts}
            columns={accountColumns}
            searchPlaceholder="Search accounts by code or name (စာရင်းရှာရန်)..."
            searchKey="accountName"
            isLoading={isLoading}
            renderCard={renderAccountCard}
          />
        </TabsContent>

        {/* ─── TAB 2: PAYMENTS ────────────────────────────────────────── */}
        <TabsContent value="payments">
          <DataTable
            data={payments}
            columns={paymentColumns}
            searchPlaceholder="Search payment transactions by PAY# (ငွေပေး/ငွေရ ရှာရန်)..."
            searchKey="paymentNo"
            isLoading={isLoading}
            renderCard={renderPaymentCard}
          />
        </TabsContent>

        {/* ─── TAB 3: DAILY CLOSINGS ──────────────────────────────────── */}
        <TabsContent value="closings">
          <DataTable
            data={dailyClosings}
            columns={closingColumns}
            searchPlaceholder="Search daily closings (ငွေစာရင်းချုပ်ရှာရန်)..."
            isLoading={isLoading}
            renderCard={renderClosingCard}
          />
        </TabsContent>

        {/* ─── TAB 4: GENERAL LEDGER JOURNAL ENTRIES ──────────────────── */}
        <TabsContent value="journal">
          <DataTable
            data={journalEntries}
            columns={jeColumns}
            searchPlaceholder="Search journal entries by JE# or memo (GL ရှာရန်)..."
            searchKey="entryNo"
            isLoading={isLoading}
            renderCard={renderJeCard}
            onRowClick={r => inspectJe(r)}
          />
        </TabsContent>
      </Tabs>

      {/* ─── MODAL: NEW ACCOUNT ─────────────────────────────────────── */}
      <Dialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen} title="Add Chart of Account (စာရင်းခေါင်းစဉ် အသစ်ဖွင့်ရန်)">
        <form onSubmit={handleCreateAccount} className="space-y-4">
          <Input
            label="Account Code *"
            placeholder="e.g. 1500"
            value={accountForm.accountCode}
            onChange={e => setAccountForm({ ...accountForm, accountCode: e.target.value })}
            required
          />
          <Input
            label="Account Name *"
            placeholder="e.g. Factory Equipment"
            value={accountForm.accountName}
            onChange={e => setAccountForm({ ...accountForm, accountName: e.target.value })}
            required
          />
          <Select
            label="Account Type *"
            value={accountForm.accountType}
            onChange={e => setAccountForm({ ...accountForm, accountType: e.target.value as AccountType })}
            required
          >
            <option value="ASSET">ASSET (Current / Fixed Assets - ပိုင်ဆိုင်မှုများ)</option>
            <option value="LIABILITY">LIABILITY (Payables / Obligations - ပေးရန်ရှိများ)</option>
            <option value="EQUITY">EQUITY (Capital / Retained Earnings - အရင်းအနှီး)</option>
            <option value="REVENUE">REVENUE (Sales / Other Income - ဝင်ငွေ)</option>
            <option value="EXPENSE">EXPENSE (Cost of Goods / Operational - အသုံးစရိတ်)</option>
          </Select>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setAccountDialogOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
              Save Account (စာရင်းသိမ်းရန်)
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── MODAL: RECORD PAYMENT ──────────────────────────────────── */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen} title="Record Payment & Sync GL (ငွေပေး/ငွေရ မှတ်တမ်းတင်ရန်)" maxWidth="lg">
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <Select
            label="Payment Type (အမျိုးအစား) *"
            value={paymentForm.paymentType}
            onChange={e => setPaymentForm({ ...paymentForm, paymentType: e.target.value as PaymentType })}
            required
          >
            <option value="CUSTOMER_PAYMENT">Customer Payment (Accounts Receivable Inflow - ဝယ်သူထံမှ ရငွေ)</option>
            <option value="SUPPLIER_PAYMENT">Supplier Payment (Accounts Payable Outflow - ကုန်သွင်းသူသို့ ပေးငွေ)</option>
            <option value="EXPENSE_PAYMENT">Direct Expense Payment (အထွေထွေ အသုံးစရိတ် ပေးချေမှု)</option>
          </Select>

          {paymentForm.paymentType === 'CUSTOMER_PAYMENT' && (
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
          )}

          {paymentForm.paymentType === 'SUPPLIER_PAYMENT' && (
            <Select
              label="Supplier (ကုန်သွင်းသူ) *"
              value={paymentForm.supplierId}
              onChange={e => setPaymentForm({ ...paymentForm, supplierId: e.target.value })}
              required
            >
              <option value="">Select Supplier...</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              type="number"
              step="any"
              label="Payment Amount (ငွေပမာဏ) *"
              placeholder="e.g. 500000"
              value={paymentForm.amount}
              onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
              required
            />

            <Select
              label="Payment Method (ပေးချေသည့် နည်းလမ်း) *"
              value={paymentForm.paymentMethod}
              onChange={e => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value as PaymentMethod })}
              required
            >
              <option value="CASH">Cash (လက်ငင်းငွေသား)</option>
              <option value="BANK">Bank Transfer / Check (ဘဏ်လွှဲ/ချက်လက်မှတ်)</option>
              <option value="OTHER">Other / Mobile Pay (အခြား / မိုဘိုင်းပေးချေမှု)</option>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              type="date"
              label="Payment Date (ရက်စွဲ) *"
              value={paymentForm.paymentDate}
              onChange={e => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
              required
            />
            <Input
              label="Description / Memo (မှတ်ချက်)"
              placeholder="e.g. Invoice settlement"
              value={paymentForm.description}
              onChange={e => setPaymentForm({ ...paymentForm, description: e.target.value })}
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setPaymentDialogOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
              Record Payment & Post GL (ငွေစာရင်းသွင်းမည်)
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── MODAL: OPEN DAILY CLOSING ──────────────────────────────── */}
      <Dialog open={closingDialogOpen} onOpenChange={setClosingDialogOpen} title="Open Daily Cash Register (မနက်ပိုင်း ငွေစာရင်းဖွင့်ရန်)">
        <form onSubmit={handleOpenDailyClosing} className="space-y-4">
          <Input
            type="date"
            label="Closing Register Date *"
            value={openClosingForm.closingDate}
            onChange={e => setOpenClosingForm({ ...openClosingForm, closingDate: e.target.value })}
            required
          />
          <Input
            type="number"
            step="any"
            label="Opening Cash Float (မနက်ပိုင်း မူလလက်ကျန်) *"
            value={openClosingForm.openingCash}
            onChange={e => setOpenClosingForm({ ...openClosingForm, openingCash: e.target.value })}
            required
          />
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setClosingDialogOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
              Open Register (စာရင်းဖွင့်မည်)
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── MODAL: CLOSE DAILY CLOSING REGISTER ─────────────────────── */}
      <Dialog open={closeRegisterDialogOpen} onOpenChange={setCloseRegisterDialogOpen} title="Close Cash Register (ညနေပိုင်း ငွေစာရင်းချုပ်ရန်)">
        <form onSubmit={handleCloseDailyClosing} className="space-y-4">
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 text-xs">
            <p className="text-zinc-500">Opening Balance (မနက်ပိုင်း မူလလက်ကျန်):</p>
            <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100 font-mono">
              {formatCurrency(selectedClosing?.openingCash)}
            </p>
          </div>

          <Input
            type="number"
            step="any"
            label="Total Cash Received Today (ယနေ့ ရငွေစုစုပေါင်း)"
            value={closeRegisterForm.cashReceived}
            onChange={e => setCloseRegisterForm({ ...closeRegisterForm, cashReceived: e.target.value })}
            required
          />

          <Input
            type="number"
            step="any"
            label="Total Cash Disbursed / Paid Today (ယနေ့ ပေးငွေစုစုပေါင်း)"
            value={closeRegisterForm.cashPaid}
            onChange={e => setCloseRegisterForm({ ...closeRegisterForm, cashPaid: e.target.value })}
            required
          />

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setCloseRegisterDialogOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700">
              Confirm Daily Close (အတည်ပြု ချုပ်မည်)
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── CONTEXTUAL SHEET: PAYMENT INSPECTION ────────────────────── */}
      <Sheet
        open={paymentSheetOpen}
        onOpenChange={setPaymentSheetOpen}
        title={`Payment: ${selectedPayment?.paymentNo || ''}`}
        description={`Amount: ${formatCurrency(selectedPayment?.amount)} • Method: ${selectedPayment?.paymentMethod || ''}`}
        footer={
          selectedPayment && (
            <div className="flex justify-between items-center w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenPrintPayment(selectedPayment)}
                className="gap-1.5 text-xs text-blue-600 hover:text-blue-700"
              >
                <Printer className="h-4 w-4" />
                <span>
                  {selectedPayment.paymentType === 'CUSTOMER_PAYMENT'
                    ? 'Print Money Receipt (ငွေရပြေစာ ပရင့်ထုတ်ပါ)'
                    : 'Print Payment Voucher (ငွေပေးချေလွှာ ပရင့်ထုတ်ပါ)'}
                </span>
              </Button>
            </div>
          )
        }
      >
        {selectedPayment && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 p-3.5 sm:p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">Payment Type</p>
                <p className="font-semibold mt-1">{selectedPayment.paymentType}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">Payment Date</p>
                <p className="font-semibold mt-1">{formatDate(selectedPayment.paymentDate)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">Partner</p>
                <p className="font-semibold mt-1">{selectedPayment.customer?.name || selectedPayment.supplier?.name || '-'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">GL Status</p>
                <p className="font-semibold text-emerald-600 mt-1">✓ Double-Entry Auto-Posted</p>
              </div>
            </div>
          </div>
        )}
      </Sheet>

      {/* ─── CONTEXTUAL SHEET: DOUBLE ENTRY GENERAL LEDGER INSPECTION ── */}
      <Sheet
        open={jeSheetOpen}
        onOpenChange={setJeSheetOpen}
        title={`Journal Entry: ${selectedJe?.entryNo || ''}`}
        description={`Date: ${formatDate(selectedJe?.entryDate)} • Ref: ${selectedJe?.referenceType || 'Direct'} #${selectedJe?.referenceId || ''}`}
      >
        {selectedJe && (
          <div className="space-y-6 text-xs">
            <div className="p-3.5 sm:p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 space-y-1">
              <p className="text-[10px] font-bold uppercase text-zinc-400">Description</p>
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">{selectedJe.description || 'System Auto-Entry'}</p>
            </div>

            {/* Balanced T-Account Double Entry Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider text-xs flex items-center gap-1.5">
                  <Scale className="h-4 w-4 text-blue-600" />
                  <span>Double-Entry General Ledger Lines (စာရင်းကိုင် နှစ်ဖက်မျှ စာရင်းများ)</span>
                </h4>
                <Badge variant="success" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Balanced ✓
                </Badge>
              </div>

              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-zinc-600 dark:text-zinc-400">Account</th>
                      <th className="px-3 py-2 text-right font-semibold text-zinc-600 dark:text-zinc-400">Debit (DR)</th>
                      <th className="px-3 py-2 text-right font-semibold text-zinc-600 dark:text-zinc-400">Credit (CR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {(selectedJe.lines || []).map((line, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                        <td className="px-3 py-2.5">
                          <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {line.account?.accountName || `Account #${line.accountId}`}
                          </p>
                          <p className="font-mono text-[10px] text-zinc-500">{line.account?.accountCode}</p>
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-medium text-emerald-600">
                          {Number(line.debit) > 0 ? formatCurrency(line.debit) : '-'}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-medium text-blue-600">
                          {Number(line.credit) > 0 ? formatCurrency(line.credit) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-zinc-100 dark:bg-zinc-800/80 font-bold border-t border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <td className="px-3 py-2.5">Total (စုစုပေါင်း)</td>
                      <td className="px-3 py-2.5 text-right font-mono text-emerald-600">
                        {formatCurrency(
                          (selectedJe.lines || []).reduce((acc, l) => acc + (Number(l.debit) || 0), 0)
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-blue-600">
                        {formatCurrency(
                          (selectedJe.lines || []).reduce((acc, l) => acc + (Number(l.credit) || 0), 0)
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}
      </Sheet>

      {/* ─── PRINT CUSTOMIZER DIALOG ─────────────────────────────────── */}
      <Dialog
        open={printDialogOpen}
        onOpenChange={setPrintDialogOpen}
        title={
          selectedPrintPayment?.paymentType === 'CUSTOMER_PAYMENT'
            ? 'Print Official Money Receipt (တရားဝင် ငွေရပြေစာ ပရင့်ထုတ်ရန်)'
            : 'Print Payment Voucher (ငွေပေးချေလွှာ ပရင့်ထုတ်ရန်)'
        }
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
                  <span>📄 A4 Formal Financial Document</span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Official full-size voucher for finance filing, accounting archives, and audit trails.
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
                  <span>🧾 80mm POS Thermal Cash Slip</span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Compact roll receipt for counter cashiers, POS printers, and customer walk-ins.
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
                Include Signatures & Verification Block (စာရင်းကိုင်/မန်နေဂျာ/ငွေပေး-ငွေလက်ခံသူ လက်မှတ်များ)
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
          #printable-accounting-area,
          #printable-accounting-area * {
            visibility: visible !important;
          }
          #printable-accounting-area {
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

      <div id="printable-accounting-area" className="hidden">
        {selectedPrintPayment && (
          selectedPrintPayment.paymentType === 'CUSTOMER_PAYMENT' ? (
            /* ─── CUSTOMER MONEY RECEIPT (ငွေရပြေစာ) ─── */
            printConfig.paperSize === 'THERMAL_80MM' ? (
              /* 🧾 80MM THERMAL MONEY RECEIPT SLIP */
              <div className="max-w-[76mm] mx-auto text-black font-mono text-[11px] leading-tight p-1 space-y-2">
                <div className="text-center space-y-0.5 border-b border-dashed border-black pb-2">
                  <h2 className="text-sm font-bold uppercase">{orgContext.tenantName || 'NAYA-ERA ERP'}</h2>
                  <p className="text-[10px]">{orgContext.branchName || 'Finance Dept'}</p>
                  <p className="text-[10px] uppercase font-bold mt-1">*** OFFICIAL MONEY RECEIPT ***</p>
                  <p className="text-[9px]">Receipt#: {selectedPrintPayment.paymentNo}</p>
                  <p className="text-[9px]">Date: {formatDate(selectedPrintPayment.paymentDate)}</p>
                </div>

                <div className="border-b border-dashed border-black py-1 space-y-0.5 text-[10px]">
                  <p>Received From: <span className="font-bold">{selectedPrintPayment.customer?.name || 'Customer'}</span></p>
                  {selectedPrintPayment.customer?.phoneNumber && <p>Phone: {selectedPrintPayment.customer.phoneNumber}</p>}
                  <p>Method: <span className="font-bold">{selectedPrintPayment.paymentMethod}</span></p>
                  {selectedPrintPayment.referenceType && (
                    <p>Ref: {selectedPrintPayment.referenceType} #{selectedPrintPayment.referenceId || ''}</p>
                  )}
                  {selectedPrintPayment.description && (
                    <p className="truncate">Description: {selectedPrintPayment.description}</p>
                  )}
                </div>

                <div className="border-b border-dashed border-black py-2 text-center space-y-1">
                  <span className="text-[10px] font-bold">TOTAL RECEIVED AMOUNT:</span>
                  <p className="text-sm font-bold font-mono">{formatCurrency(selectedPrintPayment.amount)}</p>
                </div>

                <div className="pt-3 text-[9px] space-y-4 border-t border-dashed border-black">
                  <div className="space-y-3">
                    <div>
                      <p>Cashier / Receiver Sign: _________________</p>
                    </div>
                    <div>
                      <p>Customer Sign: _________________</p>
                    </div>
                  </div>
                  <div className="text-center text-[8px] pt-1">
                    <p>Thank You For Your Payment!</p>
                    <p>NAYA-ERA Cloud ERP Financial System</p>
                  </div>
                </div>
              </div>
            ) : (
              /* 📄 A4 FORMAL MONEY RECEIPT */
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
                        Branch: {orgContext.branchName || 'Head Office'} • Accounts & Treasury Department
                      </p>
                      <p className="text-[11px] text-gray-600">
                        Official Acknowledgment of Accounts Receivable Settlement
                      </p>
                    </div>

                    <div className="text-right text-xs space-y-0.5">
                      <p className="font-bold font-mono text-sm">RECEIPT NO: {selectedPrintPayment.paymentNo}</p>
                      <p className="text-gray-600">Receipt Date: {formatDate(selectedPrintPayment.paymentDate)}</p>
                      <p className="text-gray-600">Payment Method: <span className="font-bold">{selectedPrintPayment.paymentMethod}</span></p>
                      <p className="text-gray-600">GL Status: <span className="font-bold text-emerald-600">Auto-Posted ✓</span></p>
                    </div>
                  </div>
                )}

                <div className="text-center py-2 bg-gray-100 border border-gray-300 rounded">
                  <h2 className="text-base font-bold uppercase tracking-wide">
                    OFFICIAL MONEY RECEIPT / တရားဝင် ငွေရပြေစာ
                  </h2>
                  <p className="text-xs text-gray-600 mt-0.5 font-medium">
                    Verified Proof of Cash / Electronic Funds Received
                  </p>
                </div>

                {/* Receipt Details Box */}
                <div className="border border-gray-300 rounded p-4 space-y-3 bg-gray-50 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-bold uppercase text-[10px] text-gray-500">Received From (ငွေပေးသွင်းသူ)</p>
                      <p className="font-bold text-sm mt-0.5">{selectedPrintPayment.customer?.name || 'Customer'}</p>
                      <p className="text-gray-600">Contact: {selectedPrintPayment.customer?.phoneNumber || '-'}</p>
                      <p className="text-gray-600">Address: {selectedPrintPayment.customer?.address || '-'}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="font-bold uppercase text-[10px] text-gray-500">Accounting Reference</p>
                      <p className="text-gray-700">Ref Type: {selectedPrintPayment.referenceType || 'Direct Customer Receipt'}</p>
                      {selectedPrintPayment.referenceId && <p className="text-gray-700 font-mono">Ref Doc ID: #{selectedPrintPayment.referenceId}</p>}
                      <p className="text-gray-700">Payment Channel: <span className="font-bold">{selectedPrintPayment.paymentMethod}</span></p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-3">
                    <p className="text-gray-600">
                      <span className="font-semibold text-gray-800">Description / Purpose: </span>
                      {selectedPrintPayment.description || 'Settlement of outstanding customer sales account.'}
                    </p>
                  </div>
                </div>

                {/* Received Amount Callout */}
                <div className="border-2 border-black rounded p-4 bg-white flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-gray-500">Total Net Amount Received (စုစုပေါင်း လက်ခံရရှိငွေ)</p>
                    <p className="text-xs text-gray-700 font-medium mt-1">Official Currency: Myanmar Kyats (MMK)</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold font-mono text-black">
                      {formatCurrency(selectedPrintPayment.amount)}
                    </span>
                  </div>
                </div>

                {/* Signatures */}
                {printConfig.showSignatures && (
                  <div className="pt-8 border-t border-gray-300 mt-8 space-y-6">
                    <div className="grid grid-cols-2 gap-12 text-center text-xs">
                      <div className="space-y-8">
                        <p className="font-bold uppercase text-[10px] text-gray-600">Authorized Cashier / Accountant (ငွေကိုင်လက်မှတ်)</p>
                        <div className="border-b border-gray-400 mx-8"></div>
                        <div>
                          <p className="font-semibold">{user?.name || 'Chief Cashier'}</p>
                          <p className="text-[10px] text-gray-500">Date: ____/____/202___</p>
                        </div>
                      </div>

                      <div className="space-y-8">
                        <p className="font-bold uppercase text-[10px] text-gray-600">Payer / Customer Received By (ငွေပေးသွင်းသူ)</p>
                        <div className="border-b border-gray-400 mx-8"></div>
                        <div>
                          <p className="font-semibold">{selectedPrintPayment.customer?.name || 'Customer'}</p>
                          <p className="text-[10px] text-gray-500">Date: ____/____/202___</p>
                        </div>
                      </div>
                    </div>

                    <div className="text-center text-[10px] text-gray-500 pt-4 border-t border-gray-200">
                      NAYA-ERA Official Enterprise ERP • System Automated Official Money Receipt • Certified Valid
                    </div>
                  </div>
                )}
              </div>
            )
          ) : (
            /* ─── SUPPLIER / EXPENSE PAYMENT VOUCHER (ငွေပေးချေလွှာ) ─── */
            printConfig.paperSize === 'THERMAL_80MM' ? (
              /* 🧾 80MM THERMAL PAYMENT VOUCHER SLIP */
              <div className="max-w-[76mm] mx-auto text-black font-mono text-[11px] leading-tight p-1 space-y-2">
                <div className="text-center space-y-0.5 border-b border-dashed border-black pb-2">
                  <h2 className="text-sm font-bold uppercase">{orgContext.tenantName || 'NAYA-ERA ERP'}</h2>
                  <p className="text-[10px]">{orgContext.branchName || 'Treasury'}</p>
                  <p className="text-[10px] uppercase font-bold mt-1">*** PAYMENT VOUCHER ***</p>
                  <p className="text-[9px]">Voucher#: {selectedPrintPayment.paymentNo}</p>
                  <p className="text-[9px]">Date: {formatDate(selectedPrintPayment.paymentDate)}</p>
                </div>

                <div className="border-b border-dashed border-black py-1 space-y-0.5 text-[10px]">
                  <p>Paid To: <span className="font-bold">{selectedPrintPayment.supplier?.name || 'Payee / Supplier'}</span></p>
                  <p>Type: {selectedPrintPayment.paymentType}</p>
                  <p>Method: {selectedPrintPayment.paymentMethod}</p>
                  {selectedPrintPayment.description && (
                    <p className="truncate">Note: {selectedPrintPayment.description}</p>
                  )}
                </div>

                <div className="border-b border-dashed border-black py-2 text-center space-y-1">
                  <span className="text-[10px] font-bold">TOTAL DISBURSED:</span>
                  <p className="text-sm font-bold font-mono">{formatCurrency(selectedPrintPayment.amount)}</p>
                </div>

                <div className="pt-3 text-[9px] space-y-4 border-t border-dashed border-black">
                  <div className="space-y-3">
                    <div>
                      <p>Disbursed By: _________________</p>
                    </div>
                    <div>
                      <p>Payee Received: _________________</p>
                    </div>
                  </div>
                  <div className="text-center text-[8px] pt-1">
                    <p>NAYA-ERA Financial Accounting</p>
                  </div>
                </div>
              </div>
            ) : (
              /* 📄 A4 FORMAL SUPPLIER PAYMENT VOUCHER */
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
                        Branch: {orgContext.branchName || 'Head Office'} • Accounts Payable & Treasury
                      </p>
                      <p className="text-[11px] text-gray-600">
                        Official Payment Voucher & Cash Disbursement Authorization
                      </p>
                    </div>

                    <div className="text-right text-xs space-y-0.5">
                      <p className="font-bold font-mono text-sm">VOUCHER NO: {selectedPrintPayment.paymentNo}</p>
                      <p className="text-gray-600">Voucher Date: {formatDate(selectedPrintPayment.paymentDate)}</p>
                      <p className="text-gray-600">Payment Type: <span className="font-bold">{selectedPrintPayment.paymentType}</span></p>
                      <p className="text-gray-600">GL Status: <span className="font-bold text-emerald-600">Auto-Posted ✓</span></p>
                    </div>
                  </div>
                )}

                <div className="text-center py-2 bg-gray-100 border border-gray-300 rounded">
                  <h2 className="text-base font-bold uppercase tracking-wide">
                    PAYMENT VOUCHER / ငွေပေးချေလွှာ (ရှင်းတမ်း)
                  </h2>
                  <p className="text-xs text-gray-600 mt-0.5 font-medium">
                    Authorized Cash & Bank Disbursement Note
                  </p>
                </div>

                {/* Payee Details */}
                <div className="border border-gray-300 rounded p-4 space-y-3 bg-gray-50 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-bold uppercase text-[10px] text-gray-500">Paid To (ငွေလက်ခံမည့်သူ / ကုန်သွင်းသူ)</p>
                      <p className="font-bold text-sm mt-0.5">{selectedPrintPayment.supplier?.name || selectedPrintPayment.description || 'Payee'}</p>
                      {selectedPrintPayment.supplier?.phoneNumber && (
                        <p className="text-gray-600">Contact: {selectedPrintPayment.supplier.phoneNumber}</p>
                      )}
                      {selectedPrintPayment.supplier?.location && (
                        <p className="text-gray-600">Location: {selectedPrintPayment.supplier.location}</p>
                      )}
                    </div>
                    <div className="text-right space-y-1">
                      <p className="font-bold uppercase text-[10px] text-gray-500">Payment Authorization</p>
                      <p className="text-gray-700">Method: <span className="font-bold">{selectedPrintPayment.paymentMethod}</span></p>
                      <p className="text-gray-700">Ref Type: {selectedPrintPayment.referenceType || 'Direct AP Payment'}</p>
                      {selectedPrintPayment.referenceId && <p className="text-gray-700 font-mono">Ref Doc ID: #{selectedPrintPayment.referenceId}</p>}
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-3">
                    <p className="text-gray-600">
                      <span className="font-semibold text-gray-800">Particulars / Payment Details: </span>
                      {selectedPrintPayment.description || 'Payment disbursement in settlement of supplier invoice or company operational expenses.'}
                    </p>
                  </div>
                </div>

                {/* Amount Callout */}
                <div className="border-2 border-black rounded p-4 bg-white flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-gray-500">Total Net Amount Paid (စုစုပေါင်း ပေးချေငွေ)</p>
                    <p className="text-xs text-gray-700 font-medium mt-1">Official Currency: Myanmar Kyats (MMK)</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold font-mono text-black">
                      {formatCurrency(selectedPrintPayment.amount)}
                    </span>
                  </div>
                </div>

                {/* 3-Column Signatures */}
                {printConfig.showSignatures && (
                  <div className="pt-8 border-t border-gray-300 mt-8 space-y-6">
                    <div className="grid grid-cols-3 gap-6 text-center text-xs">
                      <div className="space-y-8">
                        <p className="font-bold uppercase text-[10px] text-gray-600">Prepared By (စာရင်းကိုင်)</p>
                        <div className="border-b border-gray-400 mx-4"></div>
                        <div>
                          <p className="font-semibold">{user?.name || 'Accountant'}</p>
                          <p className="text-[10px] text-gray-500">Date: ____/____/202___</p>
                        </div>
                      </div>

                      <div className="space-y-8">
                        <p className="font-bold uppercase text-[10px] text-gray-600">Approved By (မန်နေဂျာ/ညွှန်ကြားရေးမှူး)</p>
                        <div className="border-b border-gray-400 mx-4"></div>
                        <div>
                          <p className="font-semibold">Finance Director / MD</p>
                          <p className="text-[10px] text-gray-500">Date: ____/____/202___</p>
                        </div>
                      </div>

                      <div className="space-y-8">
                        <p className="font-bold uppercase text-[10px] text-gray-600">Received By Payee (ငွေလက်ခံရရှိသူ)</p>
                        <div className="border-b border-gray-400 mx-4"></div>
                        <div>
                          <p className="font-semibold">{selectedPrintPayment.supplier?.name || 'Payee'}</p>
                          <p className="text-[10px] text-gray-500">Date: ____/____/202___</p>
                        </div>
                      </div>
                    </div>

                    <div className="text-center text-[10px] text-gray-500 pt-4 border-t border-gray-200">
                      NAYA-ERA Official Enterprise ERP • System Automated Payment Voucher • Certified Valid
                    </div>
                  </div>
                )}
              </div>
            )
          )
        )}
      </div>

      {/* ─── MOBILE FLOATING ACTION BUTTON (M3 Standard) ───────────── */}
      <div className="fixed bottom-6 right-6 sm:hidden z-40">
        <Button
          type="button"
          onClick={() => {
            if (activeTab === 'accounts') setAccountDialogOpen(true);
            else if (activeTab === 'closings') setClosingDialogOpen(true);
            else setPaymentDialogOpen(true);
          }}
          className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl flex items-center justify-center p-0 active:scale-95 transition-transform"
          title="Create"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
