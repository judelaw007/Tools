/**
 * Customs Valuation Worksheet — React Component
 *
 * Practitioner working paper for computing customs value under
 * valuation Method 1 (transaction value) per TCTA 2018 / retained UCC.
 *
 * Features: currency conversion, Incoterms adjustment, additions/deductions,
 * related party analysis, itemised build-up, educational annotations,
 * H&C scenario loader, and MojiTax platform tracking callbacks.
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import type {
  IncotermsCode,
  CurrencyCode,
  ValuationMethod,
  CustomsValuationWorksheetProps,
  ValuationCallbacks,
  ValuationInputs,
  ValuationOutput,
  ValidationResult,
  BuildUpLine,
  HCValuationScenario,
} from './types';
import {
  // Constants
  STANDARD_VAT_RATE,
  ZERO_VAT_RATE,

  // Reference data
  INCOTERMS_PROFILES,
  CURRENCIES,

  // Helpers
  roundToPence,
  formatGBP,
  formatCurrency,
  getCurrencySymbol,
  getCurrencyByCode,
  getIncotermsProfile,
  requiresFreightAdjustment,
  requiresInsuranceAdjustment,
  freightInsuranceIncluded,

  // Calculation
  calculateValuation,
  createEmptyInputs,

  // Labels
  FIELD_LABELS,
  FIELD_TOOLTIPS,

  // Scenarios
  HC_VALUATION_SCENARIOS,
} from './utils';

// ─── Sub-Components ─────────────────────────────────────────────────────────────

/** Tooltip component shown on hover/focus */
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

/** Build-up line display */
function BuildUpLineDisplay({ line }: { line: BuildUpLine }) {
  const typeStyles = {
    base: 'text-gray-900',
    add: 'text-green-700',
    deduct: 'text-red-700',
    subtotal: 'text-blue-900 font-bold border-t border-gray-300 pt-2',
    total: 'text-gray-900 font-bold text-lg border-t-2 border-gray-900 pt-2',
  }[line.type];

  const prefix = {
    base: '',
    add: '+ ',
    deduct: '',  // already negative in amount
    subtotal: '= ',
    total: '',
  }[line.type];

  return (
    <div className={`flex justify-between items-start py-1.5 ${typeStyles}`}>
      <div className="flex-1 pr-4">
        <div className="text-sm">{prefix}{line.label}</div>
      </div>
      <div className="text-sm font-mono text-right whitespace-nowrap">
        {formatGBP(line.amount)}
      </div>
    </div>
  );
}

/** Itemised build-up panel */
function BuildUpPanel({
  lines,
  showNotes,
  onToggleNotes,
}: {
  lines: BuildUpLine[];
  showNotes: boolean;
  onToggleNotes: () => void;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-700">Itemised Build-Up</h3>
        <button
          className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
          onClick={onToggleNotes}
        >
          {showNotes ? 'Hide notes' : 'Show notes'}
        </button>
      </div>
      <div className="space-y-0">
        {lines.map((line, i) => (
          <div key={i}>
            <BuildUpLineDisplay line={line} />
            {showNotes && line.educationalNote && (
              <p className="text-xs text-gray-500 italic pl-4 pb-2 mt-0.5">
                {line.educationalNote}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Currency and exchange rate input group */
function CurrencyInputGroup({
  currency,
  exchangeRate,
  onCurrencyChange,
  onRateChange,
  showTooltips,
}: {
  currency: CurrencyCode;
  exchangeRate: number;
  onCurrencyChange: (code: CurrencyCode) => void;
  onRateChange: (rate: number) => void;
  showTooltips: boolean;
}) {
  const currencyInfo = getCurrencyByCode(currency);

  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
          {FIELD_LABELS.currency}
        </label>
        <select
          id="currency"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
          value={currency}
          onChange={(e) => {
            const newCode = e.target.value as CurrencyCode;
            onCurrencyChange(newCode);
            const info = getCurrencyByCode(newCode);
            if (info) onRateChange(info.illustrativeRate);
          }}
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} — {c.name}
            </option>
          ))}
        </select>
        <Tooltip text={FIELD_TOOLTIPS.currency} visible={showTooltips} />
      </div>

      <div>
        <label htmlFor="exchangeRate" className="block text-sm font-medium text-gray-700 mb-1">
          {FIELD_LABELS.exchangeRate}
        </label>
        <input
          id="exchangeRate"
          type="number"
          step="0.0001"
          min="0"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
          value={exchangeRate || ''}
          onChange={(e) => onRateChange(parseFloat(e.target.value) || 0)}
          disabled={currency === 'GBP'}
          placeholder={currency === 'GBP' ? '1.0000' : 'e.g. 1.1765'}
        />
        {currency !== 'GBP' && currencyInfo && (
          <p className="mt-1 text-xs text-gray-400">
            Illustrative HMRC rate: {currencyInfo.illustrativeRate} {currency} per £1
          </p>
        )}
        <Tooltip text={FIELD_TOOLTIPS.exchangeRate} visible={showTooltips && currency !== 'GBP'} />
      </div>
    </div>
  );
}

/** Incoterms selector */
function IncotermsSelector({
  value,
  onChange,
  showTooltips,
}: {
  value: IncotermsCode;
  onChange: (code: IncotermsCode) => void;
  showTooltips: boolean;
}) {
  const profile = getIncotermsProfile(value);

  return (
    <div>
      <label htmlFor="incoterms" className="block text-sm font-medium text-gray-700 mb-1">
        {FIELD_LABELS.incoterms}
      </label>
      <select
        id="incoterms"
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value as IncotermsCode)}
      >
        {INCOTERMS_PROFILES.map((p) => (
          <option key={p.code} value={p.code}>
            {p.code} — {p.name} ({p.description})
          </option>
        ))}
      </select>
      {showTooltips && (
        <div className="mt-1 p-2 bg-blue-50 rounded text-xs text-blue-700">
          {profile.educationalNote}
        </div>
      )}
    </div>
  );
}

/** Numeric input field with label and optional tooltip */
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
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{prefix}</span>
        )}
        <input
          id={id}
          type="number"
          step="0.01"
          min="0"
          className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm font-mono ${prefix ? 'pl-6' : ''} ${disabled ? 'bg-gray-50 text-gray-400' : ''}`}
          value={value || ''}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          disabled={disabled}
          placeholder={placeholder ?? '0.00'}
        />
      </div>
      {tooltip && <Tooltip text={tooltip} visible={showTooltips} />}
    </div>
  );
}

/** Scenario selector panel */
function ScenarioSelector({
  onLoad,
  onClose,
}: {
  onLoad: (scenario: HCValuationScenario) => void;
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
        {HC_VALUATION_SCENARIOS.map((scenario) => (
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
function ResultSummary({ output }: { output: ValuationOutput }) {
  return (
    <div className="bg-gray-900 text-white rounded-lg p-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div>
          <div className="text-xs uppercase text-gray-400 mb-1">Customs Value</div>
          <div className="text-xl font-bold">{formatGBP(output.customsValue)}</div>
        </div>
        <div>
          <div className="text-xs uppercase text-gray-400 mb-1">Duty ({output.dutyRatePercent}%)</div>
          <div className="text-xl font-bold">{formatGBP(output.dutyAmount)}</div>
        </div>
        <div>
          <div className="text-xs uppercase text-gray-400 mb-1">Import VAT ({output.vatRatePercent}%)</div>
          <div className="text-xl font-bold">{formatGBP(output.importVAT)}</div>
        </div>
        <div>
          <div className="text-xs uppercase text-gray-400 mb-1">Total Duty + VAT</div>
          <div className="text-2xl font-bold">{formatGBP(output.totalDutyAndVAT)}</div>
        </div>
      </div>
      {!output.method1Applicable && (
        <div className="mt-3 p-2 bg-red-900 rounded text-sm text-red-200">
          Method 1 is not applicable for this transaction. The customs value cannot be determined using the transaction value.
        </div>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

/**
 * Customs Valuation Worksheet — Main React Component
 *
 * A practitioner working paper computing customs value under Method 1
 * (transaction value) with Incoterms adjustments, additions/deductions,
 * currency conversion, and educational annotations.
 */
export function CustomsValuationWorksheet({
  config,
  callbacks,
  showTooltips: showTooltipsProp,
  className,
}: CustomsValuationWorksheetProps) {
  const showTooltips = showTooltipsProp ?? config.showTooltips;

  // ─── State ─────────────────────────────────────────────────────────────────
  const [inputs, setInputs] = useState<ValuationInputs>(createEmptyInputs());
  const [output, setOutput] = useState<ValuationOutput | null>(null);
  const [attemptNumber, setAttemptNumber] = useState(0);
  const [showScenarios, setShowScenarios] = useState(false);
  const [showBuildUpNotes, setShowBuildUpNotes] = useState(true);

  // ─── Derived state ─────────────────────────────────────────────────────────
  const incotermsProfile = useMemo(() => getIncotermsProfile(inputs.incoterms), [inputs.incoterms]);
  const needsFreight = useMemo(() => requiresFreightAdjustment(inputs.incoterms), [inputs.incoterms]);
  const needsInsurance = useMemo(() => requiresInsuranceAdjustment(inputs.incoterms), [inputs.incoterms]);
  const isGBP = inputs.currency === 'GBP';

  // ─── Input handlers ────────────────────────────────────────────────────────
  const updateField = useCallback(<K extends keyof ValuationInputs>(
    field: K,
    value: ValuationInputs[K]
  ) => {
    setInputs((prev) => ({ ...prev, [field]: value }));
    setOutput(null); // Clear result when inputs change
    callbacks?.onFieldEntry?.({
      field: field as string,
      value: value as string | number | boolean,
      timestamp: Date.now(),
    });
  }, [callbacks]);

  const updateAddition = useCallback((
    field: keyof ValuationInputs['additions'],
    value: number
  ) => {
    setInputs((prev) => ({
      ...prev,
      additions: { ...prev.additions, [field]: value },
    }));
    setOutput(null);
    callbacks?.onFieldEntry?.({
      field: `additions.${field}`,
      value,
      timestamp: Date.now(),
    });
  }, [callbacks]);

  const updateDeduction = useCallback((
    field: keyof ValuationInputs['deductions'],
    value: number
  ) => {
    setInputs((prev) => ({
      ...prev,
      deductions: { ...prev.deductions, [field]: value },
    }));
    setOutput(null);
    callbacks?.onFieldEntry?.({
      field: `deductions.${field}`,
      value,
      timestamp: Date.now(),
    });
  }, [callbacks]);

  // ─── Calculate handler ─────────────────────────────────────────────────────
  const handleCalculate = useCallback(() => {
    const result = calculateValuation(inputs);
    const attempt = attemptNumber + 1;
    setOutput(result);
    setAttemptNumber(attempt);

    callbacks?.onCalculate?.({
      customsValue: result.customsValue,
      dutyAmount: result.dutyAmount,
      importVAT: result.importVAT,
      attemptNumber: attempt,
      timestamp: Date.now(),
    });

    callbacks?.onValidation?.({
      validationResults: result.validationResults,
      passCount: result.validationSummary.passed,
      failCount: result.validationSummary.errors + result.validationSummary.warnings,
      timestamp: Date.now(),
    });

    callbacks?.onBuildUpView?.({ timestamp: Date.now() });
  }, [inputs, attemptNumber, callbacks]);

  // ─── Reset handler ─────────────────────────────────────────────────────────
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

  // ─── Scenario loader ──────────────────────────────────────────────────────
  const handleLoadScenario = useCallback((scenario: HCValuationScenario) => {
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

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={`max-w-4xl mx-auto ${className ?? ''}`}>
      {/* Tool header */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Customs Valuation Worksheet</h2>
            <p className="text-sm text-gray-500">
              Method 1 (Transaction Value) — TCTA 2018, s 15 / retained UCC Art 70
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              onClick={() => setShowScenarios(!showScenarios)}
            >
              H&C Scenarios
            </button>
            {(output || inputs.invoicePrice > 0) && (
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

        {/* Section 1: Transaction Details */}
        <fieldset>
          <legend className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-1 w-full">
            1. Transaction Details
          </legend>

          <div className="space-y-3">
            {/* Goods description */}
            <div>
              <label htmlFor="goodsDescription" className="block text-sm font-medium text-gray-700 mb-1">
                {FIELD_LABELS.goodsDescription}
              </label>
              <input
                id="goodsDescription"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                value={inputs.goodsDescription}
                onChange={(e) => updateField('goodsDescription', e.target.value)}
                placeholder="e.g. Extra virgin olive oil, 8,000 bottles"
              />
            </div>

            {/* Invoice price */}
            <NumericField
              id="invoicePrice"
              label={FIELD_LABELS.invoicePrice}
              tooltip={FIELD_TOOLTIPS.invoicePrice}
              value={inputs.invoicePrice}
              onChange={(v) => updateField('invoicePrice', v)}
              showTooltips={showTooltips}
              prefix={getCurrencySymbol(inputs.currency)}
              placeholder="e.g. 42000"
            />

            {/* Currency + exchange rate */}
            <CurrencyInputGroup
              currency={inputs.currency}
              exchangeRate={inputs.exchangeRate}
              onCurrencyChange={(code) => updateField('currency', code)}
              onRateChange={(rate) => updateField('exchangeRate', rate)}
              showTooltips={showTooltips}
            />

            {/* Converted price preview */}
            {!isGBP && inputs.invoicePrice > 0 && inputs.exchangeRate > 0 && (
              <div className="p-2 bg-gray-50 rounded text-sm text-gray-600">
                {getCurrencySymbol(inputs.currency)}{inputs.invoicePrice.toLocaleString('en-GB')} ÷ {inputs.exchangeRate} = <strong>{formatGBP(roundToPence(inputs.invoicePrice / inputs.exchangeRate))}</strong>
              </div>
            )}
          </div>
        </fieldset>

        {/* Section 2: Incoterms & Transport */}
        <fieldset>
          <legend className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-1 w-full">
            2. Incoterms & Transport
          </legend>

          <div className="space-y-3">
            <IncotermsSelector
              value={inputs.incoterms}
              onChange={(code) => updateField('incoterms', code)}
              showTooltips={showTooltips}
            />

            {/* Port of importation */}
            <div>
              <label htmlFor="portOfImportation" className="block text-sm font-medium text-gray-700 mb-1">
                {FIELD_LABELS.portOfImportation}
              </label>
              <input
                id="portOfImportation"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                value={inputs.portOfImportation}
                onChange={(e) => updateField('portOfImportation', e.target.value)}
                placeholder="e.g. Felixstowe"
              />
              <Tooltip text={FIELD_TOOLTIPS.portOfImportation} visible={showTooltips} />
            </div>

            {/* Freight and insurance */}
            <div className="grid grid-cols-2 gap-3">
              <NumericField
                id="freightToPort"
                label={FIELD_LABELS.freightToPort}
                tooltip={FIELD_TOOLTIPS.freightToPort}
                value={inputs.freightToPort}
                onChange={(v) => updateField('freightToPort', v)}
                showTooltips={showTooltips}
                disabled={!needsFreight}
                prefix="£"
              />
              <NumericField
                id="insuranceToPort"
                label={FIELD_LABELS.insuranceToPort}
                tooltip={FIELD_TOOLTIPS.insuranceToPort}
                value={inputs.insuranceToPort}
                onChange={(v) => updateField('insuranceToPort', v)}
                showTooltips={showTooltips}
                disabled={!needsInsurance}
                prefix="£"
              />
            </div>

            {/* CIF/CIP note */}
            {freightInsuranceIncluded(inputs.incoterms) && (
              <div className="p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                {inputs.incoterms} includes freight and insurance in the invoice price. No separate transport adjustment is needed.
              </div>
            )}
          </div>
        </fieldset>

        {/* Section 3: Additions */}
        <fieldset>
          <legend className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-1 w-full">
            3. Additions (TCTA 2018, s 16)
          </legend>

          <div className="grid grid-cols-2 gap-3">
            <NumericField
              id="sellingCommissions"
              label={FIELD_LABELS.sellingCommissions}
              tooltip={FIELD_TOOLTIPS.sellingCommissions}
              value={inputs.additions.sellingCommissions}
              onChange={(v) => updateAddition('sellingCommissions', v)}
              showTooltips={showTooltips}
              prefix="£"
            />
            <NumericField
              id="royalties"
              label={FIELD_LABELS.royalties}
              tooltip={FIELD_TOOLTIPS.royalties}
              value={inputs.additions.royalties}
              onChange={(v) => updateAddition('royalties', v)}
              showTooltips={showTooltips}
              prefix="£"
            />
            <NumericField
              id="assists"
              label={FIELD_LABELS.assists}
              tooltip={FIELD_TOOLTIPS.assists}
              value={inputs.additions.assists}
              onChange={(v) => updateAddition('assists', v)}
              showTooltips={showTooltips}
              prefix="£"
            />
            <NumericField
              id="packingCosts"
              label={FIELD_LABELS.packingCosts}
              tooltip={FIELD_TOOLTIPS.packingCosts}
              value={inputs.additions.packingCosts}
              onChange={(v) => updateAddition('packingCosts', v)}
              showTooltips={showTooltips}
              prefix="£"
            />
          </div>
        </fieldset>

        {/* Section 4: Deductions */}
        <fieldset>
          <legend className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-1 w-full">
            4. Deductions (TCTA 2018, s 17)
          </legend>

          <div className="grid grid-cols-2 gap-3">
            <NumericField
              id="postImportTransport"
              label={FIELD_LABELS.postImportTransport}
              tooltip={FIELD_TOOLTIPS.postImportTransport}
              value={inputs.deductions.postImportTransport}
              onChange={(v) => updateDeduction('postImportTransport', v)}
              showTooltips={showTooltips}
              prefix="£"
            />
            <NumericField
              id="installationAssembly"
              label={FIELD_LABELS.installationAssembly}
              tooltip={FIELD_TOOLTIPS.installationAssembly}
              value={inputs.deductions.installationAssembly}
              onChange={(v) => updateDeduction('installationAssembly', v)}
              showTooltips={showTooltips}
              prefix="£"
            />
          </div>
        </fieldset>

        {/* Section 5: Related Party & Method */}
        <fieldset>
          <legend className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-1 w-full">
            5. Method 1 Conditions
          </legend>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={inputs.relatedParty}
                  onChange={(e) => updateField('relatedParty', e.target.checked)}
                />
                {FIELD_LABELS.relatedParty}
              </label>
              {showTooltips && (
                <span className="text-xs text-gray-400">{FIELD_TOOLTIPS.relatedParty}</span>
              )}
            </div>

            {inputs.relatedParty && (
              <div className="ml-6">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={inputs.armsLengthConfirmed}
                    onChange={(e) => updateField('armsLengthConfirmed', e.target.checked)}
                  />
                  {FIELD_LABELS.armsLengthConfirmed}
                </label>
                <Tooltip text={FIELD_TOOLTIPS.armsLengthConfirmed} visible={showTooltips} />
              </div>
            )}
          </div>
        </fieldset>

        {/* Section 6: Duty & VAT Context */}
        <fieldset>
          <legend className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-1 w-full">
            6. Duty & VAT
          </legend>

          <div className="space-y-3">
            <div>
              <label htmlFor="commodityCode" className="block text-sm font-medium text-gray-700 mb-1">
                {FIELD_LABELS.commodityCode}
              </label>
              <input
                id="commodityCode"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
                value={inputs.commodityCode}
                onChange={(e) => updateField('commodityCode', e.target.value)}
                placeholder="e.g. 1509200090"
                maxLength={10}
              />
              <Tooltip text={FIELD_TOOLTIPS.commodityCode} visible={showTooltips} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <NumericField
                id="dutyRatePercent"
                label={FIELD_LABELS.dutyRatePercent}
                tooltip={FIELD_TOOLTIPS.dutyRatePercent}
                value={inputs.dutyRatePercent}
                onChange={(v) => updateField('dutyRatePercent', v)}
                showTooltips={showTooltips}
                placeholder="e.g. 6.5"
              />
              <div>
                <label htmlFor="vatRatePercent" className="block text-sm font-medium text-gray-700 mb-1">
                  {FIELD_LABELS.vatRatePercent}
                </label>
                <select
                  id="vatRatePercent"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                  value={inputs.vatRatePercent}
                  onChange={(e) => updateField('vatRatePercent', parseFloat(e.target.value))}
                >
                  <option value={20}>20% — Standard rate</option>
                  <option value={0}>0% — Zero-rated (e.g., food, VATZ)</option>
                  <option value={5}>5% — Reduced rate</option>
                </select>
                <Tooltip text={FIELD_TOOLTIPS.vatRatePercent} visible={showTooltips} />
              </div>
            </div>
          </div>
        </fieldset>

        {/* Calculate button */}
        <div className="flex justify-center pt-2">
          <button
            className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            onClick={handleCalculate}
            disabled={inputs.invoicePrice <= 0}
          >
            Calculate Customs Value
          </button>
        </div>
      </div>

      {/* Results */}
      {output && (
        <div className="space-y-4">
          {/* Summary card */}
          <ResultSummary output={output} />

          {/* Build-up */}
          {config.showBuildUp && (
            <BuildUpPanel
              lines={output.buildUpLines}
              showNotes={showBuildUpNotes}
              onToggleNotes={() => setShowBuildUpNotes(!showBuildUpNotes)}
            />
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

            {/* Show all results toggle */}
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

          {/* Method 1 status */}
          <div className={`border rounded-lg p-4 ${output.method1Applicable ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center gap-2">
              <span className={`text-lg ${output.method1Applicable ? 'text-green-600' : 'text-red-600'}`}>
                {output.method1Applicable ? '\u2713' : '\u2717'}
              </span>
              <div>
                <div className={`text-sm font-bold ${output.method1Applicable ? 'text-green-800' : 'text-red-800'}`}>
                  Method 1 {output.method1Applicable ? 'Applicable' : 'Not Applicable'}
                </div>
                <div className="text-xs text-gray-600 mt-0.5">
                  {output.relatedParty
                    ? 'Related party transaction. Arm\'s length status must be evidenced.'
                    : 'Unrelated parties. Transaction value accepted.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomsValuationWorksheet;
