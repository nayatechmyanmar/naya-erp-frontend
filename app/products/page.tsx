'use client';

import * as React from 'react';
import {
  Package,
  Plus,
  Tag,
  Scale,
  Truck,
  Users,
  Warehouse as WarehouseIcon,
  GitBranch,
  Eye,
  Trash2,
  Edit2,
  RefreshCw,
} from 'lucide-react';
import { apiFetch } from '@/lib/api/bff-client';
import { useToast } from '@/components/ui/toast';
import { DataTable, Column } from '@/components/ui/data-table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Sheet } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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

export default function ProductsMasterPage() {
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = React.useState('products');
  const [isLoading, setIsLoading] = React.useState(true);

  // Master Data States
  const [products, setProducts] = React.useState<Product[]>([]);
  const [categories, setCategories] = React.useState<ProductCategory[]>([]);
  const [uoms, setUoms] = React.useState<UOM[]>([]);
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [warehouses, setWarehouses] = React.useState<Warehouse[]>([]);
  const [branches, setBranches] = React.useState<Branch[]>([]);
  const [saleTeams, setSaleTeams] = React.useState<SaleTeam[]>([]);

  // Dialog States
  const [productDialogOpen, setProductDialogOpen] = React.useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = React.useState(false);
  const [uomDialogOpen, setUomDialogOpen] = React.useState(false);
  const [supplierDialogOpen, setSupplierDialogOpen] = React.useState(false);
  const [customerDialogOpen, setCustomerDialogOpen] = React.useState(false);
  const [warehouseDialogOpen, setWarehouseDialogOpen] = React.useState(false);
  const [branchDialogOpen, setBranchDialogOpen] = React.useState(false);
  const [saleTeamDialogOpen, setSaleTeamDialogOpen] = React.useState(false);

  // Inspection Sheet State
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  // Form input states
  const [productForm, setProductForm] = React.useState({
    name: '',
    sku: '',
    categoryId: '',
    baseUomId: '',
    productType: 'RAW_MATERIAL' as ProductType,
  });

  const [categoryForm, setCategoryForm] = React.useState({ name: '' });
  const [uomForm, setUomForm] = React.useState({ name: '', symbol: '' });
  const [supplierForm, setSupplierForm] = React.useState({ name: '', phoneNumber: '', location: '', township: '' });
  const [customerForm, setCustomerForm] = React.useState({ name: '', phoneNumber: '', address: '', location: '' });
  const [warehouseForm, setWarehouseForm] = React.useState({ name: '', branchId: '', location: '' });
  const [branchForm, setBranchForm] = React.useState({ name: '', code: '', location: '' });
  const [saleTeamForm, setSaleTeamForm] = React.useState({ name: '', branchId: '' });

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [pRes, cRes, uRes, sRes, custRes, wRes, bRes, stRes] = await Promise.all([
        apiFetch<Product[]>('/api/master/products'),
        apiFetch<ProductCategory[]>('/api/master/categories'),
        apiFetch<UOM[]>('/api/master/uoms'),
        apiFetch<Supplier[]>('/api/master/suppliers'),
        apiFetch<Customer[]>('/api/master/customers'),
        apiFetch<Warehouse[]>('/api/master/warehouses'),
        apiFetch<Branch[]>('/api/master/branches'),
        apiFetch<SaleTeam[]>('/api/master/sale-teams'),
      ]);

      if (pRes.success && Array.isArray(pRes.data)) setProducts(pRes.data);
      if (cRes.success && Array.isArray(cRes.data)) setCategories(cRes.data);
      if (uRes.success && Array.isArray(uRes.data)) setUoms(uRes.data);
      if (sRes.success && Array.isArray(sRes.data)) setSuppliers(sRes.data);
      if (custRes.success && Array.isArray(custRes.data)) setCustomers(custRes.data);
      if (wRes.success && Array.isArray(wRes.data)) setWarehouses(wRes.data);
      if (bRes.success && Array.isArray(bRes.data)) setBranches(bRes.data);
      if (stRes.success && Array.isArray(stRes.data)) setSaleTeams(stRes.data);
    } catch (err: any) {
      error('Failed to load master data', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Product Create
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.sku || !productForm.categoryId || !productForm.baseUomId) {
      error('Please complete all required fields');
      return;
    }

    const res = await apiFetch('/api/master/products', {
      method: 'POST',
      body: JSON.stringify({
        name: productForm.name,
        sku: productForm.sku,
        categoryId: Number(productForm.categoryId),
        baseUomId: Number(productForm.baseUomId),
        productType: productForm.productType,
      }),
    });

    if (res.success) {
      success('Product Created', `Added ${productForm.name}`);
      setProductDialogOpen(false);
      setProductForm({ name: '', sku: '', categoryId: '', baseUomId: '', productType: 'RAW_MATERIAL' });
      loadData();
    } else {
      error('Creation failed', res.message);
    }
  };

  // Category Create
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiFetch('/api/master/categories', {
      method: 'POST',
      body: JSON.stringify(categoryForm),
    });
    if (res.success) {
      success('Category Created');
      setCategoryDialogOpen(false);
      setCategoryForm({ name: '' });
      loadData();
    } else {
      error('Creation failed', res.message);
    }
  };

  // UOM Create
  const handleCreateUom = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiFetch('/api/master/uoms', {
      method: 'POST',
      body: JSON.stringify(uomForm),
    });
    if (res.success) {
      success('UOM Created');
      setUomDialogOpen(false);
      setUomForm({ name: '', symbol: '' });
      loadData();
    } else {
      error('Creation failed', res.message);
    }
  };

  // Supplier Create
  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiFetch('/api/master/suppliers', {
      method: 'POST',
      body: JSON.stringify(supplierForm),
    });
    if (res.success) {
      success('Supplier Created', `Added ${supplierForm.name}`);
      setSupplierDialogOpen(false);
      setSupplierForm({ name: '', phoneNumber: '', location: '', township: '' });
      loadData();
    } else {
      error('Creation failed', res.message);
    }
  };

  // Customer Create
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiFetch('/api/master/customers', {
      method: 'POST',
      body: JSON.stringify(customerForm),
    });
    if (res.success) {
      success('Customer Created', `Added ${customerForm.name}`);
      setCustomerDialogOpen(false);
      setCustomerForm({ name: '', phoneNumber: '', address: '', location: '' });
      loadData();
    } else {
      error('Creation failed', res.message);
    }
  };

  // Warehouse Create
  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiFetch('/api/master/warehouses', {
      method: 'POST',
      body: JSON.stringify({
        ...warehouseForm,
        branchId: Number(warehouseForm.branchId || branches[0]?.id || 1),
      }),
    });
    if (res.success) {
      success('Warehouse Created', `Added ${warehouseForm.name}`);
      setWarehouseDialogOpen(false);
      setWarehouseForm({ name: '', branchId: '', location: '' });
      loadData();
    } else {
      error('Creation failed', res.message);
    }
  };

  // Branch Create
  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiFetch('/api/master/branches', {
      method: 'POST',
      body: JSON.stringify(branchForm),
    });
    if (res.success) {
      success('Branch Created', `Added ${branchForm.name}`);
      setBranchDialogOpen(false);
      setBranchForm({ name: '', code: '', location: '' });
      loadData();
    } else {
      error('Creation failed', res.message);
    }
  };

  // Sale Team Create
  const handleCreateSaleTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiFetch('/api/master/sale-teams', {
      method: 'POST',
      body: JSON.stringify({
        ...saleTeamForm,
        branchId: saleTeamForm.branchId ? Number(saleTeamForm.branchId) : undefined,
      }),
    });
    if (res.success) {
      success('Sale Team Created', `Added ${saleTeamForm.name}`);
      setSaleTeamDialogOpen(false);
      setSaleTeamForm({ name: '', branchId: '' });
      loadData();
    } else {
      error('Creation failed', res.message);
    }
  };

  // Table Columns
  const productColumns: Column<Product>[] = [
    { header: 'SKU', accessorKey: 'sku', sortable: true, className: 'font-mono font-medium' },
    { header: 'Product Name', accessorKey: 'name', sortable: true, className: 'font-semibold' },
    {
      header: 'Type',
      accessorKey: 'productType',
      cell: row => {
        const typeVariants: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'info'> = {
          RAW_MATERIAL: 'info',
          FINISHED_GOOD: 'success',
          PACKAGING: 'warning',
          SERVICE: 'secondary',
        };
        return <Badge variant={typeVariants[row.productType] || 'default'}>{row.productType.replace('_', ' ')}</Badge>;
      },
    },
    { header: 'Category', cell: row => row.category?.name || '-' },
    { header: 'Base Unit', cell: row => row.baseUom?.symbol || row.baseUom?.name || '-' },
    {
      header: 'Actions',
      className: 'text-right',
      cell: row => (
        <Button
          variant="ghost"
          size="sm"
          onClick={e => {
            e.stopPropagation();
            setSelectedProduct(row);
            setSheetOpen(true);
          }}
          className="h-7 text-xs gap-1"
        >
          <Eye className="h-3.5 w-3.5" /> Details
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Products & Master Catalog
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Manage goods specifications, base units of measurement, business partners, and multi-location warehouses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} className="gap-1.5 h-8 text-xs">
            <RefreshCw className={isLoading ? 'animate-spin h-3.5 w-3.5' : 'h-3.5 w-3.5'} />
            <span>Refresh</span>
          </Button>

          {activeTab === 'products' && (
            <Button variant="primary" size="sm" onClick={() => setProductDialogOpen(true)} className="gap-1.5 h-8 text-xs">
              <Plus className="h-3.5 w-3.5" />
              <span>+ New Product</span>
            </Button>
          )}
          {activeTab === 'categories' && (
            <Button variant="primary" size="sm" onClick={() => setCategoryDialogOpen(true)} className="gap-1.5 h-8 text-xs">
              <Plus className="h-3.5 w-3.5" />
              <span>+ New Category</span>
            </Button>
          )}
          {activeTab === 'uoms' && (
            <Button variant="primary" size="sm" onClick={() => setUomDialogOpen(true)} className="gap-1.5 h-8 text-xs">
              <Plus className="h-3.5 w-3.5" />
              <span>+ New UOM</span>
            </Button>
          )}
          {activeTab === 'suppliers' && (
            <Button variant="primary" size="sm" onClick={() => setSupplierDialogOpen(true)} className="gap-1.5 h-8 text-xs">
              <Plus className="h-3.5 w-3.5" />
              <span>+ New Supplier</span>
            </Button>
          )}
          {activeTab === 'customers' && (
            <Button variant="primary" size="sm" onClick={() => setCustomerDialogOpen(true)} className="gap-1.5 h-8 text-xs">
              <Plus className="h-3.5 w-3.5" />
              <span>+ New Customer</span>
            </Button>
          )}
          {activeTab === 'warehouses' && (
            <Button variant="primary" size="sm" onClick={() => setWarehouseDialogOpen(true)} className="gap-1.5 h-8 text-xs">
              <Plus className="h-3.5 w-3.5" />
              <span>+ New Warehouse</span>
            </Button>
          )}
          {activeTab === 'branches' && (
            <Button variant="primary" size="sm" onClick={() => setBranchDialogOpen(true)} className="gap-1.5 h-8 text-xs">
              <Plus className="h-3.5 w-3.5" />
              <span>+ New Branch</span>
            </Button>
          )}
          {activeTab === 'teams' && (
            <Button variant="primary" size="sm" onClick={() => setSaleTeamDialogOpen(true)} className="gap-1.5 h-8 text-xs">
              <Plus className="h-3.5 w-3.5" />
              <span>+ New Team</span>
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Layout */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-zinc-100 dark:bg-zinc-800">
          <TabsTrigger value="products" count={products.length}>
            Products
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

        {/* ─── TAB 1: PRODUCTS ────────────────────────────────────────── */}
        <TabsContent value="products">
          <DataTable
            data={products}
            columns={productColumns}
            searchPlaceholder="Search products by SKU or Name..."
            searchKey="name"
            isLoading={isLoading}
            onRowClick={row => {
              setSelectedProduct(row);
              setSheetOpen(true);
            }}
          />
        </TabsContent>

        {/* ─── TAB 2: CATEGORIES ──────────────────────────────────────── */}
        <TabsContent value="categories">
          <DataTable
            data={categories}
            columns={[
              { header: 'ID', accessorKey: 'id', sortable: true },
              { header: 'Category Name', accessorKey: 'name', sortable: true, className: 'font-semibold' },
            ]}
            searchPlaceholder="Search categories..."
            isLoading={isLoading}
          />
        </TabsContent>

        {/* ─── TAB 3: UOMs ────────────────────────────────────────────── */}
        <TabsContent value="uoms">
          <DataTable
            data={uoms}
            columns={[
              { header: 'ID', accessorKey: 'id', sortable: true },
              { header: 'Unit Name', accessorKey: 'name', sortable: true, className: 'font-semibold' },
              {
                header: 'Symbol / Abbreviation',
                accessorKey: 'symbol',
                cell: r => <Badge variant="secondary">{r.symbol || '-'}</Badge>,
              },
            ]}
            searchPlaceholder="Search units..."
            isLoading={isLoading}
          />
        </TabsContent>

        {/* ─── TAB 4: SUPPLIERS ───────────────────────────────────────── */}
        <TabsContent value="suppliers">
          <DataTable
            data={suppliers}
            columns={[
              { header: 'ID', accessorKey: 'id', sortable: true },
              { header: 'Supplier Name', accessorKey: 'name', sortable: true, className: 'font-semibold' },
              { header: 'Phone Number', accessorKey: 'phoneNumber' },
              { header: 'Township / Location', cell: r => `${r.township || ''} ${r.location || ''}`.trim() || '-' },
            ]}
            searchPlaceholder="Search suppliers..."
            isLoading={isLoading}
          />
        </TabsContent>

        {/* ─── TAB 5: CUSTOMERS ───────────────────────────────────────── */}
        <TabsContent value="customers">
          <DataTable
            data={customers}
            columns={[
              { header: 'ID', accessorKey: 'id', sortable: true },
              { header: 'Customer Name', accessorKey: 'name', sortable: true, className: 'font-semibold' },
              { header: 'Phone Number', accessorKey: 'phoneNumber' },
              { header: 'Address', accessorKey: 'address' },
              { header: 'Location', accessorKey: 'location' },
            ]}
            searchPlaceholder="Search customers..."
            isLoading={isLoading}
          />
        </TabsContent>

        {/* ─── TAB 6: WAREHOUSES ──────────────────────────────────────── */}
        <TabsContent value="warehouses">
          <DataTable
            data={warehouses}
            columns={[
              { header: 'ID', accessorKey: 'id', sortable: true },
              { header: 'Warehouse Name', accessorKey: 'name', sortable: true, className: 'font-semibold' },
              { header: 'Branch', cell: r => r.branch?.name || `Branch #${r.branchId}` },
              { header: 'Location', accessorKey: 'location' },
            ]}
            searchPlaceholder="Search warehouses..."
            isLoading={isLoading}
          />
        </TabsContent>

        {/* ─── TAB 7: BRANCHES ────────────────────────────────────────── */}
        <TabsContent value="branches">
          <DataTable
            data={branches}
            columns={[
              { header: 'Code', accessorKey: 'code', sortable: true, className: 'font-mono font-bold' },
              { header: 'Branch Name', accessorKey: 'name', sortable: true, className: 'font-semibold' },
              { header: 'Location', accessorKey: 'location' },
            ]}
            searchPlaceholder="Search branches..."
            isLoading={isLoading}
          />
        </TabsContent>

        {/* ─── TAB 8: SALE TEAMS ──────────────────────────────────────── */}
        <TabsContent value="teams">
          <DataTable
            data={saleTeams}
            columns={[
              { header: 'ID', accessorKey: 'id', sortable: true },
              { header: 'Team Name', accessorKey: 'name', sortable: true, className: 'font-semibold' },
              { header: 'Branch ID', accessorKey: 'branchId' },
            ]}
            searchPlaceholder="Search sale teams..."
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>

      {/* ─── MODAL: NEW PRODUCT ─────────────────────────────────────── */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen} title="Add New Product" maxWidth="lg">
        <form onSubmit={handleCreateProduct} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Product Name *"
              placeholder="e.g. Premium Wheat Flour"
              value={productForm.name}
              onChange={e => setProductForm({ ...productForm, name: e.target.value })}
              required
            />
            <Input
              label="SKU Code *"
              placeholder="e.g. RM-FLOUR-01"
              value={productForm.sku}
              onChange={e => setProductForm({ ...productForm, sku: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
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
              label="Base UOM *"
              value={productForm.baseUomId}
              onChange={e => setProductForm({ ...productForm, baseUomId: e.target.value })}
              required
            >
              <option value="">Select Base Unit...</option>
              {uoms.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.symbol})
                </option>
              ))}
            </Select>
          </div>

          <Select
            label="Product Type *"
            value={productForm.productType}
            onChange={e => setProductForm({ ...productForm, productType: e.target.value as ProductType })}
            required
          >
            <option value="RAW_MATERIAL">Raw Material (Consumed in Production)</option>
            <option value="FINISHED_GOOD">Finished Good (Manufactured / Sold)</option>
            <option value="PACKAGING">Packaging Material</option>
            <option value="SERVICE">Service</option>
          </Select>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setProductDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Product
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── MODAL: NEW CATEGORY ────────────────────────────────────── */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen} title="Add Product Category">
        <form onSubmit={handleCreateCategory} className="space-y-4">
          <Input
            label="Category Name *"
            placeholder="e.g. Raw Materials"
            value={categoryForm.name}
            onChange={e => setCategoryForm({ name: e.target.value })}
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setCategoryDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Category
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── MODAL: NEW UOM ─────────────────────────────────────────── */}
      <Dialog open={uomDialogOpen} onOpenChange={setUomDialogOpen} title="Add Unit of Measurement">
        <form onSubmit={handleCreateUom} className="space-y-4">
          <Input
            label="Unit Name *"
            placeholder="e.g. Kilogram"
            value={uomForm.name}
            onChange={e => setUomForm({ ...uomForm, name: e.target.value })}
            required
          />
          <Input
            label="Symbol *"
            placeholder="e.g. kg"
            value={uomForm.symbol}
            onChange={e => setUomForm({ ...uomForm, symbol: e.target.value })}
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setUomDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Unit
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── MODAL: NEW SUPPLIER ────────────────────────────────────── */}
      <Dialog open={supplierDialogOpen} onOpenChange={setSupplierDialogOpen} title="Add Supplier">
        <form onSubmit={handleCreateSupplier} className="space-y-4">
          <Input
            label="Supplier Name *"
            placeholder="e.g. Golden Grain Suppliers"
            value={supplierForm.name}
            onChange={e => setSupplierForm({ ...supplierForm, name: e.target.value })}
            required
          />
          <Input
            label="Phone Number"
            placeholder="e.g. 09-12345678"
            value={supplierForm.phoneNumber}
            onChange={e => setSupplierForm({ ...supplierForm, phoneNumber: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Township"
              placeholder="e.g. Chanayethazan"
              value={supplierForm.township}
              onChange={e => setSupplierForm({ ...supplierForm, township: e.target.value })}
            />
            <Input
              label="Location / City"
              placeholder="e.g. Mandalay"
              value={supplierForm.location}
              onChange={e => setSupplierForm({ ...supplierForm, location: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setSupplierDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Supplier
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── MODAL: NEW CUSTOMER ────────────────────────────────────── */}
      <Dialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen} title="Add Customer">
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <Input
            label="Customer Name *"
            placeholder="e.g. Shwe Store"
            value={customerForm.name}
            onChange={e => setCustomerForm({ ...customerForm, name: e.target.value })}
            required
          />
          <Input
            label="Phone Number"
            placeholder="e.g. 09-98765432"
            value={customerForm.phoneNumber}
            onChange={e => setCustomerForm({ ...customerForm, phoneNumber: e.target.value })}
          />
          <Input
            label="Address"
            placeholder="e.g. 78th Street, Between 30x31"
            value={customerForm.address}
            onChange={e => setCustomerForm({ ...customerForm, address: e.target.value })}
          />
          <Input
            label="Location / City"
            placeholder="e.g. Mandalay"
            value={customerForm.location}
            onChange={e => setCustomerForm({ ...customerForm, location: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setCustomerDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Customer
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── MODAL: NEW WAREHOUSE ───────────────────────────────────── */}
      <Dialog open={warehouseDialogOpen} onOpenChange={setWarehouseDialogOpen} title="Add Warehouse">
        <form onSubmit={handleCreateWarehouse} className="space-y-4">
          <Input
            label="Warehouse Name *"
            placeholder="e.g. Raw Material Storage WH"
            value={warehouseForm.name}
            onChange={e => setWarehouseForm({ ...warehouseForm, name: e.target.value })}
            required
          />
          <Select
            label="Assigned Branch *"
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
            placeholder="e.g. Industrial Zone 1"
            value={warehouseForm.location}
            onChange={e => setWarehouseForm({ ...warehouseForm, location: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setWarehouseDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Warehouse
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── MODAL: NEW BRANCH ──────────────────────────────────────── */}
      <Dialog open={branchDialogOpen} onOpenChange={setBranchDialogOpen} title="Add Branch Location">
        <form onSubmit={handleCreateBranch} className="space-y-4">
          <Input
            label="Branch Name *"
            placeholder="e.g. Yangon Branch"
            value={branchForm.name}
            onChange={e => setBranchForm({ ...branchForm, name: e.target.value })}
            required
          />
          <Input
            label="Branch Code *"
            placeholder="e.g. YGN"
            value={branchForm.code}
            onChange={e => setBranchForm({ ...branchForm, code: e.target.value })}
            required
          />
          <Input
            label="Location / Region"
            placeholder="e.g. Hlaing Township, Yangon"
            value={branchForm.location}
            onChange={e => setBranchForm({ ...branchForm, location: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setBranchDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Branch
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── MODAL: NEW SALE TEAM ───────────────────────────────────── */}
      <Dialog open={saleTeamDialogOpen} onOpenChange={setSaleTeamDialogOpen} title="Add Sale Team">
        <form onSubmit={handleCreateSaleTeam} className="space-y-4">
          <Input
            label="Team Name *"
            placeholder="e.g. Alpha Route Team"
            value={saleTeamForm.name}
            onChange={e => setSaleTeamForm({ ...saleTeamForm, name: e.target.value })}
            required
          />
          <Select
            label="Branch"
            value={saleTeamForm.branchId}
            onChange={e => setSaleTeamForm({ ...saleTeamForm, branchId: e.target.value })}
          >
            <option value="">Select Branch (Optional)...</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setSaleTeamDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Team
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── CONTEXTUAL SHEET: PRODUCT DETAIL ───────────────────────── */}
      <Sheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={selectedProduct?.name || 'Product Specification'}
        description={`SKU: ${selectedProduct?.sku || ''}`}
      >
        {selectedProduct && (
          <div className="space-y-6 text-xs">
            {/* Overview Attributes */}
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">Product Type</p>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
                  {selectedProduct.productType.replace('_', ' ')}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">Category</p>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
                  {selectedProduct.category?.name || '-'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">Base Unit</p>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
                  {selectedProduct.baseUom?.name} ({selectedProduct.baseUom?.symbol})
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400">System Product ID</p>
                <p className="font-mono text-zinc-700 dark:text-zinc-300 mt-0.5">#{selectedProduct.id}</p>
              </div>
            </div>

            {/* Product UOM conversion matrix */}
            <div className="space-y-2">
              <h4 className="font-bold text-zinc-800 dark:text-zinc-200 text-xs uppercase tracking-wider">
                Unit Conversion Factors
              </h4>
              {selectedProduct.productUoms && selectedProduct.productUoms.length > 0 ? (
                <div className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  {selectedProduct.productUoms.map(pu => (
                    <div key={pu.id} className="flex items-center justify-between p-3">
                      <span>
                        1 {pu.uom?.name || 'Unit'} = {pu.conversionFactor} {selectedProduct.baseUom?.symbol}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-500 italic">No secondary unit conversions configured.</p>
              )}
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
