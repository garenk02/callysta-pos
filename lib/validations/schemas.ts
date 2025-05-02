import * as z from 'zod';

/**
 * Enhanced validation schemas with detailed error messages
 */

// Product validation schema
export const productSchema = z.object({
  name: z.string()
    .min(2, { message: "Product name must be at least 2 characters." })
    .max(100, { message: "Product name cannot exceed 100 characters." })
    .trim(),
  description: z.string()
    .max(500, { message: "Description cannot exceed 500 characters." })
    .optional()
    .transform(val => val === '' ? undefined : val),
  price: z.coerce.number()
    .min(0.01, { message: "Price must be greater than 0." })
    .max(1000000000, { message: "Price is too high." }),
  sku: z.string()
    .max(50, { message: "SKU cannot exceed 50 characters." })
    .optional()
    .transform(val => val === '' ? undefined : val),
  category: z.string()
    .max(50, { message: "Category cannot exceed 50 characters." })
    .optional()
    .transform(val => val === '' ? undefined : val),
  image_url: z.string()
    .url({ message: "Please enter a valid URL for the image." })
    .optional()
    .transform(val => val === '' ? undefined : val),
  stock_quantity: z.coerce.number()
    .int({ message: "Stock quantity must be a whole number." })
    .min(0, { message: "Stock quantity cannot be negative." })
    .max(1000000, { message: "Stock quantity is too high." }),
  low_stock_threshold: z.coerce.number()
    .int({ message: "Low stock threshold must be a whole number." })
    .min(1, { message: "Low stock threshold must be at least 1." })
    .max(1000000, { message: "Low stock threshold is too high." })
    .optional()
    .transform(val => isNaN(val) ? undefined : val),
  is_active: z.boolean().default(true),
});

// Stock adjustment validation schema
export const stockAdjustmentSchema = z.object({
  adjustmentType: z.enum(['add', 'subtract', 'set'], {
    required_error: "Please select an adjustment type.",
    invalid_type_error: "Please select a valid adjustment type.",
  }),
  quantity: z.coerce.number()
    .int({ message: "Quantity must be a whole number." })
    .min(1, { message: "Quantity must be at least 1." })
    .max(1000000, { message: "Quantity is too high." }),
  reason: z.string()
    .min(3, { message: "Please provide a reason for this adjustment (min 3 characters)." })
    .max(200, { message: "Reason cannot exceed 200 characters." })
    .trim(),
});

// User validation schema
export const userSchema = z.object({
  name: z.string()
    .min(2, { message: "Name must be at least 2 characters." })
    .max(100, { message: "Name cannot exceed 100 characters." })
    .trim(),
  email: z.string()
    .email({ message: "Please enter a valid email address." })
    .trim()
    .toLowerCase(),
  role: z.enum(["admin", "cashier"], {
    required_error: "Please select a role.",
    invalid_type_error: "Please select a valid role.",
  }),
  password: z.string()
    .min(6, { message: "Password must be at least 6 characters." })
    .max(100, { message: "Password cannot exceed 100 characters." })
    .optional()
    .transform(val => val === '' ? undefined : val),
  is_active: z.boolean().default(true),
});

// Login validation schema
export const loginSchema = z.object({
  email: z.string()
    .email({ message: "Please enter a valid email address." })
    .trim()
    .toLowerCase(),
  password: z.string()
    .min(1, { message: "Password is required." }),
});

// Signup validation schema
export const signupSchema = z.object({
  name: z.string()
    .min(2, { message: "Name must be at least 2 characters." })
    .max(100, { message: "Name cannot exceed 100 characters." })
    .trim(),
  email: z.string()
    .email({ message: "Please enter a valid email address." })
    .trim()
    .toLowerCase(),
  password: z.string()
    .min(6, { message: "Password must be at least 6 characters." })
    .max(100, { message: "Password cannot exceed 100 characters." }),
  confirmPassword: z.string()
    .min(6, { message: "Please confirm your password." }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

// Settings validation schema
export const settingsSchema = z.object({
  app_name: z.string()
    .min(1, { message: "App name is required." })
    .max(100, { message: "App name cannot exceed 100 characters." })
    .trim(),
  app_address: z.string()
    .max(200, { message: "Address cannot exceed 200 characters." })
    .optional()
    .transform(val => val === '' ? undefined : val),
  app_phone: z.string()
    .max(20, { message: "Phone number cannot exceed 20 characters." })
    .optional()
    .transform(val => val === '' ? undefined : val),
  app_email: z.string()
    .email({ message: "Please enter a valid email address." })
    .optional()
    .transform(val => val === '' ? undefined : val),
});

// Payment validation schema
export const paymentSchema = z.object({
  paymentMethod: z.enum(['cash', 'bank_transfer'], {
    required_error: "Please select a payment method.",
    invalid_type_error: "Please select a valid payment method.",
  }),
  amountTendered: z.coerce.number()
    .min(0, { message: "Amount tendered cannot be negative." })
    .optional(),
});
