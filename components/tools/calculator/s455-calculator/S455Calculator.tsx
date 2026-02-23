/**
 * s.455 Loans to Participators Calculator — React Component
 *
 * Computes the s.455 CTA 2010 tax charge on loans to participators
 * in close companies, applies the s.464C bed-and-breakfast rule,
 * tracks DLA balance movements, computes key compliance dates,
 * and analyses write-off consequences.
 *
 * Features: DLA balance tracker, s.464C matching cards, dated
 * repayment/re-borrowing rows, write-off comparison, compliance
 * timeline, H&C scenario loader, and MojiTax platform callbacks.
 */

'use client';

import React, { useState, useCallback } from 'react';
import type {
  TaxBand,
  S455CalculatorProps,
  S455Inputs,
  S455Output,
  ValidationResult,
  Repayment,
  Reborrowing,
  HCScenario,
  TimelineEvent,
  BedAndBreakfastMatch,
} from './types';
import {
  computeS455,
  createEmptyInputs,
  scenarioToInputs,
  generateId,
  formatCurrency,
  formatPounds,
  formatPoundsPence,
  formatPercent,
  formatPercentWhole,
  formatDate,
  formatDateShort,
  S455_RATE,
  OFFICIAL_RATE,
  BED_AND_BREAKFAST_DAYS,
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

/** Repayment row — date, amount, description with remove button */
function RepaymentRow({
  repayment,
  onChange,
  onRemove,
}: {
  repayment: Repayment;
  onChange: (updated: Repayment) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-end gap-2">
      <div className="flex-1">
        <label className="block text-xs font-medium text-gray-500 mb-0.5">Date</label>
        <input
          type="date"
          value={repayment.date}
          onChange={(e) => onChange({ ...repayment, date: e.target.value })}
          className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div className="w-32">
        <label className="block text-xs font-medium text-gray-500 mb-0.5">Amount</label>
        <div className="relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">£</span>
          <input
            type="number"
            value={repayment.amount || ''}
            onChange={(e) => onChange({ ...repayment, amount: parseFloat(e.target.value) || 0 })}
            min={0}
            className="w-full border border-gray-300 rounded-md pl-5 pr-2 py-1.5 text-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      <div className="flex-1">
        <label className="block text-xs font-medium text-gray-500 mb-0.5">Description</label>
        <input
          type="text"
          value={repayment.description}
          onChange={(e) => onChange({ ...repayment, description: e.target.value })}
          placeholder="e.g. Bank transfer"
          className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <button
        className="px-2 py-1.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
        onClick={onRemove}
        title="Remove repayment"
      >
        Remove
      </button>
    </div>
  );
}

/** Re-borrowing row — date, amount, description with remove button */
function ReborrowingRow({
  reborrowing,
  onChange,
  onRemove,
}: {
  reborrowing: Reborrowing;
  onChange: (updated: Reborrowing) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-end gap-2">
      <div className="flex-1">
        <label className="block text-xs font-medium text-gray-500 mb-0.5">Date</label>
        <input
          type="date"
          value={reborrowing.date}
          onChange={(e) => onChange({ ...reborrowing, date: e.target.value })}
          className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div className="w-32">
        <label className="block text-xs font-medium text-gray-500 mb-0.5">Amount</label>
        <div className="relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">£</span>
          <input
            type="number"
            value={reborrowing.amount || ''}
            onChange={(e) => onChange({ ...reborrowing, amount: parseFloat(e.target.value) || 0 })}
            min={0}
            className="w-full border border-gray-300 rounded-md pl-5 pr-2 py-1.5 text-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      <div className="flex-1">
        <label className="block text-xs font-medium text-gray-500 mb-0.5">Description</label>
        <input
          type="text"
          value={reborrowing.description}
          onChange={(e) => onChange({ ...reborrowing, description: e.target.value })}
          placeholder="e.g. Cash withdrawal"
          className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <button
        className="px-2 py-1.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
        onClick={onRemove}
        title="Remove re-borrowing"
      >
        Remove
      </button>
    </div>
  );
}

/** DLA balance summary table */
function BalanceSummaryTable({ output }: { output: S455Output }) {
  const { balanceTracker: bt } = output;

  const row = (
    label: string,
    value: number,
    opts?: { bold?: boolean; deduction?: boolean; border?: boolean; highlight?: boolean }
  ) => (
    <div className={`flex justify-between py-0.5 ${opts?.border ? 'border-t border-gray-200 pt-1 mt-1' : ''}`}>
      <span className={`text-sm ${opts?.bold ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
        {label}
      </span>
      <span
        className={`text-sm font-mono ${opts?.bold ? 'font-medium' : ''} ${opts?.deduction ? 'text-red-600' : opts?.highlight ? 'text-amber-700' : 'text-gray-900'}`}
      >
        {opts?.deduction
          ? `(${formatCurrency(Math.abs(value))})`
          : formatPounds(value)}
      </span>
    </div>
  );

  return (
    <div className="space-y-1">
      {row('Opening overdrawn balance', bt.openingBalance, { bold: true })}
      {row('Add: Debits (drawings, personal expenses)', bt.totalDebits)}
      {row('Less: Credits (salary, dividends, other)', bt.totalCredits, { deduction: true })}
      {bt.totalRepayments > 0 && row('Less: Dated repayments', bt.totalRepayments, { deduction: true })}
      {row('Raw closing balance', bt.closingBalanceRaw, { bold: true, border: true })}

      {bt.totalDisregarded > 0 && (
        <>
          <div className="border-t border-amber-300 pt-2 mt-2" />
          {row(`Add back: s.464C disregarded repayments`, bt.totalDisregarded, { highlight: true })}
        </>
      )}

      <div className="border-t-2 border-gray-900 pt-2 mt-2">
        <div className="flex justify-between">
          <span className="text-sm font-bold text-gray-900">Adjusted closing balance (s.455 charge base)</span>
          <span className="text-sm font-bold font-mono text-gray-900">
            {formatPounds(bt.closingBalanceAdjusted)}
          </span>
        </div>
      </div>
    </div>
  );
}

/** Bed-and-breakfast match card */
function BedAndBreakfastCard({ match }: { match: BedAndBreakfastMatch }) {
  return (
    <div className="border border-amber-200 bg-amber-50 rounded-lg p-3">
      <div className="flex items-start gap-3">
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex-shrink-0 mt-0.5">
          !
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-amber-900 mb-1">
            Repayment on {formatDate(match.repayment.date)} — {formatPounds(match.repayment.amount)}
          </div>
          <p className="text-xs text-amber-700">{match.repayment.description}</p>
          <div className="mt-2 space-y-1">
            {match.reborrowings.map((rb, i) => (
              <div key={i} className="text-xs text-amber-600">
                Re-borrowing: {formatDate(rb.date)} — {formatPounds(rb.amount)}
                {rb.description && ` (${rb.description})`}
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-4 text-xs">
            <span className="text-amber-600">
              Gap: <span className="font-medium">{match.daysBetween} days</span> (within {BED_AND_BREAKFAST_DAYS}-day window)
            </span>
            <span className="text-amber-800 font-medium">
              Disregarded: {formatPounds(match.disregardedAmount)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** s.455 computation table */
function S455ComputationTable({ output }: { output: S455Output }) {
  const { s455Computation: comp } = output;

  return (
    <div className="space-y-2">
      <div className="flex justify-between py-0.5">
        <span className="text-sm text-gray-600">Adjusted closing balance (chargeable amount)</span>
        <span className="text-sm font-mono text-gray-900">{formatPounds(comp.chargeableAmount)}</span>
      </div>
      <div className="flex justify-between py-0.5">
        <span className="text-sm text-gray-600">s.455 rate</span>
        <span className="text-sm font-mono text-gray-900">{formatPercent(comp.s455Rate)}</span>
      </div>

      <div className="border-t-2 border-gray-900 pt-2 mt-2">
        <div className="flex justify-between">
          <span className="text-sm font-bold text-gray-900">s.455 Tax Liability</span>
          <span className="text-sm font-bold font-mono text-gray-900">{formatPoundsPence(comp.s455Tax)}</span>
        </div>
      </div>

      {comp.s464CDifference !== 0 && (
        <div className="mt-3 bg-amber-50 border border-amber-200 rounded-md p-3">
          <div className="text-xs font-medium text-amber-800 mb-1">s.464C Impact</div>
          <div className="flex justify-between text-xs text-amber-700">
            <span>s.455 tax without s.464C</span>
            <span className="font-mono">{formatPoundsPence(comp.s455TaxWithoutS464C)}</span>
          </div>
          <div className="flex justify-between text-xs text-amber-700">
            <span>s.455 tax with s.464C</span>
            <span className="font-mono">{formatPoundsPence(comp.s455Tax)}</span>
          </div>
          <div className="flex justify-between text-xs text-amber-900 font-medium border-t border-amber-200 pt-1 mt-1">
            <span>Additional tax due to s.464C</span>
            <span className="font-mono">{formatPoundsPence(comp.s464CDifference)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/** Key dates summary */
function KeyDatesSummary({ output }: { output: S455Output }) {
  const { keyDates: kd } = output;

  const dateRow = (label: string, date: string, note: string, type?: 'deadline' | 'refund') => (
    <div className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
      <span
        className={`inline-flex items-center justify-center w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${
          type === 'deadline' ? 'bg-red-500' : type === 'refund' ? 'bg-green-500' : 'bg-gray-400'
        }`}
      />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between">
          <span className="text-sm text-gray-700">{label}</span>
          <span className="text-sm font-mono font-medium text-gray-900">{formatDate(date)}</span>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{note}</p>
      </div>
    </div>
  );

  return (
    <div>
      {dateRow('AP End Date', kd.apEndDate, 'Closing DLA balance determines s.455 charge.')}
      {dateRow(
        's.455 Tax Due Date',
        kd.s455DueDate,
        's.455 tax payable alongside CT — 9 months and 1 day after AP end.',
        'deadline'
      )}
      {dateRow(
        'CT Payment Deadline',
        kd.ctPaymentDeadline,
        'Corporation tax and s.455 tax both due on this date.',
        'deadline'
      )}
      {dateRow(
        'CT600 Filing Deadline',
        kd.ctFilingDeadline,
        '12 months after AP end. s.455 must be reported on CT600.',
        'deadline'
      )}
      {dateRow(
        'Earliest s.455 Refund Date',
        kd.earliestRefundDate,
        'If loan is repaid by end of the next AP, refund is claimable 9m+1d after that AP end.',
        'refund'
      )}
    </div>
  );
}

/** Write-off comparison table */
function WriteOffComparisonTable({ output }: { output: S455Output }) {
  const wa = output.writeOffAnalysis;
  if (!wa) return null;

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Option A: Write off */}
        <div className="border border-red-200 bg-red-50 rounded-lg p-3">
          <div className="text-xs font-bold text-red-700 mb-2 uppercase">Option A: Write Off</div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-red-600">Write-off amount</span>
              <span className="font-mono text-red-800">{formatPounds(wa.writeOffAmount)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-red-600">Deemed distribution tax ({formatPercent(wa.distributionRate)})</span>
              <span className="font-mono text-red-800">{formatPoundsPence(wa.distributionTax)}</span>
            </div>
            <div className="flex justify-between text-xs border-t border-red-200 pt-1 mt-1">
              <span className="text-red-700 font-medium">Cost to participator (permanent)</span>
              <span className="font-mono text-red-900 font-medium">{formatPoundsPence(wa.netCostToParticipator)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-red-600">s.455 relief to company</span>
              <span className="font-mono text-green-700">({formatPoundsPence(wa.s455Relief)})</span>
            </div>
            <div className="flex justify-between text-xs border-t border-red-200 pt-1 mt-1">
              <span className="text-red-700 font-medium">Net cost to company</span>
              <span className="font-mono text-red-900 font-medium">{formatPoundsPence(wa.netCostToCompany)}</span>
            </div>
          </div>
        </div>

        {/* Option B: Keep loan */}
        <div className="border border-green-200 bg-green-50 rounded-lg p-3">
          <div className="text-xs font-bold text-green-700 mb-2 uppercase">Option B: Keep Loan Outstanding</div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-green-600">Annual BIK ({formatPercent(OFFICIAL_RATE)} official rate)</span>
              <span className="font-mono text-green-800">{formatPoundsPence(wa.keepLoanBIK)}/yr</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-green-600">Income tax on BIK (participator)</span>
              <span className="font-mono text-green-800">{formatPoundsPence(wa.keepLoanBIKTax)}/yr</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-green-600">Employer Class 1A NIC (company)</span>
              <span className="font-mono text-green-800">{formatPoundsPence(wa.keepLoanEmployerNIC)}/yr</span>
            </div>
            <div className="flex justify-between text-xs border-t border-green-200 pt-1 mt-1">
              <span className="text-green-700 font-medium">Total annual cost</span>
              <span className="font-mono text-green-900 font-medium">
                {formatPoundsPence(wa.keepLoanBIKTax + wa.keepLoanEmployerNIC)}/yr
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-green-600">s.455 on this portion (refundable)</span>
              <span className="font-mono text-green-800">{formatPoundsPence(wa.keepLoanS455)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="text-xs font-bold text-blue-700 mb-1">{wa.recommendation}</div>
        <p className="text-xs text-blue-600 leading-relaxed">{wa.explanation}</p>
      </div>
    </div>
  );
}

/** Timeline event view */
function TimelineView({ events }: { events: TimelineEvent[] }) {
  const typeStyles: Record<string, { dot: string; label: string }> = {
    'period-start': { dot: 'bg-blue-500', label: 'AP Start' },
    'period-end': { dot: 'bg-blue-700', label: 'AP End' },
    repayment: { dot: 'bg-green-500', label: 'Repayment' },
    reborrowing: { dot: 'bg-red-500', label: 'Re-borrowing' },
    deadline: { dot: 'bg-amber-500', label: 'Deadline' },
    refund: { dot: 'bg-emerald-500', label: 'Refund' },
  };

  return (
    <div className="space-y-0">
      {events.map((event, i) => {
        const style = typeStyles[event.type] ?? { dot: 'bg-gray-400', label: event.type };
        return (
          <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
            <div className="flex flex-col items-center flex-shrink-0">
              <span className={`w-3 h-3 rounded-full ${style.dot}`} />
              {i < events.length - 1 && <div className="w-0.5 h-full bg-gray-200 flex-1 mt-1" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-mono text-gray-400">{formatDateShort(event.date)}</span>
                <span className="text-xs font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                  {style.label}
                </span>
              </div>
              <div className="text-sm text-gray-900">{event.label}</div>
              {event.amount !== undefined && (
                <span className="text-xs font-mono text-gray-500">{formatPounds(event.amount)}</span>
              )}
              {event.note && <p className="text-xs text-gray-500 mt-0.5">{event.note}</p>}
            </div>
          </div>
        );
      })}
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
              <span>Expected s.455: {formatPoundsPence(scenario.expectedS455Tax)}</span>
              <span>s.464C: {scenario.expectedBedAndBreakfast ? 'Yes' : 'No'}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function S455Calculator({
  config,
  callbacks,
  showTooltips: showTooltipsProp,
  className,
}: S455CalculatorProps) {
  const showTooltips = showTooltipsProp ?? config.showTooltips;

  // ─── State ─────────────────────────────────────────────────────────────────
  const [inputs, setInputs] = useState<S455Inputs>(createEmptyInputs());
  const [output, setOutput] = useState<S455Output | null>(null);
  const [attemptNumber, setAttemptNumber] = useState(0);
  const [showScenarios, setShowScenarios] = useState(false);
  const [showTimeline, setShowTimeline] = useState(config.showTimeline);
  const [activeScenario, setActiveScenario] = useState<HCScenario | null>(null);

  // ─── AP handlers ───────────────────────────────────────────────────────────
  const updateAPDate = useCallback(
    (field: 'startDate' | 'endDate', value: string) => {
      setInputs((prev) => ({
        ...prev,
        accountingPeriod: { ...prev.accountingPeriod, [field]: value },
      }));
      setOutput(null);
      if (field === 'endDate' || field === 'startDate') {
        const updated = field === 'startDate'
          ? { startDate: value, endDate: inputs.accountingPeriod.endDate }
          : { startDate: inputs.accountingPeriod.startDate, endDate: value };
        if (updated.startDate && updated.endDate) {
          callbacks?.onAPChange?.({
            startDate: updated.startDate,
            endDate: updated.endDate,
            timestamp: Date.now(),
          });
        }
      }
    },
    [inputs.accountingPeriod, callbacks]
  );

  // ─── Movement handlers ─────────────────────────────────────────────────────
  const updateMovement = useCallback(
    (field: keyof S455Inputs['movements'], value: number) => {
      setInputs((prev) => ({
        ...prev,
        movements: { ...prev.movements, [field]: value },
      }));
      setOutput(null);
    },
    []
  );

  // ─── Repayment handlers ────────────────────────────────────────────────────
  const addRepayment = useCallback(() => {
    setInputs((prev) => ({
      ...prev,
      repayments: [
        ...prev.repayments,
        { id: generateId(), date: '', amount: 0, description: '' },
      ],
    }));
    setOutput(null);
  }, []);

  const updateRepayment = useCallback((index: number, updated: Repayment) => {
    setInputs((prev) => ({
      ...prev,
      repayments: prev.repayments.map((r, i) => (i === index ? updated : r)),
    }));
    setOutput(null);
  }, []);

  const removeRepayment = useCallback((index: number) => {
    setInputs((prev) => ({
      ...prev,
      repayments: prev.repayments.filter((_, i) => i !== index),
    }));
    setOutput(null);
  }, []);

  // ─── Re-borrowing handlers ────────────────────────────────────────────────
  const addReborrowing = useCallback(() => {
    setInputs((prev) => ({
      ...prev,
      reborrowings: [
        ...prev.reborrowings,
        { id: generateId(), date: '', amount: 0, description: '' },
      ],
    }));
    setOutput(null);
  }, []);

  const updateReborrowing = useCallback((index: number, updated: Reborrowing) => {
    setInputs((prev) => ({
      ...prev,
      reborrowings: prev.reborrowings.map((r, i) => (i === index ? updated : r)),
    }));
    setOutput(null);
  }, []);

  const removeReborrowing = useCallback((index: number) => {
    setInputs((prev) => ({
      ...prev,
      reborrowings: prev.reborrowings.filter((_, i) => i !== index),
    }));
    setOutput(null);
  }, []);

  // ─── Write-off handlers ───────────────────────────────────────────────────
  const updateWriteOffEnabled = useCallback(
    (enabled: boolean) => {
      setInputs((prev) => ({
        ...prev,
        writeOff: { ...prev.writeOff, enabled },
      }));
      setOutput(null);
      callbacks?.onWriteOffToggle?.({
        enabled,
        amount: inputs.writeOff.amount,
        timestamp: Date.now(),
      });
    },
    [inputs.writeOff.amount, callbacks]
  );

  const updateWriteOff = useCallback(
    (field: keyof S455Inputs['writeOff'], value: number | boolean | TaxBand) => {
      setInputs((prev) => ({
        ...prev,
        writeOff: { ...prev.writeOff, [field]: value },
      }));
      setOutput(null);
    },
    []
  );

  // ─── Rate handlers ────────────────────────────────────────────────────────
  const updateRate = useCallback(
    (field: 's455Rate' | 'officialRate', value: number) => {
      setInputs((prev) => ({ ...prev, [field]: value }));
      setOutput(null);
    },
    []
  );

  // ─── Compute handler ──────────────────────────────────────────────────────
  const handleCompute = useCallback(() => {
    const result = computeS455(inputs);
    const attempt = attemptNumber + 1;
    setOutput(result);
    setAttemptNumber(attempt);

    callbacks?.onCompute?.({
      s455Tax: result.s455Computation.s455Tax,
      adjustedBalance: result.balanceTracker.closingBalanceAdjusted,
      bedAndBreakfastTriggered: result.bedAndBreakfast.triggered,
      attemptNumber: attempt,
      timestamp: Date.now(),
    });

    callbacks?.onValidation?.({
      errors: result.validationResults.filter((r) => r.severity === 'error' && !r.passed).map((r) => r.message),
      warnings: result.validationResults.filter((r) => r.severity === 'warning' && !r.passed).map((r) => r.message),
      timestamp: Date.now(),
    });

    if (result.bedAndBreakfast.triggered) {
      callbacks?.onBedAndBreakfastView?.({
        matches: result.bedAndBreakfast.matches.map((m) => ({
          repaymentDate: m.repayment.date,
          reborrowingDate: m.reborrowings[0]?.date ?? '',
          amount: m.disregardedAmount,
        })),
        totalDisregarded: result.bedAndBreakfast.totalDisregarded,
        timestamp: Date.now(),
      });
    }
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

  // ─── Timeline toggle handler ──────────────────────────────────────────────
  const handleToggleTimeline = useCallback(() => {
    const next = !showTimeline;
    setShowTimeline(next);
    if (next && output) {
      callbacks?.onTimelineView?.({
        eventCount: output.timeline.length,
        timestamp: Date.now(),
      });
    }
  }, [showTimeline, output, callbacks]);

  // ─── Derived ──────────────────────────────────────────────────────────────
  const canCompute =
    inputs.accountingPeriod.startDate !== '' &&
    inputs.accountingPeriod.endDate !== '';

  const hasErrors = (output?.validationSummary.errors ?? 0) > 0;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={`max-w-5xl mx-auto ${className ?? ''}`}>
      {/* Tool header */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">s.455 Loans to Participators Calculator</h2>
            <p className="text-sm text-gray-500">
              s.455 CTA 2010 — tax charge on close company loans to participators
            </p>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={inputs.accountingPeriod.startDate}
              onChange={(e) => updateAPDate('startDate', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
            />
            <Tooltip
              text="First day of the accounting period. For a typical year-end company, this is often 1 April or 1 January."
              visible={showTooltips}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={inputs.accountingPeriod.endDate}
              onChange={(e) => updateAPDate('endDate', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
            />
            <Tooltip
              text="Last day of the accounting period. The s.455 charge is based on the DLA balance at this date. Maximum AP length is 18 months."
              visible={showTooltips}
            />
          </div>
        </div>
      </div>

      {/* Section 2: DLA Movements */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-1">
          Director's Loan Account — Aggregated Movements
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NumericField
            label="Opening Overdrawn Balance (£)"
            value={inputs.movements.openingBalance}
            onChange={(val) => updateMovement('openingBalance', val)}
            prefix="£"
            showTooltips={showTooltips}
            tooltip="Opening overdrawn balance from the previous AP. Positive = participator owes the company. If the DLA is in credit (company owes the participator), enter 0."
          />
          <NumericField
            label="Total Credits (£)"
            value={inputs.movements.totalCredits}
            onChange={(val) => updateMovement('totalCredits', val)}
            prefix="£"
            showTooltips={showTooltips}
            tooltip="Credits that reduce the overdrawn balance: salary voted, dividends declared, expenses reimbursed. Exclude dated repayments — those go in the Repayments section below."
          />
          <NumericField
            label="Total Debits (£)"
            value={inputs.movements.totalDebits}
            onChange={(val) => updateMovement('totalDebits', val)}
            prefix="£"
            showTooltips={showTooltips}
            tooltip="Debits that increase the overdrawn balance: drawings, personal expenses paid by the company, personal use of company credit card."
          />
        </div>
      </div>

      {/* Section 3: Dated Repayments */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3 border-b border-gray-200 pb-1">
          <h3 className="text-sm font-bold text-gray-700">
            Dated Repayments
          </h3>
          <button
            className="px-3 py-1 text-xs font-medium rounded-md bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
            onClick={addRepayment}
          >
            + Add Repayment
          </button>
        </div>
        <Tooltip
          text="Enter specific dated repayments for s.464C matching. Each repayment will be checked against re-borrowings to detect bed-and-breakfast arrangements within the 30-day window."
          visible={showTooltips}
        />
        {inputs.repayments.length === 0 ? (
          <p className="text-xs text-gray-400 italic py-2">No dated repayments entered. Add a repayment to check for s.464C bed-and-breakfast arrangements.</p>
        ) : (
          <div className="space-y-2 mt-2">
            {inputs.repayments.map((r, i) => (
              <RepaymentRow
                key={r.id}
                repayment={r}
                onChange={(updated) => updateRepayment(i, updated)}
                onRemove={() => removeRepayment(i)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Section 4: Dated Re-borrowings */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3 border-b border-gray-200 pb-1">
          <h3 className="text-sm font-bold text-gray-700">
            Dated Re-borrowings
          </h3>
          <button
            className="px-3 py-1 text-xs font-medium rounded-md bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
            onClick={addReborrowing}
          >
            + Add Re-borrowing
          </button>
        </div>
        <Tooltip
          text="Enter dated re-borrowings for s.464C matching. Re-borrowings may be after the AP end — s.464C looks at the 30 calendar days following each repayment regardless of AP boundaries."
          visible={showTooltips}
        />
        {inputs.reborrowings.length === 0 ? (
          <p className="text-xs text-gray-400 italic py-2">No dated re-borrowings entered.</p>
        ) : (
          <div className="space-y-2 mt-2">
            {inputs.reborrowings.map((rb, i) => (
              <ReborrowingRow
                key={rb.id}
                reborrowing={rb}
                onChange={(updated) => updateReborrowing(i, updated)}
                onRemove={() => removeReborrowing(i)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Section 5: Write-Off Analysis Toggle */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3 border-b border-gray-200 pb-1">
          <h3 className="text-sm font-bold text-gray-700">Write-Off Analysis</h3>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={inputs.writeOff.enabled}
              onChange={(e) => updateWriteOffEnabled(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs text-gray-600">Enable write-off comparison</span>
          </label>
        </div>

        {inputs.writeOff.enabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <NumericField
              label="Write-Off Amount (£)"
              value={inputs.writeOff.amount}
              onChange={(val) => updateWriteOff('amount', val)}
              prefix="£"
              showTooltips={showTooltips}
              tooltip="Amount the company is considering writing off. A write-off is a deemed distribution (s.415 ITTOIA 2005) taxed at dividend rates on the participator. The company gets s.455 relief but loses the asset."
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Participator's Tax Band</label>
              <select
                value={inputs.writeOff.participatorTaxBand}
                onChange={(e) => updateWriteOff('participatorTaxBand', e.target.value as TaxBand)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="basic">Basic rate (8.75% dividend / 20% BIK)</option>
                <option value="higher">Higher rate (33.75% dividend / 40% BIK)</option>
                <option value="additional">Additional rate (39.35% dividend / 45% BIK)</option>
              </select>
              <Tooltip
                text="The participator's marginal tax band determines the dividend rate on the deemed distribution (write-off) and the income tax rate on the BIK (keep loan). Higher rate is most common for OMB directors."
                visible={showTooltips}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dividend Allowance Used?</label>
              <select
                value={inputs.writeOff.dividendAllowanceUsed ? 'true' : 'false'}
                onChange={(e) => updateWriteOff('dividendAllowanceUsed', e.target.value === 'true')}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="true">Yes — already used on other dividends</option>
                <option value="false">No — £500 allowance still available</option>
              </select>
              <Tooltip
                text="If the participator has already used their £500 dividend allowance on other dividends, the full write-off is taxed. Otherwise the first £500 is tax-free."
                visible={showTooltips}
              />
            </div>
          </div>
        )}
      </div>

      {/* Section 6: Rates (collapsible) */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-1">
          Tax Rates
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NumericField
            label="s.455 Tax Rate (%)"
            value={inputs.s455Rate * 100}
            onChange={(val) => updateRate('s455Rate', val / 100)}
            suffix="%"
            showTooltips={showTooltips}
            tooltip="The s.455 rate is 33.75% from 6 April 2022 (matching the higher rate of dividend tax). Previously 32.5% (2016-2022) and 25% (pre-2016)."
            step={0.25}
          />
          <NumericField
            label="Official Rate of Interest (%)"
            value={inputs.officialRate * 100}
            onChange={(val) => updateRate('officialRate', val / 100)}
            suffix="%"
            showTooltips={showTooltips}
            tooltip="The HMRC official rate used to calculate the beneficial loan BIK. Currently 2.25%. This rate determines the annual BIK cost if the loan is kept outstanding."
            step={0.25}
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
            Compute s.455 Tax
          </button>
        </div>
      </div>

      {/* Results */}
      {output && (
        <div className="space-y-4">
          {/* Validation alerts */}
          {output.validationResults.some((r) => !r.passed) && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3">Validation Notes</h3>
              <div className="space-y-2">
                {output.validationResults
                  .filter((r) => !r.passed)
                  .map((result, i) => (
                    <ValidationAlert key={i} result={result} />
                  ))}
              </div>
            </div>
          )}

          {/* s.455 tax banner */}
          {!hasErrors && (
            <div
              className={`${
                output.s455Computation.chargeableAmount > 0 ? 'bg-red-700' : 'bg-green-700'
              } text-white rounded-lg p-6`}
            >
              <div className="text-center">
                <div className="text-xs uppercase text-white text-opacity-70 mb-1">s.455 Tax Liability</div>
                <div className="text-3xl font-bold mb-2">
                  {formatPoundsPence(output.s455Computation.s455Tax)}
                </div>
                <p className="text-sm text-white text-opacity-90">
                  {output.s455Computation.chargeableAmount > 0
                    ? `${formatPounds(output.s455Computation.chargeableAmount)} overdrawn @ ${formatPercent(output.s455Computation.s455Rate)}`
                    : 'No s.455 charge — DLA is not overdrawn at the AP end'}
                </p>
                {output.bedAndBreakfast.triggered && (
                  <div className="mt-2 text-xs text-white text-opacity-60">
                    s.464C applies — {formatPounds(output.bedAndBreakfast.totalDisregarded)} of repayments disregarded
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DLA Balance Tracker */}
          {!hasErrors && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-1">
                DLA Balance Tracker
              </h3>
              <BalanceSummaryTable output={output} />
            </div>
          )}

          {/* Bed-and-Breakfast Analysis */}
          {!hasErrors && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-1">
                s.464C Bed-and-Breakfast Analysis
              </h3>
              {output.bedAndBreakfast.triggered ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">{output.bedAndBreakfast.explanation}</p>
                  {output.bedAndBreakfast.matches.map((match, i) => (
                    <BedAndBreakfastCard key={i} match={match} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">{output.bedAndBreakfast.explanation}</p>
              )}
            </div>
          )}

          {/* s.455 Computation */}
          {!hasErrors && output.s455Computation.chargeableAmount > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-1">
                s.455 Tax Computation
              </h3>
              <S455ComputationTable output={output} />
            </div>
          )}

          {/* Key Dates */}
          {!hasErrors && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-1">
                Key Compliance Dates
              </h3>
              <KeyDatesSummary output={output} />
            </div>
          )}

          {/* Write-Off Analysis */}
          {!hasErrors && output.writeOffAnalysis && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-1">
                Write-Off vs Keep Loan — Consequence Analysis
              </h3>
              <WriteOffComparisonTable output={output} />
            </div>
          )}

          {/* Timeline */}
          {!hasErrors && output.timeline.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3 border-b border-gray-200 pb-1">
                <h3 className="text-sm font-bold text-gray-700">Compliance Timeline</h3>
                <button
                  className="text-xs text-blue-600 hover:text-blue-800"
                  onClick={handleToggleTimeline}
                >
                  {showTimeline ? 'Hide' : 'Show'}
                </button>
              </div>
              {showTimeline && <TimelineView events={output.timeline} />}
            </div>
          )}

          {/* H&C Scenario Hints */}
          {activeScenario && activeScenario.hints.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-1">
                Learning Points — {activeScenario.name}
              </h3>
              <ul className="space-y-1.5">
                {activeScenario.hints.map((hint, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-xs font-mono text-gray-400 mt-0.5 flex-shrink-0">{i + 1}.</span>
                    <span className="text-xs text-gray-600 leading-relaxed">{hint}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default S455Calculator;
