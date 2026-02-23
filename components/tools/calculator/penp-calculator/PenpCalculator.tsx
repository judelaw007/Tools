/**
 * Termination Payment Analyser (PENP Calculator) — React Component
 *
 * Multi-section tool: (1) collects employee, pay, notice and component
 * details, (2) calculates Post-Employment Notice Pay using the statutory
 * formula ((BP × D) / P − T), (3) classifies each payment component,
 * (4) applies the £30,000 exemption, (5) computes employer NIC, and
 * (6) cross-checks statutory redundancy entitlements.
 *
 * Features: PENP formula display, colour-coded component classification,
 * exemption breakdown, employer NIC panel, redundancy cross-check with
 * year-by-year table, H&C scenario loader, and MojiTax platform
 * tracking callbacks.
 */

'use client';

import React, { useState, useCallback } from 'react';
import type {
  PayPeriodType,
  PenpCalculatorProps,
  PENPInputs,
  PENPOutput,
  ValidationResult,
  ClassifiedComponent,
  HCScenario,
} from './types';
import {
  analysePENP,
  createEmptyInputs,
  scenarioToInputs,
  formatCurrency,
  formatPounds,
  formatPoundsPence,
  formatPercent,
  formatDate,
  getPayPeriodDays,
  getPayPeriodTypeName,
  getTaxYearDisplayName,
  THIRTY_THOUSAND_EXEMPTION,
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

/** Colour-coded component card */
function ComponentCard({
  component,
  showTooltips,
  hints,
}: {
  component: ClassifiedComponent;
  showTooltips: boolean;
  hints?: string[];
}) {
  const [expanded, setExpanded] = useState(false);

  const treatmentStyles = {
    'taxable-earnings': {
      bg: 'bg-red-50 border-red-200',
      badge: 'bg-red-100 text-red-700',
      icon: '\u2715',
      iconBg: 'bg-red-500 text-white',
    },
    exempt: {
      bg: 'bg-green-50 border-green-200',
      badge: 'bg-green-100 text-green-700',
      icon: '\u2713',
      iconBg: 'bg-green-500 text-white',
    },
    'thirty-thousand-exemption': {
      bg: 'bg-amber-50 border-amber-200',
      badge: 'bg-amber-100 text-amber-700',
      icon: '\u00A3',
      iconBg: 'bg-amber-500 text-white',
    },
  }[component.taxTreatment];

  return (
    <div className={`border rounded-lg p-3 ${treatmentStyles.bg}`}>
      <div className="flex items-start gap-3">
        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold flex-shrink-0 mt-0.5 ${treatmentStyles.iconBg}`}>
          {treatmentStyles.icon}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900">{component.componentName}</span>
              <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${treatmentStyles.badge}`}>
                {component.taxTreatmentLabel}
              </span>
            </div>
            <span className="text-sm font-mono font-medium text-gray-900">{formatPoundsPence(component.amount)}</span>
          </div>
          <p className="text-xs text-gray-400 font-mono">{component.legislativeRef}</p>

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
              {showTooltips && component.educationalNote && (
                <p className="text-xs text-gray-500 italic leading-relaxed">{component.educationalNote}</p>
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

/** PENP formula display */
function PENPFormulaDisplay({ output }: { output: PENPOutput }) {
  const { penpCalculation: penp } = output;

  return (
    <div className="space-y-3">
      <div className="bg-gray-50 rounded-lg p-4 text-center">
        <div className="text-xs text-gray-500 mb-2">PENP Formula: ((BP &times; D) / P) &minus; T</div>
        <div className="text-sm font-mono text-gray-700 leading-relaxed">
          (({formatPounds(penp.basicPay)} &times; {penp.unservedNoticeDays} days) / {penp.payPeriodDays} days) &minus; {formatPounds(penp.priorTaxablePayments)}
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between py-0.5">
          <span className="text-sm text-gray-600">BP — Basic pay per period</span>
          <span className="text-sm font-mono text-gray-900">{formatPoundsPence(penp.basicPay)}</span>
        </div>
        <div className="flex justify-between py-0.5">
          <span className="text-sm text-gray-600">D — Unserved notice days</span>
          <span className="text-sm font-mono text-gray-900">{penp.unservedNoticeDays} days</span>
        </div>
        <div className="flex justify-between py-0.5">
          <span className="text-sm text-gray-600">P — Pay period days</span>
          <span className="text-sm font-mono text-gray-900">{penp.payPeriodDays} days</span>
        </div>
        <div className="flex justify-between py-0.5">
          <span className="text-sm text-gray-600">T — Prior taxable payments</span>
          <span className="text-sm font-mono text-gray-900">{formatPoundsPence(penp.priorTaxablePayments)}</span>
        </div>
        {penp.rawResult < 0 && (
          <div className="flex justify-between py-0.5">
            <span className="text-sm text-gray-600">Raw result (before floor)</span>
            <span className="text-sm font-mono text-red-600">{formatPoundsPence(penp.rawResult)}</span>
          </div>
        )}
        <div className="flex justify-between py-1 border-t-2 border-gray-900 mt-1">
          <span className="text-sm font-bold text-gray-900">PENP Amount</span>
          <span className="text-sm font-bold font-mono text-gray-900">{formatPoundsPence(penp.penpAmount)}</span>
        </div>
      </div>
    </div>
  );
}

/** Exemption breakdown display */
function ExemptionBreakdown({ output }: { output: PENPOutput }) {
  const { exemptionCalculation: ex } = output;

  const usedPercent = Math.min(100, (ex.amountWithinExemption / ex.exemptionLimit) * 100);

  return (
    <div className="space-y-3">
      {/* Exemption bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">{'\u00A3'}30,000 Exemption</span>
          <span className="text-sm font-mono text-gray-600">
            {formatPounds(ex.amountWithinExemption)} / {formatPounds(ex.exemptionLimit)}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className={`h-full ${ex.amountExceedingExemption > 0 ? 'bg-amber-500' : 'bg-green-500'}`}
            style={{ width: `${usedPercent}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-500">
            Used: {formatPounds(ex.amountWithinExemption)}
          </span>
          <span className={`text-xs font-medium ${ex.amountExceedingExemption > 0 ? 'text-amber-600' : 'text-green-600'}`}>
            {ex.amountExceedingExemption > 0
              ? `${formatPounds(ex.amountExceedingExemption)} exceeding`
              : `${formatPounds(ex.remainingExemption)} remaining`}
          </span>
        </div>
      </div>

      {/* Breakdown */}
      <div className="space-y-1">
        <div className="flex justify-between py-0.5">
          <span className="text-sm text-gray-600">Earnings elements (PENP + PILON + RC)</span>
          <span className="text-sm font-mono text-gray-900">{formatPoundsPence(ex.earningsElements)}</span>
        </div>
        <div className="flex justify-between py-0.5">
          <span className="text-sm text-gray-600">Exempt elements (statutory redundancy)</span>
          <span className="text-sm font-mono text-green-600">{formatPoundsPence(ex.exemptElements)}</span>
        </div>
        <div className="flex justify-between py-0.5 border-t border-gray-200 pt-1">
          <span className="text-sm font-medium text-gray-900">Relevant termination award (ex gratia)</span>
          <span className="text-sm font-mono font-medium text-gray-900">{formatPoundsPence(ex.relevantTerminationAward)}</span>
        </div>
        <div className="flex justify-between py-0.5">
          <span className="text-sm text-gray-600 pl-4">Within {'\u00A3'}30,000 exemption</span>
          <span className="text-sm font-mono text-green-600">{formatPoundsPence(ex.amountWithinExemption)}</span>
        </div>
        {ex.amountExceedingExemption > 0 && (
          <div className="flex justify-between py-0.5">
            <span className="text-sm text-gray-600 pl-4">Exceeding {'\u00A3'}30,000 (taxable + Class 1A NIC)</span>
            <span className="text-sm font-mono text-red-600">{formatPoundsPence(ex.amountExceedingExemption)}</span>
          </div>
        )}
        <div className="flex justify-between py-1 border-t-2 border-gray-900 mt-1">
          <span className="text-sm font-bold text-gray-900">Total termination award</span>
          <span className="text-sm font-bold font-mono text-gray-900">{formatPoundsPence(ex.totalTerminationAward)}</span>
        </div>
      </div>
    </div>
  );
}

/** Employer NIC panel */
function EmployerNICPanel({
  output,
  showTooltips,
  hints,
}: {
  output: PENPOutput;
  showTooltips: boolean;
  hints?: string[];
}) {
  const [expanded, setExpanded] = useState(false);
  const { employerNIC: nic } = output;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="text-xs text-red-600 mb-1">Class 1 NIC</div>
          <div className="text-lg font-bold text-red-700">{formatPoundsPence(nic.class1NICAmount)}</div>
          <div className="text-xs text-red-500">{formatPercent(nic.class1NICRate)} on {formatPounds(nic.class1NICBase)}</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="text-xs text-amber-600 mb-1">Class 1A NIC</div>
          <div className="text-lg font-bold text-amber-700">{formatPoundsPence(nic.class1ANICAmount)}</div>
          <div className="text-xs text-amber-500">{formatPercent(nic.class1ANICRate)} on {formatPounds(nic.class1ANICBase)}</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-xs text-blue-600 mb-1">Total Employer NIC</div>
          <div className="text-lg font-bold text-blue-700">{formatPoundsPence(nic.totalEmployerNIC)}</div>
          <div className="text-xs text-blue-500">{getTaxYearDisplayName(nic.taxYear)}</div>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between py-0.5">
          <span className="text-sm text-gray-600">Class 1 base: PENP + PILON + restrictive covenant</span>
          <span className="text-sm font-mono text-gray-900">{formatPoundsPence(nic.class1NICBase)}</span>
        </div>
        <div className="flex justify-between py-0.5">
          <span className="text-sm text-gray-600">Class 1A base: excess over {'\u00A3'}30,000</span>
          <span className="text-sm font-mono text-gray-900">{formatPoundsPence(nic.class1ANICBase)}</span>
        </div>
      </div>

      {(showTooltips || hints) && (
        <button
          className="text-xs text-blue-500 hover:text-blue-700"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Hide notes' : 'Show notes'}
        </button>
      )}

      {expanded && (
        <div className="space-y-2">
          {showTooltips && (
            <p className="text-xs text-gray-500 italic leading-relaxed">
              Class 1 NIC applies to earnings elements (PENP, contractual PILON, restrictive covenant) as these are treated as employment earnings. Class 1A NIC applies to the termination payment exceeding {'\u00A3'}30,000. No employee NIC applies to termination payments — even on amounts exceeding {'\u00A3'}30,000.
            </p>
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
  );
}

/** Redundancy cross-check panel */
function RedundancyCrossCheckPanel({
  output,
  showTooltips,
  hints,
  onView,
}: {
  output: PENPOutput;
  showTooltips: boolean;
  hints?: string[];
  onView?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const crossCheck = output.redundancyCrossCheck;
  if (!crossCheck) return null;

  const handleExpand = () => {
    if (!expanded && onView) onView();
    setExpanded(!expanded);
  };

  const matchStatus = crossCheck.difference === 0
    ? { label: 'EXACT MATCH', color: 'text-green-700 bg-green-50 border-green-200' }
    : Math.abs(crossCheck.difference) <= 100
    ? { label: 'CLOSE MATCH', color: 'text-amber-700 bg-amber-50 border-amber-200' }
    : { label: 'DIFFERENCE NOTED', color: 'text-red-700 bg-red-50 border-red-200' };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="text-xs text-gray-600 mb-1">Calculated</div>
          <div className="text-lg font-bold text-gray-700">{formatPoundsPence(crossCheck.calculatedAmount)}</div>
          <div className="text-xs text-gray-500">{crossCheck.totalWeeks} weeks @ {formatPounds(crossCheck.cappedWeeklyPay)}</div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="text-xs text-gray-600 mb-1">Entered</div>
          <div className="text-lg font-bold text-gray-700">{formatPoundsPence(crossCheck.enteredAmount)}</div>
        </div>
        <div className={`border rounded-lg p-3 ${matchStatus.color}`}>
          <div className="text-xs mb-1">{matchStatus.label}</div>
          <div className="text-lg font-bold">{formatPoundsPence(crossCheck.difference)}</div>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between py-0.5">
          <span className="text-sm text-gray-600">Age at termination</span>
          <span className="text-sm font-mono text-gray-900">{crossCheck.ageAtTermination}</span>
        </div>
        <div className="flex justify-between py-0.5">
          <span className="text-sm text-gray-600">Complete years of service (max 20)</span>
          <span className="text-sm font-mono text-gray-900">{crossCheck.completeYearsOfService}</span>
        </div>
        <div className="flex justify-between py-0.5">
          <span className="text-sm text-gray-600">Total weeks&apos; pay entitlement</span>
          <span className="text-sm font-mono text-gray-900">{crossCheck.totalWeeks}</span>
        </div>
        <div className="flex justify-between py-0.5">
          <span className="text-sm text-gray-600">Capped weekly pay</span>
          <span className="text-sm font-mono text-gray-900">{formatPoundsPence(crossCheck.cappedWeeklyPay)}</span>
        </div>
      </div>

      {/* Year-by-year breakdown toggle */}
      <button
        className="text-xs text-blue-500 hover:text-blue-700"
        onClick={handleExpand}
      >
        {expanded ? 'Hide year-by-year breakdown' : 'Show year-by-year breakdown'}
      </button>

      {expanded && (
        <div className="space-y-2">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-1 text-left text-gray-500 font-medium">Year</th>
                <th className="py-1 text-left text-gray-500 font-medium">Age at Start</th>
                <th className="py-1 text-left text-gray-500 font-medium">Age Band</th>
                <th className="py-1 text-right text-gray-500 font-medium">Weeks</th>
              </tr>
            </thead>
            <tbody>
              {crossCheck.breakdown.map((entry) => (
                <tr key={entry.year} className="border-b border-gray-100">
                  <td className="py-1 font-mono text-gray-900">{entry.year}</td>
                  <td className="py-1 font-mono text-gray-900">{entry.ageAtStart}</td>
                  <td className="py-1 text-gray-600">
                    {entry.ageAtStart >= 41 ? '41+ (1.5 weeks)' : entry.ageAtStart >= 22 ? '22-40 (1 week)' : 'Under 22 (0.5 weeks)'}
                  </td>
                  <td className="py-1 text-right font-mono text-gray-900">{entry.multiplier}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-900">
                <td colSpan={3} className="py-1 font-bold text-gray-900">Total</td>
                <td className="py-1 text-right font-mono font-bold text-gray-900">{crossCheck.totalWeeks}</td>
              </tr>
            </tfoot>
          </table>

          {showTooltips && (
            <p className="text-xs text-gray-500 italic leading-relaxed">
              Statutory redundancy is calculated from the most recent complete years of service (max 20). Each year earns 0.5 weeks (under 22), 1 week (22-40), or 1.5 weeks (41+) of capped weekly pay. The statutory amount is completely exempt from income tax and NIC under s.309 ITEPA 2003 — it does NOT count against the {'\u00A3'}30,000 exemption.
            </p>
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
              <span>Expected PENP: {formatPounds(scenario.expectedPENP)}</span>
              <span>Employer NIC: {formatPounds(scenario.expectedEmployerNIC)}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function PenpCalculator({
  config,
  callbacks,
  showTooltips: showTooltipsProp,
  className,
}: PenpCalculatorProps) {
  const showTooltips = showTooltipsProp ?? config.showTooltips;

  // ─── State ─────────────────────────────────────────────────────────────────
  const [inputs, setInputs] = useState<PENPInputs>(createEmptyInputs());
  const [output, setOutput] = useState<PENPOutput | null>(null);
  const [attemptNumber, setAttemptNumber] = useState(0);
  const [showScenarios, setShowScenarios] = useState(false);
  const [showRedundancyCrossCheck, setShowRedundancyCrossCheck] = useState(config.showRedundancyCrossCheck);
  const [activeScenario, setActiveScenario] = useState<HCScenario | null>(null);

  // ─── Employee handlers ──────────────────────────────────────────────────────
  const updateEmployee = useCallback((field: keyof PENPInputs['employee'], value: string) => {
    setInputs((prev) => ({
      ...prev,
      employee: { ...prev.employee, [field]: value },
    }));
    setOutput(null);
    callbacks?.onInputChange?.({ field: `employee.${field}`, value, timestamp: Date.now() });
  }, [callbacks]);

  // ─── Pay handlers ──────────────────────────────────────────────────────────
  const updateBasicPay = useCallback((value: number) => {
    setInputs((prev) => ({
      ...prev,
      pay: { ...prev.pay, basicPay: value },
    }));
    setOutput(null);
    callbacks?.onInputChange?.({ field: 'pay.basicPay', value, timestamp: Date.now() });
  }, [callbacks]);

  const updatePayPeriodType = useCallback((value: PayPeriodType) => {
    const days = getPayPeriodDays(value, 0);
    setInputs((prev) => ({
      ...prev,
      pay: { ...prev.pay, payPeriodType: value, payPeriodDays: value === 'custom' ? prev.pay.payPeriodDays : days },
    }));
    setOutput(null);
    callbacks?.onInputChange?.({ field: 'pay.payPeriodType', value, timestamp: Date.now() });
  }, [callbacks]);

  const updatePayPeriodDays = useCallback((value: number) => {
    setInputs((prev) => ({
      ...prev,
      pay: { ...prev.pay, payPeriodDays: value },
    }));
    setOutput(null);
  }, []);

  // ─── Notice handlers ───────────────────────────────────────────────────────
  const updateNotice = useCallback((field: keyof PENPInputs['notice'], value: number | boolean) => {
    setInputs((prev) => ({
      ...prev,
      notice: { ...prev.notice, [field]: value },
    }));
    setOutput(null);
    callbacks?.onInputChange?.({ field: `notice.${field}`, value, timestamp: Date.now() });
  }, [callbacks]);

  // ─── Components handlers ───────────────────────────────────────────────────
  const updateComponents = useCallback((field: keyof PENPInputs['components'], value: number) => {
    setInputs((prev) => ({
      ...prev,
      components: { ...prev.components, [field]: value },
    }));
    setOutput(null);
    callbacks?.onInputChange?.({ field: `components.${field}`, value, timestamp: Date.now() });
  }, [callbacks]);

  // ─── Redundancy handlers ───────────────────────────────────────────────────
  const updateRedundancy = useCallback((field: keyof PENPInputs['redundancy'], value: number | boolean) => {
    setInputs((prev) => ({
      ...prev,
      redundancy: { ...prev.redundancy, [field]: value },
    }));
    setOutput(null);
    callbacks?.onInputChange?.({ field: `redundancy.${field}`, value, timestamp: Date.now() });
  }, [callbacks]);

  // ─── Compute handler ──────────────────────────────────────────────────────
  const handleCompute = useCallback(() => {
    const result = analysePENP(inputs);
    const attempt = attemptNumber + 1;
    setOutput(result);
    setAttemptNumber(attempt);

    callbacks?.onCompute?.({
      penpAmount: result.penpCalculation.penpAmount,
      totalPackage: result.summary.grossTerminationPackage,
      employerNIC: result.summary.totalEmployerNIC,
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

  // ─── Exemption view handler ────────────────────────────────────────────────
  const handleExemptionView = useCallback(() => {
    if (output) {
      callbacks?.onExemptionView?.({
        withinExemption: output.exemptionCalculation.amountWithinExemption,
        exceeding: output.exemptionCalculation.amountExceedingExemption,
        timestamp: Date.now(),
      });
    }
  }, [output, callbacks]);

  // ─── Redundancy check view handler ────────────────────────────────────────
  const handleRedundancyView = useCallback(() => {
    if (output?.redundancyCrossCheck) {
      callbacks?.onRedundancyCheck?.({
        calculated: output.redundancyCrossCheck.calculatedAmount,
        entered: output.redundancyCrossCheck.enteredAmount,
        difference: output.redundancyCrossCheck.difference,
        timestamp: Date.now(),
      });
    }
  }, [output, callbacks]);

  // ─── Derived ──────────────────────────────────────────────────────────────
  const canCompute =
    inputs.employee.terminationDate !== '' &&
    inputs.employee.employmentStartDate !== '' &&
    inputs.pay.basicPay > 0 &&
    inputs.notice.contractualNoticeDays > 0;

  const hasErrors = (output?.validationSummary.errors ?? 0) > 0;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={`max-w-5xl mx-auto ${className ?? ''}`}>
      {/* Tool header */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Termination Payment Analyser</h2>
            <p className="text-sm text-gray-500">PENP Calculator — ((BP &times; D) / P) &minus; T</p>
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

      {/* Section 1: Employee Details */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-1">
          Employee Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employee Name</label>
            <input
              type="text"
              value={inputs.employee.employeeName}
              onChange={(e) => updateEmployee('employeeName', e.target.value)}
              placeholder="e.g. Dave Reynolds"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
            />
            <Tooltip text="For display purposes only — not used in any calculation." visible={showTooltips} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
            <input
              type="date"
              value={inputs.employee.dateOfBirth}
              onChange={(e) => updateEmployee('dateOfBirth', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
            />
            <Tooltip text="Used for the statutory redundancy cross-check. Age determines the multiplier: 0.5 weeks (under 22), 1 week (22-40), or 1.5 weeks (41+) per year of service." visible={showTooltips} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employment Start Date</label>
            <input
              type="date"
              value={inputs.employee.employmentStartDate}
              onChange={(e) => updateEmployee('employmentStartDate', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
            />
            <Tooltip text="Date continuous employment began. Used to calculate complete years of service for statutory redundancy (max 20 years)." visible={showTooltips} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Termination Date</label>
            <input
              type="date"
              value={inputs.employee.terminationDate}
              onChange={(e) => updateEmployee('terminationDate', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
            />
            <Tooltip text="Last day of employment. Determines the tax year (for employer NIC rates) and the end date for calculating years of service." visible={showTooltips} />
          </div>
        </div>
      </div>

      {/* Section 2: Pay Details */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-1">
          Pay Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NumericField
            label="Basic Pay per Period (BP)"
            value={inputs.pay.basicPay}
            onChange={updateBasicPay}
            prefix="£"
            showTooltips={showTooltips}
            tooltip="Basic pay for one pay period BEFORE the termination. This is BP in the PENP formula. Excludes bonuses, overtime, commission, benefits in kind, and employer pension contributions."
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pay Period Type (P)</label>
            <select
              value={inputs.pay.payPeriodType}
              onChange={(e) => updatePayPeriodType(e.target.value as PayPeriodType)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="monthly">Monthly (30.42 days)</option>
              <option value="weekly">Weekly (7 days)</option>
              <option value="fortnightly">Fortnightly (14 days)</option>
              <option value="four-weekly">Four-weekly (28 days)</option>
              <option value="annual">Annual (365 days)</option>
              <option value="custom">Custom</option>
            </select>
            <Tooltip text="The pay period determines P in the PENP formula. Monthly employees use 30.42 days (365/12). This is the statutory definition — do not use 28, 30, or 31." visible={showTooltips} />
          </div>
          {inputs.pay.payPeriodType === 'custom' && (
            <NumericField
              label="Custom Pay Period Days"
              value={inputs.pay.payPeriodDays}
              onChange={updatePayPeriodDays}
              suffix="days"
              showTooltips={showTooltips}
              tooltip="Enter the number of calendar days in the custom pay period."
              step={0.01}
            />
          )}
          {inputs.pay.payPeriodType !== 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pay Period Days</label>
              <div className="w-full border border-gray-200 bg-gray-50 rounded-md px-3 py-2 text-sm text-gray-600 font-mono">
                {getPayPeriodDays(inputs.pay.payPeriodType, inputs.pay.payPeriodDays)} days
              </div>
              <Tooltip text={`Auto-calculated: ${getPayPeriodTypeName(inputs.pay.payPeriodType)}`} visible={showTooltips} />
            </div>
          )}
        </div>
      </div>

      {/* Section 3: Notice Details */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-1">
          Notice Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NumericField
            label="Contractual Notice Period"
            value={inputs.notice.contractualNoticeDays}
            onChange={(val) => updateNotice('contractualNoticeDays', val)}
            suffix="days"
            showTooltips={showTooltips}
            tooltip="The notice period specified in the employment contract. Use calendar days, not working days. For example, 3 months = 91 days (3 × 30.42, rounded). If the statutory minimum exceeds the contractual period, use the statutory minimum."
          />
          <NumericField
            label="Notice Actually Served"
            value={inputs.notice.noticeServedDays}
            onChange={(val) => updateNotice('noticeServedDays', val)}
            suffix="days"
            showTooltips={showTooltips}
            tooltip="Calendar days the employee actually worked during the notice period. D (unserved days) = contractual notice minus notice served. If all notice is served, PENP is zero — the most tax-efficient outcome."
            max={inputs.notice.contractualNoticeDays || undefined}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contractual PILON Clause?</label>
            <select
              value={inputs.notice.hasContractualPILON ? 'true' : 'false'}
              onChange={(e) => updateNotice('hasContractualPILON', e.target.value === 'true')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="false">No — no PILON clause in the contract</option>
              <option value="true">Yes — contract contains a PILON clause</option>
            </select>
            <Tooltip text="A contractual PILON is a clause in the employment contract that allows the employer to make a payment in lieu of notice. If present, the PILON payment is taxable as employment earnings under s.62 ITEPA 2003 (not part of the £30,000 exemption). The contractual PILON amount is also included in T when calculating PENP." visible={showTooltips} />
          </div>
          {inputs.notice.hasContractualPILON && (
            <NumericField
              label="Contractual PILON Amount"
              value={inputs.notice.contractualPILONAmount}
              onChange={(val) => updateNotice('contractualPILONAmount', val)}
              prefix="£"
              showTooltips={showTooltips}
              tooltip="The amount paid under the contractual PILON clause. This is included in T (prior taxable payments) for the PENP formula, reducing the PENP amount. The PILON itself is separately taxable as earnings."
            />
          )}
        </div>

        {/* Unserved notice summary */}
        {inputs.notice.contractualNoticeDays > 0 && (
          <div className="mt-3 bg-gray-50 rounded-md p-3">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-600">
                Unserved notice (D): <span className="font-mono font-medium text-gray-900">
                  {Math.max(0, inputs.notice.contractualNoticeDays - inputs.notice.noticeServedDays)} days
                </span>
              </span>
              {inputs.notice.contractualNoticeDays === inputs.notice.noticeServedDays && (
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">
                  All notice served — PENP will be zero
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Section 4: Termination Payment Components */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-1">
          Termination Payment Components
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NumericField
            label="Prior Taxable Termination Payments (T)"
            value={inputs.components.priorTaxableTerminationPayments}
            onChange={(val) => updateComponents('priorTaxableTerminationPayments', val)}
            prefix="£"
            showTooltips={showTooltips}
            tooltip="Other taxable termination payments already made (excluding contractual PILON, which is entered separately). These are deducted from the PENP formula as part of T. Usually zero unless the employer has made separate prior termination payments."
          />
          <NumericField
            label="Statutory Redundancy"
            value={inputs.components.statutoryRedundancyAmount}
            onChange={(val) => updateComponents('statutoryRedundancyAmount', val)}
            prefix="£"
            showTooltips={showTooltips}
            tooltip="Statutory redundancy payment under ERA 1996. Completely exempt from income tax and NIC under s.309 ITEPA 2003. Does NOT count against the £30,000 exemption — this is a key exam point."
          />
          <NumericField
            label="Restrictive Covenant Payment"
            value={inputs.components.restrictiveCovenantAmount}
            onChange={(val) => updateComponents('restrictiveCovenantAmount', val)}
            prefix="£"
            showTooltips={showTooltips}
            tooltip="Payment for non-compete, non-solicitation, or other post-termination restrictive covenants. Since 6 April 2020, ALL restrictive covenant payments are taxable as earnings (s.225A ITEPA 2003). This is a key recent legislative change."
          />
          <NumericField
            label="Ex Gratia / Goodwill Payment"
            value={inputs.components.exGratiaAmount}
            onChange={(val) => updateComponents('exGratiaAmount', val)}
            prefix="£"
            showTooltips={showTooltips}
            tooltip="Discretionary goodwill or loyalty payment on termination. This is the only element tested against the £30,000 exemption (s.403 ITEPA 2003). The first £30,000 is exempt from income tax. Any excess is taxable and attracts employer Class 1A NIC. No employee NIC applies."
          />
        </div>
      </div>

      {/* Section 5: Redundancy Settings */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-1">
          Redundancy Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Genuine Redundancy?</label>
            <select
              value={inputs.redundancy.isRedundancy ? 'true' : 'false'}
              onChange={(e) => updateRedundancy('isRedundancy', e.target.value === 'true')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="true">Yes — genuine redundancy</option>
              <option value="false">No — dismissal for other reasons</option>
            </select>
            <Tooltip text="If this is a genuine redundancy, the statutory redundancy cross-check panel will verify the statutory entitlement against the amount entered. If not a redundancy, the cross-check is hidden." visible={showTooltips} />
          </div>
          {inputs.redundancy.isRedundancy && (
            <NumericField
              label="Capped Weekly Pay"
              value={inputs.redundancy.cappedWeeklyPay}
              onChange={(val) => updateRedundancy('cappedWeeklyPay', val)}
              prefix="£"
              showTooltips={showTooltips}
              tooltip="The statutory cap on a week's pay for redundancy calculation purposes. For 2025/26, the cap is £643. This is set by the Secretary of State and increases annually."
            />
          )}
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
            Analyse Termination Payment
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

          {/* PENP summary banner */}
          <div className="bg-blue-700 text-white rounded-lg p-6">
            <div className="text-center">
              <div className="text-xs uppercase text-white text-opacity-70 mb-1">Post-Employment Notice Pay</div>
              <div className="text-3xl font-bold mb-2">{formatPoundsPence(output.penpCalculation.penpAmount)}</div>
              <p className="text-sm text-white text-opacity-90 max-w-xl mx-auto">
                {output.penpCalculation.penpAmount > 0
                  ? `${output.penpCalculation.unservedNoticeDays} days of unserved notice reclassified as taxable earnings under s.402D ITEPA 2003`
                  : 'All contractual notice was served — no earnings reclassification applies'}
              </p>
              <div className="mt-3 text-xs text-white text-opacity-60">
                Tax year: {getTaxYearDisplayName(output.employerNIC.taxYear)} | Employer NIC rate: {formatPercent(output.employerNIC.class1NICRate)}
              </div>
            </div>
          </div>

          {/* PENP formula breakdown */}
          {!hasErrors && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-1">
                PENP Calculation — ((BP &times; D) / P) &minus; T
              </h3>
              <PENPFormulaDisplay output={output} />
            </div>
          )}

          {/* Component classification */}
          {!hasErrors && output.classifiedComponents.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-1">
                Component Classification
              </h3>
              <div className="space-y-2">
                {output.classifiedComponents.map((component) => (
                  <ComponentCard
                    key={component.id}
                    component={component}
                    showTooltips={showTooltips}
                    hints={activeScenario?.hints[component.id]}
                  />
                ))}
              </div>
            </div>
          )}

          {/* £30,000 exemption */}
          {!hasErrors && (
            <div className="bg-white border border-gray-200 rounded-lg p-4" onClick={handleExemptionView}>
              <h3 className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-1">
                {'\u00A3'}30,000 Exemption — s.403 ITEPA 2003
              </h3>
              <ExemptionBreakdown output={output} />
            </div>
          )}

          {/* Employer NIC */}
          {!hasErrors && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-1">
                Employer NIC — {getTaxYearDisplayName(output.employerNIC.taxYear)}
              </h3>
              <EmployerNICPanel
                output={output}
                showTooltips={showTooltips}
                hints={activeScenario?.hints['employer-nic']}
              />
            </div>
          )}

          {/* Redundancy cross-check */}
          {!hasErrors && output.redundancyCrossCheck && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3 border-b border-gray-200 pb-1">
                <h3 className="text-sm font-bold text-gray-700">Statutory Redundancy Cross-Check</h3>
                <button
                  className="text-xs text-blue-600 hover:text-blue-800"
                  onClick={() => setShowRedundancyCrossCheck(!showRedundancyCrossCheck)}
                >
                  {showRedundancyCrossCheck ? 'Hide' : 'Show'}
                </button>
              </div>
              {showRedundancyCrossCheck && (
                <RedundancyCrossCheckPanel
                  output={output}
                  showTooltips={showTooltips}
                  hints={activeScenario?.hints['statutory-redundancy']}
                  onView={handleRedundancyView}
                />
              )}
            </div>
          )}

          {/* Summary totals */}
          {!hasErrors && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-1">
                Summary
              </h3>
              <div className="space-y-1">
                <div className="flex justify-between py-0.5">
                  <span className="text-sm text-gray-600">Gross termination package</span>
                  <span className="text-sm font-mono text-gray-900">{formatPoundsPence(output.summary.grossTerminationPackage)}</span>
                </div>
                <div className="flex justify-between py-0.5 pl-4">
                  <span className="text-sm text-red-600">Taxable as earnings (PENP + PILON + RC)</span>
                  <span className="text-sm font-mono text-red-600">{formatPoundsPence(output.summary.totalTaxableAsEarnings)}</span>
                </div>
                <div className="flex justify-between py-0.5 pl-4">
                  <span className="text-sm text-green-600">Exempt (statutory redundancy)</span>
                  <span className="text-sm font-mono text-green-600">{formatPoundsPence(output.summary.totalExempt)}</span>
                </div>
                <div className="flex justify-between py-0.5 pl-4">
                  <span className="text-sm text-green-600">Within {'\u00A3'}30,000 exemption</span>
                  <span className="text-sm font-mono text-green-600">{formatPoundsPence(output.summary.totalWithinThirtyThousand)}</span>
                </div>
                {output.summary.totalTaxableAboveThirtyThousand > 0 && (
                  <div className="flex justify-between py-0.5 pl-4">
                    <span className="text-sm text-red-600">Exceeding {'\u00A3'}30,000 (taxable + Class 1A)</span>
                    <span className="text-sm font-mono text-red-600">{formatPoundsPence(output.summary.totalTaxableAboveThirtyThousand)}</span>
                  </div>
                )}
                <div className="flex justify-between py-0.5 border-t border-gray-200 pt-1">
                  <span className="text-sm font-medium text-gray-900">Total employer NIC</span>
                  <span className="text-sm font-mono font-medium text-gray-900">{formatPoundsPence(output.summary.totalEmployerNIC)}</span>
                </div>
                <div className="flex justify-between py-1 border-t-2 border-gray-900 mt-1">
                  <span className="text-sm font-bold text-gray-900">Total cost to employer</span>
                  <span className="text-sm font-bold font-mono text-gray-900">{formatPoundsPence(output.summary.totalCostToEmployer)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PenpCalculator;
