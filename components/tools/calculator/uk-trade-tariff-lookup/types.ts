/**
 * UK Trade Tariff Lookup — TypeScript Interfaces
 *
 * Models the HMRC Online Trade Tariff (trade-tariff.service.gov.uk).
 * Curated dataset of ~30 commodity codes across food, ceramics, and homeware
 * relevant to the H&C case study.
 */

// ─── Literal Types ─────────────────────────────────────────────────────────────

/** Search mode — how the student navigates the tariff */
export type SearchMode = 'text' | 'browse' | 'direct';

/** Duty rate calculation method */
export type DutyRateType = 'ad-valorem' | 'specific' | 'compound' | 'nil';

/** VAT rate on importation */
export type ImportVATRate = 'standard' | 'zero-rated';

/** Severity level for validation and alerts */
export type AlertSeverity = 'error' | 'warning' | 'info';

/** Trade remedy type */
export type TradeRemedyType = 'anti-dumping' | 'countervailing' | 'safeguard';

/** Preference scheme identifier */
export type PreferenceScheme =
  | 'uk-eu-tca'
  | 'uk-japan-cepa'
  | 'dcts-standard'
  | 'dcts-enhanced'
  | 'dcts-comprehensive'
  | 'uk-turkey'
  | 'uk-australia'
  | 'uk-new-zealand'
  | 'uk-south-korea'
  | 'uk-canada'
  | 'uk-switzerland'
  | 'uk-norway'
  | 'uk-vietnam'
  | 'mfn';

/** Tariff hierarchy level */
export type HierarchyLevel = 'section' | 'chapter' | 'heading' | 'subheading' | 'commodity';

/** Import control document type */
export type ImportControlType =
  | 'phytosanitary'
  | 'organic-certification'
  | 'ched-d'
  | 'ched-pp'
  | 'rpa-licence'
  | 'waste-declaration'
  | 'cites'
  | 'none';

// ─── Tariff Hierarchy Interfaces ────────────────────────────────────────────────

/** A single level in the tariff hierarchy */
export interface HierarchyNode {
  /** Code at this level (e.g., "15", "1509", "150920", "1509200090") */
  code: string;
  /** Human-readable title */
  title: string;
  /** Hierarchy level */
  level: HierarchyLevel;
  /** Whether this code is declarable on an import entry */
  declarable: boolean;
  /** Child nodes (empty for leaf/declarable codes) */
  children: string[];
}

/** Full breadcrumb path from Section down to the selected code */
export interface HierarchyBreadcrumb {
  section: { number: string; title: string };
  chapter: { code: string; title: string };
  heading: { code: string; title: string };
  subheading: { code: string; title: string } | null;
  commodityCode: { code: string; title: string } | null;
}

/** A Section of the tariff (I–XXI) */
export interface TariffSection {
  /** Roman numeral (I–XXI) */
  number: string;
  /** Section title */
  title: string;
  /** Chapters covered (e.g., "01–05") */
  chapterRange: string;
  /** List of chapter codes within this section */
  chapters: string[];
}

// ─── Country & Preference Interfaces ────────────────────────────────────────────

/** A country available in the origin selector */
export interface Country {
  /** ISO 3166-1 alpha-2 code */
  code: string;
  /** Display name */
  name: string;
  /** Applicable preference scheme (if any) */
  preferenceScheme: PreferenceScheme;
  /** Preference code for CDS declaration (100 = MFN, 200 = DCTS, 300 = FTA) */
  preferenceCode: number;
  /** Display name of the FTA/scheme */
  schemeName: string;
  /** Proof of origin document required */
  proofOfOrigin: string;
}

// ─── Duty Rate Interfaces ───────────────────────────────────────────────────────

/** A duty rate (MFN, preferential, or trade remedy) */
export interface DutyRate {
  /** How the rate is calculated */
  rateType: DutyRateType;
  /** Percentage for ad valorem duties (e.g., 12 for 12%) */
  adValoremPercent: number | null;
  /** Amount for specific duties (e.g., 104 for £104/100 kg) */
  specificAmount: number | null;
  /** Unit for specific duties (e.g., "per 100 kg") */
  specificUnit: string | null;
  /** Human-readable rate string (e.g., "12.00%", "£104.00 per 100 kg") */
  displayRate: string;
  /** Preference scheme this rate belongs to */
  preferenceScheme: PreferenceScheme | null;
  /** CDS preference code */
  preferenceCode: number | null;
  /** Proof of origin required to claim this rate */
  proofOfOrigin: string | null;
}

/** A trade remedy duty (anti-dumping, countervailing, safeguard) */
export interface TradeRemedy {
  /** Type of remedy */
  type: TradeRemedyType;
  /** Legal basis (e.g., "Trade Remedies Notice 2025/21") */
  legalBasis: string;
  /** Affected origin countries */
  affectedOrigins: string[];
  /** Duty rate (ad valorem %) */
  rate: number;
  /** Display rate string */
  displayRate: string;
  /** Expiry date (ISO 8601) */
  expiryDate: string;
  /** Description of who the rate applies to */
  applicability: string;
  /** Exporter-specific rates (if any) */
  exporterRates: ExporterRate[];
}

/** Company-specific trade remedy rate */
export interface ExporterRate {
  /** Exporter category or company name */
  category: string;
  /** Rate (%) */
  rate: number;
  /** Display rate string */
  displayRate: string;
}

// ─── Import Controls ────────────────────────────────────────────────────────────

/** An import control requirement */
export interface ImportControl {
  /** Type of control */
  type: ImportControlType;
  /** Display name */
  name: string;
  /** Document code for CDS (e.g., "C644" for organic cert) */
  documentCode: string | null;
  /** When this control applies */
  condition: string;
  /** Whether this control is mandatory or conditional */
  mandatory: boolean;
}

// ─── Commodity Code (Full Record) ───────────────────────────────────────────────

/** Complete commodity code record with all duty and control information */
export interface CommodityRecord {
  /** 10-digit commodity code */
  code: string;
  /** Full goods description */
  description: string;
  /** Short description for search results */
  shortDescription: string;
  /** Hierarchy breadcrumb */
  hierarchy: HierarchyBreadcrumb;
  /** Whether this is a declarable code */
  declarable: boolean;
  /** Third Country (MFN) duty rate — always present */
  thirdCountryDuty: DutyRate;
  /** Preferential rates by country code */
  preferentialRates: Record<string, DutyRate>;
  /** Trade remedy duties (if any) */
  tradeRemedies: TradeRemedy[];
  /** VAT rate on importation */
  vatOnImportation: ImportVATRate;
  /** VAT rate as number (0 or 20) */
  vatPercent: number;
  /** HMRC VAT notice reference */
  vatReference: string;
  /** Import controls */
  importControls: ImportControl[];
  /** Supplementary units (null if none required) */
  supplementaryUnits: string | null;
  /** Educational note about this commodity */
  educationalNote: string;
  /** Classification rationale — why this code */
  classificationNote: string;
  /** Search keywords for text search matching */
  searchKeywords: string[];
}

// ─── Lookup Result ──────────────────────────────────────────────────────────────

/** Result of a tariff lookup for a specific code + country combination */
export interface TariffLookupResult {
  /** The commodity record */
  commodity: CommodityRecord;
  /** Selected country of origin */
  country: Country;
  /** Effective duty rate (MFN or preferential, whichever applies) */
  applicableDuty: DutyRate;
  /** Trade remedies that apply for this origin */
  applicableRemedies: TradeRemedy[];
  /** Total effective duty percentage (duty + trade remedies) */
  effectiveDutyPercent: number;
  /** Total effective duty display string */
  effectiveDutyDisplay: string;
  /** VAT on importation */
  vatOnImportation: ImportVATRate;
  /** VAT percentage */
  vatPercent: number;
  /** Import controls for this commodity */
  importControls: ImportControl[];
  /** Rules of origin note for the selected country */
  rulesOfOriginNote: string;
  /** Validation alerts triggered by this lookup */
  alerts: TariffAlert[];
}

/** A validation or educational alert triggered during lookup */
export interface TariffAlert {
  /** Alert ID (T1–T7) */
  ruleId: string;
  /** Severity */
  severity: AlertSeverity;
  /** Human-readable message */
  message: string;
  /** Educational note explaining why this matters */
  educationalNote: string;
}

// ─── Search Interfaces ──────────────────────────────────────────────────────────

/** Text search result (multiple codes may match) */
export interface SearchResult {
  /** Matching commodity code */
  code: string;
  /** Short description */
  description: string;
  /** Full description */
  fullDescription: string;
  /** Hierarchy breadcrumb */
  hierarchy: HierarchyBreadcrumb;
  /** Whether this code is declarable */
  declarable: boolean;
  /** Relevance score (0–100) */
  relevance: number;
}

// ─── Compare Mode ───────────────────────────────────────────────────────────────

/** Side-by-side comparison of two countries for the same commodity code */
export interface CountryComparison {
  /** The commodity being compared */
  commodity: CommodityRecord;
  /** First country result */
  countryA: TariffLookupResult;
  /** Second country result */
  countryB: TariffLookupResult;
  /** Duty difference (absolute) */
  dutyDifference: number;
  /** Which country has the lower duty */
  lowerDutyCountry: string;
  /** Educational comparison note */
  comparisonNote: string;
}

// ─── Tracking Callbacks ─────────────────────────────────────────────────────────

/** Payload for the onSearch callback */
export interface SearchEvent {
  query: string;
  resultsCount: number;
  timestamp: number;
}

/** Payload for the onBrowse callback */
export interface BrowseEvent {
  level: HierarchyLevel;
  code: string;
  timestamp: number;
}

/** Payload for the onCodeSelect callback */
export interface CodeSelectEvent {
  commodityCode: string;
  description: string;
  timestamp: number;
}

/** Payload for the onCountrySelect callback */
export interface CountrySelectEvent {
  countryCode: string;
  countryName: string;
  hasPreference: boolean;
  timestamp: number;
}

/** Payload for the onResultView callback */
export interface ResultViewEvent {
  commodityCode: string;
  country: string;
  effectiveDuty: number;
  vatRate: number;
  timestamp: number;
}

/** Payload for the onHint callback */
export interface TariffHintEvent {
  commodityCode: string;
  hintType: 'classification' | 'duty' | 'origin' | 'controls';
  timestamp: number;
}

/** Payload for the onCompare callback */
export interface CompareEvent {
  commodityCode: string;
  countries: [string, string];
  timestamp: number;
}

/** Payload for the onReset callback */
export interface TariffResetEvent {
  previousCode: string | null;
  timestamp: number;
}

/** All tracking callbacks the component accepts */
export interface TariffLookupCallbacks {
  onSearch?: (event: SearchEvent) => void;
  onBrowse?: (event: BrowseEvent) => void;
  onCodeSelect?: (event: CodeSelectEvent) => void;
  onCountrySelect?: (event: CountrySelectEvent) => void;
  onResultView?: (event: ResultViewEvent) => void;
  onHint?: (event: TariffHintEvent) => void;
  onCompare?: (event: CompareEvent) => void;
  onReset?: (event: TariffResetEvent) => void;
}

// ─── Component Props ────────────────────────────────────────────────────────────

/** Configuration for the tariff lookup instance */
export interface TariffLookupConfig {
  /** Initial search mode */
  initialMode: SearchMode;
  /** Whether compare mode is enabled */
  compareEnabled: boolean;
  /** Pre-selected commodity code (for guided mode) */
  preSelectedCode?: string;
  /** Pre-selected country (for guided mode) */
  preSelectedCountry?: string;
  /** Scenario label for tracking */
  scenarioLabel?: string;
}

/** Props for the UKTradeTariffLookup React component */
export interface UKTradeTariffLookupProps {
  /** Configuration for this instance */
  config: TariffLookupConfig;
  /** Tracking callbacks for the MojiTax platform */
  callbacks?: TariffLookupCallbacks;
  /** Whether to show educational tooltips inline */
  showTooltips?: boolean;
  /** Whether to show the compare mode tab */
  showCompare?: boolean;
  /** CSS class name for the root element */
  className?: string;
}

// ─── H&C Scenario Types ────────────────────────────────────────────────────────

/** Pre-configured test scenario for the H&C storyline */
export interface HCTariffScenario {
  /** Scenario identifier (e.g., "s2-olive-oil") */
  id: string;
  /** Display name */
  name: string;
  /** Section this scenario belongs to */
  section: number;
  /** Brief description */
  description: string;
  /** Pre-filled configuration */
  config: TariffLookupConfig;
  /** Expected commodity code */
  expectedCode: string;
  /** Expected country of origin */
  expectedCountry: string;
  /** Expected lookup result (for graded mode) */
  expectedResult: {
    commodityCode: string;
    effectiveDutyPercent: number;
    effectiveDutyDisplay: string;
    vatPercent: number;
  };
  /** Hints available for this scenario */
  hints: Record<string, string[]>;
}
