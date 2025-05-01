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
