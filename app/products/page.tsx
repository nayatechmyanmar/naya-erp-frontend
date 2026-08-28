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
import { formatCurrency, formatQuantity } from '@/lib/utils';
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

  // Detail Sheet States
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [selectedSupplier, setSelectedSupplier] = React.useState<Supplier | null>(null);
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = React.useState<Warehouse | null>(null);
  const [productSheetOpen, setProductSheetOpen] = React.useState(false);
  const [supplierSheetOpen, setSupplierSheetOpen] = React.useState(false);
  const [customerSheetOpen, setCustomerSheetOpen] = React.useState(false);
  const [warehouseSheetOpen, setWarehouseSheetOpen] = React.useState(false);

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
    } catch (err: any) {
      error('Failed to load master catalog', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  React.useEffect(() => {
    loadMasterData();
  }, [loadMasterData]);

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
      success(isEdit ? 'Product Updated' : 'Product Created', `Saved ${productForm.name}`);
      setProductDialogOpen(false);
      loadMasterData();
    } else {
      error('Failed to save product', res.message);
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
      success('Deleted successfully', `${deleteTarget.name} has been removed`);
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

  // Columns Definitions
  const productColumns: Column<Product>[] = [
    { header: 'SKU', accessorKey: 'sku', sortable: true, className: 'font-mono font-bold text-blue-600' },
    { header: 'Product Name', accessorKey: 'name', sortable: true, className: 'font-semibold' },
    {
      header: 'Type',
      accessorKey: 'productType',
      cell: r => {
        const typeVariants: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'info'> = {
          FINISHED_GOOD: 'success',
          RAW_MATERIAL: 'warning',
          PACKAGING: 'info',
          SERVICE: 'secondary',
        };
        return <Badge variant={typeVariants[r.productType] || 'default'}>{r.productType.replace('_', ' ')}</Badge>;
      },
    },
    { header: 'Category', cell: r => r.category?.name || '-' },
    { header: 'Base Unit', cell: r => r.baseUom?.symbol || r.baseUom?.name || '-' },
    {
      header: 'Actions',
      className: 'text-right',
      cell: r => (
        <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedProduct(r);
              setProductSheetOpen(true);
            }}
            className="h-7 w-7 text-zinc-500 hover:text-zinc-900"
            title="Inspect"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openEditProduct(r)}
            className="h-7 w-7 text-blue-600 hover:text-blue-700"
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
              setSelectedSupplier(r);
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
              setSelectedCustomer(r);
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
    { header: 'Branch', cell: r => r.branch?.name || `Branch #${r.branchId}` },
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
              setSelectedWarehouse(r);
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
    { header: 'Branch ID', cell: r => r.branchId ? `Branch #${r.branchId}` : 'All Branches' },
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

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Products & Master Catalog (အခြေခံ အချက်အလက်များ)
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Enterprise master entity management: Products, Categories, Units, Suppliers, Customers, Warehouses, Branches, and Sale Teams.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadMasterData} className="gap-1.5 h-8 text-xs">
            <RefreshCw className={isLoading ? 'animate-spin h-3.5 w-3.5' : 'h-3.5 w-3.5'} />
            <span>Refresh</span>
          </Button>

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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-zinc-100 dark:bg-zinc-800">
          <TabsTrigger value="products" count={products.length}>
            Products (ကုန်ပစ္စည်း)
          </TabsTrigger>
          <TabsTrigger value="categories" count={categories.length}>
            Categories
          </TabsTrigger>
          <TabsTrigger value="uoms" count={uoms.length}>
            Units (UOM)
          </TabsTrigger>
          <TabsTrigger value="suppliers" count={suppliers.length}>
            Suppliers
          </TabsTrigger>
          <TabsTrigger value="customers" count={customers.length}>
            Customers
          </TabsTrigger>
          <TabsTrigger value="warehouses" count={warehouses.length}>
            Warehouses
          </TabsTrigger>
          <TabsTrigger value="branches" count={branches.length}>
            Branches
          </TabsTrigger>
          <TabsTrigger value="teams" count={saleTeams.length}>
            Sale Teams
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <DataTable
            data={products}
            columns={productColumns}
            searchPlaceholder="Search products by name or SKU..."
            searchKey="name"
            isLoading={isLoading}
            onRowClick={r => {
              setSelectedProduct(r);
              setProductSheetOpen(true);
            }}
          />
        </TabsContent>

        <TabsContent value="categories">
          <DataTable data={categories} columns={categoryColumns} searchPlaceholder="Search categories..." searchKey="name" isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="uoms">
          <DataTable data={uoms} columns={uomColumns} searchPlaceholder="Search units..." searchKey="name" isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="suppliers">
          <DataTable
            data={suppliers}
            columns={supplierColumns}
            searchPlaceholder="Search suppliers..."
            searchKey="name"
            isLoading={isLoading}
            onRowClick={r => {
              setSelectedSupplier(r);
              setSupplierSheetOpen(true);
            }}
          />
        </TabsContent>

        <TabsContent value="customers">
          <DataTable
            data={customers}
            columns={customerColumns}
            searchPlaceholder="Search customers..."
            searchKey="name"
            isLoading={isLoading}
            onRowClick={r => {
              setSelectedCustomer(r);
              setCustomerSheetOpen(true);
            }}
          />
        </TabsContent>

        <TabsContent value="warehouses">
          <DataTable
            data={warehouses}
            columns={warehouseColumns}
            searchPlaceholder="Search warehouses..."
            searchKey="name"
            isLoading={isLoading}
            onRowClick={r => {
              setSelectedWarehouse(r);
              setWarehouseSheetOpen(true);
            }}
          />
        </TabsContent>

        <TabsContent value="branches">
          <DataTable data={branches} columns={branchColumns} searchPlaceholder="Search branches..." searchKey="name" isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="teams">
          <DataTable data={saleTeams} columns={saleTeamColumns} searchPlaceholder="Search sale teams..." searchKey="name" isLoading={isLoading} />
        </TabsContent>
      </Tabs>

      {/* ─── MODAL: PRODUCT CREATE / EDIT ───────────────────────────── */}
      <Dialog
        open={productDialogOpen}
        onOpenChange={setProductDialogOpen}
        title={dialogMode === 'edit' ? 'Edit Product (ကုန်ပစ္စည်းပြင်ဆင်ရန်)' : 'Create Product (ကုန်ပစ္စည်းအသစ်ဖန်တီးရန်)'}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="SKU Code *"
              value={productForm.sku}
              onChange={e => setProductForm({ ...productForm, sku: e.target.value })}
              required
            />
            <Input
              label="Product Name (ကုန်ပစ္စည်းအမည်) *"
              value={productForm.name}
              onChange={e => setProductForm({ ...productForm, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Category *"
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
              label="Product Type *"
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

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setProductDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {dialogMode === 'edit' ? 'Update Product' : 'Save Product'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── MODAL: CATEGORY CREATE / EDIT ──────────────────────────── */}
      <Dialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        title={dialogMode === 'edit' ? 'Edit Category' : 'Create Category'}
      >
        <form onSubmit={handleSaveCategory} className="space-y-4">
          <Input
            label="Category Name *"
            value={categoryForm.name}
            onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
            required
          />
          <Input
            label="Description"
            value={categoryForm.description}
            onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setCategoryDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Category
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── MODAL: UOM CREATE / EDIT ───────────────────────────────── */}
      <Dialog
        open={uomDialogOpen}
        onOpenChange={setUomDialogOpen}
        title={dialogMode === 'edit' ? 'Edit Unit (UOM)' : 'Create Unit (UOM)'}
      >
        <form onSubmit={handleSaveUom} className="space-y-4">
          <Input
            label="Unit Name *"
            placeholder="e.g. Kilogram, Piece, Box"
            value={uomForm.name}
            onChange={e => setUomForm({ ...uomForm, name: e.target.value })}
            required
          />
          <Input
            label="Symbol *"
            placeholder="e.g. kg, pcs, box"
            value={uomForm.symbol}
            onChange={e => setUomForm({ ...uomForm, symbol: e.target.value })}
            required
          />
          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setUomDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Unit
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── MODAL: SUPPLIER CREATE / EDIT ──────────────────────────── */}
      <Dialog
        open={supplierDialogOpen}
        onOpenChange={setSupplierDialogOpen}
        title={dialogMode === 'edit' ? 'Edit Supplier' : 'Create Supplier'}
      >
        <form onSubmit={handleSaveSupplier} className="space-y-4">
          <Input
            label="Supplier Name *"
            value={supplierForm.name}
            onChange={e => setSupplierForm({ ...supplierForm, name: e.target.value })}
            required
          />
          <Input
            label="Phone Number"
            value={supplierForm.phoneNumber}
            onChange={e => setSupplierForm({ ...supplierForm, phoneNumber: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Township"
              value={supplierForm.township}
              onChange={e => setSupplierForm({ ...supplierForm, township: e.target.value })}
            />
            <Input
              label="Location / City"
              value={supplierForm.location}
              onChange={e => setSupplierForm({ ...supplierForm, location: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setSupplierDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Supplier
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── MODAL: CUSTOMER CREATE / EDIT ──────────────────────────── */}
      <Dialog
        open={customerDialogOpen}
        onOpenChange={setCustomerDialogOpen}
        title={dialogMode === 'edit' ? 'Edit Customer' : 'Create Customer'}
      >
        <form onSubmit={handleSaveCustomer} className="space-y-4">
          <Input
            label="Customer Name *"
            value={customerForm.name}
            onChange={e => setCustomerForm({ ...customerForm, name: e.target.value })}
            required
          />
          <Input
            label="Phone Number"
            value={customerForm.phoneNumber}
            onChange={e => setCustomerForm({ ...customerForm, phoneNumber: e.target.value })}
          />
          <Input
            label="Address"
            value={customerForm.address}
            onChange={e => setCustomerForm({ ...customerForm, address: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setCustomerDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Customer
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── MODAL: WAREHOUSE CREATE / EDIT ─────────────────────────── */}
      <Dialog
        open={warehouseDialogOpen}
        onOpenChange={setWarehouseDialogOpen}
        title={dialogMode === 'edit' ? 'Edit Warehouse' : 'Create Warehouse'}
      >
        <form onSubmit={handleSaveWarehouse} className="space-y-4">
          <Input
            label="Warehouse Name *"
            value={warehouseForm.name}
            onChange={e => setWarehouseForm({ ...warehouseForm, name: e.target.value })}
            required
          />
          <Select
            label="Branch *"
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
            label="Location"
            value={warehouseForm.location}
            onChange={e => setWarehouseForm({ ...warehouseForm, location: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setWarehouseDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Warehouse
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── MODAL: BRANCH CREATE / EDIT ────────────────────────────── */}
      <Dialog
        open={branchDialogOpen}
        onOpenChange={setBranchDialogOpen}
        title={dialogMode === 'edit' ? 'Edit Branch' : 'Create Branch'}
      >
        <form onSubmit={handleSaveBranch} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Branch Code *"
              placeholder="e.g. YGN, MDY"
              value={branchForm.code}
              onChange={e => setBranchForm({ ...branchForm, code: e.target.value })}
              required
            />
            <Input
              label="Branch Name *"
              value={branchForm.name}
              onChange={e => setBranchForm({ ...branchForm, name: e.target.value })}
              required
            />
          </div>
          <Input
            label="Location"
            value={branchForm.location}
            onChange={e => setBranchForm({ ...branchForm, location: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setBranchDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Branch
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── MODAL: SALE TEAM CREATE / EDIT ─────────────────────────── */}
      <Dialog
        open={saleTeamDialogOpen}
        onOpenChange={setSaleTeamDialogOpen}
        title={dialogMode === 'edit' ? 'Edit Sale Team' : 'Create Sale Team'}
      >
        <form onSubmit={handleSaveSaleTeam} className="space-y-4">
          <Input
            label="Team Name *"
            value={saleTeamForm.name}
            onChange={e => setSaleTeamForm({ ...saleTeamForm, name: e.target.value })}
            required
          />
          <Select
            label="Assigned Branch"
            value={saleTeamForm.branchId}
            onChange={e => setSaleTeamForm({ ...saleTeamForm, branchId: e.target.value })}
          >
            <option value="">Select Branch...</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setSaleTeamDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Sale Team
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── MODAL: CONFIRM DELETE ──────────────────────────────────── */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen} title="Confirm Deletion (ဖျက်ရန် အတည်ပြုပါ)">
        <div className="space-y-4">
          <p className="text-xs text-zinc-600 dark:text-zinc-300">
            Are you sure you want to delete <span className="font-bold text-zinc-900 dark:text-zinc-100">{deleteTarget?.name}</span>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={executeDelete}>
              Confirm Delete
            </Button>
          </div>
        </div>
      </Dialog>

      {/* ─── CONTEXTUAL SHEET: PRODUCT INSPECTION ─────────────────────── */}
      <Sheet
        open={productSheetOpen}
        onOpenChange={setProductSheetOpen}
        title={selectedProduct?.name || 'Product Details'}
        description={`SKU: ${selectedProduct?.sku || ''}`}
        footer={
          selectedProduct && (
            <div className="flex justify-end gap-2 w-full">
              <Button
                variant="outline"
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
            <div className="grid grid-cols-2 gap-3 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">Product Type</p>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-1">{selectedProduct.productType}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">Category</p>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-1">{selectedProduct.category?.name || '-'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">Base UOM</p>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-1">
                  {selectedProduct.baseUom?.name} ({selectedProduct.baseUom?.symbol})
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">Barcode / SKU</p>
                <p className="font-mono font-semibold text-zinc-800 dark:text-zinc-200 mt-1">{selectedProduct.sku}</p>
              </div>
            </div>

            {/* Conversion Matrix */}
            <div className="space-y-2">
              <h4 className="font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider text-xs">
                Unit Conversion Ratios (ယူနစ် အချိုးများ)
              </h4>
              {(selectedProduct.productUoms || []).length > 0 ? (
                <div className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                  {selectedProduct.productUoms?.map((pu, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3">
                      <span>1 {pu.uom?.name || `Unit #${pu.uomId}`}</span>
                      <span className="font-bold font-mono">
                        = {pu.conversionFactor} {selectedProduct.baseUom?.symbol}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-400 italic">No secondary unit conversions configured.</p>
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
      >
        {selectedSupplier && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 space-y-2">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-zinc-400" />
                <span className="font-semibold">{selectedSupplier.phoneNumber || 'No phone recorded'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-zinc-400" />
                <span>{selectedSupplier.location || selectedSupplier.township || 'No address recorded'}</span>
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
      >
        {selectedCustomer && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 space-y-2">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-zinc-400" />
                <span className="font-semibold">{selectedCustomer.phoneNumber || 'No phone recorded'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-zinc-400" />
                <span>{selectedCustomer.address || selectedCustomer.location || 'No address recorded'}</span>
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
      >
        {selectedWarehouse && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 space-y-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-zinc-400" />
                <span className="font-semibold">{selectedWarehouse.branch?.name || 'Assigned Branch'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-zinc-400" />
                <span>{selectedWarehouse.location || 'Location details'}</span>
              </div>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
