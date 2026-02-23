/**
 * Corporation Tax Computation with Marginal Relief — React Component
 *
 * Complete CT computation from taxable total profits through to CT
 * liability. Handles income categorisation, augmented profits,
 * associated company threshold division, marginal relief formula,
 * short-period apportionment, and CT600-format output.
 *
 * Features: step-by-step TTP computation, rate band determination
 * with threshold detail, marginal relief formula display, CT600-format
 * layout, key dates, H&C scenario loader, and MojiTax platform
 * tracking callbacks.
 */

'use client';

import React, { useState, useCallback } from 'react';
import type {
  RateBand,
  CtComputationProps,
  CTInputs,
  CTOutput,
  ValidationResult,
  CT600Row,
  HCScenario,
} from './types';
import {
  computeCT,
  createEmptyInputs,
  scenarioToInputs,
  formatCurrency,
  formatPounds,
  formatPoundsPence,
  formatPercent,
  formatPercentDecimal,
  formatDate,
  getRateBandDisplayName,
  CT_MAIN_RATE,
  CT_SMALL_PROFITS_RATE,
  STANDARD_FRACTION,
  UPPER_LIMIT,
  LOWER_LIMIT,
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
  allowNegative,
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
  allowNegative?: boolean;
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
          min={allowNegative ? undefined : (min ?? 0)}
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

/** Rate band banner */
function RateBandBanner({ output }: { output: CTOutput }) {
  const { rateBandResult, ctLiabilityCalc, ttpComputation } = output;

  const bannerStyles = {
    'small-profits': 'bg-green-700',
    marginal: 'bg-blue-700',
    'main-rate': 'bg-amber-700',
  }[rateBandResult.rateBand];

  return (
    <div className={`${bannerStyles} text-white rounded-lg p-6`}>
      <div className="text-center">
        <div className="text-xs uppercase text-white text-opacity-70 mb-1">Rate Band</div>
        <div className="text-2xl font-bold mb-2">
          {getRateBandDisplayName(rateBandResult.rateBand)}
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4 max-w-md mx-auto">
          <div>
            <div className="text-xs text-white text-opacity-60">TTP</div>
            <div className="text-lg font-bold">{formatPounds(ttpComputation.taxableTotalProfits)}</div>
          </div>
          <div>
            <div className="text-xs text-white text-opacity-60">CT Liability</div>
            <div className="text-lg font-bold">{formatPoundsPence(ctLiabilityCalc.ctLiability)}</div>
          </div>
          <div>
            <div className="text-xs text-white text-opacity-60">Effective Rate</div>
            <div className="text-lg font-bold">{formatPercentDecimal(ctLiabilityCalc.effectiveRate)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** TTP computation table */
function TTPComputationTable({ output, showTooltips }: { output: CTOutput; showTooltips: boolean }) {
  const { ttpComputation: ttp } = output;

  const row = (
    label: string,
    value: number | string,
    opts?: { bold?: boolean; indent?: boolean; deduction?: boolean; border?: boolean }
  ) => (
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
      {row('Trading profits (after capital allowances)', ttp.tradingProfits)}
      {ttp.loanRelationshipIncome !== 0 &&
        row(
          ttp.loanRelationshipIncome >= 0 ? 'Loan relationship income' : 'Loan relationship deficit',
          Math.abs(ttp.loanRelationshipIncome),
          { deduction: ttp.loanRelationshipIncome < 0 }
        )}
      {ttp.propertyIncome > 0 && row('Property income', ttp.propertyIncome)}
      {ttp.chargeableGains > 0 && row('Chargeable gains', ttp.chargeableGains)}
      {row('Total profits', ttp.totalProfits, { bold: true, border: true })}
      {ttp.qcdDeducted > 0 && row('Less: Qualifying charitable donations', ttp.qcdDeducted, { deduction: true })}
      <div className="border-t-2 border-gray-900 pt-2 mt-2">
        <div className="flex justify-between">
          <span className="text-sm font-bold text-gray-900">Taxable Total Profits (TTP)</span>
          <span className="text-sm font-bold font-mono text-gray-900">{formatPounds(ttp.taxableTotalProfits)}</span>
        </div>
      </div>
      {ttp.qcdWasCapped && showTooltips && (
        <p className="text-xs text-amber-600 italic mt-1">
          QCD capped at total profits. Excess charitable donations cannot create or augment a loss.
        </p>
      )}
    </div>
  );
}

/** Threshold and augmented profits detail */
function ThresholdDetail({ output, showTooltips }: { output: CTOutput; showTooltips: boolean }) {
  const { thresholdCalc: t, augmentedProfitsCalc: ap } = output;

  return (
    <div className="space-y-3">
      {/* Associated companies */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Associated companies (incl. this company):</span>
        <span className="text-sm font-mono font-medium text-gray-900">{t.associatedCompanyCount}</span>
      </div>

      {/* Threshold table */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
          <div className="text-xs text-gray-500 mb-1">Upper Limit</div>
          <div className="text-sm font-mono text-gray-900">
            £250,000 &divide; {t.associatedCompanyCount} = {formatPounds(t.upperLimitDivided)}
          </div>
          {t.apportioned && (
            <div className="text-xs text-gray-400 mt-0.5">
              &times; {t.apportionmentFraction.toFixed(4)} = {formatPounds(t.upperLimit)}
            </div>
          )}
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
          <div className="text-xs text-gray-500 mb-1">Lower Limit</div>
          <div className="text-sm font-mono text-gray-900">
            £50,000 &divide; {t.associatedCompanyCount} = {formatPounds(t.lowerLimitDivided)}
          </div>
          {t.apportioned && (
            <div className="text-xs text-gray-400 mt-0.5">
              &times; {t.apportionmentFraction.toFixed(4)} = {formatPounds(t.lowerLimit)}
            </div>
          )}
        </div>
      </div>

      {/* Augmented profits */}
      <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
        <div className="text-xs text-gray-500 mb-1">Augmented Profits</div>
        {ap.hasFrankedIncome ? (
          <div className="text-sm font-mono text-gray-900">
            {formatPounds(ap.taxableTotalProfits)} (TTP) + {formatPounds(ap.exemptDistributions)} (exempt distributions) = {formatPounds(ap.augmentedProfits)}
          </div>
        ) : (
          <div className="text-sm font-mono text-gray-900">
            {formatPounds(ap.augmentedProfits)} (= TTP, no exempt distributions received)
          </div>
        )}
      </div>

      {showTooltips && (
        <p className="text-xs text-gray-500 italic">
          The upper and lower limits are divided by the number of associated companies.
          Augmented profits (TTP + exempt distributions) determine which rate band applies.
        </p>
      )}
    </div>
  );
}

/** Marginal relief detail panel */
function MarginalReliefPanel({ output, showTooltips }: { output: CTOutput; showTooltips: boolean }) {
  const { marginalReliefCalc: mr, ctLiabilityCalc: ct } = output;

  if (!mr.applies) return null;

  return (
    <div className="space-y-3">
      {/* Formula display */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="text-xs text-blue-600 mb-2 font-medium">Marginal Relief Formula</div>
        <div className="text-sm font-mono text-blue-900 text-center">
          MR = F &times; (U &minus; A) &times; N/A
        </div>
        <div className="text-sm font-mono text-blue-800 text-center mt-2">
          = 3/200 &times; ({formatPounds(mr.upperLimit)} &minus; {formatPounds(mr.augmentedProfits)}) &times; {formatPounds(mr.taxableTotalProfits)}/{formatPounds(mr.augmentedProfits)}
        </div>
        <div className="text-sm font-mono text-blue-800 text-center mt-1">
          = 0.015 &times; {formatPounds(mr.upperMinusAugmented)} &times; {mr.naFraction === 1 ? '1' : mr.naFraction.toFixed(6)}
        </div>
        <div className="text-sm font-mono font-bold text-blue-900 text-center mt-1">
          = {formatPoundsPence(mr.marginalRelief)}
        </div>
      </div>

      {/* CT computation */}
      <div className="space-y-1">
        <div className="flex justify-between py-0.5">
          <span className="text-sm text-gray-600">CT at main rate (25%)</span>
          <span className="text-sm font-mono text-gray-900">{formatPoundsPence(ct.ctAtMainRate)}</span>
        </div>
        <div className="flex justify-between py-0.5">
          <span className="text-sm text-gray-600">Less: Marginal relief</span>
          <span className="text-sm font-mono text-red-600">({formatCurrency(mr.marginalRelief)})</span>
        </div>
        <div className="border-t-2 border-gray-900 pt-2 mt-2">
          <div className="flex justify-between">
            <span className="text-sm font-bold text-gray-900">Corporation Tax Liability</span>
            <span className="text-sm font-bold font-mono text-gray-900">{formatPoundsPence(ct.ctLiability)}</span>
          </div>
        </div>
      </div>

      {showTooltips && (
        <div className="text-xs text-gray-500 italic space-y-1">
          <p>F = 3/200 (0.015) — the standard fraction from SI 2023/199.</p>
          <p>U = upper limit after division by associated companies{mr.naFraction < 1 ? ' and short-period apportionment' : ''}.</p>
          <p>A = augmented profits (TTP + exempt distributions).</p>
          <p>N = TTP. The N/A fraction adjusts for exempt distributions — when A = N, the fraction is 1.</p>
        </div>
      )}
    </div>
  );
}

/** CT600-format layout table */
function CT600LayoutTable({ output }: { output: CTOutput }) {
  const { ct600Layout } = output;

  return (
    <div className="font-mono text-sm space-y-0">
      {ct600Layout.map((row, i) => {
        if (row.type === 'spacer') {
          return <div key={i} className="h-3" />;
        }
        if (row.type === 'header') {
          return (
            <div key={i} className="font-bold text-gray-900 text-base pb-1 border-b border-gray-300 mb-2">
              {row.label}
            </div>
          );
        }
        if (row.type === 'note') {
          return (
            <div key={i} className={`text-xs text-gray-500 py-0.5 ${row.indent ? 'pl-6' : ''}`}>
              {row.label}
            </div>
          );
        }
        if (row.type === 'result') {
          return (
            <div key={i} className="flex justify-between py-1 border-t-2 border-b-2 border-gray-900 mt-1 mb-1">
              <span className="font-bold text-gray-900">{row.label}</span>
              <span className="font-bold text-gray-900">
                {row.amount !== undefined ? formatPoundsPence(row.amount) : ''}
              </span>
            </div>
          );
        }
        if (row.type === 'subtotal') {
          return (
            <div key={i} className="flex justify-between py-0.5 border-t border-gray-300 mt-1">
              <span className={`${row.bold ? 'font-medium text-gray-900' : 'text-gray-600'}`}>{row.label}</span>
              <span className={`${row.bold ? 'font-medium' : ''} text-gray-900`}>
                {row.amount !== undefined ? formatPounds(row.amount) : ''}
              </span>
            </div>
          );
        }

        // income or deduction
        const isDeduction = row.type === 'deduction' || (row.amount !== undefined && row.amount < 0);
        return (
          <div key={i} className={`flex justify-between py-0.5 ${row.indent ? 'pl-6' : ''}`}>
            <span className="text-gray-600">{row.label}</span>
            <span className={isDeduction ? 'text-red-600' : 'text-gray-900'}>
              {row.amount !== undefined
                ? isDeduction
                  ? `(${formatCurrency(Math.abs(row.amount))})`
                  : formatPounds(row.amount)
                : ''}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Key dates summary */
function KeyDatesSummary({ output }: { output: CTOutput }) {
  const { keyDates } = output;

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
        <div className="text-xs text-gray-500 mb-1">CT Payment Due</div>
        <div className="text-sm font-medium text-gray-900">{formatDate(keyDates.paymentDueDate)}</div>
        <div className="text-xs text-gray-400 mt-0.5">9 months + 1 day after AP end</div>
      </div>
      <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
        <div className="text-xs text-gray-500 mb-1">CT600 Filing Deadline</div>
        <div className="text-sm font-medium text-gray-900">{formatDate(keyDates.filingDeadline)}</div>
        <div className="text-xs text-gray-400 mt-0.5">12 months after AP end</div>
      </div>
      {keyDates.qipsMayApply && (
        <div className="col-span-2 bg-amber-50 border border-amber-200 rounded-md p-3">
          <div className="text-xs text-amber-600 font-medium">Quarterly Instalment Payments</div>
          <div className="text-xs text-amber-800 mt-0.5">
            Augmented profits exceed {formatPounds(keyDates.qipThreshold)} — quarterly instalment payments may apply.
          </div>
        </div>
      )}
    </div>
  );
}

/** Rate comparison mini table (small profits vs marginal vs main) */
function RateComparisonPanel({ output }: { output: CTOutput }) {
  const { ctLiabilityCalc: ct, ttpComputation: ttp } = output;

  if (ttp.taxableTotalProfits <= 0) return null;

  return (
    <div className="grid grid-cols-3 gap-3 text-center">
      <div className={`border rounded-lg p-3 ${output.rateBandResult.rateBand === 'small-profits' ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'}`}>
        <div className="text-xs text-gray-500 mb-1">At 19%</div>
        <div className="text-lg font-bold text-gray-700">{formatPoundsPence(ct.ctAtSmallProfitsRate)}</div>
      </div>
      <div className={`border rounded-lg p-3 ${output.rateBandResult.rateBand === 'marginal' ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200'}`}>
        <div className="text-xs text-gray-500 mb-1">Actual ({formatPercentDecimal(ct.effectiveRate)})</div>
        <div className="text-lg font-bold text-gray-700">{formatPoundsPence(ct.ctLiability)}</div>
      </div>
      <div className={`border rounded-lg p-3 ${output.rateBandResult.rateBand === 'main-rate' ? 'bg-amber-50 border-amber-300' : 'bg-gray-50 border-gray-200'}`}>
        <div className="text-xs text-gray-500 mb-1">At 25%</div>
        <div className="text-lg font-bold text-gray-700">{formatPoundsPence(ct.ctAtMainRate)}</div>
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
              <span>Expected CT: {formatPoundsPence(scenario.expectedCTLiability)}</span>
              <span>Band: {getRateBandDisplayName(scenario.expectedRateBand)}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function CtComputation({
  config,
  callbacks,
  showTooltips: showTooltipsProp,
  className,
}: CtComputationProps) {
  const showTooltips = showTooltipsProp ?? config.showTooltips;

  // ─── State ─────────────────────────────────────────────────────────────────
  const [inputs, setInputs] = useState<CTInputs>(createEmptyInputs());
  const [output, setOutput] = useState<CTOutput | null>(null);
  const [attemptNumber, setAttemptNumber] = useState(0);
  const [showScenarios, setShowScenarios] = useState(false);
  const [showCT600, setShowCT600] = useState(config.showCT600Layout);
  const [showMRDetail, setShowMRDetail] = useState(true);
  const [activeScenario, setActiveScenario] = useState<HCScenario | null>(null);

  // ─── Input Handlers ────────────────────────────────────────────────────────

  const updatePeriod = useCallback((field: 'periodStart' | 'periodEnd', value: string) => {
    setInputs((prev) => ({
      ...prev,
      accountingPeriod: { ...prev.accountingPeriod, [field]: value },
    }));
    setOutput(null);
    callbacks?.onInputChange?.({ field: `accountingPeriod.${field}`, value, timestamp: Date.now() });
  }, [callbacks]);

  const updateIncome = useCallback((field: keyof CTInputs['income'], value: number) => {
    setInputs((prev) => ({
      ...prev,
      income: { ...prev.income, [field]: value },
    }));
    setOutput(null);
    callbacks?.onInputChange?.({ field: `income.${field}`, value, timestamp: Date.now() });
  }, [callbacks]);

  const updateDeductions = useCallback((value: number) => {
    setInputs((prev) => ({
      ...prev,
      deductions: { qualifyingCharitableDonations: value },
    }));
    setOutput(null);
    callbacks?.onInputChange?.({ field: 'deductions.qualifyingCharitableDonations', value, timestamp: Date.now() });
  }, [callbacks]);

  const updateExemptDistributions = useCallback((value: number) => {
    setInputs((prev) => ({
      ...prev,
      augmentedProfitsAdj: { exemptDistributions: value },
    }));
    setOutput(null);
    callbacks?.onInputChange?.({ field: 'augmentedProfitsAdj.exemptDistributions', value, timestamp: Date.now() });
  }, [callbacks]);

  const updateAssociatedCompanies = useCallback((value: number) => {
    setInputs((prev) => ({
      ...prev,
      associatedCompanies: { associatedCompanyCount: Math.max(1, Math.floor(value)) },
    }));
    setOutput(null);
    callbacks?.onInputChange?.({ field: 'associatedCompanies.associatedCompanyCount', value, timestamp: Date.now() });
  }, [callbacks]);

  // ─── Compute Handler ──────────────────────────────────────────────────────
  const handleCompute = useCallback(() => {
    const result = computeCT(inputs);
    const attempt = attemptNumber + 1;
    setOutput(result);
    setAttemptNumber(attempt);

    callbacks?.onCompute?.({
      ttp: result.ttpComputation.taxableTotalProfits,
      augmentedProfits: result.augmentedProfitsCalc.augmentedProfits,
      ctLiability: result.ctLiabilityCalc.ctLiability,
      effectiveRate: result.ctLiabilityCalc.effectiveRate,
      rateBand: result.rateBandResult.rateBand,
      attemptNumber: attempt,
      timestamp: Date.now(),
    });

    callbacks?.onValidation?.({
      errors: result.validationResults.filter((r) => r.severity === 'error' && !r.passed).map((r) => r.message),
      warnings: result.validationResults.filter((r) => r.severity === 'warning' && !r.passed).map((r) => r.message),
      timestamp: Date.now(),
    });
  }, [inputs, attemptNumber, callbacks]);

  // ─── Reset Handler ────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    const previousResult = output;
    setInputs(createEmptyInputs());
    setOutput(null);
    setAttemptNumber(0);
    setActiveScenario(null);
    callbacks?.onReset?.({ previousResult, timestamp: Date.now() });
  }, [output, callbacks]);

  // ─── Scenario Loader ──────────────────────────────────────────────────────
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

  // ─── CT600 View Handler ───────────────────────────────────────────────────
  const handleToggleCT600 = useCallback(() => {
    const next = !showCT600;
    setShowCT600(next);
    if (next && output) {
      callbacks?.onCT600View?.({
        ttp: output.ttpComputation.taxableTotalProfits,
        ctLiability: output.ctLiabilityCalc.ctLiability,
        timestamp: Date.now(),
      });
    }
  }, [showCT600, output, callbacks]);

  // ─── Derived ──────────────────────────────────────────────────────────────
  const canCompute =
    inputs.accountingPeriod.periodStart !== '' &&
    inputs.accountingPeriod.periodEnd !== '';

  const hasErrors = (output?.validationSummary.errors ?? 0) > 0;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={`max-w-4xl mx-auto ${className ?? ''}`}>
      {/* Tool header */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Corporation Tax Computation</h2>
            <p className="text-sm text-gray-500">CT liability with marginal relief and associated company thresholds</p>
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

      {/* Section 1: Accounting Period */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-1">
          Accounting Period
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Period Start</label>
            <input
              type="date"
              value={inputs.accountingPeriod.periodStart}
              onChange={(e) => updatePeriod('periodStart', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
            />
            <Tooltip
              text="The first day of the accounting period. For CT purposes, an AP cannot exceed 12 months."
              visible={showTooltips}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Period End</label>
            <input
              type="date"
              value={inputs.accountingPeriod.periodEnd}
              onChange={(e) => updatePeriod('periodEnd', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
            />
            <Tooltip
              text="The last day of the AP. Payment is due 9 months + 1 day after this date. Filing deadline is 12 months after."
              visible={showTooltips}
            />
          </div>
        </div>
      </div>

      {/* Section 2: Income Components */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-1">
          Income Components
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NumericField
            label="Trading Profits (after CA)"
            value={inputs.income.tradingProfits}
            onChange={(val) => updateIncome('tradingProfits', val)}
            prefix="£"
            showTooltips={showTooltips}
            tooltip="Trading profits after capital allowances — the figure from the trading profit computation and capital allowances working paper."
          />
          <NumericField
            label="Loan Relationship Income"
            value={inputs.income.loanRelationshipIncome}
            onChange={(val) => updateIncome('loanRelationshipIncome', val)}
            prefix="£"
            showTooltips={showTooltips}
            tooltip="Net loan relationship income (interest received minus interest paid on qualifying loans). Can be negative if there is a deficit."
            allowNegative
          />
          <NumericField
            label="Property Income"
            value={inputs.income.propertyIncome}
            onChange={(val) => updateIncome('propertyIncome', val)}
            prefix="£"
            showTooltips={showTooltips}
            tooltip="Net rental income from UK and overseas properties, after deducting allowable property expenses."
          />
          <NumericField
            label="Chargeable Gains"
            value={inputs.income.chargeableGains}
            onChange={(val) => updateIncome('chargeableGains', val)}
            prefix="£"
            showTooltips={showTooltips}
            tooltip="Net chargeable gains after deducting current year and brought-forward capital losses. Companies do not receive an annual exempt amount."
          />
        </div>
      </div>

      {/* Section 3: Deductions & Augmented Profits */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-1">
          Deductions & Augmented Profits
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NumericField
            label="Qualifying Charitable Donations"
            value={inputs.deductions.qualifyingCharitableDonations}
            onChange={updateDeductions}
            prefix="£"
            showTooltips={showTooltips}
            tooltip="Gift Aid payments to registered charities. Deducted from total profits. Cannot create or augment a loss — excess is lost (not carried forward)."
          />
          <NumericField
            label="Exempt ABGH Distributions Received"
            value={inputs.augmentedProfitsAdj.exemptDistributions}
            onChange={updateExemptDistributions}
            prefix="£"
            showTooltips={showTooltips}
            tooltip="Exempt dividends received from other companies. These do NOT increase TTP but DO increase augmented profits, which determines the rate band. Most companies have £nil here."
          />
        </div>
      </div>

      {/* Section 4: Associated Companies */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-1">
          Associated Companies
        </h3>
        <div className="max-w-xs">
          <NumericField
            label="Number of Associated Companies"
            value={inputs.associatedCompanies.associatedCompanyCount}
            onChange={updateAssociatedCompanies}
            min={1}
            max={20}
            step={1}
            showTooltips={showTooltips}
            tooltip="Total number of associated companies INCLUDING the company itself. Under CTA 2010 s.25A, companies are associated if one controls the other or both are under common control. A company with no associates enters 1."
          />
        </div>
        {showTooltips && (
          <div className="mt-3 text-xs text-gray-500 italic space-y-0.5">
            <p>CT thresholds are divided by this number:</p>
            <p>Upper limit: £250,000 &divide; {inputs.associatedCompanies.associatedCompanyCount} = {formatPounds(UPPER_LIMIT / Math.max(1, inputs.associatedCompanies.associatedCompanyCount))}</p>
            <p>Lower limit: £50,000 &divide; {inputs.associatedCompanies.associatedCompanyCount} = {formatPounds(LOWER_LIMIT / Math.max(1, inputs.associatedCompanies.associatedCompanyCount))}</p>
          </div>
        )}
      </div>

      {/* Compute button */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex justify-center">
          <button
            className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            onClick={handleCompute}
            disabled={!canCompute}
          >
            Compute Corporation Tax
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

          {/* Rate band banner */}
          {!hasErrors && output.ttpComputation.taxableTotalProfits > 0 && (
            <RateBandBanner output={output} />
          )}

          {/* TTP computation */}
          {!hasErrors && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-1">
                Taxable Total Profits
              </h3>
              <TTPComputationTable output={output} showTooltips={showTooltips} />
            </div>
          )}

          {/* Threshold detail */}
          {!hasErrors && output.ttpComputation.taxableTotalProfits > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-1">
                Associated Companies & Rate Band Thresholds
              </h3>
              <ThresholdDetail output={output} showTooltips={showTooltips} />
            </div>
          )}

          {/* Marginal relief detail */}
          {!hasErrors && output.marginalReliefCalc.applies && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3 border-b border-gray-200 pb-1">
                <h3 className="text-sm font-bold text-gray-700">Marginal Relief & CT Liability</h3>
                <button
                  className="text-xs text-blue-600 hover:text-blue-800"
                  onClick={() => {
                    setShowMRDetail(!showMRDetail);
                    if (!showMRDetail && output) {
                      callbacks?.onMarginalReliefView?.({
                        formula: output.marginalReliefCalc.formulaDisplay,
                        relief: output.marginalReliefCalc.marginalRelief,
                        ctBefore: output.ctLiabilityCalc.ctAtMainRate,
                        ctAfter: output.ctLiabilityCalc.ctLiability,
                        timestamp: Date.now(),
                      });
                    }
                  }}
                >
                  {showMRDetail ? 'Hide detail' : 'Show detail'}
                </button>
              </div>
              {showMRDetail && <MarginalReliefPanel output={output} showTooltips={showTooltips} />}
            </div>
          )}

          {/* CT liability (non-marginal) */}
          {!hasErrors && !output.marginalReliefCalc.applies && output.ttpComputation.taxableTotalProfits > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-1">
                CT Liability
              </h3>
              <div className="space-y-1">
                <div className="flex justify-between py-0.5">
                  <span className="text-sm text-gray-600">
                    TTP &times; {output.rateBandResult.rateBand === 'small-profits' ? '19%' : '25%'}
                  </span>
                  <span className="text-sm font-mono text-gray-900">
                    {formatPounds(output.ttpComputation.taxableTotalProfits)} &times; {output.rateBandResult.rateBand === 'small-profits' ? '19%' : '25%'}
                  </span>
                </div>
                <div className="border-t-2 border-gray-900 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-bold text-gray-900">Corporation Tax Liability</span>
                    <span className="text-sm font-bold font-mono text-gray-900">{formatPoundsPence(output.ctLiabilityCalc.ctLiability)}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-500">Effective rate</span>
                    <span className="text-xs font-mono text-gray-500">{formatPercentDecimal(output.ctLiabilityCalc.effectiveRate)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Rate comparison */}
          {!hasErrors && output.ttpComputation.taxableTotalProfits > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-1">
                Rate Comparison
              </h3>
              <RateComparisonPanel output={output} />
            </div>
          )}

          {/* Key dates */}
          {!hasErrors && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-1">
                Key Dates
              </h3>
              <KeyDatesSummary output={output} />
            </div>
          )}

          {/* CT600-format layout */}
          {!hasErrors && output.ttpComputation.taxableTotalProfits > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3 border-b border-gray-200 pb-1">
                <h3 className="text-sm font-bold text-gray-700">CT600-Format Computation</h3>
                <button
                  className="text-xs text-blue-600 hover:text-blue-800"
                  onClick={handleToggleCT600}
                >
                  {showCT600 ? 'Hide' : 'Show'}
                </button>
              </div>
              {showCT600 && (
                <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                  <CT600LayoutTable output={output} />
                </div>
              )}
            </div>
          )}

          {/* H&C scenario hints */}
          {activeScenario && output && !hasErrors && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-1">
                Teaching Notes — {activeScenario.name}
              </h3>
              <div className="space-y-3">
                {Object.entries(activeScenario.hints).map(([topic, hints]) => (
                  <div key={topic}>
                    <p className="text-xs font-medium text-gray-600 mb-1 capitalize">
                      {topic.replace(/-/g, ' ')}
                    </p>
                    <ul className="text-xs text-gray-500 space-y-0.5 list-disc list-inside">
                      {hints.map((hint, i) => (
                        <li key={i}>{hint}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CtComputation;
