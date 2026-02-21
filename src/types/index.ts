

export interface InventoryItem {
  id: number | string;
  q: number;
  nm: string;
  sb: string;
  wh: string;
  wd: number;
  doh?: number;
  st?: string;
  cat?: string;
  unimed?: string;
}

export interface PriceItem {
  id: string;
  pr: number;
  dt: string;
  nm: string;
  sp: string;
  sb: string;
  da?: number;
  fr?: string;
}

export interface HistoryItem {
  po: string;
  dt: string;
  sp: string;
  pr: string;
  qt: number;
  up: number;
  wh: string;
  tt: number;
}

export interface SupplierItem {
  nm: string;
  ct: string;
  ph: string;
  em: string;
}

export interface OrderItem {
  sp: string;
  po: string;
  dl: string;
  pr: string;
  qo: number;
  tt: number;
  qr: number;
  pn: number;
  wh: string;
}

export interface TransferItem {
  id: string;
  companyId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  createdBy: string;
  createdAt: string;
  fr?: string; // deprecated legacy snapshot
  to?: string; // deprecated legacy snapshot
  it: { nm: string; qt: number }[];
  st: 'draft' | 'in_transit' | 'received' | 'preparing' | 'pending';
  cr?: string; // deprecated legacy field
  dp: string | null;
  rv: string | null;
  nt: string;
}

/* --- Purchase Request Types --- */

export interface DeliverySplit {
  id: string; // Unique ID for the split/delivery
  date: string;
  qty: number;
  // Purchasing fields per delivery
  supplier?: string;
  unitPrice?: number;
  externalPO?: string;
  emailSent?: string; // ISO timestamp of notification
}

export interface RequestItem {
  id: string; // generated
  code: string;
  desc: string;
  cat: string;
  sub: string;
  size: string;
  totalQty: number;
  splits: DeliverySplit[];
  // Legacy/Aggregate fields (optional or used for totals)
  totalPrice?: number;
}

export interface PurchaseRequest {
  id: string;
  companyId: string;
  warehouseId: string;
  wh?: string; // deprecated legacy snapshot
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'converted';
  createdAt: string;
  createdBy: string;
  version: number;
  items: RequestItem[];
  token?: string; // Secure link token
  recipientEmail?: string; // Warehouse contact email
  origin?: 'manual' | 'import' | 'ai'; // Source of the request
  
  // Aggregate fields
  totalValue?: number;
}

/* --- Master Data Types --- */

export interface MasterProduct {
  id: string; // E CODE
  nm: string; // PRODUCT NAME
  cat: string; // CATEGORY
  sb: string; // SUB CATEGORY
  size: string; // SIZE
  // We don't store price here, only product definition
}

export interface MasterPrice {
  productId: string; // E CODE link
  supplier: string; // PROV
  price: number;
  updatedAt: string;
}

/* --- Warehouse Master Types --- */

export type WarehouseType = 'flowers' | 'hardgoods' | 'bouquets' | 'shipping' | 'cafeteria' | 'mixed';

export interface Warehouse {
  id: string;
  name: string;
  state: string;
  stateCode: string;
  type: WarehouseType;
  status: 'active' | 'inactive';
}

/* --- Company Entity --- */

export interface Company {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

/* --- Canonical Product Model --- */

export type ProductStatus = 'active' | 'inactive' | 'discontinued';

export interface ProductIdentity {
  companyId: string;
  productId: string;
  sku: string;
}

export interface ProductClassification {
  categoryId?: string;
  subcategoryId?: string;
}

export interface ProductUom {
  uomId?: string;
  packSize?: string;
  unitPerCase?: number;
}

export interface ProductFlags {
  trackInventory: boolean;
  trackCost: boolean;
  isHardgoods: boolean;
  isBouquet: boolean;
  isFlower: boolean;
}

export interface ProductCore {
  name: string;
  description?: string;
  status: ProductStatus;
}

export interface Product extends ProductIdentity, ProductCore, ProductClassification, ProductUom {
  flags: ProductFlags;
  createdAt: string;
  updatedAt: string;
  source?: 'manual' | 'import' | 'erp';
  externalRefs?: Record<string, string>;
}

/* --- Movement Ledger Model --- */

export type MovementType = 'receipt' | 'issue' | 'adjustment' | 'transfer';

export type MovementSource = 'manual' | 'import' | 'erp' | 'migration';

export interface MovementIdentity {
  companyId: string;
  movementId: string;
}

export interface MovementRefs {
  warehouseId: string;
  warehouseIdTo?: string;
  productId?: string;
  sku: string;
  supplierId?: string;
  documentId?: string;
  externalRefs?: Record<string, string>;
}

export interface MovementQuantities {
  qty: number;
  uomId?: string;
  unitCost?: number;
  totalCost?: number;
}

export interface MovementAudit {
  occurredAt: string;
  createdAt: string;
  createdBy?: string;
  note?: string;
  source: MovementSource;
}

export interface MovementCore {
  type: MovementType;
}

export interface Movement extends MovementIdentity, MovementCore, MovementRefs, MovementQuantities, MovementAudit {
  purchaseOrderLineId?: string;
}

/* --- Canonical Purchase Order Model --- */

export type PurchaseOrderStatus = 'open' | 'partial' | 'closed' | 'cancelled';

export type PurchaseOrderLineStatus = 'open' | 'partial' | 'fulfilled';

export interface PurchaseOrder {
  id: string;
  companyId: string;
  orderNumber: string;
  supplierName: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  status: PurchaseOrderStatus;
  createdAt: string;
}

export interface PurchaseOrderLine {
  id: string;
  purchaseOrderId: string;
  sku: string;
  nameSnapshot: string;
  orderedQty: number;
  unitPriceOrdered: number;
  currency: string;
  status: PurchaseOrderLineStatus;
}

/* --- Canonical Supplier Model --- */

export type SupplierStatus = 'active' | 'inactive';

export interface Supplier {
  id: string;
  companyId: string;
  name: string;
  status: SupplierStatus;
  email?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
  source?: 'manual' | 'import' | 'erp';
  externalRefs?: Record<string, string>;
}

export interface SupplierPrice {
  id: string;
  companyId: string;
  supplierId: string;
  sku: string;
  unitPrice: number;
  currency: string;
  validFrom: string;
  validTo?: string;
  notes?: string;
  source?: 'manual' | 'import' | 'erp';
  externalRefs?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

/* --- Audit Log Model --- */

export type AuditEntityType =
  | 'purchase_request'
  | 'purchase_order'
  | 'transfer'
  | 'movement'
  | 'data_import';

export type AuditAction =
  | 'created'
  | 'updated'
  | 'status_changed'
  | 'converted'
  | 'import_applied';

export interface AuditLog {
  id: string;
  companyId: string;
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  fromValue?: string;
  toValue?: string;
  performedByUserId: string;
  performedAt: string;
  metadata?: Record<string, unknown>;
}
