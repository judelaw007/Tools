'use client';

import React, { useState, useMemo } from 'react';
import {
  Save,
  FolderOpen,
  Calculator,
  CheckCircle,
  AlertTriangle,
  Plus,
  Trash2,
  Info,
  Building,
  Globe,
  FileText,
  ChevronDown,
  ChevronUp,
  Layout,
  Star,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type {
  MNEInfo,
  DFECandidate,
  ScoredCandidate,
  DFEAssessmentToolProps,
  SavedDFEAssessment,
} from './types';
import {
  PILLAR_TWO_STATUS_OPTIONS,
  SYSTEMS_CAPABILITY_OPTIONS,
  ADVISOR_SUPPORT_OPTIONS,
  JURISDICTIONS,
  INITIAL_MNE_INFO,
  INITIAL_CANDIDATE,
  CASE_STUDY_MNE_INFO,
  CASE_STUDY_CANDIDATES,
  calculateScore,
  determineRecommendationStatus,
  getOptionLabel,
} from './utils';

export function DFEAssessmentTool({
  onSave,
  onDelete,
  savedItems = [],
}: DFEAssessmentToolProps) {
  // State
  const [mneInfo, setMneInfo] = useState<MNEInfo>(INITIAL_MNE_INFO);
  const [candidates, setCandidates] = useState<DFECandidate[]>([]);
  const [viewMode, setViewMode] = useState<'INPUT' | 'RESULTS'>('INPUT');
  const [expandedCandidate, setExpandedCandidate] = useState<string | null>(
    null
  );
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [sessionName, setSessionName] = useState('');

  // --- Actions ---

  const addCandidate = () => {
    const newId = `C${Date.now()}`;
    setCandidates([...candidates, { ...INITIAL_CANDIDATE, id: newId }]);
    setExpandedCandidate(newId);
  };

  const removeCandidate = (id: string) => {
    setCandidates(candidates.filter((c) => c.id !== id));
    if (expandedCandidate === id) setExpandedCandidate(null);
  };

  const updateCandidate = (
    id: string,
    field: keyof DFECandidate,
    value: string | number | boolean
  ) => {
    setCandidates(
      candidates.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const loadCaseStudy = () => {
    if (
      !window.confirm('Replace current data with GlobalTech Case Study?')
    )
      return;

    setMneInfo(CASE_STUDY_MNE_INFO);
    setCandidates(CASE_STUDY_CANDIDATES);
    setViewMode('INPUT');
  };

  const handleSaveSession = async () => {
    if (!onSave) return;
    const name =
      sessionName ||
      `${mneInfo.mneGroupName || 'Untitled'} - ${new Date().toLocaleDateString()}`;
    try {
      await onSave({
        name,
        mneInfo,
        candidates,
      });
      setSessionName('');
      alert('Assessment saved successfully.');
    } catch {
      alert('Save failed.');
    }
  };

  const loadSession = (session: SavedDFEAssessment) => {
    setMneInfo(session.mneInfo);
    setCandidates(session.candidates);
    setViewMode('INPUT');
    setShowLoadModal(false);
  };

  // --- Assessment Logic ---

  const processedResults: ScoredCandidate[] = useMemo(() => {
    // 1. Calculate Scores
    const scoredCandidates = candidates.map((c) => ({
      ...c,
      score: calculateScore(c),
      status: 'ALTERNATIVE' as const,
      color: 'text-amber-600',
      bg: 'bg-amber-100',
    }));

    // 2. Sort by Score Descending
    scoredCandidates.sort((a, b) => b.score - a.score);

    // 3. Determine Recommendations
    return scoredCandidates.map((c, index) => {
      const isTop = index === 0;
      let statusObj = determineRecommendationStatus(
        c.score,
        c.pillarTwoStatus,
        isTop
      );

      // Downgrade logic if multiple qualify as recommended
      if (statusObj.status === 'RECOMMENDED' && !isTop) {
        statusObj = {
          status: 'ALTERNATIVE',
          color: 'text-amber-600',
          bg: 'bg-amber-100',
        };
      }

      return { ...c, ...statusObj };
    });
  }, [candidates]);

  const recommendedDFE = processedResults.find(
    (r) => r.status === 'RECOMMENDED'
  );

  // --- Renderers ---

  const renderInputForm = () => (
    <div className="space-y-8">
      {/* MNE Group Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="w-5 h-5 mr-2 text-mojitax-green" />
            MNE Group Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                MNE Group Name
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-mojitax-green focus:border-mojitax-green"
                value={mneInfo.mneGroupName}
                onChange={(e) =>
                  setMneInfo({ ...mneInfo, mneGroupName: e.target.value })
                }
                placeholder="e.g. GlobalTech Manufacturing Group"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                UPE Jurisdiction
              </label>
              <div className="relative">
                <select
                  className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-mojitax-green focus:border-mojitax-green appearance-none"
                  value={mneInfo.upeJurisdiction}
                  onChange={(e) =>
                    setMneInfo({ ...mneInfo, upeJurisdiction: e.target.value })
                  }
                >
                  <option value="">Select Jurisdiction...</option>
                  {JURISDICTIONS.map((j) => (
                    <option key={j} value={j}>
                      {j}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div className="flex items-center space-x-4 pt-6">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded text-mojitax-green focus:ring-mojitax-green h-4 w-4"
                  checked={mneInfo.upeLocalFiling}
                  onChange={(e) =>
                    setMneInfo({ ...mneInfo, upeLocalFiling: e.target.checked })
                  }
                />
                <span className="ml-2 text-sm text-slate-700">
                  UPE Local Filing Required?
                </span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Total Jurisdictions (for Notification)
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-mojitax-green focus:border-mojitax-green"
                value={mneInfo.totalJurisdictions}
                onChange={(e) =>
                  setMneInfo({
                    ...mneInfo,
                    totalJurisdictions: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Reporting Fiscal Year
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-mojitax-green focus:border-mojitax-green"
                value={mneInfo.fiscalYear}
                onChange={(e) =>
                  setMneInfo({
                    ...mneInfo,
                    fiscalYear: parseInt(e.target.value) || 2024,
                  })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DFE Candidates */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800 flex items-center">
            <Building className="w-5 h-5 mr-2 text-mojitax-green" />
            DFE Candidates
          </h2>
          <Button onClick={addCandidate} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" /> Add Candidate
          </Button>
        </div>

        {candidates.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-slate-300">
            <p className="text-slate-500 mb-2">No candidates added yet.</p>
            <button
              onClick={addCandidate}
              className="text-mojitax-green hover:text-mojitax-green/80 font-medium"
            >
              Add your first DFE candidate
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {candidates.map((candidate, idx) => (
            <Card key={candidate.id} className="overflow-hidden">
              {/* Header / Summary Row */}
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50"
                onClick={() =>
                  setExpandedCandidate(
                    expandedCandidate === candidate.id ? null : candidate.id
                  )
                }
              >
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                    {idx + 1}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {candidate.entityName || 'New Entity'}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center">
                      {candidate.jurisdiction || 'No Jurisdiction'}
                      {candidate.isUPE && (
                        <span className="ml-2 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold">
                          UPE
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {expandedCandidate === candidate.id ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Expanded Edit Form */}
              {expandedCandidate === candidate.id && (
                <div className="p-6 border-t border-slate-100 bg-slate-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                        Entity Name
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-mojitax-green focus:border-mojitax-green"
                        value={candidate.entityName}
                        onChange={(e) =>
                          updateCandidate(
                            candidate.id,
                            'entityName',
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                        Jurisdiction
                      </label>
                      <select
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-mojitax-green focus:border-mojitax-green"
                        value={candidate.jurisdiction}
                        onChange={(e) =>
                          updateCandidate(
                            candidate.id,
                            'jurisdiction',
                            e.target.value
                          )
                        }
                      >
                        <option value="">Select...</option>
                        {JURISDICTIONS.map((j) => (
                          <option key={j} value={j}>
                            {j}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                        Pillar Two Status
                      </label>
                      <select
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-mojitax-green focus:border-mojitax-green"
                        value={candidate.pillarTwoStatus}
                        onChange={(e) =>
                          updateCandidate(
                            candidate.id,
                            'pillarTwoStatus',
                            e.target.value
                          )
                        }
                      >
                        {PILLAR_TWO_STATUS_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                        Systems Capability
                      </label>
                      <select
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-mojitax-green focus:border-mojitax-green"
                        value={candidate.systemsCapability}
                        onChange={(e) =>
                          updateCandidate(
                            candidate.id,
                            'systemsCapability',
                            e.target.value
                          )
                        }
                      >
                        {SYSTEMS_CAPABILITY_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                        Tax Team Size (FTE)
                      </label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-mojitax-green focus:border-mojitax-green"
                        value={candidate.taxTeamSize}
                        onChange={(e) =>
                          updateCandidate(
                            candidate.id,
                            'taxTeamSize',
                            parseInt(e.target.value) || 0
                          )
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                        Advisor Support
                      </label>
                      <select
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-mojitax-green focus:border-mojitax-green"
                        value={candidate.advisorSupport}
                        onChange={(e) =>
                          updateCandidate(
                            candidate.id,
                            'advisorSupport',
                            e.target.value
                          )
                        }
                      >
                        {ADVISOR_SUPPORT_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                        Data Availability (1-5)
                      </label>
                      <div className="flex items-center space-x-1 mt-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() =>
                              updateCandidate(
                                candidate.id,
                                'dataAvailability',
                                star
                              )
                            }
                            className={`p-1 rounded hover:bg-slate-200 ${candidate.dataAvailability >= star ? 'text-yellow-400' : 'text-slate-300'}`}
                          >
                            <Star className="w-5 h-5 fill-current" />
                          </button>
                        ))}
                        <span className="text-xs text-slate-500 ml-2">
                          ({candidate.dataAvailability}/5)
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col space-y-4 pt-4">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="rounded text-mojitax-green focus:ring-mojitax-green"
                          checked={candidate.isUPE}
                          onChange={(e) =>
                            updateCandidate(
                              candidate.id,
                              'isUPE',
                              e.target.checked
                            )
                          }
                        />
                        <span className="ml-2 text-sm text-slate-700">
                          Is Ultimate Parent Entity?
                        </span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="rounded text-mojitax-green focus:ring-mojitax-green"
                          checked={candidate.hasGIRExperience}
                          onChange={(e) =>
                            updateCandidate(
                              candidate.id,
                              'hasGIRExperience',
                              e.target.checked
                            )
                          }
                        />
                        <span className="ml-2 text-sm text-slate-700">
                          Has Prior GIR Filing Experience?
                        </span>
                      </label>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => removeCandidate(candidate.id)}
                      className="text-red-600 hover:text-red-800 text-sm flex items-center px-3 py-2 rounded hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> Remove Entity
                    </button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {candidates.length > 0 && (
        <div className="flex justify-center pt-8 pb-4">
          <Button
            onClick={() => setViewMode('RESULTS')}
            size="lg"
            className="bg-mojitax-green hover:bg-mojitax-green/90"
          >
            <Calculator className="w-5 h-5 mr-2" />
            Run Assessment
          </Button>
        </div>
      )}
    </div>
  );

  const renderResults = () => (
    <div className="space-y-8">
      {/* Top Recommendation Panel */}
      {recommendedDFE ? (
        <Card className="border-2 border-green-100 overflow-hidden">
          <div className="bg-green-50 p-6 border-b border-green-100 flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <div className="flex items-center space-x-2 text-green-700 mb-2">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-bold tracking-wide uppercase">
                  Recommendation
                </span>
              </div>
              <h2 className="text-2xl font-bold text-slate-800">
                {recommendedDFE.entityName}
              </h2>
              <p className="text-slate-600">{recommendedDFE.jurisdiction}</p>
            </div>
            <div className="mt-4 md:mt-0 text-right">
              <div className="text-4xl font-black text-green-600">
                {recommendedDFE.score}
                <span className="text-lg text-green-400 font-medium">/100</span>
              </div>
              <div className="text-xs text-green-700 font-bold bg-green-200 px-2 py-1 rounded inline-block mt-1">
                HIGH CONFIDENCE
              </div>
            </div>
          </div>

          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-bold text-slate-800 mb-3">
                Why this entity?
              </h3>
              <ul className="space-y-2">
                {recommendedDFE.isUPE && (
                  <li className="flex items-start text-sm text-slate-700">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500 mt-0.5" />
                    Is the Ultimate Parent Entity (simplifies compliance)
                  </li>
                )}
                {recommendedDFE.taxTeamSize >= 5 && (
                  <li className="flex items-start text-sm text-slate-700">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500 mt-0.5" />
                    Strong tax team resource ({recommendedDFE.taxTeamSize} FTE)
                  </li>
                )}
                {['ERP_INTEGRATED', 'SAP'].includes(
                  recommendedDFE.systemsCapability
                ) && (
                  <li className="flex items-start text-sm text-slate-700">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500 mt-0.5" />
                    Robust systems capability for data extraction
                  </li>
                )}
                <li className="flex items-start text-sm text-slate-700">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500 mt-0.5" />
                  {getOptionLabel(
                    PILLAR_TWO_STATUS_OPTIONS,
                    recommendedDFE.pillarTwoStatus
                  )}
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-slate-800 mb-3">
                Key Considerations
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start text-sm text-slate-700">
                  <AlertTriangle className="w-4 h-4 mr-2 text-amber-500 mt-0.5" />
                  Must notify {mneInfo.totalJurisdictions} jurisdictions of DFE
                  election
                </li>
                {!recommendedDFE.hasGIRExperience && (
                  <li className="flex items-start text-sm text-slate-700">
                    <AlertTriangle className="w-4 h-4 mr-2 text-amber-500 mt-0.5" />
                    First time filer - no prior GIR experience
                  </li>
                )}
              </ul>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-red-50 border border-red-200">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-red-800">
              No Suitable DFE Found
            </h2>
            <p className="text-red-600">
              None of the candidates meet the minimum criteria (Score &gt; 50 in
              an implemented jurisdiction). Please review inputs.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Comparison Table */}
      <Card>
        <CardHeader className="bg-slate-50 border-b border-slate-200">
          <CardTitle>Candidate Comparison Matrix</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                <tr>
                  <th className="px-6 py-3">Entity</th>
                  <th className="px-6 py-3">Jurisdiction</th>
                  <th className="px-6 py-3 text-center">Score</th>
                  <th className="px-6 py-3 text-center">UPE</th>
                  <th className="px-6 py-3">Systems</th>
                  <th className="px-6 py-3">Recommendation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {processedResults.map((c) => {
                  const StatusIcon =
                    c.status === 'RECOMMENDED'
                      ? CheckCircle
                      : c.status === 'ALTERNATIVE'
                        ? Info
                        : AlertTriangle;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {c.entityName}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {c.jurisdiction}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-800">
                        {c.score}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {c.isUPE ? '✅' : '-'}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {
                          getOptionLabel(
                            SYSTEMS_CAPABILITY_OPTIONS,
                            c.systemsCapability
                          ).split(' ')[0]
                        }
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.color}`}
                        >
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Notification Checklist */}
      {recommendedDFE && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2 text-mojitax-green" />
              Notification Checklist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Info className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    By electing <strong>{recommendedDFE.entityName}</strong>, you
                    must notify the tax authorities in{' '}
                    <strong>{mneInfo.totalJurisdictions} jurisdictions</strong>{' '}
                    where your Constituent Entities are located.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="border rounded-lg p-4">
                <span className="text-slate-500 block text-xs uppercase mb-1">
                  Filing Deadline
                </span>
                <span className="font-medium text-slate-900">
                  30 June {mneInfo.fiscalYear + 2}
                </span>
                <span className="text-xs text-slate-400 block mt-1">
                  (18 months after FY end for first year)
                </span>
              </div>
              <div className="border rounded-lg p-4">
                <span className="text-slate-500 block text-xs uppercase mb-1">
                  Notification Deadline
                </span>
                <span className="font-medium text-slate-900">
                  Same as GIR Deadline
                </span>
                <span className="text-xs text-slate-400 block mt-1">
                  Must contain DFE name & Tax ID
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-center pt-8 pb-4 space-x-4">
        <Button variant="outline" onClick={() => setViewMode('INPUT')}>
          Back to Inputs
        </Button>
        <Button
          onClick={handleSaveSession}
          className="bg-mojitax-green hover:bg-mojitax-green/90"
        >
          <Save className="w-4 h-4 mr-2" /> Save Assessment
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-wrap gap-3 justify-end">
        <Button variant="outline" size="sm" onClick={loadCaseStudy}>
          <Layout className="w-4 h-4 mr-2" />
          Load Case Study
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowLoadModal(true)}
        >
          <FolderOpen className="w-4 h-4 mr-2" />
          Open Saved
        </Button>
        <Button variant="outline" size="sm" onClick={handleSaveSession}>
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>
      </div>

      {/* Main Content */}
      {viewMode === 'INPUT' ? renderInputForm() : renderResults()}

      {/* Load Modal */}
      {showLoadModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md max-h-[80vh] flex flex-col">
            <CardHeader className="flex-row justify-between items-center">
              <CardTitle>Load Assessment</CardTitle>
              <button
                onClick={() => setShowLoadModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </CardHeader>
            <CardContent className="overflow-y-auto flex-1 space-y-2">
              {savedItems.length === 0 ? (
                <p className="text-center text-slate-500 py-8">
                  No saved assessments found.
                </p>
              ) : (
                savedItems.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => loadSession(s)}
                    className="w-full text-left p-3 border rounded hover:bg-mojitax-green/10 hover:border-mojitax-green/30 transition-colors group"
                  >
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-800">
                        {s.name}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(s.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Candidates: {s.candidates?.length || 0}
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default DFEAssessmentTool;
