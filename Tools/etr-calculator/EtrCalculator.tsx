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
  Calculator,
  BarChart3,
  FileText,
  TrendingDown,
  TrendingUp,
  Shield,
  Building,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type {
  JurisdictionEntry,
  IncomeAdjustment,
  CoveredTaxEntry,
  AdjustmentCategory,
  CoveredTaxCategory,
  ComputationResult,
  EtrStep,
  EtrCalculatorProps,
  SavedComputation,
  ValidationError,
} from './types';
import {
  STEP_CONFIGS,
  ETR_STEPS,
  JURISDICTIONS,
  FISCAL_YEAR_OPTIONS,
  ADJUSTMENT_CATEGORY_OPTIONS,
  COVERED_TAX_CATEGORY_OPTIONS,
  STEP_EDUCATIONAL_NOTES,
  ADJUSTMENT_CATEGORY_INFO,
  COVERED_TAX_CATEGORY_INFO,
  SBIE_TRANSITIONAL_RATES,
  CASE_STUDY_JURISDICTIONS,
  CASE_STUDY_GERMANY_ONLY,
  MINIMUM_ETR,
  createEmptyJurisdiction,
  createEmptyAdjustment,
  createEmptyTaxEntry,
  generateId,
  computeAllJurisdictions,
  computeGloBEIncome,
  computeCoveredTaxes,
  getSBIERate,
  validateJurisdictionSetup,
  validateGloBEIncome,
  validateCoveredTaxes,
  formatEUR,
  formatPercent,
  formatPercentDirect,
  getETRStatusColour,
  getStatusLabel,
  getOptionLabel,
  roundTo2,
} from './utils';

// ============================================================
// MAIN COMPONENT
// ============================================================

export function EtrCalculator({
  userId,
  onSave,
  onDelete,
  savedItems = [],
  onTrackCalculation,
  onTrackStepChange,
  onTrackError,
  onTrackCompletion,
}: EtrCalculatorProps) {
  // --- State ---
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [fiscalYear, setFiscalYear] = useState(2025);
  const [jurisdictions, setJurisdictions] = useState<JurisdictionEntry[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [showEducationalNote, setShowEducationalNote] = useState(true);
  const [expandedJurisdiction, setExpandedJurisdiction] = useState<
    string | null
  >(null);
  const [showCategoryGuide, setShowCategoryGuide] = useState<string | null>(
    null
  );
  const [loadMenuOpen, setLoadMenuOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [scenarioComparison, setScenarioComparison] = useState(false);

  const currentStep = STEP_CONFIGS[currentStepIndex];

  // --- Computed ---
  const computationResult = useMemo<ComputationResult | null>(() => {
    if (jurisdictions.length === 0) return null;
    return computeAllJurisdictions(jurisdictions);
  }, [jurisdictions]);

  // Scenario B: with SBC election toggled
  const scenarioResult = useMemo<ComputationResult | null>(() => {
    if (!scenarioComparison || jurisdictions.length === 0) return null;
    const toggled = jurisdictions.map((j) => ({
      ...j,
      incomeAdjustments: j.incomeAdjustments.map((adj) => {
        if (adj.isElective && adj.category === 'SBC') {
          // Toggle: if amount is 0, apply the typical SBC election effect
          // (add back IFRS expense, use tax deduction instead)
          // For the H&C scenario: IFRS expense €2.4M, tax deduction €1.8M
          // Net: +€600,000 increase to GloBE Income
          return {
            ...adj,
            amount: adj.amount === 0 ? 600_000 : 0,
            description:
              adj.amount === 0
                ? 'SBC election MADE — IFRS expense €2.4M replaced by tax deduction €1.8M'
                : 'SBC election NOT made — no adjustment',
          };
        }
        return adj;
      }),
    }));
    return computeAllJurisdictions(toggled);
  }, [scenarioComparison, jurisdictions]);

  // --- Navigation ---
  const canGoNext = useCallback((): boolean => {
    if (currentStepIndex === 0) {
      return validateJurisdictionSetup(jurisdictions).length === 0;
    }
    return true;
  }, [currentStepIndex, jurisdictions]);

  const goNext = useCallback(() => {
    if (currentStepIndex === 0) {
      const validationErrors = validateJurisdictionSetup(jurisdictions);
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        onTrackError?.(validationErrors[0].message, {
          step: currentStep.key,
        });
        return;
      }
    }
    if (currentStepIndex === 1) {
      const warnings = validateGloBEIncome(jurisdictions);
      // Warnings don't block navigation, just display
      if (warnings.length > 0) {
        setErrors(warnings);
      }
    }
    if (currentStepIndex === 2) {
      const warnings = validateCoveredTaxes(jurisdictions);
      if (warnings.length > 0) {
        setErrors(warnings);
      }
      if (computationResult) {
        onTrackCalculation?.('etr_computed', {
          jurisdictionCount: jurisdictions.length,
          totalTopUpTax: computationResult.totalTopUpTax,
          lowTaxedCount: computationResult.lowTaxedCount,
        });
      }
    }

    setErrors([]);
    const nextIndex = Math.min(currentStepIndex + 1, ETR_STEPS.length - 1);
    onTrackStepChange?.(currentStep.key, STEP_CONFIGS[nextIndex].key);
    setCurrentStepIndex(nextIndex);

    if (nextIndex === ETR_STEPS.length - 1 && computationResult) {
      onTrackCompletion?.({
        totalTopUpTax: computationResult.totalTopUpTax,
        totalGloBEIncome: computationResult.totalGloBEIncome,
        jurisdictionCount: jurisdictions.length,
        lowTaxedCount: computationResult.lowTaxedCount,
      });
    }
  }, [
    currentStepIndex,
    jurisdictions,
    computationResult,
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

  // --- Jurisdiction CRUD ---
  const addJurisdiction = useCallback(() => {
    setJurisdictions((prev) => [...prev, createEmptyJurisdiction(fiscalYear)]);
  }, [fiscalYear]);

  const updateJurisdiction = useCallback(
    (id: string, updates: Partial<JurisdictionEntry>) => {
      setJurisdictions((prev) =>
        prev.map((j) => (j.id === id ? { ...j, ...updates } : j))
      );
    },
    []
  );

  const removeJurisdiction = useCallback((id: string) => {
    setJurisdictions((prev) => prev.filter((j) => j.id !== id));
  }, []);

  // --- Adjustment CRUD ---
  const addAdjustment = useCallback((jurisdictionId: string) => {
    setJurisdictions((prev) =>
      prev.map((j) =>
        j.id === jurisdictionId
          ? {
              ...j,
              incomeAdjustments: [
                ...j.incomeAdjustments,
                createEmptyAdjustment(),
              ],
            }
          : j
      )
    );
  }, []);

  const updateAdjustment = useCallback(
    (
      jurisdictionId: string,
      adjustmentId: string,
      updates: Partial<IncomeAdjustment>
    ) => {
      setJurisdictions((prev) =>
        prev.map((j) =>
          j.id === jurisdictionId
            ? {
                ...j,
                incomeAdjustments: j.incomeAdjustments.map((a) =>
                  a.id === adjustmentId ? { ...a, ...updates } : a
                ),
              }
            : j
        )
      );
    },
    []
  );

  const removeAdjustment = useCallback(
    (jurisdictionId: string, adjustmentId: string) => {
      setJurisdictions((prev) =>
        prev.map((j) =>
          j.id === jurisdictionId
            ? {
                ...j,
                incomeAdjustments: j.incomeAdjustments.filter(
                  (a) => a.id !== adjustmentId
                ),
              }
            : j
        )
      );
    },
    []
  );

  // --- Tax Entry CRUD ---
  const addTaxEntry = useCallback((jurisdictionId: string) => {
    setJurisdictions((prev) =>
      prev.map((j) =>
        j.id === jurisdictionId
          ? {
              ...j,
              coveredTaxEntries: [
                ...j.coveredTaxEntries,
                createEmptyTaxEntry(),
              ],
            }
          : j
      )
    );
  }, []);

  const updateTaxEntry = useCallback(
    (
      jurisdictionId: string,
      entryId: string,
      updates: Partial<CoveredTaxEntry>
    ) => {
      setJurisdictions((prev) =>
        prev.map((j) =>
          j.id === jurisdictionId
            ? {
                ...j,
                coveredTaxEntries: j.coveredTaxEntries.map((e) =>
                  e.id === entryId ? { ...e, ...updates } : e
                ),
              }
            : j
        )
      );
    },
    []
  );

  const removeTaxEntry = useCallback(
    (jurisdictionId: string, entryId: string) => {
      setJurisdictions((prev) =>
        prev.map((j) =>
          j.id === jurisdictionId
            ? {
                ...j,
                coveredTaxEntries: j.coveredTaxEntries.filter(
                  (e) => e.id !== entryId
                ),
              }
            : j
        )
      );
    },
    []
  );

  // --- Load H&C Scenario ---
  const loadFullScenario = useCallback(() => {
    setJurisdictions(
      CASE_STUDY_JURISDICTIONS.map((j) => ({
        ...j,
        id: generateId('JUR'),
        incomeAdjustments: j.incomeAdjustments.map((a) => ({
          ...a,
          id: generateId('ADJ'),
        })),
        coveredTaxEntries: j.coveredTaxEntries.map((e) => ({
          ...e,
          id: generateId('TAX'),
        })),
      }))
    );
    setFiscalYear(2025);
    setCurrentStepIndex(0);
    setErrors([]);
    onTrackCalculation?.('scenario_loaded', { scenario: 'stratos_full' });
  }, [onTrackCalculation]);

  const loadGermanyScenario = useCallback(() => {
    setJurisdictions(
      CASE_STUDY_GERMANY_ONLY.map((j) => ({
        ...j,
        id: generateId('JUR'),
        incomeAdjustments: j.incomeAdjustments.map((a) => ({
          ...a,
          id: generateId('ADJ'),
        })),
        coveredTaxEntries: j.coveredTaxEntries.map((e) => ({
          ...e,
          id: generateId('TAX'),
        })),
      }))
    );
    setFiscalYear(2025);
    setCurrentStepIndex(0);
    setErrors([]);
    onTrackCalculation?.('scenario_loaded', {
      scenario: 'stratos_germany',
    });
  }, [onTrackCalculation]);

  // --- Save/Load ---
  const handleSave = useCallback(async () => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      await onSave({
        name: `ETR Computation — FY ${fiscalYear}`,
        fiscalYear,
        jurisdictions,
      });
    } finally {
      setIsSaving(false);
    }
  }, [onSave, fiscalYear, jurisdictions]);

  const handleLoad = useCallback(
    (item: SavedComputation) => {
      setJurisdictions(item.jurisdictions);
      setFiscalYear(item.fiscalYear);
      setCurrentStepIndex(0);
      setErrors([]);
      setLoadMenuOpen(false);
      onTrackCalculation?.('computation_loaded', { name: item.name });
    },
    [onTrackCalculation]
  );

  // ============================================================
  // RENDER — Step Progress Bar
  // ============================================================

  const renderStepBar = () => (
    <div className="flex items-center justify-between mb-6">
      {STEP_CONFIGS.map((step, idx) => {
        const isActive = idx === currentStepIndex;
        const isCompleted = idx < currentStepIndex;
        return (
          <React.Fragment key={step.key}>
            {idx > 0 && (
              <div
                className={`flex-1 h-0.5 mx-2 ${
                  isCompleted ? 'bg-blue-500' : 'bg-gray-200'
                }`}
              />
            )}
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : isCompleted
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  idx + 1
                )}
              </div>
              <span
                className={`text-xs mt-1 ${
                  isActive ? 'text-blue-600 font-medium' : 'text-gray-500'
                }`}
              >
                {step.shortLabel}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );

  // ============================================================
  // RENDER — Educational Note
  // ============================================================

  const renderEducationalNote = () => (
    <div className="mb-4">
      <button
        onClick={() => setShowEducationalNote(!showEducationalNote)}
        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
      >
        <Info className="w-4 h-4" />
        <span>{currentStep.label} — {currentStep.articleRef}</span>
        {showEducationalNote ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )}
      </button>
      {showEducationalNote && (
        <div className="mt-2 p-3 bg-blue-50 rounded-lg text-sm text-blue-800 leading-relaxed">
          {STEP_EDUCATIONAL_NOTES[currentStep.key]}
        </div>
      )}
    </div>
  );

  // ============================================================
  // RENDER — Error Display
  // ============================================================

  const renderErrors = () => {
    if (errors.length === 0) return null;
    return (
      <div className="mb-4 p-3 bg-red-50 rounded-lg">
        {errors.map((err, idx) => (
          <div
            key={idx}
            className="flex items-start gap-2 text-sm text-red-700"
          >
            <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{err.message}</span>
          </div>
        ))}
      </div>
    );
  };

  // ============================================================
  // RENDER — Step 1: Jurisdiction Setup
  // ============================================================

  const renderJurisdictionSetup = () => (
    <div className="space-y-4">
      {/* Fiscal Year */}
      <div className="flex items-center gap-4 mb-4">
        <label className="text-sm font-medium text-gray-700">
          Fiscal Year:
        </label>
        <select
          value={fiscalYear}
          onChange={(e) => {
            const fy = parseInt(e.target.value, 10);
            setFiscalYear(fy);
            setJurisdictions((prev) =>
              prev.map((j) => ({ ...j, fiscalYear: fy }))
            );
          }}
          className="px-3 py-1.5 border rounded-md text-sm"
        >
          {FISCAL_YEAR_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="text-xs text-gray-500">
          SBIE rates: {formatPercentDirect(getSBIERate(fiscalYear).payrollRate * 100)} payroll /{' '}
          {formatPercentDirect(getSBIERate(fiscalYear).assetRate * 100)} assets
        </span>
      </div>

      {/* H&C Scenario Buttons */}
      <div className="flex gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={loadFullScenario}
          className="text-xs"
        >
          <Building className="w-3 h-3 mr-1" />
          Load Stratos Group (6 jurisdictions)
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={loadGermanyScenario}
          className="text-xs"
        >
          <FileText className="w-3 h-3 mr-1" />
          Load Germany Only (S3 detail)
        </Button>
      </div>

      {/* Jurisdiction List */}
      {jurisdictions.map((jur) => (
        <Card key={jur.id} className="border">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Jurisdiction */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Jurisdiction
                </label>
                <select
                  value={jur.jurisdiction}
                  onChange={(e) => {
                    const newJur = e.target.value;
                    updateJurisdiction(jur.id, {
                      jurisdiction: newJur,
                      label: jur.label || newJur,
                    });
                  }}
                  className="w-full px-2 py-1.5 border rounded text-sm"
                >
                  <option value="">Select...</option>
                  {JURISDICTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Display Label */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Display Label
                </label>
                <input
                  type="text"
                  value={jur.label}
                  onChange={(e) =>
                    updateJurisdiction(jur.id, { label: e.target.value })
                  }
                  placeholder="e.g. Ireland (Main Group)"
                  className="w-full px-2 py-1.5 border rounded text-sm"
                />
              </div>

              {/* Eligible Payroll */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Eligible Payroll (€)
                </label>
                <input
                  type="number"
                  value={jur.eligiblePayroll || ''}
                  onChange={(e) =>
                    updateJurisdiction(jur.id, {
                      eligiblePayroll: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-2 py-1.5 border rounded text-sm"
                />
              </div>

              {/* Tangible Assets */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Tangible Asset NBV (€)
                </label>
                <input
                  type="number"
                  value={jur.tangibleAssetNBV || ''}
                  onChange={(e) =>
                    updateJurisdiction(jur.id, {
                      tangibleAssetNBV: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-2 py-1.5 border rounded text-sm"
                />
              </div>

              {/* MOCE */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    checked={jur.isMOCE}
                    onChange={(e) =>
                      updateJurisdiction(jur.id, {
                        isMOCE: e.target.checked,
                      })
                    }
                  />
                  MOCE (Art. 5.6)
                </label>
                {jur.isMOCE && (
                  <input
                    type="number"
                    value={jur.moceOwnershipPercent || ''}
                    onChange={(e) =>
                      updateJurisdiction(jur.id, {
                        moceOwnershipPercent:
                          parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="%"
                    className="w-20 px-2 py-1 border rounded text-sm"
                  />
                )}
              </div>

              {/* De Minimis */}
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    checked={jur.hasDeMinimisData}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      updateJurisdiction(jur.id, {
                        hasDeMinimisData: checked,
                        deMinimisData: checked
                          ? {
                              year1Revenue: 0,
                              year1Income: 0,
                              year2Revenue: 0,
                              year2Income: 0,
                              year3Revenue: 0,
                              year3Income: 0,
                            }
                          : null,
                      });
                    }}
                  />
                  De Minimis Data (Art. 5.5)
                </label>
              </div>
            </div>

            {/* De Minimis Data Entry */}
            {jur.hasDeMinimisData && jur.deMinimisData && (
              <div className="mt-3 p-3 bg-gray-50 rounded">
                <p className="text-xs font-medium text-gray-600 mb-2">
                  3-Year Revenue and Income History (for de minimis test)
                </p>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                  {['Year 1', 'Year 2', 'Year 3'].map((yr, idx) => (
                    <React.Fragment key={yr}>
                      <div>
                        <label className="block text-xs text-gray-500">
                          {yr} Revenue (€)
                        </label>
                        <input
                          type="number"
                          value={
                            idx === 0
                              ? jur.deMinimisData!.year1Revenue || ''
                              : idx === 1
                                ? jur.deMinimisData!.year2Revenue || ''
                                : jur.deMinimisData!.year3Revenue || ''
                          }
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const key =
                              idx === 0
                                ? 'year1Revenue'
                                : idx === 1
                                  ? 'year2Revenue'
                                  : 'year3Revenue';
                            updateJurisdiction(jur.id, {
                              deMinimisData: {
                                ...jur.deMinimisData!,
                                [key]: val,
                              },
                            });
                          }}
                          className="w-full px-2 py-1 border rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500">
                          {yr} Income (€)
                        </label>
                        <input
                          type="number"
                          value={
                            idx === 0
                              ? jur.deMinimisData!.year1Income || ''
                              : idx === 1
                                ? jur.deMinimisData!.year2Income || ''
                                : jur.deMinimisData!.year3Income || ''
                          }
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const key =
                              idx === 0
                                ? 'year1Income'
                                : idx === 1
                                  ? 'year2Income'
                                  : 'year3Income';
                            updateJurisdiction(jur.id, {
                              deMinimisData: {
                                ...jur.deMinimisData!,
                                [key]: val,
                              },
                            });
                          }}
                          className="w-full px-2 py-1 border rounded text-xs"
                        />
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            {/* Remove button */}
            <div className="mt-3 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeJurisdiction(jur.id)}
                className="text-red-500 hover:text-red-700 text-xs"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Remove
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" onClick={addJurisdiction} className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Add Jurisdiction
      </Button>
    </div>
  );

  // ============================================================
  // RENDER — Step 2: GloBE Income
  // ============================================================

  const renderGloBEIncome = () => (
    <div className="space-y-4">
      {jurisdictions.map((jur) => {
        const incomeResult = computeGloBEIncome(jur);
        const isExpanded = expandedJurisdiction === jur.id;

        return (
          <Card key={jur.id} className="border">
            <CardHeader
              className="cursor-pointer py-3"
              onClick={() =>
                setExpandedJurisdiction(isExpanded ? null : jur.id)
              }
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  {jur.label || jur.jurisdiction}
                </CardTitle>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono">
                    GloBE Income: {formatEUR(incomeResult.globeIncome)}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </div>
            </CardHeader>
            {isExpanded && (
              <CardContent className="pt-0 pb-4 space-y-3">
                {/* FANI */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Accounting Net Income (€)
                    </label>
                    <input
                      type="number"
                      value={jur.accountingNetIncome || ''}
                      onChange={(e) =>
                        updateJurisdiction(jur.id, {
                          accountingNetIncome:
                            parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-2 py-1.5 border rounded text-sm"
                    />
                    <p className="text-xs text-gray-400 mt-0.5">
                      Net income per financial statements (after tax)
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Add Back: Covered Tax Expense (€)
                    </label>
                    <input
                      type="number"
                      value={jur.coveredTaxAddBack || ''}
                      onChange={(e) =>
                        updateJurisdiction(jur.id, {
                          coveredTaxAddBack:
                            parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-2 py-1.5 border rounded text-sm"
                    />
                    <p className="text-xs text-gray-400 mt-0.5">
                      Tax expense excluded from FANI per Art. 3.1.2
                    </p>
                  </div>
                </div>

                <div className="p-2 bg-gray-50 rounded text-sm">
                  <strong>FANI (Art. 3.1.2):</strong>{' '}
                  {formatEUR(incomeResult.fani)}
                </div>

                {/* Article 3.2 Adjustments */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-medium text-gray-700">
                      Article 3.2 Adjustments
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => addAdjustment(jur.id)}
                      className="text-xs"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add
                    </Button>
                  </div>

                  {jur.incomeAdjustments.map((adj) => (
                    <div
                      key={adj.id}
                      className="flex items-start gap-2 mb-2 p-2 bg-white border rounded"
                    >
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                        <select
                          value={adj.category}
                          onChange={(e) => {
                            const cat = e.target
                              .value as AdjustmentCategory;
                            const info = ADJUSTMENT_CATEGORY_INFO[cat];
                            updateAdjustment(jur.id, adj.id, {
                              category: cat,
                              articleRef: info.articleRef,
                              isElective: cat === 'SBC',
                            });
                          }}
                          className="px-2 py-1 border rounded text-xs"
                        >
                          {ADJUSTMENT_CATEGORY_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={adj.description}
                          onChange={(e) =>
                            updateAdjustment(jur.id, adj.id, {
                              description: e.target.value,
                            })
                          }
                          placeholder="Description"
                          className="px-2 py-1 border rounded text-xs"
                        />
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={adj.amount || ''}
                            onChange={(e) =>
                              updateAdjustment(jur.id, adj.id, {
                                amount: parseFloat(e.target.value) || 0,
                              })
                            }
                            placeholder="Amount (€)"
                            className="w-full px-2 py-1 border rounded text-xs"
                          />
                          {adj.isElective && (
                            <span className="text-xs text-amber-600 whitespace-nowrap">
                              Elective
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          setShowCategoryGuide(
                            showCategoryGuide === adj.id ? null : adj.id
                          )
                        }
                        className="text-gray-400 hover:text-blue-500"
                      >
                        <Info className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeAdjustment(jur.id, adj.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      {showCategoryGuide === adj.id && (
                        <div className="absolute mt-6 p-2 bg-blue-50 rounded text-xs text-blue-800 max-w-sm z-10 shadow-lg">
                          {ADJUSTMENT_CATEGORY_INFO[adj.category].guidance}
                        </div>
                      )}
                    </div>
                  ))}

                  {jur.incomeAdjustments.length === 0 && (
                    <p className="text-xs text-gray-400 italic">
                      No adjustments — FANI equals GloBE Income
                    </p>
                  )}
                </div>

                {/* Summary */}
                <div className="p-2 bg-green-50 rounded text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>FANI (Art. 3.1.2):</span>
                    <span className="font-mono">
                      {formatEUR(incomeResult.fani)}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Article 3.2 Adjustments:</span>
                    <span className="font-mono">
                      {incomeResult.totalAdjustments >= 0 ? '+' : ''}
                      {formatEUR(incomeResult.totalAdjustments)}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-1">
                    <span>GloBE Income:</span>
                    <span className="font-mono">
                      {formatEUR(incomeResult.globeIncome)}
                    </span>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );

  // ============================================================
  // RENDER — Step 3: Covered Taxes
  // ============================================================

  const renderCoveredTaxes = () => (
    <div className="space-y-4">
      {jurisdictions.map((jur) => {
        const taxResult = computeCoveredTaxes(jur);
        const isExpanded = expandedJurisdiction === jur.id;

        return (
          <Card key={jur.id} className="border">
            <CardHeader
              className="cursor-pointer py-3"
              onClick={() =>
                setExpandedJurisdiction(isExpanded ? null : jur.id)
              }
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  {jur.label || jur.jurisdiction}
                </CardTitle>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono">
                    Covered Taxes:{' '}
                    {formatEUR(taxResult.adjustedCoveredTaxes)}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </div>
            </CardHeader>
            {isExpanded && (
              <CardContent className="pt-0 pb-4 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-medium text-gray-700">
                    Covered Tax Components
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addTaxEntry(jur.id)}
                    className="text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Entry
                  </Button>
                </div>

                {jur.coveredTaxEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start gap-2 mb-2 p-2 bg-white border rounded"
                  >
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                      <select
                        value={entry.category}
                        onChange={(e) => {
                          const cat = e.target
                            .value as CoveredTaxCategory;
                          const info = COVERED_TAX_CATEGORY_INFO[cat];
                          updateTaxEntry(jur.id, entry.id, {
                            category: cat,
                            articleRef: info.articleRef,
                            isDTLCapApplicable:
                              cat === 'DTL_MOVEMENT',
                          });
                        }}
                        className="px-2 py-1 border rounded text-xs"
                      >
                        {COVERED_TAX_CATEGORY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={entry.description}
                        onChange={(e) =>
                          updateTaxEntry(jur.id, entry.id, {
                            description: e.target.value,
                          })
                        }
                        placeholder="Description"
                        className="px-2 py-1 border rounded text-xs"
                      />
                      <input
                        type="number"
                        value={entry.amount || ''}
                        onChange={(e) =>
                          updateTaxEntry(jur.id, entry.id, {
                            amount: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="Amount (€)"
                        className="px-2 py-1 border rounded text-xs"
                      />
                    </div>
                    <button
                      onClick={() =>
                        setShowCategoryGuide(
                          showCategoryGuide === entry.id
                            ? null
                            : entry.id
                        )
                      }
                      className="text-gray-400 hover:text-blue-500"
                    >
                      <Info className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => removeTaxEntry(jur.id, entry.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    {showCategoryGuide === entry.id && (
                      <div className="absolute mt-6 p-2 bg-blue-50 rounded text-xs text-blue-800 max-w-sm z-10 shadow-lg">
                        {COVERED_TAX_CATEGORY_INFO[entry.category].guidance}
                      </div>
                    )}
                  </div>
                ))}

                {jur.coveredTaxEntries.length === 0 && (
                  <p className="text-xs text-gray-400 italic">
                    No tax entries yet — add at least current tax expense
                  </p>
                )}

                {/* Summary */}
                <div className="p-2 bg-amber-50 rounded text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Current Tax:</span>
                    <span className="font-mono">
                      {formatEUR(taxResult.currentTaxTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Current Adjustments:</span>
                    <span className="font-mono">
                      {taxResult.currentAdjustments >= 0 ? '+' : ''}
                      {formatEUR(taxResult.currentAdjustments)}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Deferred Tax (net):</span>
                    <span className="font-mono">
                      {taxResult.deferredTaxTotal >= 0 ? '+' : ''}
                      {formatEUR(taxResult.deferredTaxTotal)}
                    </span>
                  </div>
                  {taxResult.dtlCapAdjustment !== 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>DTL Cap Adjustment (Art. 4.4.4):</span>
                      <span className="font-mono">
                        {formatEUR(taxResult.dtlCapAdjustment)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold border-t pt-1">
                    <span>Adjusted Covered Taxes:</span>
                    <span className="font-mono">
                      {formatEUR(taxResult.adjustedCoveredTaxes)}
                    </span>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );

  // ============================================================
  // RENDER — Step 4: ETR & Top-Up Tax
  // ============================================================

  const renderETRTopUp = () => {
    if (!computationResult) return null;
    const sbieRate = getSBIERate(fiscalYear);

    return (
      <div className="space-y-4">
        {/* SBIE Rate Display */}
        <div className="p-3 bg-gray-50 rounded text-sm">
          <strong>SBIE Transitional Rates (FY {fiscalYear}):</strong>{' '}
          Payroll{' '}
          {formatPercentDirect(sbieRate.payrollRate * 100)} | Assets{' '}
          {formatPercentDirect(sbieRate.assetRate * 100)}
          <span className="text-gray-500 ml-2">
            (Art. 9.2 — declining to 5%/5% from FY 2033)
          </span>
        </div>

        {/* Per-Jurisdiction Computation */}
        {computationResult.jurisdictionResults.map((jr) => (
          <Card
            key={jr.jurisdictionId}
            className={`border ${
              jr.topUpTax.isLowTaxed && !jr.topUpTax.isDeMinimisExcluded
                ? 'border-red-200'
                : 'border-green-200'
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">{jr.label}</h3>
                <div className="flex items-center gap-2">
                  {jr.topUpTax.isDeMinimisExcluded ? (
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                      De Minimis Excluded
                    </span>
                  ) : jr.topUpTax.isLowTaxed ? (
                    <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">
                      Below 15% — Top-Up Tax
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                      Above 15%
                    </span>
                  )}
                  {jr.isMOCE && (
                    <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                      MOCE {jr.moceOwnershipPercent}%
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500">GloBE Income</p>
                  <p className="font-mono font-medium">
                    {formatEUR(jr.income.globeIncome)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Covered Taxes</p>
                  <p className="font-mono font-medium">
                    {formatEUR(jr.tax.adjustedCoveredTaxes)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">ETR</p>
                  <p
                    className={`font-mono font-bold ${getETRStatusColour(jr.topUpTax.etrDisplay)}`}
                  >
                    {formatPercentDirect(jr.topUpTax.etrDisplay)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Top-Up Tax %</p>
                  <p className="font-mono font-medium">
                    {formatPercentDirect(
                      roundTo2(jr.topUpTax.topUpTaxPercentage * 100)
                    )}
                  </p>
                </div>
              </div>

              {/* SBIE Breakdown */}
              <div className="mt-3 p-2 bg-gray-50 rounded text-xs space-y-1">
                <div className="flex justify-between">
                  <span>
                    SBIE — Payroll: {formatEUR(jr.topUpTax.sbie.payrollCarveOut)}{' '}
                    ({formatPercentDirect(jr.topUpTax.sbie.payrollRate * 100)} ×{' '}
                    {formatEUR(jurisdictions.find((j) => j.id === jr.jurisdictionId)?.eligiblePayroll ?? 0)})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>
                    SBIE — Assets: {formatEUR(jr.topUpTax.sbie.assetCarveOut)}{' '}
                    ({formatPercentDirect(jr.topUpTax.sbie.assetRate * 100)} ×{' '}
                    {formatEUR(jurisdictions.find((j) => j.id === jr.jurisdictionId)?.tangibleAssetNBV ?? 0)})
                  </span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Total SBIE:</span>
                  <span>{formatEUR(jr.topUpTax.sbie.totalSBIE)}</span>
                </div>
                <div className="flex justify-between">
                  <span>
                    Excess Profit (GloBE Income − SBIE):
                  </span>
                  <span>{formatEUR(jr.topUpTax.excessProfit)}</span>
                </div>
              </div>

              {/* De Minimis Result */}
              {jr.topUpTax.deMinimisResult && (
                <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                  <p className="font-medium mb-1">
                    De Minimis Test (Art. 5.5):
                  </p>
                  <div className="space-y-0.5">
                    <p>
                      3-yr avg revenue: {formatEUR(jr.topUpTax.deMinimisResult.avgRevenue)}{' '}
                      {jr.topUpTax.deMinimisResult.revenueTestPassed ? (
                        <span className="text-green-600">
                          ({'<'} €10M — PASS)
                        </span>
                      ) : (
                        <span className="text-red-600">
                          ({'≥'} €10M — FAIL)
                        </span>
                      )}
                    </p>
                    <p>
                      3-yr avg income: {formatEUR(jr.topUpTax.deMinimisResult.avgIncome)}{' '}
                      {jr.topUpTax.deMinimisResult.incomeTestPassed ? (
                        <span className="text-green-600">
                          ({'<'} €1M — PASS)
                        </span>
                      ) : (
                        <span className="text-red-600">
                          ({'≥'} €1M — FAIL)
                        </span>
                      )}
                    </p>
                    <p className="font-medium mt-1">
                      Result:{' '}
                      {jr.topUpTax.deMinimisResult.qualifies ? (
                        <span className="text-green-600">
                          QUALIFIES — Excluded from top-up tax
                        </span>
                      ) : (
                        <span className="text-red-600">
                          Does not qualify
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Top-Up Tax */}
              {!jr.topUpTax.isDeMinimisExcluded && jr.topUpTax.isLowTaxed && (
                <div className="mt-2 p-2 bg-red-50 rounded text-sm font-semibold flex justify-between">
                  <span>
                    Top-Up Tax ({formatPercentDirect(roundTo2(jr.topUpTax.topUpTaxPercentage * 100))} ×{' '}
                    {formatEUR(jr.topUpTax.excessProfit)}):
                  </span>
                  <span className="text-red-700">
                    {formatEUR(jr.topUpTax.topUpTaxAmount)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // ============================================================
  // RENDER — Step 5: Results Summary
  // ============================================================

  const renderResults = () => {
    if (!computationResult) return null;

    return (
      <div className="space-y-6">
        {/* Totals */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">
                Total GloBE Income
              </p>
              <p className="text-lg font-mono font-bold">
                {formatEUR(computationResult.totalGloBEIncome)}
              </p>
            </CardContent>
          </Card>
          <Card className="border">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">
                Total Covered Taxes
              </p>
              <p className="text-lg font-mono font-bold">
                {formatEUR(computationResult.totalCoveredTaxes)}
              </p>
            </CardContent>
          </Card>
          <Card className="border">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Total SBIE</p>
              <p className="text-lg font-mono font-bold">
                {formatEUR(computationResult.totalSBIE)}
              </p>
            </CardContent>
          </Card>
          <Card className="border border-red-200">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-red-500 mb-1">
                Total Top-Up Tax
              </p>
              <p className="text-lg font-mono font-bold text-red-700">
                {formatEUR(computationResult.totalTopUpTax)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Status Counts */}
        <div className="flex gap-4 text-sm">
          <span className="px-2 py-1 bg-green-50 text-green-700 rounded">
            {computationResult.aboveMinimumCount} above minimum
          </span>
          <span className="px-2 py-1 bg-red-50 text-red-700 rounded">
            {computationResult.lowTaxedCount} below minimum
          </span>
          {computationResult.deMinimisCount > 0 && (
            <span className="px-2 py-1 bg-gray-50 text-gray-700 rounded">
              {computationResult.deMinimisCount} de minimis
            </span>
          )}
          {computationResult.moceCount > 0 && (
            <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded">
              {computationResult.moceCount} MOCE
            </span>
          )}
        </div>

        {/* Comparison Table */}
        <Card className="border">
          <CardHeader className="py-3">
            <CardTitle className="text-sm">
              Multi-Jurisdiction Comparison
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left px-3 py-2">Jurisdiction</th>
                    <th className="text-right px-3 py-2">
                      GloBE Income
                    </th>
                    <th className="text-right px-3 py-2">
                      Covered Taxes
                    </th>
                    <th className="text-right px-3 py-2">ETR</th>
                    <th className="text-right px-3 py-2">SBIE</th>
                    <th className="text-right px-3 py-2">
                      Excess Profit
                    </th>
                    <th className="text-right px-3 py-2">Top-Up %</th>
                    <th className="text-right px-3 py-2">Top-Up Tax</th>
                    <th className="text-center px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {computationResult.summaryRows.map((row) => (
                    <tr
                      key={row.label}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="px-3 py-2 font-medium">
                        {row.label}
                      </td>
                      <td className="px-3 py-2 text-right font-mono">
                        {formatEUR(row.globeIncome)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono">
                        {formatEUR(row.adjustedCoveredTaxes)}
                      </td>
                      <td
                        className={`px-3 py-2 text-right font-mono font-bold ${getETRStatusColour(row.etr)}`}
                      >
                        {formatPercentDirect(row.etr)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono">
                        {formatEUR(row.sbie)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono">
                        {formatEUR(row.excessProfit)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono">
                        {formatPercentDirect(row.topUpTaxPercent)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold">
                        {row.topUpTaxAmount > 0 ? (
                          <span className="text-red-700">
                            {formatEUR(row.topUpTaxAmount)}
                          </span>
                        ) : (
                          <span className="text-green-700">€0</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded ${
                            row.status === 'ABOVE_MINIMUM'
                              ? 'bg-green-100 text-green-700'
                              : row.status === 'DE_MINIMIS'
                                ? 'bg-gray-100 text-gray-600'
                                : row.status === 'MOCE'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {row.status === 'ABOVE_MINIMUM'
                            ? 'Above'
                            : row.status === 'DE_MINIMIS'
                              ? 'De Min.'
                              : row.status === 'MOCE'
                                ? `MOCE`
                                : 'Below'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {/* Total row */}
                  <tr className="bg-gray-100 font-semibold">
                    <td className="px-3 py-2">TOTAL</td>
                    <td className="px-3 py-2 text-right font-mono">
                      {formatEUR(computationResult.totalGloBEIncome)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      {formatEUR(computationResult.totalCoveredTaxes)}
                    </td>
                    <td className="px-3 py-2"></td>
                    <td className="px-3 py-2 text-right font-mono">
                      {formatEUR(computationResult.totalSBIE)}
                    </td>
                    <td className="px-3 py-2"></td>
                    <td className="px-3 py-2"></td>
                    <td className="px-3 py-2 text-right font-mono text-red-700">
                      {formatEUR(computationResult.totalTopUpTax)}
                    </td>
                    <td className="px-3 py-2"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Scenario Comparison Toggle */}
        <Card className="border">
          <CardHeader className="py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">
                Scenario Comparison (SBC Election)
              </CardTitle>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={scenarioComparison}
                  onChange={(e) =>
                    setScenarioComparison(e.target.checked)
                  }
                />
                Toggle SBC Election
              </label>
            </div>
          </CardHeader>
          {scenarioComparison && scenarioResult && (
            <CardContent className="pt-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="text-left px-3 py-2">
                        Jurisdiction
                      </th>
                      <th className="text-right px-3 py-2">
                        Base ETR
                      </th>
                      <th className="text-right px-3 py-2">
                        With SBC Election
                      </th>
                      <th className="text-right px-3 py-2">
                        Base Top-Up
                      </th>
                      <th className="text-right px-3 py-2">
                        With SBC Election
                      </th>
                      <th className="text-right px-3 py-2">
                        Difference
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {computationResult.summaryRows.map((baseRow, idx) => {
                      const scenarioRow =
                        scenarioResult.summaryRows[idx];
                      if (!scenarioRow) return null;
                      const diff = roundTo2(
                        scenarioRow.topUpTaxAmount -
                          baseRow.topUpTaxAmount
                      );
                      return (
                        <tr
                          key={baseRow.label}
                          className="border-b"
                        >
                          <td className="px-3 py-2">
                            {baseRow.label}
                          </td>
                          <td className="px-3 py-2 text-right font-mono">
                            {formatPercentDirect(baseRow.etr)}
                          </td>
                          <td className="px-3 py-2 text-right font-mono">
                            {formatPercentDirect(scenarioRow.etr)}
                          </td>
                          <td className="px-3 py-2 text-right font-mono">
                            {formatEUR(baseRow.topUpTaxAmount)}
                          </td>
                          <td className="px-3 py-2 text-right font-mono">
                            {formatEUR(scenarioRow.topUpTaxAmount)}
                          </td>
                          <td
                            className={`px-3 py-2 text-right font-mono ${
                              diff > 0
                                ? 'text-red-600'
                                : diff < 0
                                  ? 'text-green-600'
                                  : ''
                            }`}
                          >
                            {diff > 0 ? '+' : ''}
                            {formatEUR(diff)}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-gray-100 font-semibold">
                      <td className="px-3 py-2">TOTAL</td>
                      <td className="px-3 py-2"></td>
                      <td className="px-3 py-2"></td>
                      <td className="px-3 py-2 text-right font-mono">
                        {formatEUR(computationResult.totalTopUpTax)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono">
                        {formatEUR(scenarioResult.totalTopUpTax)}
                      </td>
                      <td
                        className={`px-3 py-2 text-right font-mono ${
                          scenarioResult.totalTopUpTax >
                          computationResult.totalTopUpTax
                            ? 'text-red-600'
                            : 'text-green-600'
                        }`}
                      >
                        {scenarioResult.totalTopUpTax -
                          computationResult.totalTopUpTax >
                        0
                          ? '+'
                          : ''}
                        {formatEUR(
                          roundTo2(
                            scenarioResult.totalTopUpTax -
                              computationResult.totalTopUpTax
                          )
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          )}
        </Card>

        {/* SBIE Rate Schedule Reference */}
        <Card className="border">
          <CardHeader className="py-3">
            <CardTitle className="text-sm">
              SBIE Transitional Rate Schedule (Art. 9.2)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left px-3 py-2">Fiscal Year</th>
                    <th className="text-right px-3 py-2">
                      Payroll Rate
                    </th>
                    <th className="text-right px-3 py-2">Asset Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {SBIE_TRANSITIONAL_RATES.map((rate) => (
                    <tr
                      key={rate.fiscalYear}
                      className={`border-b ${
                        rate.fiscalYear === fiscalYear
                          ? 'bg-blue-50 font-semibold'
                          : ''
                      }`}
                    >
                      <td className="px-3 py-1.5">
                        {rate.fiscalYear === 2033
                          ? '2033+'
                          : rate.fiscalYear}
                        {rate.fiscalYear === fiscalYear && (
                          <span className="ml-2 text-blue-600">
                            (current)
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono">
                        {formatPercentDirect(rate.payrollRate * 100)}
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono">
                        {formatPercentDirect(rate.assetRate * 100)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Key Insights */}
        <Card className="border bg-blue-50">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-2">Key Insights</h3>
            <ul className="text-xs space-y-1 text-gray-700">
              {computationResult.totalTopUpTax > 0 ? (
                <li>
                  Total top-up tax liability:{' '}
                  <strong className="text-red-700">
                    {formatEUR(computationResult.totalTopUpTax)}
                  </strong>{' '}
                  across{' '}
                  {computationResult.lowTaxedCount} low-taxed
                  jurisdiction(s).
                </li>
              ) : (
                <li className="text-green-700">
                  No top-up tax liability — all jurisdictions are
                  either above the 15% minimum or qualify for de
                  minimis exclusion.
                </li>
              )}
              {computationResult.deMinimisCount > 0 && (
                <li>
                  {computationResult.deMinimisCount} jurisdiction(s)
                  excluded under de minimis (Art. 5.5).
                </li>
              )}
              {computationResult.moceCount > 0 && (
                <li>
                  {computationResult.moceCount} MOCE(s) computed
                  separately under Art. 5.6 — only the allocable
                  share is subject to IIR/UTPR.
                </li>
              )}
              <li>
                The top-up tax is collected through the charging
                mechanism — use the Charging Mechanism Allocation
                Workbench (T-CMA) to trace how it is allocated between
                QDMTT, IIR, and UTPR.
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ============================================================
  // RENDER — Main
  // ============================================================

  const renderCurrentStep = () => {
    switch (currentStep.key) {
      case 'JURISDICTION_SETUP':
        return renderJurisdictionSetup();
      case 'GLOBE_INCOME':
        return renderGloBEIncome();
      case 'COVERED_TAXES':
        return renderCoveredTaxes();
      case 'ETR_TOPUP':
        return renderETRTopUp();
      case 'RESULTS':
        return renderResults();
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calculator className="w-6 h-6 text-blue-600" />
          <div>
            <h1 className="text-lg font-bold">
              ETR and Top-Up Tax Calculator
            </h1>
            <p className="text-xs text-gray-500">
              Articles 3.1–5.6 — GloBE Income, Covered Taxes, ETR, SBIE, Top-Up
              Tax
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Save */}
          {onSave && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={isSaving || jurisdictions.length === 0}
            >
              <Save className="w-4 h-4 mr-1" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          )}
          {/* Load */}
          {savedItems.length > 0 && (
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLoadMenuOpen(!loadMenuOpen)}
              >
                <FolderOpen className="w-4 h-4 mr-1" />
                Load
              </Button>
              {loadMenuOpen && (
                <div className="absolute right-0 mt-1 w-64 bg-white border rounded-lg shadow-lg z-20">
                  {savedItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleLoad(item)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b last:border-b-0"
                    >
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        {item.jurisdictions.length} jurisdictions
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Step Progress */}
      {renderStepBar()}

      {/* Educational Note */}
      {renderEducationalNote()}

      {/* Errors */}
      {renderErrors()}

      {/* Current Step Content */}
      {renderCurrentStep()}

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={goBack}
          disabled={currentStepIndex === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        {currentStepIndex < ETR_STEPS.length - 1 ? (
          <Button onClick={goNext}>
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Computation complete
          </div>
        )}
      </div>
    </div>
  );
}

export default EtrCalculator;
