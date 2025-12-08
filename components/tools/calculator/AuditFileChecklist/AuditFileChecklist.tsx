'use client';

import React, { useState, useMemo } from 'react';
import {
  Save,
  FolderOpen,
  CheckCircle,
  AlertTriangle,
  FileText,
  PieChart,
  List,
  Filter,
  ChevronDown,
  ChevronRight,
  Shield,
  FileSpreadsheet,
  Printer,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type {
  AuditMetadata,
  ItemState,
  ChecklistStats,
  AuditFileChecklistProps,
  SavedAuditChecklist,
  ItemStatus,
} from './types';
import {
  CHECKLIST_SECTIONS,
  CHECKLIST_ITEMS,
  INITIAL_METADATA,
  CASE_STUDY_METADATA,
  generateCaseStudyItemStates,
  getPriorityColor,
  getStatusColor,
  getNextStatus,
  getOverallStatusColor,
} from './utils';

type ViewMode = 'SETUP' | 'DASHBOARD' | 'CHECKLIST' | 'GAP';
type FilterMode = 'ALL' | 'INCOMPLETE' | 'CRITICAL';

export function AuditFileChecklist({
  onSave,
  savedItems = [],
}: AuditFileChecklistProps) {
  const [view, setView] = useState<ViewMode>('SETUP');

  // Data State
  const [metadata, setMetadata] = useState<AuditMetadata>(INITIAL_METADATA);
  const [itemStates, setItemStates] = useState<Record<string, ItemState>>({});

  // Checklist View State
  const [checklistFilter, setChecklistFilter] = useState<FilterMode>('ALL');
  const [checklistSearch, setChecklistSearch] = useState('');

  // Modal State
  const [showLoadModal, setShowLoadModal] = useState(false);

  // --- Logic ---

  const activeItems = useMemo(() => {
    return CHECKLIST_ITEMS.filter(
      (item) => metadata.sectionsIncluded[item.section as keyof typeof metadata.sectionsIncluded]
    );
  }, [metadata.sectionsIncluded]);

  const stats: ChecklistStats = useMemo(() => {
    const applicable = activeItems.filter(
      (i) => itemStates[i.id]?.status !== 'NOT_APPLICABLE'
    );
    const completed = applicable.filter(
      (i) => itemStates[i.id]?.status === 'COMPLETE'
    );
    const criticalTotal = applicable.filter((i) => i.priority === 'CRITICAL');
    const criticalComplete = criticalTotal.filter(
      (i) => itemStates[i.id]?.status === 'COMPLETE'
    );

    const pct = applicable.length
      ? Math.round((completed.length / applicable.length) * 100)
      : 100;

    let status: ChecklistStats['overallStatus'] = 'INCOMPLETE';
    if (pct === 100 && criticalComplete.length === criticalTotal.length)
      status = 'COMPLETE';
    else if (pct >= 90) status = 'SUBSTANTIALLY_COMPLETE';
    else if (pct >= 50) status = 'IN_PROGRESS';

    return {
      total: activeItems.length,
      applicable: applicable.length,
      completed: completed.length,
      incomplete: applicable.length - completed.length,
      na: activeItems.length - applicable.length,
      percent: pct,
      overallStatus: status,
      criticalComplete: criticalComplete.length === criticalTotal.length,
    };
  }, [activeItems, itemStates]);

  const updateItem = (
    id: string,
    field: keyof ItemState,
    value: ItemStatus | string
  ) => {
    setItemStates((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || { status: 'INCOMPLETE', notes: '' }),
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    if (!onSave) return;
    const name = `${metadata.entityName || 'Untitled'} - FY${metadata.fiscalYear}`;
    try {
      await onSave({
        name,
        metadata,
        itemStates,
      });
      alert('Audit checklist saved successfully.');
    } catch {
      alert('Save failed.');
    }
  };

  const loadCaseStudy = () => {
    if (
      !window.confirm(
        'Load GlobalTech Manufacturing Case Study? This will overwrite current data.'
      )
    )
      return;
    setMetadata(CASE_STUDY_METADATA);
    setItemStates(generateCaseStudyItemStates());
    setView('DASHBOARD');
  };

  const loadSession = (session: SavedAuditChecklist) => {
    setMetadata(session.metadata);
    setItemStates(session.itemStates);
    setView('DASHBOARD');
    setShowLoadModal(false);
  };

  // --- Status Icon Renderer ---

  const renderStatusIcon = (status: ItemStatus) => {
    switch (status) {
      case 'COMPLETE':
        return <CheckCircle className="w-5 h-5" />;
      case 'IN_PROGRESS':
        return (
          <div className="w-5 h-5 rounded-full border-4 border-blue-400 border-t-transparent animate-spin" />
        );
      case 'NOT_APPLICABLE':
        return <span className="text-xs font-bold">N/A</span>;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-slate-300" />;
    }
  };

  // --- Views ---

  const renderSetup = () => (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2 text-mojitax-green" />
            Setup Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                Entity / Group Name
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-mojitax-green focus:border-mojitax-green"
                value={metadata.entityName}
                onChange={(e) =>
                  setMetadata({ ...metadata, entityName: e.target.value })
                }
                placeholder="e.g. GlobalTech Manufacturing Group"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                Fiscal Year
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-mojitax-green focus:border-mojitax-green"
                value={metadata.fiscalYear}
                onChange={(e) =>
                  setMetadata({
                    ...metadata,
                    fiscalYear: parseInt(e.target.value) || new Date().getFullYear(),
                  })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                Jurisdictions
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-mojitax-green focus:border-mojitax-green"
                value={metadata.jurisdictionCount}
                onChange={(e) =>
                  setMetadata({
                    ...metadata,
                    jurisdictionCount: parseInt(e.target.value) || 1,
                  })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                Filing Entity
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-mojitax-green focus:border-mojitax-green"
                value={metadata.filingEntity}
                onChange={(e) =>
                  setMetadata({ ...metadata, filingEntity: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                Audit Date
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-mojitax-green focus:border-mojitax-green"
                value={metadata.auditDate}
                onChange={(e) =>
                  setMetadata({ ...metadata, auditDate: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                Filing Status
              </label>
              <select
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-mojitax-green focus:border-mojitax-green"
                value={metadata.girStatus}
                onChange={(e) =>
                  setMetadata({
                    ...metadata,
                    girStatus: e.target.value as AuditMetadata['girStatus'],
                  })
                }
              >
                <option value="DRAFT">Draft - Not yet filed</option>
                <option value="PREPARED">Prepared - Ready for review</option>
                <option value="SUBMITTED">Submitted - Filed</option>
                <option value="AMENDED">Amended - Revision filed</option>
              </select>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <h3 className="font-semibold text-slate-700 mb-4">
              Sections to Include
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {CHECKLIST_SECTIONS.map((sec) => (
                <label
                  key={sec.id}
                  className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={
                      metadata.sectionsIncluded[
                        sec.id as keyof typeof metadata.sectionsIncluded
                      ]
                    }
                    onChange={(e) =>
                      setMetadata({
                        ...metadata,
                        sectionsIncluded: {
                          ...metadata.sectionsIncluded,
                          [sec.id]: e.target.checked,
                        },
                      })
                    }
                    className="rounded text-mojitax-green focus:ring-mojitax-green h-4 w-4"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    {sec.title}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <Button
              onClick={() => setView('DASHBOARD')}
              disabled={!metadata.entityName}
              className="bg-mojitax-green hover:bg-mojitax-green/90"
            >
              Start Checklist <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Header Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {metadata.entityName}
              </h2>
              <p className="text-slate-500 text-sm">
                FY {metadata.fiscalYear} • {metadata.jurisdictionCount}{' '}
                Jurisdictions • Status: {metadata.girStatus} • Audit Date:{' '}
                {metadata.auditDate}
              </p>
            </div>
            <div
              className={`px-4 py-2 rounded-lg font-bold text-sm ${getOverallStatusColor(stats.overallStatus)}`}
            >
              {stats.overallStatus.replace(/_/g, ' ')}
            </div>
          </div>

          <div className="mb-2 flex justify-between text-sm font-medium text-slate-700">
            <span>Overall Progress</span>
            <span>{stats.percent}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden mb-6">
            <div
              className={`h-full transition-all duration-500 ${
                stats.percent === 100
                  ? 'bg-green-500'
                  : stats.percent > 50
                    ? 'bg-blue-500'
                    : 'bg-mojitax-green'
              }`}
              style={{ width: `${stats.percent}%` }}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-slate-800">
                {stats.completed}
              </div>
              <div className="text-xs text-slate-500 uppercase">Completed</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-amber-600">
                {stats.incomplete}
              </div>
              <div className="text-xs text-slate-500 uppercase">Incomplete</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-slate-400">{stats.na}</div>
              <div className="text-xs text-slate-500 uppercase">
                Not Applicable
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-mojitax-green">
                {stats.total}
              </div>
              <div className="text-xs text-slate-500 uppercase">Total Items</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {CHECKLIST_SECTIONS.filter(
          (s) =>
            metadata.sectionsIncluded[
              s.id as keyof typeof metadata.sectionsIncluded
            ]
        ).map((section) => {
          const items = CHECKLIST_ITEMS.filter(
            (i) => i.section === section.id
          );
          const completed = items.filter(
            (i) => itemStates[i.id]?.status === 'COMPLETE'
          ).length;
          const total = items.filter(
            (i) => itemStates[i.id]?.status !== 'NOT_APPLICABLE'
          ).length;
          const pct = total ? Math.round((completed / total) * 100) : 100;

          return (
            <Card
              key={section.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-5">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-slate-800">
                    {section.title}
                  </h3>
                  {pct === 100 && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
                  <div
                    className={`h-full rounded-full ${pct === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>
                    {completed}/{total} Complete
                  </span>
                  <span>{pct}%</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Export Buttons */}
      <div className="flex flex-wrap justify-between items-center bg-slate-100 p-4 rounded-xl border border-slate-200 mt-2 gap-3">
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => alert('Printing PDF Report...')}
          >
            <Printer className="w-4 h-4 mr-2" /> Export PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => alert('Downloading Excel Workbook...')}
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" /> Export Excel
          </Button>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setView('CHECKLIST')}
            className="bg-mojitax-green hover:bg-mojitax-green/90"
          >
            View Full Checklist
          </Button>
          <Button variant="outline" onClick={() => setView('GAP')}>
            Gap Analysis
          </Button>
        </div>
      </div>
    </div>
  );

  const renderChecklist = () => {
    const filteredItems = activeItems.filter((item) => {
      const state = itemStates[item.id] || { status: 'INCOMPLETE' };
      if (
        checklistFilter === 'INCOMPLETE' &&
        (state.status === 'COMPLETE' || state.status === 'NOT_APPLICABLE')
      )
        return false;
      if (checklistFilter === 'CRITICAL' && item.priority !== 'CRITICAL')
        return false;
      if (
        checklistSearch &&
        !item.text.toLowerCase().includes(checklistSearch.toLowerCase()) &&
        !item.id.toLowerCase().includes(checklistSearch.toLowerCase())
      )
        return false;
      return true;
    });

    return (
      <div className="space-y-6 flex flex-col">
        <Card className="sticky top-0 z-10">
          <CardContent className="p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="flex items-center space-x-2 w-full md:w-auto">
              <Filter className="w-5 h-5 text-slate-400" />
              <select
                value={checklistFilter}
                onChange={(e) =>
                  setChecklistFilter(e.target.value as FilterMode)
                }
                className="border-none bg-slate-50 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 focus:ring-0"
              >
                <option value="ALL">All Items</option>
                <option value="INCOMPLETE">Incomplete Only</option>
                <option value="CRITICAL">Critical Only</option>
              </select>
            </div>
            <input
              type="text"
              placeholder="Search items..."
              className="w-full md:w-64 px-4 py-2 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-mojitax-green"
              value={checklistSearch}
              onChange={(e) => setChecklistSearch(e.target.value)}
            />
          </CardContent>
        </Card>

        <div className="space-y-3 flex-1 overflow-y-auto pb-20">
          {filteredItems.map((item) => {
            const state = itemStates[item.id] || {
              status: 'INCOMPLETE' as ItemStatus,
              notes: '',
            };
            return (
              <Card
                key={item.id}
                className="hover:border-mojitax-green/30 transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Status Toggle */}
                    <button
                      onClick={() => {
                        updateItem(item.id, 'status', getNextStatus(state.status));
                      }}
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${getStatusColor(state.status)}`}
                      title="Click to toggle status"
                    >
                      {renderStatusIcon(state.status)}
                    </button>

                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-mono text-xs text-slate-400">
                          {item.id} • Ref: {item.ref}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded border uppercase font-bold tracking-wider ${getPriorityColor(item.priority)}`}
                        >
                          {item.priority}
                        </span>
                      </div>
                      <p
                        className={`font-medium text-slate-800 mb-2 ${state.status === 'NOT_APPLICABLE' ? 'line-through text-slate-400' : ''}`}
                      >
                        {item.text}
                      </p>

                      <textarea
                        placeholder="Add notes or document references..."
                        className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded resize-none focus:bg-white focus:ring-1 focus:ring-mojitax-green transition-all"
                        rows={state.notes ? 2 : 1}
                        value={state.notes}
                        onChange={(e) =>
                          updateItem(item.id, 'notes', e.target.value)
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filteredItems.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              No items match your filters.
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderGapAnalysis = () => {
    const gaps = activeItems
      .filter((i) => {
        const s = itemStates[i.id]?.status;
        return s === 'INCOMPLETE' || s === 'IN_PROGRESS' || !s;
      })
      .sort((a, b) => {
        const pMap = { CRITICAL: 3, HIGH: 2, MEDIUM: 1 };
        return pMap[b.priority] - pMap[a.priority];
      });

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-slate-800 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center space-x-3 mb-2">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-bold">Gap Analysis Report</h2>
          </div>
          <p className="text-slate-300">
            Generated on {new Date().toLocaleDateString()}
          </p>
          <div className="mt-6 flex gap-6">
            <div>
              <div className="text-3xl font-bold">{gaps.length}</div>
              <div className="text-xs text-slate-400 uppercase">Total Gaps</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-red-400">
                {gaps.filter((g) => g.priority === 'CRITICAL').length}
              </div>
              <div className="text-xs text-slate-400 uppercase">Critical</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-amber-400">
                {gaps.filter((g) => g.priority === 'HIGH').length}
              </div>
              <div className="text-xs text-slate-400 uppercase">
                High Priority
              </div>
            </div>
          </div>
        </div>

        <Card>
          {gaps.length === 0 ? (
            <CardContent className="p-12 text-center">
              <Shield className="w-16 h-16 text-green-200 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-700">
                No Gaps Detected
              </h3>
              <p className="text-slate-500">
                All applicable checklist items are marked complete.
              </p>
            </CardContent>
          ) : (
            <CardContent className="p-0 divide-y divide-slate-100">
              {gaps.map((gap, idx) => (
                <div
                  key={gap.id}
                  className="p-5 flex gap-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="text-slate-300 font-mono text-sm font-bold pt-1">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${getPriorityColor(gap.priority)}`}
                      >
                        {gap.priority} GAP
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {gap.id}
                      </span>
                    </div>
                    <p className="font-semibold text-slate-800 mb-2">
                      {gap.text}
                    </p>
                    <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded border border-slate-100">
                      <strong>Recommended Action:</strong> Prepare documentation
                      referenced in GIR {gap.ref}.
                      {itemStates[gap.id]?.notes && (
                        <div className="mt-2 text-xs italic text-slate-500 border-t border-slate-200 pt-2">
                          Note: {itemStates[gap.id].notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      </div>
    );
  };

  // --- Navigation Tab Component ---

  const NavTab = ({
    active,
    onClick,
    icon: Icon,
    label,
  }: {
    active: boolean;
    onClick: () => void;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
  }) => (
    <button
      onClick={onClick}
      className={`
        flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
        ${
          active
            ? 'border-mojitax-green text-mojitax-green bg-mojitax-green/5'
            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
        }
      `}
    >
      <Icon
        className={`w-4 h-4 mr-2 ${active ? 'text-mojitax-green' : 'text-slate-400'}`}
      />
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-wrap gap-3 justify-end">
        <Button variant="outline" size="sm" onClick={loadCaseStudy}>
          <FileText className="w-4 h-4 mr-2" />
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
        <Button variant="outline" size="sm" onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>
      </div>

      {/* Navigation Tabs (Only visible after setup) */}
      {view !== 'SETUP' && (
        <div className="bg-white border border-slate-200 rounded-lg">
          <div className="flex space-x-1 overflow-x-auto px-2">
            <NavTab
              active={view === 'DASHBOARD'}
              onClick={() => setView('DASHBOARD')}
              icon={PieChart}
              label="Dashboard"
            />
            <NavTab
              active={view === 'CHECKLIST'}
              onClick={() => setView('CHECKLIST')}
              icon={List}
              label="Checklist"
            />
            <NavTab
              active={view === 'GAP'}
              onClick={() => setView('GAP')}
              icon={AlertTriangle}
              label="Gap Analysis"
            />
            <button
              onClick={() => setView('SETUP')}
              className="ml-auto px-4 py-3 text-sm font-medium text-slate-500 hover:text-mojitax-green flex items-center"
            >
              <ChevronDown className="w-4 h-4 mr-1" />
              Settings
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      {view === 'SETUP' && renderSetup()}
      {view === 'DASHBOARD' && renderDashboard()}
      {view === 'CHECKLIST' && renderChecklist()}
      {view === 'GAP' && renderGapAnalysis()}

      {/* Load Modal */}
      {showLoadModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md max-h-[80vh] flex flex-col">
            <CardHeader className="flex-row justify-between items-center">
              <CardTitle>Open Audit File</CardTitle>
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
                  No saved files found.
                </p>
              ) : (
                savedItems.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => loadSession(f)}
                    className="w-full text-left p-3 border rounded-lg hover:bg-mojitax-green/10 hover:border-mojitax-green/30 transition-colors group"
                  >
                    <div className="font-medium text-slate-800">{f.name}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      {new Date(f.updatedAt).toLocaleString()}
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

export default AuditFileChecklist;
