/**
 * CDS Import Declaration (C88) — React Component
 *
 * Simulates a UK Customs Declaration Service import declaration
 * with procedure code selection, preference claims, PVA election,
 * duty/VAT calculation, document checklist, validation engine,
 * educational annotations, H&C scenario loader, and MojiTax
 * platform tracking callbacks.
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import type {
  ProcedureCode,
  AdditionalProcedureCode,
  PreferenceCode,
  ValuationMethod,
  RepresentationType,
  PaymentMethod,
  DocumentCode,
  CountryCode,
  IncotermsCode,
  VATRate,
  ValidationResult,
  RequiredDocument,
  DocumentReference,
  DeclarationInputs,
  DeclarationOutput,
  DutyCalculation,
  CalculationStep,
  CDSImportDeclarationProps,
  HCDeclarationScenario,
} from './types';
import {
  // Constants
  STANDARD_VAT_RATE,
  ZERO_VAT_RATE,

  // Reference data
  PROCEDURE_CODES,
  PREFERENCE_CODES,
  DOCUMENT_CODES,
  COUNTRIES,
  INCOTERMS,
  UK_PORTS,

  // Labels
  FIELD_LABELS,
  FIELD_TOOLTIPS,

  // Helpers
  roundToPence,
  formatGBP,
  generateId,

  // Lookups
  getProcedureCodeInfo,
  getPreferenceCodeInfo,
  getCountryInfo,

  // Defaults
  createEmptyInputs,
  createEmptyDocumentReference,

  // Calculation
  buildDeclarationOutput,

  // Scenarios
  HC_DECLARATION_SCENARIOS,
} from './utils';

// ─── Sub-Components ─────────────────────────────────────────────────────────────

/** Tooltip component shown when tooltips are enabled */
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

/** Document checklist display */
function DocumentChecklist({ documents }: { documents: RequiredDocument[] }) {
  return (
    <div className="space-y-2">
      {documents.map((doc, i) => (
        <div
          key={i}
          className={`flex items-start gap-2 p-2 rounded ${doc.present ? 'bg-green-50' : 'bg-red-50'}`}
        >
          <span className={`text-sm mt-0.5 ${doc.present ? 'text-green-600' : 'text-red-600'}`}>
            {doc.present ? '\u2713' : '\u2717'}
          </span>
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-800">
              {doc.code} — {doc.name}
            </div>
            <div className="text-xs text-gray-500">{doc.reason}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Document reference editor row */
function DocumentReferenceRow({
  docRef,
  onChange,
  onRemove,
}: {
  docRef: DocumentReference;
  onChange: (updated: DocumentReference) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex gap-2 items-start">
      <select
        className="w-32 px-2 py-1.5 border border-gray-300 rounded-md text-sm"
        value={docRef.code}
        onChange={(e) => onChange({ ...docRef, code: e.target.value as DocumentCode })}
      >
        {DOCUMENT_CODES.map((d) => (
          <option key={d.code} value={d.code}>
            {d.code}
          </option>
        ))}
      </select>
      <input
        type="text"
        className="flex-1 px-2 py-1.5 border border-gray-300 rounded-md text-sm font-mono"
        value={docRef.reference}
        onChange={(e) => onChange({ ...docRef, reference: e.target.value })}
        placeholder="Reference number"
      />
      <select
        className="w-20 px-2 py-1.5 border border-gray-300 rounded-md text-sm"
        value={docRef.statusCode}
        onChange={(e) =>
          onChange({ ...docRef, statusCode: e.target.value as DocumentReference['statusCode'] })
        }
      >
        <option value="AC">AC</option>
        <option value="AE">AE</option>
        <option value="AF">AF</option>
        <option value="JP">JP</option>
      </select>
      <button
        className="px-2 py-1.5 text-xs text-red-500 hover:text-red-700"
        onClick={onRemove}
        title="Remove document"
      >
        \u2715
      </button>
    </div>
  );
}

/** Scenario selector panel */
function ScenarioSelector({
  onLoad,
  onClose,
}: {
  onLoad: (scenario: HCDeclarationScenario) => void;
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
        {HC_DECLARATION_SCENARIOS.map((scenario) => (
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
function ResultSummary({ output }: { output: DeclarationOutput }) {
  const { dutyCalculation, status } = output;

  return (
    <div className={`rounded-lg p-4 ${status === 'accepted' ? 'bg-gray-900 text-white' : 'bg-red-900 text-white'}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-lg ${status === 'accepted' ? 'text-green-400' : 'text-red-400'}`}>
          {status === 'accepted' ? '\u2713' : '\u2717'}
        </span>
        <span className="text-sm font-bold uppercase tracking-wide">
          Declaration {status}
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div>
          <div className="text-xs uppercase text-gray-400 mb-1">Customs Value</div>
          <div className="text-xl font-bold">{formatGBP(dutyCalculation.customsValue)}</div>
        </div>
        <div>
          <div className="text-xs uppercase text-gray-400 mb-1">Duty ({dutyCalculation.dutyRatePercent}%)</div>
          <div className="text-xl font-bold">{formatGBP(dutyCalculation.dutyAmount)}</div>
        </div>
        <div>
          <div className="text-xs uppercase text-gray-400 mb-1">Import VAT ({dutyCalculation.vatRatePercent}%)</div>
          <div className="text-xl font-bold">{formatGBP(dutyCalculation.importVAT)}</div>
        </div>
        <div>
          <div className="text-xs uppercase text-gray-400 mb-1">Total Taxes</div>
          <div className="text-2xl font-bold">{formatGBP(dutyCalculation.totalTaxes)}</div>
        </div>
      </div>
      {dutyCalculation.pvaElected && dutyCalculation.importVAT > 0 && (
        <div className="mt-3 p-2 bg-blue-900 rounded text-sm text-blue-200">
          PVA elected: {formatGBP(dutyCalculation.deferredToVATReturn)} import VAT deferred to VAT return (Box 1 + Box 4). Payable at border: {formatGBP(dutyCalculation.payableAtBorder)}.
        </div>
      )}
      {dutyCalculation.isOPReimport && (
        <div className="mt-2 p-2 bg-amber-900 rounded text-sm text-amber-200">
          OP re-import: duty calculated on repair cost only, not full goods value.
        </div>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

/**
 * CDS Import Declaration (C88) — Main React Component
 *
 * Simulates the HMRC Customs Declaration Service import declaration
 * with full validation, duty/VAT calculation, document management,
 * and educational annotations.
 */
export function CDSImportDeclaration({
  config,
  callbacks,
  showTooltips: showTooltipsProp,
  className,
}: CDSImportDeclarationProps) {
  const showTooltips = showTooltipsProp ?? config.showTooltips;

  // ─── State ─────────────────────────────────────────────────────────────────
  const [inputs, setInputs] = useState<DeclarationInputs>(createEmptyInputs());
  const [output, setOutput] = useState<DeclarationOutput | null>(null);
  const [attemptNumber, setAttemptNumber] = useState(0);
  const [showScenarios, setShowScenarios] = useState(false);
  const [showCalcNotes, setShowCalcNotes] = useState(true);

  // ─── Derived state ─────────────────────────────────────────────────────────
  const procInfo = useMemo(
    () => getProcedureCodeInfo(inputs.item.procedureCode),
    [inputs.item.procedureCode]
  );
  const isOPProcedure = procInfo?.isOPReimport ?? false;
  const pvaElected = inputs.header.importerVATNumber.length > 0;

  // ─── Header field handlers ──────────────────────────────────────────────────
  const updateHeader = useCallback(<K extends keyof DeclarationInputs['header']>(
    field: K,
    value: DeclarationInputs['header'][K]
  ) => {
    setInputs((prev) => ({
      ...prev,
      header: { ...prev.header, [field]: value },
    }));
    setOutput(null);
    callbacks?.onFieldEntry?.({
      dataElement: `header.${field as string}`,
      value: value as string,
      timestamp: Date.now(),
    });
  }, [callbacks]);

  const updateHeaderParty = useCallback((
    partyField: 'declarant' | 'importer' | 'representative',
    subField: 'eori' | 'name' | 'address',
    value: string
  ) => {
    setInputs((prev) => ({
      ...prev,
      header: {
        ...prev.header,
        [partyField]: { ...prev.header[partyField], [subField]: value },
      },
    }));
    setOutput(null);
    callbacks?.onFieldEntry?.({
      dataElement: `header.${partyField}.${subField}`,
      value,
      timestamp: Date.now(),
    });
  }, [callbacks]);

  // ─── Item field handlers ────────────────────────────────────────────────────
  const updateItem = useCallback(<K extends keyof DeclarationInputs['item']>(
    field: K,
    value: DeclarationInputs['item'][K]
  ) => {
    setInputs((prev) => ({
      ...prev,
      item: { ...prev.item, [field]: value },
    }));
    setOutput(null);
    callbacks?.onFieldEntry?.({
      dataElement: `item.${field as string}`,
      value: value as string | number,
      timestamp: Date.now(),
    });
  }, [callbacks]);

  // ─── Document reference handlers ───────────────────────────────────────────
  const addDocumentReference = useCallback(() => {
    setInputs((prev) => ({
      ...prev,
      item: {
        ...prev.item,
        documentReferences: [...prev.item.documentReferences, createEmptyDocumentReference()],
      },
    }));
    setOutput(null);
  }, []);

  const updateDocumentReference = useCallback((index: number, updated: DocumentReference) => {
    setInputs((prev) => ({
      ...prev,
      item: {
        ...prev.item,
        documentReferences: prev.item.documentReferences.map((d, i) =>
          i === index ? updated : d
        ),
      },
    }));
    setOutput(null);
  }, []);

  const removeDocumentReference = useCallback((index: number) => {
    setInputs((prev) => ({
      ...prev,
      item: {
        ...prev.item,
        documentReferences: prev.item.documentReferences.filter((_, i) => i !== index),
      },
    }));
    setOutput(null);
  }, []);

  // ─── Submit handler ─────────────────────────────────────────────────────────
  const handleSubmit = useCallback(() => {
    const result = buildDeclarationOutput(inputs);
    const attempt = attemptNumber + 1;
    setOutput(result);
    setAttemptNumber(attempt);

    callbacks?.onSubmit?.({
      declarationSummary: result,
      isAccepted: result.status === 'accepted',
      attemptNumber: attempt,
      timestamp: Date.now(),
    });

    callbacks?.onValidation?.({
      validationResults: result.validationResults,
      passCount: result.validationSummary.passed,
      failCount: result.validationSummary.errors + result.validationSummary.warnings,
      timestamp: Date.now(),
    });

    callbacks?.onDutyCalculation?.({
      dutyAmount: result.dutyCalculation.dutyAmount,
      vatAmount: result.dutyCalculation.importVAT,
      totalTaxes: result.dutyCalculation.totalTaxes,
      timestamp: Date.now(),
    });

    callbacks?.onDocumentCheck?.({
      requiredDocs: result.documentChecklist,
      timestamp: Date.now(),
    });
  }, [inputs, attemptNumber, callbacks]);

  // ─── Reset handler ──────────────────────────────────────────────────────────
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

  // ─── Scenario loader ───────────────────────────────────────────────────────
  const handleLoadScenario = useCallback((scenario: HCDeclarationScenario) => {
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
            <h2 className="text-xl font-bold text-gray-900">CDS Import Declaration (C88)</h2>
            <p className="text-sm text-gray-500">
              Customs Declaration Service — Single Administrative Document
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              onClick={() => setShowScenarios(!showScenarios)}
            >
              H&C Scenarios
            </button>
            {(output || inputs.item.commodityCode) && (
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

        {/* Section 1: Parties */}
        <fieldset>
          <legend className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-1 w-full">
            1. Parties (DE 3/17–3/40)
          </legend>

          <div className="space-y-4">
            {/* Importer */}
            <div className="p-3 bg-gray-50 rounded-lg space-y-2">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Importer (DE 3/37)</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-0.5">{FIELD_LABELS.importerEori}</label>
                  <input
                    type="text"
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm font-mono"
                    value={inputs.header.importer.eori}
                    onChange={(e) => updateHeaderParty('importer', 'eori', e.target.value)}
                    placeholder="GB000000000000"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-0.5">{FIELD_LABELS.importerName}</label>
                  <input
                    type="text"
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm"
                    value={inputs.header.importer.name}
                    onChange={(e) => updateHeaderParty('importer', 'name', e.target.value)}
                    placeholder="e.g. Harrington & Cole Ltd"
                  />
                </div>
              </div>
              <Tooltip text={FIELD_TOOLTIPS.importerEori} visible={showTooltips} />
            </div>

            {/* Declarant */}
            <div className="p-3 bg-gray-50 rounded-lg space-y-2">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Declarant (DE 3/17)</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-0.5">{FIELD_LABELS.declarantEori}</label>
                  <input
                    type="text"
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm font-mono"
                    value={inputs.header.declarant.eori}
                    onChange={(e) => updateHeaderParty('declarant', 'eori', e.target.value)}
                    placeholder="GB000000000000"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-0.5">{FIELD_LABELS.declarantName}</label>
                  <input
                    type="text"
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm"
                    value={inputs.header.declarant.name}
                    onChange={(e) => updateHeaderParty('declarant', 'name', e.target.value)}
                    placeholder="e.g. Mitchell & Partners LLP"
                  />
                </div>
              </div>
              <Tooltip text={FIELD_TOOLTIPS.declarantEori} visible={showTooltips} />
            </div>

            {/* Representation */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-0.5">{FIELD_LABELS.representationType}</label>
                <select
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm"
                  value={inputs.header.representationType}
                  onChange={(e) => updateHeader('representationType', e.target.value as RepresentationType)}
                >
                  <option value="">Self-representation</option>
                  <option value="2">2 — Direct representation</option>
                  <option value="3">3 — Indirect representation</option>
                </select>
                <Tooltip text={FIELD_TOOLTIPS.representationType} visible={showTooltips} />
              </div>
              {inputs.header.representationType && (
                <>
                  <div>
                    <label className="block text-xs text-gray-600 mb-0.5">{FIELD_LABELS.representativeEori}</label>
                    <input
                      type="text"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm font-mono"
                      value={inputs.header.representative.eori}
                      onChange={(e) => updateHeaderParty('representative', 'eori', e.target.value)}
                      placeholder="GB000000000000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-0.5">{FIELD_LABELS.representativeName}</label>
                    <input
                      type="text"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm"
                      value={inputs.header.representative.name}
                      onChange={(e) => updateHeaderParty('representative', 'name', e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>

            {/* PVA + DDA */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-0.5">{FIELD_LABELS.importerVATNumber}</label>
                <input
                  type="text"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm font-mono"
                  value={inputs.header.importerVATNumber}
                  onChange={(e) => updateHeader('importerVATNumber', e.target.value)}
                  placeholder="e.g. 847291036"
                />
                <Tooltip text={FIELD_TOOLTIPS.importerVATNumber} visible={showTooltips} />
                {pvaElected && (
                  <div className="mt-1 p-1.5 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                    PVA elected. Import VAT will be accounted for on the VAT return.
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-0.5">{FIELD_LABELS.locationOfGoods}</label>
                <select
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm"
                  value={inputs.header.locationOfGoods}
                  onChange={(e) => updateHeader('locationOfGoods', e.target.value)}
                >
                  <option value="">Select port...</option>
                  {UK_PORTS.map((port) => (
                    <option key={port.code} value={port.code}>
                      {port.code} — {port.name}
                    </option>
                  ))}
                </select>
                <Tooltip text={FIELD_TOOLTIPS.locationOfGoods} visible={showTooltips} />
              </div>
            </div>
          </div>
        </fieldset>

        {/* Section 2: Goods */}
        <fieldset>
          <legend className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-1 w-full">
            2. Goods (DE 6/1–6/15)
          </legend>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-0.5">{FIELD_LABELS.goodsDescription}</label>
              <input
                type="text"
                className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm"
                value={inputs.item.goodsDescription}
                onChange={(e) => updateItem('goodsDescription', e.target.value)}
                placeholder="e.g. Extra virgin olive oil, 8,000 bottles"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-0.5">{FIELD_LABELS.commodityCode}</label>
                <input
                  type="text"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm font-mono"
                  value={inputs.item.commodityCode}
                  onChange={(e) => updateItem('commodityCode', e.target.value)}
                  placeholder="e.g. 1509200090"
                  maxLength={10}
                />
                <Tooltip text={FIELD_TOOLTIPS.commodityCode} visible={showTooltips} />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-0.5">{FIELD_LABELS.netMass}</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm font-mono"
                  value={inputs.item.netMassKg || ''}
                  onChange={(e) => updateItem('netMassKg', parseFloat(e.target.value) || 0)}
                  placeholder="kg"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-0.5">{FIELD_LABELS.supplementaryUnits}</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm font-mono"
                  value={inputs.item.supplementaryUnits || ''}
                  onChange={(e) => updateItem('supplementaryUnits', parseInt(e.target.value) || 0)}
                  placeholder="e.g. 8000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-0.5">{FIELD_LABELS.countryOfOrigin}</label>
                <select
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm"
                  value={inputs.item.countryOfOrigin}
                  onChange={(e) => updateItem('countryOfOrigin', e.target.value as CountryCode)}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} — {c.name} ({c.tradeScheme})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-0.5">{FIELD_LABELS.countryOfDispatch}</label>
                <select
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm"
                  value={inputs.item.countryOfDispatch}
                  onChange={(e) => updateItem('countryOfDispatch', e.target.value as CountryCode)}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} — {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </fieldset>

        {/* Section 3: Procedure & Preference */}
        <fieldset>
          <legend className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-1 w-full">
            3. Procedure & Preference (DE 1/10–1/11, 4/17)
          </legend>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-0.5">{FIELD_LABELS.procedureCode}</label>
                <select
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm"
                  value={inputs.item.procedureCode}
                  onChange={(e) => updateItem('procedureCode', e.target.value as ProcedureCode)}
                >
                  {PROCEDURE_CODES
                    .filter((p) => !config.allowedProcedureCodes || config.allowedProcedureCodes.includes(p.code))
                    .map((p) => (
                      <option key={p.code} value={p.code}>
                        {p.code} — {p.name}
                      </option>
                    ))}
                </select>
                <Tooltip text={FIELD_TOOLTIPS.procedureCode} visible={showTooltips} />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-0.5">{FIELD_LABELS.additionalProcedureCode}</label>
                <select
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm"
                  value={inputs.item.additionalProcedureCode}
                  onChange={(e) => updateItem('additionalProcedureCode', e.target.value as AdditionalProcedureCode)}
                >
                  {(procInfo?.compatibleAdditionalCodes ?? ['000']).map((code) => (
                    <option key={code} value={code}>
                      {code}{code === '000' ? ' — No additional code' : code === 'B02' ? ' — Guarantee repair' : code === 'B03' ? ' — Guarantee replacement' : code === 'F01' ? ' — RGR duty relief' : code === 'F05' ? ' — RGR duty + VAT relief' : code === 'A04' ? ' — IP VAT suspension' : ''}
                    </option>
                  ))}
                </select>
                <Tooltip text={FIELD_TOOLTIPS.additionalProcedureCode} visible={showTooltips} />
              </div>
            </div>

            {/* Procedure info panel */}
            {procInfo && showTooltips && (
              <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                <strong>{procInfo.code} — {procInfo.name}:</strong> {procInfo.educationalNote}
              </div>
            )}

            <div>
              <label className="block text-xs text-gray-600 mb-0.5">{FIELD_LABELS.preferenceCode}</label>
              <select
                className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm"
                value={inputs.item.preferenceCode}
                onChange={(e) => updateItem('preferenceCode', e.target.value as PreferenceCode)}
              >
                {PREFERENCE_CODES.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.code} — {p.name}
                  </option>
                ))}
              </select>
              <Tooltip text={FIELD_TOOLTIPS.preferenceCode} visible={showTooltips} />
            </div>
          </div>
        </fieldset>

        {/* Section 4: Valuation & Duties */}
        <fieldset>
          <legend className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-1 w-full">
            4. Valuation & Duties (DE 4/1–4/17)
          </legend>

          <div className="space-y-3">
            {/* OP-specific fields */}
            {isOPProcedure && inputs.item.procedureCode === '6121' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                <div className="text-xs font-bold text-amber-700">OP Re-Import Valuation</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-0.5">{FIELD_LABELS.repairCost}</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">£</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-full pl-6 px-2 py-1.5 border border-gray-300 rounded-md text-sm font-mono"
                        value={inputs.item.repairCost || ''}
                        onChange={(e) => updateItem('repairCost', parseFloat(e.target.value) || 0)}
                        placeholder="e.g. 5000"
                      />
                    </div>
                    <Tooltip text={FIELD_TOOLTIPS.repairCost} visible={showTooltips} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-0.5">{FIELD_LABELS.outwardFreight}</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">£</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-full pl-6 px-2 py-1.5 border border-gray-300 rounded-md text-sm font-mono"
                        value={inputs.item.outwardFreight || ''}
                        onChange={(e) => updateItem('outwardFreight', parseFloat(e.target.value) || 0)}
                        placeholder="e.g. 600"
                      />
                    </div>
                    <Tooltip text={FIELD_TOOLTIPS.outwardFreight} visible={showTooltips} />
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-0.5">{FIELD_LABELS.customsValue}</label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">£</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full pl-6 px-2 py-1.5 border border-gray-300 rounded-md text-sm font-mono"
                    value={inputs.item.customsValueGBP || ''}
                    onChange={(e) => updateItem('customsValueGBP', parseFloat(e.target.value) || 0)}
                    placeholder="From Valuation Worksheet"
                  />
                </div>
                <Tooltip text={FIELD_TOOLTIPS.customsValue} visible={showTooltips} />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-0.5">{FIELD_LABELS.incotermsCode}</label>
                <select
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm"
                  value={inputs.item.incotermsCode}
                  onChange={(e) => updateItem('incotermsCode', e.target.value as IncotermsCode)}
                >
                  {INCOTERMS.map((i) => (
                    <option key={i.code} value={i.code}>
                      {i.code} — {i.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-0.5">{FIELD_LABELS.valuationMethod}</label>
                <select
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm"
                  value={inputs.item.valuationMethod}
                  onChange={(e) => updateItem('valuationMethod', parseInt(e.target.value) as ValuationMethod)}
                >
                  <option value={1}>1 — Transaction Value</option>
                  <option value={2}>2 — Identical Goods</option>
                  <option value={3}>3 — Similar Goods</option>
                  <option value={4}>4 — Deductive Method</option>
                  <option value={5}>5 — Computed Method</option>
                  <option value={6}>6 — Fall-back</option>
                </select>
                <Tooltip text={FIELD_TOOLTIPS.valuationMethod} visible={showTooltips} />
              </div>
              {inputs.item.valuationMethod === 1 && (
                <div>
                  <label className="block text-xs text-gray-600 mb-0.5">{FIELD_LABELS.valuationIndicators}</label>
                  <input
                    type="text"
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm font-mono"
                    value={inputs.item.valuationIndicators}
                    onChange={(e) => updateItem('valuationIndicators', e.target.value)}
                    placeholder="0000"
                    maxLength={4}
                  />
                  <Tooltip text={FIELD_TOOLTIPS.valuationIndicators} visible={showTooltips} />
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-0.5">{FIELD_LABELS.dutyRate}</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm font-mono"
                  value={inputs.item.dutyRatePercent || ''}
                  onChange={(e) => updateItem('dutyRatePercent', parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 6.5"
                />
                <Tooltip text={FIELD_TOOLTIPS.dutyRate} visible={showTooltips} />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-0.5">{FIELD_LABELS.vatRate}</label>
                <select
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm"
                  value={inputs.item.vatRate}
                  onChange={(e) => updateItem('vatRate', parseInt(e.target.value) as VATRate)}
                >
                  <option value={20}>20% — Standard rate</option>
                  <option value={0}>0% — Zero-rated (food, VATZ)</option>
                  <option value={5}>5% — Reduced rate</option>
                </select>
                <Tooltip text={FIELD_TOOLTIPS.vatRate} visible={showTooltips} />
              </div>
            </div>

            {/* Payment methods */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-0.5">{FIELD_LABELS.paymentMethodDuty}</label>
                <select
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm"
                  value={inputs.item.paymentMethodDuty}
                  onChange={(e) => updateItem('paymentMethodDuty', e.target.value as PaymentMethod)}
                >
                  <option value="E">E — Duty Deferment Account</option>
                  <option value="A">A — Cash (immediate)</option>
                  <option value="M">M — CDS Cash Account</option>
                  <option value="R">R — Third-party DDA</option>
                </select>
                <Tooltip text={FIELD_TOOLTIPS.paymentMethodDuty} visible={showTooltips} />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-0.5">{FIELD_LABELS.paymentMethodVAT}</label>
                <select
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm"
                  value={inputs.item.paymentMethodVAT}
                  onChange={(e) => updateItem('paymentMethodVAT', e.target.value as PaymentMethod)}
                >
                  <option value="">Blank — PVA (deferred to VAT return)</option>
                  <option value="E">E — Duty Deferment Account</option>
                  <option value="A">A — Cash (immediate)</option>
                  <option value="M">M — CDS Cash Account</option>
                </select>
                <Tooltip text={FIELD_TOOLTIPS.paymentMethodVAT} visible={showTooltips} />
              </div>
            </div>

            {/* Deferment account */}
            {(inputs.item.paymentMethodDuty === 'E' || inputs.item.paymentMethodDuty === 'R') && (
              <div>
                <label className="block text-xs text-gray-600 mb-0.5">{FIELD_LABELS.defermentAccount}</label>
                <input
                  type="text"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm font-mono"
                  value={inputs.header.defermentAccountNumber}
                  onChange={(e) => updateHeader('defermentAccountNumber', e.target.value)}
                  placeholder="e.g. 8472910"
                />
                <Tooltip text={FIELD_TOOLTIPS.defermentAccount} visible={showTooltips} />
              </div>
            )}
          </div>
        </fieldset>

        {/* Section 5: Documents */}
        <fieldset>
          <legend className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-1 w-full">
            5. Document References (DE 2/3)
          </legend>

          <div className="space-y-2">
            {inputs.item.documentReferences.map((docRef, index) => (
              <DocumentReferenceRow
                key={docRef.id}
                docRef={docRef}
                onChange={(updated) => updateDocumentReference(index, updated)}
                onRemove={() => removeDocumentReference(index)}
              />
            ))}

            <button
              className="px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors"
              onClick={addDocumentReference}
            >
              + Add Document
            </button>
          </div>

          {showTooltips && (
            <div className="mt-2 text-xs text-gray-500">
              <strong>Status codes:</strong> AC = attached to declaration, AE = held by declarant, AF = lodged previously, JP = importer's knowledge.
            </div>
          )}
        </fieldset>

        {/* Submit button */}
        <div className="flex justify-center pt-2">
          <button
            className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            onClick={handleSubmit}
            disabled={!inputs.item.commodityCode || inputs.item.customsValueGBP <= 0}
          >
            Submit Declaration
          </button>
        </div>
      </div>

      {/* Results */}
      {output && (
        <div className="space-y-4">
          {/* Summary card */}
          <ResultSummary output={output} />

          {/* Calculation steps */}
          {config.showCalculationSteps && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-700">Duty & Tax Calculation</h3>
                <button
                  className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                  onClick={() => setShowCalcNotes(!showCalcNotes)}
                >
                  {showCalcNotes ? 'Hide notes' : 'Show notes'}
                </button>
              </div>
              <div>
                {output.dutyCalculation.calculationSteps.map((step, i) => (
                  <CalculationStepDisplay key={i} step={step} showNote={showCalcNotes} />
                ))}
              </div>
            </div>
          )}

          {/* Document checklist */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Document Checklist</h3>
            <DocumentChecklist documents={output.documentChecklist} />
          </div>

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

          {/* Summary text */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-bold text-gray-700 mb-2">Declaration Summary</h3>
            <p className="text-sm text-gray-600">{output.summaryText}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default CDSImportDeclaration;
