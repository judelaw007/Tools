/**
 * CEST Employment Status Tool — React Component
 *
 * Simulates HMRC's Check Employment Status for Tax (CEST) decision-tree
 * assessment. Evaluates control, substitution, mutuality of obligation,
 * financial risk, and "in business on own account" across 18 questions.
 *
 * Features: 5-area accordion questionnaire, per-area scoring, overall
 * determination with case law references, IR35 implications panel,
 * H&C scenario loader, educational tooltips, and MojiTax platform
 * tracking callbacks.
 */

'use client';

import React, { useState, useCallback } from 'react';
import type {
  AssessmentAreaId,
  WorkerEngagement,
  ClientSize,
  CestStatusProps,
  CestInputs,
  CestOutput,
  AreaResult,
  AssessmentArea,
  AssessmentQuestion,
  ValidationResult,
  HCScenario,
  IndicatorDirection,
  EmploymentStatus,
} from './types';
import {
  ASSESSMENT_AREAS,
  getAllQuestions,
  runAssessment,
  createEmptyInputs,
  scenarioToInputs,
  HC_SCENARIOS,
} from './utils';

// ─── Helper Functions ────────────────────────────────────────────────────────

function directionLabel(direction: IndicatorDirection): string {
  if (direction === 'employment') return 'Employment';
  if (direction === 'self-employment') return 'Self-Employment';
  return 'Inconclusive';
}

function directionColor(direction: IndicatorDirection): string {
  if (direction === 'employment') return 'text-red-700';
  if (direction === 'self-employment') return 'text-green-700';
  return 'text-amber-600';
}

function directionBg(direction: IndicatorDirection): string {
  if (direction === 'employment') return 'bg-red-50 border-red-200';
  if (direction === 'self-employment') return 'bg-green-50 border-green-200';
  return 'bg-amber-50 border-amber-200';
}

function statusBadge(status: EmploymentStatus): { text: string; bg: string } {
  if (status === 'employed') return { text: 'EMPLOYED', bg: 'bg-red-600 text-white' };
  if (status === 'self-employed') return { text: 'SELF-EMPLOYED', bg: 'bg-green-600 text-white' };
  return { text: 'UNDETERMINED', bg: 'bg-amber-500 text-white' };
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

/** Tooltip shown beneath a field */
function Tooltip({ text, visible }: { text: string; visible: boolean }) {
  if (!visible) return null;
  return <p className="mt-1.5 text-xs text-gray-500 italic leading-relaxed">{text}</p>;
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

/** A single question with radio buttons */
function QuestionCard({
  question,
  selectedKey,
  onSelect,
  showTooltips,
}: {
  question: AssessmentQuestion;
  selectedKey: string | undefined;
  onSelect: (questionId: string, optionKey: string, weight: number) => void;
  showTooltips: boolean;
}) {
  return (
    <div className="p-4 border border-gray-200 rounded-lg">
      <p className="text-sm font-medium text-gray-900 mb-3">
        <span className="text-gray-400 font-mono mr-1.5">{question.id}.</span>
        {question.text}
      </p>
      <div className="space-y-2">
        {question.options.map((option) => {
          const isSelected = selectedKey === option.key;
          const weightLabel = option.weight < 0
            ? `(${option.weight})`
            : option.weight > 0
            ? `(+${option.weight})`
            : '(0)';

          return (
            <label
              key={option.key}
              className={`flex items-start gap-3 p-2.5 rounded-md cursor-pointer transition-colors ${
                isSelected
                  ? option.direction === 'employment'
                    ? 'bg-red-50 border border-red-200'
                    : option.direction === 'self-employment'
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-blue-50 border border-blue-200'
                  : 'hover:bg-gray-50 border border-transparent'
              }`}
            >
              <input
                type="radio"
                name={question.id}
                value={option.key}
                checked={isSelected}
                onChange={() => onSelect(question.id, option.key, option.weight)}
                className="mt-0.5 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <span className="text-sm text-gray-700">{option.text}</span>
                {isSelected && (
                  <span className={`ml-2 text-xs font-mono ${directionColor(option.direction)}`}>
                    {weightLabel}
                  </span>
                )}
              </div>
            </label>
          );
        })}
      </div>
      <Tooltip text={question.educationalNote} visible={showTooltips} />
    </div>
  );
}

/** Area accordion section */
function AreaSection({
  area,
  answers,
  isOpen,
  onToggle,
  onAnswerSelect,
  showTooltips,
  areaResult,
}: {
  area: AssessmentArea;
  answers: Record<string, { selectedKey: string }>;
  isOpen: boolean;
  onToggle: () => void;
  onAnswerSelect: (questionId: string, optionKey: string, weight: number) => void;
  showTooltips: boolean;
  areaResult?: AreaResult;
}) {
  const answeredCount = area.questions.filter((q) => answers[q.id]).length;
  const totalCount = area.questions.length;
  const allAnswered = answeredCount === totalCount;

  let statusIndicator: React.ReactNode;
  if (areaResult) {
    const dirBg = directionBg(areaResult.areaDirection);
    statusIndicator = (
      <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${dirBg}`}>
        {directionLabel(areaResult.areaDirection)} ({areaResult.areaScore > 0 ? '+' : ''}{areaResult.areaScore})
      </span>
    );
  } else if (allAnswered) {
    statusIndicator = (
      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
        {answeredCount}/{totalCount}
      </span>
    );
  } else if (answeredCount > 0) {
    statusIndicator = (
      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
        {answeredCount}/{totalCount}
      </span>
    );
  } else {
    statusIndicator = (
      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-500">
        0/{totalCount}
      </span>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-gray-900">{area.name}</span>
          <span className="text-xs text-gray-500">{area.description}</span>
        </div>
        <div className="flex items-center gap-2">
          {statusIndicator}
          <span className="text-gray-400 text-sm">{isOpen ? '\u25B2' : '\u25BC'}</span>
        </div>
      </button>
      {isOpen && (
        <div className="p-4 space-y-3">
          {area.questions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              selectedKey={answers[question.id]?.selectedKey}
              onSelect={onAnswerSelect}
              showTooltips={showTooltips}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Area result card in the results panel */
function AreaResultCard({
  result,
  showCaseLaw,
  onCaseLawView,
}: {
  result: AreaResult;
  showCaseLaw: boolean;
  onCaseLawView?: (caseRef: string, areaId: AssessmentAreaId) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`border rounded-lg p-4 ${directionBg(result.areaDirection)}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-bold text-gray-900">{result.areaName}</h4>
        <span className={`text-sm font-bold ${directionColor(result.areaDirection)}`}>
          {directionLabel(result.areaDirection)} ({result.areaScore > 0 ? '+' : ''}{result.areaScore})
        </span>
      </div>

      <button
        className="text-xs text-blue-600 hover:text-blue-800 mb-2"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? 'Hide details' : 'Show question details'}
      </button>

      {expanded && (
        <div className="space-y-1.5 mb-3">
          {result.questionResults.map((qr) => (
            <div key={qr.questionId} className="flex items-start gap-2 text-xs">
              <span className="font-mono text-gray-400 flex-shrink-0 w-6">{qr.questionId}</span>
              <span className={`flex-shrink-0 w-8 font-mono text-right ${directionColor(qr.direction)}`}>
                {qr.weight > 0 ? `+${qr.weight}` : qr.weight}
              </span>
              <span className="text-gray-600 truncate">{qr.selectedAnswer}</span>
            </div>
          ))}
        </div>
      )}

      {showCaseLaw && result.caseLawReferences.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <p className="text-xs font-medium text-gray-500 mb-1">Case Law</p>
          {result.caseLawReferences.map((cl) => (
            <button
              key={cl.name}
              className="block w-full text-left text-xs text-blue-600 hover:text-blue-800 mb-0.5"
              onClick={() => onCaseLawView?.(cl.name, result.areaId)}
              title={cl.principle}
            >
              {cl.name} {cl.citation}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Score bar visualisation */
function ScoreBar({ score }: { score: number }) {
  // Map score from [-28, +32] to [0, 100] for bar position
  const minScore = -28;
  const maxScore = 32;
  const range = maxScore - minScore;
  const position = Math.max(0, Math.min(100, ((score - minScore) / range) * 100));

  // Threshold positions
  const employedPos = ((-10 - minScore) / range) * 100;
  const selfEmployedPos = ((10 - minScore) / range) * 100;

  return (
    <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
      {/* Employment zone */}
      <div
        className="absolute top-0 bottom-0 bg-red-100"
        style={{ left: 0, width: `${employedPos}%` }}
      />
      {/* Undetermined zone */}
      <div
        className="absolute top-0 bottom-0 bg-amber-100"
        style={{ left: `${employedPos}%`, width: `${selfEmployedPos - employedPos}%` }}
      />
      {/* Self-employment zone */}
      <div
        className="absolute top-0 bottom-0 bg-green-100"
        style={{ left: `${selfEmployedPos}%`, right: 0 }}
      />
      {/* Threshold lines */}
      <div
        className="absolute top-0 bottom-0 w-px bg-red-400"
        style={{ left: `${employedPos}%` }}
      />
      <div
        className="absolute top-0 bottom-0 w-px bg-green-400"
        style={{ left: `${selfEmployedPos}%` }}
      />
      {/* Score marker */}
      <div
        className="absolute top-1 bottom-1 w-3 bg-gray-900 rounded-full transform -translate-x-1/2"
        style={{ left: `${position}%` }}
      />
      {/* Labels */}
      <div className="absolute inset-0 flex items-center justify-between px-3 text-xs font-medium pointer-events-none">
        <span className="text-red-700">Employed</span>
        <span className="text-amber-600">Undetermined</span>
        <span className="text-green-700">Self-Employed</span>
      </div>
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
            <div className="text-xs text-gray-500 mt-0.5">{scenario.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function CestStatus({
  config,
  callbacks,
  showTooltips: showTooltipsProp,
  className,
}: CestStatusProps) {
  const showTooltips = showTooltipsProp ?? config.showTooltips;

  // ─── State ─────────────────────────────────────────────────────────────────
  const [inputs, setInputs] = useState<CestInputs>(createEmptyInputs());
  const [output, setOutput] = useState<CestOutput | null>(null);
  const [attemptNumber, setAttemptNumber] = useState(0);
  const [showScenarios, setShowScenarios] = useState(false);
  const [openAreas, setOpenAreas] = useState<Set<AssessmentAreaId>>(new Set(['control' as AssessmentAreaId]));
  const [showCaseLawDetail, setShowCaseLawDetail] = useState<string | null>(null);

  // ─── Preliminary handlers ──────────────────────────────────────────────────
  const updateEngagement = useCallback(
    (value: WorkerEngagement) => {
      setInputs((prev) => ({
        ...prev,
        preliminary: { ...prev.preliminary, workerEngagement: value },
      }));
      setOutput(null);
      callbacks?.onAnswerSelect?.({
        questionId: 'preliminary-engagement',
        areaId: 'control',
        selectedOption: value,
        weight: 0,
        timestamp: Date.now(),
      });
    },
    [callbacks]
  );

  const updateClientSize = useCallback(
    (value: ClientSize) => {
      setInputs((prev) => ({
        ...prev,
        preliminary: { ...prev.preliminary, clientSize: value },
      }));
      setOutput(null);
    },
    []
  );

  // ─── Answer handler ────────────────────────────────────────────────────────
  const handleAnswerSelect = useCallback(
    (questionId: string, optionKey: string, weight: number) => {
      setInputs((prev) => ({
        ...prev,
        answers: {
          ...prev.answers,
          [questionId]: { questionId, selectedKey: optionKey, weight },
        },
      }));
      setOutput(null);

      const question = getAllQuestions().find((q) => q.id === questionId);
      if (question) {
        callbacks?.onAnswerSelect?.({
          questionId,
          areaId: question.areaId,
          selectedOption: optionKey,
          weight,
          timestamp: Date.now(),
        });

        // Check if area is now complete
        const area = ASSESSMENT_AREAS.find((a) => a.id === question.areaId);
        if (area) {
          const updatedAnswers = { ...inputs.answers, [questionId]: { questionId, selectedKey: optionKey, weight } };
          const allAnswered = area.questions.every((q) => updatedAnswers[q.id]);
          if (allAnswered) {
            const areaScore = area.questions.reduce((sum, q) => sum + (updatedAnswers[q.id]?.weight ?? 0), 0);
            const direction: IndicatorDirection = areaScore < 0 ? 'employment' : areaScore > 0 ? 'self-employment' : 'neutral';
            callbacks?.onAreaComplete?.({
              areaId: question.areaId,
              areaScore,
              areaDirection: direction,
              timestamp: Date.now(),
            });

            // Auto-open next area
            const areaIndex = ASSESSMENT_AREAS.findIndex((a) => a.id === question.areaId);
            if (areaIndex < ASSESSMENT_AREAS.length - 1) {
              const nextArea = ASSESSMENT_AREAS[areaIndex + 1];
              setOpenAreas((prev) => new Set([...Array.from(prev), nextArea.id]));
            }
          }
        }
      }
    },
    [inputs.answers, callbacks]
  );

  // ─── Toggle area ───────────────────────────────────────────────────────────
  const toggleArea = useCallback((areaId: AssessmentAreaId) => {
    setOpenAreas((prev) => {
      const next = new Set<AssessmentAreaId>(Array.from(prev));
      if (next.has(areaId)) {
        next.delete(areaId);
      } else {
        next.add(areaId);
      }
      return next;
    });
  }, []);

  // ─── Assess handler ────────────────────────────────────────────────────────
  const handleAssess = useCallback(() => {
    const result = runAssessment(inputs);
    const attempt = attemptNumber + 1;
    setOutput(result);
    setAttemptNumber(attempt);

    callbacks?.onAssess?.({
      determination: result.determination.status,
      overallScore: result.determination.overallScore,
      areaResults: result.areaResults.map((ar) => ({
        areaId: ar.areaId,
        score: ar.areaScore,
        direction: ar.areaDirection,
      })),
      attemptNumber: attempt,
      timestamp: Date.now(),
    });

    const unanswered = getAllQuestions().filter((q) => !inputs.answers[q.id]);
    callbacks?.onValidation?.({
      unansweredCount: unanswered.length,
      inconsistencies: result.validationResults
        .filter((v) => v.severity === 'warning' && !v.passed)
        .map((v) => v.message),
      timestamp: Date.now(),
    });
  }, [inputs, attemptNumber, callbacks]);

  // ─── Reset handler ─────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    const previousResult = output;
    setInputs(createEmptyInputs());
    setOutput(null);
    setAttemptNumber(0);
    setOpenAreas(new Set<AssessmentAreaId>(['control' as AssessmentAreaId]));

    callbacks?.onReset?.({ previousResult, timestamp: Date.now() });
  }, [output, callbacks]);

  // ─── Scenario loader ──────────────────────────────────────────────────────
  const handleLoadScenario = useCallback(
    (scenario: HCScenario) => {
      setInputs(scenarioToInputs(scenario));
      setOutput(null);
      setAttemptNumber(0);
      setShowScenarios(false);
      // Open all areas when loading a scenario
      setOpenAreas(new Set<AssessmentAreaId>(ASSESSMENT_AREAS.map((a) => a.id)));

      callbacks?.onScenarioLoad?.({
        scenarioId: scenario.id,
        section: scenario.section,
        timestamp: Date.now(),
      });
    },
    [callbacks]
  );

  // ─── Case law view handler ────────────────────────────────────────────────
  const handleCaseLawView = useCallback(
    (caseRef: string, areaId: AssessmentAreaId) => {
      setShowCaseLawDetail(showCaseLawDetail === caseRef ? null : caseRef);
      callbacks?.onCaseLawView?.({ caseRef, areaId, timestamp: Date.now() });
    },
    [showCaseLawDetail, callbacks]
  );

  // ─── Derived ───────────────────────────────────────────────────────────────
  const totalQuestions = getAllQuestions().length;
  const answeredCount = Object.keys(inputs.answers).length;
  const allAnswered = answeredCount === totalQuestions;
  const hasErrors = output?.validationSummary.errors ?? 0 > 0;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={`max-w-4xl mx-auto ${className ?? ''}`}>
      {/* Tool header */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              CEST Employment Status Tool
            </h2>
            <p className="text-sm text-gray-500">
              Check Employment Status for Tax — IR35 / Off-Payroll Working
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              onClick={() => setShowScenarios(!showScenarios)}
            >
              H&C Scenarios
            </button>
            {(output || answeredCount > 0) && (
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

      {/* Preliminary context */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-1">
          Preliminary Context
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How is the worker engaged?
            </label>
            <div className="space-y-1.5">
              {([
                { value: 'psc' as WorkerEngagement, label: 'Through a personal service company (PSC)' },
                { value: 'agency' as WorkerEngagement, label: 'Through an employment agency' },
                { value: 'direct' as WorkerEngagement, label: 'Engaged directly as an individual' },
              ]).map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    name="workerEngagement"
                    value={opt.value}
                    checked={inputs.preliminary.workerEngagement === opt.value}
                    onChange={() => updateEngagement(opt.value)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
            <Tooltip
              text="This determines whether IR35/off-payroll working rules apply. IR35 only applies where the worker is engaged through an intermediary (PSC or agency)."
              visible={showTooltips}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Is the end client a small company?
            </label>
            <div className="space-y-1.5">
              {([
                { value: 'small' as ClientSize, label: 'Yes \u2014 small company (PSC makes determination)' },
                { value: 'medium-large' as ClientSize, label: 'No \u2014 medium/large (end client makes determination)' },
                { value: 'unsure' as ClientSize, label: 'Unsure' },
              ]).map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    name="clientSize"
                    value={opt.value}
                    checked={inputs.preliminary.clientSize === opt.value}
                    onChange={() => updateClientSize(opt.value)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
            <Tooltip
              text="Small company test: meets 2 of 3 criteria \u2014 \u226450 employees, \u2264\u00A310.2m turnover, \u2264\u00A35.1m balance sheet. Small companies are exempt from the off-payroll rules \u2014 the worker's PSC decides. Medium/large companies must make the determination themselves."
              visible={showTooltips}
            />
          </div>
        </div>
      </div>

      {/* Assessment areas */}
      <div className="space-y-2 mb-4">
        {ASSESSMENT_AREAS.map((area) => (
          <AreaSection
            key={area.id}
            area={area}
            answers={inputs.answers}
            isOpen={openAreas.has(area.id)}
            onToggle={() => toggleArea(area.id)}
            onAnswerSelect={handleAnswerSelect}
            showTooltips={showTooltips}
            areaResult={output?.areaResults.find((ar) => ar.areaId === area.id)}
          />
        ))}
      </div>

      {/* Progress and assess button */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-600">
            Progress: {answeredCount}/{totalQuestions} questions answered
          </span>
          <span className={`text-xs font-medium ${allAnswered ? 'text-green-600' : 'text-gray-400'}`}>
            {allAnswered ? 'Ready to assess' : `${totalQuestions - answeredCount} remaining`}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div
            className={`h-2 rounded-full transition-all ${allAnswered ? 'bg-green-500' : 'bg-blue-500'}`}
            style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
          />
        </div>
        <div className="flex justify-center">
          <button
            className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            onClick={handleAssess}
            disabled={!allAnswered}
          >
            Run Assessment
          </button>
        </div>
      </div>

      {/* Results */}
      {output && (
        <div className="space-y-4">
          {/* Overall determination */}
          <div className="bg-gray-900 text-white rounded-lg p-6">
            <div className="text-center mb-4">
              <div className="text-xs uppercase text-gray-400 mb-2">Employment Status Determination</div>
              <span className={`inline-block px-6 py-2 text-lg font-bold rounded-full ${statusBadge(output.determination.status).bg}`}>
                {statusBadge(output.determination.status).text}
              </span>
              {output.determination.leaning && (
                <div className="mt-2 text-sm text-gray-400">
                  Leaning: {output.determination.leaning === 'employment' ? 'toward employment' :
                    output.determination.leaning === 'self-employment' ? 'toward self-employment' : 'evenly balanced'}
                </div>
              )}
            </div>

            <div className="mb-4">
              <ScoreBar score={output.determination.overallScore} />
              <div className="text-center mt-1 text-xs text-gray-400">
                Overall score: {output.determination.overallScore > 0 ? '+' : ''}{output.determination.overallScore}
                {output.determination.substitutionOverride && ' (substitution override applied)'}
              </div>
            </div>

            <p className="text-sm text-gray-300 leading-relaxed">
              {output.determination.reason}
            </p>
          </div>

          {/* Per-area breakdown */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Assessment Area Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {output.areaResults.map((ar) => (
                <AreaResultCard
                  key={ar.areaId}
                  result={ar}
                  showCaseLaw={config.showCaseLaw}
                  onCaseLawView={handleCaseLawView}
                />
              ))}
            </div>
          </div>

          {/* Key factors */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Key Factors Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Employment factors */}
              <div>
                <h4 className="text-xs font-bold text-red-700 uppercase mb-2">
                  Employment Indicators ({output.keyFactors.employmentFactors.length})
                </h4>
                {output.keyFactors.employmentFactors.length > 0 ? (
                  <ul className="space-y-1">
                    {output.keyFactors.employmentFactors.map((f, i) => (
                      <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                        <span className="text-red-400 flex-shrink-0 mt-0.5">&bull;</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-gray-400 italic">No employment indicators</p>
                )}
              </div>

              {/* Self-employment factors */}
              <div>
                <h4 className="text-xs font-bold text-green-700 uppercase mb-2">
                  Self-Employment Indicators ({output.keyFactors.selfEmploymentFactors.length})
                </h4>
                {output.keyFactors.selfEmploymentFactors.length > 0 ? (
                  <ul className="space-y-1">
                    {output.keyFactors.selfEmploymentFactors.map((f, i) => (
                      <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                        <span className="text-green-400 flex-shrink-0 mt-0.5">&bull;</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-gray-400 italic">No self-employment indicators</p>
                )}
              </div>
            </div>

            {/* Strongest factors */}
            <div className="mt-4 pt-3 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-3">
              {output.keyFactors.strongestEmployment && (
                <div className="p-2 bg-red-50 rounded text-xs">
                  <span className="font-medium text-red-700">Strongest employment indicator:</span>{' '}
                  <span className="text-red-600">{output.keyFactors.strongestEmployment}</span>
                </div>
              )}
              {output.keyFactors.strongestSelfEmployment && (
                <div className="p-2 bg-green-50 rounded text-xs">
                  <span className="font-medium text-green-700">Strongest self-employment indicator:</span>{' '}
                  <span className="text-green-600">{output.keyFactors.strongestSelfEmployment}</span>
                </div>
              )}
            </div>
          </div>

          {/* IR35 Implications */}
          {config.showIR35 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3">IR35 / Off-Payroll Working Implications</h3>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className={`px-2 py-0.5 text-xs font-bold rounded ${output.ir35.ir35Applies ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'}`}>
                    {output.ir35.ir35Applies ? 'IR35 APPLIES' : 'IR35 N/A'}
                  </span>
                  <p className="text-sm text-gray-600">{output.ir35.ir35Reason}</p>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Responsible Party</p>
                  <p className="text-sm text-gray-700">{output.ir35.responsibleParty}</p>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Tax Consequences</p>
                  <p className="text-sm text-gray-700">{output.ir35.consequences}</p>
                </div>

                {output.ir35.nextSteps.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Recommended Next Steps</p>
                    <ul className="space-y-1">
                      {output.ir35.nextSteps.map((step, i) => (
                        <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-blue-400 flex-shrink-0">{i + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Case law detail overlay */}
          {showCaseLawDetail && config.showCaseLaw && (() => {
            const caseRef = output.areaResults
              .flatMap((ar) => ar.caseLawReferences)
              .find((cl) => cl.name === showCaseLawDetail);
            if (!caseRef) return null;
            return (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-blue-900">{caseRef.name}</h4>
                  <button
                    className="text-xs text-blue-600 hover:text-blue-800"
                    onClick={() => setShowCaseLawDetail(null)}
                  >
                    Close
                  </button>
                </div>
                <p className="text-xs text-blue-700 mb-2">{caseRef.citation} ({caseRef.year})</p>
                <p className="text-sm text-blue-800 leading-relaxed">{caseRef.principle}</p>
                <p className="text-xs text-blue-600 mt-2">
                  Relevant areas: {caseRef.areas.map((a) => ASSESSMENT_AREAS.find((area) => area.id === a)?.name).filter(Boolean).join(', ')}
                </p>
              </div>
            );
          })()}

          {/* Validation results */}
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
        </div>
      )}
    </div>
  );
}

export default CestStatus;
