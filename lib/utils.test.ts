import { describe, it, expect } from 'vitest';
import { cn, formatCurrency, formatDate } from './utils';

describe('cn utility', () => {
  it('should merge class names correctly', () => {
    const result = cn('class1', 'class2', { 'class3': true, 'class4': false });
    expect(result).toContain('class1');
    expect(result).toContain('class2');
    expect(result).toContain('class3');
    expect(result).not.toContain('class4');
  });
});

describe('formatCurrency utility', () => {
  it('should format currency correctly', () => {
    const result = formatCurrency(1000);
    expect(result).toBe('Rp.1.000');
  });

  it('should format large numbers correctly', () => {
    const result = formatCurrency(1000000);
    expect(result).toBe('Rp.1.000.000');
  });

  it('should handle zero correctly', () => {
    const result = formatCurrency(0);
    expect(result).toBe('Rp.0');
  });
});

describe('formatDate utility', () => {
  it('should format date correctly', () => {
    // Create a fixed date for testing
    const date = new Date('2023-01-15T14:30:00');
    const result = formatDate(date);
    
    // Check that the result contains the expected parts
    expect(result).toContain('Jan');
    expect(result).toContain('15');
    expect(result).toContain('2023');
  });
});
