/**
 * Capital Allowances Computation — React Component
 *
 * Multi-pool capital allowances calculator with AIA allocation strategy,
 * full expensing, zero-emission car FYA, CO2-based car pool allocation,
 * balancing adjustments, and short-period apportionment.
 *
 * Features: dynamic asset additions/disposals, per-addition relief
 * classification, pool computation, exam-format layout, H&C scenario
 * loader, educational tooltips, and MojiTax platform tracking callbacks.
 */

'use client';

import React, { useState, useCallback } from 'react';
import type {
  EntityType,
  AssetCategory,
  PoolId,
  ReliefElection,
  CapitalAllowancesProps,
  CAInputs,
  CAOutput,
  AssetAddition,
  AssetDisposal,
  ValidationResult,
  ExamLayoutRow,
  HCScenario,
  AdditionClassification,
  PoolResult,
} from './types';
import {
  computeAllowances,
  createEmptyInputs,
  createEmptyAddition,
  createEmptyDisposal,
  scenarioToInputs,
  formatCurrency,
  formatPounds,
  formatPercent,
  getCategoryName,
  getReliefName,
  HC_SCENARIOS,
} from './utils';

// ─── Helper Functions ────────────────────────────────────────────────────────

function reliefBadge(relief: string): { text: string; bg: string } {
  switch (relief) {
    case 'full-expensing': return { text: 'FE 100%', bg: 'bg-green-100 text-green-800' };
    case 'fya-100': return { text: 'FYA 100%', bg: 'bg-green-100 text-green-800' };
    case 'fya-50': return { text: 'FYA 50%', bg: 'bg-blue-100 text-blue-800' };
    case 'aia': return { text: 'AIA', bg: 'bg-blue-100 text-blue-800' };
    case 'wda': return { text: 'WDA', bg: 'bg-gray-100 text-gray-700' };
    default: return { text: relief, bg: 'bg-gray-100 text-gray-700' };
  }
}

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
  prefix,
}: {
  label: string;
  value: number;
  onChange: (val: number) => void;
  tooltip?: string;
  showTooltips: boolean;
  placeholder?: string;
  min?: number;
  prefix?: string;
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
          className={`w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 ${prefix ? 'pl-7' : ''}`}
        />
      </div>
      {tooltip && <Tooltip text={tooltip} visible={showTooltips} />}
    </div>
  );
}

/** A single asset addition row */
function AdditionRow({
  addition,
  index,
  onChange,
  onRemove,
  showTooltips,
  classification,
}: {
  addition: AssetAddition;
  index: number;
  onChange: (updated: AssetAddition) => void;
  onRemove: () => void;
  showTooltips: boolean;
  classification?: AdditionClassification;
}) {
  const [expanded, setExpanded] = useState(true);
  const badge = classification ? reliefBadge(classification.reliefType) : null;

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-gray-400">#{index + 1}</span>
          <span className="text-sm font-medium text-gray-900 truncate max-w-xs">
            {addition.description || '(untitled asset)'}
          </span>
          {badge && (
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${badge.bg}`}>
              {badge.text}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="text-xs text-gray-400 hover:text-gray-600"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Collapse' : 'Expand'}
          </button>
          <button
            className="text-xs text-red-400 hover:text-red-600"
            onClick={onRemove}
          >
            Remove
          </button>
        </div>
      </div>

      {expanded && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Description */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={addition.description}
                onChange={(e) => onChange({ ...addition, description: e.target.value })}
                placeholder="e.g., Mazak CNC machine"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Cost */}
            <NumericField
              label="Cost (£)"
              value={addition.cost}
              onChange={(val) => onChange({ ...addition, cost: val })}
              prefix="£"
              showTooltips={showTooltips}
              tooltip="Capital cost excluding recoverable VAT. For cars where VAT is not recoverable, use the VAT-inclusive cost."
            />

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Asset Category</label>
              <select
                value={addition.category}
                onChange={(e) => onChange({ ...addition, category: e.target.value as AssetCategory })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="general-plant">General Plant & Machinery</option>
                <option value="car">Car</option>
                <option value="integral-feature">Integral Feature</option>
                <option value="thermal-insulation">Thermal Insulation</option>
                <option value="long-life">Long-Life Asset (25+ years)</option>
              </select>
              <Tooltip
                text="Asset category determines pool allocation and relief eligibility. Cars are allocated by CO2 emissions. Integral features (electrical systems, lifts, heating/cooling) go to the special rate pool."
                visible={showTooltips}
              />
            </div>

            {/* Is New */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
              <select
                value={addition.isNew ? 'true' : 'false'}
                onChange={(e) => onChange({ ...addition, isNew: e.target.value === 'true' })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="true">New and unused</option>
                <option value="false">Second-hand / used</option>
              </select>
              <Tooltip
                text="Full expensing (100% FYA) is only available for new, unused assets. Second-hand assets can claim AIA or WDA but not full expensing."
                visible={showTooltips}
              />
            </div>

            {/* CO2 Emissions (cars only) */}
            {addition.category === 'car' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CO2 (g/km)</label>
                <input
                  type="number"
                  value={addition.co2Emissions ?? ''}
                  onChange={(e) => onChange({ ...addition, co2Emissions: parseFloat(e.target.value) || 0 })}
                  placeholder="e.g., 21"
                  min={0}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                />
                <Tooltip
                  text="CO2 emissions determine pool allocation: 0 g/km = 100% FYA; 1-50 g/km = main pool (18% WDA); 51+ g/km = special rate pool (6% WDA)."
                  visible={showTooltips}
                />
              </div>
            )}

            {/* Private use */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Private Use %</label>
              <input
                type="number"
                value={addition.privateUsePercent || ''}
                onChange={(e) => onChange({ ...addition, privateUsePercent: parseFloat(e.target.value) || 0 })}
                placeholder="0"
                min={0}
                max={100}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <Tooltip
                text="For companies: private use does not restrict capital allowances (BIK route — reported on P11D). For sole traders/partnerships: the allowance is restricted to the business-use proportion."
                visible={showTooltips}
              />
            </div>

            {/* Relief Election */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Relief Election</label>
              <select
                value={addition.reliefElection}
                onChange={(e) => onChange({ ...addition, reliefElection: e.target.value as ReliefElection })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="auto">Auto (best available)</option>
                <option value="full-expensing">Full Expensing (100%)</option>
                <option value="aia">AIA</option>
                <option value="wda-only">WDA Only (no FYA/AIA)</option>
              </select>
              <Tooltip
                text="Auto selects the best available relief. Full expensing: 100% for new main-rate P&M (companies only). AIA: 100% up to £1m limit. WDA only: asset enters the pool for annual writing-down allowance."
                visible={showTooltips}
              />
            </div>
          </div>

          {/* Classification note (after computation) */}
          {classification && (
            <div className="mt-3 p-3 bg-gray-50 rounded-md border border-gray-100">
              <div className="flex items-center gap-3 mb-1">
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${badge!.bg}`}>
                  {getReliefName(classification.reliefType)}
                </span>
                <span className="text-xs text-gray-600">
                  Relief: {formatPounds(classification.reliefAmount)}
                  {classification.amountToPool > 0 && ` | To pool: ${formatPounds(classification.amountToPool)}`}
                  {classification.targetPool && ` (${classification.targetPool === 'main' ? 'Main' : 'Special Rate'})`}
                </span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{classification.educationalNote}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** A single disposal row */
function DisposalRow({
  disposal,
  index,
  onChange,
  onRemove,
}: {
  disposal: AssetDisposal;
  index: number;
  onChange: (updated: AssetDisposal) => void;
  onRemove: () => void;
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-white">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono text-gray-400">Disposal #{index + 1}</span>
        <button className="text-xs text-red-400 hover:text-red-600" onClick={onRemove}>
          Remove
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <input
            type="text"
            value={disposal.description}
            onChange={(e) => onChange({ ...disposal, description: e.target.value })}
            placeholder="e.g., Old CNC lathe"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Proceeds (£)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">£</span>
            <input
              type="number"
              value={disposal.proceeds || ''}
              onChange={(e) => onChange({ ...disposal, proceeds: parseFloat(e.target.value) || 0 })}
              min={0}
              className="w-full border border-gray-300 rounded-md pl-7 pr-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">From Pool</label>
          <select
            value={disposal.pool}
            onChange={(e) => onChange({ ...disposal, pool: e.target.value as PoolId })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="main">Main Pool</option>
            <option value="special-rate">Special Rate Pool</option>
          </select>
        </div>
      </div>
    </div>
  );
}

/** Pool result card */
function PoolResultCard({ result }: { result: PoolResult }) {
  const hasActivity = result.poolBF > 0 || result.additionsToPool > 0 || result.disposalsFromPool > 0;
  if (!hasActivity) return null;

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-bold text-gray-900">{result.poolName}</h4>
        <span className="text-xs font-medium text-gray-500">WDA {formatPercent(result.wdaRate)}</span>
      </div>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Brought forward</span>
          <span className="font-mono text-gray-900">{formatPounds(result.poolBF)}</span>
        </div>
        {result.additionsToPool > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-600">Additions to pool</span>
            <span className="font-mono text-gray-900">{formatPounds(result.additionsToPool)}</span>
          </div>
        )}
        {result.disposalsFromPool > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-600">Less: Disposals</span>
            <span className="font-mono text-red-600">({formatCurrency(result.disposalsFromPool)})</span>
          </div>
        )}
        <div className="flex justify-between border-t border-gray-100 pt-1">
          <span className="text-gray-600">Balance for WDA</span>
          <span className="font-mono text-gray-900">{formatPounds(result.balanceForWDA)}</span>
        </div>
        {result.balancingCharge > 0 && (
          <div className="flex justify-between">
            <span className="text-red-700 font-medium">Balancing charge</span>
            <span className="font-mono text-red-700">{formatPounds(result.balancingCharge)}</span>
          </div>
        )}
        {result.smallPoolClaimed && (
          <div className="flex justify-between">
            <span className="text-green-700">Small pool WDA (full balance)</span>
            <span className="font-mono text-green-700">({formatCurrency(result.wdaAmount)})</span>
          </div>
        )}
        {!result.smallPoolClaimed && result.wdaAmount > 0 && (
          <div className="flex justify-between">
            <span className="text-green-700">WDA @ {formatPercent(result.wdaRate)}</span>
            <span className="font-mono text-green-700">({formatCurrency(result.wdaAmount)})</span>
          </div>
        )}
        <div className="flex justify-between border-t border-gray-200 pt-1 font-medium">
          <span className="text-gray-900">Carried forward</span>
          <span className="font-mono text-gray-900">{formatPounds(result.poolCF)}</span>
        </div>
      </div>
    </div>
  );
}

/** Exam-format computation table */
function ExamLayoutTable({ rows }: { rows: ExamLayoutRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-900">
            <th className="text-left py-2 pr-4 text-gray-700 font-medium w-2/5"></th>
            <th className="text-right py-2 px-2 text-gray-700 font-medium w-[12%]">FYA/FE</th>
            <th className="text-right py-2 px-2 text-gray-700 font-medium w-[12%]">AIA</th>
            <th className="text-right py-2 px-2 text-gray-700 font-medium w-[12%]">Main Pool</th>
            <th className="text-right py-2 px-2 text-gray-700 font-medium w-[12%]">Special Rate</th>
            <th className="text-right py-2 pl-2 text-gray-700 font-medium w-[12%]">Allowances</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            if (row.rowType === 'blank') {
              return <tr key={i}><td colSpan={6} className="py-1" /></tr>;
            }

            const labelClass =
              row.rowType === 'header' ? 'font-bold text-gray-900 pt-3' :
              row.rowType === 'total' ? 'font-bold text-gray-900 border-t-2 border-gray-900 pt-2' :
              row.rowType === 'carryforward' ? 'font-medium text-gray-700 border-t border-gray-300 pt-1' :
              row.rowType === 'subtotal' ? 'border-t border-gray-200' :
              row.rowType === 'disposal' ? 'text-gray-600' :
              row.rowType === 'wda' ? 'text-green-700' :
              'text-gray-700';

            const valClass = (val: number | null, isDeduction: boolean) => {
              if (val === null) return '';
              const base = 'text-right font-mono';
              if (row.rowType === 'total') return `${base} font-bold text-gray-900 border-t-2 border-gray-900 pt-2`;
              if (row.rowType === 'carryforward') return `${base} font-medium text-gray-700 border-t border-gray-300 pt-1`;
              if (row.rowType === 'subtotal') return `${base} text-gray-700 border-t border-gray-200`;
              if (isDeduction) return `${base} text-red-600`;
              if (row.rowType === 'wda') return `${base} text-green-700`;
              return `${base} text-gray-900`;
            };

            const fmtVal = (val: number | null, isDeduction: boolean) => {
              if (val === null) return '';
              if (isDeduction && val > 0) return `(${formatCurrency(val)})`;
              return formatCurrency(val);
            };

            return (
              <tr key={i}>
                <td className={`py-0.5 pr-4 ${labelClass}`}>{row.label}</td>
                <td className={`py-0.5 px-2 ${valClass(row.fya, false)}`}>{fmtVal(row.fya, false)}</td>
                <td className={`py-0.5 px-2 ${valClass(row.aia, false)}`}>{fmtVal(row.aia, false)}</td>
                <td className={`py-0.5 px-2 ${valClass(row.mainPool, row.isDeduction)}`}>{fmtVal(row.mainPool, row.isDeduction)}</td>
                <td className={`py-0.5 px-2 ${valClass(row.specialRate, row.isDeduction)}`}>{fmtVal(row.specialRate, row.isDeduction)}</td>
                <td className={`py-0.5 pl-2 ${valClass(row.allowances, row.isDeduction)}`}>{fmtVal(row.allowances, row.isDeduction)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
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
            <div className="text-sm font-medium text-gray-900">{scenario.name}</div>
            <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{scenario.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function CapitalAllowances({
  config,
  callbacks,
  showTooltips: showTooltipsProp,
  className,
}: CapitalAllowancesProps) {
  const showTooltips = showTooltipsProp ?? config.showTooltips;

  // ─── State ─────────────────────────────────────────────────────────────────
  const [inputs, setInputs] = useState<CAInputs>(createEmptyInputs());
  const [output, setOutput] = useState<CAOutput | null>(null);
  const [attemptNumber, setAttemptNumber] = useState(0);
  const [showScenarios, setShowScenarios] = useState(false);
  const [showExamLayout, setShowExamLayout] = useState(config.showExamLayout);

  // ─── Period handlers ───────────────────────────────────────────────────────
  const updatePeriod = useCallback((field: 'start' | 'end', value: string) => {
    setInputs((prev) => ({
      ...prev,
      period: { ...prev.period, [field]: value },
    }));
    setOutput(null);
  }, []);

  const updateEntityType = useCallback((value: EntityType) => {
    setInputs((prev) => ({ ...prev, entityType: value }));
    setOutput(null);
  }, []);

  // ─── Pool b/f handlers ────────────────────────────────────────────────────
  const updatePoolBF = useCallback((pool: 'mainPool' | 'specialRatePool', value: number) => {
    setInputs((prev) => ({
      ...prev,
      poolsBF: { ...prev.poolsBF, [pool]: value },
    }));
    setOutput(null);
  }, []);

  // ─── Addition handlers ────────────────────────────────────────────────────
  const addAddition = useCallback(() => {
    const newAddition = createEmptyAddition();
    setInputs((prev) => ({
      ...prev,
      additions: [...prev.additions, newAddition],
    }));
    setOutput(null);
    callbacks?.onAdditionAdd?.({ addition: newAddition, timestamp: Date.now() });
  }, [callbacks]);

  const updateAddition = useCallback((index: number, updated: AssetAddition) => {
    setInputs((prev) => ({
      ...prev,
      additions: prev.additions.map((a, i) => (i === index ? updated : a)),
    }));
    setOutput(null);
  }, []);

  const removeAddition = useCallback((index: number) => {
    const removed = inputs.additions[index];
    setInputs((prev) => ({
      ...prev,
      additions: prev.additions.filter((_, i) => i !== index),
    }));
    setOutput(null);
    if (removed) {
      callbacks?.onAdditionRemove?.({ additionId: removed.id, timestamp: Date.now() });
    }
  }, [inputs.additions, callbacks]);

  // ─── Disposal handlers ────────────────────────────────────────────────────
  const addDisposal = useCallback(() => {
    const newDisposal = createEmptyDisposal();
    setInputs((prev) => ({
      ...prev,
      disposals: [...prev.disposals, newDisposal],
    }));
    setOutput(null);
    callbacks?.onDisposalAdd?.({ disposal: newDisposal, timestamp: Date.now() });
  }, [callbacks]);

  const updateDisposal = useCallback((index: number, updated: AssetDisposal) => {
    setInputs((prev) => ({
      ...prev,
      disposals: prev.disposals.map((d, i) => (i === index ? updated : d)),
    }));
    setOutput(null);
  }, []);

  const removeDisposal = useCallback((index: number) => {
    const removed = inputs.disposals[index];
    setInputs((prev) => ({
      ...prev,
      disposals: prev.disposals.filter((_, i) => i !== index),
    }));
    setOutput(null);
    if (removed) {
      callbacks?.onDisposalRemove?.({ disposalId: removed.id, timestamp: Date.now() });
    }
  }, [inputs.disposals, callbacks]);

  // ─── Compute handler ──────────────────────────────────────────────────────
  const handleCompute = useCallback(() => {
    const result = computeAllowances(inputs);
    const attempt = attemptNumber + 1;
    setOutput(result);
    setAttemptNumber(attempt);

    callbacks?.onCompute?.({
      totalAllowances: result.allowancesSummary.totalAllowances,
      poolResults: result.poolResults.map((pr) => ({
        poolId: pr.poolId,
        wda: pr.wdaAmount,
        cf: pr.poolCF,
      })),
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
    callbacks?.onReset?.({ previousResult, timestamp: Date.now() });
  }, [output, callbacks]);

  // ─── Scenario loader ──────────────────────────────────────────────────────
  const handleLoadScenario = useCallback(
    (scenario: HCScenario) => {
      setInputs(scenarioToInputs(scenario));
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

  // ─── Derived ──────────────────────────────────────────────────────────────
  const canCompute =
    inputs.period.start !== '' &&
    inputs.period.end !== '' &&
    (inputs.additions.length > 0 || inputs.disposals.length > 0 || inputs.poolsBF.mainPool > 0 || inputs.poolsBF.specialRatePool > 0);

  const hasErrors = (output?.validationSummary.errors ?? 0) > 0;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={`max-w-5xl mx-auto ${className ?? ''}`}>
      {/* Tool header */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Capital Allowances Computation</h2>
            <p className="text-sm text-gray-500">Multi-pool CA computation with AIA allocation and full expensing</p>
          </div>
          <div className="flex gap-2">
            <button
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              onClick={() => setShowScenarios(!showScenarios)}
            >
              H&C Scenarios
            </button>
            {(output || inputs.additions.length > 0) && (
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

      {/* Section 1: Period & Entity Type */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-1">
          Accounting Period & Entity Type
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Period Start</label>
            <input
              type="date"
              value={inputs.period.start}
              onChange={(e) => updatePeriod('start', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Period End</label>
            <input
              type="date"
              value={inputs.period.end}
              onChange={(e) => updatePeriod('end', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
            <select
              value={inputs.entityType}
              onChange={(e) => updateEntityType(e.target.value as EntityType)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="company">Company</option>
              <option value="sole-trader-partnership">Sole Trader / Partnership</option>
            </select>
            <Tooltip
              text="Companies can claim full expensing (100% on new main-rate P&M) and do not restrict CAs for private use (BIK route instead). Sole traders/partnerships cannot claim full expensing and must restrict CAs by the business-use proportion."
              visible={showTooltips}
            />
          </div>
        </div>
        {output?.periodInfo.isShortPeriod && (
          <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800">
            Short period detected ({output.periodInfo.periodDays} days). AIA limit apportioned to {formatPounds(output.reliefTotals.aiaAvailable)}. WDA rates apportioned by {output.periodInfo.periodDays}/365.
          </div>
        )}
      </div>

      {/* Section 2: Pool Brought Forward */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-1">
          Pool Brought Forward
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NumericField
            label="Main Pool b/f (£)"
            value={inputs.poolsBF.mainPool}
            onChange={(val) => updatePoolBF('mainPool', val)}
            prefix="£"
            showTooltips={showTooltips}
            tooltip="Main pool balance from the previous period. General plant & machinery and cars with CO2 1-50 g/km. WDA at 18%."
          />
          <NumericField
            label="Special Rate Pool b/f (£)"
            value={inputs.poolsBF.specialRatePool}
            onChange={(val) => updatePoolBF('specialRatePool', val)}
            prefix="£"
            showTooltips={showTooltips}
            tooltip="Special rate pool balance from the previous period. Integral features, long-life assets, thermal insulation, and cars with CO2 > 50 g/km. WDA at 6%."
          />
        </div>
      </div>

      {/* Section 3: Additions */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3 border-b border-gray-200 pb-1">
          <h3 className="text-sm font-bold text-gray-700">
            Asset Additions ({inputs.additions.length})
          </h3>
          <button
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            onClick={addAddition}
          >
            + Add Asset
          </button>
        </div>
        {inputs.additions.length === 0 ? (
          <p className="text-sm text-gray-400 italic py-4 text-center">
            No additions yet. Click "+ Add Asset" to add capital expenditure.
          </p>
        ) : (
          <div className="space-y-3">
            {inputs.additions.map((addition, i) => (
              <AdditionRow
                key={addition.id}
                addition={addition}
                index={i}
                onChange={(updated) => updateAddition(i, updated)}
                onRemove={() => removeAddition(i)}
                showTooltips={showTooltips}
                classification={output?.additionClassifications.find((c) => c.additionId === addition.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Section 4: Disposals */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3 border-b border-gray-200 pb-1">
          <h3 className="text-sm font-bold text-gray-700">
            Asset Disposals ({inputs.disposals.length})
          </h3>
          <button
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            onClick={addDisposal}
          >
            + Add Disposal
          </button>
        </div>
        {inputs.disposals.length === 0 ? (
          <p className="text-sm text-gray-400 italic py-4 text-center">
            No disposals. Click "+ Add Disposal" if any assets were sold or scrapped.
          </p>
        ) : (
          <div className="space-y-3">
            {inputs.disposals.map((disposal, i) => (
              <DisposalRow
                key={disposal.id}
                disposal={disposal}
                index={i}
                onChange={(updated) => updateDisposal(i, updated)}
                onRemove={() => removeDisposal(i)}
              />
            ))}
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
            Compute Allowances
          </button>
        </div>
      </div>

      {/* Results */}
      {output && (
        <div className="space-y-4">
          {/* Validation errors */}
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

          {/* Total allowances banner */}
          {!hasErrors && (
            <div className="bg-gray-900 text-white rounded-lg p-6">
              <div className="text-center">
                <div className="text-xs uppercase text-gray-400 mb-2">Total Capital Allowances</div>
                <div className="text-3xl font-bold">{formatPounds(output.allowancesSummary.totalAllowances)}</div>
                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-xs text-gray-400">FYAs / Full Expensing</div>
                    <div className="text-sm font-medium">{formatPounds(output.allowancesSummary.totalFYAs)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">AIA</div>
                    <div className="text-sm font-medium">{formatPounds(output.allowancesSummary.totalAIA)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">WDA</div>
                    <div className="text-sm font-medium">{formatPounds(output.allowancesSummary.totalWDA)}</div>
                  </div>
                  {output.allowancesSummary.totalBalancingCharges > 0 && (
                    <div>
                      <div className="text-xs text-gray-400">Balancing Charges</div>
                      <div className="text-sm font-medium text-red-400">
                        ({formatCurrency(output.allowancesSummary.totalBalancingCharges)})
                      </div>
                    </div>
                  )}
                </div>
                {output.reliefTotals.aiaRemaining > 0 && (
                  <div className="mt-3 text-xs text-gray-400">
                    AIA remaining: {formatPounds(output.reliefTotals.aiaRemaining)} of {formatPounds(output.reliefTotals.aiaAvailable)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pool results */}
          {!hasErrors && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3">Pool Computations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {output.poolResults.map((pr) => (
                  <PoolResultCard key={pr.poolId} result={pr} />
                ))}
              </div>
            </div>
          )}

          {/* Exam layout toggle and table */}
          {!hasErrors && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-700">Exam-Format Computation</h3>
                <button
                  className="text-xs text-blue-600 hover:text-blue-800"
                  onClick={() => setShowExamLayout(!showExamLayout)}
                >
                  {showExamLayout ? 'Hide' : 'Show'}
                </button>
              </div>
              {showExamLayout && <ExamLayoutTable rows={output.examLayout} />}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CapitalAllowances;
