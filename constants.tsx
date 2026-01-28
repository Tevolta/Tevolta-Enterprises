
import React from 'react';
import { Product, User, CompanyConfig } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  { id: 'TEV-50-05102', name: 'VoltPrime LED flood light', category: 'LED', price: 1800, costPrice: 1260, stock: 50, gstRate: 18, hsnCode: '9405', description: 'Heavy duty 50W outdoor flood light', watts: '50W' },
  { id: 'TEV-50-05403', name: 'VoltPrime LED flood light', category: 'LED', price: 3200, costPrice: 2240, stock: 30, gstRate: 18, hsnCode: '9405', description: 'Powerful 100W outdoor flood light', watts: '100W' },
  { id: 'TEV-50-05405', name: 'VoltPrime LED flood light', category: 'LED', price: 5800, costPrice: 4060, stock: 15, gstRate: 18, hsnCode: '9405', description: 'Ultra bright 200W industrial flood light', watts: '200W' },
  { id: '1', name: 'Smart Inverter Fridge', category: 'Appliances', price: 45000, costPrice: 31500, stock: 15, gstRate: 18, hsnCode: '8418', description: 'Energy efficient 500L refrigerator' },
  { id: '2', name: 'LED Smart TV 55"', category: 'Electronics', price: 32000, costPrice: 22400, stock: 22, gstRate: 18, hsnCode: '8528', description: '4K Ultra HD smart television' },
  { id: '4', name: 'Copper Wire Bundle (90m)', category: 'Electrical', price: 1200, costPrice: 840, stock: 200, gstRate: 12, hsnCode: '8544', description: 'Standard 1.5sqmm copper electrical wire' },
];

export const INITIAL_USERS: User[] = [
  {
    id: 'admin-1',
    username: 'admin',
    password: 'admin123',
    firstName: 'Master',
    lastName: 'Admin',
    role: 'admin',
    enabled: true,
    email: 'billing@tevolta.in',
    phone: '+91 98765 43210'
  }
];

export const INITIAL_COMPANY_CONFIG: CompanyConfig = {
  name: "TEVOLTA ENTERPRISES",
  address: "3-288/2/A/1/1, Naya Nagar, Kodad, Telangana 508206, India",
  gstin: "36BAHPN9275Q1ZN",
  phone: "+91 98765 43210",
  email: "billing@tevolta.in",
  tagline: "Electricals & Home Needs",
  stateCode: "Telangana (36)",
  invoiceSequence: 1001,
  bankName: "State Bank of India",
  bankIfsc: "SBIN0000001",
  bankAccountNo: "329XXXXXX010",
  bankAccountHolder: "Tevolta Enterprises"
};

export const APP_THEME = {
  primary: 'blue-600', 
  secondary: 'slate-600',
  accent: 'indigo-500',
};
