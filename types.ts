

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
  fr: string;
  to: string;
  it: { nm: string; qt: number }[];
  st: string;
  cr: string;
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
  wh: string;
  status: 'Borrador' | 'Enviada' | 'Enviada por bodega' | 'En Revisión' | 'Aprobada' | 'Consolidada' | 'Parcial';
  createdAt: string;
  items: RequestItem[];
  token?: string; // Secure link token
  recipientEmail?: string; // Warehouse contact email
  origin?: 'Manual' | 'Excel' | 'Portal'; // Source of the request
  
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