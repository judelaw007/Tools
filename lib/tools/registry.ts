import type { ToolType } from '@/types';
import type { ComponentType } from 'react';
import type { ToolProps } from '@/types';

// Tool component registry
// Each tool type maps to a React component
const TOOL_COMPONENTS: Partial<Record<ToolType, ComponentType<ToolProps>>> = {
  // Components will be added as they're built
  // calculator: CalculatorTool,
  // search: SearchTool,
  // validator: ValidatorTool,
  // generator: GeneratorTool,
  // tracker: TrackerTool,
  // reference: ReferenceTool,
  // 'external-link': ExternalLinkTool,
};

export function getToolComponent(toolType: ToolType): ComponentType<ToolProps> | null {
  return TOOL_COMPONENTS[toolType] || null;
}

export function registerToolComponent(
  toolType: ToolType,
  component: ComponentType<ToolProps>
) {
  TOOL_COMPONENTS[toolType] = component;
}

export function getRegisteredToolTypes(): ToolType[] {
  return Object.keys(TOOL_COMPONENTS) as ToolType[];
}

// Tool type metadata for UI display
export const TOOL_TYPE_METADATA: Record<ToolType, {
  name: string;
  description: string;
  icon: string;
  color: string;
}> = {
  calculator: {
    name: 'Calculator',
    description: 'Practice calculations and understand formulas',
    icon: 'Calculator',
    color: 'blue',
  },
  search: {
    name: 'Search Tool',
    description: 'Search and explore reference data',
    icon: 'Search',
    color: 'purple',
  },
  validator: {
    name: 'Validator',
    description: 'Validate formats and check compliance',
    icon: 'CheckCircle',
    color: 'green',
  },
  generator: {
    name: 'Document Generator',
    description: 'Generate practice documents and forms',
    icon: 'FileText',
    color: 'orange',
  },
  tracker: {
    name: 'Tracker',
    description: 'Track thresholds and monitor progress',
    icon: 'TrendingUp',
    color: 'pink',
  },
  reference: {
    name: 'Reference Library',
    description: 'Browse and search reference content',
    icon: 'BookOpen',
    color: 'cyan',
  },
  'external-link': {
    name: 'External Link',
    description: 'Link to official external resources',
    icon: 'ExternalLink',
    color: 'slate',
  },
  spreadsheet: {
    name: 'Spreadsheet',
    description: 'Excel-like data entry and analysis',
    icon: 'Table',
    color: 'emerald',
  },
  form: {
    name: 'Form',
    description: 'Data collection and submission',
    icon: 'ClipboardList',
    color: 'indigo',
  },
};

// Category metadata for UI display
export const CATEGORY_METADATA: Record<string, {
  name: string;
  shortName: string;
  description: string;
  color: string;
}> = {
  transfer_pricing: {
    name: 'Transfer Pricing',
    shortName: 'TP',
    description: 'Tools for transfer pricing analysis and documentation',
    color: 'blue',
  },
  vat: {
    name: 'VAT / Indirect Tax',
    shortName: 'VAT',
    description: 'Tools for VAT calculations and compliance',
    color: 'green',
  },
  fatca_crs: {
    name: 'FATCA / CRS',
    shortName: 'FATCA',
    description: 'Tools for FATCA and CRS compliance',
    color: 'purple',
  },
  withholding_tax: {
    name: 'Withholding Tax & Treaties',
    shortName: 'WHT',
    description: 'Tools for withholding tax and treaty analysis',
    color: 'orange',
  },
  pillar_two: {
    name: 'Pillar Two / Global Min Tax',
    shortName: 'P2',
    description: 'Tools for Pillar Two calculations',
    color: 'cyan',
  },
  pe_assessment: {
    name: 'PE Assessment',
    shortName: 'PE',
    description: 'Tools for permanent establishment analysis',
    color: 'pink',
  },
  cross_category: {
    name: 'Cross-Category',
    shortName: 'Multi',
    description: 'Tools that span multiple tax areas',
    color: 'slate',
  },
};
