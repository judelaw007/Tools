import type { Currency, TransitionRate } from './types';

// Currency options
export const CURRENCIES: Currency[] = [
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
];

// Fiscal years available (Transitional Safe Harbour applies 2024-2026)
export const YEARS = [2024, 2025, 2026];

// Transition rates for Simplified ETR test
// These rates increase from 15% to 17% over the transition period
export const TRANSITION_RATES: TransitionRate[] = [
  { year: 2024, rate: 15.0 },
  { year: 2025, rate: 16.0 },
  { year: 2026, rate: 17.0 },
];

// SBIE rates for Routine Profits Test (matches GloBE Calculator rates)
export const SBIE_RATES: Record<number, { payroll: number; asset: number }> = {
  2024: { payroll: 9.8, asset: 7.8 },
  2025: { payroll: 9.6, asset: 7.6 },
  2026: { payroll: 9.4, asset: 7.4 },
};

// De Minimis thresholds (in EUR equivalent)
export const DE_MINIMIS_REVENUE_THRESHOLD = 10000000; // €10 million
export const DE_MINIMIS_PROFIT_THRESHOLD = 1000000;   // €1 million

// Get currency symbol by code
export function getCurrencySymbol(currencyCode: string): string {
  return CURRENCIES.find(c => c.code === currencyCode)?.symbol || currencyCode;
}

// Format number as money
export function formatMoney(value: number, decimals = 0): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

// Get transition rate for a given year
export function getTransitionRate(yearStr: string): number {
  const year = parseInt(yearStr, 10);
  const rateInfo = TRANSITION_RATES.find(r => r.year === year);
  return rateInfo?.rate || 15.0;
}

// Get SBIE rates for a given year
export function getSBIERates(yearStr: string): { payroll: number; asset: number } {
  const year = parseInt(yearStr, 10);
  return SBIE_RATES[year] || SBIE_RATES[2024];
}

// Round number to specified decimal places
export function round(num: number, decimals = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round((num + Number.EPSILON) * factor) / factor;
}

// Parse numeric input (handles empty strings and invalid numbers)
export function parseNumeric(value: string): number {
  const parsed = parseFloat(value.replace(/,/g, ''));
  return isNaN(parsed) ? 0 : parsed;
}
