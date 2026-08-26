'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { UserProfile, OrganizationContext, Branch, Warehouse } from '@/types/erp';
import { apiFetch } from '@/lib/api/bff-client';

interface AuthContextType {
  user: UserProfile | null;
  orgContext: OrganizationContext;
  branches: Branch[];
  warehouses: Warehouse[];
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: UserProfile) => void;
  logout: () => Promise<void>;
  switchBranch: (branchId: number) => void;
  switchWarehouse: (warehouseId: number) => void;
  refreshMasterContext: () => Promise<void>;
}

const defaultOrgContext: OrganizationContext = {
  tenantId: 1,
  tenantName: 'NaYa Demo Company',
  branchId: 1,
  branchName: 'Head Office (Mandalay)',
  warehouseId: 1,
  warehouseName: 'Main Raw Material WH',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [orgContext, setOrgContext] = useState<OrganizationContext>(defaultOrgContext);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiFetch<{ user: UserProfile; tenantId: number }>('/api/auth/session');
      if (res.success && res.data?.user) {
        const sessionUser = res.data.user;
        setUser(sessionUser);
        setOrgContext(prev => ({
          ...prev,
          tenantId: sessionUser.tenantId || prev.tenantId,
          branchId: sessionUser.branchId || prev.branchId,
        }));
      }
    } catch {
      // Not logged in or offline
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshMasterContext = useCallback(async () => {
    try {
      const [branchRes, whRes] = await Promise.all([
        apiFetch<Branch[]>('/api/master/branches'),
        apiFetch<Warehouse[]>('/api/master/warehouses'),
      ]);

      if (branchRes.success && Array.isArray(branchRes.data)) {
        setBranches(branchRes.data);
        if (branchRes.data.length > 0 && !orgContext.branchId) {
          const first = branchRes.data[0];
          setOrgContext(prev => ({ ...prev, branchId: first.id, branchName: `${first.name} (${first.code})` }));
        }
      }

      if (whRes.success && Array.isArray(whRes.data)) {
        setWarehouses(whRes.data);
        if (whRes.data.length > 0 && !orgContext.warehouseId) {
          const first = whRes.data[0];
          setOrgContext(prev => ({ ...prev, warehouseId: first.id, warehouseName: first.name }));
        }
      }
    } catch (e) {
      console.error('Error refreshing master context:', e);
    }
  }, [orgContext.branchId, orgContext.warehouseId]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  useEffect(() => {
    if (user) {
      refreshMasterContext();
    }
  }, [user, refreshMasterContext]);

  const login = (token: string, newUser: UserProfile) => {
    setUser(newUser);
    setOrgContext(prev => ({
      ...prev,
      tenantId: newUser.tenantId,
      branchId: newUser.branchId || prev.branchId,
    }));
    refreshMasterContext();
  };

  const logout = async () => {
    await apiFetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    window.location.href = '/login';
  };

  const switchBranch = (branchId: number) => {
    const branch = branches.find(b => b.id === branchId);
    setOrgContext(prev => ({
      ...prev,
      branchId,
      branchName: branch ? `${branch.name} (${branch.code})` : `Branch #${branchId}`,
    }));
  };

  const switchWarehouse = (warehouseId: number) => {
    const wh = warehouses.find(w => w.id === warehouseId);
    setOrgContext(prev => ({
      ...prev,
      warehouseId,
      warehouseName: wh ? wh.name : `Warehouse #${warehouseId}`,
    }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        orgContext,
        branches,
        warehouses,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        switchBranch,
        switchWarehouse,
        refreshMasterContext,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
