/**
 * CEST Employment Status Tool — Public Exports
 *
 * Entry point for the MojiTax Tools platform.
 */

// ─── Component ──────────────────────────────────────────────────────────────────
export { CestStatus, default } from './CestStatus';

// ─── Types ──────────────────────────────────────────────────────────────────────
export type {
  // Literal types
  EmploymentStatus,
  IndicatorDirection,
  AssessmentAreaId,
  WorkerEngagement,
  ClientSize,
  ConfidenceLevel,
  UndeterminedLeaning,
  ValidationSeverity,

  // Question & answer types
  AnswerOption,
  AssessmentQuestion,
  AssessmentArea,

  // Case law types
  CaseLawReference,

  // Input types
  PreliminaryInputs,
  QuestionAnswer,
  CestInputs,

  // Output types
  QuestionResult,
  AreaResult,
  IR35Implications,
  KeyFactorsSummary,
  OverallDetermination,
  ValidationResult,
  CestOutput,

  // Tracking callbacks
  AnswerSelectEvent,
  AreaCompleteEvent,
  AssessEvent,
  CestValidationEvent,
  CestHintEvent,
  CestResetEvent,
  CestScenarioLoadEvent,
  CaseLawViewEvent,
  CestCallbacks,

  // Configuration
  CestConfig,

  // Component props
  CestStatusProps,

  // H&C scenarios
  HCScenario,
} from './types';

// ─── Utilities ──────────────────────────────────────────────────────────────────
export {
  // Case law references
  CASE_LAW,
  getCaseLawForArea,

  // Question bank
  ASSESSMENT_AREAS,
  getAllQuestions,
  getQuestionById,
  getAreaById,

  // Validation
  validateInputs,
  summariseValidation,

  // Full assessment
  runAssessment,

  // Defaults
  createEmptyInputs,

  // H&C scenarios
  HC_SCENARIOS,
  getScenarioById,
  getScenariosBySection,
  scenarioToInputs,
} from './utils';
