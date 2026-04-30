// Fiscal Receipt Printing System - Type Definitions

export type PaymentMethod = 'cash' | 'pix' | 'credit' | 'debit';
export type PrintStatus = 'pending' | 'printed' | 'failed';
export type ConnectionType = 'usb' | 'network' | 'serial';

export interface TransactionItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface TaxBreakdown {
  icms: number;
  pis: number;
  cofins: number;
  total: number;
}

export interface Payment {
  method: PaymentMethod;
  amount: number;
  amountTendered?: number; // For cash payments
  change?: number; // For cash payments
}

export interface CustomerInfo {
  name: string;
  cpf?: string;
  email?: string;
  phone?: string;
}

export interface StoreInfo {
  name: string;
  cnpj: string;
  stateRegistration: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
}

export interface Transaction {
  id: string;
  timestamp: Date;
  cashierId: string;
  cashierName: string;
  items: TransactionItem[];
  subtotal: number;
  discount: number;
  tax: TaxBreakdown;
  total: number;
  payments: Payment[];
  customer?: CustomerInfo;
}

export interface Receipt {
  id: string;
  receiptNumber: number; // Sequential number
  transactionId: string;
  timestamp: Date;
  storeInfo: StoreInfo;
  cashierName: string;
  items: TransactionItem[];
  subtotal: number;
  discount: number;
  tax: TaxBreakdown;
  total: number;
  payments: Payment[];
  customer?: CustomerInfo;
  printStatus: PrintStatus;
  printAttempts: number;
}

export interface PrinterConfig {
  paperWidth: 80 | 58; // mm
  charactersPerLine: number; // 48 for 80mm, 32 for 58mm
  encoding: string; // 'utf8' | 'windows-1252'
  connection: {
    type: ConnectionType;
    usbVendorId?: number;
    usbProductId?: number;
    devicePath?: string;
    ipAddress?: string;
    port?: number;
  };
  headerText: string;
  footerText: string;
  printCustomerInfo: boolean;
  printTaxBreakdown: boolean;
  copies: number;
}

export interface PrintError {
  timestamp: Date;
  error: string;
}

export interface PrintResult {
  success: boolean;
  receiptId: string;
  error?: {
    code: string;
    message: string;
    recoverable: boolean;
  };
  timestamp: Date;
}

export interface PrinterStatus {
  connected: boolean;
  paperStatus: 'ok' | 'low' | 'out';
  error?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

export interface DeviceInfo {
  manufacturer: string;
  model: string;
  serialNumber: string;
}

export interface ConnectionConfig {
  type: ConnectionType;
  usbVendorId?: number; // 0x04b8 for Epson
  usbProductId?: number; // Specific to TM-T20X
  devicePath?: string; // For USB: /dev/usb/lp0 or COM port
  ipAddress?: string; // For network
  port?: number; // For network
}
