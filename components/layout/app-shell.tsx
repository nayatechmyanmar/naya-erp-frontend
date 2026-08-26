'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Boxes,
  Factory,
  TrendingUp,
  Landmark,
  FileBarChart,
  Moon,
  Sun,
  LogOut,
  Building2,
  GitBranch,
  Warehouse as WarehouseIcon,
  Menu,
  X,
  ChevronDown,
  User,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const navItems: NavItem[] = [
  { title: 'Dashboard', href: '/', icon: LayoutDashboard },
  { title: 'Products & Master', href: '/products', icon: Package },
  { title: 'Purchasing', href: '/purchasing', icon: ShoppingCart },
  { title: 'Inventory', href: '/inventory', icon: Boxes },
  { title: 'Manufacturing', href: '/manufacturing', icon: Factory },
  { title: 'Sales', href: '/sales', icon: TrendingUp },
  { title: 'Accounting', href: '/accounting', icon: Landmark },
  { title: 'Reports', href: '/reports', icon: FileBarChart },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, orgContext, branches, warehouses, isLoading, isAuthenticated, logout, switchBranch, switchWarehouse } =
    useAuth();

  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [isDark, setIsDark] = React.useState(false);
  const [branchDropdownOpen, setBranchDropdownOpen] = React.useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = React.useState(false);

  // Toggle Dark mode
  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  // Auth gate
  React.useEffect(() => {
    if (!isLoading && !isAuthenticated && pathname !== '/login') {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  if (pathname === '/login') {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Loading ERP Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 antialiased font-sans">
      {/* ─── DESKTOP SIDEBAR ───────────────────────────────────────── */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden md:flex flex-col border-r border-zinc-200 bg-white transition-all duration-200 dark:border-zinc-800 dark:bg-zinc-900',
          sidebarOpen ? 'w-60' : 'w-16'
        )}
      >
        {/* Brand Header */}
        <div className="flex h-14 items-center justify-between px-4 border-b border-zinc-200 dark:border-zinc-800">
          <Link href="/" className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm shadow-xs">
              NY
            </div>
            {sidebarOpen && (
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100">NaYa ERP</span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">Enterprise Suite</span>
              </div>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex h-7 w-7 text-zinc-500"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>

        {/* Tenant Context summary in sidebar */}
        {sidebarOpen && (
          <div className="p-3 border-b border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-950/40">
            <div className="flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />
              <div className="truncate text-xs">
                <div className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">{orgContext.tenantName}</div>
                <div className="text-[10px] text-zinc-500 truncate">Tenant #{orgContext.tenantId}</div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation list */}
        <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
          {navItems.map(item => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'
                )}
                title={!sidebarOpen ? item.title : undefined}
              >
                <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-500')} />
                {sidebarOpen && <span className="truncate">{item.title}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-2 border-t border-zinc-200 dark:border-zinc-800">
          <div
            className={cn(
              'flex items-center gap-2 rounded-lg p-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800',
              !sidebarOpen && 'justify-center'
            )}
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200 text-xs font-bold">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            {sidebarOpen && (
              <div className="flex-1 truncate text-xs">
                <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{user?.name || 'User'}</p>
                <p className="text-[10px] text-zinc-500 truncate">{user?.email}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ─── MOBILE DRAWER ─────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-64 max-w-[80vw] bg-white dark:bg-zinc-900 p-4 flex flex-col h-full z-50">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs">
                  NY
                </div>
                <span className="font-bold text-sm">NaYa ERP</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <nav className="flex-1 space-y-1 py-4 overflow-y-auto">
              {navItems.map(item => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium',
                      isActive
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold'
                        : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <Button variant="outline" size="sm" onClick={logout} className="w-full justify-center gap-2 text-red-600">
                <LogOut className="h-4 w-4" /> Logout
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MAIN CONTENT AREA ─────────────────────────────────────── */}
      <div
        className={cn(
          'flex flex-1 flex-col transition-all duration-200',
          sidebarOpen ? 'md:pl-60' : 'md:pl-16'
        )}
      >
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-zinc-200 bg-white/90 px-4 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/90 sm:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-8 w-8 text-zinc-600"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Context Breadcrumb / Organization Info */}
            <div className="relative">
              <button
                onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
                className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50/80 px-2.5 py-1 text-xs font-medium text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-200 cursor-pointer"
              >
                <GitBranch className="h-3.5 w-3.5 text-blue-600" />
                <span className="font-semibold">{orgContext.branchName || 'Head Office'}</span>
                <ChevronDown className="h-3 w-3 text-zinc-400" />
              </button>

              {branchDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setBranchDropdownOpen(false)} />
                  <div className="absolute left-0 mt-1.5 w-56 rounded-lg border border-zinc-200 bg-white p-1.5 shadow-xl z-50 dark:border-zinc-800 dark:bg-zinc-900 animate-in fade-in-50 zoom-in-95">
                    <p className="px-2 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      Switch Branch
                    </p>
                    {branches.length === 0 ? (
                      <div className="px-2 py-1.5 text-xs text-zinc-500">Head Office (HQ)</div>
                    ) : (
                      branches.map(b => (
                        <button
                          key={b.id}
                          onClick={() => {
                            switchBranch(b.id);
                            setBranchDropdownOpen(false);
                          }}
                          className={cn(
                            'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs text-left cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800',
                            orgContext.branchId === b.id && 'font-semibold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
                          )}
                        >
                          <span>{b.name}</span>
                          <span className="text-[10px] text-zinc-400">{b.code}</span>
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Warehouse context indicator */}
            {warehouses.length > 0 && (
              <div className="hidden lg:flex items-center gap-1.5 text-xs text-zinc-500 border-l border-zinc-200 pl-3 dark:border-zinc-800">
                <WarehouseIcon className="h-3.5 w-3.5" />
                <span>{orgContext.warehouseName || warehouses[0]?.name}</span>
              </div>
            )}
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2">
            {/* Dark Mode Switcher */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-8 w-8 text-zinc-600 dark:text-zinc-300"
              title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {/* User Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 p-1 pr-2.5 text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-[10px]">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="hidden sm:inline font-medium max-w-[100px] truncate">{user?.name || 'Admin'}</span>
                <ChevronDown className="h-3 w-3 text-zinc-400" />
              </button>

              {userDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserDropdownOpen(false)} />
                  <div className="absolute right-0 mt-1.5 w-52 rounded-lg border border-zinc-200 bg-white p-1.5 shadow-xl z-50 dark:border-zinc-800 dark:bg-zinc-900 animate-in fade-in-50 zoom-in-95">
                    <div className="px-2 py-1.5 border-b border-zinc-100 dark:border-zinc-800">
                      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{user?.name}</p>
                      <p className="text-[10px] text-zinc-500 truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="mt-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer font-medium"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
