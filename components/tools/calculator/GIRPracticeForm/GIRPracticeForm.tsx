'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import {
  Save,
  FolderOpen,
  RefreshCw,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Search,
  HelpCircle,
  Plus,
  Trash2,
  Calculator,
  Info,
  ChevronDown,
  Layout,
  X,
} from 'lucide-react';
import {
  DATA_POINTS,
  JURISDICTIONS,
  CURRENCIES,
  ENTITY_TYPES,
  FILING_TYPES,
  INITIAL_SECTION_1,
  INITIAL_ENTITY,
  INITIAL_JURISDICTION_CALC,
  CASE_STUDIES,
  formatCurrency,
  calculateJurisdiction,
} from './utils';
import type {
  GIRPracticeFormProps,
  SavedPracticeSession,
  Section1Data,
  EntityData,
  JurisdictionCalcData,
} from './types';

export function GIRPracticeForm({
  onSave,
  onDelete,
  savedItems = [],
}: GIRPracticeFormProps) {
  const [activeTab, setActiveTab] = useState(1);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSaved, setShowSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [section1, setSection1] = useState<Section1Data>(INITIAL_SECTION_1);
  const [section2, setSection2] = useState<EntityData[]>([]);
  const [section3, setSection3] = useState<JurisdictionCalcData[]>([]);

  // Handlers
  const handleFieldFocus = (fieldId: string) => {
    setActiveField(fieldId);
  };

  const handleLoadCaseStudy = (csId: string) => {
    const cs = CASE_STUDIES[csId];
    if (cs && window.confirm('This will replace current form data. Continue?')) {
      setSection1(cs.section1);
      setSection2(cs.section2);
      setSection3(cs.section3);
    }
  };

  const handleSave = async () => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      await onSave({
        name: `${section1.mneGroupName || 'Untitled'} - ${new Date().toLocaleTimeString()}`,
        section1,
        section2,
        section3,
      });
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const loadSession = (session: SavedPracticeSession) => {
    setSection1(session.section1);
    setSection2(session.section2);
    setSection3(session.section3);
    setShowSaved(false);
  };

  const handleReset = () => {
    if (window.confirm('Reset all form data?')) {
      setSection1(INITIAL_SECTION_1);
      setSection2([]);
      setSection3([]);
    }
  };

  // Validation Status
  const validationStatus = useMemo(() => {
    const uniqueJurisdictionsS2 = new Set(section2.map((e) => e.jurisdiction)).size;
    const jurisdictionsS3 = section3.length;
    return {
      jurisdictionMatch: uniqueJurisdictionsS2 <= jurisdictionsS3,
      s2Count: uniqueJurisdictionsS2,
      s3Count: jurisdictionsS3,
    };
  }, [section2, section3]);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery) return [];
    const query = searchQuery.toLowerCase();
    return Object.entries(DATA_POINTS)
      .filter(
        ([k, v]) =>
          k.toLowerCase().includes(query) || v.name.toLowerCase().includes(query)
      )
      .slice(0, 10);
  }, [searchQuery]);

  // Render Help Panel
  const renderHelpPanel = () => {
    const dp = activeField ? DATA_POINTS[activeField] : null;
    if (!dp) {
      return (
        <Card className="h-full">
          <CardContent className="flex flex-col items-center justify-center h-full text-slate-400 p-6">
            <HelpCircle className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-center text-sm">
              Select a field to view contextual help and data point details.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="h-full overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-mono bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
              {activeField}
            </span>
            {dp.required === 'Yes' && (
              <span className="text-xs font-bold text-red-500">REQUIRED</span>
            )}
          </div>
          <h2 className="font-bold text-slate-800">{dp.name}</h2>
        </div>

        <CardContent className="p-4 space-y-4 overflow-y-auto">
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">
              Definition
            </h3>
            <p className="text-sm text-slate-700">{dp.desc}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 p-3 rounded">
              <span className="text-xs text-slate-400 block">Data Type</span>
              <span className="text-sm font-medium text-slate-700">{dp.type}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded">
              <span className="text-xs text-slate-400 block">Calculated?</span>
              <span className="text-sm font-medium text-slate-700">
                {dp.calculated ? 'Yes (Auto)' : 'No (Input)'}
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">
              ERP Source
            </h3>
            <div className="bg-blue-50 border border-blue-100 p-3 rounded text-sm text-blue-800">
              {dp.erp}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">
              Common Issues
            </h3>
            <div className="bg-amber-50 border border-amber-100 p-3 rounded text-sm text-amber-800 flex items-start">
              <AlertTriangle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              {dp.issues}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render Section 1
  const renderSection1 = () => (
    <div className="space-y-6">
      {/* 1.1 MNE Group */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <div className="w-8 h-8 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3 text-sm font-bold">
              1.1
            </div>
            MNE Group Identification
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="MNE Group Name"
              id="S1.1.1"
              value={section1.mneGroupName}
              onChange={(v) => setSection1({ ...section1, mneGroupName: v })}
              onFocus={handleFieldFocus}
            />
            <InputField
              label="UPE Legal Name"
              id="S1.1.2"
              value={section1.upeLegalName}
              onChange={(v) => setSection1({ ...section1, upeLegalName: v })}
              onFocus={handleFieldFocus}
            />
            <SelectField
              label="UPE Jurisdiction"
              id="S1.1.3"
              value={section1.upeJurisdiction}
              options={JURISDICTIONS}
              onChange={(v) => setSection1({ ...section1, upeJurisdiction: v })}
              onFocus={handleFieldFocus}
            />
            <InputField
              label="UPE Tax ID"
              id="S1.1.4"
              value={section1.upeTaxId}
              onChange={(v) => setSection1({ ...section1, upeTaxId: v })}
              onFocus={handleFieldFocus}
            />
            <InputField
              label="LEI (Optional)"
              id="S1.1.5"
              value={section1.lei}
              onChange={(v) => setSection1({ ...section1, lei: v })}
              onFocus={handleFieldFocus}
            />
          </div>
        </CardContent>
      </Card>

      {/* 1.2 Reporting Period */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <div className="w-8 h-8 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3 text-sm font-bold">
              1.2
            </div>
            Reporting Period
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InputField
              type="date"
              label="Fiscal Year Start"
              id="S1.2.1"
              value={section1.fiscalYearStart}
              onChange={(v) => setSection1({ ...section1, fiscalYearStart: v })}
              onFocus={handleFieldFocus}
            />
            <InputField
              type="date"
              label="Fiscal Year End"
              id="S1.2.2"
              value={section1.fiscalYearEnd}
              onChange={(v) => setSection1({ ...section1, fiscalYearEnd: v })}
              onFocus={handleFieldFocus}
            />
            <SelectField
              label="Currency"
              id="S1.2.3"
              value={section1.reportingCurrency}
              options={CURRENCIES}
              onChange={(v) => setSection1({ ...section1, reportingCurrency: v })}
              onFocus={handleFieldFocus}
            />
            <InputField
              type="number"
              label="Consolidated Revenue"
              id="S1.2.5"
              value={section1.consolidatedRevenue}
              onChange={(v) =>
                setSection1({ ...section1, consolidatedRevenue: parseFloat(v) || 0 })
              }
              onFocus={handleFieldFocus}
            />
            <div className="flex items-end pb-2">
              <label
                className="flex items-center space-x-2 cursor-pointer"
                onClick={() => handleFieldFocus('S1.2.4')}
              >
                <input
                  type="checkbox"
                  checked={section1.firstFiling}
                  onChange={(e) =>
                    setSection1({ ...section1, firstFiling: e.target.checked })
                  }
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300"
                />
                <div className="text-sm">
                  <span className="font-semibold text-slate-700 block">
                    First Filing Year?
                  </span>
                  <span className="text-xs text-slate-400 font-mono">S1.2.4</span>
                </div>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 1.3 Filing Entity */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <div className="w-8 h-8 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3 text-sm font-bold">
              1.3
            </div>
            Filing Entity Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="DFE Name"
              id="S1.3.1"
              value={section1.dfeName}
              onChange={(v) => setSection1({ ...section1, dfeName: v })}
              onFocus={handleFieldFocus}
            />
            <SelectField
              label="DFE Jurisdiction"
              id="S1.3.2"
              value={section1.dfeJurisdiction}
              options={JURISDICTIONS}
              onChange={(v) => setSection1({ ...section1, dfeJurisdiction: v })}
              onFocus={handleFieldFocus}
            />
            <InputField
              label="DFE Tax ID"
              id="S1.3.3"
              value={section1.dfeTaxId}
              onChange={(v) => setSection1({ ...section1, dfeTaxId: v })}
              onFocus={handleFieldFocus}
            />
            <SelectField
              label="Filing Type"
              id="S1.3.4"
              value={section1.filingType}
              options={FILING_TYPES}
              onChange={(v) =>
                setSection1({ ...section1, filingType: v as 'ORIGINAL' | 'AMENDED' })
              }
              onFocus={handleFieldFocus}
            />
            {section1.filingType === 'AMENDED' && (
              <div className="md:col-span-2">
                <InputField
                  label="Amendment Reason"
                  id="S1.3.5"
                  value={section1.amendmentReason}
                  onChange={(v) => setSection1({ ...section1, amendmentReason: v })}
                  onFocus={handleFieldFocus}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render Section 2
  const renderSection2 = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500">
          Define the corporate structure entity by entity.
        </p>
        <Button
          onClick={() =>
            setSection2([...section2, { ...INITIAL_ENTITY, id: `E${Date.now()}` }])
          }
        >
          <Plus className="w-4 h-4 mr-2" /> Add Entity
        </Button>
      </div>

      {section2.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center text-slate-400">
            No entities added yet. Click &quot;Add Entity&quot; to begin.
          </CardContent>
        </Card>
      )}

      {section2.map((entity, idx) => (
        <Card key={entity.id} className="relative group">
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSection2(section2.filter((e) => e.id !== entity.id))}
            >
              <Trash2 className="w-4 h-4 text-red-400" />
            </Button>
          </div>

          <CardContent className="p-6">
            <h4 className="font-semibold text-slate-800 mb-4 pb-2 border-b flex items-center">
              <span className="bg-slate-100 text-slate-500 text-xs px-2 py-1 rounded mr-3">
                #{idx + 1}
              </span>
              {entity.name || 'New Entity'}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <InputField
                label="Entity Name"
                id="S2.1.1"
                value={entity.name}
                onChange={(v) => {
                  const newS2 = [...section2];
                  newS2[idx].name = v;
                  setSection2(newS2);
                }}
                onFocus={handleFieldFocus}
              />
              <InputField
                label="Internal ID"
                id="S2.1.2"
                value={entity.internalId}
                onChange={(v) => {
                  const newS2 = [...section2];
                  newS2[idx].internalId = v;
                  setSection2(newS2);
                }}
                onFocus={handleFieldFocus}
              />
              <SelectField
                label="Jurisdiction"
                id="S2.1.3"
                value={entity.jurisdiction}
                options={JURISDICTIONS}
                onChange={(v) => {
                  const newS2 = [...section2];
                  newS2[idx].jurisdiction = v;
                  setSection2(newS2);
                }}
                onFocus={handleFieldFocus}
              />
              <InputField
                label="Tax ID"
                id="S2.1.4"
                value={entity.taxId}
                onChange={(v) => {
                  const newS2 = [...section2];
                  newS2[idx].taxId = v;
                  setSection2(newS2);
                }}
                onFocus={handleFieldFocus}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <SelectField
                label="Type"
                id="S2.3.1"
                value={entity.entityType}
                options={ENTITY_TYPES}
                onChange={(v) => {
                  const newS2 = [...section2];
                  newS2[idx].entityType = v as EntityData['entityType'];
                  setSection2(newS2);
                }}
                onFocus={handleFieldFocus}
              />
              <InputField
                type="number"
                label="Ownership %"
                id="S2.2.2"
                value={entity.ownershipPct}
                onChange={(v) => {
                  const newS2 = [...section2];
                  newS2[idx].ownershipPct = parseFloat(v) || 0;
                  setSection2(newS2);
                }}
                onFocus={handleFieldFocus}
              />
              <InputField
                label="Direct Parent ID"
                id="S2.2.1"
                value={entity.directParent}
                onChange={(v) => {
                  const newS2 = [...section2];
                  newS2[idx].directParent = v;
                  setSection2(newS2);
                }}
                onFocus={handleFieldFocus}
              />
              <div className="flex items-center md:col-span-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={entity.isExcluded}
                    onChange={(e) => {
                      const newS2 = [...section2];
                      newS2[idx].isExcluded = e.target.checked;
                      setSection2(newS2);
                    }}
                    onClick={() => handleFieldFocus('S2.3.2')}
                    className="rounded text-indigo-600"
                  />
                  <span className="text-sm text-slate-700">Excluded Entity?</span>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Render Section 3
  const renderSection3 = () => {
    const neededJurisdictions = Array.from(
      new Set(section2.map((e) => e.jurisdiction).filter(Boolean))
    );
    const existingJurisdictions = section3.map((j) => j.jurisdiction);
    const missing = neededJurisdictions.filter(
      (j) => !existingJurisdictions.includes(j)
    );

    return (
      <div className="space-y-6">
        {missing.length > 0 && (
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex items-center justify-between">
            <div className="flex items-center text-blue-700">
              <Info className="w-5 h-5 mr-3" />
              <span className="text-sm">
                Found {missing.length} jurisdictions in Structure not yet in Computation.
              </span>
            </div>
            <div className="flex space-x-2">
              {missing.map((j) => (
                <Button
                  key={j}
                  size="sm"
                  onClick={() =>
                    setSection3([...section3, { ...INITIAL_JURISDICTION_CALC, jurisdiction: j }])
                  }
                >
                  Add {j}
                </Button>
              ))}
            </div>
          </div>
        )}

        {section3.map((jurData, idx) => {
          const calc = calculateJurisdiction(jurData);
          const updateJur = (field: keyof JurisdictionCalcData, val: string | number) => {
            const newS3 = [...section3];
            (newS3[idx] as any)[field] = val;
            setSection3(newS3);
          };

          return (
            <Card key={idx} className="overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b flex justify-between items-center">
                <h3 className="font-bold text-lg text-slate-800 flex items-center">
                  <span className="w-8 h-8 rounded-full bg-white border border-slate-300 flex items-center justify-center text-xs mr-3">
                    {jurData.jurisdiction}
                  </span>
                  GloBE Computation: {jurData.jurisdiction}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSection3(section3.filter((_, i) => i !== idx))}
                >
                  <Trash2 className="w-4 h-4 text-slate-400" />
                </Button>
              </div>

              <CardContent className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Inputs */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-500 uppercase mb-4 border-b pb-2">
                      3.2 GloBE Income Inputs
                    </h4>
                    <div className="space-y-3">
                      <InputRow label="Financial Accounting Net Income" id="S3.2.1" val={jurData.fani} set={(v) => updateJur('fani', v)} onFocus={handleFieldFocus} />
                      <InputRow label="Net Taxes Included" id="S3.2.2" val={jurData.netTaxes} set={(v) => updateJur('netTaxes', v)} onFocus={handleFieldFocus} />
                      <InputRow label="Excluded Dividends" id="S3.2.3" val={jurData.excludedDividends} set={(v) => updateJur('excludedDividends', v)} onFocus={handleFieldFocus} />
                      <InputRow label="Excluded Equity Gain/Loss" id="S3.2.4" val={jurData.excludedEquity} set={(v) => updateJur('excludedEquity', v)} onFocus={handleFieldFocus} />
                      <InputRow label="Policy Disallowed Expenses" id="S3.2.5" val={jurData.disallowedExpenses} set={(v) => updateJur('disallowedExpenses', v)} onFocus={handleFieldFocus} />
                      <InputRow label="Stock Comp Adjustment" id="S3.2.6" val={jurData.stockCompAdj} set={(v) => updateJur('stockCompAdj', v)} onFocus={handleFieldFocus} />
                      <InputRow label="Other Adjustments" id="S3.2.7" val={jurData.otherAdj} set={(v) => updateJur('otherAdj', v)} onFocus={handleFieldFocus} />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-slate-500 uppercase mb-4 border-b pb-2">
                      3.3 Covered Taxes Inputs
                    </h4>
                    <div className="space-y-3">
                      <InputRow label="Current Tax Expense" id="S3.3.1" val={jurData.currentTax} set={(v) => updateJur('currentTax', v)} onFocus={handleFieldFocus} />
                      <InputRow label="Deferred Tax Expense" id="S3.3.2" val={jurData.deferredTax} set={(v) => updateJur('deferredTax', v)} onFocus={handleFieldFocus} />
                      <InputRow label="UTP Adjustment" id="S3.3.4" val={jurData.utpAdj} set={(v) => updateJur('utpAdj', v)} onFocus={handleFieldFocus} />
                      <InputRow label="Non-Covered Tax Adj" id="S3.3.5" val={jurData.nonCoveredAdj} set={(v) => updateJur('nonCoveredAdj', v)} onFocus={handleFieldFocus} />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-slate-500 uppercase mb-4 border-b pb-2">
                      3.4 SBIE Inputs
                    </h4>
                    <div className="space-y-3">
                      <InputRow label="Eligible Payroll Costs" id="S3.4.1" val={jurData.payrollCosts} set={(v) => updateJur('payrollCosts', v)} onFocus={handleFieldFocus} />
                      <InputRow label="Eligible Tangible Assets" id="S3.4.4" val={jurData.tangibleAssets} set={(v) => updateJur('tangibleAssets', v)} onFocus={handleFieldFocus} />
                    </div>
                  </div>
                </div>

                {/* Calculations Panel */}
                <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                  <h4 className="text-sm font-bold text-slate-700 flex items-center mb-6">
                    <Calculator className="w-4 h-4 mr-2" />
                    Real-time Calculation Results
                  </h4>

                  <div className="space-y-4">
                    <ResultRow label="GloBE Income" id="S3.2.8" val={calc.globeIncome} />
                    <ResultRow label="Adjusted Covered Taxes" id="S3.3.6" val={calc.adjustedCoveredTaxes} />

                    <div className="my-4 border-t border-slate-200"></div>

                    <div className="flex justify-between items-center">
                      <span
                        className="text-sm text-slate-600 cursor-pointer"
                        onClick={() => handleFieldFocus('S3.5.3')}
                      >
                        Jurisdictional ETR
                      </span>
                      <span
                        className={`font-mono font-bold ${
                          calc.etr < 0.15 ? 'text-red-600' : 'text-green-600'
                        }`}
                      >
                        {(calc.etr * 100).toFixed(2)}%
                      </span>
                    </div>
                    {calc.etr < 0.15 && (
                      <div className="text-xs text-red-500 text-right">
                        Below 15% Minimum Rate
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Top-up Tax Percentage</span>
                      <span className="font-mono font-bold text-slate-800">
                        {(calc.topUpTaxPct * 100).toFixed(2)}%
                      </span>
                    </div>

                    <div className="my-4 border-t border-slate-200"></div>

                    <ResultRow label="Total SBIE" id="S3.4.7" val={calc.totalSBIE} />
                    <ResultRow label="Excess Profit" id="S3.5.7" val={calc.excessProfit} />

                    <div className="bg-white p-4 rounded border border-slate-200 mt-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-slate-700">Gross Top-up Tax</span>
                        <span className="text-lg font-bold text-indigo-600">
                          {formatCurrency(calc.grossTopUp)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-slate-500 mb-2">
                        <span>Less: QDMTT</span>
                        <input
                          type="number"
                          value={jurData.qdmtt}
                          onChange={(e) => updateJur('qdmtt', parseFloat(e.target.value) || 0)}
                          className="w-24 text-right border rounded px-2 py-1 text-xs"
                          onClick={(e) => e.stopPropagation()}
                          placeholder="0"
                        />
                      </div>
                      <div className="border-t pt-2 flex justify-between items-center">
                        <span
                          className="font-bold text-slate-900 cursor-pointer"
                          onClick={() => handleFieldFocus('S3.5.10')}
                        >
                          Net Top-up Tax
                        </span>
                        <span className="font-bold text-xl text-indigo-700">
                          {formatCurrency(calc.netTopUp)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
            <Layout className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-mojitax-navy">GIR Practice Form</h1>
            <p className="text-sm text-slate-500">GIR-004 - Data Entry Practice Tool</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleLoadCaseStudy('CS1')}>
            <FileText className="w-4 h-4 mr-2" /> Load Case Study
          </Button>
          {savedItems.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setShowSaved(!showSaved)}>
              <FolderOpen className="w-4 h-4 mr-2" /> Saved ({savedItems.length})
            </Button>
          )}
          {onSave && (
            <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" /> {isSaving ? 'Saving...' : 'Save'}
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Saved Sessions Modal */}
      {showSaved && savedItems.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-mojitax-navy mb-3">Saved Sessions</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {savedItems.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer"
                  onClick={() => loadSession(session)}
                >
                  <div>
                    <p className="font-medium text-slate-800">{session.name}</p>
                    <p className="text-xs text-slate-500">
                      Entities: {session.section2?.length || 0} | Jurisdictions:{' '}
                      {session.section3?.length || 0}
                    </p>
                  </div>
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(session.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-slate-400" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Form Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Tabs */}
          <div className="flex space-x-1 overflow-x-auto pb-1">
            <TabButton
              active={activeTab === 1}
              onClick={() => setActiveTab(1)}
              label="Section 1: General"
              icon={FileText}
            />
            <TabButton
              active={activeTab === 2}
              onClick={() => setActiveTab(2)}
              label="Section 2: Structure"
              icon={Layout}
              count={section2.length}
            />
            <TabButton
              active={activeTab === 3}
              onClick={() => setActiveTab(3)}
              label="Section 3: GloBE Calc"
              icon={Calculator}
              count={section3.length}
            />
          </div>

          {/* Form Content */}
          <div>
            {activeTab === 1 && renderSection1()}
            {activeTab === 2 && renderSection2()}
            {activeTab === 3 && renderSection3()}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Validation Status */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-2 text-slate-500" />
                Validation Status
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Jurisdiction Coverage</span>
                  {validationStatus.jurisdictionMatch ? (
                    <span className="text-green-600 font-medium flex items-center">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> PASS
                    </span>
                  ) : (
                    <span className="text-amber-600 font-medium flex items-center">
                      <AlertTriangle className="w-3 h-3 mr-1" /> WARNING
                    </span>
                  )}
                </div>
                {section3.map((jur, idx) => {
                  const calc = calculateJurisdiction(jur);
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between pl-2 border-l-2 border-slate-200"
                    >
                      <span className="text-slate-500">
                        {jur.jurisdiction}: Top-up
                      </span>
                      <span className="text-green-600 font-medium">
                        {formatCurrency(calc.netTopUp)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Help Panel */}
          <div className="min-h-[300px]">{renderHelpPanel()}</div>

          {/* Search Button */}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowSearch(!showSearch)}
          >
            <Search className="w-4 h-4 mr-2" /> Search Data Points
          </Button>
        </div>
      </div>

      {/* Search Modal */}
      {showSearch && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-2xl rounded-t-xl shadow-xl">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-bold">Search Data Points</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowSearch(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-4">
              <div className="flex items-center bg-slate-100 rounded-lg px-4 py-2 mb-4">
                <Search className="w-5 h-5 text-slate-400 mr-3" />
                <input
                  type="text"
                  placeholder="Search data points (e.g., 'Payroll', 'S3.2.1')..."
                  className="bg-transparent border-none outline-none flex-1 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
              {searchResults.length > 0 && (
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {searchResults.map(([key, dp]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setActiveField(key);
                        setShowSearch(false);
                        setSearchQuery('');
                      }}
                      className="w-full text-left p-3 hover:bg-slate-50 rounded flex flex-col"
                    >
                      <span className="text-xs font-mono text-indigo-600">{key}</span>
                      <span className="text-sm font-medium text-slate-700">{dp.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-components
function TabButton({
  active,
  onClick,
  label,
  icon: Icon,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ElementType;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center px-4 py-3 rounded-t-lg text-sm font-medium transition-colors border-b-2 ${
        active
          ? 'bg-white text-indigo-700 border-indigo-600'
          : 'bg-slate-200 text-slate-600 border-transparent hover:bg-slate-300'
      }`}
    >
      <Icon className={`w-4 h-4 mr-2 ${active ? 'text-indigo-600' : 'text-slate-500'}`} />
      {label}
      {count !== undefined && (
        <span
          className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${
            active ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-300 text-slate-700'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function InputField({
  label,
  id,
  value,
  onChange,
  onFocus,
  type = 'text',
}: {
  label: string;
  id: string;
  value: string | number;
  onChange: (v: string) => void;
  onFocus: (id: string) => void;
  type?: string;
}) {
  return (
    <div className="group">
      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5 flex justify-between">
        {label}
        <span
          className="text-slate-300 font-mono group-hover:text-indigo-400 cursor-help"
          onClick={() => onFocus(id)}
        >
          {id}
        </span>
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => onFocus(id)}
        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
      />
    </div>
  );
}

function SelectField({
  label,
  id,
  value,
  options,
  onChange,
  onFocus,
}: {
  label: string;
  id: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  onFocus: (id: string) => void;
}) {
  return (
    <div className="group">
      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5 flex justify-between">
        {label}
        <span
          className="text-slate-300 font-mono group-hover:text-indigo-400 cursor-help"
          onClick={() => onFocus(id)}
        >
          {id}
        </span>
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => onFocus(id)}
          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 appearance-none"
        >
          <option value="">Select...</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
      </div>
    </div>
  );
}

function InputRow({
  label,
  id,
  val,
  set,
  onFocus,
}: {
  label: string;
  id: string;
  val: number;
  set: (v: number) => void;
  onFocus: (id: string) => void;
}) {
  return (
    <div className="flex items-center justify-between group">
      <label
        className="text-sm text-slate-600 flex-1 cursor-pointer"
        onClick={() => onFocus(id)}
      >
        {label}
        <span className="text-xs text-slate-300 ml-2 font-mono group-hover:text-indigo-400">
          {id}
        </span>
      </label>
      <div className="w-32">
        <input
          type="number"
          value={val}
          onChange={(e) => set(parseFloat(e.target.value) || 0)}
          onFocus={() => onFocus(id)}
          className="w-full text-right px-2 py-1 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-indigo-500"
        />
      </div>
    </div>
  );
}

function ResultRow({ label, id, val }: { label: string; id: string; val: number }) {
  return (
    <div className="flex justify-between items-center group">
      <span className="text-sm text-slate-600">
        {label}{' '}
        <span className="text-xs text-slate-300 ml-1 font-mono opacity-0 group-hover:opacity-100">
          {id}
        </span>
      </span>
      <span className="font-mono font-bold text-slate-800">{formatCurrency(val)}</span>
    </div>
  );
}

export default GIRPracticeForm;
