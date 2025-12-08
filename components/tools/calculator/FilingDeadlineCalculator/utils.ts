import type { Jurisdiction, Milestone } from './types';

// Jurisdictions with Pillar Two implementation details
export const JURISDICTIONS: Jurisdiction[] = [
  {
    code: 'UK',
    name: 'United Kingdom',
    authority: 'HMRC',
    portal: 'HMRC Online Services',
    notes: [
      'File via HMRC GIR digital service',
      'Registration required before first filing',
      'Penalties: £100 initial + £10/day'
    ]
  },
  {
    code: 'IE',
    name: 'Ireland',
    authority: 'Revenue Commissioners',
    portal: 'ROS',
    notes: [
      'File via ROS',
      'Ireland has enacted QDMTT and IIR',
      'Local entity registration required'
    ]
  },
  {
    code: 'NL',
    name: 'Netherlands',
    authority: 'Belastingdienst',
    portal: 'Mijn Belastingdienst',
    notes: [
      'Comprehensive Pillar Two legislation enacted',
      'QDMTT applies from 2024',
      'IIR from 2024, UTPR from 2025'
    ]
  },
  {
    code: 'DE',
    name: 'Germany',
    authority: 'BZSt',
    portal: 'BZSt Online Portal',
    notes: [
      'File via BZStOnline',
      'Enacted IIR and UTPR',
      'Separate domestic minimum tax may apply'
    ]
  },
  {
    code: 'FR',
    name: 'France',
    authority: 'DGFiP',
    portal: 'DGFiP Portal',
    notes: [
      'Transposed EU Directive',
      'Strict filing deadlines',
      'QDMTT applies'
    ]
  },
  {
    code: 'CH',
    name: 'Switzerland',
    authority: 'Cantonal Tax Authority',
    portal: 'Varies by Canton',
    notes: [
      'QDMTT (Mindeststeuer) enacted',
      'Filing at cantonal level',
      'Process varies by canton'
    ]
  },
  {
    code: 'US',
    name: 'United States',
    authority: 'IRS',
    portal: 'IRS e-file',
    notes: [
      'US has NOT enacted Pillar Two rules',
      'US MNEs may be subject to UTPR abroad',
      'Monitor IRS guidance'
    ]
  },
  {
    code: 'AU',
    name: 'Australia',
    authority: 'ATO',
    portal: 'ATO Online',
    notes: [
      'Enacted IIR and domestic minimum tax',
      'Retrospective application possible',
      'Aligns with OECD deadlines'
    ]
  },
  {
    code: 'JP',
    name: 'Japan',
    authority: 'NTA',
    portal: 'e-Tax',
    notes: [
      'IIR enacted from April 2024',
      'QDMTT under discussion',
      'Verify specific FY start dates'
    ]
  },
  {
    code: 'SG',
    name: 'Singapore',
    authority: 'IRAS',
    portal: 'myTax Portal',
    notes: [
      'Implementation from 1 Jan 2025',
      'Refundable Investment Credit impact',
      'DMTT applies'
    ]
  },
  {
    code: 'OTHER',
    name: 'Other Jurisdiction',
    authority: 'Local Authority',
    portal: 'Varies',
    notes: [
      'Check local implementation status',
      'Verify if 18-month extension applies locally'
    ]
  }
];

// Milestone definitions for the filing timeline
export const MILESTONE_DEFINITIONS = [
  { name: 'Data Collection Start', monthsPrior: 9, desc: 'Begin gathering financial data' },
  { name: 'Safe Harbour Assessment', monthsPrior: 6, desc: 'Complete GIR-002 tests' },
  { name: 'GloBE Calculations', monthsPrior: 4, desc: 'Complete GIR-001 calculations' },
  { name: 'Internal Review', monthsPrior: 2, desc: 'Management sign-off' },
  { name: 'XML Generation', monthsPrior: 1, desc: 'Generate & validate GIR file' },
  { name: 'FILING DEADLINE', monthsPrior: 0, desc: 'Submit to tax authority', isDeadline: true }
];

// Parse date string to Date object
export function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Format date for display
export function formatDate(dateObj: string | Date): string {
  const d = dateObj instanceof Date ? dateObj : new Date(dateObj);
  if (!d || isNaN(d.getTime())) return 'Invalid Date';
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

// Add months to a date
export function addMonths(date: Date | string, months: number): Date {
  const d = new Date(date);
  const targetMonth = d.getMonth() + months;
  const year = d.getFullYear() + Math.floor(targetMonth / 12);
  const month = ((targetMonth % 12) + 12) % 12;
  const day = d.getDate();
  const targetDate = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  targetDate.setDate(Math.min(day, lastDayOfMonth));
  return targetDate;
}

// Calculate days remaining until target date
export function getDaysRemaining(targetDate: Date | string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// Get jurisdiction data by code
export function getJurisdictionData(code: string): Jurisdiction {
  return JURISDICTIONS.find(j => j.code === code) || JURISDICTIONS.find(j => j.code === 'OTHER')!;
}

// Calculate milestones based on deadline
export function calculateMilestones(applicableDeadline: Date): Milestone[] {
  return MILESTONE_DEFINITIONS.map(m => {
    const date = addMonths(applicableDeadline, -m.monthsPrior);
    const daysAway = getDaysRemaining(date);
    let status: Milestone['status'] = 'PENDING';
    if (daysAway < 0) status = 'OVERDUE';
    else if (daysAway === 0) status = 'TODAY';
    else if (daysAway < 30) status = 'URGENT';
    return {
      ...m,
      date: date.toISOString(),
      daysAway,
      status
    };
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
