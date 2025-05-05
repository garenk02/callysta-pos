import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../tests/utils';
import CartSummary from './CartSummary';
import { useCart } from '@/hooks/useCart';

// Mock the useCart hook
vi.mock('@/hooks/useCart', () => ({
  useCart: vi.fn(),
}));

describe('CartSummary component', () => {
  it('renders empty cart correctly', () => {
    // Mock the useCart hook to return an empty cart
    (useCart as any).mockReturnValue({
      cart: [],
      summary: {
        subtotal: 0,
        total: 0,
        itemCount: 0,
        uniqueItemCount: 0,
      },
      removeItem: vi.fn(),
      clearCart: vi.fn(),
    });

    render(<CartSummary />);
    
    // Open the cart popover
    const cartButton = screen.getByRole('button', { name: /cart/i });
    fireEvent.click(cartButton);
    
    // Check that the empty cart message is displayed
    expect(screen.getByText('Shopping Cart')).toBeInTheDocument();
    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
  });

  it('renders cart with items correctly', () => {
    // Mock the useCart hook to return a cart with items
    (useCart as any).mockReturnValue({
      cart: [
        {
          product: {
            id: '1',
            name: 'Test Product',
            price: 10000,
            stock_quantity: 10,
          },
          quantity: 2,
        },
      ],
      summary: {
        subtotal: 20000,
        total: 20000,
        itemCount: 2,
        uniqueItemCount: 1,
      },
      removeItem: vi.fn(),
      clearCart: vi.fn(),
    });

    render(<CartSummary />);
    
    // Open the cart popover
    const cartButton = screen.getByRole('button', { name: /cart/i });
    expect(cartButton).toBeInTheDocument();
    
    // Check that the badge with item count is displayed
    const badge = screen.getByText('2');
    expect(badge).toBeInTheDocument();
    
    // Open the cart
    fireEvent.click(cartButton);
    
    // Check that the cart items are displayed
    expect(screen.getByText('Shopping Cart')).toBeInTheDocument();
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('Rp. 10.000')).toBeInTheDocument();
    expect(screen.getByText('x2')).toBeInTheDocument();
    
    // Check that the total is displayed
    expect(screen.getByText('Rp. 20.000')).toBeInTheDocument();
  });

  it('calls clearCart when clear button is clicked', () => {
    const clearCartMock = vi.fn();
    
    // Mock the useCart hook to return a cart with items
    (useCart as any).mockReturnValue({
      cart: [
        {
          product: {
            id: '1',
            name: 'Test Product',
            price: 10000,
            stock_quantity: 10,
          },
          quantity: 2,
        },
      ],
      summary: {
        subtotal: 20000,
        total: 20000,
        itemCount: 2,
        uniqueItemCount: 1,
      },
      removeItem: vi.fn(),
      clearCart: clearCartMock,
    });

    render(<CartSummary />);
    
    // Open the cart popover
    const cartButton = screen.getByRole('button', { name: /cart/i });
    fireEvent.click(cartButton);
    
    // Click the clear button
    const clearButton = screen.getByRole('button', { name: /clear/i });
    fireEvent.click(clearButton);
    
    // Check that clearCart was called
    expect(clearCartMock).toHaveBeenCalledTimes(1);
  });
});
