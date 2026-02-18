/**
 * CCL100 Return — React Component
 *
 * Simulates an HMRC CCL100 quarterly return for Climate Change Levy
 * with commodity-by-commodity input, CCA reduced rate handling,
 * exemptions, credits, validation engine, educational annotations,
 * H&C scenario loader, and MojiTax platform tracking callbacks.
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import type {
  Commodity,
  BoxNumber,
  CommodityInput,
  CCL100Inputs,
  CCL100Output,
  CCL100ReturnProps,
  CommodityBreakdown,
  CalculationStep,
  ValidationResult,
  HCScenario,
} from './types';
import {
  // Constants
  COMMODITIES,
  COMMODITY_NAMES,
  COMMODITY_UNITS,
  COMMODITY_BOX_MAP,

  // Labels
  BOX_LABELS,
  BOX_TOOLTIPS,
  COMMODITY_EDUCATIONAL_NOTES,
  FIELD_LABELS,
  FIELD_TOOLTIPS,

  // Helpers
  formatGBP,
  formatQuantity,

  // Defaults
  createEmptyInputs,

  // Calculation
  buildReturnOutput,

  // Scenarios
  HC_SCENARIOS,
} from './utils';

// ─── Sub-Components ─────────────────────────────────────────────────────────────

/** Tooltip component */
function Tooltip({ text, visible }: { text: string; visible: boolean }) {
  if (!visible) return null;
  return (
    <p className="mt-1 text-xs text-gray-500 italic">{text}</p>
  );
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

/** Calculation step display */
function CalculationStepDisplay({ step, showNote }: { step: CalculationStep; showNote: boolean }) {
  return (
    <div className="py-2 border-b border-gray-100 last:border-0">
      <div className="flex justify-between items-start">
        <div className="flex-1 pr-4">
          <div className="text-sm font-medium text-gray-800">{step.label}</div>
          <div className="text-xs text-gray-500 font-mono mt-0.5">{step.formula}</div>
        </div>
        <div className="text-sm font-mono font-bold text-right whitespace-nowrap">
          {formatGBP(step.amount)}
        </div>
      </div>
      {showNote && step.educationalNote && (
        <p className="text-xs text-gray-500 italic mt-1">{step.educationalNote}</p>
      )}
    </div>
  );
}

/** Commodity breakdown card */
function CommodityBreakdownCard({
  breakdown,
  showNotes,
}: {
  breakdown: CommodityBreakdown;
  showNotes: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  if (breakdown.standardQuantity === 0 && breakdown.ccaQuantity === 0) {
    return (
      <div className="p-3 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center">
          <div className="text-sm font-medium text-gray-400">
            Box {breakdown.boxNumber} — {breakdown.commodityName}
          </div>
          <div className="text-sm font-mono text-gray-400">{formatGBP(0)}</div>
        </div>
        <div className="text-xs text-gray-400 mt-0.5">No supplies this period</div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        className="w-full p-3 bg-white hover:bg-gray-50 transition-colors text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm font-bold text-gray-800">
              Box {breakdown.boxNumber} — {breakdown.commodityName}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {formatQuantity(breakdown.standardQuantity + breakdown.ccaQuantity, breakdown.unit)} total
              {breakdown.ccaQuantity > 0 && ` (${formatQuantity(breakdown.ccaQuantity, breakdown.unit)} CCA)`}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-lg font-bold font-mono text-gray-900">
              {formatGBP(breakdown.netCCLDue)}
            </div>
            <span className="text-gray-400 text-xs">{expanded ? '\u25B2' : '\u25BC'}</span>
          </div>
        </div>
      </button>
      {expanded && (
        <div className="border-t border-gray-200 p-3 bg-gray-50">
          {breakdown.calculationSteps.map((step, i) => (
            <CalculationStepDisplay key={i} step={step} showNote={showNotes} />
          ))}
        </div>
      )}
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

/** Rate reference panel */
function RateReferencePanel({ output }: { output: CCL100Output }) {
  const { rateReference } = output;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-sm font-bold text-gray-700 mb-3">
        Rate Reference — {rateReference.periodLabel}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-1.5 pr-3 text-gray-500 font-medium">Commodity</th>
              <th className="text-right py-1.5 px-3 text-gray-500 font-medium">Main Rate</th>
              <th className="text-right py-1.5 px-3 text-gray-500 font-medium">CCA Discount</th>
              <th className="text-right py-1.5 pl-3 text-gray-500 font-medium">CCA Rate</th>
            </tr>
          </thead>
          <tbody>
            {COMMODITIES.map((c) => {
              const r = rateReference.rates[c];
              return (
                <tr key={c} className="border-b border-gray-100 last:border-0">
                  <td className="py-1.5 pr-3 text-gray-800 font-medium">{COMMODITY_NAMES[c]}</td>
                  <td className="py-1.5 px-3 text-right font-mono">{r.mainRate.toFixed(5)} {r.unit}</td>
                  <td className="py-1.5 px-3 text-right font-mono">{r.ccaDiscount}</td>
                  <td className="py-1.5 pl-3 text-right font-mono">{r.ccaRate.toFixed(5)} {r.unit}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Summary result card */
function ResultSummary({ output }: { output: CCL100Output }) {
  const { boxes, position, paymentDeadlineLabel } = output;

  return (
    <div className={`rounded-lg p-4 ${position === 'nil' ? 'bg-gray-800 text-white' : position === 'repayable' ? 'bg-blue-900 text-white' : 'bg-gray-900 text-white'}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg text-green-400">{'\u2713'}</span>
        <span className="text-sm font-bold uppercase tracking-wide">
          CCL100 Return — {position === 'payable' ? 'Payable' : position === 'repayable' ? 'Repayable' : 'Nil'}
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
        <div>
          <div className="text-xs uppercase text-gray-400 mb-1">Box 1 — Electricity</div>
          <div className="text-lg font-bold">{formatGBP(boxes.box1)}</div>
        </div>
        <div>
          <div className="text-xs uppercase text-gray-400 mb-1">Box 2 — Gas</div>
          <div className="text-lg font-bold">{formatGBP(boxes.box2)}</div>
        </div>
        <div>
          <div className="text-xs uppercase text-gray-400 mb-1">Box 3 — LPG</div>
          <div className="text-lg font-bold">{formatGBP(boxes.box3)}</div>
        </div>
        <div>
          <div className="text-xs uppercase text-gray-400 mb-1">Box 4 — Solid Fuels</div>
          <div className="text-lg font-bold">{formatGBP(boxes.box4)}</div>
        </div>
        <div>
          <div className="text-xs uppercase text-gray-400 mb-1">Box 5 — Net CCL Due</div>
          <div className="text-2xl font-bold">{formatGBP(boxes.box5)}</div>
        </div>
      </div>
      <div className="mt-3 text-xs text-gray-400 text-center">
        Payment deadline: {paymentDeadlineLabel}
      </div>
    </div>
  );
}

/** Commodity input section */
function CommodityInputSection({
  commodity,
  input,
  onChange,
  showTooltips,
  hasCCA,
  onEntry,
}: {
  commodity: Commodity;
  input: CommodityInput;
  onChange: (updated: CommodityInput) => void;
  showTooltips: boolean;
  hasCCA: boolean;
  onEntry: (field: string, value: number) => void;
}) {
  const unit = COMMODITY_UNITS[commodity];
  const unitLabel = unit === 'kWh' ? 'kWh' : 'kg';
  const boxNum = COMMODITY_BOX_MAP[commodity];

  const handleChange = (field: keyof CommodityInput, value: number) => {
    onChange({ ...input, [field]: value });
    onEntry(field, value);
  };

  const showRenewables = commodity === 'electricity';
  const showMineralogical = commodity === 'solid-fuels';

  return (
    <fieldset className="border border-gray-200 rounded-lg p-4">
      <legend className="text-sm font-bold text-gray-700 px-2">
        Box {boxNum} — {COMMODITY_NAMES[commodity]}
      </legend>

      {showTooltips && (
        <p className="text-xs text-gray-500 italic mb-3">
          {COMMODITY_EDUCATIONAL_NOTES[commodity]}
        </p>
      )}

      <div className="space-y-3">
        {/* Standard quantity */}
        <div>
          <label className="block text-xs text-gray-600 mb-0.5">
            {FIELD_LABELS.standardQuantity} ({unitLabel})
          </label>
          <input
            type="number"
            step="1"
            min="0"
            className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm font-mono"
            value={input.standardQuantity || ''}
            onChange={(e) => handleChange('standardQuantity', parseFloat(e.target.value) || 0)}
            placeholder={`e.g. 500000 ${unitLabel}`}
          />
          <Tooltip text={FIELD_TOOLTIPS.standardQuantity} visible={showTooltips} />
        </div>

        {/* CCA quantity */}
        <div>
          <label className="block text-xs text-gray-600 mb-0.5">
            {FIELD_LABELS.ccaQuantity} ({unitLabel})
          </label>
          <input
            type="number"
            step="1"
            min="0"
            className={`w-full px-2 py-1.5 border rounded-md text-sm font-mono ${hasCCA ? 'border-green-300 bg-green-50' : 'border-gray-300'}`}
            value={input.ccaQuantity || ''}
            onChange={(e) => handleChange('ccaQuantity', parseFloat(e.target.value) || 0)}
            placeholder={hasCCA ? `CCA-covered ${unitLabel}` : `No CCA in force`}
            disabled={!hasCCA}
          />
          {!hasCCA && input.ccaQuantity > 0 && (
            <p className="mt-1 text-xs text-red-500">
              CCA quantity entered but no CCA is in force. Enable the CCA toggle above.
            </p>
          )}
          <Tooltip text={FIELD_TOOLTIPS.ccaQuantity} visible={showTooltips} />
        </div>

        {/* Exemptions */}
        <div className="grid grid-cols-2 gap-3">
          {showRenewables && (
            <div>
              <label className="block text-xs text-gray-600 mb-0.5">
                {FIELD_LABELS.exemptRenewables} ({unitLabel})
              </label>
              <input
                type="number"
                step="1"
                min="0"
                className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm font-mono"
                value={input.exemptRenewables || ''}
                onChange={(e) => handleChange('exemptRenewables', parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
              <Tooltip text={FIELD_TOOLTIPS.exemptRenewables} visible={showTooltips} />
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-600 mb-0.5">
              {FIELD_LABELS.exemptCHP} ({unitLabel})
            </label>
            <input
              type="number"
              step="1"
              min="0"
              className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm font-mono"
              value={input.exemptCHP || ''}
              onChange={(e) => handleChange('exemptCHP', parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
            <Tooltip text={FIELD_TOOLTIPS.exemptCHP} visible={showTooltips} />
          </div>

          {showMineralogical && (
            <div>
              <label className="block text-xs text-gray-600 mb-0.5">
                {FIELD_LABELS.exemptMineralogical} ({unitLabel})
              </label>
              <input
                type="number"
                step="1"
                min="0"
                className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm font-mono"
                value={input.exemptMineralogical || ''}
                onChange={(e) => handleChange('exemptMineralogical', parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
              <Tooltip text={FIELD_TOOLTIPS.exemptMineralogical} visible={showTooltips} />
            </div>
          )}
        </div>

        {/* Credits */}
        <div>
          <label className="block text-xs text-gray-600 mb-0.5">
            {FIELD_LABELS.creditFromPrior}
          </label>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">£</span>
            <input
              type="number"
              step="0.01"
              min="0"
              className="w-full pl-6 px-2 py-1.5 border border-gray-300 rounded-md text-sm font-mono"
              value={input.creditFromPrior || ''}
              onChange={(e) => handleChange('creditFromPrior', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
          </div>
          <Tooltip text={FIELD_TOOLTIPS.creditFromPrior} visible={showTooltips} />
        </div>
      </div>
    </fieldset>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

/**
 * CCL100 Return — Main React Component
 *
 * Simulates the HMRC CCL100 quarterly return for Climate Change Levy
 * with full validation, commodity breakdowns, CCA handling,
 * and educational annotations.
 */
export function CCL100Return({
  config,
  callbacks,
  showTooltips: showTooltipsProp,
  className,
}: CCL100ReturnProps) {
  const showTooltips = showTooltipsProp ?? config.showTooltips;

  // ─── State ─────────────────────────────────────────────────────────────────
  const [inputs, setInputs] = useState<CCL100Inputs>(createEmptyInputs());
  const [output, setOutput] = useState<CCL100Output | null>(null);
  const [attemptNumber, setAttemptNumber] = useState(0);
  const [showScenarios, setShowScenarios] = useState(false);
  const [showCalcNotes, setShowCalcNotes] = useState(true);

  // ─── Period handlers ──────────────────────────────────────────────────────
  const updatePeriod = useCallback((field: 'startDate' | 'endDate' | 'label', value: string) => {
    setInputs((prev) => ({
      ...prev,
      period: { ...prev.period, [field]: value },
    }));
    setOutput(null);
  }, []);

  // ─── CCA handlers ──────────────────────────────────────────────────────────
  const updateCCA = useCallback(<K extends keyof CCL100Inputs['cca']>(
    field: K,
    value: CCL100Inputs['cca'][K]
  ) => {
    setInputs((prev) => ({
      ...prev,
      cca: { ...prev.cca, [field]: value },
    }));
    setOutput(null);
  }, []);

  // ─── Commodity input handlers ──────────────────────────────────────────────
  const updateCommodity = useCallback((commodity: Commodity, updated: CommodityInput) => {
    setInputs((prev) => {
      switch (commodity) {
        case 'electricity': return { ...prev, electricity: updated };
        case 'gas': return { ...prev, gas: updated };
        case 'lpg': return { ...prev, lpg: updated };
        case 'solid-fuels': return { ...prev, solidFuels: updated };
      }
    });
    setOutput(null);
  }, []);

  const handleCommodityEntry = useCallback((commodity: Commodity, field: string, value: number) => {
    callbacks?.onCommodityEntry?.({
      commodity,
      field,
      value,
      timestamp: Date.now(),
    });
  }, [callbacks]);

  // ─── Get commodity input by type ──────────────────────────────────────────
  const getCommodityInput = useCallback((commodity: Commodity): CommodityInput => {
    switch (commodity) {
      case 'electricity': return inputs.electricity;
      case 'gas': return inputs.gas;
      case 'lpg': return inputs.lpg;
      case 'solid-fuels': return inputs.solidFuels;
    }
  }, [inputs]);

  // ─── Submit handler ───────────────────────────────────────────────────────
  const handleSubmit = useCallback(() => {
    const result = buildReturnOutput(inputs);
    const attempt = attemptNumber + 1;
    setOutput(result);
    setAttemptNumber(attempt);

    callbacks?.onSubmit?.({
      boxes: result.boxes,
      position: result.position,
      isCorrect: true, // Placeholder — comparison with expected answers done in graded mode
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

  // ─── Reset handler ────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    const previousAttempt = output;
    setInputs(createEmptyInputs());
    setOutput(null);
    setAttemptNumber(0);

    callbacks?.onReset?.({
      previousAttempt,
      timestamp: Date.now(),
    });
  }, [output, callbacks]);

  // ─── Scenario loader ─────────────────────────────────────────────────────
  const handleLoadScenario = useCallback((scenario: HCScenario) => {
    setInputs(scenario.preFilledInputs);
    setOutput(null);
    setAttemptNumber(0);
    setShowScenarios(false);

    callbacks?.onScenarioLoad?.({
      scenarioId: scenario.id,
      section: scenario.section,
      timestamp: Date.now(),
    });
  }, [callbacks]);

  // ─── Check if there is any input to submit ────────────────────────────────
  const hasAnyInput = useMemo(() => {
    return COMMODITIES.some((c) => {
      const input = getCommodityInput(c);
      return input.standardQuantity > 0 || input.ccaQuantity > 0;
    });
  }, [getCommodityInput]);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={`max-w-4xl mx-auto ${className ?? ''}`}>
      {/* Tool header */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">CCL100 Return</h2>
            <p className="text-sm text-gray-500">
              Climate Change Levy — Quarterly Return
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              onClick={() => setShowScenarios(!showScenarios)}
            >
              H&C Scenarios
            </button>
            {(output || hasAnyInput) && (
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

        {/* Section 1: Period */}
        <fieldset>
          <legend className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-1 w-full">
            1. Accounting Period
          </legend>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-0.5">{FIELD_LABELS.periodStart}</label>
              <input
                type="date"
                className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm"
                value={inputs.period.startDate}
                onChange={(e) => updatePeriod('startDate', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-0.5">{FIELD_LABELS.periodEnd}</label>
              <input
                type="date"
                className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm"
                value={inputs.period.endDate}
                onChange={(e) => updatePeriod('endDate', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-0.5">{FIELD_LABELS.periodLabel}</label>
              <input
                type="text"
                className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm"
                value={inputs.period.label}
                onChange={(e) => updatePeriod('label', e.target.value)}
                placeholder="e.g. Q4 2025/26"
              />
            </div>
          </div>
        </fieldset>

        {/* Section 2: CCA Details */}
        <fieldset>
          <legend className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-1 w-full">
            2. Climate Change Agreement
          </legend>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={inputs.cca.hasCCA}
                  onChange={(e) => updateCCA('hasCCA', e.target.checked)}
                />
                <span className="text-sm text-gray-700">{FIELD_LABELS.hasCCA}</span>
              </label>
            </div>
            <Tooltip text={FIELD_TOOLTIPS.hasCCA} visible={showTooltips} />

            {inputs.cca.hasCCA && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div>
                  <label className="block text-xs text-gray-600 mb-0.5">{FIELD_LABELS.ccaCertificateRef}</label>
                  <input
                    type="text"
                    className="w-full px-2 py-1.5 border border-green-300 rounded-md text-sm font-mono bg-white"
                    value={inputs.cca.ccaCertificateRef}
                    onChange={(e) => updateCCA('ccaCertificateRef', e.target.value)}
                    placeholder="e.g. CCA/SW/2024/0847"
                  />
                  <Tooltip text={FIELD_TOOLTIPS.ccaCertificateRef} visible={showTooltips} />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-0.5">{FIELD_LABELS.ccaFacilityName}</label>
                  <input
                    type="text"
                    className="w-full px-2 py-1.5 border border-green-300 rounded-md text-sm bg-white"
                    value={inputs.cca.ccaFacilityName}
                    onChange={(e) => updateCCA('ccaFacilityName', e.target.value)}
                    placeholder="e.g. Swansea Manufacturing Plant"
                  />
                  <Tooltip text={FIELD_TOOLTIPS.ccaFacilityName} visible={showTooltips} />
                </div>
              </div>
            )}
          </div>
        </fieldset>

        {/* Section 3: Commodity Inputs */}
        <div>
          <div className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-1">
            3. Commodity Supplies (Boxes 1–4)
          </div>
          <div className="space-y-4">
            {COMMODITIES.map((commodity) => (
              <CommodityInputSection
                key={commodity}
                commodity={commodity}
                input={getCommodityInput(commodity)}
                onChange={(updated) => updateCommodity(commodity, updated)}
                showTooltips={showTooltips}
                hasCCA={inputs.cca.hasCCA}
                onEntry={(field, value) => handleCommodityEntry(commodity, field, value)}
              />
            ))}
          </div>
        </div>

        {/* CPS note */}
        {showTooltips && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="text-xs font-bold text-gray-500 mb-1">Boxes 6–9 — Carbon Price Support</div>
            <p className="text-xs text-gray-500">
              CPS boxes only apply to electricity generators using gas, LPG, or solid fuels to generate electricity.
              H&C is a manufacturer, not a generator — Boxes 6–9 are zero.
              CPS rates are fixed until 31 March 2028: gas £0.00331/kWh, LPG £0.05280/kg.
            </p>
          </div>
        )}

        {/* Submit button */}
        <div className="flex justify-center pt-2">
          <button
            className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            onClick={handleSubmit}
            disabled={!hasAnyInput}
          >
            Submit CCL100 Return
          </button>
        </div>
      </div>

      {/* Results */}
      {output && (
        <div className="space-y-4">
          {/* Summary card */}
          <ResultSummary output={output} />

          {/* Rate reference */}
          <RateReferencePanel output={output} />

          {/* Commodity breakdowns */}
          {config.showBreakdowns && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-700">Commodity Breakdown</h3>
                <button
                  className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                  onClick={() => setShowCalcNotes(!showCalcNotes)}
                >
                  {showCalcNotes ? 'Hide notes' : 'Show notes'}
                </button>
              </div>
              <div className="space-y-2">
                {output.commodityBreakdowns.map((breakdown) => (
                  <CommodityBreakdownCard
                    key={breakdown.commodity}
                    breakdown={breakdown}
                    showNotes={showCalcNotes}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Validation results */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-bold text-gray-700 mb-3">
              Validation ({output.validationSummary.passed}/{output.validationSummary.total} passed)
            </h3>
            <div className="space-y-2">
              {output.validationResults
                .filter((r) => !r.passed || r.severity !== 'info')
                .map((result, i) => (
                  <ValidationAlert key={i} result={result} />
                ))}
              {output.validationResults.filter((r) => !r.passed || r.severity !== 'info').length === 0 && (
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

export default CCL100Return;
