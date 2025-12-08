'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Shield,
  CheckCircle2,
  XCircle,
  Info,
  Trash2,
  Save,
  Clock,
  Building2,
  Globe,
  Calendar,
  Coins,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import {
  CURRENCIES,
  YEARS,
  DE_MINIMIS_REVENUE_THRESHOLD,
  DE_MINIMIS_PROFIT_THRESHOLD,
  getCurrencySymbol,
  formatMoney,
  getTransitionRate,
  getSBIERates,
  round,
  parseNumeric,
} from './utils';
import type {
  SafeHarbourQualifierProps,
  SavedAssessment,
  DeMinimisData,
  SimplifiedETRData,
  RoutineProfitsData,
  DeMinimisResult,
  SimplifiedETRResult,
  RoutineProfitsResult,
  SafeHarbourResult,
} from './types';

const initialDeMinimisData: DeMinimisData = {
  totalRevenue: '',
  profitBeforeTax: '',
};

const initialSimplifiedETRData: SimplifiedETRData = {
  simplifiedCoveredTaxes: '',
  profitBeforeTax: '',
};

const initialRoutineProfitsData: RoutineProfitsData = {
  profitBeforeTax: '',
  eligiblePayroll: '',
  tangibleAssets: '',
};

export function SafeHarbourQualifier({
  userId,
  onSave,
  onDelete,
  savedItems = [],
}: SafeHarbourQualifierProps) {
  // Form state
  const [mneName, setMneName] = useState('');
  const [jurisdiction, setJurisdiction] = useState('');
  const [fiscalYear, setFiscalYear] = useState('2024');
  const [currency, setCurrency] = useState('EUR');

  // Test data
  const [deMinimisData, setDeMinimisData] = useState<DeMinimisData>(initialDeMinimisData);
  const [simplifiedETRData, setSimplifiedETRData] = useState<SimplifiedETRData>(initialSimplifiedETRData);
  const [routineProfitsData, setRoutineProfitsData] = useState<RoutineProfitsData>(initialRoutineProfitsData);

  // Results
  const [result, setResult] = useState<SafeHarbourResult | null>(null);

  // UI state
  const [expandedTests, setExpandedTests] = useState<string[]>(['de_minimis', 'simplified_etr', 'routine_profits']);
  const [showSaved, setShowSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const currencySymbol = getCurrencySymbol(currency);

  // Toggle test expansion
  const toggleTest = (testId: string) => {
    setExpandedTests(prev =>
      prev.includes(testId)
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    );
  };

  // Calculate De Minimis Test
  const calculateDeMinimis = useCallback((): DeMinimisResult => {
    const revenue = parseNumeric(deMinimisData.totalRevenue);
    const profit = parseNumeric(deMinimisData.profitBeforeTax);

    const meetsRevenue = revenue < DE_MINIMIS_REVENUE_THRESHOLD;
    const meetsProfit = Math.abs(profit) < DE_MINIMIS_PROFIT_THRESHOLD;

    return {
      revenueThreshold: DE_MINIMIS_REVENUE_THRESHOLD,
      profitThreshold: DE_MINIMIS_PROFIT_THRESHOLD,
      meetsRevenue,
      meetsProfit,
      qualifies: meetsRevenue && meetsProfit,
    };
  }, [deMinimisData]);

  // Calculate Simplified ETR Test
  const calculateSimplifiedETR = useCallback((): SimplifiedETRResult => {
    const taxes = parseNumeric(simplifiedETRData.simplifiedCoveredTaxes);
    const profit = parseNumeric(simplifiedETRData.profitBeforeTax);
    const transitionRate = getTransitionRate(fiscalYear);

    if (profit <= 0) {
      return {
        calculatedETR: 0,
        transitionRate,
        qualifies: true, // Loss-making jurisdictions qualify
        status: 'LOSS_MAKING',
      };
    }

    const calculatedETR = round((taxes / profit) * 100, 2);
    const qualifies = calculatedETR >= transitionRate;

    return {
      calculatedETR,
      transitionRate,
      qualifies,
      status: qualifies ? 'ABOVE_THRESHOLD' : 'BELOW_THRESHOLD',
    };
  }, [simplifiedETRData, fiscalYear]);

  // Calculate Routine Profits Test
  const calculateRoutineProfits = useCallback((): RoutineProfitsResult => {
    const profit = parseNumeric(routineProfitsData.profitBeforeTax);
    const payroll = parseNumeric(routineProfitsData.eligiblePayroll);
    const assets = parseNumeric(routineProfitsData.tangibleAssets);

    const rates = getSBIERates(fiscalYear);
    const sbiePayroll = round(payroll * (rates.payroll / 100), 2);
    const sbieAssets = round(assets * (rates.asset / 100), 2);
    const totalSBIE = round(sbiePayroll + sbieAssets, 2);

    const profitExceedsSBIE = profit > totalSBIE;

    return {
      sbiePayroll,
      sbieAssets,
      totalSBIE,
      profitExceedsSBIE,
      qualifies: !profitExceedsSBIE || profit <= 0,
    };
  }, [routineProfitsData, fiscalYear]);

  // Run full assessment
  const runAssessment = () => {
    const deMinimis = calculateDeMinimis();
    const simplifiedETR = calculateSimplifiedETR();
    const routineProfits = calculateRoutineProfits();

    let qualifyingTest: 'de_minimis' | 'simplified_etr' | 'routine_profits' | null = null;

    if (deMinimis.qualifies) {
      qualifyingTest = 'de_minimis';
    } else if (simplifiedETR.qualifies) {
      qualifyingTest = 'simplified_etr';
    } else if (routineProfits.qualifies) {
      qualifyingTest = 'routine_profits';
    }

    setResult({
      deMinimis,
      simplifiedETR,
      routineProfits,
      overallQualifies: qualifyingTest !== null,
      qualifyingTest,
    });
  };

  // Save assessment
  const handleSave = async () => {
    if (!onSave || !mneName || !jurisdiction) return;

    setIsSaving(true);
    try {
      await onSave({
        mneName,
        jurisdiction,
        fiscalYear,
        currency,
        deMinimisData,
        simplifiedETRData,
        routineProfitsData,
        result,
      });
    } catch (error) {
      console.error('Error saving assessment:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Load saved assessment
  const loadSaved = (saved: SavedAssessment) => {
    setMneName(saved.mneName);
    setJurisdiction(saved.jurisdiction);
    setFiscalYear(saved.fiscalYear);
    setCurrency(saved.currency);
    setDeMinimisData(saved.deMinimisData);
    setSimplifiedETRData(saved.simplifiedETRData);
    setRoutineProfitsData(saved.routineProfitsData);
    setResult(saved.result);
    setShowSaved(false);
  };

  // Delete saved assessment
  const handleDelete = async (id: string) => {
    if (!onDelete) return;
    try {
      await onDelete(id);
    } catch (error) {
      console.error('Error deleting assessment:', error);
    }
  };

  // Reset form
  const resetForm = () => {
    setMneName('');
    setJurisdiction('');
    setFiscalYear('2024');
    setCurrency('EUR');
    setDeMinimisData(initialDeMinimisData);
    setSimplifiedETRData(initialSimplifiedETRData);
    setRoutineProfitsData(initialRoutineProfitsData);
    setResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
            <Shield className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-mojitax-navy">Safe Harbour Qualifier</h1>
            <p className="text-sm text-slate-500">
              Transitional CbCR Safe Harbour Assessment (2024-2026)
            </p>
          </div>
        </div>
        {savedItems.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSaved(!showSaved)}
          >
            <Clock className="w-4 h-4 mr-2" />
            Saved ({savedItems.length})
          </Button>
        )}
      </div>

      {/* Saved Assessments */}
      {showSaved && savedItems.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-mojitax-navy mb-3">Saved Assessments</h3>
            <div className="space-y-2">
              {savedItems.map((saved) => (
                <div
                  key={saved.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <button
                    onClick={() => loadSaved(saved)}
                    className="flex-1 text-left"
                  >
                    <p className="font-medium text-mojitax-navy">{saved.mneName}</p>
                    <p className="text-sm text-slate-500">
                      {saved.jurisdiction} • FY{saved.fiscalYear} •{' '}
                      {saved.result?.overallQualifies ? (
                        <span className="text-emerald-600">Qualifies</span>
                      ) : (
                        <span className="text-red-600">Does Not Qualify</span>
                      )}
                    </p>
                  </button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(saved.id)}
                  >
                    <Trash2 className="w-4 h-4 text-slate-400" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Entity Information */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-mojitax-navy mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-slate-400" />
            Entity Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                MNE Group Name
              </label>
              <input
                type="text"
                value={mneName}
                onChange={(e) => setMneName(e.target.value)}
                placeholder="Enter MNE group name"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-mojitax-green focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                <Globe className="w-4 h-4" />
                Jurisdiction
              </label>
              <input
                type="text"
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                placeholder="e.g., Ireland, Singapore"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-mojitax-green focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Fiscal Year
              </label>
              <select
                value={fiscalYear}
                onChange={(e) => setFiscalYear(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-mojitax-green focus:border-transparent"
              >
                {YEARS.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                <Coins className="w-4 h-4" />
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-mojitax-green focus:border-transparent"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.symbol} {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Banner */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-blue-800 mb-1">Transitional CbCR Safe Harbour</p>
          <p className="text-sm text-blue-700">
            If <strong>any one</strong> of the three tests below is satisfied, the jurisdiction qualifies for the
            safe harbour and no top-up tax is due for that jurisdiction. The safe harbour applies for fiscal years
            2024-2026 based on qualifying CbCR data.
          </p>
        </div>
      </div>

      {/* Test 1: De Minimis */}
      <Card>
        <div
          className="px-6 py-4 border-b border-slate-100 flex items-center justify-between cursor-pointer"
          onClick={() => toggleTest('de_minimis')}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-sm font-bold text-amber-700">
              1
            </div>
            <div>
              <h3 className="font-semibold text-mojitax-navy">De Minimis Test</h3>
              <p className="text-sm text-slate-500">
                Revenue &lt; €10M AND Profit &lt; €1M
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {result?.deMinimis && (
              <Badge variant={result.deMinimis.qualifies ? 'success' : 'default'}>
                {result.deMinimis.qualifies ? 'QUALIFIES' : 'DOES NOT QUALIFY'}
              </Badge>
            )}
            {expandedTests.includes('de_minimis') ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </div>
        {expandedTests.includes('de_minimis') && (
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Total Revenue ({currencySymbol})
                </label>
                <input
                  type="text"
                  value={deMinimisData.totalRevenue}
                  onChange={(e) =>
                    setDeMinimisData({ ...deMinimisData, totalRevenue: e.target.value })
                  }
                  placeholder="0"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-mojitax-green focus:border-transparent"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Threshold: {currencySymbol}{formatMoney(DE_MINIMIS_REVENUE_THRESHOLD)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Profit Before Tax ({currencySymbol})
                </label>
                <input
                  type="text"
                  value={deMinimisData.profitBeforeTax}
                  onChange={(e) =>
                    setDeMinimisData({ ...deMinimisData, profitBeforeTax: e.target.value })
                  }
                  placeholder="0"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-mojitax-green focus:border-transparent"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Threshold: {currencySymbol}{formatMoney(DE_MINIMIS_PROFIT_THRESHOLD)}
                </p>
              </div>
            </div>
            {result?.deMinimis && (
              <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    {result.deMinimis.meetsRevenue ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span>Revenue below threshold</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.deMinimis.meetsProfit ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span>Profit below threshold</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Test 2: Simplified ETR */}
      <Card>
        <div
          className="px-6 py-4 border-b border-slate-100 flex items-center justify-between cursor-pointer"
          onClick={() => toggleTest('simplified_etr')}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700">
              2
            </div>
            <div>
              <h3 className="font-semibold text-mojitax-navy">Simplified ETR Test</h3>
              <p className="text-sm text-slate-500">
                Simplified ETR ≥ {getTransitionRate(fiscalYear)}% transition rate
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {result?.simplifiedETR && (
              <Badge
                variant={
                  result.simplifiedETR.qualifies
                    ? result.simplifiedETR.status === 'LOSS_MAKING'
                      ? 'warning'
                      : 'success'
                    : 'default'
                }
              >
                {result.simplifiedETR.status === 'LOSS_MAKING'
                  ? 'LOSS MAKING'
                  : result.simplifiedETR.qualifies
                  ? 'QUALIFIES'
                  : 'DOES NOT QUALIFY'}
              </Badge>
            )}
            {expandedTests.includes('simplified_etr') ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </div>
        {expandedTests.includes('simplified_etr') && (
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Simplified Covered Taxes ({currencySymbol})
                </label>
                <input
                  type="text"
                  value={simplifiedETRData.simplifiedCoveredTaxes}
                  onChange={(e) =>
                    setSimplifiedETRData({
                      ...simplifiedETRData,
                      simplifiedCoveredTaxes: e.target.value,
                    })
                  }
                  placeholder="0"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-mojitax-green focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Profit Before Tax ({currencySymbol})
                </label>
                <input
                  type="text"
                  value={simplifiedETRData.profitBeforeTax}
                  onChange={(e) =>
                    setSimplifiedETRData({
                      ...simplifiedETRData,
                      profitBeforeTax: e.target.value,
                    })
                  }
                  placeholder="0"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-mojitax-green focus:border-transparent"
                />
              </div>
            </div>
            <div className="mt-3 p-3 bg-slate-50 rounded-lg flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-600">
                The transition rate is {getTransitionRate(fiscalYear)}% for fiscal year {fiscalYear}.
                Loss-making jurisdictions automatically qualify for this test.
              </p>
            </div>
            {result?.simplifiedETR && (
              <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Calculated ETR:</span>
                    <span className="ml-2 font-semibold">
                      {result.simplifiedETR.status === 'LOSS_MAKING'
                        ? 'N/A (Loss)'
                        : `${result.simplifiedETR.calculatedETR}%`}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Transition Rate:</span>
                    <span className="ml-2 font-semibold">{result.simplifiedETR.transitionRate}%</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Test 3: Routine Profits */}
      <Card>
        <div
          className="px-6 py-4 border-b border-slate-100 flex items-center justify-between cursor-pointer"
          onClick={() => toggleTest('routine_profits')}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-sm font-bold text-purple-700">
              3
            </div>
            <div>
              <h3 className="font-semibold text-mojitax-navy">Routine Profits Test</h3>
              <p className="text-sm text-slate-500">Profit ≤ SBIE (Substance-Based Income Exclusion)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {result?.routineProfits && (
              <Badge variant={result.routineProfits.qualifies ? 'success' : 'default'}>
                {result.routineProfits.qualifies ? 'QUALIFIES' : 'DOES NOT QUALIFY'}
              </Badge>
            )}
            {expandedTests.includes('routine_profits') ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </div>
        {expandedTests.includes('routine_profits') && (
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Profit Before Tax ({currencySymbol})
                </label>
                <input
                  type="text"
                  value={routineProfitsData.profitBeforeTax}
                  onChange={(e) =>
                    setRoutineProfitsData({
                      ...routineProfitsData,
                      profitBeforeTax: e.target.value,
                    })
                  }
                  placeholder="0"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-mojitax-green focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Eligible Payroll Costs ({currencySymbol})
                </label>
                <input
                  type="text"
                  value={routineProfitsData.eligiblePayroll}
                  onChange={(e) =>
                    setRoutineProfitsData({
                      ...routineProfitsData,
                      eligiblePayroll: e.target.value,
                    })
                  }
                  placeholder="0"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-mojitax-green focus:border-transparent"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Rate: {getSBIERates(fiscalYear).payroll}%
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tangible Assets ({currencySymbol})
                </label>
                <input
                  type="text"
                  value={routineProfitsData.tangibleAssets}
                  onChange={(e) =>
                    setRoutineProfitsData({
                      ...routineProfitsData,
                      tangibleAssets: e.target.value,
                    })
                  }
                  placeholder="0"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-mojitax-green focus:border-transparent"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Rate: {getSBIERates(fiscalYear).asset}%
                </p>
              </div>
            </div>
            {result?.routineProfits && (
              <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500 block">Payroll SBIE:</span>
                    <span className="font-semibold">
                      {currencySymbol}{formatMoney(result.routineProfits.sbiePayroll)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Asset SBIE:</span>
                    <span className="font-semibold">
                      {currencySymbol}{formatMoney(result.routineProfits.sbieAssets)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Total SBIE:</span>
                    <span className="font-semibold">
                      {currencySymbol}{formatMoney(result.routineProfits.totalSBIE)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.routineProfits.qualifies ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span>{result.routineProfits.qualifies ? 'Profit ≤ SBIE' : 'Profit > SBIE'}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={runAssessment} className="flex-1">
          <Shield className="w-4 h-4 mr-2" />
          Run Safe Harbour Assessment
        </Button>
        {onSave && mneName && jurisdiction && (
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Assessment'}
          </Button>
        )}
        <Button variant="ghost" onClick={resetForm}>
          Reset
        </Button>
      </div>

      {/* Overall Result */}
      {result && (
        <Card
          className={`border-2 ${
            result.overallQualifies
              ? 'border-emerald-300 bg-emerald-50'
              : 'border-red-300 bg-red-50'
          }`}
        >
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  result.overallQualifies ? 'bg-emerald-100' : 'bg-red-100'
                }`}
              >
                {result.overallQualifies ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600" />
                )}
              </div>
              <div className="flex-1">
                <h3
                  className={`text-xl font-bold ${
                    result.overallQualifies ? 'text-emerald-800' : 'text-red-800'
                  }`}
                >
                  {result.overallQualifies
                    ? 'Safe Harbour Applies'
                    : 'Safe Harbour Does Not Apply'}
                </h3>
                <p
                  className={`mt-1 ${
                    result.overallQualifies ? 'text-emerald-700' : 'text-red-700'
                  }`}
                >
                  {result.overallQualifies ? (
                    <>
                      This jurisdiction qualifies for the Transitional CbCR Safe Harbour based on the{' '}
                      <strong>
                        {result.qualifyingTest === 'de_minimis' && 'De Minimis Test'}
                        {result.qualifyingTest === 'simplified_etr' && 'Simplified ETR Test'}
                        {result.qualifyingTest === 'routine_profits' && 'Routine Profits Test'}
                      </strong>
                      . No top-up tax is due for fiscal year {fiscalYear}.
                    </>
                  ) : (
                    <>
                      This jurisdiction does not meet any of the three safe harbour tests. A full GloBE
                      calculation will be required to determine any top-up tax liability.
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Test Summary */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                className={`p-4 rounded-lg ${
                  result.deMinimis?.qualifies ? 'bg-emerald-100' : 'bg-white'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {result.deMinimis?.qualifies ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-slate-400" />
                  )}
                  <span className="font-medium text-sm">De Minimis Test</span>
                </div>
                <p className="text-xs text-slate-600">
                  {result.deMinimis?.qualifies
                    ? 'Revenue and profit below thresholds'
                    : 'Thresholds exceeded'}
                </p>
              </div>
              <div
                className={`p-4 rounded-lg ${
                  result.simplifiedETR?.qualifies ? 'bg-emerald-100' : 'bg-white'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {result.simplifiedETR?.qualifies ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-slate-400" />
                  )}
                  <span className="font-medium text-sm">Simplified ETR Test</span>
                </div>
                <p className="text-xs text-slate-600">
                  {result.simplifiedETR?.status === 'LOSS_MAKING'
                    ? 'Loss-making jurisdiction'
                    : result.simplifiedETR?.qualifies
                    ? `ETR ${result.simplifiedETR.calculatedETR}% ≥ ${result.simplifiedETR.transitionRate}%`
                    : `ETR ${result.simplifiedETR?.calculatedETR}% < ${result.simplifiedETR?.transitionRate}%`}
                </p>
              </div>
              <div
                className={`p-4 rounded-lg ${
                  result.routineProfits?.qualifies ? 'bg-emerald-100' : 'bg-white'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {result.routineProfits?.qualifies ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-slate-400" />
                  )}
                  <span className="font-medium text-sm">Routine Profits Test</span>
                </div>
                <p className="text-xs text-slate-600">
                  {result.routineProfits?.qualifies
                    ? 'Profit within SBIE allowance'
                    : 'Profit exceeds SBIE allowance'}
                </p>
              </div>
            </div>

            {/* Warning for non-qualifying */}
            {!result.overallQualifies && (
              <div className="mt-4 p-3 bg-amber-100 rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  Consider using the GloBE Calculator tool to determine the jurisdiction&apos;s ETR and
                  potential top-up tax liability.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default SafeHarbourQualifier;
