// types/index.ts
export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  sku?: string;
  image_url?: string;
  category?: string;
  stock_quantity: number;
  low_stock_threshold?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryLog {
  id: string;
  product_id: string;
  quantity_change: number;
  previous_quantity: number;
  new_quantity: number;
  reason: string;
  created_by: string;
  created_at: string;
}

export type UserRole = 'admin' | 'cashier';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  avatar_url?: string;
  created_at?: string;
  is_active?: boolean;
}

// Cart and Checkout Types
export interface CartItem {
  product: Product;
  quantity: number;
}

export type PaymentMethod = 'cash' | 'card' | 'mobile_payment' | 'gift_card' | 'bank_transfer';
export type CardType = 'visa' | 'mastercard' | 'amex' | 'discover' | 'other';

export interface PaymentDetails {
  amount_tendered?: number;
  change_due?: number;
  card_type?: CardType;
  card_last_four?: string;
  mobile_payment_provider?: string;
  gift_card_number?: string;
  gift_card_balance_remaining?: number;
  bank_name?: string;
  bank_account_number?: string;
  bank_reference?: string;
}

export interface Order {
  id: string;
  user_id: string;
  total: number;
  subtotal: number;
  tax: number;
  payment_method: PaymentMethod;
  payment_details?: PaymentDetails;
  created_at: string;
  updated_at?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_price: number;
  quantity: number;
  total: number;
}
