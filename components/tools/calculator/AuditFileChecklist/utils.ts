// Audit File Checklist Utilities

import type {
  ChecklistSection,
  ChecklistItem,
  ItemState,
  ItemPriority,
  ItemStatus,
  AuditMetadata,
  SectionsIncluded,
} from './types';

// --- Checklist Section Definitions ---

export const CHECKLIST_SECTIONS: ChecklistSection[] = [
  { id: 'section1', title: 'Section 1: General Information', count: 10 },
  { id: 'section2', title: 'Section 2: Corporate Structure', count: 10 },
  { id: 'section3', title: 'Section 3: GloBE Computation', count: 18 },
  { id: 'elections', title: 'Elections Documentation', count: 10 },
  { id: 'safeHarbour', title: 'Safe Harbour Documentation', count: 8 },
  { id: 'controls', title: 'System & Process Controls', count: 10 },
];

// --- Checklist Items (66 total) ---

export const CHECKLIST_ITEMS: ChecklistItem[] = [
  // Section 1 (10 items)
  { id: 'S1-001', section: 'section1', priority: 'CRITICAL', ref: '1.1.1-1.1.4', text: 'UPE identification documents (certificate of incorporation, tax registration)' },
  { id: 'S1-002', section: 'section1', priority: 'CRITICAL', ref: '1.2.x', text: 'Group organizational chart showing ownership structure' },
  { id: 'S1-003', section: 'section1', priority: 'CRITICAL', ref: '1.3.x', text: 'Designated Filing Entity appointment documentation' },
  { id: 'S1-004', section: 'section1', priority: 'HIGH', ref: '1.4.x', text: 'Fiscal year determination memorandum' },
  { id: 'S1-005', section: 'section1', priority: 'CRITICAL', ref: '1.5.x', text: 'Consolidated revenue documentation (prior 2 of 4 years)' },
  { id: 'S1-006', section: 'section1', priority: 'CRITICAL', ref: '1.5.x', text: '€750M threshold analysis workpaper' },
  { id: 'S1-007', section: 'section1', priority: 'CRITICAL', ref: '1.6.x', text: 'List of all Constituent Entities with jurisdiction mapping' },
  { id: 'S1-008', section: 'section1', priority: 'HIGH', ref: '1.7.x', text: 'Excluded Entity classification analysis' },
  { id: 'S1-009', section: 'section1', priority: 'MEDIUM', ref: '1.8.x', text: 'Joint Venture identification and ownership documentation' },
  { id: 'S1-010', section: 'section1', priority: 'MEDIUM', ref: '1.9.x', text: 'Minority-Owned Constituent Entity analysis' },

  // Section 2 (10 items)
  { id: 'S2-001', section: 'section2', priority: 'CRITICAL', ref: '2.1.x', text: 'Complete entity listing with TIN/LEI identifiers' },
  { id: 'S2-002', section: 'section2', priority: 'CRITICAL', ref: '2.2.x', text: 'Ownership percentage schedules for all entities' },
  { id: 'S2-003', section: 'section2', priority: 'HIGH', ref: '2.3.x', text: 'Entity classification memoranda (PE, JV, MOCE, etc.)' },
  { id: 'S2-004', section: 'section2', priority: 'HIGH', ref: '2.4.x', text: 'Transparent entity analysis and flow-through documentation' },
  { id: 'S2-005', section: 'section2', priority: 'MEDIUM', ref: '2.5.x', text: 'Reverse hybrid entity identification' },
  { id: 'S2-006', section: 'section2', priority: 'MEDIUM', ref: '2.6.x', text: 'Stateless entity analysis' },
  { id: 'S2-007', section: 'section2', priority: 'MEDIUM', ref: '2.7.x', text: 'Investment entity classification documentation' },
  { id: 'S2-008', section: 'section2', priority: 'HIGH', ref: '2.8.x', text: 'Tax transparent structure diagrams' },
  { id: 'S2-009', section: 'section2', priority: 'HIGH', ref: '2.9.x', text: 'Changes in group structure during fiscal year' },
  { id: 'S2-010', section: 'section2', priority: 'MEDIUM', ref: '2.10.x', text: 'Acquisitions/dispositions documentation' },

  // Section 3 (18 items)
  { id: 'S3-001', section: 'section3', priority: 'CRITICAL', ref: '3.1.x', text: 'Financial accounting net income by jurisdiction' },
  { id: 'S3-002', section: 'section3', priority: 'CRITICAL', ref: '3.2.x', text: 'GloBE Income adjustments workpapers' },
  { id: 'S3-003', section: 'section3', priority: 'HIGH', ref: '3.3.x', text: 'Policy choice memorandum' },
  { id: 'S3-004', section: 'section3', priority: 'HIGH', ref: '3.4.x', text: 'Excluded dividend documentation' },
  { id: 'S3-005', section: 'section3', priority: 'HIGH', ref: '3.5.x', text: 'Excluded equity gain/loss calculations' },
  { id: 'S3-006', section: 'section3', priority: 'MEDIUM', ref: '3.6.x', text: 'Asymmetric foreign currency gain/loss analysis' },
  { id: 'S3-007', section: 'section3', priority: 'MEDIUM', ref: '3.7.x', text: 'Stock-based compensation adjustment workpapers' },
  { id: 'S3-008', section: 'section3', priority: 'MEDIUM', ref: '3.8.x', text: 'Prior period error and accounting changes documentation' },
  { id: 'S3-009', section: 'section3', priority: 'CRITICAL', ref: '3.10.x', text: 'Adjusted Covered Taxes calculation workpapers' },
  { id: 'S3-010', section: 'section3', priority: 'CRITICAL', ref: '3.11.x', text: 'Current tax expense reconciliation to GloBE taxes' },
  { id: 'S3-011', section: 'section3', priority: 'HIGH', ref: '3.12.x', text: 'Deferred tax adjustment schedules' },
  { id: 'S3-012', section: 'section3', priority: 'HIGH', ref: '3.13.x', text: 'Qualified Refundable Tax Credit analysis' },
  { id: 'S3-013', section: 'section3', priority: 'MEDIUM', ref: '3.14.x', text: 'Non-Qualified Refundable Tax Credit documentation' },
  { id: 'S3-014', section: 'section3', priority: 'CRITICAL', ref: '3.15.x', text: 'ETR calculation workpapers by jurisdiction' },
  { id: 'S3-015', section: 'section3', priority: 'CRITICAL', ref: '3.16.x', text: 'SBIE calculation workpapers (payroll, assets)' },
  { id: 'S3-016', section: 'section3', priority: 'CRITICAL', ref: '3.17.x', text: 'Top-up Tax computation by jurisdiction' },
  { id: 'S3-017', section: 'section3', priority: 'HIGH', ref: '3.18.x', text: 'QDMTT calculation (if applicable)' },
  { id: 'S3-018', section: 'section3', priority: 'HIGH', ref: '3.19.x', text: 'IIR/UTPR allocation workpapers' },

  // Elections (10 items)
  { id: 'EL-001', section: 'elections', priority: 'CRITICAL', ref: 'Various', text: 'Election inventory listing all elections made' },
  { id: 'EL-002', section: 'elections', priority: 'HIGH', ref: 'Elec 1', text: 'Stock-based compensation election documentation' },
  { id: 'EL-003', section: 'elections', priority: 'HIGH', ref: 'Elec 2', text: 'Eligible distribution tax system election' },
  { id: 'EL-004', section: 'elections', priority: 'MEDIUM', ref: 'Elec 3', text: 'Aggregate partnership allocation election' },
  { id: 'EL-005', section: 'elections', priority: 'HIGH', ref: 'Elec 4', text: 'QDMTT Safe Harbour election documentation' },
  { id: 'EL-006', section: 'elections', priority: 'HIGH', ref: 'Elec 5', text: 'Transitional CbCR Safe Harbour election' },
  { id: 'EL-007', section: 'elections', priority: 'MEDIUM', ref: 'Various', text: 'Annual election vs. Five-year election documentation' },
  { id: 'EL-008', section: 'elections', priority: 'HIGH', ref: 'Various', text: 'Election effective date tracking schedule' },
  { id: 'EL-009', section: 'elections', priority: 'MEDIUM', ref: 'Various', text: 'Election revocation documentation (if any)' },
  { id: 'EL-010', section: 'elections', priority: 'HIGH', ref: 'Various', text: 'Board/committee approval for key elections' },

  // Safe Harbour (8 items)
  { id: 'SH-001', section: 'safeHarbour', priority: 'CRITICAL', ref: 'SH', text: 'Transitional CbCR Safe Harbour qualification analysis' },
  { id: 'SH-002', section: 'safeHarbour', priority: 'CRITICAL', ref: 'SH', text: 'Qualified CbCR report supporting Safe Harbour' },
  { id: 'SH-003', section: 'safeHarbour', priority: 'HIGH', ref: 'Test 1', text: 'De Minimis Test calculation (Revenue < €10M, Profit < €1M)' },
  { id: 'SH-004', section: 'safeHarbour', priority: 'HIGH', ref: 'Test 2', text: 'Simplified ETR Test calculation with threshold analysis' },
  { id: 'SH-005', section: 'safeHarbour', priority: 'HIGH', ref: 'Test 3', text: 'Routine Profits Test workpaper' },
  { id: 'SH-006', section: 'safeHarbour', priority: 'CRITICAL', ref: 'SH', text: 'Jurisdiction-by-jurisdiction Safe Harbour determination' },
  { id: 'SH-007', section: 'safeHarbour', priority: 'HIGH', ref: 'SH', text: 'CbCR to Financial Statement reconciliation' },
  { id: 'SH-008', section: 'safeHarbour', priority: 'MEDIUM', ref: 'SH', text: 'Safe Harbour transitional period tracking' },

  // Controls (10 items)
  { id: 'CT-001', section: 'controls', priority: 'HIGH', ref: 'N/A', text: 'GloBE data collection process documentation' },
  { id: 'CT-002', section: 'controls', priority: 'HIGH', ref: 'N/A', text: 'Chart of accounts mapping to GIR data points' },
  { id: 'CT-003', section: 'controls', priority: 'MEDIUM', ref: 'N/A', text: 'Source system to GIR data flow diagrams' },
  { id: 'CT-004', section: 'controls', priority: 'HIGH', ref: 'N/A', text: 'Manual adjustment approval process' },
  { id: 'CT-005', section: 'controls', priority: 'HIGH', ref: 'N/A', text: 'Data validation and reconciliation procedures' },
  { id: 'CT-006', section: 'controls', priority: 'MEDIUM', ref: 'N/A', text: 'Calculation engine/tool documentation' },
  { id: 'CT-007', section: 'controls', priority: 'HIGH', ref: 'N/A', text: 'Review and sign-off workflow documentation' },
  { id: 'CT-008', section: 'controls', priority: 'HIGH', ref: 'N/A', text: 'Audit trail and change log' },
  { id: 'CT-009', section: 'controls', priority: 'MEDIUM', ref: 'N/A', text: 'Training documentation for GIR preparers' },
  { id: 'CT-010', section: 'controls', priority: 'MEDIUM', ref: 'N/A', text: 'SOX/internal control documentation (if applicable)' },
];

// --- Initial States ---

export const INITIAL_SECTIONS_INCLUDED: SectionsIncluded = {
  section1: true,
  section2: true,
  section3: true,
  elections: true,
  safeHarbour: true,
  controls: true,
};

export const INITIAL_METADATA: AuditMetadata = {
  entityName: '',
  fiscalYear: new Date().getFullYear(),
  jurisdictionCount: 1,
  filingEntity: '',
  girStatus: 'DRAFT',
  auditDate: new Date().toISOString().split('T')[0],
  sectionsIncluded: INITIAL_SECTIONS_INCLUDED,
};

export const INITIAL_ITEM_STATE: ItemState = {
  status: 'INCOMPLETE',
  notes: '',
};

// --- Case Study Data ---

export const CASE_STUDY_METADATA: AuditMetadata = {
  entityName: 'GlobalTech Manufacturing Ltd',
  fiscalYear: 2024,
  jurisdictionCount: 20,
  filingEntity: 'GlobalTech Manufacturing Ltd',
  girStatus: 'DRAFT',
  auditDate: new Date().toISOString().split('T')[0],
  sectionsIncluded: {
    section1: true,
    section2: true,
    section3: true,
    elections: true,
    safeHarbour: true,
    controls: true,
  },
};

export function generateCaseStudyItemStates(): Record<string, ItemState> {
  const newStates: Record<string, ItemState> = {};
  CHECKLIST_ITEMS.forEach((item) => {
    if (item.section === 'section1') {
      newStates[item.id] = { status: 'COMPLETE', notes: 'Verified in system' };
    } else if (item.priority === 'CRITICAL' && Math.random() > 0.5) {
      newStates[item.id] = { status: 'COMPLETE', notes: 'Draft available' };
    } else {
      newStates[item.id] = { status: 'INCOMPLETE', notes: '' };
    }
  });
  // Set specific items for gap analysis demo
  newStates['S3-009'] = {
    status: 'INCOMPLETE',
    notes: 'Waiting on Switzerland tax team',
  };
  newStates['S3-003'] = {
    status: 'INCOMPLETE',
    notes: 'Draft memo pending review',
  };
  return newStates;
}

// --- Helper Functions ---

export function getPriorityColor(priority: ItemPriority): string {
  switch (priority) {
    case 'CRITICAL':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'HIGH':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'MEDIUM':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-slate-100 text-slate-800 border-slate-200';
  }
}

export function getStatusColor(status: ItemStatus): string {
  switch (status) {
    case 'COMPLETE':
      return 'bg-green-100 text-green-700 hover:bg-green-200';
    case 'INCOMPLETE':
      return 'bg-white border-2 border-slate-300 text-slate-400 hover:border-slate-400';
    case 'NOT_APPLICABLE':
      return 'bg-slate-100 text-slate-500 hover:bg-slate-200';
    case 'IN_PROGRESS':
      return 'bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100';
    default:
      return 'bg-slate-100';
  }
}

export function getNextStatus(current: ItemStatus): ItemStatus {
  switch (current) {
    case 'INCOMPLETE':
      return 'COMPLETE';
    case 'COMPLETE':
      return 'NOT_APPLICABLE';
    case 'NOT_APPLICABLE':
      return 'IN_PROGRESS';
    case 'IN_PROGRESS':
      return 'INCOMPLETE';
    default:
      return 'INCOMPLETE';
  }
}

export function getOverallStatusColor(status: string): string {
  switch (status) {
    case 'COMPLETE':
      return 'bg-green-100 text-green-800';
    case 'SUBSTANTIALLY_COMPLETE':
      return 'bg-amber-100 text-amber-800';
    case 'IN_PROGRESS':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-red-100 text-red-800';
  }
}
