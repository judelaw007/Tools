/**
 * UK Trade Tariff Lookup — Public Exports
 *
 * Entry point for the MojiTax Tools platform.
 */

// ─── Component ──────────────────────────────────────────────────────────────────
export { UKTradeTariffLookup, default } from './UKTradeTariffLookup';

// ─── Types ──────────────────────────────────────────────────────────────────────
export type {
  // Literal types
  SearchMode,
  DutyRateType,
  ImportVATRate,
  AlertSeverity,
  TradeRemedyType,
  PreferenceScheme,
  HierarchyLevel,
  ImportControlType,

  // Hierarchy
  HierarchyNode,
  HierarchyBreadcrumb,
  TariffSection,

  // Country & preference
  Country,

  // Duty rates
  DutyRate,
  TradeRemedy,
  ExporterRate,

  // Import controls
  ImportControl,

  // Commodity record
  CommodityRecord,

  // Lookup result
  TariffLookupResult,
  TariffAlert,
  SearchResult,
  CountryComparison,

  // Tracking callbacks
  SearchEvent,
  BrowseEvent,
  CodeSelectEvent,
  CountrySelectEvent,
  ResultViewEvent,
  TariffHintEvent,
  CompareEvent,
  TariffResetEvent,
  TariffLookupCallbacks,

  // Component props
  TariffLookupConfig,
  UKTradeTariffLookupProps,

  // H&C scenarios
  HCTariffScenario,
} from './types';

// ─── Utilities ──────────────────────────────────────────────────────────────────
export {
  // Constants
  STANDARD_VAT_RATE,
  ZERO_VAT_RATE,
  VATZ_CODE,
  MFN_PREFERENCE_CODE,
  DCTS_PREFERENCE_CODE,
  FTA_PREFERENCE_CODE,

  // Reference data
  TARIFF_SECTIONS,
  COUNTRIES,
  COMMODITY_RECORDS,

  // Search functions
  searchCommodities,
  getCommodityByCode,
  getCommoditiesByChapter,
  getCommoditiesByHeading,
  getCountryByCode,
  getSectionByChapter,

  // Duty calculation
  getApplicableDuty,
  getApplicableRemedies,
  calculateEffectiveDutyPercent,
  formatEffectiveDuty,

  // Rules of origin
  getRulesOfOriginNote,

  // Validation
  validateLookup,

  // Full lookup
  performLookup,
  compareCountries,

  // H&C scenarios
  HC_TARIFF_SCENARIOS,
  getScenarioById,
  getScenariosBySection,
} from './utils';
