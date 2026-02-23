/**
 * CEST Employment Status Tool — TypeScript Interfaces
 *
 * Models the HMRC Check Employment Status for Tax (CEST) decision-tree
 * assessment for determining whether a worker is employed or self-employed.
 * Covers control, substitution, mutuality of obligation, financial risk,
 * and the "in business on own account" test.
 */

// ─── Literal Types ─────────────────────────────────────────────────────────────

/** Employment status determination outcomes */
export type EmploymentStatus = 'employed' | 'self-employed' | 'undetermined';

/** Direction an indicator points */
export type IndicatorDirection = 'employment' | 'self-employment' | 'neutral';

/** Assessment area identifiers */
export type AssessmentAreaId =
  | 'control'
  | 'substitution'
  | 'moo'
  | 'financial-risk'
  | 'in-business';

/** Worker engagement type (preliminary — not scored) */
export type WorkerEngagement = 'psc' | 'agency' | 'direct';

/** Client size for IR35 purposes (preliminary — not scored) */
export type ClientSize = 'small' | 'medium-large' | 'unsure';

/** Confidence level of the determination */
export type ConfidenceLevel = 'decisive' | 'marginal';

/** Undetermined sub-classification */
export type UndeterminedLeaning = 'employment' | 'self-employment' | 'evenly-balanced';

/** Validation severity levels */
export type ValidationSeverity = 'error' | 'warning' | 'info';

// ─── Question & Answer Types ────────────────────────────────────────────────────

/** A single answer option for a question */
export interface AnswerOption {
  /** Option key (a, b, c) */
  key: string;
  /** Display text for the option */
  text: string;
  /** Scoring weight: negative = employment, positive = self-employment, zero = neutral */
  weight: number;
  /** Which direction this answer points */
  direction: IndicatorDirection;
}

/** A single assessment question */
export interface AssessmentQuestion {
  /** Question identifier (e.g., 'C1', 'S2', 'M3') */
  id: string;
  /** Assessment area this question belongs to */
  areaId: AssessmentAreaId;
  /** Question text */
  text: string;
  /** Available answer options (always 3) */
  options: [AnswerOption, AnswerOption, AnswerOption];
  /** Educational note explaining why this question matters */
  educationalNote: string;
}

/** An assessment area containing multiple questions */
export interface AssessmentArea {
  /** Area identifier */
  id: AssessmentAreaId;
  /** Display name */
  name: string;
  /** Brief description of what this area tests */
  description: string;
  /** Questions in this area */
  questions: AssessmentQuestion[];
  /** Key case law references for this area */
  caseLawRefs: string[];
}

// ─── Case Law Types ─────────────────────────────────────────────────────────────

/** A case law reference */
export interface CaseLawReference {
  /** Short reference name */
  name: string;
  /** Full citation */
  citation: string;
  /** Year of decision */
  year: number;
  /** Assessment areas this case is relevant to */
  areas: AssessmentAreaId[];
  /** The principle established by this case */
  principle: string;
}

// ─── Input Types ────────────────────────────────────────────────────────────────

/** Preliminary context (not scored) */
export interface PreliminaryInputs {
  /** How the worker is engaged */
  workerEngagement: WorkerEngagement | null;
  /** Client size for IR35 determination responsibility */
  clientSize: ClientSize | null;
}

/** A single question answer */
export interface QuestionAnswer {
  /** Question ID */
  questionId: string;
  /** Selected option key */
  selectedKey: string;
  /** Weight of the selected option */
  weight: number;
}

/** Complete input set */
export interface CestInputs {
  /** Preliminary context */
  preliminary: PreliminaryInputs;
  /** Answers to scored questions, keyed by question ID */
  answers: Record<string, QuestionAnswer>;
}

// ─── Output Types ───────────────────────────────────────────────────────────────

/** Result for a single question */
export interface QuestionResult {
  /** Question ID */
  questionId: string;
  /** Question text */
  questionText: string;
  /** Selected answer text */
  selectedAnswer: string;
  /** Weight of the selected answer */
  weight: number;
  /** Direction the answer points */
  direction: IndicatorDirection;
}

/** Result for a single assessment area */
export interface AreaResult {
  /** Area identifier */
  areaId: AssessmentAreaId;
  /** Area display name */
  areaName: string;
  /** Sum of weights for answers in this area */
  areaScore: number;
  /** Direction this area points overall */
  areaDirection: IndicatorDirection;
  /** Per-question results */
  questionResults: QuestionResult[];
  /** Case law references relevant to this area */
  caseLawReferences: CaseLawReference[];
}

/** IR35 / off-payroll working implications */
export interface IR35Implications {
  /** Whether off-payroll working rules apply */
  ir35Applies: boolean;
  /** Reason IR35 does/doesn't apply */
  ir35Reason: string;
  /** Who is responsible for the status determination */
  responsibleParty: string;
  /** Whether a Status Determination Statement (SDS) is required */
  sdsRequired: boolean;
  /** Plain-English summary of consequences if determined "employed" */
  consequences: string;
  /** Recommended next steps */
  nextSteps: string[];
}

/** Key factors summary */
export interface KeyFactorsSummary {
  /** Factors pointing toward employment */
  employmentFactors: string[];
  /** Factors pointing toward self-employment */
  selfEmploymentFactors: string[];
  /** Neutral / inconclusive factors */
  neutralFactors: string[];
  /** The single strongest employment indicator */
  strongestEmployment: string | null;
  /** The single strongest self-employment indicator */
  strongestSelfEmployment: string | null;
}

/** Overall determination result */
export interface OverallDetermination {
  /** The determination */
  status: EmploymentStatus;
  /** Overall weighted score */
  overallScore: number;
  /** How decisive the result is */
  confidenceLevel: ConfidenceLevel;
  /** For undetermined results: which way the balance tips */
  leaning: UndeterminedLeaning | null;
  /** Whether the substitution override was triggered */
  substitutionOverride: boolean;
  /** Plain-English explanation */
  reason: string;
}

/** Validation result */
export interface ValidationResult {
  /** Rule identifier */
  ruleId: string;
  /** Severity level */
  severity: ValidationSeverity;
  /** Human-readable explanation */
  message: string;
  /** Which question IDs are affected */
  affectedQuestions: string[];
  /** Whether the rule passed */
  passed: boolean;
}

/** Complete assessment output */
export interface CestOutput {
  /** Overall determination */
  determination: OverallDetermination;
  /** Per-area results */
  areaResults: AreaResult[];
  /** IR35 implications */
  ir35: IR35Implications;
  /** Key factors summary */
  keyFactors: KeyFactorsSummary;
  /** Validation results */
  validationResults: ValidationResult[];
  /** Validation summary */
  validationSummary: {
    errors: number;
    warnings: number;
    info: number;
    total: number;
  };
}

// ─── Tracking Callbacks ────────────────────────────────────────────────────────

/** Payload for onAnswerSelect */
export interface AnswerSelectEvent {
  questionId: string;
  areaId: AssessmentAreaId;
  selectedOption: string;
  weight: number;
  timestamp: number;
}

/** Payload for onAreaComplete */
export interface AreaCompleteEvent {
  areaId: AssessmentAreaId;
  areaScore: number;
  areaDirection: IndicatorDirection;
  timestamp: number;
}

/** Payload for onAssess */
export interface AssessEvent {
  determination: EmploymentStatus;
  overallScore: number;
  areaResults: Array<{ areaId: AssessmentAreaId; score: number; direction: IndicatorDirection }>;
  attemptNumber: number;
  timestamp: number;
}

/** Payload for onValidation */
export interface CestValidationEvent {
  unansweredCount: number;
  inconsistencies: string[];
  timestamp: number;
}

/** Payload for onHint */
export interface CestHintEvent {
  questionId: string;
  hintType: 'tooltip' | 'case-law' | 'explanation';
  timestamp: number;
}

/** Payload for onReset */
export interface CestResetEvent {
  previousResult: CestOutput | null;
  timestamp: number;
}

/** Payload for onScenarioLoad */
export interface CestScenarioLoadEvent {
  scenarioId: string;
  section: number;
  timestamp: number;
}

/** Payload for onCaseLawView */
export interface CaseLawViewEvent {
  caseRef: string;
  areaId: AssessmentAreaId;
  timestamp: number;
}

/** All tracking callbacks */
export interface CestCallbacks {
  onAnswerSelect?: (event: AnswerSelectEvent) => void;
  onAreaComplete?: (event: AreaCompleteEvent) => void;
  onAssess?: (event: AssessEvent) => void;
  onValidation?: (event: CestValidationEvent) => void;
  onHint?: (event: CestHintEvent) => void;
  onReset?: (event: CestResetEvent) => void;
  onScenarioLoad?: (event: CestScenarioLoadEvent) => void;
  onCaseLawView?: (event: CaseLawViewEvent) => void;
}

// ─── Component Props ───────────────────────────────────────────────────────────

/** Configuration for the component */
export interface CestConfig {
  /** Whether to show educational notes inline */
  showTooltips: boolean;
  /** Whether to show case law references in results */
  showCaseLaw: boolean;
  /** Whether to show IR35 implications panel */
  showIR35: boolean;
  /** Scenario label for tracking */
  scenarioLabel?: string;
}

/** Props for the CestStatus React component */
export interface CestStatusProps {
  /** Configuration */
  config: CestConfig;
  /** Tracking callbacks for the MojiTax platform */
  callbacks?: CestCallbacks;
  /** Override tooltip visibility */
  showTooltips?: boolean;
  /** CSS class name for the root element */
  className?: string;
}

// ─── H&C Scenario Types ───────────────────────────────────────────────────────

/** Pre-configured test scenario for H&C storyline */
export interface HCScenario {
  /** Scenario identifier */
  id: string;
  /** Display name */
  name: string;
  /** Section this scenario belongs to */
  section: number;
  /** Brief description */
  description: string;
  /** Pre-filled preliminary inputs */
  preliminary: PreliminaryInputs;
  /** Pre-filled answers keyed by question ID → option key */
  preFilledAnswers: Record<string, string>;
  /** Expected determination */
  expectedDetermination: EmploymentStatus;
  /** Expected overall score */
  expectedScore: number;
  /** Hints per question */
  hints: Record<string, string[]>;
}
