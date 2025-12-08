// Audit File Checklist Types

export type ItemStatus = 'INCOMPLETE' | 'COMPLETE' | 'NOT_APPLICABLE' | 'IN_PROGRESS';
export type ItemPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM';
export type OverallStatus = 'INCOMPLETE' | 'IN_PROGRESS' | 'SUBSTANTIALLY_COMPLETE' | 'COMPLETE';
export type GIRStatus = 'DRAFT' | 'PREPARED' | 'SUBMITTED' | 'AMENDED';

export interface ChecklistSection {
  id: string;
  title: string;
  count: number;
}

export interface ChecklistItem {
  id: string;
  section: string;
  priority: ItemPriority;
  ref: string;
  text: string;
}

export interface ItemState {
  status: ItemStatus;
  notes: string;
}

export interface SectionsIncluded {
  section1: boolean;
  section2: boolean;
  section3: boolean;
  elections: boolean;
  safeHarbour: boolean;
  controls: boolean;
}

export interface AuditMetadata {
  entityName: string;
  fiscalYear: number;
  jurisdictionCount: number;
  filingEntity: string;
  girStatus: GIRStatus;
  auditDate: string;
  sectionsIncluded: SectionsIncluded;
}

export interface ChecklistStats {
  total: number;
  applicable: number;
  completed: number;
  incomplete: number;
  na: number;
  percent: number;
  overallStatus: OverallStatus;
  criticalComplete: boolean;
}

export interface SavedAuditChecklist {
  id: string;
  name: string;
  metadata: AuditMetadata;
  itemStates: Record<string, ItemState>;
  updatedAt: Date;
}

export interface AuditFileChecklistProps {
  userId?: string;
  onSave?: (data: Omit<SavedAuditChecklist, 'id' | 'updatedAt'>) => Promise<string>;
  onDelete?: (id: string) => Promise<void>;
  savedItems?: SavedAuditChecklist[];
}
