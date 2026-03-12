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
  Globe,
  Building,
  GitBranch,
  FileText,
  Layout,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type {
  GroupInfo,
  RevenueYear,
  Entity,
  EntityClassification,
  ScopeResult,
  DecisionStep,
  ScopeDecisionTreeProps,
  SavedScopeAssessment,
  CEType,
  ExcludedReason,
  OutOfScopeReason,
  ClassificationStatus,
} from './types';
import {
  STEP_CONFIGS,
  DECISION_STEPS,
  JURISDICTIONS,
  CURRENCIES,
  ACCOUNTING_STANDARDS,
  CE_TYPE_OPTIONS,
  EXCLUDED_REASON_OPTIONS,
  OUT_OF_SCOPE_REASON_OPTIONS,
  STEP_EDUCATIONAL_NOTES,
  CLASSIFICATION_GUIDANCE,
  REVENUE_THRESHOLD_EUR,
  YEARS_REQUIRED,
  INITIAL_GROUP_INFO,
  INITIAL_ENTITY,
  CASE_STUDY_GROUP_INFO,
  CASE_STUDY_REVENUE_YEARS,
  CASE_STUDY_ENTITIES,
  calculateRevenueYear,
  getPrecedingYears,
  checkRevenueThreshold,
  computeScopeResult,
  formatCurrency,
  formatMillions,
  generateEntityId,
  getOptionLabel,
  validateGroupInfo,
  validateRevenueYears,
  validateEntities,
  validateClassifications,
  classifyAsCE,
  classifyAsExcluded,
  classifyAsOutOfScope,
  isMOCE,
  type ValidationError,
} from './utils';

// ============================================================
// COMPONENT
// ============================================================

export function ScopeDecisionTree({
  onSave,
  onDelete,
  savedItems = [],
  onTrackCalculation,
  onTrackStepChange,
  onTrackError,
  onTrackCompletion,
}: ScopeDecisionTreeProps) {
  // --- State ---
  const [currentStep, setCurrentStep] = useState<DecisionStep>('GROUP_INFO');
  const [groupInfo, setGroupInfo] = useState<GroupInfo>(INITIAL_GROUP_INFO);
  const [revenueYears, setRevenueYears] = useState<RevenueYear[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [expandedEntity, setExpandedEntity] = useState<string | null>(null);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showEducationalNote, setShowEducationalNote] = useState(true);

  const currentStepIndex = DECISION_STEPS.indexOf(currentStep);
  const isEUR = groupInfo.reportingCurrency === 'EUR';

  // --- Computed ---

  const revenueThresholdResult = useMemo(
    () => checkRevenueThreshold(revenueYears),
    [revenueYears]
  );

  const scopeResult = useMemo(
    () => computeScopeResult(revenueYears, entities),
    [revenueYears, entities]
  );

  // --- Navigation ---

  const goToStep = useCallback(
    (step: DecisionStep) => {
      onTrackStepChange?.(currentStep, step);
      setErrors([]);
      setCurrentStep(step);
    },
    [currentStep, onTrackStepChange]
  );

  const goNext = useCallback(() => {
    // Validate current step
    let stepErrors: ValidationError[] = [];

    switch (currentStep) {
      case 'GROUP_INFO':
        stepErrors = validateGroupInfo(groupInfo);
        break;
      case 'REVENUE_TEST':
        stepErrors = validateRevenueYears(
          revenueYears,
          groupInfo.reportingCurrency
        );
        break;
      case 'ENTITY_REGISTER':
        stepErrors = validateEntities(entities);
        break;
      case 'ENTITY_CLASSIFICATION':
        stepErrors = validateClassifications(entities);
        break;
    }

    if (stepErrors.length > 0) {
      setErrors(stepErrors);
      onTrackError?.(stepErrors[0].message, { step: currentStep });
      return;
    }

    setErrors([]);

    // Initialise revenue years when entering Revenue Test step
    if (currentStep === 'GROUP_INFO' && revenueYears.length === 0) {
      const years = getPrecedingYears(groupInfo.testingFiscalYear);
      setRevenueYears(
        years.map((fy) =>
          calculateRevenueYear(fy, 0, isEUR ? 1 : 0)
        )
      );
    }

    // Track calculation on Revenue Test completion
    if (currentStep === 'REVENUE_TEST') {
      onTrackCalculation?.('revenue_threshold', {
        yearsExceeding: revenueThresholdResult.yearsExceeding,
        inScope: revenueThresholdResult.inScope,
      });
    }

    // Track completion on reaching Results
    if (currentStep === 'ENTITY_CLASSIFICATION') {
      onTrackCompletion?.({
        inScope: scopeResult.inScope,
        ceCount: scopeResult.totalCEs,
        excludedCount: scopeResult.excludedEntities.length,
        jurisdictionCount: scopeResult.jurisdictionCount,
      });
    }

    const nextIndex = currentStepIndex + 1;
    if (nextIndex < DECISION_STEPS.length) {
      goToStep(DECISION_STEPS[nextIndex]);
    }
  }, [
    currentStep,
    currentStepIndex,
    groupInfo,
    revenueYears,
    entities,
    isEUR,
    revenueThresholdResult,
    scopeResult,
    goToStep,
    onTrackCalculation,
    onTrackCompletion,
    onTrackError,
  ]);

  const goPrevious = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      goToStep(DECISION_STEPS[prevIndex]);
    }
  }, [currentStepIndex, goToStep]);

  // --- Entity Actions ---

  const addEntity = () => {
    const id = generateEntityId();
    setEntities([...entities, { ...INITIAL_ENTITY, id }]);
    setExpandedEntity(id);
  };

  const removeEntity = (id: string) => {
    setEntities(entities.filter((e) => e.id !== id));
    if (expandedEntity === id) setExpandedEntity(null);
  };

  const updateEntity = (
    id: string,
    updates: Partial<Entity>
  ) => {
    setEntities(
      entities.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
  };

  const updateEntityClassification = (
    id: string,
    classification: EntityClassification
  ) => {
    updateEntity(id, { classification });
    onTrackCalculation?.('entity_classified', {
      entityId: id,
      classification: classification.status,
      articleRef: classification.articleReference,
    });
  };

  // --- Revenue Year Updates ---

  const updateRevenueYear = (index: number, field: 'revenueLocal' | 'exchangeRate', value: number) => {
    setRevenueYears((prev) =>
      prev.map((ry, i) => {
        if (i !== index) return ry;
        const updated = { ...ry, [field]: value };
        const rate = field === 'exchangeRate' ? value : ry.exchangeRate;
        const rev = field === 'revenueLocal' ? value : ry.revenueLocal;
        updated.revenueEUR = Math.round(rev * rate * 100) / 100;
        updated.meetsThreshold = updated.revenueEUR >= REVENUE_THRESHOLD_EUR;
        return updated;
      })
    );
  };

  // --- Case Study / Save / Load ---

  const loadCaseStudy = () => {
    if (!window.confirm('Replace current data with Stratos Group case study?'))
      return;
    setGroupInfo(CASE_STUDY_GROUP_INFO);
    setRevenueYears(CASE_STUDY_REVENUE_YEARS);
    setEntities(CASE_STUDY_ENTITIES);
    setCurrentStep('GROUP_INFO');
    setErrors([]);
  };

  const handleSave = async () => {
    if (!onSave) return;
    const name =
      groupInfo.groupName ||
      `Untitled — ${new Date().toLocaleDateString()}`;
    try {
      await onSave({ name, groupInfo, revenueYears, entities });
      alert('Scope assessment saved.');
    } catch {
      alert('Save failed.');
    }
  };

  const loadSession = (session: SavedScopeAssessment) => {
    setGroupInfo(session.groupInfo);
    setRevenueYears(session.revenueYears);
    setEntities(session.entities);
    setCurrentStep('GROUP_INFO');
    setErrors([]);
    setShowLoadModal(false);
  };

  // ============================================================
  // RENDER — Step Indicator
  // ============================================================

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-8 overflow-x-auto">
      {STEP_CONFIGS.map((step, idx) => {
        const isActive = idx === currentStepIndex;
        const isCompleted = idx < currentStepIndex;
        const isFuture = idx > currentStepIndex;

        return (
          <React.Fragment key={step.key}>
            {idx > 0 && (
              <div
                className={`flex-1 h-0.5 mx-2 ${
                  isCompleted ? 'bg-mojitax-green' : 'bg-slate-200'
                }`}
              />
            )}
            <button
              onClick={() => {
                if (isCompleted) goToStep(step.key);
              }}
              disabled={isFuture}
              className={`flex flex-col items-center min-w-[80px] ${
                isCompleted ? 'cursor-pointer' : isFuture ? 'cursor-not-allowed' : ''
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-1 ${
                  isActive
                    ? 'bg-mojitax-green text-white'
                    : isCompleted
                      ? 'bg-mojitax-green/20 text-mojitax-green'
                      : 'bg-slate-100 text-slate-400'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  idx + 1
                )}
              </div>
              <span
                className={`text-xs text-center ${
                  isActive
                    ? 'text-mojitax-green font-bold'
                    : isCompleted
                      ? 'text-slate-600'
                      : 'text-slate-400'
                }`}
              >
                {step.shortLabel}
              </span>
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );

  // ============================================================
  // RENDER — Educational Note Banner
  // ============================================================

  const renderEducationalNote = () => {
    const note = STEP_EDUCATIONAL_NOTES[currentStep];
    const config = STEP_CONFIGS[currentStepIndex];
    if (!note || !showEducationalNote) return null;

    return (
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg">
        <div className="flex justify-between items-start">
          <div className="flex">
            <Info className="h-5 w-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              {config.articleRef && (
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">
                  {config.articleRef}
                </p>
              )}
              <p className="text-sm text-blue-800">{note}</p>
            </div>
          </div>
          <button
            onClick={() => setShowEducationalNote(false)}
            className="text-blue-400 hover:text-blue-600 ml-4"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  // ============================================================
  // RENDER — Error Banner
  // ============================================================

  const renderErrors = () => {
    if (errors.length === 0) return null;
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
        <div className="flex">
          <AlertTriangle className="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-red-800 mb-1">
              Please fix the following:
            </p>
            <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
              {errors.map((err, i) => (
                <li key={i}>{err.message}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================
  // RENDER — Step 1: Group Information
  // ============================================================

  const renderGroupInfo = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Globe className="w-5 h-5 mr-2 text-mojitax-green" />
          MNE Group Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              MNE Group Name
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-mojitax-green focus:border-mojitax-green"
              value={groupInfo.groupName}
              onChange={(e) =>
                setGroupInfo({ ...groupInfo, groupName: e.target.value })
              }
              placeholder="e.g. Stratos Holdings plc"
            />
            <p className="mt-1 text-xs text-slate-500">
              The legal name of the Ultimate Parent Entity or the group trading
              name used in Consolidated Financial Statements.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              UPE Jurisdiction
            </label>
            <div className="relative">
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-mojitax-green focus:border-mojitax-green appearance-none"
                value={groupInfo.upeJurisdiction}
                onChange={(e) =>
                  setGroupInfo({
                    ...groupInfo,
                    upeJurisdiction: e.target.value,
                  })
                }
              >
                <option value="">Select jurisdiction...</option>
                {JURISDICTIONS.map((j) => (
                  <option key={j.value} value={j.value}>
                    {j.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              The UPE jurisdiction determines which IIR applies first under the
              ordering rules (Article 2.1).
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Reporting Currency
            </label>
            <div className="relative">
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-mojitax-green focus:border-mojitax-green appearance-none"
                value={groupInfo.reportingCurrency}
                onChange={(e) =>
                  setGroupInfo({
                    ...groupInfo,
                    reportingCurrency: e.target.value,
                  })
                }
              >
                {CURRENCIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {isEUR
                ? 'Revenue is already in EUR — no conversion needed.'
                : 'Revenue must be converted to EUR for the threshold test.'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Accounting Standard
            </label>
            <div className="relative">
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-mojitax-green focus:border-mojitax-green appearance-none"
                value={groupInfo.accountingStandard}
                onChange={(e) =>
                  setGroupInfo({
                    ...groupInfo,
                    accountingStandard: e.target.value as GroupInfo['accountingStandard'],
                  })
                }
              >
                {ACCOUNTING_STANDARDS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              GloBE starts from the CFS prepared under this standard
              (Article 3.1).
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Fiscal Year End
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-mojitax-green focus:border-mojitax-green"
              value={groupInfo.fiscalYearEnd}
              onChange={(e) =>
                setGroupInfo({ ...groupInfo, fiscalYearEnd: e.target.value })
              }
              placeholder="e.g. 31 December"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Testing Fiscal Year
            </label>
            <input
              type="number"
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-mojitax-green focus:border-mojitax-green"
              value={groupInfo.testingFiscalYear}
              onChange={(e) =>
                setGroupInfo({
                  ...groupInfo,
                  testingFiscalYear: parseInt(e.target.value) || 2025,
                })
              }
              min={2024}
            />
            <p className="mt-1 text-xs text-slate-500">
              The fiscal year you are assessing for GloBE scope. The revenue
              threshold tests the 4 preceding years.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // ============================================================
  // RENDER — Step 2: Revenue Threshold Test
  // ============================================================

  const renderRevenueTest = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2 text-mojitax-green" />
            Revenue Threshold Test — Article 1.1.1
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 mb-6">
            Enter consolidated revenue for each of the 4 fiscal years
            immediately preceding FY {groupInfo.testingFiscalYear}.
            {!isEUR &&
              ` Revenue is in ${groupInfo.reportingCurrency} — provide the annual average EUR/${groupInfo.reportingCurrency} exchange rate for each year.`}
          </p>

          {/* Revenue Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left">Fiscal Year</th>
                  <th className="px-4 py-3 text-right">
                    Revenue ({groupInfo.reportingCurrency})
                  </th>
                  {!isEUR && (
                    <th className="px-4 py-3 text-right">
                      EUR/{groupInfo.reportingCurrency} Rate
                    </th>
                  )}
                  <th className="px-4 py-3 text-right">Revenue (EUR)</th>
                  <th className="px-4 py-3 text-center">≥ €750M?</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {revenueYears.map((ry, index) => (
                  <tr key={ry.fiscalYear} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      FY {ry.fiscalYear}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <input
                        type="number"
                        className="w-44 px-2 py-1 border border-slate-300 rounded text-right text-sm focus:ring-mojitax-green focus:border-mojitax-green"
                        value={ry.revenueLocal || ''}
                        onChange={(e) =>
                          updateRevenueYear(
                            index,
                            'revenueLocal',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        placeholder="0"
                      />
                    </td>
                    {!isEUR && (
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          step="0.0001"
                          className="w-28 px-2 py-1 border border-slate-300 rounded text-right text-sm focus:ring-mojitax-green focus:border-mojitax-green"
                          value={ry.exchangeRate || ''}
                          onChange={(e) =>
                            updateRevenueYear(
                              index,
                              'exchangeRate',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          placeholder="1.0000"
                        />
                      </td>
                    )}
                    <td className="px-4 py-3 text-right font-medium text-slate-700">
                      {ry.revenueLocal > 0
                        ? formatMillions(ry.revenueEUR, 'EUR')
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {ry.revenueLocal > 0 ? (
                        ry.meetsThreshold ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                            <XCircle className="w-3 h-3 mr-1" />
                            No
                          </span>
                        )
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Threshold Result */}
      {revenueYears.some((ry) => ry.revenueLocal > 0) && (
        <Card
          className={`border-2 ${
            revenueThresholdResult.inScope
              ? 'border-green-200 bg-green-50'
              : 'border-red-200 bg-red-50'
          }`}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {revenueThresholdResult.inScope ? (
                  <CheckCircle className="w-8 h-8 text-green-600 mr-4" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-600 mr-4" />
                )}
                <div>
                  <h3
                    className={`text-lg font-bold ${
                      revenueThresholdResult.inScope
                        ? 'text-green-800'
                        : 'text-red-800'
                    }`}
                  >
                    {revenueThresholdResult.inScope
                      ? 'IN SCOPE — Revenue threshold met'
                      : 'NOT IN SCOPE — Revenue threshold not met'}
                  </h3>
                  <p
                    className={`text-sm ${
                      revenueThresholdResult.inScope
                        ? 'text-green-700'
                        : 'text-red-700'
                    }`}
                  >
                    {revenueThresholdResult.yearsExceeding} of 4 years exceed
                    €750M (minimum {YEARS_REQUIRED} required).
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // ============================================================
  // RENDER — Step 3: Entity Register
  // ============================================================

  const renderEntityRegister = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-800 flex items-center">
          <Building className="w-5 h-5 mr-2 text-mojitax-green" />
          Entity Register
        </h2>
        <Button onClick={addEntity} variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-2" /> Add Entity
        </Button>
      </div>

      {entities.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-slate-300">
          <Building className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 mb-2">No entities added yet.</p>
          <button
            onClick={addEntity}
            className="text-mojitax-green hover:text-mojitax-green/80 font-medium"
          >
            Add your first entity
          </button>
        </div>
      )}

      <div className="space-y-3">
        {entities.map((entity, idx) => (
          <Card key={entity.id} className="overflow-hidden">
            {/* Collapsed Header */}
            <div
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50"
              onClick={() =>
                setExpandedEntity(
                  expandedEntity === entity.id ? null : entity.id
                )
              }
            >
              <div className="flex items-center space-x-3">
                <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                  {idx + 1}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {entity.entityName || 'New Entity'}
                  </h3>
                  <div className="flex items-center space-x-2 text-xs text-slate-500">
                    <span>{entity.jurisdiction || 'No jurisdiction'}</span>
                    {entity.isUPE && (
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full font-bold">
                        UPE
                      </span>
                    )}
                    {entity.isPE && (
                      <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-full font-bold">
                        PE
                      </span>
                    )}
                    {entity.ownershipPercent < 100 && (
                      <span className="text-slate-400">
                        {entity.ownershipPercent}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {entity.classification.status !== 'UNCLASSIFIED' && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      entity.classification.status === 'CE'
                        ? 'bg-green-100 text-green-700'
                        : entity.classification.status === 'EXCLUDED'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {entity.classification.status === 'CE'
                      ? `CE (${entity.classification.ceType})`
                      : entity.classification.status === 'EXCLUDED'
                        ? 'Excluded'
                        : 'Out of Scope'}
                  </span>
                )}
                {expandedEntity === entity.id ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </div>
            </div>

            {/* Expanded Form */}
            {expandedEntity === entity.id && (
              <div className="p-6 border-t border-slate-100 bg-slate-50">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                      Entity Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-mojitax-green focus:border-mojitax-green"
                      value={entity.entityName}
                      onChange={(e) =>
                        updateEntity(entity.id, {
                          entityName: e.target.value,
                        })
                      }
                      placeholder="e.g. SG Germany GmbH"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                      Jurisdiction
                    </label>
                    <select
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-mojitax-green focus:border-mojitax-green"
                      value={entity.jurisdiction}
                      onChange={(e) =>
                        updateEntity(entity.id, {
                          jurisdiction: e.target.value,
                        })
                      }
                    >
                      <option value="">Select...</option>
                      {JURISDICTIONS.map((j) => (
                        <option key={j.value} value={j.value}>
                          {j.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                      Ownership %
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-mojitax-green focus:border-mojitax-green"
                      value={entity.ownershipPercent}
                      onChange={(e) =>
                        updateEntity(entity.id, {
                          ownershipPercent:
                            parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                    {isMOCE(entity.ownershipPercent) && (
                      <p className="mt-1 text-xs text-amber-600">
                        ⚠ Ownership &lt; 30% — may qualify as MOCE (Art. 5.6)
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                      Parent Entity
                    </label>
                    <select
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-mojitax-green focus:border-mojitax-green"
                      value={entity.parentEntityId || ''}
                      onChange={(e) =>
                        updateEntity(entity.id, {
                          parentEntityId: e.target.value || null,
                        })
                      }
                    >
                      <option value="">None (top-level)</option>
                      {entities
                        .filter((e2) => e2.id !== entity.id)
                        .map((e2) => (
                          <option key={e2.id} value={e2.id}>
                            {e2.entityName || `Entity ${e2.id}`}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="flex flex-col space-y-3 pt-2">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded text-mojitax-green focus:ring-mojitax-green h-4 w-4"
                        checked={entity.isUPE}
                        onChange={(e) => {
                          // Ensure only one UPE
                          if (e.target.checked) {
                            setEntities(
                              entities.map((ent) => ({
                                ...ent,
                                isUPE: ent.id === entity.id,
                                isDFE:
                                  ent.id === entity.id
                                    ? ent.isDFE || true
                                    : ent.isDFE,
                              }))
                            );
                          } else {
                            updateEntity(entity.id, { isUPE: false });
                          }
                        }}
                      />
                      <span className="ml-2 text-sm text-slate-700">
                        Ultimate Parent Entity (UPE)
                      </span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded text-mojitax-green focus:ring-mojitax-green h-4 w-4"
                        checked={entity.isPE}
                        onChange={(e) =>
                          updateEntity(entity.id, {
                            isPE: e.target.checked,
                            peOfEntityId: e.target.checked
                              ? entity.parentEntityId
                              : null,
                          })
                        }
                      />
                      <span className="ml-2 text-sm text-slate-700">
                        Permanent Establishment (branch)
                      </span>
                    </label>
                    {entity.isPE && (
                      <div className="ml-6">
                        <label className="block text-xs text-slate-500 mb-1">
                          PE of which entity?
                        </label>
                        <select
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-sm"
                          value={entity.peOfEntityId || ''}
                          onChange={(e) =>
                            updateEntity(entity.id, {
                              peOfEntityId: e.target.value || null,
                            })
                          }
                        >
                          <option value="">Select head office...</option>
                          {entities
                            .filter(
                              (e2) =>
                                e2.id !== entity.id && !e2.isPE
                            )
                            .map((e2) => (
                              <option key={e2.id} value={e2.id}>
                                {e2.entityName || `Entity ${e2.id}`}
                              </option>
                            ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                      Notes
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm"
                      value={entity.notes}
                      onChange={(e) =>
                        updateEntity(entity.id, { notes: e.target.value })
                      }
                      placeholder="Optional — additional context"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => removeEntity(entity.id)}
                    className="text-red-600 hover:text-red-800 text-sm flex items-center px-3 py-2 rounded hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Remove Entity
                  </button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {entities.length > 0 && (
        <div className="bg-slate-50 rounded-lg p-4 flex items-center justify-between text-sm text-slate-600">
          <span>
            <strong>{entities.length}</strong> entities registered
          </span>
          <span>
            UPE:{' '}
            {entities.find((e) => e.isUPE)?.entityName || (
              <span className="text-red-500 font-medium">Not designated</span>
            )}
          </span>
        </div>
      )}
    </div>
  );

  // ============================================================
  // RENDER — Step 4: Entity Classification
  // ============================================================

  const renderEntityClassification = () => {
    const classificationCounts = {
      CE: entities.filter((e) => e.classification.status === 'CE').length,
      EXCLUDED: entities.filter((e) => e.classification.status === 'EXCLUDED')
        .length,
      OUT_OF_SCOPE: entities.filter(
        (e) => e.classification.status === 'OUT_OF_SCOPE'
      ).length,
      UNCLASSIFIED: entities.filter(
        (e) => e.classification.status === 'UNCLASSIFIED'
      ).length,
    };

    return (
      <div className="space-y-6">
        {/* Classification Summary Bar */}
        <div className="grid grid-cols-4 gap-3">
          {[
            {
              label: 'Constituent Entities',
              count: classificationCounts.CE,
              color: 'bg-green-100 text-green-700 border-green-200',
            },
            {
              label: 'Excluded',
              count: classificationCounts.EXCLUDED,
              color: 'bg-amber-100 text-amber-700 border-amber-200',
            },
            {
              label: 'Out of Scope',
              count: classificationCounts.OUT_OF_SCOPE,
              color: 'bg-slate-100 text-slate-600 border-slate-200',
            },
            {
              label: 'Unclassified',
              count: classificationCounts.UNCLASSIFIED,
              color:
                classificationCounts.UNCLASSIFIED > 0
                  ? 'bg-red-100 text-red-700 border-red-200'
                  : 'bg-slate-50 text-slate-400 border-slate-200',
            },
          ].map((item) => (
            <div
              key={item.label}
              className={`rounded-lg border p-3 text-center ${item.color}`}
            >
              <div className="text-2xl font-bold">{item.count}</div>
              <div className="text-xs font-medium">{item.label}</div>
            </div>
          ))}
        </div>

        {/* Classification Cards */}
        {entities.map((entity) => (
          <Card
            key={entity.id}
            className={`overflow-hidden ${
              entity.classification.status === 'UNCLASSIFIED'
                ? 'border-red-200'
                : ''
            }`}
          >
            <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-900">
                  {entity.entityName}
                </h3>
                <p className="text-xs text-slate-500">
                  {entity.jurisdiction} — {entity.ownershipPercent}% ownership
                  {entity.isPE && ' — PE'}
                  {entity.isUPE && ' — UPE'}
                </p>
              </div>

              <div className="flex flex-col md:flex-row gap-3 md:items-center">
                {/* Classification Status Selector */}
                <select
                  className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-mojitax-green focus:border-mojitax-green min-w-[180px]"
                  value={entity.classification.status}
                  onChange={(e) => {
                    const status = e.target.value as ClassificationStatus;
                    if (status === 'CE') {
                      const ceType: CEType = entity.isUPE
                        ? 'UPE'
                        : entity.isPE
                          ? 'PE'
                          : isMOCE(entity.ownershipPercent)
                            ? 'MOCE'
                            : 'OPERATING';
                      updateEntityClassification(
                        entity.id,
                        classifyAsCE(ceType)
                      );
                    } else if (status === 'EXCLUDED') {
                      updateEntityClassification(
                        entity.id,
                        classifyAsExcluded('NPO')
                      );
                    } else if (status === 'OUT_OF_SCOPE') {
                      updateEntityClassification(
                        entity.id,
                        classifyAsOutOfScope('EQUITY_METHOD', '')
                      );
                    } else {
                      updateEntityClassification(entity.id, {
                        status: 'UNCLASSIFIED',
                      });
                    }
                  }}
                >
                  <option value="UNCLASSIFIED">— Select classification —</option>
                  <option value="CE">Constituent Entity</option>
                  <option value="EXCLUDED">Excluded Entity (Art. 1.5)</option>
                  <option value="OUT_OF_SCOPE">Out of Scope</option>
                </select>

                {/* Sub-type Selector */}
                {entity.classification.status === 'CE' && (
                  <select
                    className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-mojitax-green focus:border-mojitax-green min-w-[240px]"
                    value={entity.classification.ceType || 'OPERATING'}
                    onChange={(e) =>
                      updateEntityClassification(
                        entity.id,
                        classifyAsCE(e.target.value as CEType)
                      )
                    }
                  >
                    {CE_TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                )}

                {entity.classification.status === 'EXCLUDED' && (
                  <select
                    className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-mojitax-green focus:border-mojitax-green min-w-[280px]"
                    value={
                      entity.classification.excludedReason || 'NPO'
                    }
                    onChange={(e) =>
                      updateEntityClassification(
                        entity.id,
                        classifyAsExcluded(
                          e.target.value as ExcludedReason
                        )
                      )
                    }
                  >
                    {EXCLUDED_REASON_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                )}

                {entity.classification.status === 'OUT_OF_SCOPE' && (
                  <select
                    className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-mojitax-green focus:border-mojitax-green min-w-[280px]"
                    value={
                      entity.classification.outOfScopeReason ||
                      'EQUITY_METHOD'
                    }
                    onChange={(e) =>
                      updateEntityClassification(
                        entity.id,
                        classifyAsOutOfScope(
                          e.target.value as OutOfScopeReason,
                          ''
                        )
                      )
                    }
                  >
                    {OUT_OF_SCOPE_REASON_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Article reference display */}
            {entity.classification.articleReference && (
              <div className="px-4 pb-3">
                <span className="text-xs text-slate-400">
                  {entity.classification.articleReference}
                </span>
              </div>
            )}
          </Card>
        ))}

        {/* Guidance panel */}
        <Card className="bg-slate-50">
          <CardContent className="p-4">
            <h4 className="text-sm font-bold text-slate-700 mb-2">
              Classification Guidance
            </h4>
            <div className="space-y-2 text-xs text-slate-600">
              {Object.entries(CLASSIFICATION_GUIDANCE).map(
                ([key, text]) => (
                  <div key={key} className="flex items-start">
                    <span
                      className={`inline-block w-2 h-2 rounded-full mt-1.5 mr-2 flex-shrink-0 ${
                        key === 'CE'
                          ? 'bg-green-400'
                          : key === 'EXCLUDED'
                            ? 'bg-amber-400'
                            : 'bg-slate-400'
                      }`}
                    />
                    <span>{text}</span>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ============================================================
  // RENDER — Step 5: Results
  // ============================================================

  const renderResults = () => {
    const result = scopeResult;

    return (
      <div className="space-y-6">
        {/* In-Scope Banner */}
        <Card
          className={`border-2 overflow-hidden ${
            result.inScope
              ? 'border-green-200'
              : 'border-red-200'
          }`}
        >
          <div
            className={`p-6 ${
              result.inScope ? 'bg-green-50' : 'bg-red-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {result.inScope ? (
                  <CheckCircle className="w-10 h-10 text-green-600 mr-4" />
                ) : (
                  <XCircle className="w-10 h-10 text-red-600 mr-4" />
                )}
                <div>
                  <h2
                    className={`text-2xl font-bold ${
                      result.inScope ? 'text-green-800' : 'text-red-800'
                    }`}
                  >
                    {result.inScope
                      ? 'IN SCOPE — GloBE Rules Apply'
                      : 'NOT IN SCOPE'}
                  </h2>
                  <p
                    className={`text-sm mt-1 ${
                      result.inScope ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    {groupInfo.groupName} — FY {groupInfo.testingFiscalYear}
                  </p>
                </div>
              </div>
              <div className="text-right hidden md:block">
                <div
                  className={`text-3xl font-black ${
                    result.inScope ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {result.yearsExceeding}/{result.totalYearsTested}
                </div>
                <div
                  className={`text-xs font-medium ${
                    result.inScope ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  years ≥ €750M
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Key Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: 'Constituent Entities',
              value: result.totalCEs,
              icon: Building,
              color: 'text-green-600',
            },
            {
              label: 'Jurisdictions',
              value: result.jurisdictionCount,
              icon: Globe,
              color: 'text-blue-600',
            },
            {
              label: 'Excluded Entities',
              value: result.excludedEntities.length,
              icon: AlertTriangle,
              color: 'text-amber-600',
            },
            {
              label: 'Out of Scope',
              value: result.outOfScopeEntities.length,
              icon: XCircle,
              color: 'text-slate-500',
            },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4 text-center">
                <stat.icon
                  className={`w-6 h-6 mx-auto mb-2 ${stat.color}`}
                />
                <div className="text-2xl font-bold text-slate-800">
                  {stat.value}
                </div>
                <div className="text-xs text-slate-500">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* UPE / DFE */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Filing Entity Identification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border rounded-lg p-4">
                <div className="text-xs text-slate-500 uppercase font-bold mb-1">
                  Ultimate Parent Entity (Art. 1.4)
                </div>
                <div className="text-lg font-bold text-slate-800">
                  {result.upeEntity?.entityName || 'Not identified'}
                </div>
                <div className="text-sm text-slate-500">
                  {result.upeEntity?.jurisdiction}
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="text-xs text-slate-500 uppercase font-bold mb-1">
                  Designated Filing Entity (Art. 8.1.3)
                </div>
                <div className="text-lg font-bold text-slate-800">
                  {result.dfeEntity?.entityName || 'Not identified'}
                </div>
                <div className="text-sm text-slate-500">
                  {result.dfeEntity?.jurisdiction}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Threshold Detail */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Revenue Threshold Detail (Article 1.1.1)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left">Fiscal Year</th>
                    <th className="px-4 py-3 text-right">
                      Revenue ({groupInfo.reportingCurrency})
                    </th>
                    {!isEUR && (
                      <th className="px-4 py-3 text-right">Rate</th>
                    )}
                    <th className="px-4 py-3 text-right">Revenue (EUR)</th>
                    <th className="px-4 py-3 text-center">≥ €750M</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.revenueYears.map((ry) => (
                    <tr key={ry.fiscalYear}>
                      <td className="px-4 py-3 font-medium">
                        FY {ry.fiscalYear}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatCurrency(
                          ry.revenueLocal,
                          groupInfo.reportingCurrency
                        )}
                      </td>
                      {!isEUR && (
                        <td className="px-4 py-3 text-right text-slate-500">
                          {ry.exchangeRate.toFixed(4)}
                        </td>
                      )}
                      <td className="px-4 py-3 text-right font-medium">
                        {formatCurrency(ry.revenueEUR, 'EUR')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {ry.meetsThreshold ? (
                          <CheckCircle className="w-4 h-4 text-green-600 mx-auto" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* CE List by Jurisdiction */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <Building className="w-4 h-4 mr-2" />
              Constituent Entities ({result.totalCEs})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left">Entity</th>
                    <th className="px-4 py-3 text-left">Jurisdiction</th>
                    <th className="px-4 py-3 text-center">Ownership</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Article</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.constituentEntities.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {e.entityName}
                        {e.isUPE && (
                          <span className="ml-2 text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full font-bold">
                            UPE
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {e.jurisdiction}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600">
                        {e.ownershipPercent}%
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          {e.classification.ceType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {e.classification.articleReference}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Excluded Entities */}
        {result.excludedEntities.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2 text-amber-500" />
                Excluded Entities ({result.excludedEntities.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {result.excludedEntities.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-start justify-between border rounded-lg p-4 bg-amber-50"
                  >
                    <div>
                      <div className="font-medium text-slate-800">
                        {e.entityName}
                      </div>
                      <div className="text-sm text-slate-600">
                        {e.jurisdiction} — {e.ownershipPercent}%
                      </div>
                      {e.notes && (
                        <div className="text-xs text-slate-500 mt-1">
                          {e.notes}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                        {getOptionLabel(
                          EXCLUDED_REASON_OPTIONS,
                          e.classification.excludedReason || ''
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Out of Scope */}
        {result.outOfScopeEntities.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <XCircle className="w-4 h-4 mr-2 text-slate-400" />
                Out of Scope ({result.outOfScopeEntities.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {result.outOfScopeEntities.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-start justify-between border rounded-lg p-4"
                  >
                    <div>
                      <div className="font-medium text-slate-800">
                        {e.entityName}
                      </div>
                      <div className="text-sm text-slate-600">
                        {e.jurisdiction} — {e.ownershipPercent}%
                      </div>
                      {e.classification.rationale && (
                        <div className="text-xs text-slate-500 mt-1">
                          {e.classification.rationale}
                        </div>
                      )}
                    </div>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                      {getOptionLabel(
                        OUT_OF_SCOPE_REASON_OPTIONS,
                        e.classification.outOfScopeReason || ''
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Jurisdictions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <Globe className="w-4 h-4 mr-2" />
              Jurisdictions ({result.jurisdictionCount})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {result.jurisdictions.map((j) => {
                const count = result.constituentEntities.filter(
                  (e) => e.jurisdiction === j
                ).length;
                return (
                  <span
                    key={j}
                    className="px-3 py-1.5 rounded-full text-sm bg-blue-50 text-blue-700 border border-blue-200"
                  >
                    {j}{' '}
                    <span className="font-bold text-blue-900">({count})</span>
                  </span>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-center pt-4 space-x-4">
          <Button
            variant="outline"
            onClick={() => goToStep('GROUP_INFO')}
          >
            <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
            Start Over
          </Button>
          <Button
            onClick={handleSave}
            className="bg-mojitax-green hover:bg-mojitax-green/90"
          >
            <Save className="w-4 h-4 mr-2" /> Save Assessment
          </Button>
        </div>
      </div>
    );
  };

  // ============================================================
  // RENDER — Step Content Dispatcher
  // ============================================================

  const renderStepContent = () => {
    switch (currentStep) {
      case 'GROUP_INFO':
        return renderGroupInfo();
      case 'REVENUE_TEST':
        return renderRevenueTest();
      case 'ENTITY_REGISTER':
        return renderEntityRegister();
      case 'ENTITY_CLASSIFICATION':
        return renderEntityClassification();
      case 'RESULTS':
        return renderResults();
    }
  };

  // ============================================================
  // RENDER — Main
  // ============================================================

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-wrap gap-3 justify-end">
        <Button variant="outline" size="sm" onClick={loadCaseStudy}>
          <Layout className="w-4 h-4 mr-2" />
          Load Stratos Group
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowLoadModal(true)}
        >
          <FolderOpen className="w-4 h-4 mr-2" />
          Open Saved
        </Button>
        <Button variant="outline" size="sm" onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>
      </div>

      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Step Title */}
      <div className="flex items-center space-x-3 mb-2">
        <GitBranch className="w-6 h-6 text-mojitax-green" />
        <div>
          <h1 className="text-xl font-bold text-slate-800">
            {STEP_CONFIGS[currentStepIndex].label}
          </h1>
          {STEP_CONFIGS[currentStepIndex].articleRef && (
            <p className="text-xs text-slate-400">
              {STEP_CONFIGS[currentStepIndex].articleRef}
            </p>
          )}
        </div>
      </div>

      {/* Educational Note */}
      {renderEducationalNote()}

      {/* Errors */}
      {renderErrors()}

      {/* Step Content */}
      {renderStepContent()}

      {/* Navigation */}
      {currentStep !== 'RESULTS' && (
        <div className="flex justify-between pt-6">
          <Button
            variant="outline"
            onClick={goPrevious}
            disabled={currentStepIndex === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          <Button
            onClick={goNext}
            className="bg-mojitax-green hover:bg-mojitax-green/90"
          >
            {currentStep === 'ENTITY_CLASSIFICATION' ? (
              <>
                View Results
                <CheckCircle className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      )}

      {/* Load Modal */}
      {showLoadModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md max-h-[80vh] flex flex-col">
            <CardHeader className="flex-row justify-between items-center">
              <CardTitle>Load Assessment</CardTitle>
              <button
                onClick={() => setShowLoadModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </CardHeader>
            <CardContent className="overflow-y-auto flex-1 space-y-2">
              {savedItems.length === 0 ? (
                <p className="text-center text-slate-500 py-8">
                  No saved assessments found.
                </p>
              ) : (
                savedItems.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => loadSession(s)}
                    className="w-full text-left p-3 border rounded hover:bg-mojitax-green/10 hover:border-mojitax-green/30 transition-colors"
                  >
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-800">
                        {s.name}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(s.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Entities: {s.entities?.length || 0}
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default ScopeDecisionTree;
