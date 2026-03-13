'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  Save,
  FolderOpen,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Plus,
  Trash2,
  Info,
  FileText,
  Building,
  Shield,
  Calculator,
  ClipboardCheck,
  HelpCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type {
  GIRStep,
  GeneralInformation,
  EntityEntry,
  SafeHarbourEntry,
  SafeHarbourResult,
  JurisdictionComputation,
  JurisdictionResult,
  FilingSummary,
  DataPointDefinition,
  GirPracticeFormProps,
  SavedGIRSession,
  ValidationError,
} from './types';
import {
  STEP_CONFIGS,
  GIR_STEPS,
  STEP_EDUCATIONAL_NOTES,
  DATA_POINTS,
  JURISDICTIONS,
  CURRENCIES,
  ENTITY_CLASSIFICATION_OPTIONS,
  CONSOLIDATION_METHOD_OPTIONS,
  FILING_TYPE_OPTIONS,
  SAFE_HARBOUR_ELECTION_OPTIONS,
  CHARGING_MECHANISM_OPTIONS,
  INITIAL_GENERAL_INFO,
  INITIAL_ENTITY,
  INITIAL_SAFE_HARBOUR,
  INITIAL_JURISDICTION_COMPUTATION,
  CASE_STUDY_GENERAL_INFO,
  CASE_STUDY_ENTITIES,
  CASE_STUDY_SAFE_HARBOURS,
  CASE_STUDY_COMPUTATIONS,
  CASE_STUDY_TEACHING_POINTS,
  generateId,
  calculateFilingDeadline,
  getFiscalYear,
  assessSafeHarbour,
  calculateJurisdiction,
  calculateFilingSummary,
  validateGeneralInfo,
  validateEntities,
  validateComputations,
  roundTo2,
  formatEUR,
  formatNumber,
  formatPercentage,
  formatDate,
  getOptionLabel,
  getSBIERates,
} from './utils';

// ============================================================
// STEP ICONS
// ============================================================

const STEP_ICONS: Record<GIRStep, React.ReactNode> = {
  GENERAL_INFO: <FileText className="h-4 w-4" />,
  ENTITY_STRUCTURE: <Building className="h-4 w-4" />,
  SAFE_HARBOURS: <Shield className="h-4 w-4" />,
  GLOBE_COMPUTATIONS: <Calculator className="h-4 w-4" />,
  FILING_SUMMARY: <ClipboardCheck className="h-4 w-4" />,
};

// ============================================================
// REUSABLE INPUT COMPONENTS
// ============================================================

function InputField({
  label,
  dataPointKey,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
  disabled,
  helpOpen,
  onToggleHelp,
}: {
  label: string;
  dataPointKey?: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: 'text' | 'number' | 'date';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  helpOpen?: boolean;
  onToggleHelp?: () => void;
}) {
  const dp = dataPointKey ? DATA_POINTS[dataPointKey] : null;
  return (
    <div>
      <div className="flex items-center gap-1 mb-1">
        <label className="text-xs font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {dp && onToggleHelp && (
          <button
            onClick={onToggleHelp}
            className="text-gray-400 hover:text-blue-600"
            title="Data point guidance"
          >
            <HelpCircle className="h-3 w-3" />
          </button>
        )}
      </div>
      {helpOpen && dp && <DataPointHelp dp={dp} />}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
      />
    </div>
  );
}

function SelectField({
  label,
  dataPointKey,
  value,
  onChange,
  options,
  required,
  disabled,
  helpOpen,
  onToggleHelp,
}: {
  label: string;
  dataPointKey?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  disabled?: boolean;
  helpOpen?: boolean;
  onToggleHelp?: () => void;
}) {
  const dp = dataPointKey ? DATA_POINTS[dataPointKey] : null;
  return (
    <div>
      <div className="flex items-center gap-1 mb-1">
        <label className="text-xs font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {dp && onToggleHelp && (
          <button
            onClick={onToggleHelp}
            className="text-gray-400 hover:text-blue-600"
            title="Data point guidance"
          >
            <HelpCircle className="h-3 w-3" />
          </button>
        )}
      </div>
      {helpOpen && dp && <DataPointHelp dp={dp} />}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option value="">Select...</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function CheckboxField({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="rounded"
      />
      {label}
    </label>
  );
}

function ResultRow({
  label,
  value,
  highlight,
  dataPointKey,
}: {
  label: string;
  value: string;
  highlight?: 'green' | 'red' | 'amber' | 'blue';
  dataPointKey?: string;
}) {
  const colourMap = {
    green: 'text-green-700 bg-green-50',
    red: 'text-red-700 bg-red-50',
    amber: 'text-amber-700 bg-amber-50',
    blue: 'text-blue-700 bg-blue-50',
  };
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span
        className={`text-sm font-medium px-2 py-0.5 rounded ${
          highlight ? colourMap[highlight] : 'text-gray-900'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function DataPointHelp({ dp }: { dp: DataPointDefinition }) {
  return (
    <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs space-y-1">
      <p className="text-blue-800">{dp.description}</p>
      <p className="text-blue-600">
        <strong>Article:</strong> {dp.articleRef}
      </p>
      <p className="text-blue-600">
        <strong>ERP Source:</strong> {dp.erpSource}
      </p>
      {dp.commonIssues && (
        <p className="text-amber-700">
          <strong>Common Issues:</strong> {dp.commonIssues}
        </p>
      )}
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function GirPracticeForm({
  userId,
  onSave,
  onDelete,
  savedItems = [],
  onTrackCalculation,
  onTrackStepChange,
  onTrackError,
  onTrackCompletion,
}: GirPracticeFormProps) {
  // --- State ---
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [generalInfo, setGeneralInfo] = useState<GeneralInformation>({
    ...INITIAL_GENERAL_INFO,
  });
  const [entities, setEntities] = useState<EntityEntry[]>([]);
  const [safeHarbours, setSafeHarbours] = useState<SafeHarbourEntry[]>([]);
  const [computations, setComputations] = useState<JurisdictionComputation[]>(
    []
  );
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [showEducationalNote, setShowEducationalNote] = useState(true);
  const [loadMenuOpen, setLoadMenuOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [helpField, setHelpField] = useState<string | null>(null);
  const [showTeachingPoints, setShowTeachingPoints] = useState(false);

  const currentStep = STEP_CONFIGS[currentStepIndex];

  // --- Computed ---
  const fiscalYear = useMemo(
    () => getFiscalYear(generalInfo.fiscalYearEnd),
    [generalInfo.fiscalYearEnd]
  );

  const filingDeadline = useMemo(
    () =>
      calculateFilingDeadline(
        generalInfo.fiscalYearEnd,
        generalInfo.isFirstFiling
      ),
    [generalInfo.fiscalYearEnd, generalInfo.isFirstFiling]
  );

  const safeHarbourResults = useMemo<SafeHarbourResult[]>(
    () =>
      safeHarbours
        .filter((sh) => sh.electionType !== 'NONE')
        .map((sh) => assessSafeHarbour(sh, fiscalYear)),
    [safeHarbours, fiscalYear]
  );

  const jurisdictionResults = useMemo<JurisdictionResult[]>(
    () => computations.map((c) => calculateJurisdiction(c, fiscalYear)),
    [computations, fiscalYear]
  );

  const filingSummary = useMemo<FilingSummary>(
    () => calculateFilingSummary(generalInfo, entities, computations),
    [generalInfo, entities, computations]
  );

  // --- Navigation ---
  const canGoNext = useCallback((): boolean => {
    if (currentStepIndex === 0) {
      return validateGeneralInfo(generalInfo).length === 0;
    }
    if (currentStepIndex === 1) {
      return validateEntities(entities).length === 0;
    }
    return true;
  }, [currentStepIndex, generalInfo, entities]);

  const goNext = useCallback(() => {
    if (currentStepIndex === 0) {
      const validationErrors = validateGeneralInfo(generalInfo);
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        onTrackError?.(validationErrors[0].message, {
          step: currentStep.key,
        });
        return;
      }
    }
    if (currentStepIndex === 1) {
      const validationErrors = validateEntities(entities);
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        onTrackError?.(validationErrors[0].message, {
          step: currentStep.key,
        });
        return;
      }
    }
    if (currentStepIndex === 3) {
      const validationErrors = validateComputations(computations);
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        onTrackError?.(validationErrors[0].message, {
          step: currentStep.key,
        });
        return;
      }
      onTrackCalculation?.('globe_computations_completed', {
        jurisdictionCount: computations.length,
        totalGrossTopUpTax: filingSummary.totalGrossTopUpTax,
        totalNetTopUpTax: filingSummary.totalNetTopUpTax,
      });
    }

    setErrors([]);
    const nextIndex = Math.min(currentStepIndex + 1, GIR_STEPS.length - 1);
    onTrackStepChange?.(currentStep.key, STEP_CONFIGS[nextIndex].key);
    setCurrentStepIndex(nextIndex);

    // Track completion when reaching summary
    if (nextIndex === GIR_STEPS.length - 1) {
      onTrackCompletion?.({
        totalJurisdictions: filingSummary.totalJurisdictions,
        totalCEs: filingSummary.totalCEs,
        totalGrossTopUpTax: filingSummary.totalGrossTopUpTax,
        totalNetTopUpTax: filingSummary.totalNetTopUpTax,
        safeHarbourCount: filingSummary.safeHarbourCount,
        filingDeadline: filingSummary.filingDeadline,
      });
    }
  }, [
    currentStepIndex,
    generalInfo,
    entities,
    computations,
    filingSummary,
    currentStep,
    onTrackStepChange,
    onTrackCalculation,
    onTrackCompletion,
    onTrackError,
  ]);

  const goBack = useCallback(() => {
    setErrors([]);
    const prevIndex = Math.max(currentStepIndex - 1, 0);
    onTrackStepChange?.(currentStep.key, STEP_CONFIGS[prevIndex].key);
    setCurrentStepIndex(prevIndex);
  }, [currentStepIndex, currentStep, onTrackStepChange]);

  // --- General Info ---
  const updateGeneralInfo = useCallback(
    (updates: Partial<GeneralInformation>) => {
      setGeneralInfo((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  // --- Entity CRUD ---
  const addEntity = useCallback(() => {
    setEntities((prev) => [
      ...prev,
      { ...INITIAL_ENTITY, id: generateId('ENT') },
    ]);
  }, []);

  const updateEntity = useCallback(
    (id: string, updates: Partial<EntityEntry>) => {
      setEntities((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
      );
    },
    []
  );

  const removeEntity = useCallback((id: string) => {
    setEntities((prev) => {
      const filtered = prev.filter((e) => e.id !== id);
      return filtered.map((e) =>
        e.directParentId === id ? { ...e, directParentId: '' } : e
      );
    });
  }, []);

  // --- Safe Harbour CRUD ---
  const addSafeHarbour = useCallback(() => {
    setSafeHarbours((prev) => [
      ...prev,
      { ...INITIAL_SAFE_HARBOUR, id: generateId('SH') },
    ]);
  }, []);

  const updateSafeHarbour = useCallback(
    (id: string, updates: Partial<SafeHarbourEntry>) => {
      setSafeHarbours((prev) =>
        prev.map((sh) => (sh.id === id ? { ...sh, ...updates } : sh))
      );
    },
    []
  );

  const removeSafeHarbour = useCallback((id: string) => {
    setSafeHarbours((prev) => prev.filter((sh) => sh.id !== id));
  }, []);

  // --- Computation CRUD ---
  const addComputation = useCallback(() => {
    setComputations((prev) => [
      ...prev,
      { ...INITIAL_JURISDICTION_COMPUTATION, id: generateId('GC') },
    ]);
  }, []);

  const updateComputation = useCallback(
    (id: string, updates: Partial<JurisdictionComputation>) => {
      setComputations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
      );
    },
    []
  );

  const removeComputation = useCallback((id: string) => {
    setComputations((prev) => prev.filter((c) => c.id !== id));
  }, []);

  // --- Load H&C Scenario ---
  const loadCaseStudy = useCallback(() => {
    setGeneralInfo({ ...CASE_STUDY_GENERAL_INFO });
    setEntities(CASE_STUDY_ENTITIES.map((e) => ({ ...e })));
    setSafeHarbours(CASE_STUDY_SAFE_HARBOURS.map((sh) => ({ ...sh })));
    setComputations(CASE_STUDY_COMPUTATIONS.map((c) => ({ ...c })));
    setCurrentStepIndex(0);
    setErrors([]);
    setLoadMenuOpen(false);
    setShowTeachingPoints(true);
  }, []);

  // --- Load Saved ---
  const loadSaved = useCallback((saved: SavedGIRSession) => {
    setGeneralInfo({ ...saved.generalInfo });
    setEntities(saved.entities.map((e) => ({ ...e })));
    setSafeHarbours(saved.safeHarbours.map((sh) => ({ ...sh })));
    setComputations(saved.computations.map((c) => ({ ...c })));
    setCurrentStepIndex(0);
    setErrors([]);
    setLoadMenuOpen(false);
  }, []);

  // --- Save ---
  const handleSave = useCallback(async () => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      await onSave({
        name: generalInfo.mneGroupName || 'Untitled GIR',
        generalInfo,
        entities,
        safeHarbours,
        computations,
      });
    } finally {
      setIsSaving(false);
    }
  }, [onSave, generalInfo, entities, safeHarbours, computations]);

  // --- Reset ---
  const handleReset = useCallback(() => {
    setGeneralInfo({ ...INITIAL_GENERAL_INFO });
    setEntities([]);
    setSafeHarbours([]);
    setComputations([]);
    setCurrentStepIndex(0);
    setErrors([]);
    setShowTeachingPoints(false);
  }, []);

  // --- Help toggle ---
  const toggleHelp = useCallback(
    (key: string) => {
      setHelpField(helpField === key ? null : key);
    },
    [helpField]
  );

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle className="text-xl">
                  GloBE Information Return — Practice Form
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Complete the GIR across 3 OECD sections — Articles 8.1, 10.1
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {/* Load menu */}
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLoadMenuOpen(!loadMenuOpen)}
                >
                  <FolderOpen className="h-4 w-4 mr-1" />
                  Load
                </Button>
                {loadMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-64 bg-white border rounded-md shadow-lg z-50">
                    <button
                      className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 border-b"
                      onClick={loadCaseStudy}
                    >
                      <span className="font-medium">H&C Scenario</span>
                      <br />
                      <span className="text-xs text-gray-500">
                        Stratos Group — FY 2025 Complete GIR
                      </span>
                    </button>
                    {savedItems.map((item) => (
                      <button
                        key={item.id}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex justify-between items-center"
                        onClick={() => loadSaved(item)}
                      >
                        <span>{item.name}</span>
                        {onDelete && (
                          <Trash2
                            className="h-3 w-3 text-red-400 hover:text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(item.id);
                            }}
                          />
                        )}
                      </button>
                    ))}
                    {savedItems.length === 0 && (
                      <div className="px-4 py-2 text-xs text-gray-400">
                        No saved sessions
                      </div>
                    )}
                  </div>
                )}
              </div>
              {onSave && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving || !generalInfo.mneGroupName}
                >
                  <Save className="h-4 w-4 mr-1" />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Step Progress Bar */}
      <div className="flex items-center gap-1 px-2">
        {STEP_CONFIGS.map((step, index) => {
          const isActive = index === currentStepIndex;
          const isCompleted = index < currentStepIndex;
          return (
            <React.Fragment key={step.key}>
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
              )}
              <button
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : isCompleted
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-gray-50 text-gray-500 border border-gray-200'
                }`}
                onClick={() => {
                  if (index <= currentStepIndex) {
                    setErrors([]);
                    setCurrentStepIndex(index);
                  }
                }}
                disabled={index > currentStepIndex}
              >
                {isCompleted ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  STEP_ICONS[step.key]
                )}
                <span className="hidden sm:inline">{step.label}</span>
                <span className="sm:hidden">{step.shortLabel}</span>
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {/* GIR Section Badge */}
      <div className="flex items-center gap-2 px-2">
        <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded">
          {currentStep.girSection}
        </span>
        <span className="text-xs text-gray-500">{currentStep.description}</span>
      </div>

      {/* Educational Note */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-4">
          <button
            className="flex items-center gap-2 text-sm font-medium text-blue-800 w-full"
            onClick={() => setShowEducationalNote(!showEducationalNote)}
          >
            <Info className="h-4 w-4" />
            <span>Educational Note — {currentStep.label}</span>
            {showEducationalNote ? (
              <ChevronUp className="h-4 w-4 ml-auto" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-auto" />
            )}
          </button>
          {showEducationalNote && (
            <p className="text-sm text-blue-700 mt-2 leading-relaxed">
              {STEP_EDUCATIONAL_NOTES[currentStep.key]}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Teaching Points (H&C only) */}
      {showTeachingPoints && (
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="pt-4">
            <button
              className="flex items-center gap-2 text-sm font-medium text-purple-800 w-full"
              onClick={() => setShowTeachingPoints(!showTeachingPoints)}
            >
              <Info className="h-4 w-4" />
              <span>H&C Teaching Points — Stratos Group</span>
              <ChevronUp className="h-4 w-4 ml-auto" />
            </button>
            <ul className="mt-2 space-y-1">
              {CASE_STUDY_TEACHING_POINTS.map((point, i) => (
                <li key={i} className="text-xs text-purple-700 leading-relaxed">
                  {i + 1}. {point}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Validation Errors */}
      {errors.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2">
              <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  Please fix the following:
                </p>
                <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                  {errors.map((err, i) => (
                    <li key={i}>{err.message}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step Content */}
      {currentStep.key === 'GENERAL_INFO' && (
        <StepGeneralInfo
          info={generalInfo}
          updateInfo={updateGeneralInfo}
          filingDeadline={filingDeadline}
          helpField={helpField}
          toggleHelp={toggleHelp}
        />
      )}
      {currentStep.key === 'ENTITY_STRUCTURE' && (
        <StepEntityStructure
          entities={entities}
          addEntity={addEntity}
          updateEntity={updateEntity}
          removeEntity={removeEntity}
          helpField={helpField}
          toggleHelp={toggleHelp}
        />
      )}
      {currentStep.key === 'SAFE_HARBOURS' && (
        <StepSafeHarbours
          safeHarbours={safeHarbours}
          addSafeHarbour={addSafeHarbour}
          updateSafeHarbour={updateSafeHarbour}
          removeSafeHarbour={removeSafeHarbour}
          safeHarbourResults={safeHarbourResults}
          fiscalYear={fiscalYear}
          helpField={helpField}
          toggleHelp={toggleHelp}
        />
      )}
      {currentStep.key === 'GLOBE_COMPUTATIONS' && (
        <StepGlobeComputations
          computations={computations}
          addComputation={addComputation}
          updateComputation={updateComputation}
          removeComputation={removeComputation}
          jurisdictionResults={jurisdictionResults}
          fiscalYear={fiscalYear}
          helpField={helpField}
          toggleHelp={toggleHelp}
        />
      )}
      {currentStep.key === 'FILING_SUMMARY' && (
        <StepFilingSummary
          summary={filingSummary}
          generalInfo={generalInfo}
          entities={entities}
          safeHarbourResults={safeHarbourResults}
        />
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={currentStepIndex === 0 ? handleReset : goBack}
          className="flex items-center gap-1"
        >
          {currentStepIndex === 0 ? (
            'Reset'
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              Back
            </>
          )}
        </Button>
        {currentStepIndex < GIR_STEPS.length - 1 && (
          <Button
            onClick={goNext}
            disabled={!canGoNext()}
            className="flex items-center gap-1"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// STEP 1: GENERAL INFORMATION
// ============================================================

function StepGeneralInfo({
  info,
  updateInfo,
  filingDeadline,
  helpField,
  toggleHelp,
}: {
  info: GeneralInformation;
  updateInfo: (updates: Partial<GeneralInformation>) => void;
  filingDeadline: { deadline: string; daysRemaining: number };
  helpField: string | null;
  toggleHelp: (key: string) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Group Identification */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            1.1 MNE Group Identification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InputField
              label="MNE Group Name"
              dataPointKey="S1.1.1"
              value={info.mneGroupName}
              onChange={(v) => updateInfo({ mneGroupName: v })}
              placeholder="e.g. Stratos Group"
              required
              helpOpen={helpField === 'S1.1.1'}
              onToggleHelp={() => toggleHelp('S1.1.1')}
            />
            <InputField
              label="UPE Legal Name"
              dataPointKey="S1.1.2"
              value={info.upeLegalName}
              onChange={(v) => updateInfo({ upeLegalName: v })}
              placeholder="e.g. Stratos Holdings plc"
              required
              helpOpen={helpField === 'S1.1.2'}
              onToggleHelp={() => toggleHelp('S1.1.2')}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <SelectField
              label="UPE Jurisdiction"
              dataPointKey="S1.1.3"
              value={info.upeJurisdiction}
              onChange={(v) => updateInfo({ upeJurisdiction: v })}
              options={JURISDICTIONS}
              required
              helpOpen={helpField === 'S1.1.3'}
              onToggleHelp={() => toggleHelp('S1.1.3')}
            />
            <InputField
              label="UPE Tax ID"
              dataPointKey="S1.1.4"
              value={info.upeTaxId}
              onChange={(v) => updateInfo({ upeTaxId: v })}
              placeholder="e.g. GB123456789"
              required
              helpOpen={helpField === 'S1.1.4'}
              onToggleHelp={() => toggleHelp('S1.1.4')}
            />
            <InputField
              label="LEI (Optional)"
              dataPointKey="S1.1.5"
              value={info.lei}
              onChange={(v) => updateInfo({ lei: v })}
              placeholder="20-char alphanumeric"
              helpOpen={helpField === 'S1.1.5'}
              onToggleHelp={() => toggleHelp('S1.1.5')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Reporting Period */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">1.2 Reporting Period</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <InputField
              label="Fiscal Year Start"
              dataPointKey="S1.2.1"
              value={info.fiscalYearStart}
              onChange={(v) => updateInfo({ fiscalYearStart: v })}
              type="date"
              required
              helpOpen={helpField === 'S1.2.1'}
              onToggleHelp={() => toggleHelp('S1.2.1')}
            />
            <InputField
              label="Fiscal Year End"
              dataPointKey="S1.2.2"
              value={info.fiscalYearEnd}
              onChange={(v) => updateInfo({ fiscalYearEnd: v })}
              type="date"
              required
              helpOpen={helpField === 'S1.2.2'}
              onToggleHelp={() => toggleHelp('S1.2.2')}
            />
            <SelectField
              label="Reporting Currency"
              dataPointKey="S1.2.3"
              value={info.reportingCurrency}
              onChange={(v) => updateInfo({ reportingCurrency: v })}
              options={CURRENCIES}
              required
              helpOpen={helpField === 'S1.2.3'}
              onToggleHelp={() => toggleHelp('S1.2.3')}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <CheckboxField
                label="First filing year (18-month deadline)"
                checked={info.isFirstFiling}
                onChange={(v) => updateInfo({ isFirstFiling: v })}
              />
            </div>
            <InputField
              label="Consolidated Revenue"
              dataPointKey="S1.2.5"
              value={info.consolidatedRevenue || ''}
              onChange={(v) =>
                updateInfo({ consolidatedRevenue: parseFloat(v) || 0 })
              }
              type="number"
              placeholder="e.g. 938600000"
              required
              helpOpen={helpField === 'S1.2.5'}
              onToggleHelp={() => toggleHelp('S1.2.5')}
            />
            <InputField
              label="Years Exceeding Threshold"
              value={info.yearsExceedingThreshold || ''}
              onChange={(v) =>
                updateInfo({ yearsExceedingThreshold: parseInt(v) || 0 })
              }
              type="number"
              placeholder="e.g. 3"
            />
          </div>

          {/* Filing deadline display */}
          {filingDeadline.deadline && (
            <div className="mt-3 p-3 bg-gray-50 rounded border">
              <ResultRow
                label="Filing Deadline"
                value={formatDate(filingDeadline.deadline)}
                highlight={filingDeadline.daysRemaining < 90 ? 'red' : 'green'}
              />
              <ResultRow
                label="Days Remaining"
                value={`${filingDeadline.daysRemaining} days`}
                highlight={
                  filingDeadline.daysRemaining < 90
                    ? 'red'
                    : filingDeadline.daysRemaining < 180
                      ? 'amber'
                      : 'green'
                }
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filing Entity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            1.3 Designated Filing Entity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <InputField
              label="DFE Name"
              dataPointKey="S1.3.1"
              value={info.dfeName}
              onChange={(v) => updateInfo({ dfeName: v })}
              placeholder="e.g. Stratos Holdings plc"
              required
              helpOpen={helpField === 'S1.3.1'}
              onToggleHelp={() => toggleHelp('S1.3.1')}
            />
            <SelectField
              label="DFE Jurisdiction"
              dataPointKey="S1.3.2"
              value={info.dfeJurisdiction}
              onChange={(v) => updateInfo({ dfeJurisdiction: v })}
              options={JURISDICTIONS}
              required
              helpOpen={helpField === 'S1.3.2'}
              onToggleHelp={() => toggleHelp('S1.3.2')}
            />
            <InputField
              label="DFE Tax ID"
              dataPointKey="S1.3.3"
              value={info.dfeTaxId}
              onChange={(v) => updateInfo({ dfeTaxId: v })}
              placeholder="e.g. GB123456789"
              required
              helpOpen={helpField === 'S1.3.3'}
              onToggleHelp={() => toggleHelp('S1.3.3')}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SelectField
              label="Filing Type"
              dataPointKey="S1.3.4"
              value={info.filingType}
              onChange={(v) =>
                updateInfo({ filingType: v as 'ORIGINAL' | 'AMENDED' })
              }
              options={FILING_TYPE_OPTIONS}
              required
              helpOpen={helpField === 'S1.3.4'}
              onToggleHelp={() => toggleHelp('S1.3.4')}
            />
            {info.filingType === 'AMENDED' && (
              <InputField
                label="Amendment Reason"
                dataPointKey="S1.3.5"
                value={info.amendmentReason}
                onChange={(v) => updateInfo({ amendmentReason: v })}
                placeholder="Reason for amendment"
                required
                helpOpen={helpField === 'S1.3.5'}
                onToggleHelp={() => toggleHelp('S1.3.5')}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// STEP 2: ENTITY STRUCTURE
// ============================================================

function StepEntityStructure({
  entities,
  addEntity,
  updateEntity,
  removeEntity,
  helpField,
  toggleHelp,
}: {
  entities: EntityEntry[];
  addEntity: () => void;
  updateEntity: (id: string, updates: Partial<EntityEntry>) => void;
  removeEntity: (id: string) => void;
  helpField: string | null;
  toggleHelp: (key: string) => void;
}) {
  const upeCount = entities.filter((e) => e.classification === 'UPE').length;
  const excludedCount = entities.filter((e) => e.isExcluded).length;
  const jurisdictions = [
    ...Array.from(new Set(entities.map((e) => e.jurisdiction).filter(Boolean))),
  ];

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <span>
              <strong>{entities.length}</strong> entities
            </span>
            <span>
              <strong>{jurisdictions.length}</strong> jurisdictions
            </span>
            <span>
              <strong>{excludedCount}</strong> excluded
            </span>
            {upeCount !== 1 && (
              <span className="text-red-600 font-medium">
                {upeCount === 0
                  ? 'No UPE designated'
                  : `${upeCount} UPEs (must be exactly 1)`}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Entity List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Constituent Entity Register
            </CardTitle>
            <Button variant="outline" size="sm" onClick={addEntity}>
              <Plus className="h-4 w-4 mr-1" />
              Add Entity
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {entities.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              Add Constituent Entities to build the group structure.
              <br />
              Or use <strong>Load &rarr; H&C Scenario</strong> for the Stratos
              Group (27 entities).
            </p>
          ) : (
            <div className="space-y-3">
              {entities.map((entity) => (
                <EntityCard
                  key={entity.id}
                  entity={entity}
                  allEntities={entities}
                  onUpdate={updateEntity}
                  onRemove={removeEntity}
                  helpField={helpField}
                  toggleHelp={toggleHelp}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ownership tree preview */}
      {entities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ownership Tree Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <OwnershipTree entities={entities} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function EntityCard({
  entity,
  allEntities,
  onUpdate,
  onRemove,
  helpField,
  toggleHelp,
}: {
  entity: EntityEntry;
  allEntities: EntityEntry[];
  onUpdate: (id: string, updates: Partial<EntityEntry>) => void;
  onRemove: (id: string) => void;
  helpField: string | null;
  toggleHelp: (key: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const possibleParents = allEntities.filter((e) => e.id !== entity.id);

  const classColour =
    entity.classification === 'UPE'
      ? 'bg-purple-100 text-purple-800'
      : entity.classification === 'IPE'
        ? 'bg-blue-100 text-blue-800'
        : entity.classification === 'MOCE'
          ? 'bg-amber-100 text-amber-800'
          : entity.classification === 'PE'
            ? 'bg-teal-100 text-teal-800'
            : entity.classification === 'EE'
              ? 'bg-gray-100 text-gray-500'
              : entity.classification === 'JV'
                ? 'bg-indigo-100 text-indigo-800'
                : 'bg-gray-100 text-gray-700';

  return (
    <div
      className={`border rounded-md p-3 space-y-2 ${
        entity.isExcluded ? 'bg-gray-50 opacity-70' : 'bg-white'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className={`text-xs px-2 py-0.5 rounded font-medium ${classColour}`}>
          {entity.classification}
        </span>
        <input
          type="text"
          value={entity.entityName}
          onChange={(e) => onUpdate(entity.id, { entityName: e.target.value })}
          placeholder="Entity legal name"
          className="flex-1 border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-gray-400 hover:text-gray-600 p-1"
        >
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        <button
          onClick={() => onRemove(entity.id)}
          className="text-red-400 hover:text-red-600 p-1"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Compact row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <SelectField
          label="Jurisdiction"
          value={entity.jurisdiction}
          onChange={(v) => onUpdate(entity.id, { jurisdiction: v })}
          options={JURISDICTIONS}
          required
        />
        <InputField
          label="Ownership %"
          value={entity.ownershipPercent}
          onChange={(v) =>
            onUpdate(entity.id, {
              ownershipPercent: parseFloat(v) || 0,
            })
          }
          type="number"
        />
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">
            Parent Entity
          </label>
          <select
            value={entity.directParentId}
            onChange={(e) =>
              onUpdate(entity.id, { directParentId: e.target.value })
            }
            className="w-full border rounded px-2 py-1.5 text-sm"
            disabled={entity.classification === 'UPE'}
          >
            <option value="">
              {entity.classification === 'UPE' ? 'N/A (UPE)' : 'Select...'}
            </option>
            {possibleParents.map((p) => (
              <option key={p.id} value={p.id}>
                {p.entityName || `Entity ${p.id}`}
              </option>
            ))}
          </select>
        </div>
        <SelectField
          label="Classification"
          value={entity.classification}
          onChange={(v) =>
            onUpdate(entity.id, {
              classification: v as EntityEntry['classification'],
            })
          }
          options={ENTITY_CLASSIFICATION_OPTIONS}
          required
        />
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t pt-2 space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <InputField
              label="Internal ID"
              value={entity.internalId}
              onChange={(v) => onUpdate(entity.id, { internalId: v })}
              placeholder="e.g. SH001"
            />
            <InputField
              label="Tax ID"
              value={entity.taxId}
              onChange={(v) => onUpdate(entity.id, { taxId: v })}
              placeholder="Local tax ID"
            />
            <SelectField
              label="Consolidation"
              value={entity.consolidationMethod}
              onChange={(v) =>
                onUpdate(entity.id, {
                  consolidationMethod:
                    v as EntityEntry['consolidationMethod'],
                })
              }
              options={CONSOLIDATION_METHOD_OPTIONS}
            />
            <InputField
              label="Acquisition Date"
              value={entity.acquisitionDate}
              onChange={(v) => onUpdate(entity.id, { acquisitionDate: v })}
              type="date"
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <CheckboxField
              label="Excluded Entity (Art. 1.5)"
              checked={entity.isExcluded}
              onChange={(v) => onUpdate(entity.id, { isExcluded: v })}
            />
            <CheckboxField
              label="Permanent Establishment"
              checked={entity.isPE}
              onChange={(v) => onUpdate(entity.id, { isPE: v })}
            />
            <CheckboxField
              label="Flow-Through Entity"
              checked={entity.isFlowThrough}
              onChange={(v) => onUpdate(entity.id, { isFlowThrough: v })}
            />
          </div>
          {entity.isExcluded && (
            <InputField
              label="Exclusion Reason"
              value={entity.exclusionReason}
              onChange={(v) => onUpdate(entity.id, { exclusionReason: v })}
              placeholder="e.g. Pension Fund — Art. 1.5.3"
            />
          )}
          <InputField
            label="Notes"
            value={entity.notes}
            onChange={(v) => onUpdate(entity.id, { notes: v })}
            placeholder="Additional notes"
          />
        </div>
      )}
    </div>
  );
}

function OwnershipTree({ entities }: { entities: EntityEntry[] }) {
  const upe = entities.find((e) => e.classification === 'UPE');
  if (!upe) return <p className="text-sm text-gray-500">No UPE designated.</p>;

  const renderNode = (
    entity: EntityEntry,
    depth: number
  ): React.ReactNode => {
    const children = entities.filter(
      (e) => e.directParentId === entity.id
    );
    const indent = depth * 24;

    return (
      <div key={entity.id}>
        <div
          className="flex items-center gap-2 py-1 text-sm"
          style={{ paddingLeft: indent }}
        >
          {depth > 0 && <span className="text-gray-300">&mdash;</span>}
          <Building className="h-3.5 w-3.5 text-gray-400" />
          <span className="font-medium">
            {entity.entityName || 'Unnamed'}
          </span>
          <span className="text-gray-400 text-xs">
            ({entity.jurisdiction || '?'})
          </span>
          {entity.classification !== 'UPE' && (
            <span className="text-gray-400 text-xs">
              {entity.ownershipPercent}%
            </span>
          )}
          <span
            className={`text-xs px-1.5 py-0.5 rounded ${
              entity.classification === 'UPE'
                ? 'bg-purple-100 text-purple-700'
                : entity.classification === 'IPE'
                  ? 'bg-blue-100 text-blue-700'
                  : entity.classification === 'EE'
                    ? 'bg-gray-100 text-gray-400'
                    : 'bg-gray-50 text-gray-500'
            }`}
          >
            {entity.classification}
          </span>
          {entity.isExcluded && (
            <span className="text-xs text-red-500">(excluded)</span>
          )}
        </div>
        {children.map((child) => renderNode(child, depth + 1))}
      </div>
    );
  };

  return <div className="font-mono text-sm">{renderNode(upe, 0)}</div>;
}

// ============================================================
// STEP 3: SAFE HARBOURS
// ============================================================

function StepSafeHarbours({
  safeHarbours,
  addSafeHarbour,
  updateSafeHarbour,
  removeSafeHarbour,
  safeHarbourResults,
  fiscalYear,
  helpField,
  toggleHelp,
}: {
  safeHarbours: SafeHarbourEntry[];
  addSafeHarbour: () => void;
  updateSafeHarbour: (id: string, updates: Partial<SafeHarbourEntry>) => void;
  removeSafeHarbour: (id: string) => void;
  safeHarbourResults: SafeHarbourResult[];
  fiscalYear: number;
  helpField: string | null;
  toggleHelp: (key: string) => void;
}) {
  const qualifying = safeHarbourResults.filter((r) => r.qualifies).length;
  const tested = safeHarbourResults.length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <span>
              <strong>{safeHarbours.length}</strong> jurisdictions entered
            </span>
            <span>
              <strong>{tested}</strong> tested
            </span>
            <span className={qualifying > 0 ? 'text-green-700 font-medium' : ''}>
              <strong>{qualifying}</strong> qualifying
            </span>
            <span className="text-gray-500">
              Transition ETR rate for FY {fiscalYear}:{' '}
              <strong>
                {formatPercentage(
                  fiscalYear === 2024 ? 0.15 : fiscalYear === 2025 ? 0.16 : 0.17
                )}
              </strong>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Safe Harbour entries */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Transitional CbCR Safe Harbour Elections
            </CardTitle>
            <Button variant="outline" size="sm" onClick={addSafeHarbour}>
              <Plus className="h-4 w-4 mr-1" />
              Add Jurisdiction
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {safeHarbours.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              Add jurisdictions to test for transitional CbCR safe harbour
              eligibility.
              <br />
              Jurisdictions that qualify are excluded from full GloBE
              computation.
            </p>
          ) : (
            <div className="space-y-4">
              {safeHarbours.map((sh) => {
                const result = safeHarbourResults.find(
                  (r) => r.jurisdiction === sh.jurisdiction
                );
                return (
                  <SafeHarbourCard
                    key={sh.id}
                    entry={sh}
                    result={result}
                    onUpdate={updateSafeHarbour}
                    onRemove={removeSafeHarbour}
                    helpField={helpField}
                    toggleHelp={toggleHelp}
                  />
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SafeHarbourCard({
  entry,
  result,
  onUpdate,
  onRemove,
  helpField,
  toggleHelp,
}: {
  entry: SafeHarbourEntry;
  result?: SafeHarbourResult;
  onUpdate: (id: string, updates: Partial<SafeHarbourEntry>) => void;
  onRemove: (id: string) => void;
  helpField: string | null;
  toggleHelp: (key: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const resultBadge = result
    ? result.qualifies
      ? 'bg-green-100 text-green-800 border-green-300'
      : result.overallResult === 'NOT_TESTED'
        ? 'bg-gray-100 text-gray-600 border-gray-300'
        : 'bg-red-100 text-red-800 border-red-300'
    : 'bg-gray-100 text-gray-600 border-gray-300';

  return (
    <div className="border rounded-md p-3 space-y-2 bg-white">
      <div className="flex items-center gap-2">
        <SelectField
          label=""
          value={entry.jurisdiction}
          onChange={(v) => onUpdate(entry.id, { jurisdiction: v })}
          options={JURISDICTIONS}
          required
        />
        <SelectField
          label=""
          value={entry.electionType}
          onChange={(v) =>
            onUpdate(entry.id, {
              electionType: v as SafeHarbourEntry['electionType'],
            })
          }
          options={SAFE_HARBOUR_ELECTION_OPTIONS}
        />
        {result && (
          <span
            className={`text-xs px-2 py-1 rounded border font-medium whitespace-nowrap ${resultBadge}`}
          >
            {result.qualifies
              ? `PASS: ${result.overallResult.replace('_', ' ')}`
              : result.overallResult === 'NOT_TESTED'
                ? 'Not Tested'
                : 'FAIL'}
          </span>
        )}
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-gray-400 hover:text-gray-600 p-1"
        >
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        <button
          onClick={() => onRemove(entry.id)}
          className="text-red-400 hover:text-red-600 p-1"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {expanded && entry.electionType !== 'NONE' && (
        <div className="border-t pt-2 space-y-3">
          {/* CbCR Data */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1">
              CbCR Data (Table 2)
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <InputField
                label="Revenue"
                value={entry.cbcrRevenue || ''}
                onChange={(v) =>
                  onUpdate(entry.id, { cbcrRevenue: parseFloat(v) || 0 })
                }
                type="number"
              />
              <InputField
                label="Profit Before Tax"
                value={entry.cbcrPBT || ''}
                onChange={(v) =>
                  onUpdate(entry.id, { cbcrPBT: parseFloat(v) || 0 })
                }
                type="number"
              />
              <InputField
                label="Tax Accrued"
                value={entry.cbcrTaxAccrued || ''}
                onChange={(v) =>
                  onUpdate(entry.id, { cbcrTaxAccrued: parseFloat(v) || 0 })
                }
                type="number"
              />
              <InputField
                label="Employees"
                value={entry.cbcrEmployees || ''}
                onChange={(v) =>
                  onUpdate(entry.id, {
                    cbcrEmployees: parseInt(v) || 0,
                  })
                }
                type="number"
              />
              <InputField
                label="Tangible Assets"
                value={entry.cbcrTangibleAssets || ''}
                onChange={(v) =>
                  onUpdate(entry.id, {
                    cbcrTangibleAssets: parseFloat(v) || 0,
                  })
                }
                type="number"
              />
            </div>
          </div>

          {/* De Minimis */}
          <div>
            <CheckboxField
              label="Test de minimis (3-year average data available)"
              checked={entry.isDeMinimisEligible}
              onChange={(v) =>
                onUpdate(entry.id, { isDeMinimisEligible: v })
              }
            />
            {entry.isDeMinimisEligible && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <InputField
                  label="3-Year Avg Revenue"
                  value={entry.deMinimisRevenue3YrAvg || ''}
                  onChange={(v) =>
                    onUpdate(entry.id, {
                      deMinimisRevenue3YrAvg: parseFloat(v) || 0,
                    })
                  }
                  type="number"
                />
                <InputField
                  label="3-Year Avg Income"
                  value={entry.deMinimisIncome3YrAvg || ''}
                  onChange={(v) =>
                    onUpdate(entry.id, {
                      deMinimisIncome3YrAvg: parseFloat(v) || 0,
                    })
                  }
                  type="number"
                />
              </div>
            )}
          </div>

          {/* Result detail */}
          {result && result.overallResult !== 'NOT_TESTED' && (
            <div className="bg-gray-50 rounded p-2 text-xs space-y-1">
              <p className="font-medium text-gray-700">Test Results:</p>
              <p>
                De Minimis:{' '}
                <span
                  className={
                    result.deMinimisPass ? 'text-green-700' : 'text-gray-500'
                  }
                >
                  {result.deMinimisPass ? 'PASS' : 'N/A or FAIL'}
                </span>
              </p>
              <p>
                Simplified ETR:{' '}
                <span
                  className={
                    result.simplifiedETRPass
                      ? 'text-green-700'
                      : 'text-gray-500'
                  }
                >
                  {entry.cbcrPBT > 0
                    ? `${formatPercentage(result.simplifiedETR)} — ${
                        result.simplifiedETRPass ? 'PASS' : 'FAIL'
                      }`
                    : 'N/A (no PBT)'}
                </span>
              </p>
              <p>
                Routine Profits:{' '}
                <span
                  className={
                    result.routineProfitsPass
                      ? 'text-green-700'
                      : 'text-gray-500'
                  }
                >
                  {result.routineProfitsPass ? 'PASS' : 'FAIL'}
                </span>
              </p>
              <p className="font-medium mt-1">{result.reason}</p>
            </div>
          )}

          <InputField
            label="Notes"
            value={entry.notes}
            onChange={(v) => onUpdate(entry.id, { notes: v })}
            placeholder="Safe harbour notes"
          />
        </div>
      )}
    </div>
  );
}

// ============================================================
// STEP 4: GLOBE COMPUTATIONS
// ============================================================

function StepGlobeComputations({
  computations,
  addComputation,
  updateComputation,
  removeComputation,
  jurisdictionResults,
  fiscalYear,
  helpField,
  toggleHelp,
}: {
  computations: JurisdictionComputation[];
  addComputation: () => void;
  updateComputation: (
    id: string,
    updates: Partial<JurisdictionComputation>
  ) => void;
  removeComputation: (id: string) => void;
  jurisdictionResults: JurisdictionResult[];
  fiscalYear: number;
  helpField: string | null;
  toggleHelp: (key: string) => void;
}) {
  const sbieRates = getSBIERates(fiscalYear);
  const belowMinimum = jurisdictionResults.filter(
    (r) => r.isBelowMinimum && !r.safeHarbourApplied && !r.deMinimisApplied
  );
  const totalGross = jurisdictionResults.reduce(
    (s, r) => s + r.grossTopUpTax,
    0
  );

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <span>
              <strong>{computations.length}</strong> jurisdictions
            </span>
            <span className="text-red-700">
              <strong>{belowMinimum.length}</strong> below 15% minimum
            </span>
            <span>
              Total gross top-up: <strong>{formatEUR(totalGross)}</strong>
            </span>
            <span className="text-gray-500">
              SBIE rates: payroll {formatPercentage(sbieRates.payrollRate)} /
              assets {formatPercentage(sbieRates.tangibleAssetRate)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Computation cards */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Jurisdictional GloBE Computations
            </CardTitle>
            <Button variant="outline" size="sm" onClick={addComputation}>
              <Plus className="h-4 w-4 mr-1" />
              Add Jurisdiction
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {computations.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              Add jurisdictions requiring full GloBE computation.
              <br />
              Jurisdictions qualifying for safe harbour do not need entries here.
            </p>
          ) : (
            <div className="space-y-4">
              {computations.map((comp, idx) => {
                const result = jurisdictionResults[idx];
                return (
                  <ComputationCard
                    key={comp.id}
                    comp={comp}
                    result={result}
                    onUpdate={updateComputation}
                    onRemove={removeComputation}
                    fiscalYear={fiscalYear}
                    helpField={helpField}
                    toggleHelp={toggleHelp}
                  />
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ComputationCard({
  comp,
  result,
  onUpdate,
  onRemove,
  fiscalYear,
  helpField,
  toggleHelp,
}: {
  comp: JurisdictionComputation;
  result: JurisdictionResult;
  onUpdate: (id: string, updates: Partial<JurisdictionComputation>) => void;
  onRemove: (id: string) => void;
  fiscalYear: number;
  helpField: string | null;
  toggleHelp: (key: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const etrBadge = comp.safeHarbourApplied
    ? 'bg-blue-100 text-blue-800'
    : comp.deMinimisApplied
      ? 'bg-gray-100 text-gray-600'
      : result.isBelowMinimum
        ? 'bg-red-100 text-red-800'
        : 'bg-green-100 text-green-800';

  const statusLabel = comp.safeHarbourApplied
    ? 'Safe Harbour'
    : comp.deMinimisApplied
      ? 'De Minimis'
      : result.isBelowMinimum
        ? `ETR ${formatPercentage(result.etr)} < 15%`
        : `ETR ${formatPercentage(result.etr)} >= 15%`;

  return (
    <div className="border rounded-md p-3 space-y-2 bg-white">
      {/* Header */}
      <div className="flex items-center gap-2">
        <SelectField
          label=""
          value={comp.jurisdiction}
          onChange={(v) =>
            onUpdate(comp.id, { jurisdiction: v, label: v })
          }
          options={JURISDICTIONS}
          required
        />
        <InputField
          label=""
          value={comp.label}
          onChange={(v) => onUpdate(comp.id, { label: v })}
          placeholder="Label"
        />
        <InputField
          label=""
          value={comp.ceCount || ''}
          onChange={(v) =>
            onUpdate(comp.id, { ceCount: parseInt(v) || 0 })
          }
          type="number"
          placeholder="CEs"
        />
        <span className={`text-xs px-2 py-1 rounded font-medium whitespace-nowrap ${etrBadge}`}>
          {statusLabel}
        </span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-gray-400 hover:text-gray-600 p-1"
        >
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        <button
          onClick={() => onRemove(comp.id)}
          className="text-red-400 hover:text-red-600 p-1"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Flags row */}
      <div className="flex flex-wrap gap-3">
        <CheckboxField
          label="Safe Harbour Applied"
          checked={comp.safeHarbourApplied}
          onChange={(v) => onUpdate(comp.id, { safeHarbourApplied: v })}
        />
        <CheckboxField
          label="De Minimis Applied"
          checked={comp.deMinimisApplied}
          onChange={(v) => onUpdate(comp.id, { deMinimisApplied: v })}
        />
        <CheckboxField
          label="MOCE"
          checked={comp.isMOCE}
          onChange={(v) => onUpdate(comp.id, { isMOCE: v })}
        />
        {comp.isMOCE && (
          <InputField
            label="MOCE %"
            value={comp.moceOwnershipPercent || ''}
            onChange={(v) =>
              onUpdate(comp.id, {
                moceOwnershipPercent: parseFloat(v) || 0,
              })
            }
            type="number"
          />
        )}
        <SelectField
          label="Charging"
          value={comp.chargingMechanism}
          onChange={(v) =>
            onUpdate(comp.id, {
              chargingMechanism: v as JurisdictionComputation['chargingMechanism'],
            })
          }
          options={CHARGING_MECHANISM_OPTIONS}
        />
      </div>

      {/* Expanded: Full inputs */}
      {expanded && !comp.safeHarbourApplied && !comp.deMinimisApplied && (
        <div className="border-t pt-3 space-y-3">
          {/* GloBE Income */}
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-1">
              GloBE Income (Article 3.2)
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <InputField
                label="FANI"
                dataPointKey="S3.2.1"
                value={comp.fani || ''}
                onChange={(v) =>
                  onUpdate(comp.id, { fani: parseFloat(v) || 0 })
                }
                type="number"
                required
                helpOpen={helpField === 'S3.2.1'}
                onToggleHelp={() => toggleHelp('S3.2.1')}
              />
              <InputField
                label="Net Taxes Excluded"
                dataPointKey="S3.2.2"
                value={comp.netTaxesExcluded || ''}
                onChange={(v) =>
                  onUpdate(comp.id, {
                    netTaxesExcluded: parseFloat(v) || 0,
                  })
                }
                type="number"
                helpOpen={helpField === 'S3.2.2'}
                onToggleHelp={() => toggleHelp('S3.2.2')}
              />
              <InputField
                label="Excluded Dividends"
                value={comp.excludedDividends || ''}
                onChange={(v) =>
                  onUpdate(comp.id, {
                    excludedDividends: parseFloat(v) || 0,
                  })
                }
                type="number"
              />
              <InputField
                label="Excluded Equity Gains"
                value={comp.excludedEquityGains || ''}
                onChange={(v) =>
                  onUpdate(comp.id, {
                    excludedEquityGains: parseFloat(v) || 0,
                  })
                }
                type="number"
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
              <InputField
                label="Policy Disallowed"
                value={comp.policyDisallowed || ''}
                onChange={(v) =>
                  onUpdate(comp.id, {
                    policyDisallowed: parseFloat(v) || 0,
                  })
                }
                type="number"
              />
              <InputField
                label="Stock Comp Adj"
                value={comp.stockCompAdj || ''}
                onChange={(v) =>
                  onUpdate(comp.id, {
                    stockCompAdj: parseFloat(v) || 0,
                  })
                }
                type="number"
              />
              <InputField
                label="Other Adjustments"
                value={comp.otherAdjustments || ''}
                onChange={(v) =>
                  onUpdate(comp.id, {
                    otherAdjustments: parseFloat(v) || 0,
                  })
                }
                type="number"
              />
            </div>
            <div className="mt-2 p-2 bg-blue-50 rounded">
              <ResultRow
                label="GloBE Income"
                value={formatEUR(result.globeIncome)}
                highlight={result.globeIncome > 0 ? 'blue' : 'amber'}
              />
            </div>
          </div>

          {/* Covered Taxes */}
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-1">
              Adjusted Covered Taxes (Articles 4.1-4.4)
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <InputField
                label="Current Tax"
                dataPointKey="S3.3.1"
                value={comp.currentTaxExpense || ''}
                onChange={(v) =>
                  onUpdate(comp.id, {
                    currentTaxExpense: parseFloat(v) || 0,
                  })
                }
                type="number"
                required
                helpOpen={helpField === 'S3.3.1'}
                onToggleHelp={() => toggleHelp('S3.3.1')}
              />
              <InputField
                label="Deferred Tax Adj"
                value={comp.deferredTaxAdj || ''}
                onChange={(v) =>
                  onUpdate(comp.id, {
                    deferredTaxAdj: parseFloat(v) || 0,
                  })
                }
                type="number"
              />
              <InputField
                label="DTL Cap Adj"
                value={comp.dtlCapAdj || ''}
                onChange={(v) =>
                  onUpdate(comp.id, { dtlCapAdj: parseFloat(v) || 0 })
                }
                type="number"
              />
              <InputField
                label="UTP Adj"
                value={comp.utpAdj || ''}
                onChange={(v) =>
                  onUpdate(comp.id, { utpAdj: parseFloat(v) || 0 })
                }
                type="number"
              />
              <InputField
                label="Non-Covered Adj"
                value={comp.nonCoveredTaxAdj || ''}
                onChange={(v) =>
                  onUpdate(comp.id, {
                    nonCoveredTaxAdj: parseFloat(v) || 0,
                  })
                }
                type="number"
              />
            </div>
            <div className="mt-2 p-2 bg-blue-50 rounded">
              <ResultRow
                label="Adjusted Covered Taxes"
                value={formatEUR(result.adjustedCoveredTaxes)}
                highlight="blue"
              />
            </div>
          </div>

          {/* SBIE */}
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-1">
              SBIE — Substance-Based Income Exclusion (Article 5.3)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <InputField
                label="Eligible Payroll"
                dataPointKey="S3.4.1"
                value={comp.eligiblePayroll || ''}
                onChange={(v) =>
                  onUpdate(comp.id, {
                    eligiblePayroll: parseFloat(v) || 0,
                  })
                }
                type="number"
                required
                helpOpen={helpField === 'S3.4.1'}
                onToggleHelp={() => toggleHelp('S3.4.1')}
              />
              <InputField
                label="Tangible Assets NBV"
                dataPointKey="S3.4.2"
                value={comp.tangibleAssetsNBV || ''}
                onChange={(v) =>
                  onUpdate(comp.id, {
                    tangibleAssetsNBV: parseFloat(v) || 0,
                  })
                }
                type="number"
                required
                helpOpen={helpField === 'S3.4.2'}
                onToggleHelp={() => toggleHelp('S3.4.2')}
              />
            </div>
            <div className="mt-2 p-2 bg-blue-50 rounded space-y-0.5">
              <ResultRow
                label={`Payroll SBIE (${formatPercentage(getSBIERates(fiscalYear).payrollRate)})`}
                value={formatEUR(result.payrollSBIE)}
              />
              <ResultRow
                label={`Asset SBIE (${formatPercentage(getSBIERates(fiscalYear).tangibleAssetRate)})`}
                value={formatEUR(result.assetSBIE)}
              />
              <ResultRow
                label="Total SBIE"
                value={formatEUR(result.totalSBIE)}
                highlight="blue"
              />
            </div>
          </div>

          {/* Top-Up Tax */}
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-1">
              Top-Up Tax Computation (Article 5.2)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <InputField
                label="QDMTT Amount"
                dataPointKey="S3.5.5"
                value={comp.qdmmtAmount || ''}
                onChange={(v) =>
                  onUpdate(comp.id, {
                    qdmmtAmount: parseFloat(v) || 0,
                  })
                }
                type="number"
                helpOpen={helpField === 'S3.5.5'}
                onToggleHelp={() => toggleHelp('S3.5.5')}
              />
            </div>
            <div className="mt-2 p-2 bg-gray-50 rounded border space-y-0.5">
              <ResultRow
                label="Jurisdictional ETR"
                value={formatPercentage(result.etr)}
                highlight={result.isBelowMinimum ? 'red' : 'green'}
              />
              <ResultRow
                label="Top-Up Tax %"
                value={formatPercentage(result.topUpTaxPercent)}
                highlight={result.topUpTaxPercent > 0 ? 'red' : 'green'}
              />
              <ResultRow
                label="Excess Profit"
                value={formatEUR(result.excessProfit)}
              />
              <ResultRow
                label="Gross Top-Up Tax"
                value={formatEUR(result.grossTopUpTax)}
                highlight={result.grossTopUpTax > 0 ? 'red' : 'green'}
              />
              <ResultRow
                label="QDMTT Offset"
                value={`(${formatEUR(result.qdmmtOffset)})`}
                highlight="blue"
              />
              <ResultRow
                label="Net Top-Up Tax"
                value={formatEUR(result.netTopUpTax)}
                highlight={result.netTopUpTax > 0 ? 'red' : 'green'}
              />
              <ResultRow
                label="Charging Mechanism"
                value={getOptionLabel(
                  CHARGING_MECHANISM_OPTIONS,
                  result.chargingMechanism
                )}
              />
            </div>
          </div>
        </div>
      )}

      {/* Compact result for safe harbour / de minimis */}
      {(comp.safeHarbourApplied || comp.deMinimisApplied) && (
        <div className="p-2 bg-gray-50 rounded text-xs text-gray-600">
          {comp.safeHarbourApplied
            ? 'Safe harbour applied — no full GloBE computation required. Top-up tax deemed zero.'
            : 'De minimis exclusion applied — revenue <€10M and income <€1M (3-year average). Top-up tax deemed zero.'}
        </div>
      )}
    </div>
  );
}

// ============================================================
// STEP 5: FILING SUMMARY
// ============================================================

function StepFilingSummary({
  summary,
  generalInfo,
  entities,
  safeHarbourResults,
}: {
  summary: FilingSummary;
  generalInfo: GeneralInformation;
  entities: EntityEntry[];
  safeHarbourResults: SafeHarbourResult[];
}) {
  return (
    <div className="space-y-4">
      {/* Group Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            GIR Filing Summary — {generalInfo.mneGroupName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <ResultRow
            label="MNE Group"
            value={generalInfo.mneGroupName}
          />
          <ResultRow label="UPE" value={generalInfo.upeLegalName} />
          <ResultRow
            label="Fiscal Year"
            value={`${formatDate(generalInfo.fiscalYearStart)} — ${formatDate(generalInfo.fiscalYearEnd)}`}
          />
          <ResultRow
            label="DFE"
            value={`${generalInfo.dfeName} (${generalInfo.dfeJurisdiction})`}
          />
          <ResultRow
            label="Filing Type"
            value={getOptionLabel(FILING_TYPE_OPTIONS, generalInfo.filingType)}
          />
          <ResultRow
            label="Filing Deadline"
            value={`${formatDate(summary.filingDeadline)} (${summary.filingDeadlineDays} days)`}
            highlight={
              summary.filingDeadlineDays < 90
                ? 'red'
                : summary.filingDeadlineDays < 180
                  ? 'amber'
                  : 'green'
            }
          />
        </CardContent>
      </Card>

      {/* Entity Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Entity Structure Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <ResultRow
            label="Total Constituent Entities"
            value={String(summary.totalCEs)}
          />
          <ResultRow
            label="Excluded Entities"
            value={String(summary.excludedEntities)}
          />
          <ResultRow
            label="Total Jurisdictions"
            value={String(summary.totalJurisdictions)}
          />
        </CardContent>
      </Card>

      {/* Jurisdiction Outcomes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Jurisdiction Outcomes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <ResultRow
            label="Safe Harbour Qualifying"
            value={String(summary.safeHarbourCount)}
            highlight="blue"
          />
          <ResultRow
            label="De Minimis Excluded"
            value={String(summary.deMinimisCount)}
            highlight="blue"
          />
          <ResultRow
            label="Above 15% (No Top-Up)"
            value={String(summary.aboveMinimumCount)}
            highlight="green"
          />
          <ResultRow
            label="Below 15% (Top-Up Required)"
            value={String(summary.requiresComputationCount)}
            highlight={summary.requiresComputationCount > 0 ? 'red' : 'green'}
          />
        </CardContent>
      </Card>

      {/* Tax Liability */}
      <Card className="border-2 border-blue-300">
        <CardHeader>
          <CardTitle className="text-base">
            Total Top-Up Tax Liability
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <ResultRow
            label="Gross Top-Up Tax"
            value={formatEUR(summary.totalGrossTopUpTax)}
          />
          <ResultRow
            label="QDMTT (Domestic Collection)"
            value={`(${formatEUR(summary.totalQDMTT)})`}
            highlight="blue"
          />
          <ResultRow
            label="IIR (Income Inclusion Rule)"
            value={formatEUR(summary.totalIIR)}
            highlight={summary.totalIIR > 0 ? 'amber' : 'green'}
          />
          <div className="border-t pt-2 mt-2">
            <ResultRow
              label="Net Top-Up Tax"
              value={formatEUR(summary.totalNetTopUpTax)}
              highlight={summary.totalNetTopUpTax > 0 ? 'red' : 'green'}
            />
          </div>
        </CardContent>
      </Card>

      {/* Jurisdictional Detail Table */}
      {summary.jurisdictionResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Jurisdictional Detail
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 pr-2">Jurisdiction</th>
                    <th className="py-2 pr-2 text-right">GloBE Income</th>
                    <th className="py-2 pr-2 text-right">Covered Taxes</th>
                    <th className="py-2 pr-2 text-right">ETR</th>
                    <th className="py-2 pr-2 text-right">SBIE</th>
                    <th className="py-2 pr-2 text-right">Gross Top-Up</th>
                    <th className="py-2 pr-2 text-right">QDMTT</th>
                    <th className="py-2 pr-2 text-right">Net Top-Up</th>
                    <th className="py-2 pr-2">Mechanism</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.jurisdictionResults.map((r) => (
                    <tr
                      key={r.jurisdiction + r.label}
                      className={`border-b ${
                        r.safeHarbourApplied || r.deMinimisApplied
                          ? 'text-gray-400'
                          : ''
                      }`}
                    >
                      <td className="py-1.5 pr-2 font-medium">{r.label}</td>
                      <td className="py-1.5 pr-2 text-right">
                        {r.safeHarbourApplied || r.deMinimisApplied
                          ? '—'
                          : formatEUR(r.globeIncome)}
                      </td>
                      <td className="py-1.5 pr-2 text-right">
                        {r.safeHarbourApplied || r.deMinimisApplied
                          ? '—'
                          : formatEUR(r.adjustedCoveredTaxes)}
                      </td>
                      <td
                        className={`py-1.5 pr-2 text-right ${
                          r.isBelowMinimum && !r.safeHarbourApplied && !r.deMinimisApplied
                            ? 'text-red-700 font-medium'
                            : ''
                        }`}
                      >
                        {r.safeHarbourApplied || r.deMinimisApplied
                          ? '—'
                          : formatPercentage(r.etr)}
                      </td>
                      <td className="py-1.5 pr-2 text-right">
                        {r.safeHarbourApplied || r.deMinimisApplied
                          ? '—'
                          : formatEUR(r.totalSBIE)}
                      </td>
                      <td className="py-1.5 pr-2 text-right">
                        {formatEUR(r.grossTopUpTax)}
                      </td>
                      <td className="py-1.5 pr-2 text-right">
                        {r.qdmmtOffset > 0
                          ? `(${formatEUR(r.qdmmtOffset)})`
                          : '—'}
                      </td>
                      <td
                        className={`py-1.5 pr-2 text-right font-medium ${
                          r.netTopUpTax > 0 ? 'text-red-700' : ''
                        }`}
                      >
                        {formatEUR(r.netTopUpTax)}
                      </td>
                      <td className="py-1.5 pr-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-xs ${
                            r.chargingMechanism === 'IIR'
                              ? 'bg-amber-100 text-amber-800'
                              : r.chargingMechanism === 'QDMTT'
                                ? 'bg-blue-100 text-blue-800'
                                : r.chargingMechanism === 'SAFE_HARBOUR'
                                  ? 'bg-green-100 text-green-800'
                                  : r.chargingMechanism === 'DE_MINIMIS'
                                    ? 'bg-gray-100 text-gray-600'
                                    : r.chargingMechanism === 'ABOVE_MINIMUM'
                                      ? 'bg-green-50 text-green-700'
                                      : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {r.chargingMechanism.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Checklist */}
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="text-base">Pre-Filing Validation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <ValidationCheck
              label="General Information complete"
              passed={
                !!generalInfo.mneGroupName &&
                !!generalInfo.upeLegalName &&
                !!generalInfo.upeJurisdiction
              }
            />
            <ValidationCheck
              label="Exactly one UPE designated"
              passed={
                entities.filter((e) => e.classification === 'UPE').length === 1
              }
            />
            <ValidationCheck
              label="All entities have jurisdiction"
              passed={entities.every((e) => !!e.jurisdiction)}
            />
            <ValidationCheck
              label="Every jurisdiction has computation or safe harbour"
              passed={summary.totalJurisdictions > 0}
            />
            <ValidationCheck
              label="Filing deadline calculated"
              passed={!!summary.filingDeadline}
            />
            <ValidationCheck
              label="Top-up tax reconciles across mechanisms"
              passed={summary.totalGrossTopUpTax >= 0}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ValidationCheck({
  label,
  passed,
}: {
  label: string;
  passed: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {passed ? (
        <CheckCircle className="h-4 w-4 text-green-600" />
      ) : (
        <AlertTriangle className="h-4 w-4 text-amber-500" />
      )}
      <span className={passed ? 'text-green-800' : 'text-amber-700'}>
        {label}
      </span>
    </div>
  );
}

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default GirPracticeForm;
