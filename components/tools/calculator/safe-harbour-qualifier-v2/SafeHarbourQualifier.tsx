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
  Shield,
  Building,
  Globe,
  Calendar,
  BarChart3,
  FileSpreadsheet,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type {
  SafeHarbourFiscalYear,
  JurisdictionCbCRData,
  JurisdictionAssessment,
  AssessmentResult,
  SafeHarbourStep,
  SafeHarbourQualifierProps,
  SavedAssessment,
  ValidationError,
} from './types';
import {
  STEP_CONFIGS,
  SAFE_HARBOUR_STEPS,
  CURRENCIES,
  FISCAL_YEARS,
  JURISDICTIONS,
  STEP_EDUCATIONAL_NOTES,
  TEST_GUIDANCE,
  TRANSITION_RATES,
  INITIAL_JURISDICTION,
  CASE_STUDY_GROUP_NAME,
  CASE_STUDY_FISCAL_YEAR,
  CASE_STUDY_JURISDICTIONS,
  DE_MINIMIS_REVENUE_THRESHOLD,
  DE_MINIMIS_PROFIT_THRESHOLD,
  generateJurisdictionId,
  getTransitionRates,
  runFullAssessment,
  validateGroupInfo,
  validateJurisdictions,
  formatEUR,
  formatCurrency,
  getCurrencySymbol,
  formatPercent,
  getQualifyingTestLabel,
  roundTo2,
} from './utils';

// ============================================================
// MAIN COMPONENT
// ============================================================

export function SafeHarbourQualifier({
  userId,
  onSave,
  onDelete,
  savedItems = [],
  onTrackCalculation,
  onTrackStepChange,
  onTrackError,
  onTrackCompletion,
}: SafeHarbourQualifierProps) {
  // --- State ---
  const [currentStep, setCurrentStep] = useState<SafeHarbourStep>('GROUP_INFO');
  const [groupName, setGroupName] = useState('');
  const [fiscalYear, setFiscalYear] = useState<SafeHarbourFiscalYear>(2025);
  const [currency, setCurrency] = useState('EUR');
  const [jurisdictions, setJurisdictions] = useState<JurisdictionCbCRData[]>([]);
  const [assessmentResult, setAssessmentResult] =
    useState<AssessmentResult | null>(null);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showEducational, setShowEducational] = useState(true);
  const [expandedJurisdictions, setExpandedJurisdictions] = useState<
    Set<string>
  >(new Set());

  const currentStepIndex = SAFE_HARBOUR_STEPS.indexOf(currentStep);
  const stepConfig = STEP_CONFIGS[currentStepIndex];
  const currencySymbol = getCurrencySymbol(currency);
  const rates = useMemo(() => getTransitionRates(fiscalYear), [fiscalYear]);

  // --- Navigation ---
  const goToStep = useCallback(
    (step: SafeHarbourStep) => {
      onTrackStepChange?.(currentStep, step);
      setErrors([]);
      setCurrentStep(step);
    },
    [currentStep, onTrackStepChange]
  );

  const goNext = useCallback(() => {
    // Validate current step
    if (currentStep === 'GROUP_INFO') {
      const groupErrors = validateGroupInfo(groupName);
      if (groupErrors.length > 0) {
        setErrors(groupErrors);
        onTrackError?.(groupErrors[0].message, { step: currentStep });
        return;
      }
    }

    if (currentStep === 'CBCR_DATA') {
      const jurErrors = validateJurisdictions(jurisdictions);
      if (jurErrors.length > 0) {
        setErrors(jurErrors);
        onTrackError?.(jurErrors[0].message, { step: currentStep });
        return;
      }
      // Run assessment when moving to results
      const result = runFullAssessment(
        groupName,
        fiscalYear,
        currency,
        jurisdictions
      );
      setAssessmentResult(result);
      onTrackCalculation?.('assessment', {
        qualifyingCount: result.qualifyingCount,
        totalCount: result.totalCount,
        qualifyingJurisdictions: result.qualifyingJurisdictions,
      });
    }

    if (currentStep === 'ASSESSMENT') {
      onTrackCompletion?.({
        qualifyingCount: assessmentResult?.qualifyingCount,
        totalCount: assessmentResult?.totalCount,
        fiscalYear,
      });
    }

    const nextIndex = currentStepIndex + 1;
    if (nextIndex < SAFE_HARBOUR_STEPS.length) {
      goToStep(SAFE_HARBOUR_STEPS[nextIndex]);
    }
  }, [
    currentStep,
    currentStepIndex,
    groupName,
    jurisdictions,
    fiscalYear,
    currency,
    assessmentResult,
    goToStep,
    onTrackCalculation,
    onTrackCompletion,
    onTrackError,
  ]);

  const goBack = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      goToStep(SAFE_HARBOUR_STEPS[prevIndex]);
    }
  }, [currentStepIndex, goToStep]);

  // --- Jurisdiction Management ---
  const addJurisdiction = useCallback(() => {
    const newJur: JurisdictionCbCRData = {
      ...INITIAL_JURISDICTION,
      id: generateJurisdictionId(),
    };
    setJurisdictions((prev) => [...prev, newJur]);
    setExpandedJurisdictions((prev) => new Set([...Array.from(prev), newJur.id]));
  }, []);

  const removeJurisdiction = useCallback((id: string) => {
    setJurisdictions((prev) => prev.filter((j) => j.id !== id));
    setExpandedJurisdictions((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const updateJurisdiction = useCallback(
    (id: string, field: keyof JurisdictionCbCRData, value: string | number) => {
      setJurisdictions((prev) =>
        prev.map((j) => (j.id === id ? { ...j, [field]: value } : j))
      );
    },
    []
  );

  const toggleJurisdictionExpand = useCallback((id: string) => {
    setExpandedJurisdictions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // --- Load H&C Scenario ---
  const loadCaseStudy = useCallback(() => {
    setGroupName(CASE_STUDY_GROUP_NAME);
    setFiscalYear(CASE_STUDY_FISCAL_YEAR);
    setCurrency('EUR');
    setJurisdictions(
      CASE_STUDY_JURISDICTIONS.map((j) => ({
        ...j,
        id: generateJurisdictionId(),
      }))
    );
    setExpandedJurisdictions(new Set());
    setAssessmentResult(null);
    onTrackCalculation?.('load_case_study', {
      scenario: 'Stratos Group FY 2025',
    });
  }, [onTrackCalculation]);

  // --- Save / Load ---
  const handleSave = useCallback(async () => {
    if (!onSave || !groupName) return;
    setIsSaving(true);
    try {
      await onSave({
        groupName,
        fiscalYear,
        currency,
        jurisdictions,
        result: assessmentResult,
      });
    } catch {
      // Error handling managed by parent
    } finally {
      setIsSaving(false);
    }
  }, [onSave, groupName, fiscalYear, currency, jurisdictions, assessmentResult]);

  const loadSaved = useCallback(
    (saved: SavedAssessment) => {
      setGroupName(saved.groupName);
      setFiscalYear(saved.fiscalYear);
      setCurrency(saved.currency);
      setJurisdictions(saved.jurisdictions);
      setAssessmentResult(saved.result);
      setShowSaved(false);
      goToStep(saved.result ? 'SUMMARY' : 'CBCR_DATA');
    },
    [goToStep]
  );

  // --- Reset ---
  const resetForm = useCallback(() => {
    setGroupName('');
    setFiscalYear(2025);
    setCurrency('EUR');
    setJurisdictions([]);
    setAssessmentResult(null);
    setErrors([]);
    setCurrentStep('GROUP_INFO');
  }, []);

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
            <Shield className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-mojitax-navy">
              Safe Harbour Assessment
            </h1>
            <p className="text-sm text-slate-500">
              Transitional CbCR Safe Harbour (2024–2027)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {savedItems.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSaved(!showSaved)}
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              Saved ({savedItems.length})
            </Button>
          )}
        </div>
      </div>

      {/* Saved Assessments Panel */}
      {showSaved && savedItems.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-mojitax-navy mb-3">
              Saved Assessments
            </h3>
            <div className="space-y-2">
              {savedItems.map((saved) => (
                <div
                  key={saved.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <button
                    onClick={() => loadSaved(saved)}
                    className="flex-1 text-left"
                  >
                    <p className="font-medium text-mojitax-navy">
                      {saved.groupName}
                    </p>
                    <p className="text-sm text-slate-500">
                      FY{saved.fiscalYear} •{' '}
                      {saved.result
                        ? `${saved.result.qualifyingCount}/${saved.result.totalCount} qualify`
                        : 'Not assessed'}
                    </p>
                  </button>
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(saved.id)}
                    >
                      <Trash2 className="w-4 h-4 text-slate-400" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step Progress Bar */}
      <div className="flex items-center gap-2">
        {STEP_CONFIGS.map((step, index) => {
          const isActive = index === currentStepIndex;
          const isComplete = index < currentStepIndex;
          return (
            <React.Fragment key={step.key}>
              {index > 0 && (
                <div
                  className={`flex-1 h-0.5 ${
                    isComplete ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                />
              )}
              <button
                onClick={() => {
                  if (isComplete) goToStep(step.key);
                }}
                disabled={!isComplete && !isActive}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-100 text-emerald-800'
                    : isComplete
                    ? 'bg-emerald-50 text-emerald-700 cursor-pointer hover:bg-emerald-100'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isActive
                      ? 'bg-emerald-600 text-white'
                      : isComplete
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-300 text-white'
                  }`}
                >
                  {isComplete ? '✓' : index + 1}
                </span>
                <span className="hidden md:inline">{step.shortLabel}</span>
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {/* Educational Note */}
      {showEducational && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="font-medium text-blue-800 text-sm">
                {stepConfig.label} — {stepConfig.articleRef}
              </p>
              <button
                onClick={() => setShowEducational(false)}
                className="text-blue-400 hover:text-blue-600 text-xs"
              >
                Hide
              </button>
            </div>
            <p className="text-sm text-blue-700 mt-1">
              {STEP_EDUCATIONAL_NOTES[currentStep]}
            </p>
          </div>
        </div>
      )}
      {!showEducational && (
        <button
          onClick={() => setShowEducational(true)}
          className="text-blue-600 text-xs flex items-center gap-1"
        >
          <Info className="w-3 h-3" /> Show educational note
        </button>
      )}

      {/* Validation Errors */}
      {errors.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="font-medium text-red-800 text-sm">
              Please fix the following:
            </span>
          </div>
          <ul className="text-sm text-red-700 list-disc ml-6 space-y-1">
            {errors.map((e, i) => (
              <li key={i}>{e.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ============================== */}
      {/* STEP 1: GROUP INFORMATION */}
      {/* ============================== */}
      {currentStep === 'GROUP_INFO' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building className="w-5 h-5 text-slate-400" />
              Group Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  MNE Group Name *
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g. Stratos Holdings plc"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-4 h-4" /> Fiscal Year *
                </label>
                <select
                  value={fiscalYear}
                  onChange={(e) =>
                    setFiscalYear(Number(e.target.value) as SafeHarbourFiscalYear)
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  {FISCAL_YEARS.map((y) => (
                    <option key={y} value={y}>
                      FY {y}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                  <Globe className="w-4 h-4" /> Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.symbol} {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Applicable Rates Display */}
            <div className="p-4 bg-slate-50 rounded-lg">
              <h4 className="text-sm font-semibold text-slate-700 mb-3">
                Applicable Rates for FY {fiscalYear}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-slate-500 block">
                    Simplified ETR Transition Rate
                  </span>
                  <span className="font-bold text-lg text-mojitax-navy">
                    {rates.etrRate}%
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">
                    SBIE Payroll Carve-Out
                  </span>
                  <span className="font-bold text-lg text-mojitax-navy">
                    {rates.sbiePayrollRate}%
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">
                    SBIE Tangible Asset Carve-Out
                  </span>
                  <span className="font-bold text-lg text-mojitax-navy">
                    {rates.sbieAssetRate}%
                  </span>
                </div>
              </div>
            </div>

            {/* Transition Rate Schedule */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-2">
                Transition Rate Schedule (2024–2027)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 px-3 text-slate-500 font-medium">
                        Fiscal Year
                      </th>
                      <th className="text-right py-2 px-3 text-slate-500 font-medium">
                        ETR Rate
                      </th>
                      <th className="text-right py-2 px-3 text-slate-500 font-medium">
                        SBIE Payroll
                      </th>
                      <th className="text-right py-2 px-3 text-slate-500 font-medium">
                        SBIE Assets
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {TRANSITION_RATES.map((r) => (
                      <tr
                        key={r.year}
                        className={`border-b border-slate-100 ${
                          r.year === fiscalYear
                            ? 'bg-emerald-50 font-semibold'
                            : ''
                        }`}
                      >
                        <td className="py-2 px-3">
                          {r.year}
                          {r.year === fiscalYear && (
                            <span className="ml-2 text-xs text-emerald-600">
                              ← Selected
                            </span>
                          )}
                        </td>
                        <td className="text-right py-2 px-3">{r.etrRate}%</td>
                        <td className="text-right py-2 px-3">
                          {r.sbiePayrollRate}%
                        </td>
                        <td className="text-right py-2 px-3">
                          {r.sbieAssetRate}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Load Case Study */}
            <div className="flex items-center gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={loadCaseStudy}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Load Stratos Group (H&C Scenario)
              </Button>
              <span className="text-xs text-slate-400">
                Pre-loads CbCR data for 7 jurisdictions — FY 2025
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ============================== */}
      {/* STEP 2: CbCR DATA ENTRY */}
      {/* ============================== */}
      {currentStep === 'CBCR_DATA' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-mojitax-navy flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-slate-400" />
              CbCR Data — {groupName} (FY {fiscalYear})
            </h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={loadCaseStudy}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Load H&C Data
              </Button>
              <Button size="sm" onClick={addJurisdiction}>
                <Plus className="w-4 h-4 mr-2" />
                Add Jurisdiction
              </Button>
            </div>
          </div>

          {jurisdictions.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Globe className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 mb-4">
                  No jurisdictions added yet. Add jurisdictions individually or
                  load the Stratos Group scenario.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Button onClick={addJurisdiction}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Jurisdiction
                  </Button>
                  <Button variant="outline" onClick={loadCaseStudy}>
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Load Stratos Group
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {jurisdictions.map((jur, index) => {
            const isExpanded = expandedJurisdictions.has(jur.id);
            return (
              <Card key={jur.id}>
                <div
                  className="px-4 py-3 border-b border-slate-100 flex items-center justify-between cursor-pointer hover:bg-slate-50"
                  onClick={() => toggleJurisdictionExpand(jur.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                      {index + 1}
                    </span>
                    <span className="font-medium text-mojitax-navy">
                      {jur.jurisdiction || 'New Jurisdiction'}
                    </span>
                    {jur.revenue > 0 && (
                      <span className="text-xs text-slate-400">
                        Rev: {formatCurrency(jur.revenue, currency)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeJurisdiction(jur.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-slate-400" />
                    </Button>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <CardContent className="p-4 space-y-4">
                    {/* Jurisdiction Name */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Jurisdiction *
                      </label>
                      <select
                        value={jur.jurisdiction}
                        onChange={(e) =>
                          updateJurisdiction(jur.id, 'jurisdiction', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      >
                        <option value="">Select jurisdiction...</option>
                        {JURISDICTIONS.map((j) => (
                          <option key={j.value} value={j.value}>
                            {j.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* CbCR Financial Data */}
                    <div>
                      <h4 className="text-sm font-semibold text-slate-600 mb-2">
                        CbCR Table 2 Data
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <NumericInput
                          label={`Revenue (${currencySymbol})`}
                          value={jur.revenue}
                          onChange={(v) =>
                            updateJurisdiction(jur.id, 'revenue', v)
                          }
                          hint="CbCR Table 2, Col. 3 — Total revenue"
                        />
                        <NumericInput
                          label={`Profit (Loss) Before Tax (${currencySymbol})`}
                          value={jur.profitBeforeTax}
                          onChange={(v) =>
                            updateJurisdiction(jur.id, 'profitBeforeTax', v)
                          }
                          hint="CbCR Table 2, Col. 4 — Negative for losses"
                          allowNegative
                        />
                        <NumericInput
                          label={`Income Tax Accrued (${currencySymbol})`}
                          value={jur.incomeTaxAccrued}
                          onChange={(v) =>
                            updateJurisdiction(jur.id, 'incomeTaxAccrued', v)
                          }
                          hint="CbCR Table 2, Col. 5 — Current year"
                          allowNegative
                        />
                      </div>
                    </div>

                    {/* Substance Data */}
                    <div>
                      <h4 className="text-sm font-semibold text-slate-600 mb-2">
                        Substance Data (for Routine Profits Test)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <NumericInput
                          label="Number of Employees"
                          value={jur.employeeCount}
                          onChange={(v) =>
                            updateJurisdiction(jur.id, 'employeeCount', v)
                          }
                          hint="CbCR Table 2, Col. 9"
                          isInteger
                        />
                        <NumericInput
                          label={`Employee Compensation (${currencySymbol})`}
                          value={jur.employeeCompensation}
                          onChange={(v) =>
                            updateJurisdiction(
                              jur.id,
                              'employeeCompensation',
                              v
                            )
                          }
                          hint="Total costs incl. social, pension, benefits"
                        />
                        <NumericInput
                          label={`Tangible Assets NBV (${currencySymbol})`}
                          value={jur.tangibleAssetsNBV}
                          onChange={(v) =>
                            updateJurisdiction(jur.id, 'tangibleAssetsNBV', v)
                          }
                          hint="CbCR Table 2, Col. 10"
                        />
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}

          {jurisdictions.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={addJurisdiction}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Another Jurisdiction
            </Button>
          )}
        </div>
      )}

      {/* ============================== */}
      {/* STEP 3: ASSESSMENT RESULTS */}
      {/* ============================== */}
      {currentStep === 'ASSESSMENT' && assessmentResult && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-mojitax-navy flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-slate-400" />
            Assessment Results — {assessmentResult.groupName} (FY{' '}
            {assessmentResult.fiscalYear})
          </h2>

          {/* Quick Summary Bar */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
              <p className="text-3xl font-bold text-emerald-700">
                {assessmentResult.qualifyingCount}
              </p>
              <p className="text-sm text-emerald-600">Qualify</p>
            </div>
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center">
              <p className="text-3xl font-bold text-red-700">
                {assessmentResult.totalCount -
                  assessmentResult.qualifyingCount}
              </p>
              <p className="text-sm text-red-600">Do Not Qualify</p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <p className="text-3xl font-bold text-slate-700">
                {assessmentResult.totalCount}
              </p>
              <p className="text-sm text-slate-600">Total Assessed</p>
            </div>
          </div>

          {/* Per-Jurisdiction Assessment Cards */}
          {assessmentResult.jurisdictionAssessments.map((assessment) => (
            <JurisdictionAssessmentCard
              key={assessment.jurisdictionId}
              assessment={assessment}
              currency={currency}
              fiscalYear={fiscalYear}
            />
          ))}
        </div>
      )}

      {/* ============================== */}
      {/* STEP 4: SUMMARY DASHBOARD */}
      {/* ============================== */}
      {currentStep === 'SUMMARY' && assessmentResult && (
        <div className="space-y-6">
          {/* Overall Result Banner */}
          <Card
            className={`border-2 ${
              assessmentResult.qualifyingCount === assessmentResult.totalCount
                ? 'border-emerald-300 bg-emerald-50'
                : assessmentResult.qualifyingCount === 0
                ? 'border-red-300 bg-red-50'
                : 'border-amber-300 bg-amber-50'
            }`}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                    assessmentResult.qualifyingCount ===
                    assessmentResult.totalCount
                      ? 'bg-emerald-100'
                      : assessmentResult.qualifyingCount === 0
                      ? 'bg-red-100'
                      : 'bg-amber-100'
                  }`}
                >
                  <Shield
                    className={`w-7 h-7 ${
                      assessmentResult.qualifyingCount ===
                      assessmentResult.totalCount
                        ? 'text-emerald-600'
                        : assessmentResult.qualifyingCount === 0
                        ? 'text-red-600'
                        : 'text-amber-600'
                    }`}
                  />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-mojitax-navy">
                    {assessmentResult.qualifyingCount} of{' '}
                    {assessmentResult.totalCount} Jurisdictions Qualify
                  </h2>
                  <p className="text-slate-600 mt-1">
                    {assessmentResult.groupName} — FY{' '}
                    {assessmentResult.fiscalYear} Transitional CbCR Safe Harbour
                    Assessment
                  </p>
                  {assessmentResult.nonQualifyingJurisdictions.length > 0 && (
                    <p className="text-sm text-slate-500 mt-2">
                      <strong>Requiring full GloBE computation:</strong>{' '}
                      {assessmentResult.nonQualifyingJurisdictions.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Jurisdiction Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-200">
                      <th className="text-left py-3 px-3 text-slate-600 font-semibold">
                        Jurisdiction
                      </th>
                      <th className="text-center py-3 px-3 text-slate-600 font-semibold">
                        Status
                      </th>
                      <th className="text-center py-3 px-3 text-slate-600 font-semibold">
                        Qualifying Test
                      </th>
                      <th className="text-right py-3 px-3 text-slate-600 font-semibold">
                        CbCR ETR
                      </th>
                      <th className="text-center py-3 px-3 text-slate-600 font-semibold">
                        De Minimis
                      </th>
                      <th className="text-center py-3 px-3 text-slate-600 font-semibold">
                        Simplified ETR
                      </th>
                      <th className="text-center py-3 px-3 text-slate-600 font-semibold">
                        Routine Profits
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {assessmentResult.jurisdictionAssessments.map(
                      (assessment) => (
                        <tr
                          key={assessment.jurisdictionId}
                          className={`border-b border-slate-100 ${
                            assessment.overallQualifies
                              ? 'bg-emerald-50/50'
                              : 'bg-red-50/50'
                          }`}
                        >
                          <td className="py-3 px-3 font-medium text-mojitax-navy">
                            {assessment.jurisdiction}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {assessment.overallQualifies ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                                <CheckCircle className="w-3 h-3" /> QUALIFIES
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                                <XCircle className="w-3 h-3" /> FAILS
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center text-slate-600">
                            {assessment.qualifyingTest
                              ? getQualifyingTestLabel(
                                  assessment.qualifyingTest
                                )
                              : '—'}
                          </td>
                          <td className="py-3 px-3 text-right font-mono">
                            {assessment.cbcrETR !== null
                              ? formatPercent(assessment.cbcrETR)
                              : 'Loss'}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <TestBadge pass={assessment.deMinimis.qualifies} />
                          </td>
                          <td className="py-3 px-3 text-center">
                            <TestBadge
                              pass={assessment.simplifiedETR.qualifies}
                            />
                          </td>
                          <td className="py-3 px-3 text-center">
                            <TestBadge
                              pass={assessment.routineProfits.qualifies}
                            />
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Action Items */}
          {assessmentResult.nonQualifyingJurisdictions.length > 0 && (
            <Card className="border-amber-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-amber-800 mb-2">
                      Jurisdictions Requiring Full GloBE Computation
                    </h3>
                    <p className="text-sm text-amber-700 mb-3">
                      The following jurisdictions do not qualify for the
                      transitional safe harbour and require a full GloBE
                      computation using the ETR Calculator to determine ETR,
                      SBIE, and any top-up tax liability.
                    </p>
                    <ul className="space-y-2">
                      {assessmentResult.jurisdictionAssessments
                        .filter((a) => !a.overallQualifies)
                        .map((a) => (
                          <li
                            key={a.jurisdictionId}
                            className="flex items-center gap-2 text-sm"
                          >
                            <XCircle className="w-4 h-4 text-red-500" />
                            <span className="font-medium">
                              {a.jurisdiction}
                            </span>
                            <span className="text-slate-500">
                              — CbCR ETR{' '}
                              {a.cbcrETR !== null
                                ? formatPercent(a.cbcrETR)
                                : 'Loss'}
                              , failed all 3 tests
                            </span>
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Key Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Key Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {assessmentResult.qualifyingCount > 0 && (
                <InsightItem
                  icon={
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  }
                  text={`${assessmentResult.qualifyingCount} of ${assessmentResult.totalCount} jurisdictions qualify for the safe harbour — no full GloBE computation needed for these jurisdictions.`}
                />
              )}
              {assessmentResult.jurisdictionAssessments.some(
                (a) => a.qualifyingTest === 'DE_MINIMIS'
              ) && (
                <InsightItem
                  icon={<Info className="w-4 h-4 text-blue-500" />}
                  text={`De Minimis: ${assessmentResult.jurisdictionAssessments
                    .filter((a) => a.qualifyingTest === 'DE_MINIMIS')
                    .map((a) => a.jurisdiction)
                    .join(', ')} — small operations below €10M revenue and €1M profit thresholds.`}
                />
              )}
              {assessmentResult.jurisdictionAssessments.some(
                (a) => a.qualifyingTest === 'SIMPLIFIED_ETR'
              ) && (
                <InsightItem
                  icon={<Info className="w-4 h-4 text-blue-500" />}
                  text={`Simplified ETR: ${assessmentResult.jurisdictionAssessments
                    .filter((a) => a.qualifyingTest === 'SIMPLIFIED_ETR')
                    .map(
                      (a) =>
                        `${a.jurisdiction} (${a.cbcrETR !== null ? formatPercent(a.cbcrETR) : 'N/A'})`
                    )
                    .join(', ')} — CbCR ETR at or above ${rates.etrRate}% transition rate.`}
                />
              )}
              {assessmentResult.jurisdictionAssessments.some(
                (a) => a.qualifyingTest === 'ROUTINE_PROFITS'
              ) && (
                <InsightItem
                  icon={<Info className="w-4 h-4 text-blue-500" />}
                  text={`Routine Profits: ${assessmentResult.jurisdictionAssessments
                    .filter((a) => a.qualifyingTest === 'ROUTINE_PROFITS')
                    .map((a) => a.jurisdiction)
                    .join(', ')} — all profit attributable to substance (payroll and tangible assets).`}
                />
              )}
              {assessmentResult.nonQualifyingJurisdictions.length > 0 && (
                <InsightItem
                  icon={
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  }
                  text={`${assessmentResult.nonQualifyingJurisdictions.join(' and ')} require${assessmentResult.nonQualifyingJurisdictions.length === 1 ? 's' : ''} full GloBE computation — use the ETR Calculator to determine top-up tax liability.`}
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ============================== */}
      {/* NAVIGATION BUTTONS */}
      {/* ============================== */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <div className="flex items-center gap-2">
          {currentStepIndex > 0 && (
            <Button variant="outline" onClick={goBack}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={resetForm}>
            Reset
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {onSave && groupName && currentStep === 'SUMMARY' && (
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Assessment'}
            </Button>
          )}
          {currentStepIndex < SAFE_HARBOUR_STEPS.length - 1 && (
            <Button onClick={goNext}>
              {currentStep === 'CBCR_DATA' ? 'Run Assessment' : 'Next'}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

/** Numeric input with label and hint */
function NumericInput({
  label,
  value,
  onChange,
  hint,
  allowNegative = false,
  isInteger = false,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  hint?: string;
  allowNegative?: boolean;
  isInteger?: boolean;
}) {
  const [displayValue, setDisplayValue] = useState(
    value === 0 ? '' : String(value)
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setDisplayValue(raw);
    const stripped = raw.replace(/,/g, '');
    const parsed = isInteger ? parseInt(stripped, 10) : parseFloat(stripped);
    if (!isNaN(parsed) && (allowNegative || parsed >= 0)) {
      onChange(parsed);
    } else if (raw === '' || raw === '-') {
      onChange(0);
    }
  };

  const handleBlur = () => {
    if (value === 0 && displayValue === '') return;
    setDisplayValue(value === 0 ? '' : String(value));
  };

  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">
        {label}
      </label>
      <input
        type="text"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="0"
        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
      />
      {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
    </div>
  );
}

/** Small pass/fail badge for summary table */
function TestBadge({ pass }: { pass: boolean }) {
  return pass ? (
    <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" />
  ) : (
    <XCircle className="w-4 h-4 text-red-400 mx-auto" />
  );
}

/** Insight item with icon */
function InsightItem({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="flex-shrink-0 mt-0.5">{icon}</span>
      <p className="text-sm text-slate-700">{text}</p>
    </div>
  );
}

/** Jurisdiction assessment card for Step 3 */
function JurisdictionAssessmentCard({
  assessment,
  currency,
  fiscalYear,
}: {
  assessment: JurisdictionAssessment;
  currency: string;
  fiscalYear: SafeHarbourFiscalYear;
}) {
  const [expanded, setExpanded] = useState(false);
  const currSymbol = getCurrencySymbol(currency);

  return (
    <Card
      className={`border-l-4 ${
        assessment.overallQualifies
          ? 'border-l-emerald-500'
          : 'border-l-red-500'
      }`}
    >
      <div
        className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          {assessment.overallQualifies ? (
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          ) : (
            <XCircle className="w-5 h-5 text-red-500" />
          )}
          <div>
            <span className="font-semibold text-mojitax-navy">
              {assessment.jurisdiction}
            </span>
            <span className="ml-3 text-sm text-slate-500">
              {assessment.overallQualifies ? (
                <>
                  Qualifies —{' '}
                  <span className="font-medium text-emerald-600">
                    {getQualifyingTestLabel(assessment.qualifyingTest)}
                  </span>
                </>
              ) : (
                <span className="text-red-600">
                  Does not qualify — fails all tests
                </span>
              )}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {assessment.cbcrETR !== null && (
            <span className="text-sm font-mono text-slate-600">
              ETR {formatPercent(assessment.cbcrETR)}
            </span>
          )}
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </div>

      {expanded && (
        <CardContent className="p-4 pt-0 space-y-4">
          {/* Test 1: De Minimis */}
          <TestResultCard
            testNumber={1}
            testName="De Minimis Test"
            articleRef="Article 9.1.2"
            qualifies={assessment.deMinimis.qualifies}
            color="amber"
          >
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                {assessment.deMinimis.revenueBelow ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
                <span>
                  Revenue {currSymbol}
                  {Math.round(assessment.deMinimis.revenue).toLocaleString(
                    'en-GB'
                  )}{' '}
                  {assessment.deMinimis.revenueBelow ? '<' : '≥'} {currSymbol}
                  10,000,000
                </span>
              </div>
              <div className="flex items-center gap-2">
                {assessment.deMinimis.profitBelow ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
                <span>
                  |Profit| {currSymbol}
                  {Math.round(assessment.deMinimis.profitAbs).toLocaleString(
                    'en-GB'
                  )}{' '}
                  {assessment.deMinimis.profitBelow ? '<' : '≥'} {currSymbol}
                  1,000,000
                </span>
              </div>
            </div>
          </TestResultCard>

          {/* Test 2: Simplified ETR */}
          <TestResultCard
            testNumber={2}
            testName="Simplified ETR Test"
            articleRef="Article 9.1.3"
            qualifies={assessment.simplifiedETR.qualifies}
            color="blue"
          >
            <div className="text-sm space-y-2">
              {assessment.simplifiedETR.isLossMaking ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>
                    Loss-making jurisdiction — automatic qualification
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-500">Simplified ETR:</span>
                    <span className="ml-2 font-semibold font-mono">
                      {formatPercent(assessment.simplifiedETR.calculatedETR)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">
                      Transition Rate (FY {fiscalYear}):
                    </span>
                    <span className="ml-2 font-semibold">
                      {assessment.simplifiedETR.transitionRate}%
                    </span>
                  </div>
                </div>
              )}
              {!assessment.simplifiedETR.isLossMaking && (
                <div className="flex items-center gap-2">
                  {assessment.simplifiedETR.qualifies ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                  <span>
                    {formatPercent(assessment.simplifiedETR.calculatedETR)}{' '}
                    {assessment.simplifiedETR.qualifies ? '≥' : '<'}{' '}
                    {assessment.simplifiedETR.transitionRate}% transition rate
                  </span>
                </div>
              )}
            </div>
          </TestResultCard>

          {/* Test 3: Routine Profits */}
          <TestResultCard
            testNumber={3}
            testName="Routine Profits Test"
            articleRef="Article 9.1.4"
            qualifies={assessment.routineProfits.qualifies}
            color="purple"
          >
            <div className="text-sm space-y-2">
              {assessment.routineProfits.isLossMaking ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>
                    Loss-making jurisdiction — automatic qualification
                  </span>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <span className="text-slate-500 block text-xs">
                        Payroll SBIE ({assessment.routineProfits.payrollRate}%)
                      </span>
                      <span className="font-semibold">
                        {formatCurrency(
                          assessment.routineProfits.sbiePayroll,
                          currency
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-xs">
                        Asset SBIE ({assessment.routineProfits.assetRate}%)
                      </span>
                      <span className="font-semibold">
                        {formatCurrency(
                          assessment.routineProfits.sbieAssets,
                          currency
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-xs">
                        Total SBIE
                      </span>
                      <span className="font-bold">
                        {formatCurrency(
                          assessment.routineProfits.totalSBIE,
                          currency
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-xs">
                        CbCR PBT
                      </span>
                      <span className="font-bold">
                        {formatCurrency(
                          assessment.routineProfits.profitBeforeTax,
                          currency
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {assessment.routineProfits.qualifies ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                    <span>
                      PBT{' '}
                      {formatCurrency(
                        assessment.routineProfits.profitBeforeTax,
                        currency
                      )}{' '}
                      {assessment.routineProfits.qualifies ? '≤' : '>'} SBIE{' '}
                      {formatCurrency(
                        assessment.routineProfits.totalSBIE,
                        currency
                      )}
                    </span>
                  </div>
                </>
              )}
            </div>
          </TestResultCard>
        </CardContent>
      )}
    </Card>
  );
}

/** Individual test result card within the assessment */
function TestResultCard({
  testNumber,
  testName,
  articleRef,
  qualifies,
  color,
  children,
}: {
  testNumber: number;
  testName: string;
  articleRef: string;
  qualifies: boolean;
  color: 'amber' | 'blue' | 'purple';
  children: React.ReactNode;
}) {
  const colorClasses = {
    amber: {
      bg: 'bg-amber-100',
      text: 'text-amber-700',
    },
    blue: {
      bg: 'bg-blue-100',
      text: 'text-blue-700',
    },
    purple: {
      bg: 'bg-purple-100',
      text: 'text-purple-700',
    },
  };

  const c = colorClasses[color];

  return (
    <div className="p-3 bg-slate-50 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className={`w-6 h-6 rounded-full ${c.bg} flex items-center justify-center text-xs font-bold ${c.text}`}
          >
            {testNumber}
          </span>
          <span className="font-medium text-sm text-slate-700">
            {testName}
          </span>
          <span className="text-xs text-slate-400">{articleRef}</span>
        </div>
        {qualifies ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
            <CheckCircle className="w-3 h-3" /> PASS
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
            <XCircle className="w-3 h-3" /> FAIL
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

export default SafeHarbourQualifier;
