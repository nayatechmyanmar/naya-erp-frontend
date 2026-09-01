'use client';

import * as React from 'react';
import {
  Users,
  ShieldCheck,
  KeyRound,
  Plus,
  Search,
  Filter,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Edit2,
  Lock,
  Trash2,
  UserCheck,
  Building,
  RefreshCw,
  Eye,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { apiFetch } from '@/lib/api/bff-client';
import { UserProfile, Role, Permission, Branch } from '@/types/erp';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

export default function UsersPage() {
  const { success, error } = useToast();

  // ─── STATE ──────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = React.useState<'users' | 'roles' | 'matrix'>('users');
  const [loading, setLoading] = React.useState(true);

  // Data states
  const [users, setUsers] = React.useState<UserProfile[]>([]);
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [branches, setBranches] = React.useState<Branch[]>([]);
  const [permissionsGrouped, setPermissionsGrouped] = React.useState<Record<string, Permission[]>>({});
  const [allPermissions, setAllPermissions] = React.useState<Permission[]>([]);

  // Filter states for Users tab
  const [searchTerm, setSearchTerm] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState<string>('ALL');
  const [branchFilter, setBranchFilter] = React.useState<string>('ALL');
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL');

  // Dialog states
  const [isCreateUserOpen, setIsCreateUserOpen] = React.useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = React.useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = React.useState(false);
  const [isCreateRoleOpen, setIsCreateRoleOpen] = React.useState(false);
  const [isEditRoleOpen, setIsEditRoleOpen] = React.useState(false);

  // Selected records for editing
  const [selectedUser, setSelectedUser] = React.useState<UserProfile | null>(null);
  const [selectedRole, setSelectedRole] = React.useState<Role | null>(null);

  // Form states
  const [userForm, setUserForm] = React.useState({
    name: '',
    email: '',
    password: '',
    phoneNumber: '',
    address: '',
    branchId: '',
    roleId: '',
  });

  const [editUserForm, setEditUserForm] = React.useState({
    name: '',
    email: '',
    phoneNumber: '',
    address: '',
    branchId: '',
    roleId: '',
  });

  const [resetPasswordForm, setResetPasswordForm] = React.useState({
    newPassword: '',
    confirmPassword: '',
  });

  const [roleForm, setRoleForm] = React.useState({
    name: '',
    description: '',
    selectedPermissionIds: [] as number[],
  });

  const [editRoleForm, setEditRoleForm] = React.useState({
    name: '',
    description: '',
    selectedPermissionIds: [] as number[],
  });

  const [submitting, setSubmitting] = React.useState(false);

  // ─── DATA FETCHING ──────────────────────────────────────────────────
  const fetchAllData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes, branchesRes, permsRes] = await Promise.all([
        apiFetch<UserProfile[]>('/api/users?limit=1000'),
        apiFetch<Role[]>('/api/roles'),
        apiFetch<Branch[]>('/api/master/branches'),
        apiFetch<{ all: Permission[]; grouped: Record<string, Permission[]> }>('/api/roles/permissions'),
      ]);

      if (usersRes.success && Array.isArray(usersRes.data)) {
        const uniqueUsers = Array.from(new Map(usersRes.data.map(u => [u.id, u])).values());
        setUsers(uniqueUsers);
      }
      if (rolesRes.success && Array.isArray(rolesRes.data)) {
        const uniqueRoles = Array.from(
          new Map(rolesRes.data.map(r => [r.name.trim().toUpperCase(), r])).values()
        );
        setRoles(uniqueRoles);
      }
      if (branchesRes.success && Array.isArray(branchesRes.data)) {
        const uniqueBranches = Array.from(new Map(branchesRes.data.map(b => [b.id, b])).values());
        setBranches(uniqueBranches);
      }
      if (permsRes.success && permsRes.data) {
        const allList = permsRes.data.all || [];
        const uniquePerms = Array.from(new Map(allList.map(p => [p.code, p])).values());
        setAllPermissions(uniquePerms);
        setPermissionsGrouped(permsRes.data.grouped || {});
      }
    } catch (e: any) {
      error('အချက်အလက် ရယူ၍မရပါ', 'အသုံးပြုသူနှင့် လုပ်ပိုင်ခွင့် အချက်အလက်များ မရရှိနိုင်ပါ');
    } finally {
      setLoading(false);
    }
  }, [error]);

  React.useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // ─── USER ACTIONS ───────────────────────────────────────────────────
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.name || !userForm.email || !userForm.password || !userForm.roleId) {
      error('လိုအပ်ချက်', 'ကျေးဇူးပြု၍ လိုအပ်သောအချက်အလက်များအားလုံး ဖြည့်သွင်းပါ');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: userForm.name,
        email: userForm.email,
        password: userForm.password,
        phoneNumber: userForm.phoneNumber || undefined,
        address: userForm.address || undefined,
        branchId: userForm.branchId ? Number(userForm.branchId) : undefined,
        roleId: Number(userForm.roleId),
      };

      const res = await apiFetch('/api/users', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        success('အောင်မြင်ပါသည်', 'အသုံးပြုသူ အကောင့်အသစ် ဖန်တီးပြီးပါပြီ');
        setIsCreateUserOpen(false);
        setUserForm({
          name: '',
          email: '',
          password: '',
          phoneNumber: '',
          address: '',
          branchId: '',
          roleId: '',
        });
        fetchAllData();
      } else {
        error('မအောင်မြင်ပါ', res.message || 'အသုံးပြုသူအသစ် ဖွင့်၍မရပါ');
      }
    } catch {
      error('ချို့ယွင်းချက်', 'အသုံးပြုသူအသစ် ဖွင့်ရာတွင် ချို့ယွင်းချက်ဖြစ်ပေါ်ပါသည်');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEditUser = (user: UserProfile) => {
    setSelectedUser(user);
    setEditUserForm({
      name: user.name || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      address: user.address || '',
      branchId: user.branchId ? String(user.branchId) : '',
      roleId: user.roleId ? String(user.roleId) : '',
    });
    setIsEditUserOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setSubmitting(true);
    try {
      const payload = {
        name: editUserForm.name,
        email: editUserForm.email,
        phoneNumber: editUserForm.phoneNumber || undefined,
        address: editUserForm.address || undefined,
        branchId: editUserForm.branchId ? Number(editUserForm.branchId) : null,
        roleId: editUserForm.roleId ? Number(editUserForm.roleId) : undefined,
      };

      const res = await apiFetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        success('အောင်မြင်ပါသည်', 'အသုံးပြုသူ အချက်အလက် ပြင်ဆင်ပြီးပါပြီ');
        setIsEditUserOpen(false);
        fetchAllData();
      } else {
        error('မအောင်မြင်ပါ', res.message || 'အချက်အလက် ပြင်ဆင်၍မရပါ');
      }
    } catch {
      error('ချို့ယွင်းချက်', 'ပြင်ဆင်ရာတွင် ချို့ယွင်းချက်ဖြစ်ပေါ်ပါသည်');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleUserStatus = async (user: UserProfile) => {
    try {
      const newStatus = !user.isActive;
      const res = await apiFetch(`/api/users/${user.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: newStatus }),
      });

      if (res.success) {
        success(
          'အခြေအနေ ပြောင်းလဲပြီးပါပြီ',
          newStatus ? `${user.name} ၏ အကောင့်ကို အသုံးပြုခွင့် ဖွင့်ပေးလိုက်ပါပြီ` : `${user.name} ၏ အကောင့်ကို ပိတ်သိမ်းလိုက်ပါပြီ`
        );
        fetchAllData();
      } else {
        error('လုပ်ဆောင်၍မရပါ', res.message || 'အခြေအနေ ပြောင်းလဲ၍မရပါ');
      }
    } catch {
      error('ချို့ယွင်းချက်', 'အကောင့်အခြေအနေ ပြောင်းလဲမှု မအောင်မြင်ပါ');
    }
  };

  const handleOpenResetPassword = (user: UserProfile) => {
    setSelectedUser(user);
    setResetPasswordForm({ newPassword: '', confirmPassword: '' });
    setIsResetPasswordOpen(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (resetPasswordForm.newPassword.length < 6) {
      error('လိုအပ်ချက်', 'Password သည် အနည်းဆုံး စာလုံးရေ ၆ လုံး ရှိရပါမည်');
      return;
    }
    if (resetPasswordForm.newPassword !== resetPasswordForm.confirmPassword) {
      error('ကိုက်ညီမှုမရှိပါ', 'ရိုက်ထည့်ထားသော Password နှစ်ခု တူညီမှုမရှိပါ');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch(`/api/users/${selectedUser.id}/reset-password`, {
        method: 'PUT',
        body: JSON.stringify({ newPassword: resetPasswordForm.newPassword }),
      });

      if (res.success) {
        success('Password ပြောင်းလဲပြီးပါပြီ', `${selectedUser.name} ၏ Password အသစ် သတ်မှတ်ပြီးပါပြီ`);
        setIsResetPasswordOpen(false);
      } else {
        error('မအောင်မြင်ပါ', res.message || 'Password ပြောင်းလဲ၍မရပါ');
      }
    } catch {
      error('ချို့ယွင်းချက်', 'Password ပြောင်းလဲခြင်း မအောင်မြင်ပါ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (user: UserProfile) => {
    if (!confirm(`အသုံးပြုသူ '${user.name}' အား စနစ်မှ အပြီးတိုင် ဖျက်ပစ်ရန် သေချာပါသလား?`)) {
      return;
    }

    try {
      const res = await apiFetch(`/api/users/${user.id}`, { method: 'DELETE' });
      if (res.success) {
        success('ဖျက်ပစ်ပြီးပါပြီ', 'အသုံးပြုသူ အကောင့်ကို ဖျက်ပစ်ပြီးပါပြီ');
        fetchAllData();
      } else {
        error('ဖျက်၍မရပါ', res.message || 'အသုံးပြုသူအား ဖျက်၍မရပါ');
      }
    } catch {
      error('ချို့ယွင်းချက်', 'အသုံးပြုသူအား ဖျက်ပစ်ရာတွင် ချို့ယွင်းချက်ဖြစ်ပေါ်ပါသည်');
    }
  };

  // ─── ROLE ACTIONS ───────────────────────────────────────────────────
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleForm.name) {
      error('လိုအပ်ချက်', 'Role အမည် ရိုက်ထည့်ရန် လိုအပ်ပါသည်');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: roleForm.name,
        description: roleForm.description || undefined,
        permissionIds: roleForm.selectedPermissionIds,
      };

      const res = await apiFetch('/api/roles', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        success('အောင်မြင်ပါသည်', 'Role အသစ် အောင်မြင်စွာ ဖန်တီးပြီးပါပြီ');
        setIsCreateRoleOpen(false);
        setRoleForm({ name: '', description: '', selectedPermissionIds: [] });
        fetchAllData();
      } else {
        error('မအောင်မြင်ပါ', res.message || 'Role အသစ် ဖန်တီး၍မရပါ');
      }
    } catch {
      error('ချို့ယွင်းချက်', 'Role အသစ် ဖန်တီးရာတွင် ချို့ယွင်းချက်ဖြစ်ပေါ်ပါသည်');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEditRole = async (role: Role) => {
    setSelectedRole(role);
    try {
      const res = await apiFetch<Role>(`/api/roles/${role.id}`);
      if (res.success && res.data) {
        const fullRole = res.data;
        const currentPermIds = (fullRole.permissions || []).map(p => p.id);
        setEditRoleForm({
          name: fullRole.name,
          description: fullRole.description || '',
          selectedPermissionIds: currentPermIds,
        });
      } else {
        setEditRoleForm({
          name: role.name,
          description: role.description || '',
          selectedPermissionIds: (role.permissions || []).map(p => p.id),
        });
      }
      setIsEditRoleOpen(true);
    } catch {
      setIsEditRoleOpen(true);
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    setSubmitting(true);
    try {
      const payload = {
        name: editRoleForm.name,
        description: editRoleForm.description,
        permissionIds: editRoleForm.selectedPermissionIds,
      };

      const res = await apiFetch(`/api/roles/${selectedRole.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        success('အောင်မြင်ပါသည်', 'Role လုပ်ပိုင်ခွင့်များ ပြင်ဆင်ပြီးပါပြီ');
        setIsEditRoleOpen(false);
        fetchAllData();
      } else {
        error('မအောင်မြင်ပါ', res.message || 'Role ပြင်ဆင်၍မရပါ');
      }
    } catch {
      error('ချို့ယွင်းချက်', 'Role ပြင်ဆင်ရာတွင် ချို့ယွင်းချက်ဖြစ်ပေါ်ပါသည်');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRole = async (role: Role) => {
    if (!confirm(`Role '${role.name}' အား ဖျက်ပစ်ရန် သေချာပါသလား?`)) return;

    try {
      const res = await apiFetch(`/api/roles/${role.id}`, { method: 'DELETE' });
      if (res.success) {
        success('ဖျက်ပစ်ပြီးပါပြီ', 'Role အား အောင်မြင်စွာ ဖျက်ပစ်ပြီးပါပြီ');
        fetchAllData();
      } else {
        error('ဖျက်၍မရပါ', res.message || 'Role အား ဖျက်ပစ်၍ မရပါ');
      }
    } catch {
      error('ချို့ယွင်းချက်', 'Role ဖျက်ပစ်ရာတွင် ချို့ယွင်းချက်ဖြစ်ပေါ်ပါသည်');
    }
  };

  // Toggle permission selection in role form
  const togglePermission = (permId: number, isEdit: boolean) => {
    if (isEdit) {
      setEditRoleForm(prev => {
        const exists = prev.selectedPermissionIds.includes(permId);
        return {
          ...prev,
          selectedPermissionIds: exists
            ? prev.selectedPermissionIds.filter(id => id !== permId)
            : [...prev.selectedPermissionIds, permId],
        };
      });
    } else {
      setRoleForm(prev => {
        const exists = prev.selectedPermissionIds.includes(permId);
        return {
          ...prev,
          selectedPermissionIds: exists
            ? prev.selectedPermissionIds.filter(id => id !== permId)
            : [...prev.selectedPermissionIds, permId],
        };
      });
    }
  };

  const toggleModulePermissions = (module: string, isEdit: boolean) => {
    const modulePermIds = (permissionsGrouped[module] || []).map(p => p.id);
    if (isEdit) {
      setEditRoleForm(prev => {
        const allSelected = modulePermIds.every(id => prev.selectedPermissionIds.includes(id));
        return {
          ...prev,
          selectedPermissionIds: allSelected
            ? prev.selectedPermissionIds.filter(id => !modulePermIds.includes(id))
            : Array.from(new Set([...prev.selectedPermissionIds, ...modulePermIds])),
        };
      });
    } else {
      setRoleForm(prev => {
        const allSelected = modulePermIds.every(id => prev.selectedPermissionIds.includes(id));
        return {
          ...prev,
          selectedPermissionIds: allSelected
            ? prev.selectedPermissionIds.filter(id => !modulePermIds.includes(id))
            : Array.from(new Set([...prev.selectedPermissionIds, ...modulePermIds])),
        };
      });
    }
  };

  // ─── FILTERED USERS ─────────────────────────────────────────────────
  const filteredUsers = React.useMemo(() => {
    return users.filter(u => {
      const matchesSearch =
        searchTerm === '' ||
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.phoneNumber && u.phoneNumber.includes(searchTerm));

      const matchesRole = roleFilter === 'ALL' || String(u.roleId) === roleFilter;
      const matchesBranch = branchFilter === 'ALL' || String(u.branchId) === branchFilter;
      const matchesStatus =
        statusFilter === 'ALL' || (statusFilter === 'ACTIVE' ? u.isActive : !u.isActive);

      return matchesSearch && matchesRole && matchesBranch && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, branchFilter, statusFilter]);

  // Metric counts
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.isActive).length;
  const adminUsers = users.filter(u => u.roleId === 1 || u.role?.name === 'ADMIN').length;
  const totalRoles = roles.length;

  return (
    <div className="space-y-6">
      {/* ─── PAGE HEADER & STATS ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <ShieldCheck className="h-6 w-6 text-blue-600" />
            အသုံးပြုသူများနှင့် လုပ်ပိုင်ခွင့် စီမံခန့်ခွဲမှု
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            လုပ်ငန်းသုံး အခန်းကဏ္ဍအလိုက် လုပ်ပိုင်ခွင့်သတ်မှတ်ခြင်း (RBAC)၊ ဝန်ထမ်းစာရင်းနှင့် ခွင့်ပြုချက်ဇယား
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAllData}
            disabled={loading}
            className="h-9 gap-1.5 text-xs cursor-pointer"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            ပြန်လည်ရယူရန်
          </Button>
          {activeTab === 'users' && (
            <Button
              size="sm"
              onClick={() => setIsCreateUserOpen(true)}
              className="h-9 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs cursor-pointer shadow-xs"
            >
              <Plus className="h-4 w-4" /> + ဝန်ထမ်းအသစ် ဖွင့်ရန်
            </Button>
          )}
          {activeTab === 'roles' && (
            <Button
              size="sm"
              onClick={() => setIsCreateRoleOpen(true)}
              className="h-9 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs cursor-pointer shadow-xs"
            >
              <Plus className="h-4 w-4" /> + Role အသစ် ဖန်တီးရန်
            </Button>
          )}
        </div>
      </div>

      {/* ─── KPI METRICS ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">စုစုပေါင်း အသုံးပြုသူ</span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{totalUsers}</div>
          <div className="mt-1 text-[11px] text-zinc-400">စနစ်တွင် မှတ်ပုံတင်ထားသော အကောင့်များ</div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">အသုံးပြုခွင့် ရရှိထားသူများ</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{activeUsers}</div>
          <div className="mt-1 text-[11px] text-zinc-400">{Math.round((activeUsers / (totalUsers || 1)) * 100)}% အသုံးပြုဆဲ အကောင့်များ</div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">သတ်မှတ်ထားသော Roles</span>
            <div className="h-8 w-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{totalRoles}</div>
          <div className="mt-1 text-[11px] text-zinc-400">ခွင့်ပြုချက် {allPermissions.length} မျိုး သတ်မှတ်ထားသည်</div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">ပင်မ အက်ဒမင်များ (Admins)</span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <KeyRound className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">{adminUsers}</div>
          <div className="mt-1 text-[11px] text-zinc-400">စနစ်တစ်ခုလုံး စီမံခန့်ခွဲခွင့် ရှိသည်</div>
        </div>
      </div>

      {/* ─── TAB NAVIGATION ──────────────────────────────────────────────── */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto">
        <button
          onClick={() => setActiveTab('users')}
          className={cn(
            'flex items-center gap-2 py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer',
            activeTab === 'users'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          )}
        >
          <Users className="h-4 w-4" />
          👥 ဝန်ထမ်းနှင့် အသုံးပြုသူများ စာရင်း ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={cn(
            'flex items-center gap-2 py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer',
            activeTab === 'roles'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          )}
        >
          <ShieldCheck className="h-4 w-4" />
          🛡️ အခန်းကဏ္ဍနှင့် လုပ်ပိုင်ခွင့်များ ({roles.length})
        </button>
        <button
          onClick={() => setActiveTab('matrix')}
          className={cn(
            'flex items-center gap-2 py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer',
            activeTab === 'matrix'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          )}
        >
          <Eye className="h-4 w-4" />
          👁️ လုပ်ပိုင်ခွင့် အသေးစိတ် ဇယား (Permissions Matrix)
        </button>
      </div>

      {/* ─── TAB 1: USERS DIRECTORY ──────────────────────────────────────── */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white dark:bg-zinc-900 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="အမည်၊ အီးမေးလ် သို့မဟုတ် ဖုန်းနံပါတ်ဖြင့် ရှာဖွေရန်..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="h-9 px-3 text-xs rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer"
              >
                <option value="ALL">Roles အားလုံး</option>
                {roles.map(r => (
                  <option key={r.id} value={String(r.id)}>
                    {r.name}
                  </option>
                ))}
              </select>

              <select
                value={branchFilter}
                onChange={e => setBranchFilter(e.target.value)}
                className="h-9 px-3 text-xs rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer"
              >
                <option value="ALL">ဌာနခွဲ အားလုံး</option>
                {branches.map(b => (
                  <option key={b.id} value={String(b.id)}>
                    {b.name}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="h-9 px-3 text-xs rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer"
              >
                <option value="ALL">အခြေအနေ အားလုံး</option>
                <option value="ACTIVE">အသုံးပြုခွင့် ရရှိထားသူ</option>
                <option value="INACTIVE">အကောင့်ပိတ်ထားသူ</option>
              </select>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 border-b border-zinc-200 dark:border-zinc-800 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3">အသုံးပြုသူ အမည် / အီးမေးလ်</th>
                  <th className="px-4 py-3">ဖုန်း / ဆက်သွယ်ရန်</th>
                  <th className="px-4 py-3">အခန်းကဏ္ဍ (Role)</th>
                  <th className="px-4 py-3">တာဝန်ကျ ဌာနခွဲ</th>
                  <th className="px-4 py-3">အခြေအနေ</th>
                  <th className="px-4 py-3 text-right">လုပ်ဆောင်ချက်</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                      ရှာဖွေမှုနှင့် ကိုက်ညီသော အသုံးပြုသူ မရှိပါ။
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(u => {
                    const role = roles.find(r => r.id === u.roleId) || u.role;
                    const branch = branches.find(b => b.id === u.branchId) || u.branch;
                    return (
                      <tr key={u.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold flex items-center justify-center text-xs shrink-0">
                              {u.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <div className="font-semibold text-zinc-900 dark:text-zinc-100">{u.name}</div>
                              <div className="text-[11px] text-zinc-400">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                          <div>{u.phoneNumber || '—'}</div>
                          <div className="text-[10px] text-zinc-400 truncate max-w-[150px]">{u.address || ''}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold',
                              role?.name === 'ADMIN'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : role?.name === 'MANAGER'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                                : role?.name?.startsWith('SALES')
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                                : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300'
                            )}
                          >
                            {role?.name || `Role #${u.roleId}`}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                          {branch ? `${branch.name} (${branch.code})` : 'ဌာနခွဲအားလုံး'}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold',
                              u.isActive
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                                : 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300'
                            )}
                          >
                            {u.isActive ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                            {u.isActive ? 'အသုံးပြုဆဲ' : 'ပိတ်ထားသည်'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEditUser(u)}
                              className="h-7 w-7 p-0 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
                              title="အချက်အလက် ပြင်ဆင်ရန်"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenResetPassword(u)}
                              className="h-7 w-7 p-0 text-amber-600 hover:text-amber-700 dark:hover:text-amber-400 cursor-pointer"
                              title="Password ပြန်သတ်မှတ်ရန်"
                            >
                              <Lock className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleUserStatus(u)}
                              className={cn(
                                'h-7 w-7 p-0 cursor-pointer',
                                u.isActive ? 'text-zinc-400 hover:text-red-600' : 'text-emerald-600 hover:text-emerald-700'
                              )}
                              title={u.isActive ? 'အကောင့်ပိတ်သိမ်းရန်' : 'အကောင့်ဖွင့်ပေးရန်'}
                            >
                              {u.isActive ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUser(u)}
                              className="h-7 w-7 p-0 text-red-500 hover:text-red-700 cursor-pointer"
                              title="အကောင့်ဖျက်ပစ်ရန်"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden space-y-3">
            {filteredUsers.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl text-center text-zinc-500 text-xs">
                အသုံးပြုသူ မရှိသေးပါ။
              </div>
            ) : (
              filteredUsers.map(u => {
                const role = roles.find(r => r.id === u.roleId) || u.role;
                const branch = branches.find(b => b.id === u.branchId) || u.branch;
                return (
                  <div
                    key={u.id}
                    className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold flex items-center justify-center text-sm">
                          {u.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">{u.name}</div>
                          <div className="text-xs text-zinc-400">{u.email}</div>
                        </div>
                      </div>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold',
                          u.isActive
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                            : 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300'
                        )}
                      >
                        {u.isActive ? 'အသုံးပြုဆဲ' : 'ပိတ်ထားသည်'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300">
                      <div>
                        <span className="text-zinc-400 text-[10px] block">အခန်းကဏ္ဍ (ROLE)</span>
                        <span className="font-medium">{role?.name || `Role #${u.roleId}`}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 text-[10px] block">တာဝန်ကျ ဌာနခွဲ</span>
                        <span className="font-medium">{branch ? branch.name : 'ရုံးချုပ်'}</span>
                      </div>
                      {u.phoneNumber && (
                        <div className="col-span-2">
                          <span className="text-zinc-400 text-[10px] block">ဖုန်းနံပါတ်</span>
                          <span>{u.phoneNumber}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditUser(u)}
                        className="h-8 text-xs gap-1"
                      >
                        <Edit2 className="h-3 w-3" /> ပြင်ဆင်မည်
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenResetPassword(u)}
                        className="h-8 text-xs gap-1 text-amber-600"
                      >
                        <Lock className="h-3 w-3" /> Password
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleUserStatus(u)}
                        className={cn('h-8 text-xs', u.isActive ? 'text-red-600' : 'text-emerald-600')}
                      >
                        {u.isActive ? 'ပိတ်မည်' : 'ဖွင့်မည်'}
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 2: ROLES & PERMISSIONS ──────────────────────────────────── */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map(role => (
              <div
                key={role.id}
                className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{role.name}</h3>
                      {role.isSystem ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
                          စနစ်သတ်မှတ် Role
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                          စိတ်ကြိုက်သတ်မှတ် Role
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 line-clamp-2">
                    {role.description || 'ဖော်ပြချက် မရှိပါ။'}
                  </p>

                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs">
                    <div>
                      <span className="text-zinc-400 text-[10px] block">တာဝန်ပေးထားသူ</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {role.userCount ?? users.filter(u => u.roleId === role.id).length} ဦး
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-400 text-[10px] block">လုပ်ပိုင်ခွင့် ခွင့်ပြုချက်</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {role.permissionCount ?? (role.permissions || []).length} မျိုး
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEditRole(role)}
                    className="h-8 text-xs gap-1.5 cursor-pointer"
                  >
                    <Edit2 className="h-3 w-3" /> လုပ်ပိုင်ခွင့် ပြင်ဆင်မည်
                  </Button>
                  {!role.isSystem && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRole(role)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 cursor-pointer"
                      title="Role ဖျက်ပစ်မည်"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 3: PERMISSIONS MATRIX ───────────────────────────────────── */}
      {activeTab === 'matrix' && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 font-bold border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-4 py-3 min-w-[200px]">လုပ်ငန်းကဏ္ဍ / လုပ်ပိုင်ခွင့်အမည်</th>
                <th className="px-4 py-3 min-w-[120px]">ကုဒ် (Code)</th>
                {roles.map(r => (
                  <th key={r.id} className="px-3 py-3 text-center min-w-[100px]">
                    <div className="truncate max-w-[100px]">{r.name}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {Object.entries(permissionsGrouped).map(([module, perms]) => (
                <React.Fragment key={module}>
                  {/* Module Header Row */}
                  <tr className="bg-zinc-100/80 dark:bg-zinc-800/40 font-bold text-zinc-700 dark:text-zinc-200">
                    <td colSpan={2 + roles.length} className="px-4 py-2 text-[11px] tracking-wider uppercase">
                      📁 လုပ်ငန်းကဏ္ဍ: {module} ({perms.length} မျိုး)
                    </td>
                  </tr>
                  {/* Permission Rows */}
                  {perms.map(p => (
                    <tr key={p.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                      <td className="px-4 py-2.5">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">{p.name}</div>
                        <div className="text-[10px] text-zinc-400">{p.description}</div>
                      </td>
                      <td className="px-4 py-2.5 text-zinc-500 font-mono text-[11px]">{p.code}</td>
                      {roles.map(r => {
                        const hasPerm =
                          r.name === 'ADMIN' ||
                          (r.permissions || []).some(rp => rp.code === p.code || rp.id === p.id);
                        return (
                          <td key={r.id} className="px-3 py-2.5 text-center">
                            {hasPerm ? (
                              <span className="inline-flex h-5 w-5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 items-center justify-center">
                                <Check className="h-3 w-3" />
                              </span>
                            ) : (
                              <span className="text-zinc-300 dark:text-zinc-700">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── CREATE USER MODAL ───────────────────────────────────────────── */}
      {isCreateUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 max-w-md w-full shadow-2xl animate-in fade-in-50 zoom-in-95 my-8">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">ဝန်ထမ်း အသုံးပြုသူ အသစ်ဖွင့်ရန်</h2>
            <p className="text-xs text-zinc-500 mb-4">လုပ်ငန်းခွဲနှင့် Role အလိုက် အကောင့်သတ်မှတ်ဖွင့်လှစ်ခြင်း</p>

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  အမည်အပြည့်အစုံ <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  placeholder="ဥပမာ - ဒေါ်အေးအေး"
                  value={userForm.name}
                  onChange={e => setUserForm({ ...userForm, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  အီးမေးလ် လိပ်စာ <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  type="email"
                  placeholder="ဥပမာ - staff@nayaera.com"
                  value={userForm.email}
                  onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  type="password"
                  placeholder="အနည်းဆုံး စာလုံးရေ ၆ လုံး"
                  value={userForm.password}
                  onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    အခန်းကဏ္ဍ (Role) <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={userForm.roleId}
                    onChange={e => setUserForm({ ...userForm, roleId: e.target.value })}
                    className="w-full h-9 px-3 text-xs rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    <option value="">Role ရွေးချယ်ပါ</option>
                    {roles.map(r => (
                      <option key={r.id} value={String(r.id)}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">တာဝန်ကျ ဌာနခွဲ</label>
                  <select
                    value={userForm.branchId}
                    onChange={e => setUserForm({ ...userForm, branchId: e.target.value })}
                    className="w-full h-9 px-3 text-xs rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    <option value="">ရုံးချုပ် (မူလသတ်မှတ်ချက်)</option>
                    {branches.map(b => (
                      <option key={b.id} value={String(b.id)}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">ဖုန်းနံပါတ်</label>
                <Input
                  placeholder="09..."
                  value={userForm.phoneNumber}
                  onChange={e => setUserForm({ ...userForm, phoneNumber: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">နေရပ်လိပ်စာ</label>
                <Input
                  placeholder="မြို့နယ်၊ မြို့"
                  value={userForm.address}
                  onChange={e => setUserForm({ ...userForm, address: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateUserOpen(false)}
                  disabled={submitting}
                >
                  မလုပ်တော့ပါ
                </Button>
                <Button type="submit" size="sm" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {submitting ? 'ဖန်တီးနေသည်...' : 'အသုံးပြုသူ ဖွင့်မည်'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── EDIT USER MODAL ─────────────────────────────────────────────── */}
      {isEditUserOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 max-w-md w-full shadow-2xl animate-in fade-in-50 zoom-in-95 my-8">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">အသုံးပြုသူ အချက်အလက် ပြင်ဆင်ရန်</h2>
            <p className="text-xs text-zinc-500 mb-4">ဝန်ထမ်း အချက်အလက်နှင့် Role ခွဲဝေမှုများ ပြင်ဆင်ခြင်း</p>

            <form onSubmit={handleUpdateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">အမည်အပြည့်အစုံ</label>
                <Input
                  required
                  value={editUserForm.name}
                  onChange={e => setEditUserForm({ ...editUserForm, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">အီးမေးလ် လိပ်စာ</label>
                <Input
                  required
                  type="email"
                  value={editUserForm.email}
                  onChange={e => setEditUserForm({ ...editUserForm, email: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">အခန်းကဏ္ဍ (Role)</label>
                  <select
                    value={editUserForm.roleId}
                    onChange={e => setEditUserForm({ ...editUserForm, roleId: e.target.value })}
                    className="w-full h-9 px-3 text-xs rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    {roles.map(r => (
                      <option key={r.id} value={String(r.id)}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">တာဝန်ကျ ဌာနခွဲ</label>
                  <select
                    value={editUserForm.branchId}
                    onChange={e => setEditUserForm({ ...editUserForm, branchId: e.target.value })}
                    className="w-full h-9 px-3 text-xs rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    <option value="">ရုံးချုပ်</option>
                    {branches.map(b => (
                      <option key={b.id} value={String(b.id)}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">ဖုန်းနံပါတ်</label>
                <Input
                  value={editUserForm.phoneNumber}
                  onChange={e => setEditUserForm({ ...editUserForm, phoneNumber: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">နေရပ်လိပ်စာ</label>
                <Input
                  value={editUserForm.address}
                  onChange={e => setEditUserForm({ ...editUserForm, address: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditUserOpen(false)}
                  disabled={submitting}
                >
                  မလုပ်တော့ပါ
                </Button>
                <Button type="submit" size="sm" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {submitting ? 'သိမ်းဆည်းနေသည်...' : 'အချက်အလက် သိမ်းမည်'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── RESET PASSWORD MODAL ────────────────────────────────────────── */}
      {isResetPasswordOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 max-w-sm w-full shadow-2xl animate-in fade-in-50 zoom-in-95">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">Password အသစ် ပြန်လည်သတ်မှတ်ရန်</h2>
            <p className="text-xs text-zinc-500 mb-4">'{selectedUser.name}' အတွက် Password အသစ် သတ်မှတ်ပေးခြင်း</p>

            <form onSubmit={handleResetPassword} className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Password အသစ် (အနည်းဆုံး စာလုံးရေ ၆ လုံး)
                </label>
                <Input
                  required
                  type="password"
                  placeholder="Password အသစ် ရိုက်ထည့်ပါ"
                  value={resetPasswordForm.newPassword}
                  onChange={e => setResetPasswordForm({ ...resetPasswordForm, newPassword: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Password အသစ် ထပ်မံရိုက်ထည့်ပါ
                </label>
                <Input
                  required
                  type="password"
                  placeholder="Password အသစ် ပြန်ရိုက်ပါ"
                  value={resetPasswordForm.confirmPassword}
                  onChange={e => setResetPasswordForm({ ...resetPasswordForm, confirmPassword: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsResetPasswordOpen(false)}
                  disabled={submitting}
                >
                  မလုပ်တော့ပါ
                </Button>
                <Button type="submit" size="sm" disabled={submitting} className="bg-amber-600 hover:bg-amber-700 text-white">
                  {submitting ? 'လုပ်ဆောင်နေသည်...' : 'Password ပြောင်းမည်'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── CREATE CUSTOM ROLE MODAL ────────────────────────────────────── */}
      {isCreateRoleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 max-w-2xl w-full shadow-2xl animate-in fade-in-50 zoom-in-95 my-8 max-h-[90vh] flex flex-col">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">Role အသစ် ဖန်တီးရန်</h2>
            <p className="text-xs text-zinc-500 mb-4">အခန်းကဏ္ဍ အမည်နှင့် လုပ်ငန်းခွင့်ပြုချက်များ ရွေးချယ်သတ်မှတ်ခြင်း</p>

            <form onSubmit={handleCreateRole} className="space-y-4 text-xs flex-1 overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Role အမည် <span className="text-red-500">*</span>
                  </label>
                  <Input
                    required
                    placeholder="ဥပမာ - INVENTORY_SUPERVISOR"
                    value={roleForm.name}
                    onChange={e => setRoleForm({ ...roleForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">ဖော်ပြချက်</label>
                  <Input
                    placeholder="တာဝန်နှင့် လုပ်ပိုင်ခွင့် နယ်ပယ်"
                    value={roleForm.description}
                    onChange={e => setRoleForm({ ...roleForm, description: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-2">
                  လုပ်ပိုင်ခွင့်များ ရွေးချယ်ပါ ({roleForm.selectedPermissionIds.length} မျိုး ရွေးချယ်ထားသည်)
                </label>
                <div className="space-y-3 max-h-72 overflow-y-auto border border-zinc-200 dark:border-zinc-800 rounded-lg p-3">
                  {Object.entries(permissionsGrouped).map(([module, perms]) => {
                    const allChecked = perms.every(p => roleForm.selectedPermissionIds.includes(p.id));
                    return (
                      <div key={module} className="border-b border-zinc-100 dark:border-zinc-800 pb-2 last:border-0">
                        <div className="flex items-center justify-between py-1">
                          <span className="font-bold text-[11px] text-blue-600 dark:text-blue-400 uppercase">
                            {module}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleModulePermissions(module, false)}
                            className="text-[10px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
                          >
                            {allChecked ? 'အားလုံး ပြန်ဖြုတ်မည်' : 'အားလုံး ရွေးမည်'}
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                          {perms.map(p => {
                            const checked = roleForm.selectedPermissionIds.includes(p.id);
                            return (
                              <label
                                key={p.id}
                                className={cn(
                                  'flex items-start gap-2 p-1.5 rounded-md border cursor-pointer transition-colors',
                                  checked
                                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                                    : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                                )}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => togglePermission(p.id, false)}
                                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                                />
                                <div className="text-[11px]">
                                  <span className="font-medium block text-zinc-900 dark:text-zinc-100">{p.name}</span>
                                  <span className="text-[10px] text-zinc-400 font-mono">{p.code}</span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateRoleOpen(false)}
                  disabled={submitting}
                >
                  မလုပ်တော့ပါ
                </Button>
                <Button type="submit" size="sm" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {submitting ? 'ဖန်တီးနေသည်...' : 'Role အသစ် ဖွင့်မည်'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── EDIT ROLE MODAL ──────────────────────────────────────────────── */}
      {isEditRoleOpen && selectedRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 max-w-2xl w-full shadow-2xl animate-in fade-in-50 zoom-in-95 my-8 max-h-[90vh] flex flex-col">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">
              Role ပြင်ဆင်ခြင်း: {selectedRole.name}
            </h2>
            <p className="text-xs text-zinc-500 mb-4">
              {selectedRole.isSystem
                ? 'စနစ်သတ်မှတ် Role ဖြစ်ပါသည် — လုပ်ပိုင်ခွင့် ခွင့်ပြုချက်များကို စစ်ဆေး/ပြင်ဆင်သတ်မှတ်နိုင်ပါသည်'
                : 'စိတ်ကြိုက်သတ်မှတ်ထားသော Role အချက်အလက်နှင့် ခွင့်ပြုချက်များ ပြင်ဆင်ခြင်း'}
            </p>

            <form onSubmit={handleUpdateRole} className="space-y-4 text-xs flex-1 overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Role အမည်</label>
                  <Input
                    disabled={selectedRole.isSystem}
                    value={editRoleForm.name}
                    onChange={e => setEditRoleForm({ ...editRoleForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">ဖော်ပြချက်</label>
                  <Input
                    value={editRoleForm.description}
                    onChange={e => setEditRoleForm({ ...editRoleForm, description: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-2">
                  Role လုပ်ပိုင်ခွင့်များ ({editRoleForm.selectedPermissionIds.length} မျိုး ခွင့်ပြုထားသည်)
                </label>
                <div className="space-y-3 max-h-72 overflow-y-auto border border-zinc-200 dark:border-zinc-800 rounded-lg p-3">
                  {Object.entries(permissionsGrouped).map(([module, perms]) => {
                    const allChecked = perms.every(p => editRoleForm.selectedPermissionIds.includes(p.id));
                    return (
                      <div key={module} className="border-b border-zinc-100 dark:border-zinc-800 pb-2 last:border-0">
                        <div className="flex items-center justify-between py-1">
                          <span className="font-bold text-[11px] text-blue-600 dark:text-blue-400 uppercase">
                            {module}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleModulePermissions(module, true)}
                            className="text-[10px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
                          >
                            {allChecked ? 'အားလုံး ပြန်ဖြုတ်မည်' : 'အားလုံး ရွေးမည်'}
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                          {perms.map(p => {
                            const checked = editRoleForm.selectedPermissionIds.includes(p.id);
                            return (
                              <label
                                key={p.id}
                                className={cn(
                                  'flex items-start gap-2 p-1.5 rounded-md border cursor-pointer transition-colors',
                                  checked
                                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                                    : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                                )}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => togglePermission(p.id, true)}
                                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                                />
                                <div className="text-[11px]">
                                  <span className="font-medium block text-zinc-900 dark:text-zinc-100">{p.name}</span>
                                  <span className="text-[10px] text-zinc-400 font-mono">{p.code}</span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditRoleOpen(false)}
                  disabled={submitting}
                >
                  မလုပ်တော့ပါ
                </Button>
                <Button type="submit" size="sm" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {submitting ? 'သိမ်းဆည်းနေသည်...' : 'လုပ်ပိုင်ခွင့်များ သိမ်းမည်'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
