// lib/supabase/client-orders.ts
import { Order, OrderItem, PaymentMethod, PaymentDetails, CartItem } from '@/types';
import { createClient } from './client';

interface CreateOrderParams {
  userId: string;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentDetails?: PaymentDetails;
  items: CartItem[];
}

interface CreateOrderResult {
  orderId: string | null;
  error: Error | null;
}

export async function createOrder({
  userId,
  subtotal,
  tax,
  total,
  paymentMethod,
  paymentDetails,
  items
}: CreateOrderParams): Promise<CreateOrderResult> {
  try {
    const supabase = createClient();

    // Format items for the stored procedure
    const formattedItems = items.map(item => ({
      product_id: item.product.id,
      product_name: item.product.name,
      product_price: item.product.price,
      quantity: item.quantity,
      total: item.product.price * item.quantity
    }));

    // Call the stored procedure to process the sale
    const { data, error } = await supabase.rpc('process_sale', {
      p_user_id: userId,
      p_subtotal: subtotal,
      p_tax: tax,
      p_total: total,
      p_payment_method: paymentMethod,
      p_payment_details: paymentDetails || {},
      p_items: formattedItems
    });

    if (error) {
      console.error('Error creating order:', error.message);
      return {
        orderId: null,
        error: new Error(error.message)
      };
    }

    return {
      orderId: data,
      error: null
    };
  } catch (err) {
    console.error('Unexpected error creating order:', err);
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred creating the order';
    return {
      orderId: null,
      error: new Error(errorMessage)
    };
  }
}

export async function getRecentOrders(limit = 10): Promise<{ orders: Order[] | null; error: Error | null }> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent orders:', error.message);
      return {
        orders: null,
        error: new Error(error.message)
      };
    }

    return {
      orders: data as Order[],
      error: null
    };
  } catch (err) {
    console.error('Unexpected error fetching recent orders:', err);
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred fetching orders';
    return {
      orders: null,
      error: new Error(errorMessage)
    };
  }
}

export async function getOrderDetails(orderId: string): Promise<{ 
  order: Order | null; 
  items: OrderItem[] | null; 
  error: Error | null 
}> {
  try {
    const supabase = createClient();

    // Get the order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError) {
      console.error('Error fetching order:', orderError.message);
      return {
        order: null,
        items: null,
        error: new Error(orderError.message)
      };
    }

    // Get the order items
    const { data: itemsData, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    if (itemsError) {
      console.error('Error fetching order items:', itemsError.message);
      return {
        order: orderData as Order,
        items: null,
        error: new Error(itemsError.message)
      };
    }

    return {
      order: orderData as Order,
      items: itemsData as OrderItem[],
      error: null
    };
  } catch (err) {
    console.error('Unexpected error fetching order details:', err);
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred fetching order details';
    return {
      order: null,
      items: null,
      error: new Error(errorMessage)
    };
  }
}
