import type { Currency, SBIERatesByYear, SBIERates } from './types';

// Currency options
export const CURRENCIES: Currency[] = [
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
];

// Fiscal years available
export const YEARS = [2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033];

// SBIE (Substance-Based Income Exclusion) rates by year
// These rates decrease over time as the GloBE rules transition
export const SBIE_RATES: SBIERatesByYear = {
  2024: { payroll: 9.8, asset: 7.8 },
  2025: { payroll: 9.6, asset: 7.6 },
  2026: { payroll: 9.4, asset: 7.4 },
  2027: { payroll: 9.2, asset: 7.2 },
  2028: { payroll: 9.0, asset: 7.0 },
  2029: { payroll: 8.2, asset: 6.6 },
  2030: { payroll: 7.4, asset: 6.2 },
  2031: { payroll: 6.6, asset: 5.8 },
  2032: { payroll: 5.8, asset: 5.4 },
  2033: { payroll: 5.0, asset: 5.0 },
};

// Get currency symbol by code
export function getCurrencySymbol(currencyCode: string): string {
  return CURRENCIES.find(c => c.code === currencyCode)?.symbol || currencyCode;
}

// Format number as money
export function formatMoney(value: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

// Get SBIE rates for a given year
export function getSBIERates(yearStr: string): SBIERates {
  const year = parseInt(yearStr, 10);
  // For years >= 2033, use 2033 rates (they stabilize at 5%/5%)
  if (year >= 2033) return SBIE_RATES[2033];
  return SBIE_RATES[year] || SBIE_RATES[2024];
}

// Round number to specified decimal places
export function round(num: number, decimals = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round((num + Number.EPSILON) * factor) / factor;
}

// Minimum tax rate threshold
export const MIN_TAX_RATE = 15.0;

// Warning threshold (ETR between 15% and 15.5%)
export const WARNING_THRESHOLD = 15.5;
