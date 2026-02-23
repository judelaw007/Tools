/**
 * BADR Eligibility Checker and Calculator — React Component
 *
 * Two-part tool: (1) eligibility assessment against BADR qualifying
 * conditions with traffic-light status, and (2) CGT computation at
 * the BADR rate with lifetime limit tracking and rate comparison.
 *
 * Features: disposal-type-driven condition panels, per-condition
 * educational notes, CGT computation table, lifetime allowance bar,
 * rate comparison, H&C scenario loader, and MojiTax platform
 * tracking callbacks.
 */

'use client';

import React, { useState, useCallback } from 'react';
import type {
  DisposalType,
  BadrCheckerProps,
  BADRInputs,
  BADROutput,
  ValidationResult,
  ConditionResult,
  HCScenario,
} from './types';
import {
  assessBADR,
  createEmptyInputs,
  scenarioToInputs,
  formatCurrency,
  formatPounds,
  formatPoundsPence,
  formatPercent,
  formatPercentDecimal,
  formatDate,
  formatHoldingPeriod,
  getDisposalTypeName,
  getTaxYearDisplayName,
  LIFETIME_LIMIT,
  ANNUAL_EXEMPT_AMOUNT,
  HC_SCENARIOS,
} from './utils';

// ─── Sub-Components ──────────────────────────────────────────────────────────

/** Tooltip shown beneath a field */
function Tooltip({ text, visible }: { text: string; visible: boolean }) {
  if (!visible) return null;
  return <p className="mt-1.5 text-xs text-gray-500 italic leading-relaxed">{text}</p>;
}

/** Validation alert */
function ValidationAlert({ result }: { result: ValidationResult }) {
  const styles = {
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  }[result.severity];

  const icon = { error: '\u2715', warning: '!', info: 'i' }[result.severity];

  return (
    <div className={`border rounded-md p-3 ${styles}`}>
      <div className="flex items-start gap-2">
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-current bg-opacity-20 text-xs font-bold flex-shrink-0 mt-0.5">
          {icon}
        </span>
        <div className="text-sm">
          <span className="font-medium">[{result.ruleId}]</span> {result.message}
        </div>
      </div>
    </div>
  );
}

/** Numeric input field with label */
function NumericField({
  label,
  value,
  onChange,
  tooltip,
  showTooltips,
  placeholder,
  min,
  max,
  prefix,
  suffix,
  step,
}: {
  label: string;
  value: number;
  onChange: (val: number) => void;
  tooltip?: string;
  showTooltips: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  prefix?: string;
  suffix?: string;
  step?: number;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{prefix}</span>
        )}
        <input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          placeholder={placeholder}
          min={min ?? 0}
          max={max}
          step={step}
          className={`w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 ${prefix ? 'pl-7' : ''} ${suffix ? 'pr-8' : ''}`}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{suffix}</span>
        )}
      </div>
      {tooltip && <Tooltip text={tooltip} visible={showTooltips} />}
    </div>
  );
}

/** Condition result card with traffic-light status */
function ConditionCard({
  condition,
  showTooltips,
  hints,
}: {
  condition: ConditionResult;
  showTooltips: boolean;
  hints?: string[];
}) {
  const [expanded, setExpanded] = useState(false);

  const statusStyles = {
    met: { bg: 'bg-green-50 border-green-200', icon: '\u2713', iconBg: 'bg-green-500 text-white', label: 'MET', labelBg: 'text-green-700' },
    'not-met': { bg: 'bg-red-50 border-red-200', icon: '\u2715', iconBg: 'bg-red-500 text-white', label: 'NOT MET', labelBg: 'text-red-700' },
    'not-applicable': { bg: 'bg-gray-50 border-gray-200', icon: '—', iconBg: 'bg-gray-400 text-white', label: 'N/A', labelBg: 'text-gray-500' },
  }[condition.status];

  return (
    <div className={`border rounded-lg p-3 ${statusStyles.bg}`}>
      <div className="flex items-start gap-3">
        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold flex-shrink-0 mt-0.5 ${statusStyles.iconBg}`}>
          {statusStyles.icon}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-900">{condition.conditionName}</span>
            <span className={`text-xs font-bold ${statusStyles.labelBg}`}>{statusStyles.label}</span>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">{condition.detail}</p>
          <p className="text-xs text-gray-400 mt-1 font-mono">{condition.legislativeRef}</p>

          {(showTooltips || hints) && (
            <button
              className="text-xs text-blue-500 hover:text-blue-700 mt-1.5"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Hide notes' : 'Show notes'}
            </button>
          )}

          {expanded && (
            <div className="mt-2 space-y-2">
              {showTooltips && condition.educationalNote && (
                <p className="text-xs text-gray-500 italic leading-relaxed">{condition.educationalNote}</p>
              )}
              {hints && hints.length > 0 && (
                <div className="bg-white bg-opacity-60 rounded p-2">
                  <p className="text-xs font-medium text-gray-600 mb-1">H&C Hints:</p>
                  <ul className="text-xs text-gray-500 space-y-0.5 list-disc list-inside">
                    {hints.map((hint, i) => (
                      <li key={i}>{hint}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Eligibility banner */
function EligibilityBanner({ output }: { output: BADROutput }) {
  const { eligibility } = output;

  const bannerStyles = {
    qualifying: 'bg-green-700',
    'not-qualifying': 'bg-red-700',
    'partially-qualifying': 'bg-amber-600',
  }[eligibility.overallEligibility];

  const statusLabel = {
    qualifying: 'QUALIFYING',
    'not-qualifying': 'NOT QUALIFYING',
    'partially-qualifying': 'PARTIALLY QUALIFYING',
  }[eligibility.overallEligibility];

  return (
    <div className={`${bannerStyles} text-white rounded-lg p-6`}>
      <div className="text-center">
        <div className="text-xs uppercase text-white text-opacity-70 mb-1">BADR Eligibility</div>
        <div className="text-2xl font-bold mb-2">{statusLabel}</div>
        <p className="text-sm text-white text-opacity-90 max-w-xl mx-auto">
          {eligibility.eligibilityReason}
        </p>
        <div className="mt-3 text-xs text-white text-opacity-60">
          Holding period: {formatHoldingPeriod(eligibility.holdingPeriod)}
        </div>
      </div>
    </div>
  );
}

/** CGT computation table */
function CGTComputationTable({ output }: { output: BADROutput }) {
  const { cgtComputation: cgt } = output;

  const row = (label: string, value: number | string, opts?: { bold?: boolean; indent?: boolean; deduction?: boolean; border?: boolean; mono?: boolean }) => (
    <div className={`flex justify-between py-0.5 ${opts?.border ? 'border-t border-gray-200 pt-1 mt-1' : ''}`}>
      <span className={`text-sm ${opts?.indent ? 'pl-4' : ''} ${opts?.bold ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
        {label}
      </span>
      <span className={`text-sm font-mono ${opts?.bold ? 'font-medium text-gray-900' : ''} ${opts?.deduction ? 'text-red-600' : 'text-gray-900'}`}>
        {typeof value === 'string' ? value : opts?.deduction ? `(${formatCurrency(Math.abs(value))})` : formatPounds(value)}
      </span>
    </div>
  );

  return (
    <div className="space-y-1">
      {row('Disposal proceeds', cgt.proceeds)}
      {row('Less: Base cost', cgt.baseCost, { deduction: true })}
      {cgt.allowableCosts > 0 && row('Less: Allowable costs', cgt.allowableCosts, { deduction: true })}
      {row('Chargeable gain', cgt.gain, { bold: true, border: true })}
      {row(`Less: Annual exempt amount (£${formatCurrency(ANNUAL_EXEMPT_AMOUNT)} available, £${formatCurrency(ANNUAL_EXEMPT_AMOUNT - cgt.aeaAvailable)} used elsewhere)`, cgt.annualExemptAmount, { deduction: true })}
      {row('Taxable gain', cgt.taxableGain, { bold: true, border: true })}

      <div className="border-t border-gray-300 pt-2 mt-2" />

      {cgt.badrQualifyingGain > 0 && (
        <>
          {row(`BADR qualifying gain @ ${formatPercent(cgt.badrRate)} (${getTaxYearDisplayName(cgt.taxYear)})`, cgt.badrQualifyingGain)}
          {row('CGT at BADR rate', cgt.cgtAtBadrRate, { indent: true })}
        </>
      )}
      {cgt.nonBadrGain > 0 && (
        <>
          {row('Non-BADR gain at standard rates', cgt.nonBadrGain)}
          {cgt.standardBasicRateCGT > 0 && row('CGT at 18% (basic rate)', cgt.standardBasicRateCGT, { indent: true })}
          {cgt.standardHigherRateCGT > 0 && row('CGT at 24% (higher rate)', cgt.standardHigherRateCGT, { indent: true })}
        </>
      )}

      <div className="border-t-2 border-gray-900 pt-2 mt-2">
        <div className="flex justify-between">
          <span className="text-sm font-bold text-gray-900">Total CGT Liability</span>
          <span className="text-sm font-bold font-mono text-gray-900">{formatPoundsPence(cgt.totalCGT)}</span>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-500">Effective rate</span>
          <span className="text-xs font-mono text-gray-500">{formatPercentDecimal(cgt.effectiveRate)}</span>
        </div>
      </div>
    </div>
  );
}

/** Lifetime allowance progress bar */
function LifetimeBar({ output }: { output: BADROutput }) {
  const { lifetimeAllowance: la } = output;
  const totalUsed = la.previouslyUsed + la.usedOnThisDisposal;
  const usedPercent = Math.min(100, (totalUsed / la.lifetimeLimit) * 100);
  const previousPercent = (la.previouslyUsed / la.lifetimeLimit) * 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">Lifetime BADR Limit</span>
        <span className="text-sm font-mono text-gray-600">
          {formatPounds(totalUsed)} / {formatPounds(la.lifetimeLimit)}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
        {la.previouslyUsed > 0 && (
          <div
            className="h-full bg-gray-400 float-left"
            style={{ width: `${previousPercent}%` }}
          />
        )}
        <div
          className={`h-full float-left ${la.limitExceeded ? 'bg-red-500' : 'bg-blue-500'}`}
          style={{ width: `${Math.min(usedPercent - previousPercent, 100 - previousPercent)}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <div className="text-xs text-gray-500">
          {la.previouslyUsed > 0 && (
            <span>Previously used: {formatPounds(la.previouslyUsed)} | </span>
          )}
          This disposal: {formatPounds(la.usedOnThisDisposal)}
        </div>
        <span className={`text-xs font-medium ${la.limitExceeded ? 'text-red-600' : 'text-green-600'}`}>
          {la.limitExceeded ? 'LIMIT EXCEEDED' : `${formatPounds(la.remainingAfterDisposal)} remaining`}
        </span>
      </div>
    </div>
  );
}

/** Rate comparison table */
function RateComparisonTable({ output }: { output: BADROutput }) {
  const { rateComparison: rc } = output;

  if (rc.taxSaving <= 0) return null;

  return (
    <div>
      <div className="grid grid-cols-3 gap-4 text-center mb-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="text-xs text-green-600 mb-1">With BADR</div>
          <div className="text-lg font-bold text-green-700">{formatPoundsPence(rc.cgtWithBadr)}</div>
          <div className="text-xs text-green-500">{formatPercentDecimal(rc.effectiveRateWithBadr)} effective</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="text-xs text-red-600 mb-1">Without BADR</div>
          <div className="text-lg font-bold text-red-700">{formatPoundsPence(rc.cgtWithoutBadr)}</div>
          <div className="text-xs text-red-500">{formatPercentDecimal(rc.effectiveRateWithoutBadr)} effective</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-xs text-blue-600 mb-1">Tax Saving</div>
          <div className="text-lg font-bold text-blue-700">{formatPoundsPence(rc.taxSaving)}</div>
        </div>
      </div>

      {(rc.standardBasicRateAmount > 0 || rc.standardHigherRateAmount > 0) && (
        <div className="text-xs text-gray-500 space-y-0.5">
          <p className="font-medium text-gray-600">Without BADR breakdown:</p>
          {rc.standardBasicRateAmount > 0 && (
            <p>{formatPounds(rc.standardBasicRateAmount)} @ 18% (basic rate) = {formatPoundsPence(rc.standardBasicRateAmount * 0.18)}</p>
          )}
          {rc.standardHigherRateAmount > 0 && (
            <p>{formatPounds(rc.standardHigherRateAmount)} @ 24% (higher rate) = {formatPoundsPence(rc.standardHigherRateAmount * 0.24)}</p>
          )}
        </div>
      )}
    </div>
  );
}

/** Associated disposal detail panel */
function AssociatedDisposalPanel({ output }: { output: BADROutput }) {
  const calc = output.associatedDisposalCalc;
  if (!calc) return null;

  return (
    <div className="space-y-1">
      <div className="flex justify-between py-0.5">
        <span className="text-sm text-gray-600">Total gain on associated asset</span>
        <span className="text-sm font-mono text-gray-900">{formatPounds(calc.totalGain)}</span>
      </div>
      <div className="flex justify-between py-0.5">
        <span className="text-sm text-gray-600">Time apportionment fraction</span>
        <span className="text-sm font-mono text-gray-900">{(calc.timeApportionmentFraction * 100).toFixed(1)}%</span>
      </div>
      <div className="flex justify-between py-0.5">
        <span className="text-sm text-gray-600">Gain after time apportionment</span>
        <span className="text-sm font-mono text-gray-900">{formatPounds(calc.timeApportionedGain)}</span>
      </div>
      {calc.rentRestrictionFraction < 1 && (
        <div className="flex justify-between py-0.5">
          <span className="text-sm text-gray-600">Rent restriction</span>
          <span className="text-sm font-mono text-red-600">{formatPercentDecimal(1 - calc.rentRestrictionFraction)} restricted</span>
        </div>
      )}
      <div className="flex justify-between py-0.5 border-t border-gray-200 pt-1">
        <span className="text-sm font-medium text-gray-900">BADR qualifying gain</span>
        <span className="text-sm font-mono font-medium text-gray-900">{formatPounds(calc.badrQualifyingGain)}</span>
      </div>
      <div className="flex justify-between py-0.5">
        <span className="text-sm text-gray-600">Non-qualifying gain</span>
        <span className="text-sm font-mono text-gray-600">{formatPounds(calc.nonQualifyingGain)}</span>
      </div>
    </div>
  );
}

/** Scenario selector panel */
function ScenarioSelector({
  onLoad,
  onClose,
}: {
  onLoad: (scenario: HCScenario) => void;
  onClose: () => void;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-700">H&C Case Study Scenarios</h3>
        <button className="text-xs text-gray-400 hover:text-gray-600" onClick={onClose}>
          Close
        </button>
      </div>
      <div className="space-y-2">
        {HC_SCENARIOS.map((scenario) => (
          <button
            key={scenario.id}
            className="w-full text-left p-3 border border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-200 transition-colors"
            onClick={() => onLoad(scenario)}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                S{scenario.section}
              </span>
              <span className="text-sm font-medium text-gray-900">{scenario.name}</span>
            </div>
            <div className="text-xs text-gray-500 mt-1 line-clamp-2">{scenario.description}</div>
            <div className="flex gap-3 mt-1.5 text-xs text-gray-400">
              <span>Expected CGT: {formatPounds(scenario.expectedCGT)}</span>
              <span>Expected: {scenario.expectedEligibility}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function BadrChecker({
  config,
  callbacks,
  showTooltips: showTooltipsProp,
  className,
}: BadrCheckerProps) {
  const showTooltips = showTooltipsProp ?? config.showTooltips;

  // ─── State ─────────────────────────────────────────────────────────────────
  const [inputs, setInputs] = useState<BADRInputs>(createEmptyInputs());
  const [output, setOutput] = useState<BADROutput | null>(null);
  const [attemptNumber, setAttemptNumber] = useState(0);
  const [showScenarios, setShowScenarios] = useState(false);
  const [showComparison, setShowComparison] = useState(config.showComparison);
  const [activeScenario, setActiveScenario] = useState<HCScenario | null>(null);

  // ─── Disposal type handler ─────────────────────────────────────────────────
  const updateDisposalType = useCallback((value: DisposalType) => {
    setInputs((prev) => ({
      ...prev,
      disposal: { ...prev.disposal, disposalType: value },
    }));
    setOutput(null);
    callbacks?.onDisposalTypeChange?.({ disposalType: value, timestamp: Date.now() });
  }, [callbacks]);

  // ─── Disposal details handlers ─────────────────────────────────────────────
  const updateDisposalDate = useCallback((field: 'disposalDate' | 'acquisitionDate', value: string) => {
    setInputs((prev) => ({
      ...prev,
      disposal: { ...prev.disposal, [field]: value },
    }));
    setOutput(null);
  }, []);

  // ─── Gain inputs handlers ─────────────────────────────────────────────────
  const updateGain = useCallback((field: keyof BADRInputs['gain'], value: number) => {
    setInputs((prev) => ({
      ...prev,
      gain: { ...prev.gain, [field]: value },
    }));
    setOutput(null);
  }, []);

  // ─── Shareholding handlers ────────────────────────────────────────────────
  const updateShareholding = useCallback((field: keyof BADRInputs['shareholding'], value: number | boolean) => {
    setInputs((prev) => ({
      ...prev,
      shareholding: { ...prev.shareholding, [field]: value },
    }));
    setOutput(null);
  }, []);

  // ─── Company status handlers ──────────────────────────────────────────────
  const updateCompanyStatus = useCallback((field: keyof BADRInputs['companyStatus'], value: number) => {
    setInputs((prev) => ({
      ...prev,
      companyStatus: { ...prev.companyStatus, [field]: value },
    }));
    setOutput(null);
  }, []);

  // ─── Associated disposal handlers ─────────────────────────────────────────
  const updateAssociatedDisposal = useCallback((field: keyof BADRInputs['associatedDisposal'], value: number | boolean) => {
    setInputs((prev) => ({
      ...prev,
      associatedDisposal: { ...prev.associatedDisposal, [field]: value },
    }));
    setOutput(null);
  }, []);

  // ─── Other input handlers ─────────────────────────────────────────────────
  const updateLifetimePrevious = useCallback((value: number) => {
    setInputs((prev) => ({ ...prev, lifetimePreviouslyUsed: value }));
    setOutput(null);
  }, []);

  const updateTaxpayer = useCallback((value: number) => {
    setInputs((prev) => ({
      ...prev,
      taxpayer: { ...prev.taxpayer, taxableIncomeAbovePA: value },
    }));
    setOutput(null);
  }, []);

  // ─── Compute handler ──────────────────────────────────────────────────────
  const handleCompute = useCallback(() => {
    const result = assessBADR(inputs);
    const attempt = attemptNumber + 1;
    setOutput(result);
    setAttemptNumber(attempt);

    callbacks?.onEligibilityCheck?.({
      conditions: result.eligibility.conditions.map((c) => ({
        conditionId: c.conditionId,
        status: c.status,
      })),
      overallResult: result.eligibility.overallEligibility,
      timestamp: Date.now(),
    });

    callbacks?.onCompute?.({
      totalCGT: result.cgtComputation.totalCGT,
      badrGain: result.cgtComputation.badrQualifyingGain,
      taxSaving: result.rateComparison.taxSaving,
      attemptNumber: attempt,
      timestamp: Date.now(),
    });

    callbacks?.onValidation?.({
      errors: result.validationResults.filter((r) => r.severity === 'error' && !r.passed).map((r) => r.message),
      warnings: result.validationResults.filter((r) => r.severity === 'warning' && !r.passed).map((r) => r.message),
      timestamp: Date.now(),
    });
  }, [inputs, attemptNumber, callbacks]);

  // ─── Reset handler ────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    const previousResult = output;
    setInputs(createEmptyInputs());
    setOutput(null);
    setAttemptNumber(0);
    setActiveScenario(null);
    callbacks?.onReset?.({ previousResult, timestamp: Date.now() });
  }, [output, callbacks]);

  // ─── Scenario loader ──────────────────────────────────────────────────────
  const handleLoadScenario = useCallback(
    (scenario: HCScenario) => {
      setInputs(scenarioToInputs(scenario));
      setOutput(null);
      setAttemptNumber(0);
      setActiveScenario(scenario);
      setShowScenarios(false);
      callbacks?.onScenarioLoad?.({
        scenarioId: scenario.id,
        section: scenario.section,
        timestamp: Date.now(),
      });
    },
    [callbacks]
  );

  // ─── Comparison view handler ──────────────────────────────────────────────
  const handleToggleComparison = useCallback(() => {
    const next = !showComparison;
    setShowComparison(next);
    if (next && output) {
      callbacks?.onComparisonView?.({
        withBadr: output.rateComparison.cgtWithBadr,
        withoutBadr: output.rateComparison.cgtWithoutBadr,
        saving: output.rateComparison.taxSaving,
        timestamp: Date.now(),
      });
    }
  }, [showComparison, output, callbacks]);

  // ─── Derived ──────────────────────────────────────────────────────────────
  const canCompute =
    inputs.disposal.disposalDate !== '' &&
    inputs.disposal.acquisitionDate !== '' &&
    inputs.gain.disposalProceeds > 0;

  const isSharesOrAssociated =
    inputs.disposal.disposalType === 'shares' ||
    inputs.disposal.disposalType === 'associated-disposal';

  const isAssociated = inputs.disposal.disposalType === 'associated-disposal';
  const hasErrors = (output?.validationSummary.errors ?? 0) > 0;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={`max-w-5xl mx-auto ${className ?? ''}`}>
      {/* Tool header */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">BADR Eligibility Checker & CGT Calculator</h2>
            <p className="text-sm text-gray-500">Business Asset Disposal Relief — qualifying conditions and CGT computation</p>
          </div>
          <div className="flex gap-2">
            <button
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              onClick={() => setShowScenarios(!showScenarios)}
            >
              H&C Scenarios
            </button>
            {(output || attemptNumber > 0) && (
              <button
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                onClick={handleReset}
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Scenario selector */}
      {showScenarios && (
        <ScenarioSelector onLoad={handleLoadScenario} onClose={() => setShowScenarios(false)} />
      )}

      {/* Active scenario indicator */}
      {activeScenario && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-blue-400 bg-blue-100 px-1.5 py-0.5 rounded">
              S{activeScenario.section}
            </span>
            <span className="text-sm font-medium text-blue-800">{activeScenario.name}</span>
          </div>
          <p className="text-xs text-blue-600 mt-1">{activeScenario.description}</p>
        </div>
      )}

      {/* Section 1: Disposal Type & Dates */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-1">
          Disposal Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Disposal Type</label>
            <select
              value={inputs.disposal.disposalType}
              onChange={(e) => updateDisposalType(e.target.value as DisposalType)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="shares">Shares in Personal Company</option>
              <option value="business-assets">Business Assets</option>
              <option value="associated-disposal">Associated Disposal</option>
            </select>
            <Tooltip
              text="Different qualifying conditions apply depending on the type of disposal. Shares require personal company and trading company tests. Business asset disposals require a 2-year trading history. Associated disposals are personally-owned assets used in the company's trade."
              visible={showTooltips}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Acquisition Date</label>
            <input
              type="date"
              value={inputs.disposal.acquisitionDate}
              onChange={(e) => updateDisposalDate('acquisitionDate', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
            />
            <Tooltip
              text="For shares acquired on s.162 TCGA 1992 incorporation, use the date of incorporation. The holding period starts from that date, not when the sole trade began."
              visible={showTooltips}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Disposal Date</label>
            <input
              type="date"
              value={inputs.disposal.disposalDate}
              onChange={(e) => updateDisposalDate('disposalDate', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
            />
            <Tooltip
              text="Date of the disposal. The BADR rate depends on the tax year of disposal: 10% (2024/25), 14% (2025/26), 18% (2026/27 onwards). The disposal date also determines the end of the 2-year qualifying period."
              visible={showTooltips}
            />
          </div>
        </div>
      </div>

      {/* Section 2: Gain Computation Inputs */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-1">
          Gain Computation
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NumericField
            label="Disposal Proceeds (£)"
            value={inputs.gain.disposalProceeds}
            onChange={(val) => updateGain('disposalProceeds', val)}
            prefix="£"
            showTooltips={showTooltips}
            tooltip="The amount received on disposal. For connected party transactions, use market value instead (s.17 TCGA 1992)."
          />
          <NumericField
            label="Base Cost (£)"
            value={inputs.gain.baseCost}
            onChange={(val) => updateGain('baseCost', val)}
            prefix="£"
            showTooltips={showTooltips}
            tooltip="The original cost of the asset. For shares acquired on s.162 incorporation, this is the deferred gain embedded in the shares (market value of assets transferred minus gain deferred)."
          />
          <NumericField
            label="Allowable Costs (£)"
            value={inputs.gain.allowableCosts}
            onChange={(val) => updateGain('allowableCosts', val)}
            prefix="£"
            showTooltips={showTooltips}
            tooltip="Incidental costs of acquisition and disposal: legal fees, valuation fees, stamp duty, professional advice."
          />
          <NumericField
            label="AEA Already Used (£)"
            value={inputs.gain.annualExemptAmountUsed}
            onChange={(val) => updateGain('annualExemptAmountUsed', val)}
            prefix="£"
            showTooltips={showTooltips}
            tooltip="Annual exempt amount (£3,000 for 2024/25 onwards) already set against other gains this year. AEA should be set against non-BADR gains first as they are taxed at higher rates."
            max={ANNUAL_EXEMPT_AMOUNT}
          />
        </div>
      </div>

      {/* Section 3: Shareholding Details (shares and associated only) */}
      {isSharesOrAssociated && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-1">
            Shareholding Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <NumericField
              label="Share Capital (%)"
              value={inputs.shareholding.percentShareCapital}
              onChange={(val) => updateShareholding('percentShareCapital', val)}
              suffix="%"
              showTooltips={showTooltips}
              tooltip="Percentage of the company's ordinary share capital held. Only ordinary shares count — preference shares and deferred shares are excluded. Minimum 5% required."
              max={100}
              step={0.1}
            />
            <NumericField
              label="Voting Rights (%)"
              value={inputs.shareholding.percentVotingRights}
              onChange={(val) => updateShareholding('percentVotingRights', val)}
              suffix="%"
              showTooltips={showTooltips}
              tooltip="Percentage of total voting rights. Usually equal to share capital percentage unless shares carry different voting rights. Minimum 5% required."
              max={100}
              step={0.1}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee or Officer?</label>
              <select
                value={inputs.shareholding.isEmployeeOrOfficer ? 'true' : 'false'}
                onChange={(e) => updateShareholding('isEmployeeOrOfficer', e.target.value === 'true')}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="true">Yes — employee or officer (director)</option>
                <option value="false">No — passive shareholder</option>
              </select>
              <Tooltip
                text="The individual must be an employee or officer (including non-executive directors) throughout the 2-year qualifying period. A passive investor who is neither employed nor a director does not qualify."
                visible={showTooltips}
              />
            </div>
          </div>
        </div>
      )}

      {/* Section 4: Company Trading Status (shares and associated only) */}
      {isSharesOrAssociated && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-1">
            Company Trading Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <NumericField
              label="Trading Activity (%)"
              value={inputs.companyStatus.tradingIncomePercent}
              onChange={(val) => updateCompanyStatus('tradingIncomePercent', val)}
              suffix="%"
              showTooltips={showTooltips}
              tooltip="Percentage of the company's activities that are trading. HMRC interprets 'substantial' as 20% or more non-trading, so at least 80% must be trading. The test is multi-factor: income, assets, expenses, management time."
              max={100}
              step={0.1}
            />
            <NumericField
              label="Trading Income (£)"
              value={inputs.companyStatus.tradingIncomeAmount}
              onChange={(val) => updateCompanyStatus('tradingIncomeAmount', val)}
              prefix="£"
              showTooltips={showTooltips}
              tooltip="Absolute amount of trading income. Used for display purposes to show the income breakdown."
            />
            <NumericField
              label="Non-Trading Income (£)"
              value={inputs.companyStatus.nonTradingIncomeAmount}
              onChange={(val) => updateCompanyStatus('nonTradingIncomeAmount', val)}
              prefix="£"
              showTooltips={showTooltips}
              tooltip="Non-trading income includes rental income, investment income, bank interest, and dividends from non-group companies."
            />
          </div>
        </div>
      )}

      {/* Section 5: Associated Disposal Details */}
      {isAssociated && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-1">
            Associated Disposal Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <NumericField
              label="Total Ownership Days"
              value={inputs.associatedDisposal.totalOwnershipDays}
              onChange={(val) => updateAssociatedDisposal('totalOwnershipDays', val)}
              showTooltips={showTooltips}
              tooltip="Total number of days the individual has owned the asset being disposed of."
            />
            <NumericField
              label="Trade Use Days"
              value={inputs.associatedDisposal.tradeUseDays}
              onChange={(val) => updateAssociatedDisposal('tradeUseDays', val)}
              showTooltips={showTooltips}
              tooltip="Number of days the asset was used for the purposes of the company's trade. The BADR qualifying gain is time-apportioned by trade use days / total ownership days."
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rent Charged?</label>
              <select
                value={inputs.associatedDisposal.rentCharged ? 'true' : 'false'}
                onChange={(e) => updateAssociatedDisposal('rentCharged', e.target.value === 'true')}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="false">No rent charged</option>
                <option value="true">Yes — rent was charged to the company</option>
              </select>
              <Tooltip
                text="If rent was charged for the use of the asset, the BADR qualifying portion is further restricted. If rent equals full market rent, the entire gain is excluded from BADR."
                visible={showTooltips}
              />
            </div>
            {inputs.associatedDisposal.rentCharged && (
              <NumericField
                label="Rent as % of Market Rent"
                value={inputs.associatedDisposal.rentAsPercentOfMarket}
                onChange={(val) => updateAssociatedDisposal('rentAsPercentOfMarket', val)}
                suffix="%"
                showTooltips={showTooltips}
                tooltip="The rent charged expressed as a percentage of full market rent. 100% = full market rent (no BADR). 0% = no rent (full BADR on time-apportioned gain). 50% = half market rent (BADR on 50% of time-apportioned gain)."
                max={100}
              />
            )}
          </div>
        </div>
      )}

      {/* Section 6: Lifetime Allowance & Taxpayer */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-1">
          Lifetime Allowance & Taxpayer Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NumericField
            label="Lifetime BADR Previously Used (£)"
            value={inputs.lifetimePreviouslyUsed}
            onChange={updateLifetimePrevious}
            prefix="£"
            showTooltips={showTooltips}
            tooltip="Total gains on which BADR has been claimed in prior disposals. The lifetime limit is £1,000,000 (reduced from £10m on 11 March 2020). Any gain exceeding the remaining lifetime limit is taxed at standard rates."
            max={LIFETIME_LIMIT}
          />
          <NumericField
            label="Taxable Income Above PA (£)"
            value={inputs.taxpayer.taxableIncomeAbovePA}
            onChange={updateTaxpayer}
            prefix="£"
            showTooltips={showTooltips}
            tooltip="Total taxable income above the personal allowance. This determines how much of the basic rate band (£37,700) remains for CGT purposes. If income exceeds the basic rate band, all gains are taxed at the higher CGT rate (24%)."
          />
        </div>
      </div>

      {/* Compute button */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex justify-center gap-3">
          <button
            className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            onClick={handleCompute}
            disabled={!canCompute}
          >
            Check Eligibility & Compute CGT
          </button>
        </div>
      </div>

      {/* Results */}
      {output && (
        <div className="space-y-4">
          {/* Validation alerts */}
          {output.validationResults.some((r) => !r.passed || r.severity === 'info') && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3">Validation Notes</h3>
              <div className="space-y-2">
                {output.validationResults
                  .filter((r) => !r.passed || r.severity === 'info')
                  .map((result, i) => (
                    <ValidationAlert key={i} result={result} />
                  ))}
              </div>
            </div>
          )}

          {/* Eligibility banner */}
          <EligibilityBanner output={output} />

          {/* Condition cards */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-1">
              Qualifying Conditions — {getDisposalTypeName(inputs.disposal.disposalType)}
            </h3>
            <div className="space-y-2">
              {output.eligibility.conditions.map((condition) => (
                <ConditionCard
                  key={condition.conditionId}
                  condition={condition}
                  showTooltips={showTooltips}
                  hints={activeScenario?.hints[condition.conditionId]}
                />
              ))}
            </div>
          </div>

          {/* Associated disposal calculation */}
          {output.associatedDisposalCalc && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-1">
                Associated Disposal Calculation
              </h3>
              <AssociatedDisposalPanel output={output} />
            </div>
          )}

          {/* CGT computation */}
          {!hasErrors && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-1">
                CGT Computation — Tax Year {getTaxYearDisplayName(output.cgtComputation.taxYear)}
              </h3>
              <CGTComputationTable output={output} />
            </div>
          )}

          {/* Lifetime allowance bar */}
          {!hasErrors && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <LifetimeBar output={output} />
            </div>
          )}

          {/* Rate comparison */}
          {!hasErrors && output.rateComparison.taxSaving > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3 border-b border-gray-200 pb-1">
                <h3 className="text-sm font-bold text-gray-700">Rate Comparison — BADR vs Standard CGT</h3>
                <button
                  className="text-xs text-blue-600 hover:text-blue-800"
                  onClick={handleToggleComparison}
                >
                  {showComparison ? 'Hide' : 'Show'}
                </button>
              </div>
              {showComparison && <RateComparisonTable output={output} />}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default BadrChecker;
