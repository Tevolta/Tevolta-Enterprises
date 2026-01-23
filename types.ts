
export type UserRole = 'admin' | 'employee';

export interface User {
  id: string;
  username: string;
  password?: string; // Stored locally for this desktop simulation
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
  stock: number;
  description: string;
  gstRate: number;
  hsnCode?: string;
  watts?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  gstRate: number;
  taxAmount: number;
  hsnCode?: string;
}

export type OrderStatus = 'Pending' | 'Completed' | 'Cancelled' | 'Shipped';

export interface Order {
  id: string;
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

export interface PurchaseOrder {
  id: string;
  supplierName: string;
  date: string;
  items: {
    sku?: string;
    name: string;
    quantity: number;
    costPerUnit: number;
    currency: 'USD' | 'CNY' | 'INR';
    watts?: string;
    isMapped?: boolean;
  }[];
  exchangeRate: number;
  totalForeignAmount: number;
  totalInrAmount: number;
  totalQuantity: number;
  invoiceUrl?: string;
  status: 'Draft' | 'Confirmed';
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
