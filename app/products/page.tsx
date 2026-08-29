'use client';

import * as React from 'react';
import {
  Boxes,
  Layers,
  Ruler,
  Truck,
  Users,
  Warehouse as WarehouseIcon,
  Building2,
  Users2,
  Plus,
  Edit2,
  Trash2,
  Eye,
  RefreshCw,
  Search,
  Package,
  MapPin,
  Phone,
  ArrowRight,
  Filter,
  CheckCircle2,
  Sparkles,
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
import { cn } from '@/lib/utils';
import {
  Product,
  ProductCategory,
  UOM,
  Supplier,
  Customer,
  Warehouse,
  Branch,
  SaleTeam,
  ProductType,
} from '@/types/erp';

export default function ProductsPage() {
  const { orgContext } = useAuth();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = React.useState('products');
  const [isLoading, setIsLoading] = React.useState(true);

  // Filter States
  const [productTypeFilter, setProductTypeFilter] = React.useState<string>('ALL');

  // Master Data Collections
  const [products, setProducts] = React.useState<Product[]>([]);
  const [categories, setCategories] = React.useState<ProductCategory[]>([]);
  const [uoms, setUoms] = React.useState<UOM[]>([]);
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [warehouses, setWarehouses] = React.useState<Warehouse[]>([]);
  const [branches, setBranches] = React.useState<Branch[]>([]);
  const [saleTeams, setSaleTeams] = React.useState<SaleTeam[]>([]);

  // Dialog & Sheet States
  const [dialogMode, setDialogMode] = React.useState<'create' | 'edit'>('create');
  const [productDialogOpen, setProductDialogOpen] = React.useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = React.useState(false);
  const [uomDialogOpen, setUomDialogOpen] = React.useState(false);
  const [supplierDialogOpen, setSupplierDialogOpen] = React.useState(false);
  const [customerDialogOpen, setCustomerDialogOpen] = React.useState(false);
  const [warehouseDialogOpen, setWarehouseDialogOpen] = React.useState(false);
  const [branchDialogOpen, setBranchDialogOpen] = React.useState(false);
  const [saleTeamDialogOpen, setSaleTeamDialogOpen] = React.useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<{ type: string; id: number; name: string } | null>(null);

  // Detail Sheet Selection (IDs & memoized active entity)
  const [selectedProductId, setSelectedProductId] = React.useState<number | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = React.useState<number | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<number | null>(null);
  const [selectedWarehouseId, setSelectedWarehouseId] = React.useState<number | null>(null);

  const selectedProduct = React.useMemo(() => {
    if (!selectedProductId) return null;
    return products.find(p => p.id === selectedProductId) || null;
  }, [products, selectedProductId]);

  const selectedSupplier = React.useMemo(() => {
    if (!selectedSupplierId) return null;
    return suppliers.find(s => s.id === selectedSupplierId) || null;
  }, [suppliers, selectedSupplierId]);

  const selectedCustomer = React.useMemo(() => {
    if (!selectedCustomerId) return null;
    return customers.find(c => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  const selectedWarehouse = React.useMemo(() => {
    if (!selectedWarehouseId) return null;
    return warehouses.find(w => w.id === selectedWarehouseId) || null;
  }, [warehouses, selectedWarehouseId]);

  const [productSheetOpen, setProductSheetOpen] = React.useState(false);
  const [supplierSheetOpen, setSupplierSheetOpen] = React.useState(false);
  const [customerSheetOpen, setCustomerSheetOpen] = React.useState(false);
  const [warehouseSheetOpen, setWarehouseSheetOpen] = React.useState(false);

  // Secondary Unit Conversion Form inside Product Sheet
  const [newConversionUomId, setNewConversionUomId] = React.useState('');
  const [newConversionFactor, setNewConversionFactor] = React.useState('');
  const [isAddingConversion, setIsAddingConversion] = React.useState(false);

  // Forms
  const [productForm, setProductForm] = React.useState({
    id: 0,
    sku: '',
    name: '',
    categoryId: '',
    baseUomId: '',
    productType: 'FINISHED_GOOD' as ProductType,
  });

  const [categoryForm, setCategoryForm] = React.useState({ id: 0, name: '', description: '' });
  const [uomForm, setUomForm] = React.useState({ id: 0, name: '', symbol: '' });
  const [supplierForm, setSupplierForm] = React.useState({ id: 0, name: '', phoneNumber: '', township: '', location: '' });
  const [customerForm, setCustomerForm] = React.useState({ id: 0, name: '', phoneNumber: '', address: '', location: '' });
  const [warehouseForm, setWarehouseForm] = React.useState({ id: 0, name: '', branchId: '', location: '' });
  const [branchForm, setBranchForm] = React.useState({ id: 0, name: '', code: '', location: '' });
  const [saleTeamForm, setSaleTeamForm] = React.useState({ id: 0, name: '', branchId: '' });

  // Load All Master Data
  const loadMasterData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [prodRes, catRes, uomRes, supRes, custRes, whRes, brRes, stRes] = await Promise.all([
        apiFetch<Product[]>('/api/master/products'),
        apiFetch<ProductCategory[]>('/api/master/categories'),
        apiFetch<UOM[]>('/api/master/uoms'),
        apiFetch<Supplier[]>('/api/master/suppliers'),
        apiFetch<Customer[]>('/api/master/customers'),
        apiFetch<Warehouse[]>('/api/master/warehouses'),
        apiFetch<Branch[]>('/api/master/branches'),
        apiFetch<SaleTeam[]>('/api/master/sale-teams'),
      ]);

      if (prodRes.success && Array.isArray(prodRes.data)) setProducts(prodRes.data);
      if (catRes.success && Array.isArray(catRes.data)) setCategories(catRes.data);
      if (uomRes.success && Array.isArray(uomRes.data)) setUoms(uomRes.data);
      if (supRes.success && Array.isArray(supRes.data)) setSuppliers(supRes.data);
      if (custRes.success && Array.isArray(custRes.data)) setCustomers(custRes.data);
      if (whRes.success && Array.isArray(whRes.data)) setWarehouses(whRes.data);
      if (brRes.success && Array.isArray(brRes.data)) setBranches(brRes.data);
      if (stRes.success && Array.isArray(stRes.data)) setSaleTeams(stRes.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      error('Failed to load master catalog', msg);
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  React.useEffect(() => {
    loadMasterData();
  }, [loadMasterData]);

  // Product Filtered Data
  const filteredProducts = React.useMemo(() => {
    if (productTypeFilter === 'ALL') return products;
    return products.filter(p => p.productType === productTypeFilter);
  }, [products, productTypeFilter]);

  // Product CRUD
  const openCreateProduct = () => {
    setDialogMode('create');
    setProductForm({
      id: 0,
      sku: `SKU-${Date.now().toString().slice(-4)}`,
      name: '',
      categoryId: categories[0]?.id ? String(categories[0].id) : '',
      baseUomId: uoms[0]?.id ? String(uoms[0].id) : '',
      productType: 'FINISHED_GOOD',
    });
    setProductDialogOpen(true);
  };

  const openEditProduct = (p: Product) => {
    setDialogMode('edit');
    setProductForm({
      id: p.id,
      sku: p.sku,
      name: p.name,
      categoryId: p.categoryId ? String(p.categoryId) : '',
      baseUomId: p.baseUomId ? String(p.baseUomId) : '',
      productType: p.productType,
    });
    setProductDialogOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      sku: productForm.sku,
      name: productForm.name,
      categoryId: Number(productForm.categoryId),
      baseUomId: Number(productForm.baseUomId),
      productType: productForm.productType,
    };

    const isEdit = dialogMode === 'edit';
    const url = isEdit ? `/api/master/products/${productForm.id}` : '/api/master/products';
    const res = await apiFetch(url, {
      method: isEdit ? 'PUT' : 'POST',
      body: JSON.stringify(payload),
    });

    if (res.success) {
      success(isEdit ? 'Product Updated (ကုန်ပစ္စည်းပြင်ဆင်ပြီး)' : 'Product Created (ကုန်ပစ္စည်းအသစ်ဖန်တီးပြီး)', `Saved ${productForm.name}`);
      setProductDialogOpen(false);
      loadMasterData();
    } else {
      error('Failed to save product', res.message);
    }
  };

  // Secondary Unit Conversion Operations
  const handleAddUnitConversion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !newConversionUomId || !newConversionFactor) return;

    setIsAddingConversion(true);
    try {
      const res = await apiFetch(`/api/master/products/${selectedProduct.id}/uoms`, {
        method: 'POST',
        body: JSON.stringify({
          uomId: Number(newConversionUomId),
          conversionFactor: Number(newConversionFactor),
        }),
      });

      if (res.success) {
        success('Conversion Added (ယူနစ်အချိုး ထည့်သွင်းပြီး)');
        setNewConversionUomId('');
        setNewConversionFactor('');
        loadMasterData();
      } else {
        error('Failed to add conversion', res.message);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      error('Error adding conversion', msg);
    } finally {
      setIsAddingConversion(false);
    }
  };

  const handleDeleteUnitConversion = async (uomId: number) => {
    if (!selectedProduct) return;
    try {
      const res = await apiFetch(`/api/master/products/${selectedProduct.id}/uoms/${uomId}`, {
        method: 'DELETE',
      });
      if (res.success) {
        success('Conversion Removed (ယူနစ်အချိုး ဖျက်သိမ်းပြီး)');
        loadMasterData();
      } else {
        error('Failed to remove conversion', res.message);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      error('Error removing conversion', msg);
    }
  };

  // Generic Delete Handler
  const confirmDelete = (type: string, id: number, name: string) => {
    setDeleteTarget({ type, id, name });
    setDeleteConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    const urlMap: Record<string, string> = {
      product: `/api/master/products/${deleteTarget.id}`,
      category: `/api/master/categories/${deleteTarget.id}`,
      uom: `/api/master/uoms/${deleteTarget.id}`,
      supplier: `/api/master/suppliers/${deleteTarget.id}`,
      customer: `/api/master/customers/${deleteTarget.id}`,
      warehouse: `/api/master/warehouses/${deleteTarget.id}`,
      branch: `/api/master/branches/${deleteTarget.id}`,
      saleTeam: `/api/master/sale-teams/${deleteTarget.id}`,
    };

    const res = await apiFetch(urlMap[deleteTarget.type], { method: 'DELETE' });
    if (res.success) {
      success('Deleted successfully (ဖျက်သိမ်းပြီးပါပြီ)', `${deleteTarget.name} has been removed`);
      setDeleteConfirmOpen(false);
      loadMasterData();
    } else {
      error('Delete failed', res.message);
    }
  };

  // Category CRUD
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = dialogMode === 'edit';
    const url = isEdit ? `/api/master/categories/${categoryForm.id}` : '/api/master/categories';
    const res = await apiFetch(url, {
      method: isEdit ? 'PUT' : 'POST',
      body: JSON.stringify({ name: categoryForm.name, description: categoryForm.description }),
    });
    if (res.success) {
      success(isEdit ? 'Category Updated' : 'Category Created');
      setCategoryDialogOpen(false);
      loadMasterData();
    } else error('Failed to save category', res.message);
  };

  // UOM CRUD
  const handleSaveUom = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = dialogMode === 'edit';
    const url = isEdit ? `/api/master/uoms/${uomForm.id}` : '/api/master/uoms';
    const res = await apiFetch(url, {
      method: isEdit ? 'PUT' : 'POST',
      body: JSON.stringify({ name: uomForm.name, symbol: uomForm.symbol }),
    });
    if (res.success) {
      success(isEdit ? 'Unit Updated' : 'Unit Created');
      setUomDialogOpen(false);
      loadMasterData();
    } else error('Failed to save unit', res.message);
  };

  // Supplier CRUD
  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = dialogMode === 'edit';
    const url = isEdit ? `/api/master/suppliers/${supplierForm.id}` : '/api/master/suppliers';
    const res = await apiFetch(url, {
      method: isEdit ? 'PUT' : 'POST',
      body: JSON.stringify({
        name: supplierForm.name,
        phoneNumber: supplierForm.phoneNumber,
        township: supplierForm.township,
        location: supplierForm.location,
      }),
    });
    if (res.success) {
      success(isEdit ? 'Supplier Updated' : 'Supplier Created');
      setSupplierDialogOpen(false);
      loadMasterData();
    } else error('Failed to save supplier', res.message);
  };

  // Customer CRUD
  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = dialogMode === 'edit';
    const url = isEdit ? `/api/master/customers/${customerForm.id}` : '/api/master/customers';
    const res = await apiFetch(url, {
      method: isEdit ? 'PUT' : 'POST',
      body: JSON.stringify({
        name: customerForm.name,
        phoneNumber: customerForm.phoneNumber,
        address: customerForm.address,
        location: customerForm.location,
      }),
    });
    if (res.success) {
      success(isEdit ? 'Customer Updated' : 'Customer Created');
      setCustomerDialogOpen(false);
      loadMasterData();
    } else error('Failed to save customer', res.message);
  };

  // Warehouse CRUD
  const handleSaveWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = dialogMode === 'edit';
    const url = isEdit ? `/api/master/warehouses/${warehouseForm.id}` : '/api/master/warehouses';
    const res = await apiFetch(url, {
      method: isEdit ? 'PUT' : 'POST',
      body: JSON.stringify({
        name: warehouseForm.name,
        branchId: Number(warehouseForm.branchId),
        location: warehouseForm.location,
      }),
    });
    if (res.success) {
      success(isEdit ? 'Warehouse Updated' : 'Warehouse Created');
      setWarehouseDialogOpen(false);
      loadMasterData();
    } else error('Failed to save warehouse', res.message);
  };

  // Branch CRUD
  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = dialogMode === 'edit';
    const url = isEdit ? `/api/master/branches/${branchForm.id}` : '/api/master/branches';
    const res = await apiFetch(url, {
      method: isEdit ? 'PUT' : 'POST',
      body: JSON.stringify({
        name: branchForm.name,
        code: branchForm.code,
        location: branchForm.location,
      }),
    });
    if (res.success) {
      success(isEdit ? 'Branch Updated' : 'Branch Created');
      setBranchDialogOpen(false);
      loadMasterData();
    } else error('Failed to save branch', res.message);
  };

  // Sale Team CRUD
  const handleSaveSaleTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = dialogMode === 'edit';
    const url = isEdit ? `/api/master/sale-teams/${saleTeamForm.id}` : '/api/master/sale-teams';
    const res = await apiFetch(url, {
      method: isEdit ? 'PUT' : 'POST',
      body: JSON.stringify({
        name: saleTeamForm.name,
        branchId: Number(saleTeamForm.branchId),
      }),
    });
    if (res.success) {
      success(isEdit ? 'Sale Team Updated' : 'Sale Team Created');
      setSaleTeamDialogOpen(false);
      loadMasterData();
    } else error('Failed to save sale team', res.message);
  };

  // Type badge helper
  const renderTypeBadge = (type: ProductType) => {
    const typeVariants: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'info'> = {
      FINISHED_GOOD: 'success',
      RAW_MATERIAL: 'warning',
      PACKAGING: 'info',
      SERVICE: 'secondary',
    };
    const typeLabels: Record<string, string> = {
      FINISHED_GOOD: 'Finished Good (အချောထည်)',
      RAW_MATERIAL: 'Raw Material (ကုန်ကြမ်း)',
      PACKAGING: 'Packaging (ထုပ်ပိုးပစ္စည်း)',
      SERVICE: 'Service (ဝန်ဆောင်မှု)',
    };
    return (
      <Badge variant={typeVariants[type] || 'default'} className="text-[10px] sm:text-xs">
        {typeLabels[type] || type}
      </Badge>
    );
  };

  // Mobile FAB trigger action based on active tab
  const handleFabClick = () => {
    if (activeTab === 'products') openCreateProduct();
    else if (activeTab === 'categories') {
      setDialogMode('create');
      setCategoryForm({ id: 0, name: '', description: '' });
      setCategoryDialogOpen(true);
    } else if (activeTab === 'uoms') {
      setDialogMode('create');
      setUomForm({ id: 0, name: '', symbol: '' });
      setUomDialogOpen(true);
    } else if (activeTab === 'suppliers') {
      setDialogMode('create');
      setSupplierForm({ id: 0, name: '', phoneNumber: '', township: '', location: '' });
      setSupplierDialogOpen(true);
    } else if (activeTab === 'customers') {
      setDialogMode('create');
      setCustomerForm({ id: 0, name: '', phoneNumber: '', address: '', location: '' });
      setCustomerDialogOpen(true);
    } else if (activeTab === 'warehouses') {
      setDialogMode('create');
      setWarehouseForm({ id: 0, name: '', branchId: branches[0]?.id ? String(branches[0].id) : '', location: '' });
      setWarehouseDialogOpen(true);
    } else if (activeTab === 'branches') {
      setDialogMode('create');
      setBranchForm({ id: 0, name: '', code: '', location: '' });
      setBranchDialogOpen(true);
    } else if (activeTab === 'teams') {
      setDialogMode('create');
      setSaleTeamForm({ id: 0, name: '', branchId: branches[0]?.id ? String(branches[0].id) : '' });
      setSaleTeamDialogOpen(true);
    }
  };

  // ─── DESKTOP TABLE COLUMNS ──────────────────────────────────────
  const productColumns: Column<Product>[] = [
    { header: 'SKU', accessorKey: 'sku', sortable: true, className: 'font-mono font-bold text-blue-600 dark:text-blue-400' },
    { header: 'Product Name', accessorKey: 'name', sortable: true, className: 'font-semibold' },
    {
      header: 'Type',
      accessorKey: 'productType',
      cell: r => renderTypeBadge(r.productType),
    },
    { header: 'Category', cell: r => r.category?.name || '-' },
    { header: 'Base Unit', cell: r => r.baseUom?.symbol || r.baseUom?.name || '-' },
    {
      header: 'Conversions',
      cell: r => {
        const count = r.productUoms?.length || 0;
        return count > 0 ? (
          <Badge variant="outline" className="text-[10px] text-blue-600 dark:text-blue-400">
            {count} unit ratio{count > 1 ? 's' : ''}
          </Badge>
        ) : (
          <span className="text-zinc-400 text-[11px]">-</span>
        );
      },
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: r => (
        <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedProductId(r.id);
              setProductSheetOpen(true);
            }}
            className="h-7 w-7 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            title="Inspect"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openEditProduct(r)}
            className="h-7 w-7 text-blue-600 hover:text-blue-700 dark:text-blue-400"
            title="Edit"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => confirmDelete('product', r.id, r.name)}
            className="h-7 w-7 text-rose-500 hover:text-rose-700"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  const categoryColumns: Column<ProductCategory>[] = [
    { header: 'Category Name', accessorKey: 'name', sortable: true, className: 'font-semibold' },
    { header: 'Description', accessorKey: 'description', cell: r => r.description || '-' },
    {
      header: 'Actions',
      className: 'text-right',
      cell: r => (
        <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setDialogMode('edit');
              setCategoryForm({ id: r.id, name: r.name, description: r.description || '' });
              setCategoryDialogOpen(true);
            }}
            className="h-7 w-7 text-blue-600"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => confirmDelete('category', r.id, r.name)}
            className="h-7 w-7 text-rose-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  const uomColumns: Column<UOM>[] = [
    { header: 'Unit Name', accessorKey: 'name', sortable: true, className: 'font-semibold' },
    { header: 'Symbol', accessorKey: 'symbol', cell: r => <Badge variant="outline">{r.symbol}</Badge> },
    {
      header: 'Actions',
      className: 'text-right',
      cell: r => (
        <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setDialogMode('edit');
              setUomForm({ id: r.id, name: r.name, symbol: r.symbol || '' });
              setUomDialogOpen(true);
            }}
            className="h-7 w-7 text-blue-600"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => confirmDelete('uom', r.id, r.name)}
            className="h-7 w-7 text-rose-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  const supplierColumns: Column<Supplier>[] = [
    { header: 'Supplier Name', accessorKey: 'name', sortable: true, className: 'font-semibold' },
    { header: 'Phone Number', cell: r => r.phoneNumber || '-' },
    { header: 'Township', cell: r => r.township || '-' },
    { header: 'Location', cell: r => r.location || '-' },
    {
      header: 'Actions',
      className: 'text-right',
      cell: r => (
        <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedSupplierId(r.id);
              setSupplierSheetOpen(true);
            }}
            className="h-7 w-7 text-zinc-500"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setDialogMode('edit');
              setSupplierForm({ id: r.id, name: r.name, phoneNumber: r.phoneNumber || '', township: r.township || '', location: r.location || '' });
              setSupplierDialogOpen(true);
            }}
            className="h-7 w-7 text-blue-600"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => confirmDelete('supplier', r.id, r.name)}
            className="h-7 w-7 text-rose-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  const customerColumns: Column<Customer>[] = [
    { header: 'Customer Name', accessorKey: 'name', sortable: true, className: 'font-semibold' },
    { header: 'Phone Number', cell: r => r.phoneNumber || '-' },
    { header: 'Address', cell: r => r.address || '-' },
    {
      header: 'Actions',
      className: 'text-right',
      cell: r => (
        <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedCustomerId(r.id);
              setCustomerSheetOpen(true);
            }}
            className="h-7 w-7 text-zinc-500"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setDialogMode('edit');
              setCustomerForm({ id: r.id, name: r.name, phoneNumber: r.phoneNumber || '', address: r.address || '', location: r.location || '' });
              setCustomerDialogOpen(true);
            }}
            className="h-7 w-7 text-blue-600"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => confirmDelete('customer', r.id, r.name)}
            className="h-7 w-7 text-rose-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  const warehouseColumns: Column<Warehouse>[] = [
    { header: 'Warehouse Name', accessorKey: 'name', sortable: true, className: 'font-semibold' },
    { header: 'Branch', cell: r => r.branch?.name || ('Branch #' + r.branchId) },
    { header: 'Location', cell: r => r.location || '-' },
    {
      header: 'Actions',
      className: 'text-right',
      cell: r => (
        <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedWarehouseId(r.id);
              setWarehouseSheetOpen(true);
            }}
            className="h-7 w-7 text-zinc-500"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setDialogMode('edit');
              setWarehouseForm({ id: r.id, name: r.name, branchId: String(r.branchId), location: r.location || '' });
              setWarehouseDialogOpen(true);
            }}
            className="h-7 w-7 text-blue-600"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => confirmDelete('warehouse', r.id, r.name)}
            className="h-7 w-7 text-rose-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  const branchColumns: Column<Branch>[] = [
    { header: 'Branch Code', accessorKey: 'code', sortable: true, className: 'font-mono font-bold text-blue-600' },
    { header: 'Branch Name', accessorKey: 'name', sortable: true, className: 'font-semibold' },
    { header: 'Location', cell: r => r.location || '-' },
    {
      header: 'Actions',
      className: 'text-right',
      cell: r => (
        <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setDialogMode('edit');
              setBranchForm({ id: r.id, name: r.name, code: r.code, location: r.location || '' });
              setBranchDialogOpen(true);
            }}
            className="h-7 w-7 text-blue-600"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => confirmDelete('branch', r.id, r.name)}
            className="h-7 w-7 text-rose-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  const saleTeamColumns: Column<SaleTeam>[] = [
    { header: 'Team Name', accessorKey: 'name', sortable: true, className: 'font-semibold' },
    { header: 'Branch ID', cell: r => r.branchId ? ('Branch #' + r.branchId) : 'All Branches' },
    {
      header: 'Actions',
      className: 'text-right',
      cell: r => (
        <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setDialogMode('edit');
              setSaleTeamForm({ id: r.id, name: r.name, branchId: r.branchId ? String(r.branchId) : '' });
              setSaleTeamDialogOpen(true);
            }}
            className="h-7 w-7 text-blue-600"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => confirmDelete('saleTeam', r.id, r.name)}
            className="h-7 w-7 text-rose-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  // ─── MOBILE M3 CARDS RENDERERS ──────────────────────────────────
  const renderProductCard = (p: Product) => (
    <div className="rounded-2xl border border-zinc-200/90 bg-white p-3.5 sm:p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-2.5 transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-md">
          {p.sku}
        </span>
        {renderTypeBadge(p.productType)}
      </div>

      <div>
        <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-snug">{p.name}</h4>
        <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
          <span className="inline-flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
            🏷️ {p.category?.name || 'Uncategorized'}
          </span>
          <span className="inline-flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
            📏 Base: {p.baseUom?.symbol || p.baseUom?.name || 'Unit'}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2.5 border-t border-zinc-100 dark:border-zinc-800 text-xs">
        <div>
          {(p.productUoms?.length || 0) > 0 ? (
            <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md">
              ⚡ {p.productUoms?.length} Secondary Unit{(p.productUoms?.length || 0) > 1 ? 's' : ''}
            </span>
          ) : (
            <span className="text-[11px] text-zinc-400">Base unit only</span>
          )}
        </div>

        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedProductId(p.id);
              setProductSheetOpen(true);
            }}
            className="h-8 px-2 text-zinc-600 dark:text-zinc-300"
            title="Inspect"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditProduct(p)}
            className="h-8 px-2 text-blue-600 dark:text-blue-400"
            title="Edit"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => confirmDelete('product', p.id, p.name)}
            className="h-8 px-2 text-rose-500"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );

  const renderCategoryCard = (c: ProductCategory) => (
    <div className="rounded-2xl border border-zinc-200/90 bg-white p-3.5 sm:p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{c.name}</h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
            {c.description || 'No description provided.'}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDialogMode('edit');
              setCategoryForm({ id: c.id, name: c.name, description: c.description || '' });
              setCategoryDialogOpen(true);
            }}
            className="h-8 px-2 text-blue-600"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => confirmDelete('category', c.id, c.name)}
            className="h-8 px-2 text-rose-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );

  const renderUomCard = (u: UOM) => (
    <div className="rounded-2xl border border-zinc-200/90 bg-white p-3.5 sm:p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 flex items-center justify-between gap-2">
      <div className="space-y-1">
        <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{u.name}</h4>
        <Badge variant="outline" className="text-xs font-mono font-bold">
          Symbol: {u.symbol || '-'}
        </Badge>
      </div>
      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setDialogMode('edit');
            setUomForm({ id: u.id, name: u.name, symbol: u.symbol || '' });
            setUomDialogOpen(true);
          }}
          className="h-8 px-2 text-blue-600"
        >
          <Edit2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => confirmDelete('uom', u.id, u.name)}
          className="h-8 px-2 text-rose-500"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );

  const renderSupplierCard = (s: Supplier) => (
    <div className="rounded-2xl border border-zinc-200/90 bg-white p-3.5 sm:p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 font-bold text-xs">
              <Truck className="h-3.5 w-3.5" />
            </div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{s.name}</h4>
          </div>
          {(s.township || s.location) && (
            <div className="flex items-center gap-1 text-[11px] text-zinc-500 pl-9">
              <MapPin className="h-3 w-3 shrink-0 text-zinc-400" />
              <span className="truncate">{[s.township, s.location].filter(Boolean).join(', ')}</span>
            </div>
          )}
        </div>
        {s.phoneNumber && (
          <a
            href={'tel:' + s.phoneNumber}
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 px-3 py-1.5 rounded-lg active:scale-95 transition-transform shrink-0 border border-emerald-200/60 dark:border-emerald-800/40"
          >
            <Phone className="h-3.5 w-3.5" />
            <span>Call</span>
          </a>
        )}
      </div>

      <div className="flex items-center justify-between pt-2.5 border-t border-zinc-100 dark:border-zinc-800 text-xs">
        <span className="text-[11px] text-zinc-500">{s.phoneNumber || 'No phone recorded'}</span>
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedSupplierId(s.id);
              setSupplierSheetOpen(true);
            }}
            className="h-8 px-2 text-zinc-600 dark:text-zinc-300"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDialogMode('edit');
              setSupplierForm({ id: s.id, name: s.name, phoneNumber: s.phoneNumber || '', township: s.township || '', location: s.location || '' });
              setSupplierDialogOpen(true);
            }}
            className="h-8 px-2 text-blue-600"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => confirmDelete('supplier', s.id, s.name)}
            className="h-8 px-2 text-rose-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );

  const renderCustomerCard = (c: Customer) => (
    <div className="rounded-2xl border border-zinc-200/90 bg-white p-3.5 sm:p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 font-bold text-xs">
              <Users className="h-3.5 w-3.5" />
            </div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{c.name}</h4>
          </div>
          {(c.address || c.location) && (
            <div className="flex items-center gap-1 text-[11px] text-zinc-500 pl-9">
              <MapPin className="h-3 w-3 shrink-0 text-zinc-400" />
              <span className="truncate">{[c.address, c.location].filter(Boolean).join(', ')}</span>
            </div>
          )}
        </div>
        {c.phoneNumber && (
          <a
            href={'tel:' + c.phoneNumber}
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 px-3 py-1.5 rounded-lg active:scale-95 transition-transform shrink-0 border border-emerald-200/60 dark:border-emerald-800/40"
          >
            <Phone className="h-3.5 w-3.5" />
            <span>Call</span>
          </a>
        )}
      </div>

      <div className="flex items-center justify-between pt-2.5 border-t border-zinc-100 dark:border-zinc-800 text-xs">
        <span className="text-[11px] text-zinc-500">{c.phoneNumber || 'No phone recorded'}</span>
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedCustomerId(c.id);
              setCustomerSheetOpen(true);
            }}
            className="h-8 px-2 text-zinc-600 dark:text-zinc-300"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDialogMode('edit');
              setCustomerForm({ id: c.id, name: c.name, phoneNumber: c.phoneNumber || '', address: c.address || '', location: c.location || '' });
              setCustomerDialogOpen(true);
            }}
            className="h-8 px-2 text-blue-600"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => confirmDelete('customer', c.id, c.name)}
            className="h-8 px-2 text-rose-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );

  const renderWarehouseCard = (w: Warehouse) => (
    <div className="rounded-2xl border border-zinc-200/90 bg-white p-3.5 sm:p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{w.name}</h4>
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
            <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md font-medium">
              🏢 {w.branch?.name || ('Branch #' + w.branchId)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedWarehouseId(w.id);
              setWarehouseSheetOpen(true);
            }}
            className="h-8 px-2 text-zinc-600 dark:text-zinc-300"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDialogMode('edit');
              setWarehouseForm({ id: w.id, name: w.name, branchId: String(w.branchId), location: w.location || '' });
              setWarehouseDialogOpen(true);
            }}
            className="h-8 px-2 text-blue-600"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => confirmDelete('warehouse', w.id, w.name)}
            className="h-8 px-2 text-rose-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      {w.location && (
        <div className="flex items-center gap-1 text-[11px] text-zinc-500 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <MapPin className="h-3 w-3 text-zinc-400" />
          <span>{w.location}</span>
        </div>
      )}
    </div>
  );

  const renderBranchCard = (b: Branch) => (
    <div className="rounded-2xl border border-zinc-200/90 bg-white p-3.5 sm:p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 flex items-center justify-between gap-2">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded">
            {b.code}
          </span>
          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{b.name}</h4>
        </div>
        {b.location && <p className="text-[11px] text-zinc-500 mt-1 truncate">{b.location}</p>}
      </div>
      <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setDialogMode('edit');
            setBranchForm({ id: b.id, name: b.name, code: b.code, location: b.location || '' });
            setBranchDialogOpen(true);
          }}
          className="h-8 px-2 text-blue-600"
        >
          <Edit2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => confirmDelete('branch', b.id, b.name)}
          className="h-8 px-2 text-rose-500"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );

  const renderSaleTeamCard = (t: SaleTeam) => (
    <div className="rounded-2xl border border-zinc-200/90 bg-white p-3.5 sm:p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 flex items-center justify-between gap-2">
      <div className="min-w-0">
        <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{t.name}</h4>
        <p className="text-[11px] text-zinc-500 mt-0.5 truncate">
          {t.branchId ? ('Assigned to Branch #' + t.branchId) : 'All Branches (ဗဟိုရုံး)'}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setDialogMode('edit');
            setSaleTeamForm({ id: t.id, name: t.name, branchId: t.branchId ? String(t.branchId) : '' });
            setSaleTeamDialogOpen(true);
          }}
          className="h-8 px-2 text-blue-600"
        >
          <Edit2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => confirmDelete('saleTeam', t.id, t.name)}
          className="h-8 px-2 text-rose-500"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );

  // Available secondary units for conversion (excluding base unit and already configured units)
  const availableSecondaryUoms = React.useMemo(() => {
    if (!selectedProduct) return [];
    const configuredUomIds = new Set(selectedProduct.productUoms?.map(pu => pu.uomId) || []);
    return uoms.filter(u => u.id !== selectedProduct.baseUomId && !configuredUomIds.has(u.id));
  }, [selectedProduct, uoms]);

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full overflow-x-hidden min-w-0">
      {/* ─── WORKSPACE HEADER (M3 Responsive) ───────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-4 pb-1">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 shrink-0" />
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 truncate">
              Products & Master Catalog
            </h1>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
            အခြေခံ အချက်အလက်များ (Products, Units, Suppliers, Customers, Warehouses)
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={loadMasterData}
            className="gap-1.5 h-8 text-xs shrink-0"
          >
            <RefreshCw className={isLoading ? 'animate-spin h-3.5 w-3.5' : 'h-3.5 w-3.5'} />
            <span className="hidden sm:inline">Refresh (ပြန်ဖွင့်)</span>
            <span className="sm:hidden">Refresh</span>
          </Button>

          {/* Desktop primary add button */}
          <div className="hidden sm:block">
            {activeTab === 'products' && (
              <Button variant="primary" size="sm" onClick={openCreateProduct} className="gap-1.5 h-8 text-xs">
                <Plus className="h-3.5 w-3.5" />
                <span>+ Product အသစ်</span>
              </Button>
            )}
            {activeTab === 'categories' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setDialogMode('create');
                  setCategoryForm({ id: 0, name: '', description: '' });
                  setCategoryDialogOpen(true);
                }}
                className="gap-1.5 h-8 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Category အသစ်</span>
              </Button>
            )}
            {activeTab === 'uoms' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setDialogMode('create');
                  setUomForm({ id: 0, name: '', symbol: '' });
                  setUomDialogOpen(true);
                }}
                className="gap-1.5 h-8 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Unit (UOM) အသစ်</span>
              </Button>
            )}
            {activeTab === 'suppliers' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setDialogMode('create');
                  setSupplierForm({ id: 0, name: '', phoneNumber: '', township: '', location: '' });
                  setSupplierDialogOpen(true);
                }}
                className="gap-1.5 h-8 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Supplier အသစ်</span>
              </Button>
            )}
            {activeTab === 'customers' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setDialogMode('create');
                  setCustomerForm({ id: 0, name: '', phoneNumber: '', address: '', location: '' });
                  setCustomerDialogOpen(true);
                }}
                className="gap-1.5 h-8 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Customer အသစ်</span>
              </Button>
            )}
            {activeTab === 'warehouses' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setDialogMode('create');
                  setWarehouseForm({ id: 0, name: '', branchId: branches[0]?.id ? String(branches[0].id) : '', location: '' });
                  setWarehouseDialogOpen(true);
                }}
                className="gap-1.5 h-8 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Warehouse အသစ်</span>
              </Button>
            )}
            {activeTab === 'branches' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setDialogMode('create');
                  setBranchForm({ id: 0, name: '', code: '', location: '' });
                  setBranchDialogOpen(true);
                }}
                className="gap-1.5 h-8 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Branch အသစ်</span>
              </Button>
            )}
            {activeTab === 'teams' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setDialogMode('create');
                  setSaleTeamForm({ id: 0, name: '', branchId: branches[0]?.id ? String(branches[0].id) : '' });
                  setSaleTeamDialogOpen(true);
                }}
                className="gap-1.5 h-8 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Sale Team အသစ်</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ─── TABS NAVIGATION (Scrollable M3 Segmented Bar) ─────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0">
          <TabsList className="w-max sm:w-full justify-start">
            <TabsTrigger value="products" count={products.length}>
              📦 Products (ကုန်ပစ္စည်း)
            </TabsTrigger>
            <TabsTrigger value="categories" count={categories.length}>
              🏷️ Categories
            </TabsTrigger>
            <TabsTrigger value="uoms" count={uoms.length}>
              📏 Units (UOM)
            </TabsTrigger>
            <TabsTrigger value="suppliers" count={suppliers.length}>
              🚚 Suppliers
            </TabsTrigger>
            <TabsTrigger value="customers" count={customers.length}>
              👥 Customers
            </TabsTrigger>
            <TabsTrigger value="warehouses" count={warehouses.length}>
              🏬 Warehouses
            </TabsTrigger>
            <TabsTrigger value="branches" count={branches.length}>
              🏢 Branches
            </TabsTrigger>
            <TabsTrigger value="teams" count={saleTeams.length}>
              🤝 Teams
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ─── TAB: PRODUCTS ──────────────────────────────────────── */}
        <TabsContent value="products">
          <DataTable
            data={filteredProducts}
            columns={productColumns}
            searchPlaceholder="Search products by name or SKU (အမည် သို့မဟုတ် SKU ဖြင့်ရှာဖွေရန်)..."
            searchKey="name"
            isLoading={isLoading}
            renderCard={renderProductCard}
            onRowClick={r => {
              setSelectedProductId(r.id);
              setProductSheetOpen(true);
            }}
            filterComponent={
              <div className="flex items-center gap-1 overflow-x-auto max-w-full py-1 text-xs">
                <button
                  type="button"
                  onClick={() => setProductTypeFilter('ALL')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors',
                    productTypeFilter === 'ALL'
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200'
                  )}
                >
                  All ({products.length})
                </button>
                <button
                  type="button"
                  onClick={() => setProductTypeFilter('FINISHED_GOOD')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors',
                    productTypeFilter === 'FINISHED_GOOD'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                  )}
                >
                  Finished Good
                </button>
                <button
                  type="button"
                  onClick={() => setProductTypeFilter('RAW_MATERIAL')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors',
                    productTypeFilter === 'RAW_MATERIAL'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
                  )}
                >
                  Raw Material
                </button>
                <button
                  type="button"
                  onClick={() => setProductTypeFilter('PACKAGING')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors',
                    productTypeFilter === 'PACKAGING'
                      ? 'bg-sky-600 text-white'
                      : 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 hover:bg-sky-100'
                  )}
                >
                  Packaging
                </button>
                <button
                  type="button"
                  onClick={() => setProductTypeFilter('SERVICE')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors',
                    productTypeFilter === 'SERVICE'
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 hover:bg-purple-100'
                  )}
                >
                  Service
                </button>
              </div>
            }
          />
        </TabsContent>

        {/* ─── TAB: CATEGORIES ────────────────────────────────────── */}
        <TabsContent value="categories">
          <DataTable
            data={categories}
            columns={categoryColumns}
            searchPlaceholder="Search categories (အမျိုးအစား ရှာရန်)..."
            searchKey="name"
            isLoading={isLoading}
            renderCard={renderCategoryCard}
          />
        </TabsContent>

        {/* ─── TAB: UOMS ──────────────────────────────────────────── */}
        <TabsContent value="uoms">
          <DataTable
            data={uoms}
            columns={uomColumns}
            searchPlaceholder="Search units (ယူနစ် ရှာရန်)..."
            searchKey="name"
            isLoading={isLoading}
            renderCard={renderUomCard}
          />
        </TabsContent>

        {/* ─── TAB: SUPPLIERS ─────────────────────────────────────── */}
        <TabsContent value="suppliers">
          <DataTable
            data={suppliers}
            columns={supplierColumns}
            searchPlaceholder="Search suppliers (ကုန်သွင်းသူ ရှာရန်)..."
            searchKey="name"
            isLoading={isLoading}
            renderCard={renderSupplierCard}
            onRowClick={r => {
              setSelectedSupplierId(r.id);
              setSupplierSheetOpen(true);
            }}
          />
        </TabsContent>

        {/* ─── TAB: CUSTOMERS ─────────────────────────────────────── */}
        <TabsContent value="customers">
          <DataTable
            data={customers}
            columns={customerColumns}
            searchPlaceholder="Search customers (ဖောက်သည် ရှာရန်)..."
            searchKey="name"
            isLoading={isLoading}
            renderCard={renderCustomerCard}
            onRowClick={r => {
              setSelectedCustomerId(r.id);
              setCustomerSheetOpen(true);
            }}
          />
        </TabsContent>

        {/* ─── TAB: WAREHOUSES ────────────────────────────────────── */}
        <TabsContent value="warehouses">
          <DataTable
            data={warehouses}
            columns={warehouseColumns}
            searchPlaceholder="Search warehouses (ဂိုဒေါင် ရှာရန်)..."
            searchKey="name"
            isLoading={isLoading}
            renderCard={renderWarehouseCard}
            onRowClick={r => {
              setSelectedWarehouseId(r.id);
              setWarehouseSheetOpen(true);
            }}
          />
        </TabsContent>

        {/* ─── TAB: BRANCHES ──────────────────────────────────────── */}
        <TabsContent value="branches">
          <DataTable
            data={branches}
            columns={branchColumns}
            searchPlaceholder="Search branches (ရုံးခွဲ ရှာရန်)..."
            searchKey="name"
            isLoading={isLoading}
            renderCard={renderBranchCard}
          />
        </TabsContent>

        {/* ─── TAB: SALE TEAMS ────────────────────────────────────── */}
        <TabsContent value="teams">
          <DataTable
            data={saleTeams}
            columns={saleTeamColumns}
            searchPlaceholder="Search sale teams (အရောင်းအဖွဲ့ ရှာရန်)..."
            searchKey="name"
            isLoading={isLoading}
            renderCard={renderSaleTeamCard}
          />
        </TabsContent>
      </Tabs>

      {/* ─── MOBILE M3 FLOATING ACTION BUTTON (FAB) ─────────────────── */}
      <button
        type="button"
        onClick={handleFabClick}
        className="fixed bottom-6 right-5 z-40 md:hidden flex items-center justify-center h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl active:scale-95 transition-all focus:outline-none focus:ring-4 focus:ring-blue-300"
        title="Add New Entity"
        aria-label="Add new item"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* ─── MODAL: PRODUCT CREATE / EDIT ───────────────────────────── */}
      <Dialog
        open={productDialogOpen}
        onOpenChange={setProductDialogOpen}
        title={dialogMode === 'edit' ? 'Edit Product (ကုန်ပစ္စည်းပြင်ဆင်ရန်)' : 'Create Product (ကုန်ပစ္စည်းအသစ်ဖန်တီးရန်)'}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="SKU Code *"
              value={productForm.sku}
              onChange={e => setProductForm({ ...productForm, sku: e.target.value })}
              placeholder="e.g. SKU-1001"
              required
            />
            <Input
              label="Product Name (ကုန်ပစ္စည်းအမည်) *"
              value={productForm.name}
              onChange={e => setProductForm({ ...productForm, name: e.target.value })}
              placeholder="e.g. Premier Coffee Mix 20g"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Category (အမျိုးအစား) *"
              value={productForm.categoryId}
              onChange={e => setProductForm({ ...productForm, categoryId: e.target.value })}
              required
            >
              <option value="">Select Category...</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>

            <Select
              label="Base UOM (အခြေခံယူနစ်) *"
              value={productForm.baseUomId}
              onChange={e => setProductForm({ ...productForm, baseUomId: e.target.value })}
              required
            >
              <option value="">Select Unit...</option>
              {uoms.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.symbol})
                </option>
              ))}
            </Select>

            <Select
              label="Product Type (ထုတ်ကုန်အမျိုးအစား) *"
              value={productForm.productType}
              onChange={e => setProductForm({ ...productForm, productType: e.target.value as ProductType })}
              required
            >
              <option value="FINISHED_GOOD">Finished Good (အချောထည်)</option>
              <option value="RAW_MATERIAL">Raw Material (ကုန်ကြမ်း)</option>
              <option value="PACKAGING">Packaging (ထုပ်ပိုးပစ္စည်း)</option>
              <option value="SERVICE">Service (ဝန်ဆောင်မှု)</option>
            </Select>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setProductDialogOpen(false)} className="w-full sm:w-auto">
              Cancel (မလုပ်တော့ပါ)
            </Button>
            <Button type="submit" variant="primary" className="w-full sm:w-auto">
              {dialogMode === 'edit' ? 'Update Product (သိမ်းဆည်းပါ)' : 'Save Product (သိမ်းဆည်းပါ)'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── MODAL: CATEGORY CREATE / EDIT ──────────────────────────── */}
      <Dialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        title={dialogMode === 'edit' ? 'Edit Category (အမျိုးအစား ပြင်ရန်)' : 'Create Category (အမျိုးအစား အသစ်)'}
      >
        <form onSubmit={handleSaveCategory} className="space-y-4">
          <Input
            label="Category Name (အမျိုးအစား အမည်) *"
            value={categoryForm.name}
            onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
            placeholder="e.g. Beverages, Snack, Raw Ingredients"
            required
          />
          <Input
            label="Description (အသေးစိတ် ဖော်ပြချက်)"
            value={categoryForm.description}
            onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })}
            placeholder="Optional description..."
          />
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setCategoryDialogOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="w-full sm:w-auto">
              Save Category (သိမ်းဆည်းပါ)
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── MODAL: UOM CREATE / EDIT ───────────────────────────────── */}
      <Dialog
        open={uomDialogOpen}
        onOpenChange={setUomDialogOpen}
        title={dialogMode === 'edit' ? 'Edit Unit (ယူနစ် ပြင်ရန်)' : 'Create Unit (ယူနစ် အသစ်)'}
      >
        <form onSubmit={handleSaveUom} className="space-y-4">
          <Input
            label="Unit Name (ယူနစ် အမည်) *"
            placeholder="e.g. Kilogram, Piece, Box, Tin"
            value={uomForm.name}
            onChange={e => setUomForm({ ...uomForm, name: e.target.value })}
            required
          />
          <Input
            label="Symbol (အတိုကောက် သင်္ကေတ) *"
            placeholder="e.g. kg, pcs, box, tin"
            value={uomForm.symbol}
            onChange={e => setUomForm({ ...uomForm, symbol: e.target.value })}
            required
          />
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setUomDialogOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="w-full sm:w-auto">
              Save Unit (သိမ်းဆည်းပါ)
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── MODAL: SUPPLIER CREATE / EDIT ──────────────────────────── */}
      <Dialog
        open={supplierDialogOpen}
        onOpenChange={setSupplierDialogOpen}
        title={dialogMode === 'edit' ? 'Edit Supplier (ကုန်သွင်းသူ ပြင်ရန်)' : 'Create Supplier (ကုန်သွင်းသူ အသစ်)'}
      >
        <form onSubmit={handleSaveSupplier} className="space-y-4">
          <Input
            label="Supplier Name (ကုန်သွင်းသူ အမည်) *"
            value={supplierForm.name}
            onChange={e => setSupplierForm({ ...supplierForm, name: e.target.value })}
            placeholder="e.g. Shwe Myanmar Trading Co., Ltd."
            required
          />
          <Input
            label="Phone Number (ဖုန်းနံပါတ်)"
            value={supplierForm.phoneNumber}
            onChange={e => setSupplierForm({ ...supplierForm, phoneNumber: e.target.value })}
            placeholder="e.g. 09-123456789"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Township (မြို့နယ်)"
              value={supplierForm.township}
              onChange={e => setSupplierForm({ ...supplierForm, township: e.target.value })}
              placeholder="e.g. Hlaing, Kamayut"
            />
            <Input
              label="Location / City (မြို့)"
              value={supplierForm.location}
              onChange={e => setSupplierForm({ ...supplierForm, location: e.target.value })}
              placeholder="e.g. Yangon, Mandalay"
            />
          </div>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setSupplierDialogOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="w-full sm:w-auto">
              Save Supplier (သိမ်းဆည်းပါ)
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── MODAL: CUSTOMER CREATE / EDIT ──────────────────────────── */}
      <Dialog
        open={customerDialogOpen}
        onOpenChange={setCustomerDialogOpen}
        title={dialogMode === 'edit' ? 'Edit Customer (ဖောက်သည် ပြင်ရန်)' : 'Create Customer (ဖောက်သည် အသစ်)'}
      >
        <form onSubmit={handleSaveCustomer} className="space-y-4">
          <Input
            label="Customer Name (ဖောက်သည် အမည်) *"
            value={customerForm.name}
            onChange={e => setCustomerForm({ ...customerForm, name: e.target.value })}
            placeholder="e.g. U Kyaw / City Mart"
            required
          />
          <Input
            label="Phone Number (ဖုန်းနံပါတ်)"
            value={customerForm.phoneNumber}
            onChange={e => setCustomerForm({ ...customerForm, phoneNumber: e.target.value })}
            placeholder="e.g. 09-987654321"
          />
          <Input
            label="Address / Location (လိပ်စာ)"
            value={customerForm.address}
            onChange={e => setCustomerForm({ ...customerForm, address: e.target.value })}
            placeholder="e.g. No. 12, Bogyoke Road, Yangon"
          />
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setCustomerDialogOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="w-full sm:w-auto">
              Save Customer (သိမ်းဆည်းပါ)
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── MODAL: WAREHOUSE CREATE / EDIT ─────────────────────────── */}
      <Dialog
        open={warehouseDialogOpen}
        onOpenChange={setWarehouseDialogOpen}
        title={dialogMode === 'edit' ? 'Edit Warehouse (ဂိုဒေါင် ပြင်ရန်)' : 'Create Warehouse (ဂိုဒေါင် အသစ်)'}
      >
        <form onSubmit={handleSaveWarehouse} className="space-y-4">
          <Input
            label="Warehouse Name (ဂိုဒေါင် အမည်) *"
            value={warehouseForm.name}
            onChange={e => setWarehouseForm({ ...warehouseForm, name: e.target.value })}
            placeholder="e.g. Main Central Warehouse"
            required
          />
          <Select
            label="Branch (ရုံးခွဲ) *"
            value={warehouseForm.branchId}
            onChange={e => setWarehouseForm({ ...warehouseForm, branchId: e.target.value })}
            required
          >
            <option value="">Select Branch...</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code})
              </option>
            ))}
          </Select>
          <Input
            label="Location (တည်နေရာ)"
            value={warehouseForm.location}
            onChange={e => setWarehouseForm({ ...warehouseForm, location: e.target.value })}
            placeholder="e.g. Bayintnaung Warehouse Compound"
          />
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setWarehouseDialogOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="w-full sm:w-auto">
              Save Warehouse (သိမ်းဆည်းပါ)
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── MODAL: BRANCH CREATE / EDIT ────────────────────────────── */}
      <Dialog
        open={branchDialogOpen}
        onOpenChange={setBranchDialogOpen}
        title={dialogMode === 'edit' ? 'Edit Branch (ရုံးခွဲ ပြင်ရန်)' : 'Create Branch (ရုံးခွဲ အသစ်)'}
      >
        <form onSubmit={handleSaveBranch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Branch Code (ကုဒ်) *"
              placeholder="e.g. YGN, MDY, NPT"
              value={branchForm.code}
              onChange={e => setBranchForm({ ...branchForm, code: e.target.value })}
              required
            />
            <Input
              label="Branch Name (ရုံးခွဲ အမည်) *"
              placeholder="e.g. Yangon Main Branch"
              value={branchForm.name}
              onChange={e => setBranchForm({ ...branchForm, name: e.target.value })}
              required
            />
          </div>
          <Input
            label="Location (မြို့နယ်/လိပ်စာ)"
            placeholder="e.g. Pabedan Township, Yangon"
            value={branchForm.location}
            onChange={e => setBranchForm({ ...branchForm, location: e.target.value })}
          />
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setBranchDialogOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="w-full sm:w-auto">
              Save Branch (သိမ်းဆည်းပါ)
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── MODAL: SALE TEAM CREATE / EDIT ─────────────────────────── */}
      <Dialog
        open={saleTeamDialogOpen}
        onOpenChange={setSaleTeamDialogOpen}
        title={dialogMode === 'edit' ? 'Edit Sale Team (အရောင်းအဖွဲ့ ပြင်ရန်)' : 'Create Sale Team (အရောင်းအဖွဲ့ အသစ်)'}
      >
        <form onSubmit={handleSaveSaleTeam} className="space-y-4">
          <Input
            label="Team Name (အဖွဲ့အမည်) *"
            placeholder="e.g. Alpha Van Sales, City Wholesale Team"
            value={saleTeamForm.name}
            onChange={e => setSaleTeamForm({ ...saleTeamForm, name: e.target.value })}
            required
          />
          <Select
            label="Assigned Branch (ရုံးခွဲ သတ်မှတ်ချက်)"
            value={saleTeamForm.branchId}
            onChange={e => setSaleTeamForm({ ...saleTeamForm, branchId: e.target.value })}
          >
            <option value="">All Branches / Central (ရုံးချုပ်)</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code})
              </option>
            ))}
          </Select>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setSaleTeamDialogOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="w-full sm:w-auto">
              Save Sale Team (သိမ်းဆည်းပါ)
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── MODAL: CONFIRM DELETE ──────────────────────────────────── */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen} title="Confirm Deletion (ဖျက်ရန် အတည်ပြုပါ)">
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300">
            Are you sure you want to delete <span className="font-bold text-zinc-900 dark:text-zinc-100">{deleteTarget?.name}</span>? ဤလုပ်ဆောင်ချက်ကို ပြန်လည်ပြင်ဆင်၍ မရပါ။
          </p>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setDeleteConfirmOpen(false)} className="w-full sm:w-auto">
              Cancel (မဖျက်တော့ပါ)
            </Button>
            <Button type="button" variant="destructive" onClick={executeDelete} className="w-full sm:w-auto">
              Confirm Delete (ဖျက်သိမ်းပါ)
            </Button>
          </div>
        </div>
      </Dialog>

      {/* ─── CONTEXTUAL SHEET: PRODUCT INSPECTION & UNIT CONVERSIONS ── */}
      <Sheet
        open={productSheetOpen}
        onOpenChange={setProductSheetOpen}
        title={selectedProduct?.name || 'Product Details'}
        description={`SKU: ${selectedProduct?.sku || ''}`}
        footer={
          selectedProduct && (
            <div className="flex items-center justify-between gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setProductSheetOpen(false)}
                className="text-xs"
              >
                Close (ပိတ်မည်)
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setProductSheetOpen(false);
                  openEditProduct(selectedProduct);
                }}
                className="gap-1.5 text-xs"
              >
                <Edit2 className="h-3.5 w-3.5" /> Edit Product
              </Button>
            </div>
          )
        }
      >
        {selectedProduct && (
          <div className="space-y-6 text-xs">
            {/* Overview Card */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">Product Type</p>
                <div className="mt-1">{renderTypeBadge(selectedProduct.productType)}</div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">Category</p>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-1">{selectedProduct.category?.name || '-'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">Base UOM (အခြေခံယူနစ်)</p>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-1">
                  {selectedProduct.baseUom?.name} ({selectedProduct.baseUom?.symbol})
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">Barcode / SKU</p>
                <p className="font-mono font-semibold text-blue-600 dark:text-blue-400 mt-1">{selectedProduct.sku}</p>
              </div>
            </div>

            {/* Secondary Unit Conversions Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider text-xs flex items-center gap-1.5">
                  <span>Unit Conversions (ယူနစ် အချိုးများ)</span>
                </h4>
                <Badge variant="outline" className="text-[10px]">
                  {selectedProduct.productUoms?.length || 0} active
                </Badge>
              </div>

              {/* Existing Conversions List */}
              {(selectedProduct.productUoms || []).length > 0 ? (
                <div className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900">
                  {selectedProduct.productUoms?.map((pu, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                          1 {pu.uom?.name || `Unit #${pu.uomId}`} ({pu.uom?.symbol})
                        </span>
                        <ArrowRight className="h-3 w-3 text-zinc-400" />
                        <span className="font-bold font-mono text-blue-600 dark:text-blue-400">
                          {pu.conversionFactor} {selectedProduct.baseUom?.symbol}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteUnitConversion(pu.uomId)}
                        className="h-7 w-7 text-rose-500 hover:text-rose-700"
                        title="Remove conversion"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center text-zinc-400 italic">
                  No secondary unit conversions configured yet.
                </div>
              )}

              {/* Add New Secondary Conversion Inline Form */}
              {availableSecondaryUoms.length > 0 && (
                <form
                  onSubmit={handleAddUnitConversion}
                  className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 space-y-3"
                >
                  <p className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                    + Add Secondary Unit Ratio (ယူနစ်အချိုး အသစ်ထည့်ရန်)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <Select
                      label="Secondary Unit (ယူနစ်)"
                      value={newConversionUomId}
                      onChange={e => setNewConversionUomId(e.target.value)}
                      required
                    >
                      <option value="">Select unit...</option>
                      {availableSecondaryUoms.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.symbol})
                        </option>
                      ))}
                    </Select>
                    <Input
                      label={`Multiplier (1 Unit = ? ${selectedProduct.baseUom?.symbol || 'Base'})`}
                      type="number"
                      step="any"
                      min="0.0001"
                      placeholder="e.g. 24, 12, 100"
                      value={newConversionFactor}
                      onChange={e => setNewConversionFactor(e.target.value)}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isAddingConversion || !newConversionUomId || !newConversionFactor}
                    className="w-full text-xs h-8"
                  >
                    {isAddingConversion ? 'Adding...' : '+ Save Conversion Ratio'}
                  </Button>
                </form>
              )}
            </div>
          </div>
        )}
      </Sheet>

      {/* ─── CONTEXTUAL SHEET: SUPPLIER INSPECTION ──────────────────── */}
      <Sheet
        open={supplierSheetOpen}
        onOpenChange={setSupplierSheetOpen}
        title={selectedSupplier?.name || 'Supplier'}
        description={`Location: ${selectedSupplier?.township || selectedSupplier?.location || '-'}`}
        footer={
          selectedSupplier && (
            <div className="flex items-center justify-between gap-2 w-full">
              <Button variant="outline" size="sm" onClick={() => setSupplierSheetOpen(false)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setSupplierSheetOpen(false);
                  setDialogMode('edit');
                  setSupplierForm({
                    id: selectedSupplier.id,
                    name: selectedSupplier.name,
                    phoneNumber: selectedSupplier.phoneNumber || '',
                    township: selectedSupplier.township || '',
                    location: selectedSupplier.location || '',
                  });
                  setSupplierDialogOpen(true);
                }}
                className="gap-1.5 text-xs"
              >
                <Edit2 className="h-3.5 w-3.5" /> Edit Supplier
              </Button>
            </div>
          )
        }
      >
        {selectedSupplier && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-zinc-400" />
                  <span className="font-semibold">{selectedSupplier.phoneNumber || 'No phone recorded'}</span>
                </div>
                {selectedSupplier.phoneNumber && (
                  <a
                    href={`tel:${selectedSupplier.phoneNumber}`}
                    className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    <span>Call Now</span>
                  </a>
                )}
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <MapPin className="h-4 w-4 text-zinc-400" />
                <span>{[selectedSupplier.township, selectedSupplier.location].filter(Boolean).join(', ') || 'No address recorded'}</span>
              </div>
            </div>
          </div>
        )}
      </Sheet>

      {/* ─── CONTEXTUAL SHEET: CUSTOMER INSPECTION ──────────────────── */}
      <Sheet
        open={customerSheetOpen}
        onOpenChange={setCustomerSheetOpen}
        title={selectedCustomer?.name || 'Customer'}
        description={`Phone: ${selectedCustomer?.phoneNumber || '-'}`}
        footer={
          selectedCustomer && (
            <div className="flex items-center justify-between gap-2 w-full">
              <Button variant="outline" size="sm" onClick={() => setCustomerSheetOpen(false)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setCustomerSheetOpen(false);
                  setDialogMode('edit');
                  setCustomerForm({
                    id: selectedCustomer.id,
                    name: selectedCustomer.name,
                    phoneNumber: selectedCustomer.phoneNumber || '',
                    address: selectedCustomer.address || '',
                    location: selectedCustomer.location || '',
                  });
                  setCustomerDialogOpen(true);
                }}
                className="gap-1.5 text-xs"
              >
                <Edit2 className="h-3.5 w-3.5" /> Edit Customer
              </Button>
            </div>
          )
        }
      >
        {selectedCustomer && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-zinc-400" />
                  <span className="font-semibold">{selectedCustomer.phoneNumber || 'No phone recorded'}</span>
                </div>
                {selectedCustomer.phoneNumber && (
                  <a
                    href={`tel:${selectedCustomer.phoneNumber}`}
                    className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    <span>Call Now</span>
                  </a>
                )}
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <MapPin className="h-4 w-4 text-zinc-400" />
                <span>{[selectedCustomer.address, selectedCustomer.location].filter(Boolean).join(', ') || 'No address recorded'}</span>
              </div>
            </div>
          </div>
        )}
      </Sheet>

      {/* ─── CONTEXTUAL SHEET: WAREHOUSE INSPECTION ─────────────────── */}
      <Sheet
        open={warehouseSheetOpen}
        onOpenChange={setWarehouseSheetOpen}
        title={selectedWarehouse?.name || 'Warehouse'}
        description={`Branch: ${selectedWarehouse?.branch?.name || ''}`}
        footer={
          selectedWarehouse && (
            <div className="flex items-center justify-between gap-2 w-full">
              <Button variant="outline" size="sm" onClick={() => setWarehouseSheetOpen(false)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setWarehouseSheetOpen(false);
                  setDialogMode('edit');
                  setWarehouseForm({
                    id: selectedWarehouse.id,
                    name: selectedWarehouse.name,
                    branchId: String(selectedWarehouse.branchId),
                    location: selectedWarehouse.location || '',
                  });
                  setWarehouseDialogOpen(true);
                }}
                className="gap-1.5 text-xs"
              >
                <Edit2 className="h-3.5 w-3.5" /> Edit Warehouse
              </Button>
            </div>
          )
        }
      >
        {selectedWarehouse && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 space-y-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-zinc-400" />
                <span className="font-semibold">{selectedWarehouse.branch?.name || `Branch #${selectedWarehouse.branchId}`}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-zinc-400" />
                <span>{selectedWarehouse.location || 'Location details not specified'}</span>
              </div>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}

