'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import {
  Calendar,
  Clock,
  Info,
  RotateCcw,
  Building2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  Save,
  Trash2,
  Flag,
} from 'lucide-react';
import {
  JURISDICTIONS,
  parseDate,
  formatDate,
  addMonths,
  getDaysRemaining,
  calculateMilestones,
} from './utils';
import type {
  FilingDeadlineCalculatorProps,
  SavedDeadlineCalculation,
  FormData,
  CalculationResult,
} from './types';

const initialFormData: FormData = {
  fiscal_year_end: '',
  filing_jurisdiction: '',
  upe_location: '',
  is_first_filing: 'yes',
};

export function FilingDeadlineCalculator({
  userId,
  onSave,
  onDelete,
  savedItems = [],
}: FilingDeadlineCalculatorProps) {
  // Form state
  const [mneName, setMneName] = useState('');
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // UI state
  const [showMilestones, setShowMilestones] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const resultsRef = useRef<HTMLDivElement>(null);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (errors[name]) {
      setErrors(prev => {
        const newErrs = { ...prev };
        delete newErrs[name];
        return newErrs;
      });
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Quick date selection
  const setQuickDate = (dateStr: string) => {
    setFormData(prev => ({ ...prev, fiscal_year_end: dateStr }));
    setErrors(prev => ({ ...prev, fy: '' }));
  };

  // Calculate deadline
  const calculateDeadline = (): CalculationResult | null => {
    const newErrors: Record<string, string> = {};

    if (!mneName.trim()) newErrors.mne = 'MNE Group Name is required';
    if (!formData.fiscal_year_end) newErrors.fy = 'Fiscal Year End Date is required';
    if (!formData.filing_jurisdiction) newErrors.jur = 'Filing Jurisdiction is required';
    if (!formData.upe_location) newErrors.upe = 'UPE Location is required';

    if (formData.fiscal_year_end) {
      const fyDate = parseDate(formData.fiscal_year_end);
      const minDate = new Date(2023, 11, 31);
      if (fyDate && fyDate < minDate) {
        newErrors.fy = 'GIR applies to FY ending on/after 31 Dec 2024';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return null;
    }

    const fyEnd = parseDate(formData.fiscal_year_end)!;
    const isFirst = formData.is_first_filing === 'yes';

    // Calculate Standard Deadline (15m)
    const standardDeadline = addMonths(fyEnd, 15);

    // Calculate Applicable Deadline (18m if first year)
    const applicableDeadline = isFirst ? addMonths(fyEnd, 18) : standardDeadline;

    // Days Remaining
    const daysRemaining = getDaysRemaining(applicableDeadline);

    // Calculate Milestones
    const milestones = calculateMilestones(applicableDeadline);

    // Get jurisdiction data
    const jurisdiction = JURISDICTIONS.find(j => j.code === formData.filing_jurisdiction)!;

    const calcResult: CalculationResult = {
      fyEnd: fyEnd.toISOString(),
      standardDeadline: standardDeadline.toISOString(),
      applicableDeadline: applicableDeadline.toISOString(),
      isFirst,
      daysRemaining,
      jurisdiction,
      milestones,
    };

    setResult(calcResult);
    setErrors({});
    setShowMilestones(true);

    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    return calcResult;
  };

  // Save calculation
  const handleSave = async () => {
    if (!onSave || !mneName) return;

    let resultToSave = result;
    if (!resultToSave) {
      resultToSave = calculateDeadline();
      if (!resultToSave) return;
    }

    setIsSaving(true);
    try {
      await onSave({
        mneName,
        formData,
        result: resultToSave,
      });
    } catch (error) {
      console.error('Error saving calculation:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Load saved calculation
  const loadSaved = (saved: SavedDeadlineCalculation) => {
    setMneName(saved.mneName);
    setFormData(saved.formData);
    setResult(saved.result);
    setShowSaved(false);
    setErrors({});
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  // Delete saved calculation
  const handleDelete = async (id: string) => {
    if (!onDelete) return;
    try {
      await onDelete(id);
    } catch (error) {
      console.error('Error deleting calculation:', error);
    }
  };

  // Reset form
  const resetForm = () => {
    setMneName('');
    setFormData(initialFormData);
    setResult(null);
    setErrors({});
  };

  // Get urgency color
  const getUrgencyColor = (daysRemaining: number) => {
    if (daysRemaining > 180) return 'bg-emerald-500';
    if (daysRemaining > 90) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-mojitax-navy">Filing Deadline Calculator</h1>
            <p className="text-sm text-slate-500">GIR-003 - Compliance Timeline</p>
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

      {/* Saved Calculations */}
      {showSaved && savedItems.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-mojitax-navy mb-3">Saved Calculations</h3>
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
                      {saved.result?.jurisdiction?.name} - FYE {saved.formData.fiscal_year_end} -{' '}
                      {saved.result && saved.result.daysRemaining > 0 ? (
                        <span className="text-emerald-600">{saved.result.daysRemaining} days left</span>
                      ) : (
                        <span className="text-red-600">Overdue</span>
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

      <div className="grid md:grid-cols-12 gap-6">
        {/* Input Section */}
        <div className="md:col-span-5 space-y-6">
          {/* MNE Name */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4 text-purple-600" />
                <label className="text-sm font-bold text-slate-700">
                  MNE Group Name <span className="text-red-500">*</span>
                </label>
              </div>
              <input
                type="text"
                value={mneName}
                onChange={(e) => setMneName(e.target.value)}
                placeholder="Enter MNE Group Name"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.mne ? 'border-red-500 bg-red-50' : 'border-slate-300'
                }`}
              />
              {errors.mne && <p className="text-red-600 text-xs mt-1">{errors.mne}</p>}
            </CardContent>
          </Card>

          {/* Input Parameters */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                <Clock className="w-4 h-4 text-purple-600" /> Input Parameters
              </h2>

              {/* Fiscal Year End */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Fiscal Year End <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="fiscal_year_end"
                  value={formData.fiscal_year_end}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.fy ? 'border-red-500 bg-red-50' : 'border-slate-300'
                  }`}
                />
                {errors.fy && <p className="text-red-600 text-xs mt-1">{errors.fy}</p>}

                {/* Quick Selects */}
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setQuickDate('2024-12-31')}
                    className="text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 font-medium transition-colors"
                  >
                    Dec 2024
                  </button>
                  <button
                    onClick={() => setQuickDate('2025-03-31')}
                    className="text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 font-medium transition-colors"
                  >
                    Mar 2025
                  </button>
                  <button
                    onClick={() => setQuickDate('2025-06-30')}
                    className="text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 font-medium transition-colors"
                  >
                    Jun 2025
                  </button>
                </div>
              </div>

              {/* Filing Jurisdiction */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Filing Jurisdiction <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="filing_jurisdiction"
                    value={formData.filing_jurisdiction}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg appearance-none cursor-pointer focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.jur ? 'border-red-500 bg-red-50' : 'border-slate-300'
                    }`}
                  >
                    <option value="">Select...</option>
                    {JURISDICTIONS.map(j => (
                      <option key={j.code} value={j.code}>{j.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                {errors.jur && <p className="text-red-600 text-xs mt-1">{errors.jur}</p>}
              </div>

              {/* UPE Location */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  UPE Location <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="upe_location"
                    value={formData.upe_location}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg appearance-none cursor-pointer focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.upe ? 'border-red-500 bg-red-50' : 'border-slate-300'
                    }`}
                  >
                    <option value="">Select...</option>
                    {JURISDICTIONS.map(j => (
                      <option key={j.code} value={j.code}>{j.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                {errors.upe && <p className="text-red-600 text-xs mt-1">{errors.upe}</p>}
              </div>

              {/* First Filing */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="block text-sm font-bold text-slate-700 mb-2">First GIR Filing Year?</span>
                <div className="flex flex-col gap-2">
                  <label
                    className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                      formData.is_first_filing === 'yes'
                        ? 'bg-purple-100 border border-purple-200'
                        : 'hover:bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="is_first_filing"
                      value="yes"
                      checked={formData.is_first_filing === 'yes'}
                      onChange={handleInputChange}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <div>
                      <span className="block text-sm font-bold text-slate-800">Yes</span>
                      <span className="block text-xs text-slate-500">18-month transitional deadline</span>
                    </div>
                  </label>
                  <label
                    className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                      formData.is_first_filing === 'no'
                        ? 'bg-purple-100 border border-purple-200'
                        : 'hover:bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="is_first_filing"
                      value="no"
                      checked={formData.is_first_filing === 'no'}
                      onChange={handleInputChange}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <div>
                      <span className="block text-sm font-bold text-slate-800">No</span>
                      <span className="block text-xs text-slate-500">Standard 15-month deadline</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button onClick={calculateDeadline} className="flex-1 bg-purple-600 hover:bg-purple-700">
                  <Clock className="w-4 h-4 mr-2" /> Calculate Deadline
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>

              {onSave && mneName && (
                <Button
                  variant="outline"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Calculation'}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div className="md:col-span-7" ref={resultsRef}>
          {!result ? (
            <Card className="h-full min-h-[500px] border-dashed">
              <CardContent className="flex flex-col items-center justify-center h-full text-slate-400 p-10">
                <Calendar className="w-16 h-16 text-slate-300 mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-1">Deadline Calculator</h3>
                <p className="text-sm text-center max-w-xs">
                  Enter your fiscal year information to see deadlines and milestones.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              {/* Hero Deadline Section */}
              <div className="bg-slate-900 text-white p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500"></div>
                <p className="text-purple-200 text-xs font-bold uppercase tracking-widest mb-2">
                  Your Filing Deadline
                </p>
                <h2 className="text-4xl font-bold mb-4">{formatDate(result.applicableDeadline)}</h2>

                {/* Days Remaining Indicator */}
                <div
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold shadow-lg text-white ${getUrgencyColor(
                    result.daysRemaining
                  )}`}
                >
                  {result.daysRemaining > 180 ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                  {result.daysRemaining > 0
                    ? `${result.daysRemaining} Days Remaining`
                    : result.daysRemaining === 0
                    ? 'Deadline is TODAY'
                    : `${Math.abs(result.daysRemaining)} Days OVERDUE`}
                </div>

                <div className="mt-4 text-xs text-slate-400">
                  {result.isFirst
                    ? 'Includes 18-month transitional extension'
                    : 'Standard 15-month deadline applied'}
                </div>
              </div>

              <CardContent className="p-6 space-y-6">
                {/* Jurisdiction Info */}
                <div className="bg-purple-50 rounded-xl p-5 border border-purple-100">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-purple-600" />
                      <h3 className="font-bold text-purple-900">{result.jurisdiction.name} Information</h3>
                    </div>
                    <span className="text-xs bg-white text-purple-700 px-2 py-1 rounded border border-purple-200 font-bold">
                      {result.jurisdiction.authority}
                    </span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 text-sm text-purple-800">
                    <div>
                      <span className="font-bold block mb-1 text-xs uppercase opacity-70">Filing Portal</span>
                      {result.jurisdiction.portal}
                    </div>
                    <div>
                      <span className="font-bold block mb-1 text-xs uppercase opacity-70">Key Notes</span>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        {result.jurisdiction.notes.map((note, i) => (
                          <li key={i}>{note}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Milestones Timeline */}
                <div>
                  <button
                    onClick={() => setShowMilestones(!showMilestones)}
                    className="w-full flex items-center justify-between p-3 bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors group"
                  >
                    <span className="font-bold text-slate-700 flex items-center gap-2 text-sm uppercase tracking-wider">
                      <Clock className="w-4 h-4 text-purple-500" /> Recommended Milestones
                    </span>
                    {showMilestones ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {showMilestones && (
                    <div className="mt-6 relative border-l-2 border-slate-200 ml-4 space-y-8 pl-8 pb-4">
                      {result.milestones.map((m, idx) => (
                        <div key={idx} className="relative group">
                          {/* Dot on timeline */}
                          <div
                            className={`absolute -left-[39px] top-1 w-4 h-4 rounded-full border-2 transition-colors ${
                              m.daysAway < 0
                                ? 'bg-slate-200 border-slate-300'
                                : m.isDeadline
                                ? 'bg-purple-600 border-purple-600'
                                : 'bg-white border-purple-400 group-hover:bg-purple-50'
                            }`}
                          ></div>

                          <div
                            className={`flex justify-between items-start ${
                              m.daysAway < 0 ? 'opacity-50 grayscale' : ''
                            }`}
                          >
                            <div>
                              <h4
                                className={`font-bold text-sm ${
                                  m.isDeadline ? 'text-purple-700' : 'text-slate-800'
                                }`}
                              >
                                {m.name}
                              </h4>
                              <p className="text-xs text-slate-500 mt-0.5">{m.desc}</p>
                            </div>
                            <div className="text-right min-w-[80px]">
                              <span className="block font-mono text-xs font-bold text-slate-700">
                                {formatDate(m.date)}
                              </span>
                              <span
                                className={`text-[10px] font-bold ${
                                  m.daysAway < 0
                                    ? 'text-slate-400'
                                    : m.daysAway < 30
                                    ? 'text-red-500'
                                    : 'text-emerald-600'
                                }`}
                              >
                                {m.daysAway < 0 ? 'Passed' : `${m.daysAway} days`}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Info Note */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium text-blue-800 mb-1">About GIR Filing</p>
                    <p>
                      The GloBE Information Return (GIR) must be filed by one Constituent Entity on behalf of
                      the MNE Group. The filing entity should be in the jurisdiction of the UPE unless an
                      alternative arrangement is in place.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default FilingDeadlineCalculator;
