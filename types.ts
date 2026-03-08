
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
  invoiceSequence: number; 
  bankName?: string;
  bankIfsc?: string;
  bankAccountNo?: string;
  bankAccountHolder?: string;
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
  id: string; 
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
  serialNumber: string; 
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress?: string;
  customerGstin?: string;
  customerState?: string;
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
  id: string; 
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
  EXPENSES = 'expenses',
  AUDIT_LOG = 'audit_log',
  USER_MANAGEMENT = 'users',
  SETTINGS = 'settings',
  INVOICE = 'invoice'
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  amount: number;
  description: string;
  staffName: string;
}

export interface StockLog {
  id: string;
  productId: string;
  productName: string;
  change: number;
  type: 'Purchase' | 'Sale' | 'Manual Adjustment' | 'Rollback';
  timestamp: string;
  referenceId: string;
  staffName: string;
}

export interface MonthlySummary {
  month: string; // YYYY-MM
  totalSales: number;
  totalCost: number;
  totalExpenses: number;
  netProfit: number;
  topProduct: string;
  totalOrders: number;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  timestamp: string;
  isRead: boolean;
  actionView?: ViewType;
  staffName?: string;
}
