-- Additional indexes for improved performance with large datasets

-- First, enable the pg_trgm extension for text search
-- This must be done before creating GIN indexes with gin_trgm_ops
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Products table indexes
-- Composite index for category and is_active (common filter combination)
CREATE INDEX IF NOT EXISTS products_category_is_active_idx ON products(category, is_active);

-- Improved search indexes using GIN for text search
CREATE INDEX IF NOT EXISTS products_name_search_idx ON products USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS products_sku_search_idx ON products USING gin(sku gin_trgm_ops);
CREATE INDEX IF NOT EXISTS products_description_search_idx ON products USING gin(description gin_trgm_ops);

-- Index for price range queries
CREATE INDEX IF NOT EXISTS products_price_idx ON products(price);

-- Index for stock quantity queries (for low stock reports)
CREATE INDEX IF NOT EXISTS products_stock_quantity_idx ON products(stock_quantity);

-- Orders table indexes
-- Composite index for date range queries with user filtering
CREATE INDEX IF NOT EXISTS orders_created_at_user_id_idx ON orders(created_at, user_id);

-- Index for payment method filtering
CREATE INDEX IF NOT EXISTS orders_payment_method_idx ON orders(payment_method);

-- Order items indexes
-- Composite index for product sales analysis
CREATE INDEX IF NOT EXISTS order_items_product_id_created_at_idx ON order_items(product_id, created_at);

-- Inventory logs indexes
-- Index for date range queries on inventory logs
CREATE INDEX IF NOT EXISTS inventory_logs_created_at_idx ON inventory_logs(created_at);

-- Composite index for product inventory history
CREATE INDEX IF NOT EXISTS inventory_logs_product_id_created_at_idx ON inventory_logs(product_id, created_at);

-- Users/profiles indexes
-- Index for user search by name
CREATE INDEX IF NOT EXISTS profiles_name_search_idx ON profiles USING gin(name gin_trgm_ops);

-- Index for role-based filtering
CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles(role);

-- Index for active/inactive filtering
CREATE INDEX IF NOT EXISTS profiles_is_active_idx ON profiles(is_active);
