'use client';

import React, { useState, useRef } from 'react';
import {
  Calculator,
  Factory,
  Scale,
  CheckCircle,
  Lock,
  ArrowRight,
  RotateCcw,
  Info,
  AlertCircle,
  Save,
  FolderOpen,
  Trash2,
  X,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import type {
  GloBECalculatorProps,
  Step1Data,
  Step1Result,
  Step2Data,
  Step2Result,
  Step3Data,
  Step3Result,
  SavedCalculation,
} from './types';
import {
  CURRENCIES,
  YEARS,
  getCurrencySymbol,
  formatMoney,
  getSBIERates,
  round,
  MIN_TAX_RATE,
  WARNING_THRESHOLD,
} from './utils';

export function GloBECalculator({
  userId,
  onSave,
  onLoad,
  onDelete,
  savedItems = [],
}: GloBECalculatorProps) {
  // Session state
  const [mneName, setMneName] = useState('');
  const [isMneSet, setIsMneSet] = useState(false);
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Navigation state
  const [activeStep, setActiveStep] = useState(1);
  const [unlockedSteps, setUnlockedSteps] = useState<number[]>([1]);

  // Configuration
  const [currency, setCurrency] = useState('EUR');
  const [fiscalYear, setFiscalYear] = useState('2024');
  const [jurisdiction, setJurisdiction] = useState('');

  // Step data
  const [s1Data, setS1Data] = useState<Step1Data>({ income: '', taxes: '' });
  const [s1Result, setS1Result] = useState<Step1Result | null>(null);
  const [s2Data, setS2Data] = useState<Step2Data>({ payroll: '', assets: '' });
  const [s2Result, setS2Result] = useState<Step2Result | null>(null);
  const [s3Data, setS3Data] = useState<Step3Data>({ qdmtt: '' });
  const [s3Result, setS3Result] = useState<Step3Result | null>(null);

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  const topRef = useRef<HTMLDivElement>(null);

  // Get currency symbol
  const symbol = getCurrencySymbol(currency);

  // Calculate ETR (Step 1)
  const calculateETR = () => {
    const inc = parseFloat(s1Data.income);
    const tax = parseFloat(s1Data.taxes);

    if (!s1Data.income || inc <= 0) {
      setErrors({ s1: 'GloBE Income must be greater than zero' });
      return;
    }
    if (!s1Data.taxes || tax < 0) {
      setErrors({ s1: 'Covered Taxes cannot be negative' });
      return;
    }

    const etr = (tax / inc) * 100;
    let status: Step1Result['status'] = 'COMPLIANT';
    let topUpPct = 0;

    if (etr < MIN_TAX_RATE) {
      status = 'LOW_TAXED';
      topUpPct = MIN_TAX_RATE - etr;
    } else if (etr >= MIN_TAX_RATE && etr < WARNING_THRESHOLD) {
      status = 'WARNING';
    }

    setS1Result({ etr: round(etr, 2), topUpPct: round(topUpPct, 2), status });
    setErrors({});
    if (!unlockedSteps.includes(2)) setUnlockedSteps([...unlockedSteps, 2]);
  };

  // Calculate SBIE (Step 2)
  const calculateSBIE = () => {
    const pay = parseFloat(s2Data.payroll);
    const ast = parseFloat(s2Data.assets);

    if (isNaN(pay) || pay < 0) {
      setErrors({ s2: 'Invalid Payroll amount' });
      return;
    }
    if (isNaN(ast) || ast < 0) {
      setErrors({ s2: 'Invalid Asset amount' });
      return;
    }

    const rates = getSBIERates(fiscalYear);
    const paySbie = pay * (rates.payroll / 100);
    const astSbie = ast * (rates.asset / 100);
    const total = paySbie + astSbie;

    setS2Result({
      rates,
      paySbie: round(paySbie, 2),
      astSbie: round(astSbie, 2),
      totalSbie: round(total, 2),
    });
    setErrors({});
    if (!unlockedSteps.includes(3)) setUnlockedSteps([...unlockedSteps, 3]);
  };

  // Calculate Top-Up Tax (Step 3)
  const calculateTopUp = () => {
    if (!s1Result || !s2Result) return;

    const income = parseFloat(s1Data.income);
    const sbie = s2Result.totalSbie;
    const topUpPct = s1Result.topUpPct;
    const qdmtt = parseFloat(s3Data.qdmtt) || 0;

    if (qdmtt < 0) {
      setErrors({ s3: 'QDMTT cannot be negative' });
      return;
    }

    const excess = Math.max(0, income - sbie);
    const gross = excess * (topUpPct / 100);
    const offset = Math.min(qdmtt, gross);
    const net = Math.max(0, gross - offset);

    let status: Step3Result['status'] = 'TOP_UP_DUE';
    if (s1Result.status === 'COMPLIANT') status = 'COMPLIANT';
    else if (excess <= 0) status = 'NO_EXCESS';
    else if (net <= 0 && offset > 0) status = 'QDMTT_OFFSET';

    setS3Result({
      excessProfit: round(excess, 2),
      grossTopUp: round(gross, 2),
      qdmttOffset: round(offset, 2),
      netTopUp: round(net, 2),
      status,
    });
    setErrors({});
  };

  // Save calculation
  const handleSave = async (shouldReset = false) => {
    if (!onSave) return;
    if (!s1Result) {
      setErrors({ global: 'Please calculate ETR before saving.' });
      return;
    }

    setSaveStatus('saving');

    const dataToSave = {
      mneName,
      jurisdiction,
      fiscalYear,
      currency,
      s1Data,
      s1Result,
      s2Data,
      s2Result,
      s3Data,
      s3Result,
      unlockedSteps,
      activeStep,
    };

    try {
      const id = await onSave(dataToSave);
      if (!currentDocId) setCurrentDocId(id);

      setSaveStatus('saved');

      if (shouldReset) {
        setTimeout(() => {
          handleResetForNext();
          setSaveStatus('idle');
        }, 800);
      } else {
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    } catch (e) {
      console.error('Save failed:', e);
      setSaveStatus('error');
    }
  };

  // Load calculation
  const handleLoad = (item: SavedCalculation) => {
    setMneName(item.mneName);
    setJurisdiction(item.jurisdiction);
    setFiscalYear(item.fiscalYear);
    setCurrency(item.currency);
    setS1Data(item.s1Data);
    setS1Result(item.s1Result);
    setS2Data(item.s2Data || { payroll: '', assets: '' });
    setS2Result(item.s2Result);
    setS3Data(item.s3Data || { qdmtt: '' });
    setS3Result(item.s3Result);
    setUnlockedSteps(item.unlockedSteps);
    setActiveStep(item.activeStep);

    setCurrentDocId(item.id);
    setIsMneSet(true);
    setIsLibraryOpen(false);
  };

  // Delete calculation
  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!onDelete) return;
    if (window.confirm('Delete this calculation?')) {
      await onDelete(id);
      if (currentDocId === id) setCurrentDocId(null);
    }
  };

  // Start session
  const handleStartSession = () => {
    if (mneName.trim().length > 0) {
      setIsMneSet(true);
      setErrors({});
    } else {
      setErrors({ mne: 'Please enter an MNE Group Name to proceed.' });
    }
  };

  // Full reset
  const handleFullReset = () => {
    if (window.confirm('Reset entire workspace? This clears all fields.')) {
      setActiveStep(1);
      setUnlockedSteps([1]);
      setS1Data({ income: '', taxes: '' });
      setS1Result(null);
      setS2Data({ payroll: '', assets: '' });
      setS2Result(null);
      setS3Data({ qdmtt: '' });
      setS3Result(null);
      setJurisdiction('');
      setErrors({});
      setCurrentDocId(null);
    }
  };

  // Reset for next calculation
  const handleResetForNext = () => {
    setActiveStep(1);
    setUnlockedSteps([1]);
    setS1Data({ income: '', taxes: '' });
    setS1Result(null);
    setS2Data({ payroll: '', assets: '' });
    setS2Result(null);
    setS3Data({ qdmtt: '' });
    setS3Result(null);
    setJurisdiction('');
    setErrors({});
    setCurrentDocId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step navigation
  const renderStepNav = () => (
    <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-4">
      {[
        { id: 1, label: '1. ETR Calculation', icon: Calculator },
        { id: 2, label: '2. SBIE Exclusion', icon: Factory },
        { id: 3, label: '3. Top-Up Tax', icon: Scale },
      ].map((step) => {
        const isUnlocked = unlockedSteps.includes(step.id);
        const isActive = activeStep === step.id;
        const isCompleted =
          (step.id === 1 && s1Result) ||
          (step.id === 2 && s2Result) ||
          (step.id === 3 && s3Result);
        return (
          <button
            key={step.id}
            onClick={() => isUnlocked && setActiveStep(step.id)}
            disabled={!isUnlocked}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all relative ${
              isActive
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : isUnlocked
                ? 'text-slate-600 hover:bg-slate-50'
                : 'text-slate-300 cursor-not-allowed'
            }`}
          >
            <step.icon className="w-4 h-4" />
            <span className="font-bold text-sm">{step.label}</span>
            {isCompleted && !isActive && (
              <CheckCircle className="w-4 h-4 text-green-500 ml-1" />
            )}
            {!isUnlocked && <Lock className="w-3 h-3 ml-1 opacity-50" />}
          </button>
        );
      })}
    </div>
  );

  // Currency input field
  const CurrencyInput = ({
    value,
    onChange,
    placeholder = '0.00',
  }: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  }) => (
    <div className="relative">
      <span className="absolute left-3 top-2.5 text-slate-400 font-bold">{symbol}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-8 p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 p-4 font-sans text-slate-800" ref={topRef}>
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden border border-slate-200 relative">
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Calculator className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">GloBE Calculator</h1>
                <p className="text-slate-400 text-sm">GIR-001 - Pillar Two</p>
              </div>
            </div>
            <div className="flex gap-3">
              {onSave && (
                <Button
                  onClick={() => handleSave(false)}
                  disabled={!isMneSet}
                  variant={saveStatus === 'saved' ? 'primary' : 'outline'}
                  size="sm"
                  className={
                    saveStatus === 'saved'
                      ? 'bg-green-600 text-white'
                      : 'border-slate-600 text-white hover:bg-slate-800'
                  }
                >
                  <Save className="w-4 h-4" />
                  {saveStatus === 'saving'
                    ? 'Saving...'
                    : saveStatus === 'saved'
                    ? 'Saved'
                    : 'Save'}
                </Button>
              )}

              {savedItems.length > 0 && (
                <Button
                  onClick={() => setIsLibraryOpen(true)}
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-white hover:bg-slate-800"
                >
                  <FolderOpen className="w-4 h-4" /> Library
                </Button>
              )}

              <button
                onClick={handleFullReset}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 px-3"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>
          </div>

          {/* Context Bar */}
          <div className="flex flex-col md:flex-row gap-4 text-sm bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-slate-800">
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                MNE Group
              </label>
              <input
                type="text"
                value={mneName}
                onChange={(e) => setMneName(e.target.value)}
                placeholder="Enter MNE Name"
                className="bg-transparent border-b border-slate-200 focus:border-blue-500 p-1 outline-none w-full font-bold text-lg text-slate-900 placeholder-slate-300"
              />
            </div>
            <div className="flex gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Jurisdiction
                </label>
                <input
                  type="text"
                  value={jurisdiction}
                  onChange={(e) => setJurisdiction(e.target.value)}
                  placeholder="e.g. Ireland"
                  className="bg-slate-50 border border-slate-200 rounded p-2 outline-none w-32 font-medium focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Fiscal Year
                </label>
                <select
                  value={fiscalYear}
                  onChange={(e) => {
                    setFiscalYear(e.target.value);
                    setS2Result(null);
                  }}
                  className="bg-slate-50 border border-slate-200 rounded p-2 outline-none cursor-pointer font-medium focus:ring-2 focus:ring-blue-100"
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded p-2 outline-none cursor-pointer font-medium focus:ring-2 focus:ring-blue-100"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} ({c.symbol})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {!isMneSet ? (
            /* Welcome Screen */
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">
                Welcome to GloBE Calculator
              </h2>
              <p className="text-slate-500 max-w-md mx-auto mb-6">
                Enter your MNE Group Name above to start a new session, or open the
                Library to load a previous calculation.
              </p>
              {errors.mne && (
                <p className="text-red-600 text-sm mb-4 flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4" /> {errors.mne}
                </p>
              )}
              <Button onClick={handleStartSession} variant="primary" size="lg">
                Start New Session
              </Button>
            </div>
          ) : (
            <>
              {errors.global && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> {errors.global}
                </div>
              )}
              {renderStepNav()}

              {/* Step 1: ETR */}
              {activeStep === 1 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg text-sm text-blue-800">
                        <p className="font-bold mb-1">Step 1: Determine ETR</p>
                        <p>
                          Enter Net GloBE Income and Taxes to check if Top-up Tax
                          applies.
                        </p>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">
                            GloBE Income
                          </label>
                          <CurrencyInput
                            value={s1Data.income}
                            onChange={(value) => {
                              setS1Data({ ...s1Data, income: value });
                              setS1Result(null);
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">
                            Adjusted Covered Taxes
                          </label>
                          <CurrencyInput
                            value={s1Data.taxes}
                            onChange={(value) => {
                              setS1Data({ ...s1Data, taxes: value });
                              setS1Result(null);
                            }}
                          />
                        </div>
                      </div>
                      {errors.s1 && (
                        <p className="text-red-600 text-sm flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" /> {errors.s1}
                        </p>
                      )}
                      <Button
                        onClick={calculateETR}
                        variant="primary"
                        className="w-full"
                      >
                        Calculate ETR
                      </Button>
                    </div>

                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 flex flex-col justify-center items-center text-center">
                      {!s1Result ? (
                        <div className="text-slate-400">
                          <Calculator className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>Enter values to calculate</p>
                        </div>
                      ) : (
                        <div className="w-full space-y-6">
                          <div
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold uppercase text-sm ${
                              s1Result.status === 'LOW_TAXED'
                                ? 'bg-red-100 text-red-700'
                                : s1Result.status === 'WARNING'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {s1Result.status.replace('_', ' ')}
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-4 rounded-lg border shadow-sm">
                              <p className="text-xs text-slate-500 font-bold">ETR</p>
                              <p className="text-3xl font-bold text-slate-800">
                                {s1Result.etr}%
                              </p>
                            </div>
                            <div className="bg-white p-4 rounded-lg border shadow-sm">
                              <p className="text-xs text-slate-500 font-bold">
                                Top-up %
                              </p>
                              <p className="text-3xl font-bold text-slate-800">
                                {s1Result.topUpPct}%
                              </p>
                            </div>
                          </div>
                          <Button
                            onClick={() => setActiveStep(2)}
                            variant="secondary"
                            className="w-full"
                          >
                            Proceed to Step 2 <ArrowRight className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: SBIE */}
              {activeStep === 2 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg text-sm text-indigo-800">
                        <p className="font-bold mb-1">Step 2: Substance Exclusion</p>
                        <p>
                          Rates for FY {fiscalYear}: Payroll{' '}
                          {getSBIERates(fiscalYear).payroll}%, Asset{' '}
                          {getSBIERates(fiscalYear).asset}%.
                        </p>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">
                            Eligible Payroll Costs
                          </label>
                          <CurrencyInput
                            value={s2Data.payroll}
                            onChange={(value) => {
                              setS2Data({ ...s2Data, payroll: value });
                              setS2Result(null);
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">
                            Eligible Tangible Assets
                          </label>
                          <CurrencyInput
                            value={s2Data.assets}
                            onChange={(value) => {
                              setS2Data({ ...s2Data, assets: value });
                              setS2Result(null);
                            }}
                          />
                        </div>
                      </div>
                      {errors.s2 && (
                        <p className="text-red-600 text-sm flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" /> {errors.s2}
                        </p>
                      )}
                      <Button
                        onClick={calculateSBIE}
                        variant="primary"
                        className="w-full bg-indigo-600 hover:bg-indigo-700"
                      >
                        Calculate SBIE
                      </Button>
                    </div>
                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 flex flex-col justify-center items-center">
                      {!s2Result ? (
                        <div className="text-slate-400 text-center">
                          <Factory className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>Calculate to see carve-out</p>
                        </div>
                      ) : (
                        <div className="w-full space-y-4">
                          <h3 className="font-bold text-slate-700 border-b pb-2">
                            SBIE Breakdown ({fiscalYear})
                          </h3>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-600">
                              Payroll ({s2Result.rates.payroll}%)
                            </span>
                            <span className="font-mono font-bold">
                              {symbol}
                              {formatMoney(s2Result.paySbie)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-600">
                              Assets ({s2Result.rates.asset}%)
                            </span>
                            <span className="font-mono font-bold">
                              {symbol}
                              {formatMoney(s2Result.astSbie)}
                            </span>
                          </div>
                          <div className="border-t pt-3 mt-2">
                            <div className="flex justify-between items-center bg-white p-3 rounded border border-indigo-100">
                              <span className="font-bold text-indigo-900">
                                Total SBIE
                              </span>
                              <span className="font-bold text-xl text-indigo-600">
                                {symbol}
                                {formatMoney(s2Result.totalSbie)}
                              </span>
                            </div>
                          </div>
                          <Button
                            onClick={() => setActiveStep(3)}
                            variant="secondary"
                            className="w-full mt-4"
                          >
                            Proceed to Step 3 <ArrowRight className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Top-Up Tax */}
              {activeStep === 3 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-lg text-sm text-emerald-800">
                        <p className="font-bold mb-1">Step 3: Final Liability</p>
                        <p>
                          Determine final Top-up Tax after SBIE and QDMTT offset.
                        </p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded border border-slate-200 space-y-2 text-sm">
                        <div className="flex justify-between text-slate-600">
                          <span>GloBE Income:</span>
                          <span className="font-mono">
                            {symbol}
                            {formatMoney(parseFloat(s1Data.income) || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Less Total SBIE:</span>
                          <span className="font-mono">
                            ({symbol}
                            {formatMoney(s2Result?.totalSbie || 0)})
                          </span>
                        </div>
                        <div className="flex justify-between font-bold text-slate-800 border-t pt-1 mt-1">
                          <span>Excess Profit (Est):</span>
                          <span className="font-mono">
                            {symbol}
                            {formatMoney(
                              Math.max(
                                0,
                                (parseFloat(s1Data.income) || 0) -
                                  (s2Result?.totalSbie || 0)
                              )
                            )}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">
                          QDMTT Amount (Optional)
                        </label>
                        <CurrencyInput
                          value={s3Data.qdmtt}
                          onChange={(value) => {
                            setS3Data({ ...s3Data, qdmtt: value });
                            setS3Result(null);
                          }}
                        />
                      </div>
                      {errors.s3 && (
                        <p className="text-red-600 text-sm flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" /> {errors.s3}
                        </p>
                      )}
                      <Button
                        onClick={calculateTopUp}
                        variant="primary"
                        className="w-full bg-emerald-600 hover:bg-emerald-700"
                      >
                        Calculate Final Tax
                      </Button>
                    </div>

                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 flex flex-col justify-center items-center">
                      {!s3Result ? (
                        <div className="text-slate-400 text-center">
                          <Scale className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>Ready to calculate liability</p>
                        </div>
                      ) : (
                        <div className="w-full space-y-5">
                          <div
                            className={`p-3 rounded text-center font-bold text-sm ${
                              s3Result.status === 'TOP_UP_DUE'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {s3Result.status.replace(/_/g, ' ')}
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-600">Excess Profit</span>
                              <span className="font-mono">
                                {symbol}
                                {formatMoney(s3Result.excessProfit)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">Top-up Rate</span>
                              <span className="font-mono">{s1Result?.topUpPct}%</span>
                            </div>
                            <div className="flex justify-between font-medium text-slate-800 border-t pt-1">
                              <span>Gross Top-up Tax</span>
                              <span className="font-mono">
                                {symbol}
                                {formatMoney(s3Result.grossTopUp)}
                              </span>
                            </div>
                            <div className="flex justify-between text-blue-600">
                              <span>Less: QDMTT</span>
                              <span className="font-mono">
                                ({symbol}
                                {formatMoney(s3Result.qdmttOffset)})
                              </span>
                            </div>
                          </div>
                          <div className="bg-slate-900 text-white p-4 rounded-lg text-center">
                            <p className="text-xs text-slate-400 uppercase font-bold mb-1">
                              Net Top-up Tax (IIR)
                            </p>
                            <p className="text-3xl font-bold text-emerald-400">
                              {symbol}
                              {formatMoney(s3Result.netTopUp)}
                            </p>
                          </div>

                          {onSave && (
                            <Button
                              onClick={() => handleSave(true)}
                              variant="primary"
                              className="w-full bg-emerald-600 hover:bg-emerald-700 mt-4"
                            >
                              <Save className="w-5 h-5" /> Save & Start New Calculation
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Library Slide-over */}
        {isLibraryOpen && (
          <div className="absolute inset-0 bg-white z-20 flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center shadow-md">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FolderOpen className="w-6 h-6" /> Calculation Library
              </h2>
              <button
                onClick={() => setIsLibraryOpen(false)}
                className="hover:bg-slate-700 p-2 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
              {savedItems.length === 0 ? (
                <div className="text-center text-slate-400 py-20">
                  <FolderOpen className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>No saved calculations yet.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {savedItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:border-blue-300 transition-colors flex justify-between items-center group"
                    >
                      <div>
                        <h3 className="font-bold text-slate-800">{item.mneName}</h3>
                        <div className="flex gap-3 text-xs text-slate-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Info className="w-3 h-3" />{' '}
                            {item.jurisdiction || 'No Jurisdiction'}
                          </span>
                          <span>-</span>
                          <span>FY {item.fiscalYear}</span>
                          <span>-</span>
                          <span>
                            {item.updatedAt
                              ? new Date(item.updatedAt).toLocaleDateString()
                              : 'Just now'}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleLoad(item)}
                          variant="outline"
                          size="sm"
                        >
                          Load
                        </Button>
                        {onDelete && (
                          <button
                            onClick={(e) => handleDelete(e, item.id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default GloBECalculator;
