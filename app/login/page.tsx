'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Lock, Mail, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { apiFetch } from '@/lib/api/bff-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { success, error } = useToast();

  const [businessId, setBusinessId] = React.useState('1');
  const [email, setEmail] = React.useState('admin@naya.com');
  const [password, setPassword] = React.useState('admin123');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId || !email || !password) {
      error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiFetch<{ accessToken: string; user: any }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          businessId: Number(businessId),
          email,
          password,
        }),
      });

      if (res.success && res.data?.accessToken) {
        login(res.data.accessToken, res.data.user);
        success('Welcome to NaYa ERP', `Signed in as ${res.data.user.name}`);
        router.push('/');
      } else {
        error('Authentication Failed', res.message || 'Invalid credentials or inactive business.');
      }
    } catch (err: any) {
      error('Connection Error', err.message || 'Could not connect to server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoFill = () => {
    setBusinessId('1');
    setEmail('admin@naya.com');
    setPassword('admin123');
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-zinc-100 p-4 dark:bg-zinc-950">
      <div className="w-full max-w-md space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-xl shadow-md">
            NY
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">NaYa ERP Platform</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Multi-Tenant Enterprise Resource Planning System
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Business ID (Tenant)
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <Input
                  type="number"
                  placeholder="e.g. 1"
                  value={businessId}
                  onChange={e => setBusinessId(e.target.value)}
                  className="pl-9 h-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Work Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <Input
                  type="email"
                  placeholder="user@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="pl-9 h-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="pl-9 h-10"
                  required
                />
              </div>
            </div>

            <Button type="submit" variant="primary" isLoading={isLoading} className="w-full h-10 mt-2 gap-2 text-sm font-semibold">
              <span>Sign In to Workspace</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          {/* Quick Demo Filler */}
          <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleDemoFill}
              className="flex items-center justify-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline font-medium cursor-pointer"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Fill Admin Demo Credentials (ID 1 / admin@naya.com)</span>
            </button>
          </div>
        </div>

        {/* Security Footer */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Tenant-Isolated • Double-Entry Verified • End-to-End Audit</span>
        </div>
      </div>
    </div>
  );
}
