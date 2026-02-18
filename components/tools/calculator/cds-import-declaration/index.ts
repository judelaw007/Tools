/**
 * CDS Import Declaration (C88) — Public Exports
 *
 * Entry point for the MojiTax Tools platform.
 */

// ─── Component ──────────────────────────────────────────────────────────────────
export { CDSImportDeclaration, default } from './CDSImportDeclaration';

// ─── Types ──────────────────────────────────────────────────────────────────────
export type {
  // Literal types
  DeclarationType,
  AdditionalDeclarationType,
  ProcedureCode,
  AdditionalProcedureCode,
  PreferenceCode,
  ValuationMethod,
  RepresentationType,
  PaymentMethod,
  DocumentCode,
  CountryCode,
  IncotermsCode,
  VATRate,
  ValidationSeverity,
  ValidationRuleId,
  DeclarationStatus,

  // Party
  Party,

  // Document reference
  DocumentReference,

  // Declaration inputs
  DeclarationHeader,
  DeclarationItem,
  DeclarationInputs,

  // Calculation output
  DutyCalculation,
  CalculationStep,

  // Validation
  ValidationResult,
  RequiredDocument,

  // Declaration output
  DeclarationOutput,

  // Configuration
  CDSImportDeclarationConfig,

  // Tracking callbacks
  FieldEntryEvent,
  DeclarationValidationEvent,
  DeclarationSubmitEvent,
  DeclarationHintEvent,
  DeclarationResetEvent,
  DocumentCheckEvent,
  DutyCalculationEvent,
  ScenarioLoadEvent,
  CDSImportDeclarationCallbacks,

  // Component props
  CDSImportDeclarationProps,

  // H&C scenarios
  HCDeclarationScenario,
} from './types';

// ─── Utilities ──────────────────────────────────────────────────────────────────
export {
  // Constants
  STANDARD_VAT_RATE,
  ZERO_VAT_RATE,
  REDUCED_VAT_RATE,
  MIN_REASONABLE_VALUE,
  MAX_REASONABLE_VALUE,

  // Reference data
  PROCEDURE_CODES,
  PREFERENCE_CODES,
  DOCUMENT_CODES,
  COUNTRIES,
  INCOTERMS,
  UK_PORTS,

  // Labels
  FIELD_LABELS,
  FIELD_TOOLTIPS,

  // Helpers
  roundToPence,
  formatGBP,
  generateId,
  isValidEORI,
  isValidCommodityCode,
  isValidValuationIndicators,

  // Lookups
  getProcedureCodeInfo,
  getPreferenceCodeInfo,
  getDocumentCodeInfo,
  getCountryInfo,
  isPreferenceValidForCountry,
  getExpectedPreferenceForCountry,

  // Defaults
  createEmptyDocumentReference,
  createEmptyHeader,
  createEmptyItem,
  createEmptyInputs,

  // Calculation
  calculateDutyAndTaxes,

  // Document checklist
  generateDocumentChecklist,

  // Validation
  validateDeclaration,
  summariseValidation,

  // Full output
  buildDeclarationOutput,

  // H&C scenarios
  HC_DECLARATION_SCENARIOS,
  getScenarioById,
  getScenariosBySection,
} from './utils';

// ─── Reference data types ───────────────────────────────────────────────────────
export type {
  ProcedureCodeInfo,
  PreferenceCodeInfo,
  DocumentCodeInfo,
  CountryInfo,
  IncotermsInfo,
  PortInfo,
} from './utils';
