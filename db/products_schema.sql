-- Create products table if it doesn't exist
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  sku TEXT,
  image_url TEXT,
  category TEXT,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on SKU for faster lookups
CREATE INDEX IF NOT EXISTS products_sku_idx ON products(sku);

-- Create index on category for faster filtering
CREATE INDEX IF NOT EXISTS products_category_idx ON products(category);

-- Create inventory_logs table to track inventory changes
CREATE TABLE IF NOT EXISTS inventory_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity_change INTEGER NOT NULL,
  previous_quantity INTEGER NOT NULL,
  new_quantity INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on product_id for faster lookups
CREATE INDEX IF NOT EXISTS inventory_logs_product_id_idx ON inventory_logs(product_id);

-- Create index on created_by for faster lookups
CREATE INDEX IF NOT EXISTS inventory_logs_created_by_idx ON inventory_logs(created_by);

-- Enable Row Level Security on products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policy that allows all authenticated users to read products
CREATE POLICY "All users can read products"
ON products
FOR SELECT
USING (auth.role() = 'authenticated');

-- Create policy that allows only admins to insert, update, and delete products
CREATE POLICY "Only admins can insert products"
ON products
FOR INSERT
WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Only admins can update products"
ON products
FOR UPDATE
USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Only admins can delete products"
ON products
FOR DELETE
USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Enable Row Level Security on inventory_logs table
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;

-- Create policy that allows all authenticated users to read inventory logs
CREATE POLICY "All users can read inventory logs"
ON inventory_logs
FOR SELECT
USING (auth.role() = 'authenticated');

-- Create policy that allows only admins to insert inventory logs
CREATE POLICY "Only admins can insert inventory logs"
ON inventory_logs
FOR INSERT
WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Create function to update product's updated_at timestamp when modified
CREATE OR REPLACE FUNCTION update_product_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function when a product is updated
CREATE TRIGGER update_product_timestamp
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_product_updated_at();

-- Create function to handle inventory adjustments
CREATE OR REPLACE FUNCTION adjust_inventory()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a record into inventory_logs
  INSERT INTO inventory_logs (
    product_id,
    quantity_change,
    previous_quantity,
    new_quantity,
    reason,
    created_by
  ) VALUES (
    NEW.id,
    NEW.stock_quantity - COALESCE(OLD.stock_quantity, 0),
    COALESCE(OLD.stock_quantity, 0),
    NEW.stock_quantity,
    'Product update',
    auth.uid()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function when a product's stock_quantity is updated
CREATE TRIGGER log_inventory_changes
AFTER INSERT OR UPDATE OF stock_quantity ON products
FOR EACH ROW
WHEN (NEW.stock_quantity IS DISTINCT FROM OLD.stock_quantity)
EXECUTE FUNCTION adjust_inventory();
