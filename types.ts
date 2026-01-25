
export type UserRole = 'admin' | 'employee';

export interface User {
  id: string;
  username: string;
  password?: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  enabled: boolean;
  email?: string;
  phone?: string;
}

export interface CompanyConfig {
  name: string;
  address: string;
  gstin: string;
  phone: string;
  email: string;
  tagline: string;
  stateCode: string;
  sharedDriveId?: string;
  invoiceSequence: number; // New field for incremental serials
}

export interface SupplierMapping {
  id: string;
  supplierSku: string;
  supplierName: string;
  tevoltaSku: string;
  tevoltaName: string;
}

export interface WattMapping {
  id: string;
  tevoltaSku: string;
  watts: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  costPrice: number; 
  stock: number;
  description: string;
  gstRate: number;
  hsnCode?: string;
  watts?: string;
}

export interface OrderItem {
  id: string; // Mandatory unique ID for line items
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  costPrice: number; 
  gstRate: number;
  taxAmount: number;
  hsnCode?: string;
}

export type OrderStatus = 'Pending' | 'Completed' | 'Cancelled' | 'Shipped';

export interface Order {
  id: string;
  serialNumber: string; // Persistent human-readable serial
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerGstin?: string;
  date: string;
  items: OrderItem[];
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  totalAmount: number;
  status: OrderStatus;
  notes: string;
}

export interface PurchaseOrderItem {
  id: string; // Mandatory ID for precise tracking
  supplierSku: string;
  tevoltaSku: string;
  name: string;
  quantity: number;
  costPerUnit: number;
  watts: string;
  totalForeign: number;
}

export type NatureOfPurchase = 'Stock' | 'Other';

export interface PurchaseOrder {
  id: string;
  supplierName: string;
  country: string;
  natureOfPurchase: NatureOfPurchase;
  invoiceRef: string;
  date: string;
  items: PurchaseOrderItem[];
  currency: 'USD' | 'CNY' | 'INR';
  exchangeRate: number;
  extraFee: number;
  extraFeeRemarks: string;
  depositAmount: number;
  remainingBalance: number;
  totalForeignAmount: number;
  investmentInr: number;
  totalQuantity: number;
  status: 'Draft' | 'Logged' | 'Confirmed'; 
}

export enum ViewType {
  DASHBOARD = 'dashboard',
  ORDERS = 'orders',
  GST = 'gst',
  INVENTORY = 'inventory',
  SUPPLIER = 'supplier',
  USER_MANAGEMENT = 'users',
  SETTINGS = 'settings',
  INVOICE = 'invoice'
}