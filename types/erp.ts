// Comprehensive ERP Types matching Server Models & API Contracts

export type ApiResponse<T = any> = {
  success: boolean;
  message?: string;
  data?: T;
};

// ─── AUTH & TENANT & RBAC ───────────────────────────────────────
export type Permission = {
  id: number;
  code: string;
  module: string;
  name: string;
  description?: string;
};

export type Role = {
  id: number;
  tenantId: number;
  name: string;
  description?: string;
  isSystem: boolean;
  userCount?: number;
  permissionCount?: number;
  permissions?: Permission[];
  createdAt?: string;
  updatedAt?: string;
};

export type RolePermission = {
  id: number;
  tenantId: number;
  roleId: number;
  permissionId: number;
  permission?: Permission;
  role?: Role;
};

export type UserRole = {
  id: number;
  name: string;
};

export type UserProfile = {
  id: number;
  name: string;
  email: string;
  phoneNumber?: string;
  address?: string;
  roleId?: number;
  roleName?: string;
  role?: Role;
  permissions?: string[];
  tenantId: number;
  branchId?: number;
  branch?: Branch;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type UserDetail = UserProfile & {
  teams?: Array<{
    id: number;
    saleTeamId: number;
    role: 'LEADER' | 'MEMBER';
    isActive: boolean;
    joinedDate: string;
    saleTeam?: { id: number; name: string };
  }>;
};

export type LoginResponseData = {
  accessToken: string;
  user: UserProfile;
};

export type OrganizationContext = {
  tenantId: number;
  tenantName: string;
  branchId?: number;
  branchName?: string;
  warehouseId?: number;
  warehouseName?: string;
};

// ─── MASTER DATA ─────────────────────────────────────────────────
export type Supplier = {
  id: number;
  tenantId: number;
  name: string;
  phoneNumber?: string;
  location?: string;
  township?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Customer = {
  id: number;
  tenantId: number;
  name: string;
  address?: string;
  phoneNumber?: string;
  location?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ProductCategory = {
  id: number;
  tenantId: number;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type UOM = {
  id: number;
  tenantId: number;
  name: string;
  symbol?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ProductType = 'RAW_MATERIAL' | 'FINISHED_GOOD' | 'PACKAGING' | 'SERVICE';

export type ProductUOM = {
  id: number;
  productId: number;
  uomId: number;
  conversionFactor: number;
  uom?: UOM;
};

export type Product = {
  id: number;
  tenantId: number;
  categoryId: number;
  name: string;
  sku: string;
  baseUomId: number;
  productType: ProductType;
  category?: ProductCategory;
  baseUom?: UOM;
  productUoms?: ProductUOM[];
  createdAt?: string;
  updatedAt?: string;
};

export type Branch = {
  id: number;
  tenantId: number;
  name: string;
  code: string;
  location?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Warehouse = {
  id: number;
  tenantId: number;
  branchId: number;
  name: string;
  location?: string;
  branch?: Branch;
  createdAt?: string;
  updatedAt?: string;
};

export type SaleTeam = {
  id: number;
  tenantId: number;
  branchId?: number;
  name: string;
  branch?: Branch;
  members?: SaleTeamMember[];
  createdAt?: string;
  updatedAt?: string;
};

export type SaleTeamMemberRole = 'LEADER' | 'MEMBER';

export type SaleTeamMember = {
  id: number;
  tenantId: number;
  saleTeamId: number;
  userId: number;
  role: SaleTeamMemberRole;
  isActive: boolean;
  joinedDate: string;
  user?: UserProfile;
  saleTeam?: SaleTeam;
  createdAt?: string;
  updatedAt?: string;
};

export type SaleTeamPerformanceSummary = {
  activeMembers: number;
  totalAssignedOrders: number;
  fullyShippedOrders: number;
  cancelledOrders: number;
  totalShipments: number;
  postedShipments: number;
  fulfillmentRate: number;
};

export type SaleTeamPerformance = {
  team: { id: number; name: string };
  summary: SaleTeamPerformanceSummary;
};

export type TeamPerformanceOverview = {
  teamId: number;
  teamName: string;
  activeMembers: number;
  totalAssignedOrders: number;
  fullyShippedOrders: number;
  totalShipments: number;
  fulfillmentRate: number;
};

// ─── PURCHASING ──────────────────────────────────────────────────
export type PurchaseOrderStatus = 'DRAFT' | 'CONFIRMED' | 'PARTIALLY_RECEIVED' | 'FULLY_RECEIVED' | 'CANCELLED';

export type PurchaseOrderItem = {
  id?: number;
  tenantId?: number;
  purchaseOrderId?: number;
  productId: number;
  uomId: number;
  isFoc?: boolean;
  qty: number;
  rate: number;
  amount: number;
  product?: Product;
  uom?: UOM;
};

export type PurchaseOrder = {
  id: number;
  tenantId: number;
  branchId: number;
  supplierId: number;
  poNo: string;
  orderDate: string;
  deliveryDate?: string;
  status: PurchaseOrderStatus;
  supplier?: Supplier;
  branch?: Branch;
  items?: PurchaseOrderItem[];
  receipts?: PurchaseReceipt[];
  createdAt?: string;
  updatedAt?: string;
};

export type PurchaseReceiptStatus = 'DRAFT' | 'POSTED' | 'CANCELLED';

export type PurchaseReceiptItem = {
  id?: number;
  tenantId?: number;
  receiptId?: number;
  purchaseOrderItemId: number;
  productId: number;
  uomId: number;
  isFoc?: boolean;
  qty: number;
  rate: number;
  amount: number;
  product?: Product;
  uom?: UOM;
};

export type PurchaseReceipt = {
  id: number;
  tenantId: number;
  branchId: number;
  purchaseOrderId: number;
  warehouseId: number;
  receiptNo: string;
  receivedDate: string;
  status: PurchaseReceiptStatus;
  purchaseOrder?: PurchaseOrder;
  warehouse?: Warehouse;
  items?: PurchaseReceiptItem[];
  createdAt?: string;
  updatedAt?: string;
};

// ─── INVENTORY ───────────────────────────────────────────────────
export type InventoryStock = {
  id: number;
  tenantId: number;
  warehouseId: number;
  productId: number;
  onHandQty: number;
  warehouse?: Warehouse;
  product?: Product;
  updatedAt?: string;
};

export type MovementType =
  | 'PURCHASE_RECEIPT'
  | 'SALE_SHIPMENT'
  | 'PRODUCTION_CONSUMPTION'
  | 'PRODUCTION_OUTPUT'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'STOCK_ADJUSTMENT';

export type InventoryMovement = {
  id: number;
  tenantId: number;
  warehouseId: number;
  productId: number;
  uomId: number;
  movementType: MovementType;
  qty: number;
  unitCost: number;
  totalCost: number;
  referenceType?: string;
  referenceId?: number;
  movementDate: string;
  warehouse?: Warehouse;
  product?: Product;
  uom?: UOM;
  createdAt?: string;
};

export type WarehouseTransferItem = {
  id?: number;
  tenantId?: number;
  transferId?: number;
  productId: number;
  uomId: number;
  qty: number;
  product?: Product;
  uom?: UOM;
};

export type WarehouseTransfer = {
  id: number;
  tenantId: number;
  branchId: number;
  transferNo: string;
  fromWarehouseId: number;
  toWarehouseId: number;
  transferDate: string;
  status: 'DRAFT' | 'POSTED' | 'CANCELLED';
  fromWarehouse?: Warehouse;
  toWarehouse?: Warehouse;
  items?: WarehouseTransferItem[];
  createdAt?: string;
};

// ─── MANUFACTURING ───────────────────────────────────────────────
export type BOMIngredient = {
  id?: number;
  tenantId?: number;
  bomId?: number;
  productId: number;
  uomId: number;
  qty: number;
  product?: Product;
  uom?: UOM;
};

export type BOM = {
  id: number;
  tenantId: number;
  name: string;
  outputProductId: number;
  outputUomId: number;
  outputQty: number;
  // ကုန်ကြမ်းများ ပုံမှန်ထုတ်ယူမည့် ကုန်လှောင်ရုံ (optional — Production Complete တွင် auto pre-fill ဖြစ်မည်)
  defaultSourceWarehouseId?: number | null;
  defaultSourceWarehouse?: Warehouse | null;
  isActive?: boolean;
  outputProduct?: Product;
  outputUom?: UOM;
  ingredients?: BOMIngredient[];
  createdAt?: string;
  updatedAt?: string;
};

export type ProductionOrderStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';


export type ProductionOrderMaterial = {
  id?: number;
  productionOrderId?: number;
  productId: number;
  uomId: number;
  plannedQty: number;
  actualQty?: number;
  product?: Product;
  uom?: UOM;
};

export type ProductionOrderOutput = {
  id?: number;
  productionOrderId?: number;
  productId: number;
  uomId: number;
  qty: number;
  product?: Product;
  uom?: UOM;
};

export type ProductionOrder = {
  id: number;
  tenantId: number;
  branchId: number;
  productionNo: string;
  bomId: number;
  outputProductId: number;
  outputUomId: number;
  plannedQty: number;
  outputWarehouseId: number;
  productionDate: string;
  status: ProductionOrderStatus;
  outputProduct?: Product;
  outputUom?: UOM;
  bom?: BOM;
  outputWarehouse?: Warehouse;
  materials?: ProductionOrderMaterial[];
  outputs?: ProductionOrderOutput[];
  createdAt?: string;
};

// ─── SALES ───────────────────────────────────────────────────────
export type SalesOrderStatus = 'DRAFT' | 'CONFIRMED' | 'PARTIALLY_SHIPPED' | 'FULLY_SHIPPED' | 'CANCELLED';

export type SalesOrderItem = {
  id?: number;
  tenantId?: number;
  salesOrderId?: number;
  productId: number;
  uomId: number;
  isFoc?: boolean;
  qty: number;
  rate: number;
  amount: number;
  product?: Product;
  uom?: UOM;
};

export type SalesOrderAssignment = {
  id?: number;
  salesOrderId: number;
  salesTeamId: number;
  assignedDate: string;
  salesTeam?: SaleTeam;
};

export type SalesOrder = {
  id: number;
  tenantId: number;
  branchId: number;
  customerId: number;
  orderNo: string;
  orderDate: string;
  deliveryDate?: string;
  status: SalesOrderStatus;
  customer?: Customer;
  branch?: Branch;
  items?: SalesOrderItem[];
  assignments?: SalesOrderAssignment[];
  shipments?: SalesShipment[];
  createdAt?: string;
};

export type SalesShipmentStatus = 'DRAFT' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'POSTED' | 'CANCELLED';

export type SalesShipmentItem = {
  id?: number;
  shipmentId?: number;
  salesOrderItemId: number;
  productId: number;
  uomId: number;
  qty: number;
  product?: Product;
  uom?: UOM;
};

export type SalesShipment = {
  id: number;
  tenantId: number;
  branchId: number;
  salesOrderId: number;
  salesTeamId?: number;
  shipmentNo: string;
  shipmentDate: string;
  status: SalesShipmentStatus;
  salesOrder?: SalesOrder;
  salesTeam?: SaleTeam;
  items?: SalesShipmentItem[];
  createdAt?: string;
};

// ─── FINANCE & ACCOUNTING ─────────────────────────────────────────
export type PaymentType = 'CUSTOMER_PAYMENT' | 'SUPPLIER_PAYMENT' | 'EXPENSE_PAYMENT';
export type PaymentMethod = 'CASH' | 'BANK' | 'OTHER';

export type Payment = {
  id: number;
  tenantId: number;
  branchId: number;
  paymentNo: string;
  paymentType: PaymentType;
  customerId?: number;
  supplierId?: number;
  paymentDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceType?: string;
  referenceId?: number;
  description?: string;
  customer?: Customer;
  supplier?: Supplier;
  createdAt?: string;
};

export type DailyClosingStatus = 'OPEN' | 'CLOSED';

export type DailyClosing = {
  id: number;
  tenantId: number;
  branchId: number;
  cashierId: number;
  closingDate: string;
  openingCash: number;
  cashReceived?: number;
  cashPaid?: number;
  closingCash?: number;
  status: DailyClosingStatus;
  createdAt?: string;
};

export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

export type Account = {
  id: number;
  tenantId: number;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  parentAccountId?: number;
  isActive: boolean;
  createdAt?: string;
};

export type JournalEntryLine = {
  id?: number;
  journalEntryId?: number;
  accountId: number;
  debit: number;
  credit: number;
  account?: Account;
};

export type JournalEntry = {
  id: number;
  tenantId: number;
  branchId: number;
  entryNo: string;
  entryDate: string;
  description?: string;
  referenceType?: string;
  referenceId?: number;
  status: 'POSTED' | 'DRAFT';
  lines?: JournalEntryLine[];
  createdAt?: string;
};

// ─── ANALYTICAL REPORTS (Phase 2) ─────────────────────────────────
export type DashboardKpis = {
  totalStockQty: number;
  pendingSalesOrders: number;
  pendingPurchaseOrders: number;
  lowStockAlerts: number;
};

export type StockSummaryItem = {
  warehouseId: number;
  warehouseName: string;
  productId: number;
  productName: string;
  sku: string;
  productType: ProductType;
  onHandQty: number;
  uomName?: string;
};

export type StockSummaryReport = {
  totalValuation?: number;
  totalItems: number;
  lowStockCount: number;
  items: StockSummaryItem[];
};

export type TopCustomerSale = {
  customerId: number;
  customerName: string;
  orderCount: number;
  totalAmount: number;
};

export type DailySalesTrend = {
  date: string;
  orderCount: number;
  totalAmount: number;
};

export type SalesSummaryReport = {
  totalRevenue: number;
  totalOrders: number;
  shippedOrders: number;
  topCustomers: TopCustomerSale[];
  dailySales: DailySalesTrend[];
};

export type TopSupplierPurchase = {
  supplierId: number;
  supplierName: string;
  orderCount: number;
  totalAmount: number;
};

export type PurchaseSummaryReport = {
  totalSpend: number;
  totalOrders: number;
  receivedOrders: number;
  topSuppliers: TopSupplierPurchase[];
};

export type CashflowReport = {
  inflow: number;
  outflow: number;
  net: number;
  payments: Payment[];
};

export type AccountTrialBalance = {
  accountId: number;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  totalDebit: number;
  totalCredit: number;
  balance: number;
};

export type TrialBalanceReport = {
  accounts: AccountTrialBalance[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
};

export type TeamShipmentSummary = {
  teamId: number;
  teamName: string;
  shipmentCount: number;
  postedCount: number;
};

export type ShipmentSummaryReport = {
  totalShipments: number;
  postedShipments: number;
  teams: TeamShipmentSummary[];
};
