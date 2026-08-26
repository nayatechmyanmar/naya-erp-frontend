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
  TrendingDown,
  TrendingUp,
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
  const { orgContext } = useAuth();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = React.useState('accounts');
  const [isLoading, setIsLoading] = React.useState(true);

  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [dailyClosings, setDailyClosings] = React.useState<DailyClosing[]>([]);
  const [journalEntries, setJournalEntries] = React.useState<JournalEntry[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);

  // Dialog & Sheet States
  const [accountDialogOpen, setAccountDialogOpen] = React.useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = React.useState(false);
  const [closingDialogOpen, setClosingDialogOpen] = React.useState(false);
  const [closeRegisterDialogOpen, setCloseRegisterDialogOpen] = React.useState(false);
  const [selectedClosing, setSelectedClosing] = React.useState<DailyClosing | null>(null);
  const [selectedJe, setSelectedJe] = React.useState<JournalEntry | null>(null);
  const [jeSheetOpen, setJeSheetOpen] = React.useState(false);

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
      success('Account Created', `Added ${accountForm.accountCode} - ${accountForm.accountName}`);
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
      error('Please specify valid positive amount');
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
      success('Payment Recorded & GL Entry Posted', 'Double-entry journal auto-generated');
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
      success('Daily Cash Register Opened');
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
      success('Daily Cash Register Closed', `Closing Cash: ${formatCurrency(res.data?.closingCash)}`);
      setCloseRegisterDialogOpen(false);
      loadAccountingData();
    } else {
      error('Close register failed', res.message);
    }
  };

  // Account Columns
  const accountColumns: Column<Account>[] = [
    { header: 'Code', accessorKey: 'accountCode', sortable: true, className: 'font-mono font-bold text-blue-600' },
    { header: 'Account Name', accessorKey: 'accountName', sortable: true, className: 'font-semibold' },
    {
      header: 'Type',
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
      header: 'Type',
      accessorKey: 'paymentType',
      cell: r => {
        const typeMap: Record<string, { label: string; variant: 'success' | 'destructive' | 'secondary' }> = {
          CUSTOMER_PAYMENT: { label: 'Customer Payment (Inflow)', variant: 'success' },
          SUPPLIER_PAYMENT: { label: 'Supplier Payment (Outflow)', variant: 'destructive' },
          EXPENSE_PAYMENT: { label: 'Expense Payment', variant: 'secondary' },
        };
        const item = typeMap[r.paymentType] || { label: r.paymentType, variant: 'secondary' };
        return <Badge variant={item.variant}>{item.label}</Badge>;
      },
    },
    {
      header: 'Partner',
      cell: r => r.customer?.name || r.supplier?.name || (r.description ? r.description : '-'),
    },
    {
      header: 'Amount',
      cell: r => <span className="font-bold text-zinc-900 dark:text-zinc-100">{formatCurrency(r.amount)}</span>,
      sortable: true,
    },
    { header: 'Method', cell: r => <Badge variant="outline">{r.paymentMethod}</Badge> },
    { header: 'Date', cell: r => formatDate(r.paymentDate), sortable: true },
  ];

  // Daily Closing Columns
  const closingColumns: Column<DailyClosing>[] = [
    { header: 'Closing Date', cell: r => formatDate(r.closingDate), sortable: true, className: 'font-bold' },
    { header: 'Opening Cash', cell: r => formatCurrency(r.openingCash) },
    { header: 'Cash Received', cell: r => formatCurrency(r.cashReceived ?? 0) },
    { header: 'Cash Paid', cell: r => formatCurrency(r.cashPaid ?? 0) },
    {
      header: 'Closing Cash',
      cell: r => (
        <span className="font-bold text-blue-600 dark:text-blue-400">
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
            <Lock className="h-3 w-3 mr-1" /> Close Register
          </Button>
        ) : (
          <span className="text-[11px] text-zinc-400">Closed</span>
        ),
    },
  ];

  // Journal Entry Columns
  const jeColumns: Column<JournalEntry>[] = [
    { header: 'Entry No', accessorKey: 'entryNo', sortable: true, className: 'font-mono font-bold text-blue-600' },
    { header: 'Date', cell: r => formatDate(r.entryDate), sortable: true },
    { header: 'Description', accessorKey: 'description' },
    { header: 'Reference', cell: r => r.referenceType ? `${r.referenceType} #${r.referenceId || ''}` : 'Direct' },
    { header: 'Status', cell: r => <StatusBadge status={r.status} /> },
    {
      header: 'Actions',
      className: 'text-right',
      cell: r => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedJe(r);
            setJeSheetOpen(true);
          }}
          className="h-7 text-xs"
        >
          <Eye className="h-3.5 w-3.5" /> Inspect
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Accounting & General Ledger
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Full double-entry general ledger, chart of accounts, payment reconciliation, and cashier daily closing registers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadAccountingData} className="gap-1.5 h-8 text-xs">
            <RefreshCw className={isLoading ? 'animate-spin h-3.5 w-3.5' : 'h-3.5 w-3.5'} />
            <span>Refresh</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAccountDialogOpen(true)} className="gap-1.5 h-8 text-xs">
            <Plus className="h-3.5 w-3.5" />
            <span>+ New Account</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setClosingDialogOpen(true)} className="gap-1.5 h-8 text-xs">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>Open Daily Closing</span>
          </Button>
          <Button variant="primary" size="sm" onClick={() => setPaymentDialogOpen(true)} className="gap-1.5 h-8 text-xs">
            <Receipt className="h-3.5 w-3.5" />
            <span>+ Record Payment</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-zinc-100 dark:bg-zinc-800">
          <TabsTrigger value="accounts" count={accounts.length}>
            Chart of Accounts
          </TabsTrigger>
          <TabsTrigger value="payments" count={payments.length}>
            Payments
          </TabsTrigger>
          <TabsTrigger value="closings" count={dailyClosings.length}>
            Daily Closings
          </TabsTrigger>
          <TabsTrigger value="journal" count={journalEntries.length}>
            General Ledger (Journal)
          </TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: CHART OF ACCOUNTS ───────────────────────────────── */}
        <TabsContent value="accounts">
          <DataTable
            data={accounts}
            columns={accountColumns}
            searchPlaceholder="Search accounts by code or name..."
            searchKey="accountName"
            isLoading={isLoading}
          />
        </TabsContent>

        {/* ─── TAB 2: PAYMENTS ────────────────────────────────────────── */}
        <TabsContent value="payments">
          <DataTable
            data={payments}
            columns={paymentColumns}
            searchPlaceholder="Search payment transactions..."
            searchKey="paymentNo"
            isLoading={isLoading}
          />
        </TabsContent>

        {/* ─── TAB 3: DAILY CLOSINGS ──────────────────────────────────── */}
        <TabsContent value="closings">
          <DataTable
            data={dailyClosings}
            columns={closingColumns}
            searchPlaceholder="Search daily closings..."
            isLoading={isLoading}
          />
        </TabsContent>

        {/* ─── TAB 4: GENERAL LEDGER JOURNAL ENTRIES ──────────────────── */}
        <TabsContent value="journal">
          <DataTable
            data={journalEntries}
            columns={jeColumns}
            searchPlaceholder="Search journal entries..."
            searchKey="entryNo"
            isLoading={isLoading}
            onRowClick={r => {
              setSelectedJe(r);
              setJeSheetOpen(true);
            }}
          />
        </TabsContent>
      </Tabs>

      {/* ─── MODAL: NEW ACCOUNT ─────────────────────────────────────── */}
      <Dialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen} title="Add Chart of Account">
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
            <option value="ASSET">ASSET (Current / Fixed Assets)</option>
            <option value="LIABILITY">LIABILITY (Payables / Obligations)</option>
            <option value="EQUITY">EQUITY (Capital / Retained Earnings)</option>
            <option value="REVENUE">REVENUE (Sales / Other Income)</option>
            <option value="EXPENSE">EXPENSE (Cost of Goods / Operational)</option>
          </Select>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setAccountDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Account
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── MODAL: RECORD PAYMENT ──────────────────────────────────── */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen} title="Record Payment & Sync GL" maxWidth="lg">
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <Select
            label="Payment Type *"
            value={paymentForm.paymentType}
            onChange={e => setPaymentForm({ ...paymentForm, paymentType: e.target.value as PaymentType })}
            required
          >
            <option value="CUSTOMER_PAYMENT">Customer Payment (Accounts Receivable Inflow)</option>
            <option value="SUPPLIER_PAYMENT">Supplier Payment (Accounts Payable Outflow)</option>
            <option value="EXPENSE_PAYMENT">Direct Expense Payment</option>
          </Select>

          {paymentForm.paymentType === 'CUSTOMER_PAYMENT' && (
            <Select
              label="Customer *"
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
              label="Supplier *"
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

          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              step="any"
              label="Payment Amount *"
              placeholder="e.g. 500000"
              value={paymentForm.amount}
              onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
              required
            />

            <Select
              label="Payment Method *"
              value={paymentForm.paymentMethod}
              onChange={e => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value as PaymentMethod })}
              required
            >
              <option value="CASH">Cash</option>
              <option value="BANK">Bank Transfer / Check</option>
              <option value="OTHER">Other / Mobile Pay</option>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              type="date"
              label="Payment Date *"
              value={paymentForm.paymentDate}
              onChange={e => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
              required
            />
            <Input
              label="Description / Memo"
              placeholder="e.g. Invoice settlement"
              value={paymentForm.description}
              onChange={e => setPaymentForm({ ...paymentForm, description: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Record Payment & Post GL
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── MODAL: OPEN DAILY CLOSING ──────────────────────────────── */}
      <Dialog open={closingDialogOpen} onOpenChange={setClosingDialogOpen} title="Open Daily Cash Register">
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
            label="Opening Cash Float *"
            value={openClosingForm.openingCash}
            onChange={e => setOpenClosingForm({ ...openClosingForm, openingCash: e.target.value })}
            required
          />
          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setClosingDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Open Register
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── MODAL: CLOSE DAILY CLOSING REGISTER ─────────────────────── */}
      <Dialog open={closeRegisterDialogOpen} onOpenChange={setCloseRegisterDialogOpen} title="Close Cash Register">
        <form onSubmit={handleCloseDailyClosing} className="space-y-4">
          <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 text-xs">
            <p className="text-zinc-500">Opening Balance:</p>
            <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              {formatCurrency(selectedClosing?.openingCash)}
            </p>
          </div>

          <Input
            type="number"
            step="any"
            label="Total Cash Received Today"
            value={closeRegisterForm.cashReceived}
            onChange={e => setCloseRegisterForm({ ...closeRegisterForm, cashReceived: e.target.value })}
            required
          />

          <Input
            type="number"
            step="any"
            label="Total Cash Disbursed / Paid Today"
            value={closeRegisterForm.cashPaid}
            onChange={e => setCloseRegisterForm({ ...closeRegisterForm, cashPaid: e.target.value })}
            required
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setCloseRegisterDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="bg-amber-600 hover:bg-amber-700">
              Confirm Daily Close
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── CONTEXTUAL SHEET: DOUBLE ENTRY GENERAL LEDGER INSPECTION ── */}
      <Sheet
        open={jeSheetOpen}
        onOpenChange={setJeSheetOpen}
        title={`Journal Entry ${selectedJe?.entryNo || ''}`}
        description={`Date: ${formatDate(selectedJe?.entryDate)} • Ref: ${selectedJe?.referenceType || 'Direct'} #${selectedJe?.referenceId || ''}`}
      >
        {selectedJe && (
          <div className="space-y-6 text-xs">
            <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 space-y-1">
              <p className="text-[10px] font-bold uppercase text-zinc-400">Description</p>
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">{selectedJe.description || 'System Auto-Entry'}</p>
            </div>

            {/* Balanced T-Account Double Entry Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider text-xs flex items-center gap-1.5">
                  <Scale className="h-4 w-4 text-blue-600" />
                  <span>Double-Entry General Ledger Lines</span>
                </h4>
                <Badge variant="success" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Balanced ✓
                </Badge>
              </div>

              <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
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
                      <td className="px-3 py-2.5">Total</td>
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
    </div>
  );
}
