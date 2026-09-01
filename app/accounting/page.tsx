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
      error('အချက်အလက် ရယူ၍မရပါ', err.message);
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
      error('လိုအပ်ချက်', 'ကျေးဇူးပြု၍ စာရင်းကုဒ်နှင့် စာရင်းခေါင်းစဉ်အမည် အပြည့်အစုံ ဖြည့်သွင်းပါ');
      return;
    }

    const res = await apiFetch('/api/finance/accounts', {
      method: 'POST',
      body: JSON.stringify(accountForm),
    });

    if (res.success) {
      success('စာရင်းခေါင်းစဉ်သစ် ဖွင့်ပြီးပါပြီ', `${accountForm.accountCode} - ${accountForm.accountName}`);
      setAccountDialogOpen(false);
      setAccountForm({ accountCode: '', accountName: '', accountType: 'ASSET' });
      loadAccountingData();
    } else {
      error('စာရင်းခေါင်းစဉ် ဖွင့်၍မရပါ', res.message);
    }
  };

  // Record Payment
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.amount || Number(paymentForm.amount) <= 0) {
      error('လိုအပ်ချက်', 'ငွေပမာဏ မှန်ကန်စွာ ထည့်သွင်းပါ');
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
      success('ငွေပေးချေမှု မှတ်တမ်းတင်ပြီး GL စာရင်းသွင်းပြီးပါပြီ');
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
      error('ငွေပေးချေမှု မှတ်တမ်းတင်ခြင်း မအောင်မြင်ပါ', res.message);
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
      success('မနက်ပိုင်း ငွေစာရင်း ဖွင့်လှစ်ပြီးပါပြီ');
      setClosingDialogOpen(false);
      loadAccountingData();
    } else {
      error('ငွေစာရင်း ဖွင့်လှစ်ခြင်း မအောင်မြင်ပါ', res.message);
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
      success('နေ့စဉ် ငွေစာရင်း ချုပ်ပြီးပါပြီ', `စာရင်းချုပ်ငွေ: ${formatCurrency(res.data?.closingCash)}`);
      setCloseRegisterDialogOpen(false);
      loadAccountingData();
    } else {
      error('ငွေစာရင်း ချုပ်ခြင်း မအောင်မြင်ပါ', res.message);
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
    { header: 'စာရင်းကုဒ် (Code)', accessorKey: 'accountCode', sortable: true, className: 'font-mono font-bold text-blue-600' },
    { header: 'စာရင်းခေါင်းစဉ် အမည်', accessorKey: 'accountName', sortable: true, className: 'font-semibold' },
    {
      header: 'အမျိုးအစား (Type)',
      accessorKey: 'accountType',
      cell: r => {
        const typeVariants: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info' }> = {
          ASSET: { label: 'ပိုင်ဆိုင်မှု (ASSET)', variant: 'info' },
          LIABILITY: { label: 'ပေးရန်ရှိကြွေးမြီ (LIABILITY)', variant: 'warning' },
          EQUITY: { label: 'မတည်ရင်းနှီးငွေ (EQUITY)', variant: 'default' },
          REVENUE: { label: 'အရောင်းရငွေ (REVENUE)', variant: 'success' },
          EXPENSE: { label: 'အသုံးစရိတ် (EXPENSE)', variant: 'destructive' },
        };
        const item = typeVariants[r.accountType] || { label: r.accountType, variant: 'default' };
        return <Badge variant={item.variant}>{item.label}</Badge>;
      },
    },
    {
      header: 'အခြေအနေ',
      cell: r => (r.isActive ? <Badge variant="success">အသုံးပြုဆဲ</Badge> : <Badge variant="destructive">ပိတ်ထားသည်</Badge>),
    },
  ];

  // Payment Columns
  const paymentColumns: Column<Payment>[] = [
    { header: 'ပြေစာအမှတ်', accessorKey: 'paymentNo', sortable: true, className: 'font-mono font-bold' },
    {
      header: 'ပေးချေမှု အမျိုးအစား',
      accessorKey: 'paymentType',
      cell: r => {
        const typeMap: Record<string, { label: string; variant: 'success' | 'destructive' | 'secondary' }> = {
          CUSTOMER_PAYMENT: { label: 'ဝယ်ယူသူထံမှ ရငွေ', variant: 'success' },
          SUPPLIER_PAYMENT: { label: 'ကုန်သွင်းသူသို့ ပေးငွေ', variant: 'destructive' },
          EXPENSE_PAYMENT: { label: 'အထွေထွေ အသုံးစရိတ်', variant: 'secondary' },
        };
        const item = typeMap[r.paymentType] || { label: r.paymentType, variant: 'secondary' };
        return <Badge variant={item.variant}>{item.label}</Badge>;
      },
    },
    {
      header: 'ဆက်သွယ်သူ / မှတ်ချက်',
      cell: r => r.customer?.name || r.supplier?.name || (r.description ? r.description : '-'),
    },
    {
      header: 'ကျသင့်ငွေ (Amount)',
      cell: r => <span className="font-bold font-mono text-zinc-900 dark:text-zinc-100">{formatCurrency(r.amount)}</span>,
      sortable: true,
    },
    { header: 'ပေးချေနည်းလမ်း', cell: r => <Badge variant="outline">{r.paymentMethod}</Badge> },
    { header: 'ရက်စွဲ', cell: r => formatDate(r.paymentDate), sortable: true },
    {
      header: 'လုပ်ဆောင်ချက်',
      className: 'text-right',
      cell: r => (
        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenPrintPayment(r)}
            className="h-7 text-xs text-zinc-600 hover:text-blue-600 cursor-pointer"
            title={r.paymentType === 'CUSTOMER_PAYMENT' ? 'ငွေရပြေစာ ပရင့်ထုတ်ရန်' : 'ငွေပေးချေလွှာ ပရင့်ထုတ်ရန်'}
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
            className="h-7 text-xs cursor-pointer"
            title="အသေးစိတ် ကြည့်ရှုရန်"
          >
            <Eye className="h-3.5 w-3.5 mr-1" /> အသေးစိတ်
          </Button>
        </div>
      ),
    },
  ];

  // Daily Closing Columns
  const closingColumns: Column<DailyClosing>[] = [
    { header: 'စာရင်းရက်စွဲ', cell: r => formatDate(r.closingDate), sortable: true, className: 'font-bold' },
    { header: 'မနက်ပိုင်း မူလလက်ကျန်', cell: r => formatCurrency(r.openingCash) },
    { header: 'ရငွေစုစုပေါင်း (+)', cell: r => formatCurrency(r.cashReceived ?? 0) },
    { header: 'ပေးငွေစုစုပေါင်း (-)', cell: r => formatCurrency(r.cashPaid ?? 0) },
    {
      header: 'စာရင်းချုပ်ငွေ (Closing Cash)',
      cell: r => (
        <span className="font-bold font-mono text-blue-600 dark:text-blue-400">
          {r.closingCash !== null && r.closingCash !== undefined ? formatCurrency(r.closingCash) : 'စာရင်းဖွင့်ဆဲ'}
        </span>
      ),
    },
    { header: 'အခြေအနေ', cell: r => <StatusBadge status={r.status} /> },
    {
      header: 'လုပ်ဆောင်ချက်',
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
            className="h-7 text-xs text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 cursor-pointer"
          >
            <Lock className="h-3 w-3 mr-1" /> စာရင်းချုပ်မည်
          </Button>
        ) : (
          <span className="text-[11px] text-zinc-400">စာရင်းချုပ်ပြီး</span>
        ),
    },
  ];

  // Journal Entry Columns
  const jeColumns: Column<JournalEntry>[] = [
    { header: 'ဂျာနယ်အမှတ် (JE#)', accessorKey: 'entryNo', sortable: true, className: 'font-mono font-bold text-blue-600' },
    { header: 'ရက်စွဲ', cell: r => formatDate(r.entryDate), sortable: true },
    { header: 'ဖော်ပြချက် / အကြောင်းအရာ', accessorKey: 'description' },
    { header: 'ကိုးကား စာရွက်စာတမ်း', cell: r => r.referenceType ? `${r.referenceType} #${r.referenceId || ''}` : 'တိုက်ရိုက်' },
    { header: 'အခြေအနေ', cell: r => <StatusBadge status={r.status} /> },
    {
      header: 'လုပ်ဆောင်ချက်',
      className: 'text-right',
      cell: r => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => inspectJe(r)}
          className="h-7 text-xs cursor-pointer"
        >
          <Eye className="h-3.5 w-3.5 mr-1" /> GL စစ်ဆေးမည်
        </Button>
      ),
    },
  ];

  // ─── MOBILE M3 CARDS RENDERERS ──────────────────────────────────
  const renderAccountCard = (acc: Account) => {
    const typeVariants: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info' }> = {
      ASSET: { label: 'ပိုင်ဆိုင်မှု (ASSET)', variant: 'info' },
      LIABILITY: { label: 'ပေးရန်ရှိကြွေးမြီ (LIABILITY)', variant: 'warning' },
      EQUITY: { label: 'မတည်ရင်းနှီးငွေ (EQUITY)', variant: 'default' },
      REVENUE: { label: 'အရောင်းရငွေ (REVENUE)', variant: 'success' },
      EXPENSE: { label: 'အသုံးစရိတ် (EXPENSE)', variant: 'destructive' },
    };
    const item = typeVariants[acc.accountType] || { label: acc.accountType, variant: 'default' };

    return (
      <div className="rounded-2xl border border-zinc-200/90 bg-white p-3.5 sm:p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-3 transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
        {/* Top Header: Account Code & Status */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-md">
            {acc.accountCode}
          </span>
          <Badge variant={acc.isActive ? 'success' : 'destructive'} className="text-[10px] px-2 py-0.5">
            {acc.isActive ? 'အသုံးပြုဆဲ' : 'ပိတ်ထားသည်'}
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
          <span className="text-[11px] text-zinc-500">စာရင်းအမျိုးအစား:</span>
          <Badge variant={item.variant} className="text-xs font-medium">
            {item.label}
          </Badge>
        </div>
      </div>
    );
  };

  const renderPaymentCard = (p: Payment) => {
    const typeMap: Record<string, { label: string; variant: 'success' | 'destructive' | 'secondary' }> = {
      CUSTOMER_PAYMENT: { label: 'ဝယ်ယူသူထံမှ ရငွေ', variant: 'success' },
      SUPPLIER_PAYMENT: { label: 'ကုန်သွင်းသူသို့ ပေးငွေ', variant: 'destructive' },
      EXPENSE_PAYMENT: { label: 'အထွေထွေ အသုံးစရိတ်', variant: 'secondary' },
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
              {p.customer?.name || p.supplier?.name || (p.description ? p.description : 'တိုက်ရိုက်ပေးချေမှု')}
            </span>
            <Badge variant="outline" className="text-[10px] font-mono">
              {p.paymentMethod}
            </Badge>
          </div>
          <p className="text-[11px] text-zinc-400">ရက်စွဲ: {formatDate(p.paymentDate)}</p>
        </div>

        {/* Amount Box */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 text-xs">
          <span className="text-[11px] font-semibold text-zinc-500">ကျသင့်ငွေပမာဏ:</span>
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
            className="h-8 px-2.5 text-zinc-600 dark:text-zinc-300 gap-1 hover:text-blue-600 cursor-pointer"
            title="ဘောက်ချာ / ပြေစာ ပရင့်ထုတ်ရန်"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>ပရင့်ထုတ်ရန်</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedPayment(p);
              setPaymentSheetOpen(true);
            }}
            className="h-8 px-2.5 text-zinc-600 dark:text-zinc-300 gap-1 cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>အသေးစိတ်</span>
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
            <span className="text-[10px] uppercase font-semibold text-zinc-400">မူလလက်ကျန်</span>
            <p className="font-mono font-bold text-zinc-800 dark:text-zinc-200 text-[11px]">
              {formatCurrency(dc.openingCash)}
            </p>
          </div>
          <div className="space-y-0.5 border-x border-zinc-200 dark:border-zinc-700/60">
            <span className="text-[10px] uppercase font-semibold text-zinc-400">ရငွေ (+)</span>
            <p className="font-mono font-bold text-emerald-600 text-[11px]">
              {formatCurrency(dc.cashReceived ?? 0)}
            </p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-semibold text-zinc-400">ပေးငွေ (-)</span>
            <p className="font-mono font-bold text-rose-600 text-[11px]">
              {formatCurrency(dc.cashPaid ?? 0)}
            </p>
          </div>
        </div>

        {/* Closing Cash Total */}
        <div className="flex items-center justify-between px-2 text-xs">
          <span className="text-zinc-500 font-medium">စာရင်းချုပ်ငွေ (Closing Cash):</span>
          <span className="font-bold font-mono text-blue-600 dark:text-blue-400 text-sm">
            {dc.closingCash !== null && dc.closingCash !== undefined ? formatCurrency(dc.closingCash) : 'စာရင်းဖွင့်ဆဲ'}
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
              className="h-8 w-full sm:w-auto text-xs gap-1.5 text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 cursor-pointer"
            >
              <Lock className="h-3.5 w-3.5" /> စာရင်းချုပ်မည်
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
            {je.description || 'အထွေထွေ ဂျာနယ်စာရင်း'}
          </h4>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
            <span>ရက်စွဲ: {formatDate(je.entryDate)}</span>
            <span>• ကိုးကား: {je.referenceType ? `${je.referenceType} #${je.referenceId || ''}` : 'တိုက်ရိုက်စာရင်း'}</span>
          </div>
        </div>

        {/* Balanced Banner & Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs" onClick={e => e.stopPropagation()}>
          <Badge variant="success" className="text-[10px] gap-1 px-2 py-0.5">
            <CheckCircle2 className="h-3 w-3" /> Double-Entry စာရင်းသွင်းပြီး ✓
          </Badge>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => inspectJe(je)}
            className="h-8 px-2.5 text-zinc-600 dark:text-zinc-300 gap-1 cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>GL စစ်ဆေးမည်</span>
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
            စာရင်းခေါင်းစဉ်များ၊ နှစ်ဖက်မျှ GL စာရင်းများ၊ ငွေပေး/ငွေရ မှတ်တမ်းနှင့် နေ့စဉ်ငွေစာရင်းချုပ် စီမံခန့်ခွဲမှု
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          <Button variant="outline" size="sm" onClick={loadAccountingData} className="gap-1.5 h-8 text-xs shrink-0 cursor-pointer">
            <RefreshCw className={isLoading ? 'animate-spin h-3.5 w-3.5' : 'h-3.5 w-3.5'} />
            <span className="hidden sm:inline">ပြန်လည်ရယူရန်</span>
            <span className="sm:hidden">ပြန်ရယူ</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAccountDialogOpen(true)} className="gap-1.5 h-8 text-xs shrink-0 cursor-pointer">
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">+ စာရင်းခေါင်းစဉ်သစ်</span>
            <span className="sm:hidden">+ စာရင်းသစ်</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setClosingDialogOpen(true)} className="gap-1.5 h-8 text-xs shrink-0 cursor-pointer">
            <CalendarDays className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">မနက်ပိုင်း စာရင်းဖွင့်ရန်</span>
            <span className="sm:hidden">စာရင်းဖွင့်</span>
          </Button>
          <div className="hidden sm:block">
            <Button variant="primary" size="sm" onClick={() => setPaymentDialogOpen(true)} className="gap-1.5 h-8 text-xs bg-blue-600 hover:bg-blue-700 cursor-pointer">
              <Receipt className="h-3.5 w-3.5" />
              <span>+ ငွေပေး/ငွေရ စာရင်းသွင်းရန်</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ─── TABS NAVIGATION (Scrollable M3 Segmented Bar) ─────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0">
          <TabsList className="w-max sm:w-full justify-start">
            <TabsTrigger value="accounts" count={filteredAccounts.length}>
              🏛️ စာရင်းခေါင်းစဉ်များ (Chart of Accounts)
            </TabsTrigger>
            <TabsTrigger value="payments" count={payments.length}>
              💳 ငွေပေး/ငွေရ မှတ်တမ်းများ (Payments)
            </TabsTrigger>
            <TabsTrigger value="closings" count={dailyClosings.length}>
              🔒 နေ့စဉ် ငွေစာရင်းချုပ် (Daily Closings)
            </TabsTrigger>
            <TabsTrigger value="journal" count={journalEntries.length}>
              ⚖️ အထွေထွေဂျာနယ် စာရင်းများ (General Ledger)
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ─── TAB 1: CHART OF ACCOUNTS ───────────────────────────────── */}
        <TabsContent value="accounts" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-xs">
            <span className="font-semibold text-zinc-500">စာရင်းအမျိုးအစား စစ်ထုတ်ရန်:</span>
            <select
              value={accountTypeFilter}
              onChange={e => setAccountTypeFilter(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 w-full sm:w-auto cursor-pointer"
            >
              <option value="ALL">စာရင်းအမျိုးအစား အားလုံး</option>
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
            searchPlaceholder="စာရင်းကုဒ် သို့မဟုတ် အမည်ဖြင့် ရှာဖွေရန်..."
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
            searchPlaceholder="ပြေစာအမှတ် (PAY#) ဖြင့် ရှာဖွေရန်..."
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
            searchPlaceholder="နေ့စဉ်ငွေစာရင်းချုပ် ရှာဖွေရန်..."
            isLoading={isLoading}
            renderCard={renderClosingCard}
          />
        </TabsContent>

        {/* ─── TAB 4: GENERAL LEDGER JOURNAL ENTRIES ──────────────────── */}
        <TabsContent value="journal">
          <DataTable
            data={journalEntries}
            columns={jeColumns}
            searchPlaceholder="ဂျာနယ်အမှတ် သို့မဟုတ် အကြောင်းအရာဖြင့် ရှာဖွေရန်..."
            searchKey="entryNo"
            isLoading={isLoading}
            renderCard={renderJeCard}
            onRowClick={r => inspectJe(r)}
          />
        </TabsContent>
      </Tabs>

      {/* ─── MODAL: NEW ACCOUNT ─────────────────────────────────────── */}
      <Dialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen} title="စာရင်းခေါင်းစဉ် အသစ်ဖွင့်ရန်">
        <form onSubmit={handleCreateAccount} className="space-y-4">
          <Input
            label="စာရင်းကုဒ် (Account Code) *"
            placeholder="ဥပမာ - 1500"
            value={accountForm.accountCode}
            onChange={e => setAccountForm({ ...accountForm, accountCode: e.target.value })}
            required
          />
          <Input
            label="စာရင်းခေါင်းစဉ် အမည် (Account Name) *"
            placeholder="ဥပမာ - စက်ပစ္စည်းနှင့် အသုံးအဆောင်များ"
            value={accountForm.accountName}
            onChange={e => setAccountForm({ ...accountForm, accountName: e.target.value })}
            required
          />
          <Select
            label="စာရင်း အမျိုးအစား (Account Type) *"
            value={accountForm.accountType}
            onChange={e => setAccountForm({ ...accountForm, accountType: e.target.value as AccountType })}
            required
          >
            <option value="ASSET">ASSET (ပိုင်ဆိုင်မှုများ - Current / Fixed Assets)</option>
            <option value="LIABILITY">LIABILITY (ပေးရန်ရှိကြွေးမြီများ - Payables / Obligations)</option>
            <option value="EQUITY">EQUITY (မတည်ရင်းနှီးငွေ - Capital / Retained Earnings)</option>
            <option value="REVENUE">REVENUE (အရောင်းရငွေ - Sales / Other Income)</option>
            <option value="EXPENSE">EXPENSE (အသုံးစရိတ်များ - Cost of Goods / Operational)</option>
          </Select>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setAccountDialogOpen(false)} className="w-full sm:w-auto">
              မလုပ်တော့ပါ
            </Button>
            <Button type="submit" variant="primary" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
              စာရင်း သိမ်းဆည်းမည်
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── MODAL: RECORD PAYMENT ──────────────────────────────────── */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen} title="ငွေပေး/ငွေရ မှတ်တမ်းတင်ရန် (Sync GL)" maxWidth="lg">
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <Select
            label="ပေးချေမှု အမျိုးအစား (Payment Type) *"
            value={paymentForm.paymentType}
            onChange={e => setPaymentForm({ ...paymentForm, paymentType: e.target.value as PaymentType })}
            required
          >
            <option value="CUSTOMER_PAYMENT">ဝယ်ယူသူထံမှ ရငွေ (Customer Payment - Accounts Receivable Inflow)</option>
            <option value="SUPPLIER_PAYMENT">ကုန်သွင်းသူသို့ ပေးငွေ (Supplier Payment - Accounts Payable Outflow)</option>
            <option value="EXPENSE_PAYMENT">အထွေထွေ အသုံးစရိတ် ပေးချေမှု (Direct Expense Payment)</option>
          </Select>

          {paymentForm.paymentType === 'CUSTOMER_PAYMENT' && (
            <Select
              label="ဝယ်ယူသူ (Customer) *"
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
          )}

          {paymentForm.paymentType === 'SUPPLIER_PAYMENT' && (
            <Select
              label="ကုန်သွင်းသူ (Supplier) *"
              value={paymentForm.supplierId}
              onChange={e => setPaymentForm({ ...paymentForm, supplierId: e.target.value })}
              required
            >
              <option value="">ကုန်သွင်းသူ ရွေးချယ်ပါ...</option>
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
              label="ငွေပမာဏ (Amount) *"
              placeholder="ဥပမာ - 500000"
              value={paymentForm.amount}
              onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
              required
            />

            <Select
              label="ပေးချေသည့် နည်းလမ်း (Payment Method) *"
              value={paymentForm.paymentMethod}
              onChange={e => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value as PaymentMethod })}
              required
            >
              <option value="CASH">လက်ငင်းငွေသား (Cash)</option>
              <option value="BANK">ဘဏ်လွှဲ / ချက်လက်မှတ် (Bank Transfer / Check)</option>
              <option value="OTHER">အခြား / မိုဘိုင်းပေးချေမှု (Other / Mobile Pay)</option>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              type="date"
              label="ရက်စွဲ (Date) *"
              value={paymentForm.paymentDate}
              onChange={e => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
              required
            />
            <Input
              label="ဖော်ပြချက် / မှတ်ချက် (Memo)"
              placeholder="ဥပမာ - ပြေစာရှင်းလင်းငွေ"
              value={paymentForm.description}
              onChange={e => setPaymentForm({ ...paymentForm, description: e.target.value })}
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setPaymentDialogOpen(false)} className="w-full sm:w-auto">
              မလုပ်တော့ပါ
            </Button>
            <Button type="submit" variant="primary" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
              ငွေစာရင်းသွင်းပြီး GL ချိတ်မည်
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── MODAL: OPEN DAILY CLOSING ──────────────────────────────── */}
      <Dialog open={closingDialogOpen} onOpenChange={setClosingDialogOpen} title="မနက်ပိုင်း ငွေစာရင်းဖွင့်ရန် (Open Daily Cash Register)">
        <form onSubmit={handleOpenDailyClosing} className="space-y-4">
          <Input
            type="date"
            label="စာရင်းဖွင့်သည့် ရက်စွဲ *"
            value={openClosingForm.closingDate}
            onChange={e => setOpenClosingForm({ ...openClosingForm, closingDate: e.target.value })}
            required
          />
          <Input
            type="number"
            step="any"
            label="မနက်ပိုင်း မူလလက်ကျန်ငွေ (Opening Cash Float) *"
            value={openClosingForm.openingCash}
            onChange={e => setOpenClosingForm({ ...openClosingForm, openingCash: e.target.value })}
            required
          />
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setClosingDialogOpen(false)} className="w-full sm:w-auto cursor-pointer">
              မလုပ်တော့ပါ
            </Button>
            <Button type="submit" variant="primary" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 cursor-pointer">
              မနက်ပိုင်း စာရင်းဖွင့်မည်
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── MODAL: CLOSE DAILY CLOSING REGISTER ─────────────────────── */}
      <Dialog open={closeRegisterDialogOpen} onOpenChange={setCloseRegisterDialogOpen} title="ညနေပိုင်း ငွေစာရင်းချုပ်ရန် (Close Cash Register)">
        <form onSubmit={handleCloseDailyClosing} className="space-y-4">
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 text-xs">
            <p className="text-zinc-500">မနက်ပိုင်း မူလလက်ကျန် (Opening Balance):</p>
            <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100 font-mono">
              {formatCurrency(selectedClosing?.openingCash)}
            </p>
          </div>

          <Input
            type="number"
            step="any"
            label="ယနေ့ ရငွေစုစုပေါင်း (Total Cash Received Today) *"
            value={closeRegisterForm.cashReceived}
            onChange={e => setCloseRegisterForm({ ...closeRegisterForm, cashReceived: e.target.value })}
            required
          />

          <Input
            type="number"
            step="any"
            label="ယနေ့ ပေးငွေစုစုပေါင်း (Total Cash Disbursed / Paid Today) *"
            value={closeRegisterForm.cashPaid}
            onChange={e => setCloseRegisterForm({ ...closeRegisterForm, cashPaid: e.target.value })}
            required
          />

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setCloseRegisterDialogOpen(false)} className="w-full sm:w-auto cursor-pointer">
              မလုပ်တော့ပါ
            </Button>
            <Button type="submit" variant="primary" className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 cursor-pointer">
              ငွေစာရင်း အတည်ပြုချုပ်မည်
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── CONTEXTUAL SHEET: PAYMENT INSPECTION ────────────────────── */}
      <Sheet
        open={paymentSheetOpen}
        onOpenChange={setPaymentSheetOpen}
        title={`ပြေစာအမှတ်: ${selectedPayment?.paymentNo || ''}`}
        description={`ကျသင့်ငွေ: ${formatCurrency(selectedPayment?.amount)} • ပေးချေနည်းလမ်း: ${selectedPayment?.paymentMethod || ''}`}
        footer={
          selectedPayment && (
            <div className="flex justify-between items-center w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenPrintPayment(selectedPayment)}
                className="gap-1.5 text-xs text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>
                  {selectedPayment.paymentType === 'CUSTOMER_PAYMENT'
                    ? 'ငွေရပြေစာ ပရင့်ထုတ်ပါ (Print Money Receipt)'
                    : 'ငွေပေးချေလွှာ ပရင့်ထုတ်ပါ (Print Payment Voucher)'}
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
                <p className="text-[10px] font-bold uppercase text-zinc-400">ပေးချေမှု အမျိုးအစား</p>
                <p className="font-semibold mt-1">
                  {selectedPayment.paymentType === 'CUSTOMER_PAYMENT'
                    ? 'ဝယ်ယူသူထံမှ ရငွေ'
                    : selectedPayment.paymentType === 'SUPPLIER_PAYMENT'
                      ? 'ကုန်သွင်းသူသို့ ပေးငွေ'
                      : 'အထွေထွေ အသုံးစရိတ်'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">ရက်စွဲ</p>
                <p className="font-semibold mt-1">{formatDate(selectedPayment.paymentDate)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">ဆက်သွယ်သူ / လက်ခံသူ</p>
                <p className="font-semibold mt-1">{selectedPayment.customer?.name || selectedPayment.supplier?.name || '-'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">GL စာရင်းအခြေအနေ</p>
                <p className="font-semibold text-emerald-600 mt-1">✓ Double-Entry စာရင်းသွင်းပြီး</p>
              </div>
            </div>
          </div>
        )}
      </Sheet>

      {/* ─── CONTEXTUAL SHEET: DOUBLE ENTRY GENERAL LEDGER INSPECTION ── */}
      <Sheet
        open={jeSheetOpen}
        onOpenChange={setJeSheetOpen}
        title={`ဂျာနယ်အမှတ်: ${selectedJe?.entryNo || ''}`}
        description={`ရက်စွဲ: ${formatDate(selectedJe?.entryDate)} • ကိုးကား: ${selectedJe?.referenceType || 'တိုက်ရိုက်'} #${selectedJe?.referenceId || ''}`}
      >
        {selectedJe && (
          <div className="space-y-6 text-xs">
            <div className="p-3.5 sm:p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 space-y-1">
              <p className="text-[10px] font-bold uppercase text-zinc-400">ဖော်ပြချက် / အကြောင်းအရာ</p>
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">{selectedJe.description || 'စနစ်အလိုအလျောက် စာရင်းသွင်းချက်'}</p>
            </div>

            {/* Balanced T-Account Double Entry Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider text-xs flex items-center gap-1.5">
                  <Scale className="h-4 w-4 text-blue-600" />
                  <span>Double-Entry GL နှစ်ဖက်မျှ စာရင်းများ</span>
                </h4>
                <Badge variant="success" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" /> ကိုက်ညီမှုရှိသည် (Balanced ✓)
                </Badge>
              </div>

              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-zinc-600 dark:text-zinc-400">စာရင်းခေါင်းစဉ် (Account)</th>
                      <th className="px-3 py-2 text-right font-semibold text-zinc-600 dark:text-zinc-400">ဒေဘစ် (DR)</th>
                      <th className="px-3 py-2 text-right font-semibold text-zinc-600 dark:text-zinc-400">ခရက်ဒစ် (CR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {(selectedJe.lines || []).map((line, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                        <td className="px-3 py-2.5">
                          <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {line.account?.accountName || `စာရင်း #${line.accountId}`}
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
                      <td className="px-3 py-2.5">စုစုပေါင်း (Total)</td>
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
            ? 'တရားဝင် ငွေရပြေစာ ပရင့်ထုတ်ရန်'
            : 'ငွေပေးချေလွှာ ပရင့်ထုတ်ရန်'
        }
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
                  <span>📄 A4 ဘဏ္ဍာရေး တရားဝင် စာရွက်စာတမ်း</span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  စာရင်းကိုင်၊ စာရင်းစစ်နှင့် မော်ကွန်းထိန်းသိမ်းမှုအတွက် တရားဝင် A4 စာရွက်ပုံစံ
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
                  <span>🧾 80mm POS အပူပေးစလစ် (Thermal Slip)</span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  ကောင်တာငွေကိုင်နှင့် လက်ငင်းပေးချေမှုများအတွက် အမြန်ထုတ် စလစ်ပြေစာ
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
                လုပ်ငန်းခေါင်းစီးနှင့် လိပ်စာ ထည့်သွင်းမည် (Include Official Letterhead)
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
                လက်မှတ်နှင့် စိစစ်အတည်ပြုချက် အကွက်များ ထည့်သွင်းမည် (Include Signatures Block)
              </span>
            </label>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setPrintDialogOpen(false)} className="w-full sm:w-auto cursor-pointer">
              မလုပ်တော့ပါ
            </Button>
            <Button type="button" variant="primary" onClick={handleExecutePrint} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 gap-1.5 cursor-pointer">
              <Printer className="h-4 w-4" />
              <span>ပရင့်ထုတ်မည် (Print Document)</span>
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
                  <p className="text-[10px]">{orgContext.branchName || 'ငွေစာရင်းဌာန'}</p>
                  <p className="text-[10px] uppercase font-bold mt-1">*** တရားဝင် ငွေရပြေစာ (MONEY RECEIPT) ***</p>
                  <p className="text-[9px]">ပြေစာအမှတ်: {selectedPrintPayment.paymentNo}</p>
                  <p className="text-[9px]">ရက်စွဲ: {formatDate(selectedPrintPayment.paymentDate)}</p>
                </div>

                <div className="border-b border-dashed border-black py-1 space-y-0.5 text-[10px]">
                  <p>ငွေပေးသွင်းသူ: <span className="font-bold">{selectedPrintPayment.customer?.name || 'ဝယ်ယူသူ'}</span></p>
                  {selectedPrintPayment.customer?.phoneNumber && <p>ဖုန်း: {selectedPrintPayment.customer.phoneNumber}</p>}
                  <p>ပေးချေနည်းလမ်း: <span className="font-bold">{selectedPrintPayment.paymentMethod}</span></p>
                  {selectedPrintPayment.referenceType && (
                    <p>ကိုးကား: {selectedPrintPayment.referenceType} #{selectedPrintPayment.referenceId || ''}</p>
                  )}
                  {selectedPrintPayment.description && (
                    <p className="truncate">အကြောင်းအရာ: {selectedPrintPayment.description}</p>
                  )}
                </div>

                <div className="border-b border-dashed border-black py-2 text-center space-y-1">
                  <span className="text-[10px] font-bold">စုစုပေါင်း လက်ခံရရှိငွေ:</span>
                  <p className="text-sm font-bold font-mono">{formatCurrency(selectedPrintPayment.amount)}</p>
                </div>

                <div className="pt-3 text-[9px] space-y-4 border-t border-dashed border-black">
                  <div className="space-y-3">
                    <div>
                      <p>ငွေကိုင် / လက်ခံသူ လက်မှတ်: _________________</p>
                    </div>
                    <div>
                      <p>ငွေပေးသွင်းသူ လက်မှတ်: _________________</p>
                    </div>
                  </div>
                  <div className="text-center text-[8px] pt-1">
                    <p>ပေးချေမှုအတွက် ကျေးဇူးတင်ပါသည်!</p>
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
                        ဌာနခွဲ: {orgContext.branchName || 'ရုံးချုပ်'} • ဘဏ္ဍာရေးနှင့် စာရင်းကိုင်ဌာန
                      </p>
                      <p className="text-[11px] text-gray-600">
                        တရားဝင် ငွေရပြေစာနှင့် စာရင်းရှင်းလင်းချက် အတည်ပြုလွှာ
                      </p>
                    </div>

                    <div className="text-right text-xs space-y-0.5">
                      <p className="font-bold font-mono text-sm">RECEIPT NO: {selectedPrintPayment.paymentNo}</p>
                      <p className="text-gray-600">ပြေစာရက်စွဲ: {formatDate(selectedPrintPayment.paymentDate)}</p>
                      <p className="text-gray-600">ပေးချေနည်းလမ်း: <span className="font-bold">{selectedPrintPayment.paymentMethod}</span></p>
                      <p className="text-gray-600">GL အခြေအနေ: <span className="font-bold text-emerald-600">စာရင်းသွင်းပြီး ✓</span></p>
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
                      <p className="font-bold text-sm mt-0.5">{selectedPrintPayment.customer?.name || 'ဝယ်ယူသူ'}</p>
                      <p className="text-gray-600">ဆက်သွယ်ရန်: {selectedPrintPayment.customer?.phoneNumber || '-'}</p>
                      <p className="text-gray-600">နေရပ်လိပ်စာ: {selectedPrintPayment.customer?.address || '-'}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="font-bold uppercase text-[10px] text-gray-500">Accounting Reference</p>
                      <p className="text-gray-700">ကိုးကား: {selectedPrintPayment.referenceType || 'တိုက်ရိုက် ဝယ်ယူသူငွေသွင်းပြေစာ'}</p>
                      {selectedPrintPayment.referenceId && <p className="text-gray-700 font-mono">Ref Doc ID: #{selectedPrintPayment.referenceId}</p>}
                      <p className="text-gray-700">ပေးချေနည်းလမ်း: <span className="font-bold">{selectedPrintPayment.paymentMethod}</span></p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-3">
                    <p className="text-gray-600">
                      <span className="font-semibold text-gray-800">ဖော်ပြချက် / အကြောင်းအရာ: </span>
                      {selectedPrintPayment.description || 'ဝယ်ယူသူ အရောင်းစာရင်း ပေးချေရှင်းလင်းငွေ'}
                    </p>
                  </div>
                </div>

                {/* Received Amount Callout */}
                <div className="border-2 border-black rounded p-4 bg-white flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-gray-500">Total Net Amount Received (စုစုပေါင်း လက်ခံရရှိငွေ)</p>
                    <p className="text-xs text-gray-700 font-medium mt-1">တရားဝင်သုံးစွဲငွေကြေး: မြန်မာကျပ်ငွေ (MMK)</p>
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
                          <p className="text-[10px] text-gray-500">ရက်စွဲ: ____/____/202___</p>
                        </div>
                      </div>

                      <div className="space-y-8">
                        <p className="font-bold uppercase text-[10px] text-gray-600">Payer / Customer Received By (ငွေပေးသွင်းသူ)</p>
                        <div className="border-b border-gray-400 mx-8"></div>
                        <div>
                          <p className="font-semibold">{selectedPrintPayment.customer?.name || 'ဝယ်ယူသူ'}</p>
                          <p className="text-[10px] text-gray-500">ရက်စွဲ: ____/____/202___</p>
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
                  <p className="text-[10px]">{orgContext.branchName || 'ငွေတိုက်ဌာန'}</p>
                  <p className="text-[10px] uppercase font-bold mt-1">*** ငွေပေးချေလွှာ (PAYMENT VOUCHER) ***</p>
                  <p className="text-[9px]">ဘောက်ချာအမှတ်: {selectedPrintPayment.paymentNo}</p>
                  <p className="text-[9px]">ရက်စွဲ: {formatDate(selectedPrintPayment.paymentDate)}</p>
                </div>

                <div className="border-b border-dashed border-black py-1 space-y-0.5 text-[10px]">
                  <p>ငွေလက်ခံသူ: <span className="font-bold">{selectedPrintPayment.supplier?.name || 'ငွေလက်ခံသူ / ကုန်သွင်းသူ'}</span></p>
                  <p>အမျိုးအစား: {selectedPrintPayment.paymentType}</p>
                  <p>ပေးချေနည်းလမ်း: {selectedPrintPayment.paymentMethod}</p>
                  {selectedPrintPayment.description && (
                    <p className="truncate">မှတ်ချက်: {selectedPrintPayment.description}</p>
                  )}
                </div>

                <div className="border-b border-dashed border-black py-2 text-center space-y-1">
                  <span className="text-[10px] font-bold">ပေးချေငွေ စုစုပေါင်း:</span>
                  <p className="text-sm font-bold font-mono">{formatCurrency(selectedPrintPayment.amount)}</p>
                </div>

                <div className="pt-3 text-[9px] space-y-4 border-t border-dashed border-black">
                  <div className="space-y-3">
                    <div>
                      <p>ငွေထုတ်ပေးသူ: _________________</p>
                    </div>
                    <div>
                      <p>ငွေလက်ခံရရှိသူ: _________________</p>
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
                        ဌာနခွဲ: {orgContext.branchName || 'ရုံးချုပ်'} • ပေးရန်တာဝန်နှင့် ဘဏ္ဍာရေးဌာန
                      </p>
                      <p className="text-[11px] text-gray-600">
                        တရားဝင် ငွေပေးချေလွှာနှင့် ငွေထုတ်ပေးမှု ခွင့်ပြုချက်စာရွက်
                      </p>
                    </div>

                    <div className="text-right text-xs space-y-0.5">
                      <p className="font-bold font-mono text-sm">VOUCHER NO: {selectedPrintPayment.paymentNo}</p>
                      <p className="text-gray-600">ဘောက်ချာရက်စွဲ: {formatDate(selectedPrintPayment.paymentDate)}</p>
                      <p className="text-gray-600">ပေးချေမှု အမျိုးအစား: <span className="font-bold">{selectedPrintPayment.paymentType}</span></p>
                      <p className="text-gray-600">GL အခြေအနေ: <span className="font-bold text-emerald-600">စာရင်းသွင်းပြီး ✓</span></p>
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
                      <p className="font-bold text-sm mt-0.5">{selectedPrintPayment.supplier?.name || selectedPrintPayment.description || 'ငွေလက်ခံသူ'}</p>
                      {selectedPrintPayment.supplier?.phoneNumber && (
                        <p className="text-gray-600">ဆက်သွယ်ရန်: {selectedPrintPayment.supplier.phoneNumber}</p>
                      )}
                      {selectedPrintPayment.supplier?.location && (
                        <p className="text-gray-600">တည်နေရာ: {selectedPrintPayment.supplier.location}</p>
                      )}
                    </div>
                    <div className="text-right space-y-1">
                      <p className="font-bold uppercase text-[10px] text-gray-500">Payment Authorization</p>
                      <p className="text-gray-700">ပေးချေနည်းလမ်း: <span className="font-bold">{selectedPrintPayment.paymentMethod}</span></p>
                      <p className="text-gray-700">ကိုးကား: {selectedPrintPayment.referenceType || 'တိုက်ရိုက် AP ပေးချေမှု'}</p>
                      {selectedPrintPayment.referenceId && <p className="text-gray-700 font-mono">Ref Doc ID: #{selectedPrintPayment.referenceId}</p>}
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-3">
                    <p className="text-gray-600">
                      <span className="font-semibold text-gray-800">အကြောင်းအရာ အသေးစိတ်: </span>
                      {selectedPrintPayment.description || 'ကုန်သွင်းသူ ပြေစာရှင်းလင်းငွေ သို့မဟုတ် လုပ်ငန်းလည်ပတ်မှု အသုံးစရိတ် ပေးချေငွေ'}
                    </p>
                  </div>
                </div>

                {/* Amount Callout */}
                <div className="border-2 border-black rounded p-4 bg-white flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-gray-500">Total Net Amount Paid (စုစုပေါင်း ပေးချေငွေ)</p>
                    <p className="text-xs text-gray-700 font-medium mt-1">တရားဝင်သုံးစွဲငွေကြေး: မြန်မာကျပ်ငွေ (MMK)</p>
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
                          <p className="font-semibold">{user?.name || 'စာရင်းကိုင်'}</p>
                          <p className="text-[10px] text-gray-500">ရက်စွဲ: ____/____/202___</p>
                        </div>
                      </div>

                      <div className="space-y-8">
                        <p className="font-bold uppercase text-[10px] text-gray-600">Approved By (မန်နေဂျာ/ညွှန်ကြားရေးမှူး)</p>
                        <div className="border-b border-gray-400 mx-4"></div>
                        <div>
                          <p className="font-semibold">Finance Director / MD</p>
                          <p className="text-[10px] text-gray-500">ရက်စွဲ: ____/____/202___</p>
                        </div>
                      </div>

                      <div className="space-y-8">
                        <p className="font-bold uppercase text-[10px] text-gray-600">Received By Payee (ငွေလက်ခံရရှိသူ)</p>
                        <div className="border-b border-gray-400 mx-4"></div>
                        <div>
                          <p className="font-semibold">{selectedPrintPayment.supplier?.name || 'ငွေလက်ခံသူ'}</p>
                          <p className="text-[10px] text-gray-500">ရက်စွဲ: ____/____/202___</p>
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
          className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl flex items-center justify-center p-0 active:scale-95 transition-transform cursor-pointer"
          title="အသစ်ပြုလုပ်ရန်"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
