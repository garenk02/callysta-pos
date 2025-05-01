-- This script imports product data from the products.csv file
-- It assumes the products table has already been created with the schema defined in products_schema.sql

-- First, create a temporary table to hold the CSV data
CREATE TEMP TABLE temp_products (
  name TEXT,
  description TEXT,
  price DECIMAL(10, 2),
  sku TEXT,
  image_url TEXT,
  category TEXT,
  stock_quantity INTEGER,
  low_stock_threshold INTEGER
);

-- Import data from CSV
-- Note: In Supabase, you'll need to upload the CSV file and adjust the path accordingly
-- This is a placeholder for the actual import command
-- COPY temp_products FROM '/path/to/products.csv' DELIMITER ',' CSV HEADER;

-- Insert data from temporary table into the products table
INSERT INTO products (
  name,
  description,
  price,
  sku,
  image_url,
  category,
  stock_quantity,
  low_stock_threshold,
  created_at,
  updated_at
)
SELECT
  name,
  description,
  price,
  sku,
  image_url,
  category,
  stock_quantity,
  low_stock_threshold,
  NOW(),
  NOW()
FROM temp_products;

-- Drop the temporary table
DROP TABLE temp_products;

-- Verify the data was imported correctly
SELECT * FROM products;
