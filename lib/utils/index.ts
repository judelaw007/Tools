import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { ToolType, ToolStatus, ToolCategory, AccessLevel } from '@/types';

// Merge Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency
export function formatCurrency(amount: number, currency = 'GBP'): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Format percentage
export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// Format number
export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat('en-GB', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);
}

// Format date
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

// Format relative time
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

// Generate slug from text
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Tool type display name
export function getToolTypeName(type: ToolType): string {
  const names: Record<ToolType, string> = {
    calculator: 'Calculator',
    search: 'Search',
    validator: 'Validator',
    generator: 'Document Generator',
    tracker: 'Tracker',
    reference: 'Reference',
    'external-link': 'External Link',
    spreadsheet: 'Spreadsheet',
    form: 'Form',
  };
  return names[type] || type;
}

// Tool type icon name (for Lucide icons)
export function getToolTypeIcon(type: ToolType): string {
  const icons: Record<ToolType, string> = {
    calculator: 'Calculator',
    search: 'Search',
    validator: 'CheckCircle',
    generator: 'FileText',
    tracker: 'TrendingUp',
    reference: 'BookOpen',
    'external-link': 'ExternalLink',
    spreadsheet: 'Table',
    form: 'ClipboardList',
  };
  return icons[type] || 'Tool';
}

// Tool status display
export function getStatusConfig(status: ToolStatus): { label: string; className: string } {
  const configs: Record<ToolStatus, { label: string; className: string }> = {
    draft: { label: 'Draft', className: 'status-draft' },
    active: { label: 'Live', className: 'status-active' },
    inactive: { label: 'Inactive', className: 'status-inactive' },
    archived: { label: 'Archived', className: 'status-archived' },
  };
  return configs[status] || { label: status, className: '' };
}

// Category display name
export function getCategoryName(category: ToolCategory): string {
  const names: Record<ToolCategory, string> = {
    transfer_pricing: 'Transfer Pricing',
    vat: 'VAT / Indirect Tax',
    fatca_crs: 'FATCA / CRS',
    withholding_tax: 'Withholding Tax & Treaties',
    pillar_two: 'Pillar Two / Global Min Tax',
    pe_assessment: 'PE Assessment',
    cross_category: 'Cross-Category',
  };
  return names[category] || category;
}

// Access level display
export function getAccessLevelName(level: AccessLevel): string {
  const names: Record<AccessLevel, string> = {
    full: 'Full Access',
    limited: 'Limited Access',
    preview: 'Preview Only',
  };
  return names[level] || level;
}

// Truncate text
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

// Validate email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Safe JSON parse
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

// Debounce function
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

// Evaluate simple formula (for calculator tools)
export function evaluateFormula(
  formula: string,
  variables: Record<string, number>
): number {
  try {
    // Replace variable names with values
    let expression = formula;
    for (const [name, value] of Object.entries(variables)) {
      expression = expression.replace(new RegExp(name, 'g'), value.toString());
    }
    
    // Only allow safe characters: numbers, operators, parentheses, decimal points
    if (!/^[\d\s+\-*/().]+$/.test(expression)) {
      throw new Error('Invalid formula');
    }
    
    // Evaluate the expression
    // eslint-disable-next-line no-new-func
    return new Function(`return ${expression}`)() as number;
  } catch {
    return 0;
  }
}

// Group array by key
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

// Sort array by multiple keys
export function sortBy<T>(
  array: T[],
  ...keys: (keyof T | ((item: T) => string | number | Date))[]
): T[] {
  return [...array].sort((a, b) => {
    for (const key of keys) {
      const aVal = typeof key === 'function' ? key(a) : a[key];
      const bVal = typeof key === 'function' ? key(b) : b[key];
      
      if (aVal < bVal) return -1;
      if (aVal > bVal) return 1;
    }
    return 0;
  });
}
