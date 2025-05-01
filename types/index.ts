// types/index.ts
export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  sku?: string;
  image_url?: string;
  category?: string;
  created_at?: string;
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
