import { formatCurrency, formatDate, formatNumber, truncate, cn } from '../lib/utils';

describe('formatCurrency', () => {
  it('formats USD correctly', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
    expect(formatCurrency(0)).toBe('$0.00');
    expect(formatCurrency(-100)).toBe('-$100.00');
  });

  it('formats different currencies', () => {
    expect(formatCurrency(1000, 'EUR')).toBe('€1,000.00');
    expect(formatCurrency(1000, 'GBP')).toBe('£1,000.00');
  });

  it('handles zero decimals', () => {
    expect(formatCurrency(1000, 'USD', 0)).toBe('$1,000');
  });
});

describe('formatDate', () => {
  it('formats date correctly', () => {
    const date = new Date('2024-01-15T10:30:00Z');
    expect(formatDate(date)).toBe('Jan 15, 2024');
  });

  it('handles string dates', () => {
    expect(formatDate('2024-01-15T10:30:00Z')).toBe('Jan 15, 2024');
  });

  it('formats with time', () => {
    const date = new Date('2024-01-15T10:30:00Z');
    expect(formatDate(date, true)).toMatch(/Jan 15, 2024.*10:30/);
  });
});

describe('formatNumber', () => {
  it('formats numbers with commas', () => {
    expect(formatNumber(1000)).toBe('1,000');
    expect(formatNumber(1000000)).toBe('1,000,000');
    expect(formatNumber(1234.56)).toBe('1,234.56');
  });

  it('handles negative numbers', () => {
    expect(formatNumber(-1000)).toBe('-1,000');
  });
});

describe('truncate', () => {
  it('truncates long strings', () => {
    expect(truncate('Hello World', 8)).toBe('Hello...');
    expect(truncate('Short', 10)).toBe('Short');
  });

  it('handles exact length', () => {
    expect(truncate('Hello', 5)).toBe('Hello');
  });
});

describe('cn', () => {
  it('joins class names', () => {
    expect(cn('base', 'extra')).toBe('base extra');
  });

  it('handles conditional classes', () => {
    expect(cn('base', true && 'conditional', false && 'hidden')).toBe('base conditional');
  });

  it('handles objects', () => {
    expect(cn({ active: true, disabled: false })).toBe('active');
  });

  it('handles mixed arguments', () => {
    expect(cn('base', { active: true }, 'extra')).toBe('base active extra');
  });
});