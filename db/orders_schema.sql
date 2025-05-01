-- Create orders table if it doesn't exist
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  payment_method TEXT NOT NULL,
  payment_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders(user_id);

-- Create index on created_at for faster date-based queries
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at);

-- Create order_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  product_price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on order_id for faster lookups
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items(order_id);

-- Create index on product_id for faster lookups
CREATE INDEX IF NOT EXISTS order_items_product_id_idx ON order_items(product_id);

-- Enable Row Level Security on orders table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policy that allows authenticated users to read orders
CREATE POLICY "Authenticated users can read orders"
ON orders
FOR SELECT
USING (auth.role() = 'authenticated');

-- Create policy that allows authenticated users to insert orders
CREATE POLICY "Authenticated users can insert orders"
ON orders
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Enable Row Level Security on order_items table
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Create policy that allows authenticated users to read order items
CREATE POLICY "Authenticated users can read order items"
ON order_items
FOR SELECT
USING (auth.role() = 'authenticated');

-- Create policy that allows authenticated users to insert order items
CREATE POLICY "Authenticated users can insert order items"
ON order_items
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Create function to update order's updated_at timestamp when modified
CREATE OR REPLACE FUNCTION update_order_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function when an order is updated
CREATE TRIGGER update_order_timestamp
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_order_updated_at();

-- Create function to process a sale with inventory updates
CREATE OR REPLACE FUNCTION process_sale(
  p_user_id UUID,
  p_subtotal DECIMAL,
  p_tax DECIMAL,
  p_total DECIMAL,
  p_payment_method TEXT,
  p_payment_details JSONB,
  p_items JSONB
)
RETURNS UUID AS $$
DECLARE
  v_order_id UUID;
  v_item JSONB;
  v_product_id UUID;
  v_product_name TEXT;
  v_product_price DECIMAL;
  v_quantity INTEGER;
  v_item_total DECIMAL;
  v_current_stock INTEGER;
BEGIN
  -- Start a transaction
  BEGIN
    -- Create the order
    INSERT INTO orders (
      user_id,
      subtotal,
      tax,
      total,
      payment_method,
      payment_details,
      created_at,
      updated_at
    ) VALUES (
      p_user_id,
      p_subtotal,
      p_tax,
      p_total,
      p_payment_method,
      p_payment_details,
      NOW(),
      NOW()
    ) RETURNING id INTO v_order_id;
    
    -- Process each item in the order
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
      v_product_id := (v_item->>'product_id')::UUID;
      v_product_name := v_item->>'product_name';
      v_product_price := (v_item->>'product_price')::DECIMAL;
      v_quantity := (v_item->>'quantity')::INTEGER;
      v_item_total := (v_item->>'total')::DECIMAL;
      
      -- Check current stock
      SELECT stock_quantity INTO v_current_stock
      FROM products
      WHERE id = v_product_id
      FOR UPDATE; -- Lock the row for update
      
      -- Validate stock
      IF v_current_stock < v_quantity THEN
        RAISE EXCEPTION 'Insufficient stock for product %', v_product_name;
      END IF;
      
      -- Create order item
      INSERT INTO order_items (
        order_id,
        product_id,
        product_name,
        product_price,
        quantity,
        total,
        created_at
      ) VALUES (
        v_order_id,
        v_product_id,
        v_product_name,
        v_product_price,
        v_quantity,
        v_item_total,
        NOW()
      );
      
      -- Update product stock
      UPDATE products
      SET 
        stock_quantity = stock_quantity - v_quantity,
        updated_at = NOW()
      WHERE id = v_product_id;
      
      -- Note: The inventory_logs entry will be created automatically by the trigger
    END LOOP;
    
    -- Commit the transaction
    RETURN v_order_id;
  EXCEPTION WHEN OTHERS THEN
    -- Rollback the transaction on error
    RAISE;
  END;
END;
$$ LANGUAGE plpgsql;
