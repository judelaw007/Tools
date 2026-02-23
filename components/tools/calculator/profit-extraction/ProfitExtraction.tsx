/**
 * Salary vs Dividend Profit Extraction Optimiser — React Component
 *
 * Compares salary, dividends, pension, and rent extraction methods
 * for UK owner-managed business director-shareholders.
 *
 * Features: multi-method comparison, NIC efficiency analysis,
 * CT marginal relief awareness, H&C scenario loader, educational
 * tooltips, and MojiTax platform tracking callbacks.
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import type {
  TaxYear,
  StrategyType,
  ProfitExtractionProps,
  ProfitExtractionCallbacks,
  ProfitExtractionInputs,
  ProfitExtractionOutput,
  StrategyResult,
  MethodTaxBreakdown,
  ValidationResult,
  HCScenario,
} from './types';
import {
  getTaxRates,
  calculateExtraction,
  createEmptyInputs,
  formatGBP,
  formatPercent,
  FIELD_LABELS,
  FIELD_TOOLTIPS,
  HC_SCENARIOS,
} from './utils';

// ─── Sub-Components ─────────────────────────────────────────────────────────────

/** Tooltip shown beneath a field */
function Tooltip({ text, visible }: { text: string; visible: boolean }) {
  if (!visible) return null;
  return <p className="mt-1 text-xs text-gray-500 italic">{text}</p>;
}

/** Validation alert display */
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

/** Numeric input field */
function NumericField({
  id,
  label,
  tooltip,
  value,
  onChange,
  showTooltips,
  disabled,
  placeholder,
  prefix,
  step,
  min,
}: {
  id: string;
  label: string;
  tooltip?: string;
  value: number;
  onChange: (val: number) => void;
  showTooltips: boolean;
  disabled?: boolean;
  placeholder?: string;
  prefix?: string;
  step?: number;
  min?: number;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
            {prefix}
          </span>
        )}
        <input
          id={id}
          type="number"
          step={step ?? 1}
          min={min ?? 0}
          className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm font-mono ${
            prefix ? 'pl-6' : ''
          } ${disabled ? 'bg-gray-50 text-gray-400' : ''}`}
          value={value || ''}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          disabled={disabled}
          placeholder={placeholder ?? '0'}
        />
      </div>
      {tooltip && <Tooltip text={tooltip} visible={showTooltips} />}
    </div>
  );
}

/** Method breakdown row in comparison table */
function MethodRow({ breakdown }: { breakdown: MethodTaxBreakdown }) {
  const methodLabels: Record<string, string> = {
    salary: 'Salary',
    dividend: 'Dividends',
    pension: 'Pension',
    rent: 'Rent',
  };

  return (
    <tr className="border-b border-gray-100">
      <td className="py-2 text-sm font-medium text-gray-900">
        {methodLabels[breakdown.method]}
      </td>
      <td className="py-2 text-sm font-mono text-right">{formatGBP(breakdown.grossAmount)}</td>
      <td className="py-2 text-sm font-mono text-right">{formatGBP(breakdown.corporationTaxImpact)}</td>
      <td className="py-2 text-sm font-mono text-right">{formatGBP(breakdown.employerNIC)}</td>
      <td className="py-2 text-sm font-mono text-right">{formatGBP(breakdown.employeeNIC)}</td>
      <td className="py-2 text-sm font-mono text-right">{formatGBP(breakdown.incomeTax)}</td>
      <td className="py-2 text-sm font-mono text-right font-bold">{formatGBP(breakdown.totalTaxCost)}</td>
      <td className="py-2 text-sm font-mono text-right text-green-700 font-bold">
        {formatGBP(breakdown.netReceipt)}
      </td>
      <td className="py-2 text-sm font-mono text-right">{formatPercent(breakdown.effectiveRate)}</td>
    </tr>
  );
}

/** Strategy comparison card */
function StrategyCard({
  strategy,
  isOptimal,
  isCurrent,
}: {
  strategy: StrategyResult;
  isOptimal: boolean;
  isCurrent: boolean;
}) {
  const borderColor = isOptimal
    ? 'border-green-300 bg-green-50'
    : isCurrent
    ? 'border-blue-300 bg-blue-50'
    : 'border-gray-200 bg-white';

  return (
    <div className={`border rounded-lg p-4 ${borderColor}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-bold text-gray-900">{strategy.label}</h4>
        <div className="flex gap-1">
          {isOptimal && (
            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
              Optimal
            </span>
          )}
          {isCurrent && (
            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
              Current
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <div className="text-xs uppercase text-gray-500">Total Extracted</div>
          <div className="text-lg font-bold text-gray-900">{formatGBP(strategy.totalExtracted)}</div>
        </div>
        <div>
          <div className="text-xs uppercase text-gray-500">Tax Cost</div>
          <div className="text-lg font-bold text-red-700">{formatGBP(strategy.totalTaxCost)}</div>
        </div>
        <div>
          <div className="text-xs uppercase text-gray-500">Net Receipt</div>
          <div className="text-lg font-bold text-green-700">{formatGBP(strategy.totalNetReceipt)}</div>
        </div>
      </div>

      <div className="mt-2 text-center">
        <span className="text-xs text-gray-500">
          Effective rate: {formatPercent(strategy.overallEffectiveRate)}
        </span>
      </div>

      {/* Method breakdown summary */}
      <div className="mt-3 space-y-1">
        {strategy.methods.map((m) => (
          <div key={m.method} className="flex justify-between text-xs text-gray-600">
            <span className="capitalize">{m.method}</span>
            <span className="font-mono">{formatGBP(m.grossAmount)}</span>
          </div>
        ))}
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
        <button
          className="text-xs text-gray-400 hover:text-gray-600"
          onClick={onClose}
        >
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
            <div className="text-sm font-medium text-gray-900">{scenario.name}</div>
            <div className="text-xs text-gray-500 mt-0.5">{scenario.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

/** Summary result card */
function ResultSummary({ output }: { output: ProfitExtractionOutput }) {
  const { customStrategy } = output;

  return (
    <div className="bg-gray-900 text-white rounded-lg p-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div>
          <div className="text-xs uppercase text-gray-400 mb-1">Total Extracted</div>
          <div className="text-xl font-bold">{formatGBP(customStrategy.totalExtracted)}</div>
        </div>
        <div>
          <div className="text-xs uppercase text-gray-400 mb-1">Total Tax Cost</div>
          <div className="text-xl font-bold text-red-400">
            {formatGBP(customStrategy.totalTaxCost)}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase text-gray-400 mb-1">Net Receipt</div>
          <div className="text-xl font-bold text-green-400">
            {formatGBP(customStrategy.totalNetReceipt)}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase text-gray-400 mb-1">Effective Rate</div>
          <div className="text-2xl font-bold">
            {formatPercent(customStrategy.overallEffectiveRate)}
          </div>
        </div>
      </div>

      {/* Marginal rates */}
      <div className="mt-3 flex justify-center gap-6 text-xs text-gray-400">
        <span>
          Marginal salary rate: {formatPercent(output.marginalRates.salaryMarginalRate)}
        </span>
        <span>
          Marginal dividend rate: {formatPercent(output.marginalRates.dividendMarginalRate)}
        </span>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export function ProfitExtraction({
  config,
  callbacks,
  showTooltips: showTooltipsProp,
  className,
}: ProfitExtractionProps) {
  const showTooltips = showTooltipsProp ?? config.showTooltips;

  // ─── State ─────────────────────────────────────────────────────────────────
  const [inputs, setInputs] = useState<ProfitExtractionInputs>(createEmptyInputs());
  const [output, setOutput] = useState<ProfitExtractionOutput | null>(null);
  const [attemptNumber, setAttemptNumber] = useState(0);
  const [showScenarios, setShowScenarios] = useState(false);
  const [showDetailedBreakdown, setShowDetailedBreakdown] = useState(false);

  // ─── Input handlers ────────────────────────────────────────────────────────
  const updateCompany = useCallback(
    <K extends keyof ProfitExtractionInputs['company']>(
      field: K,
      value: ProfitExtractionInputs['company'][K]
    ) => {
      setInputs((prev) => ({
        ...prev,
        company: { ...prev.company, [field]: value },
      }));
      setOutput(null);
      callbacks?.onInputChange?.({ field: `company.${field}`, value: value as number | boolean | string, timestamp: Date.now() });
    },
    [callbacks]
  );

  const updateExtraction = useCallback(
    <K extends keyof ProfitExtractionInputs['extraction']>(
      field: K,
      value: ProfitExtractionInputs['extraction'][K]
    ) => {
      setInputs((prev) => ({
        ...prev,
        extraction: { ...prev.extraction, [field]: value },
      }));
      setOutput(null);
      callbacks?.onInputChange?.({ field: `extraction.${field}`, value: value as number | boolean | string, timestamp: Date.now() });
    },
    [callbacks]
  );

  const updatePersonal = useCallback(
    <K extends keyof ProfitExtractionInputs['personal']>(
      field: K,
      value: ProfitExtractionInputs['personal'][K]
    ) => {
      setInputs((prev) => ({
        ...prev,
        personal: { ...prev.personal, [field]: value },
      }));
      setOutput(null);
      callbacks?.onInputChange?.({ field: `personal.${field}`, value: value as number | boolean | string, timestamp: Date.now() });
    },
    [callbacks]
  );

  // ─── Calculate handler ─────────────────────────────────────────────────────
  const handleCalculate = useCallback(() => {
    const result = calculateExtraction(inputs);
    const attempt = attemptNumber + 1;
    setOutput(result);
    setAttemptNumber(attempt);

    callbacks?.onCalculate?.({
      strategyType: 'custom',
      totalTaxCost: result.customStrategy.totalTaxCost,
      netReceipt: result.customStrategy.totalNetReceipt,
      effectiveRate: result.customStrategy.overallEffectiveRate,
      attemptNumber: attempt,
      timestamp: Date.now(),
    });

    callbacks?.onValidation?.({
      validationResults: result.validationResults,
      passCount: result.validationSummary.passed,
      failCount: result.validationSummary.errors + result.validationSummary.warnings,
      timestamp: Date.now(),
    });
  }, [inputs, attemptNumber, callbacks]);

  // ─── Reset handler ─────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    const previousAttempt = output;
    setInputs(createEmptyInputs());
    setOutput(null);
    setAttemptNumber(0);

    callbacks?.onReset?.({ previousAttempt, timestamp: Date.now() });
  }, [output, callbacks]);

  // ─── Scenario loader ──────────────────────────────────────────────────────
  const handleLoadScenario = useCallback(
    (scenario: HCScenario) => {
      setInputs(scenario.preFilledInputs);
      setOutput(null);
      setAttemptNumber(0);
      setShowScenarios(false);

      callbacks?.onScenarioLoad?.({
        scenarioId: scenario.id,
        section: scenario.section,
        timestamp: Date.now(),
      });
    },
    [callbacks]
  );

  // ─── Derived ───────────────────────────────────────────────────────────────
  const hasInput = inputs.company.companyProfit > 0;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={`max-w-5xl mx-auto ${className ?? ''}`}>
      {/* Tool header */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Profit Extraction Optimiser
            </h2>
            <p className="text-sm text-gray-500">
              Salary vs Dividends vs Pension — UK Owner-Managed Business
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              onClick={() => setShowScenarios(!showScenarios)}
            >
              H&C Scenarios
            </button>
            {(output || hasInput) && (
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
        <ScenarioSelector
          onLoad={handleLoadScenario}
          onClose={() => setShowScenarios(false)}
        />
      )}

      {/* Input form */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 space-y-6">
        {/* Section 1: Company Details */}
        <fieldset>
          <legend className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-1 w-full">
            1. Company Details
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <NumericField
              id="companyProfit"
              label={FIELD_LABELS.companyProfit}
              tooltip={FIELD_TOOLTIPS.companyProfit}
              value={inputs.company.companyProfit}
              onChange={(v) => updateCompany('companyProfit', v)}
              showTooltips={showTooltips}
              prefix="£"
              placeholder="e.g. 100000"
            />
            <NumericField
              id="associatedCompanies"
              label={FIELD_LABELS.associatedCompanies}
              tooltip={FIELD_TOOLTIPS.associatedCompanies}
              value={inputs.company.associatedCompanies}
              onChange={(v) => updateCompany('associatedCompanies', Math.max(1, Math.round(v)))}
              showTooltips={showTooltips}
              min={1}
              step={1}
              placeholder="1"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {FIELD_LABELS.employmentAllowance}
              </label>
              <label className="flex items-center gap-2 mt-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={inputs.company.employmentAllowance}
                  onChange={(e) => updateCompany('employmentAllowance', e.target.checked)}
                />
                £5,000 EA available
              </label>
              <Tooltip text={FIELD_TOOLTIPS.employmentAllowance} visible={showTooltips} />
            </div>
          </div>
        </fieldset>

        {/* Section 2: Extraction Strategy */}
        <fieldset>
          <legend className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-1 w-full">
            2. Extraction Strategy
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <NumericField
              id="salaryAmount"
              label={FIELD_LABELS.salaryAmount}
              tooltip={FIELD_TOOLTIPS.salaryAmount}
              value={inputs.extraction.salaryAmount}
              onChange={(v) => updateExtraction('salaryAmount', v)}
              showTooltips={showTooltips}
              prefix="£"
              placeholder="e.g. 50270"
            />
            <NumericField
              id="dividendAmount"
              label={FIELD_LABELS.dividendAmount}
              tooltip={FIELD_TOOLTIPS.dividendAmount}
              value={inputs.extraction.dividendAmount}
              onChange={(v) => updateExtraction('dividendAmount', v)}
              showTooltips={showTooltips}
              prefix="£"
              placeholder="e.g. 30000"
            />
            <NumericField
              id="pensionContribution"
              label={FIELD_LABELS.pensionContribution}
              tooltip={FIELD_TOOLTIPS.pensionContribution}
              value={inputs.extraction.pensionContribution}
              onChange={(v) => updateExtraction('pensionContribution', v)}
              showTooltips={showTooltips}
              prefix="£"
              placeholder="0"
            />
            <NumericField
              id="rentalPayment"
              label={FIELD_LABELS.rentalPayment}
              tooltip={FIELD_TOOLTIPS.rentalPayment}
              value={inputs.extraction.rentalPayment}
              onChange={(v) => updateExtraction('rentalPayment', v)}
              showTooltips={showTooltips}
              prefix="£"
              placeholder="0"
            />
          </div>
        </fieldset>

        {/* Section 3: Personal Tax Context */}
        <fieldset>
          <legend className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-1 w-full">
            3. Personal Tax Context
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <NumericField
              id="otherIncome"
              label={FIELD_LABELS.otherIncome}
              tooltip={FIELD_TOOLTIPS.otherIncome}
              value={inputs.personal.otherIncome}
              onChange={(v) => updatePersonal('otherIncome', v)}
              showTooltips={showTooltips}
              prefix="£"
              placeholder="0"
            />
            <NumericField
              id="otherDividends"
              label={FIELD_LABELS.otherDividends}
              tooltip={FIELD_TOOLTIPS.otherDividends}
              value={inputs.personal.otherDividends}
              onChange={(v) => updatePersonal('otherDividends', v)}
              showTooltips={showTooltips}
              prefix="£"
              placeholder="0"
            />
            <div>
              <label
                htmlFor="taxYear"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {FIELD_LABELS.taxYear}
              </label>
              <select
                id="taxYear"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                value={inputs.personal.taxYear}
                onChange={(e) => updatePersonal('taxYear', e.target.value as TaxYear)}
              >
                <option value="2025/26">2025/26</option>
                <option value="2026/27">2026/27</option>
              </select>
              <Tooltip text={FIELD_TOOLTIPS.taxYear} visible={showTooltips} />
            </div>
          </div>
        </fieldset>

        {/* Calculate button */}
        <div className="flex justify-center pt-2">
          <button
            className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            onClick={handleCalculate}
            disabled={!hasInput}
          >
            Calculate Extraction
          </button>
        </div>
      </div>

      {/* Results */}
      {output && (
        <div className="space-y-4">
          {/* Summary card */}
          <ResultSummary output={output} />

          {/* NIC Efficiency Point */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-bold text-gray-700 mb-2">NIC Efficiency Point</h3>
            <p className="text-sm text-gray-600">
              The NIC efficiency point is{' '}
              <strong>{formatGBP(output.customStrategy.nicEfficiencyPoint)}</strong> (the Upper
              Earnings Limit). Below this level, the CT saving on salary (
              {formatPercent(
                getTaxRates(inputs.personal.taxYear).ct.mainRate
              )}{' '}
              of salary + employer NIC) outweighs the NIC cost. Above this level, the 40%
              income tax rate makes salary significantly more expensive than dividends.
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Personal allowance:{' '}
              <strong>{formatGBP(output.effectivePersonalAllowance)}</strong>
              {output.effectivePersonalAllowance < 12_570 && (
                <span className="text-amber-600 ml-1">
                  (tapered — total income exceeds £100,000)
                </span>
              )}
            </p>
          </div>

          {/* Detailed breakdown */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-700">Your Strategy — Detailed Breakdown</h3>
              <button
                className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                onClick={() => setShowDetailedBreakdown(!showDetailedBreakdown)}
              >
                {showDetailedBreakdown ? 'Hide details' : 'Show details'}
              </button>
            </div>

            {showDetailedBreakdown && output.customStrategy.methods.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="py-2 text-xs font-medium text-gray-500">Method</th>
                      <th className="py-2 text-xs font-medium text-gray-500 text-right">Gross</th>
                      <th className="py-2 text-xs font-medium text-gray-500 text-right">CT Impact</th>
                      <th className="py-2 text-xs font-medium text-gray-500 text-right">Emp'r NIC</th>
                      <th className="py-2 text-xs font-medium text-gray-500 text-right">Emp'ee NIC</th>
                      <th className="py-2 text-xs font-medium text-gray-500 text-right">Income Tax</th>
                      <th className="py-2 text-xs font-medium text-gray-500 text-right">Tax Cost</th>
                      <th className="py-2 text-xs font-medium text-gray-500 text-right">Net</th>
                      <th className="py-2 text-xs font-medium text-gray-500 text-right">Eff. Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {output.customStrategy.methods.map((m) => (
                      <MethodRow key={m.method} breakdown={m} />
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-900">
                      <td className="py-2 text-sm font-bold text-gray-900">Total</td>
                      <td className="py-2 text-sm font-mono text-right font-bold">
                        {formatGBP(output.customStrategy.totalExtracted)}
                      </td>
                      <td colSpan={4} />
                      <td className="py-2 text-sm font-mono text-right font-bold text-red-700">
                        {formatGBP(output.customStrategy.totalTaxCost)}
                      </td>
                      <td className="py-2 text-sm font-mono text-right font-bold text-green-700">
                        {formatGBP(output.customStrategy.totalNetReceipt)}
                      </td>
                      <td className="py-2 text-sm font-mono text-right font-bold">
                        {formatPercent(output.customStrategy.overallEffectiveRate)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* Company remaining profit */}
            <div className="mt-3 p-3 bg-gray-50 rounded-md">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Company profit remaining after extraction:</span>
                <span className="font-mono font-bold">
                  {formatGBP(output.customStrategy.companyProfitRemaining)}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mt-1">
                <span>CT on remaining profit:</span>
                <span className="font-mono">
                  {formatGBP(output.customStrategy.companyTaxOnRemaining)}
                </span>
              </div>
            </div>
          </div>

          {/* Strategy comparison */}
          {config.showComparison && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3">Strategy Comparison</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <StrategyCard
                  strategy={output.customStrategy}
                  isOptimal={
                    output.optimalStrategy.strategyType === 'custom'
                  }
                  isCurrent={true}
                />
                {output.comparisonStrategies.map((s) => (
                  <StrategyCard
                    key={s.strategyType}
                    strategy={s}
                    isOptimal={
                      output.optimalStrategy.strategyType === s.strategyType
                    }
                    isCurrent={false}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Recommendation */}
          {config.showRecommendation && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-blue-800 mb-2">Recommendation</h3>
              <p className="text-sm text-blue-700">{output.recommendation}</p>
            </div>
          )}

          {/* Validation results */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-bold text-gray-700 mb-3">
              Validation ({output.validationSummary.passed}/{output.validationSummary.total}{' '}
              passed)
            </h3>
            <div className="space-y-2">
              {output.validationResults
                .filter((r) => !r.passed || r.severity !== 'info')
                .map((result, i) => (
                  <ValidationAlert key={i} result={result} />
                ))}
              {output.validationResults.filter((r) => !r.passed || r.severity !== 'info')
                .length === 0 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">
                  All validations passed. No errors or warnings detected.
                </div>
              )}
            </div>
            <details className="mt-3">
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                Show all {output.validationSummary.total} validation results
              </summary>
              <div className="mt-2 space-y-2">
                {output.validationResults.map((result, i) => (
                  <ValidationAlert key={i} result={result} />
                ))}
              </div>
            </details>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfitExtraction;
