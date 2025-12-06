// Tool Types
export type ToolType = 
  | 'calculator'
  | 'search'
  | 'validator'
  | 'generator'
  | 'tracker'
  | 'reference'
  | 'external-link'
  | 'spreadsheet'
  | 'form';

export type ToolStatus = 'draft' | 'active' | 'inactive' | 'archived';

export type ToolCategory = 
  | 'transfer_pricing'
  | 'vat'
  | 'fatca_crs'
  | 'withholding_tax'
  | 'pillar_two'
  | 'pe_assessment'
  | 'cross_category';

export type AccessLevel = 'full' | 'limited' | 'preview';

// User Types
export type UserRole = 'user' | 'admin' | 'super_admin';

// Tool Definition
export interface Tool {
  id: string;
  name: string;
  slug: string;
  toolType: ToolType;
  category: ToolCategory;
  icon?: string;
  shortDescription?: string;
  description?: string;
  previewImage?: string;
  config: ToolConfig;
  status: ToolStatus;
  isPublic: boolean;
  isPremium: boolean;
  version: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Tool Configuration (varies by tool type)
export interface ToolConfig {
  // Calculator configs
  inputs?: InputField[];
  calculations?: Calculation[];
  educationalNotes?: Record<string, string>;
  
  // Search configs
  dataSource?: string;
  searchableFields?: string[];
  displayFields?: DisplayField[];
  filters?: Filter[];
  defaultSort?: { field: string; direction: 'asc' | 'desc' };
  
  // Validator configs
  validationRules?: ValidationRule[];
  
  // External link configs
  url?: string;
  openInNewTab?: boolean;
  warningMessage?: string;
  relatedTools?: string[];
  
  // Reference configs
  content?: ReferenceContent[];
  
  // Generator configs
  template?: string;
  sections?: FormSection[];
  
  // Generic
  [key: string]: unknown;
}

export interface InputField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'currency' | 'percentage' | 'date' | 'select' | 'checkbox';
  required?: boolean;
  placeholder?: string;
  defaultValue?: string | number;
  options?: SelectOption[];
  validation?: FieldValidation;
  helpText?: string;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface FieldValidation {
  min?: number;
  max?: number;
  pattern?: string;
  message?: string;
}

export interface Calculation {
  name: string;
  formula: string;
  label: string;
  format?: 'number' | 'currency' | 'percentage' | 'decimal';
  precision?: number;
}

export interface DisplayField {
  field: string;
  label: string;
  format?: string;
}

export interface Filter {
  name: string;
  label: string;
  type: 'select' | 'text' | 'range';
  options?: SelectOption[];
}

export interface ValidationRule {
  type: 'format' | 'checksum' | 'custom';
  pattern?: string;
  message: string;
}

export interface ReferenceContent {
  id: string;
  title: string;
  content: string;
  children?: ReferenceContent[];
}

export interface FormSection {
  id: string;
  title: string;
  fields: InputField[];
}

// Course Types
export interface Course {
  id: string;
  name: string;
  slug: string;
  description?: string;
  learnworldsUrl?: string;
  category?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Course-Tool Mapping
export interface CourseTool {
  id: number;
  courseId: string;
  toolId: string;
  accessLevel: AccessLevel;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
}

// Tool Attachment
export interface ToolAttachment {
  id: number;
  toolId: string;
  name: string;
  description?: string;
  fileUrl: string;
  fileType: string;
  fileSize?: number;
  externalUrl?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
}

// User Profile
export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  role: UserRole;
  learnworldsId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// User Saved Item
export interface UserSavedItem {
  id: number;
  userId: string;
  toolId: string;
  name: string;
  data: Record<string, unknown>;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Tool Usage Log
export interface ToolUsageLog {
  id: number;
  userId?: string;
  toolId: string;
  action: 'view' | 'calculate' | 'save' | 'export' | 'error';
  metadata?: Record<string, unknown>;
  sessionId?: string;
  createdAt: Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Component Props Types
export interface ToolProps {
  tool: Tool;
  config: ToolConfig;
  user?: UserProfile;
  savedItems?: UserSavedItem[];
  onSave?: (data: Record<string, unknown>) => Promise<void>;
}

export interface ToolCardProps {
  tool: Tool;
  hasAccess?: boolean;
  showStatus?: boolean;
  onClick?: () => void;
}

// Form Types
export interface ToolFormData {
  name: string;
  slug: string;
  toolType: ToolType;
  category: ToolCategory;
  status: ToolStatus;
  shortDescription?: string;
  description?: string;
  isPublic: boolean;
  isPremium: boolean;
  config: ToolConfig;
}

export interface CourseFormData {
  name: string;
  slug: string;
  description?: string;
  learnworldsUrl?: string;
  category?: string;
  isActive: boolean;
}
