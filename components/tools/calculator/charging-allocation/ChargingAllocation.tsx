'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  Save,
  FolderOpen,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Plus,
  Trash2,
  Info,
  GitMerge,
  ArrowDown,
  ArrowRight,
  Layers,
  BarChart3,
  Shield,
  Building,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type {
  ChainEntity,
  ChainEntityType,
  JurisdictionData,
  AllocationResult,
  AllocationStep,
  ChargingAllocationProps,
  SavedAllocation,
  ValidationError,
} from './types';
import {
  STEP_CONFIGS,
  ALLOCATION_STEPS,
  JURISDICTIONS,
  ENTITY_TYPE_OPTIONS,
  STEP_EDUCATIONAL_NOTES,
  MECHANISM_GUIDANCE,
  INITIAL_ENTITY,
  CASE_STUDY_GROUP_NAME,
  CASE_STUDY_ENTITIES,
  CASE_STUDY_JURISDICTIONS,
  MOCE_THRESHOLD_PERCENT,
  generateEntityId,
  generateJurisdictionId,
  resolveEntityType,
  isMOCE,
  generateJurisdictionData,
  computeAllocation,
  validateGroupStructure,
  validateJurisdictionData,
  formatEUR,
  formatPercent,
  formatPercentDirect,
  getOptionLabel,
  getJurisdictionImplementation,
  roundTo2,
} from './utils';

// ============================================================
// MAIN COMPONENT
// ============================================================

export function ChargingAllocation({
  userId,
  onSave,
  onDelete,
  savedItems = [],
  onTrackCalculation,
  onTrackStepChange,
  onTrackError,
  onTrackCompletion,
}: ChargingAllocationProps) {
  // --- State ---
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [groupName, setGroupName] = useState('');
  const [entities, setEntities] = useState<ChainEntity[]>([]);
  const [jurisdictions, setJurisdictions] = useState<JurisdictionData[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [showEducationalNote, setShowEducationalNote] = useState(true);
  const [showMechanismGuide, setShowMechanismGuide] = useState<string | null>(
    null
  );
  const [loadMenuOpen, setLoadMenuOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const currentStep = STEP_CONFIGS[currentStepIndex];

  // --- Computed ---
  const allocationResult = useMemo<AllocationResult | null>(() => {
    if (entities.length === 0 || jurisdictions.length === 0) return null;
    const lowTaxed = jurisdictions.filter(
      (j) => j.isLowTaxed && j.topUpTaxAmount > 0
    );
    if (lowTaxed.length === 0) return null;
    return computeAllocation(entities, jurisdictions);
  }, [entities, jurisdictions]);

  // --- Navigation ---
  const canGoNext = useCallback((): boolean => {
    if (currentStepIndex === 0) {
      return validateGroupStructure(entities, groupName).length === 0;
    }
    if (currentStepIndex === 1) {
      return validateJurisdictionData(jurisdictions).length === 0;
    }
    return true;
  }, [currentStepIndex, entities, groupName, jurisdictions]);

  const goNext = useCallback(() => {
    if (currentStepIndex === 0) {
      const validationErrors = validateGroupStructure(entities, groupName);
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        onTrackError?.(validationErrors[0].message, {
          step: currentStep.key,
        });
        return;
      }
      // Auto-populate jurisdictions from entities if empty
      if (jurisdictions.length === 0) {
        setJurisdictions(generateJurisdictionData(entities));
      }
    }
    if (currentStepIndex === 1) {
      const validationErrors = validateJurisdictionData(jurisdictions);
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        onTrackError?.(validationErrors[0].message, {
          step: currentStep.key,
        });
        return;
      }
      // Track allocation computation
      if (allocationResult) {
        onTrackCalculation?.('allocation_computed', {
          totalTopUpTax: allocationResult.totalTopUpTax,
          totalQDMTT: allocationResult.totalQDMTT,
          totalIIR: allocationResult.totalIIR,
          totalUTPR: allocationResult.totalUTPR,
          jurisdictionCount: jurisdictions.filter((j) => j.isLowTaxed).length,
        });
      }
    }

    setErrors([]);
    const nextIndex = Math.min(
      currentStepIndex + 1,
      ALLOCATION_STEPS.length - 1
    );
    onTrackStepChange?.(currentStep.key, STEP_CONFIGS[nextIndex].key);
    setCurrentStepIndex(nextIndex);

    // Track completion when reaching results
    if (nextIndex === ALLOCATION_STEPS.length - 1 && allocationResult) {
      onTrackCompletion?.({
        totalTopUpTax: allocationResult.totalTopUpTax,
        totalQDMTT: allocationResult.totalQDMTT,
        totalIIR: allocationResult.totalIIR,
        totalUTPR: allocationResult.totalUTPR,
        lowTaxedCount: jurisdictions.filter((j) => j.isLowTaxed).length,
      });
    }
  }, [
    currentStepIndex,
    entities,
    groupName,
    jurisdictions,
    allocationResult,
    currentStep,
    onTrackStepChange,
    onTrackCalculation,
    onTrackCompletion,
    onTrackError,
  ]);

  const goBack = useCallback(() => {
    setErrors([]);
    const prevIndex = Math.max(currentStepIndex - 1, 0);
    onTrackStepChange?.(currentStep.key, STEP_CONFIGS[prevIndex].key);
    setCurrentStepIndex(prevIndex);
  }, [currentStepIndex, currentStep, onTrackStepChange]);

  // --- Entity CRUD ---
  const addEntity = useCallback(() => {
    const newEntity: ChainEntity = {
      ...INITIAL_ENTITY,
      id: generateEntityId(),
      isUPE: entities.length === 0, // First entity defaults to UPE
      entityType: entities.length === 0 ? 'UPE' : 'OPERATING',
    };
    setEntities((prev) => [...prev, newEntity]);
  }, [entities.length]);

  const updateEntity = useCallback(
    (id: string, updates: Partial<ChainEntity>) => {
      setEntities((prev) =>
        prev.map((e) => {
          if (e.id !== id) return e;
          const updated = { ...e, ...updates };
          // Auto-set MOCE flag based on ownership
          if ('ownershipPercent' in updates) {
            updated.isMOCE = isMOCE(updated.ownershipPercent);
            if (updated.isMOCE) {
              updated.entityType = 'MOCE';
            }
          }
          // Update entity type from flags
          if (
            'isUPE' in updates ||
            'isIPE' in updates ||
            'isMOCE' in updates
          ) {
            updated.entityType = resolveEntityType(updated);
          }
          // If setting as UPE, unset other UPEs
          if (updates.isUPE) {
            updated.parentEntityId = null;
          }
          return updated;
        })
      );
      // If setting this entity as UPE, unset others
      if (updates.isUPE) {
        setEntities((prev) =>
          prev.map((e) =>
            e.id !== id && e.isUPE ? { ...e, isUPE: false, entityType: resolveEntityType({ ...e, isUPE: false }) } : e
          )
        );
      }
    },
    []
  );

  const removeEntity = useCallback((id: string) => {
    setEntities((prev) => {
      const filtered = prev.filter((e) => e.id !== id);
      // Clear parent references to removed entity
      return filtered.map((e) =>
        e.parentEntityId === id ? { ...e, parentEntityId: null } : e
      );
    });
  }, []);

  // --- Jurisdiction CRUD ---
  const updateJurisdiction = useCallback(
    (id: string, updates: Partial<JurisdictionData>) => {
      setJurisdictions((prev) =>
        prev.map((j) => (j.id === id ? { ...j, ...updates } : j))
      );
      // Track what-if scenario changes
      if (
        'hasIIR' in updates ||
        'hasUTPR' in updates ||
        'hasQDMTT' in updates
      ) {
        const jur = jurisdictions.find((j) => j.id === id);
        onTrackCalculation?.('what_if_toggle', {
          jurisdiction: jur?.label,
          changedField: Object.keys(updates).join(', '),
        });
      }
    },
    [jurisdictions, onTrackCalculation]
  );

  const addJurisdiction = useCallback(() => {
    setJurisdictions((prev) => [
      ...prev,
      {
        id: generateJurisdictionId(),
        jurisdiction: '',
        label: '',
        isLowTaxed: false,
        topUpTaxAmount: 0,
        qdmmtAmount: 0,
        employeeCount: 0,
        tangibleAssetNBV: 0,
        hasIIR: false,
        hasUTPR: false,
        hasQDMTT: false,
        entityIds: [],
        isMOCE: false,
        moceOwnershipPercent: 0,
      },
    ]);
  }, []);

  const removeJurisdiction = useCallback((id: string) => {
    setJurisdictions((prev) => prev.filter((j) => j.id !== id));
  }, []);

  // --- Load H&C Scenario ---
  const loadCaseStudy = useCallback(() => {
    setGroupName(CASE_STUDY_GROUP_NAME);
    setEntities([...CASE_STUDY_ENTITIES]);
    setJurisdictions(CASE_STUDY_JURISDICTIONS.map((j) => ({ ...j })));
    setCurrentStepIndex(0);
    setErrors([]);
    setLoadMenuOpen(false);
  }, []);

  // --- Load Saved ---
  const loadSaved = useCallback(
    (saved: SavedAllocation) => {
      setGroupName(saved.groupName);
      setEntities(saved.entities.map((e) => ({ ...e })));
      setJurisdictions(saved.jurisdictions.map((j) => ({ ...j })));
      setCurrentStepIndex(0);
      setErrors([]);
      setLoadMenuOpen(false);
    },
    []
  );

  // --- Save ---
  const handleSave = useCallback(async () => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      await onSave({
        name: groupName || 'Untitled Assessment',
        groupName,
        entities,
        jurisdictions,
      });
    } finally {
      setIsSaving(false);
    }
  }, [onSave, groupName, entities, jurisdictions]);

  // --- Reset ---
  const handleReset = useCallback(() => {
    setGroupName('');
    setEntities([]);
    setJurisdictions([]);
    setCurrentStepIndex(0);
    setErrors([]);
  }, []);

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GitMerge className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle className="text-xl">
                  Charging Mechanism Allocation Workbench
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Allocate top-up tax across QDMTT, IIR, and UTPR — Articles
                  2.1–2.6
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {/* Load menu */}
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLoadMenuOpen(!loadMenuOpen)}
                >
                  <FolderOpen className="h-4 w-4 mr-1" />
                  Load
                </Button>
                {loadMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-64 bg-white border rounded-md shadow-lg z-50">
                    <button
                      className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 border-b"
                      onClick={loadCaseStudy}
                    >
                      <span className="font-medium">H&C Scenario</span>
                      <br />
                      <span className="text-xs text-gray-500">
                        Stratos Group — S2 base case
                      </span>
                    </button>
                    {savedItems.map((item) => (
                      <button
                        key={item.id}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex justify-between items-center"
                        onClick={() => loadSaved(item)}
                      >
                        <span>{item.name}</span>
                        {onDelete && (
                          <Trash2
                            className="h-3 w-3 text-red-400 hover:text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(item.id);
                            }}
                          />
                        )}
                      </button>
                    ))}
                    {savedItems.length === 0 && (
                      <div className="px-4 py-2 text-xs text-gray-400">
                        No saved assessments
                      </div>
                    )}
                  </div>
                )}
              </div>
              {onSave && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving || entities.length === 0}
                >
                  <Save className="h-4 w-4 mr-1" />
                  {isSaving ? 'Saving…' : 'Save'}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Step Progress Bar */}
      <div className="flex items-center gap-1 px-2">
        {STEP_CONFIGS.map((step, index) => {
          const isActive = index === currentStepIndex;
          const isCompleted = index < currentStepIndex;
          return (
            <React.Fragment key={step.key}>
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
              )}
              <button
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : isCompleted
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-gray-50 text-gray-500 border border-gray-200'
                }`}
                onClick={() => {
                  if (index <= currentStepIndex) {
                    setErrors([]);
                    setCurrentStepIndex(index);
                  }
                }}
                disabled={index > currentStepIndex}
              >
                {isCompleted ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-300 text-white'
                    }`}
                  >
                    {index + 1}
                  </span>
                )}
                <span className="hidden sm:inline">{step.label}</span>
                <span className="sm:hidden">{step.shortLabel}</span>
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {/* Educational Note */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-4">
          <button
            className="flex items-center gap-2 text-sm font-medium text-blue-800 w-full"
            onClick={() => setShowEducationalNote(!showEducationalNote)}
          >
            <Info className="h-4 w-4" />
            <span>Educational Note — {currentStep.label}</span>
            {currentStep.articleRef && (
              <span className="text-blue-500 text-xs ml-1">
                ({currentStep.articleRef})
              </span>
            )}
            {showEducationalNote ? (
              <ChevronUp className="h-4 w-4 ml-auto" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-auto" />
            )}
          </button>
          {showEducationalNote && (
            <p className="text-sm text-blue-700 mt-2 leading-relaxed">
              {STEP_EDUCATIONAL_NOTES[currentStep.key]}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Validation Errors */}
      {errors.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2">
              <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  Please fix the following:
                </p>
                <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                  {errors.map((err, i) => (
                    <li key={i}>{err.message}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step Content */}
      {currentStep.key === 'GROUP_STRUCTURE' && (
        <StepGroupStructure
          groupName={groupName}
          setGroupName={setGroupName}
          entities={entities}
          addEntity={addEntity}
          updateEntity={updateEntity}
          removeEntity={removeEntity}
        />
      )}
      {currentStep.key === 'JURISDICTION_DATA' && (
        <StepJurisdictionData
          jurisdictions={jurisdictions}
          updateJurisdiction={updateJurisdiction}
          addJurisdiction={addJurisdiction}
          removeJurisdiction={removeJurisdiction}
          showMechanismGuide={showMechanismGuide}
          setShowMechanismGuide={setShowMechanismGuide}
        />
      )}
      {currentStep.key === 'ALLOCATION_WATERFALL' && allocationResult && (
        <StepAllocationWaterfall
          result={allocationResult}
          showMechanismGuide={showMechanismGuide}
          setShowMechanismGuide={setShowMechanismGuide}
        />
      )}
      {currentStep.key === 'RESULTS' && allocationResult && (
        <StepResults result={allocationResult} groupName={groupName} />
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={currentStepIndex === 0 ? handleReset : goBack}
          className="flex items-center gap-1"
        >
          {currentStepIndex === 0 ? (
            'Reset'
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              Back
            </>
          )}
        </Button>
        {currentStepIndex < ALLOCATION_STEPS.length - 1 && (
          <Button
            onClick={goNext}
            disabled={!canGoNext()}
            className="flex items-center gap-1"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// STEP 1: GROUP STRUCTURE
// ============================================================

function StepGroupStructure({
  groupName,
  setGroupName,
  entities,
  addEntity,
  updateEntity,
  removeEntity,
}: {
  groupName: string;
  setGroupName: (name: string) => void;
  entities: ChainEntity[];
  addEntity: () => void;
  updateEntity: (id: string, updates: Partial<ChainEntity>) => void;
  removeEntity: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Group Name */}
      <Card>
        <CardContent className="pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            MNE Group Name
          </label>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="e.g. Stratos Holdings plc"
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </CardContent>
      </Card>

      {/* Entity List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Ownership Chain</CardTitle>
            <Button variant="outline" size="sm" onClick={addEntity}>
              <Plus className="h-4 w-4 mr-1" />
              Add Entity
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {entities.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              Add entities forming the ownership chain from UPE to low-taxed
              CEs.
              <br />
              Or use <strong>Load → H&C Scenario</strong> for the Stratos Group
              pre-loaded data.
            </p>
          ) : (
            <div className="space-y-3">
              {entities.map((entity) => (
                <EntityRow
                  key={entity.id}
                  entity={entity}
                  allEntities={entities}
                  onUpdate={updateEntity}
                  onRemove={removeEntity}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ownership Tree Preview */}
      {entities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ownership Tree Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <OwnershipTreePreview entities={entities} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function EntityRow({
  entity,
  allEntities,
  onUpdate,
  onRemove,
}: {
  entity: ChainEntity;
  allEntities: ChainEntity[];
  onUpdate: (id: string, updates: Partial<ChainEntity>) => void;
  onRemove: (id: string) => void;
}) {
  const possibleParents = allEntities.filter((e) => e.id !== entity.id);
  const impl = entity.jurisdiction
    ? getJurisdictionImplementation(entity.jurisdiction)
    : null;

  return (
    <div className="border rounded-md p-3 space-y-2 bg-white">
      <div className="flex items-center gap-2">
        {/* Entity Type Badge */}
        <span
          className={`text-xs px-2 py-0.5 rounded font-medium ${
            entity.isUPE
              ? 'bg-purple-100 text-purple-800'
              : entity.isIPE
                ? 'bg-blue-100 text-blue-800'
                : entity.isMOCE
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-gray-100 text-gray-700'
          }`}
        >
          {entity.entityType}
        </span>

        {/* Entity Name */}
        <input
          type="text"
          value={entity.entityName}
          onChange={(e) => onUpdate(entity.id, { entityName: e.target.value })}
          placeholder="Entity name"
          className="flex-1 border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />

        {/* Remove */}
        <button
          onClick={() => onRemove(entity.id)}
          className="text-red-400 hover:text-red-600 p-1"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Jurisdiction */}
        <div>
          <label className="text-xs text-gray-500">Jurisdiction</label>
          <select
            value={entity.jurisdiction}
            onChange={(e) => {
              const juris = e.target.value;
              const jurImpl = getJurisdictionImplementation(juris);
              onUpdate(entity.id, { jurisdiction: juris });
            }}
            className="w-full border rounded px-2 py-1 text-sm"
          >
            <option value="">Select…</option>
            {JURISDICTIONS.map((j) => (
              <option key={j.value} value={j.value}>
                {j.label}
              </option>
            ))}
          </select>
        </div>

        {/* Ownership */}
        <div>
          <label className="text-xs text-gray-500">Ownership %</label>
          <input
            type="number"
            min={0}
            max={100}
            value={entity.ownershipPercent}
            onChange={(e) =>
              onUpdate(entity.id, {
                ownershipPercent: parseFloat(e.target.value) || 0,
              })
            }
            className="w-full border rounded px-2 py-1 text-sm"
          />
        </div>

        {/* Parent */}
        <div>
          <label className="text-xs text-gray-500">Parent Entity</label>
          <select
            value={entity.parentEntityId ?? ''}
            onChange={(e) =>
              onUpdate(entity.id, {
                parentEntityId: e.target.value || null,
              })
            }
            className="w-full border rounded px-2 py-1 text-sm"
            disabled={entity.isUPE}
          >
            <option value="">{entity.isUPE ? 'N/A (UPE)' : 'Select…'}</option>
            {possibleParents.map((p) => (
              <option key={p.id} value={p.id}>
                {p.entityName || `Entity ${p.id}`}
              </option>
            ))}
          </select>
        </div>

        {/* Type flags */}
        <div>
          <label className="text-xs text-gray-500">Classification</label>
          <div className="flex gap-2 mt-1">
            <label className="flex items-center gap-1 text-xs">
              <input
                type="checkbox"
                checked={entity.isUPE}
                onChange={(e) =>
                  onUpdate(entity.id, { isUPE: e.target.checked })
                }
              />
              UPE
            </label>
            <label className="flex items-center gap-1 text-xs">
              <input
                type="checkbox"
                checked={entity.isIPE}
                onChange={(e) =>
                  onUpdate(entity.id, { isIPE: e.target.checked })
                }
                disabled={entity.isUPE || entity.isMOCE}
              />
              IPE
            </label>
            {entity.ownershipPercent < MOCE_THRESHOLD_PERCENT &&
              entity.ownershipPercent > 0 && (
                <span className="text-xs text-amber-700 font-medium">
                  MOCE (&lt;30%)
                </span>
              )}
          </div>
        </div>
      </div>

      {/* Jurisdiction implementation badges */}
      {impl && entity.jurisdiction && (
        <div className="flex gap-2 mt-1">
          <ImplementationBadge label="IIR" active={impl.hasIIR} />
          <ImplementationBadge label="UTPR" active={impl.hasUTPR} />
          <ImplementationBadge label="QDMTT" active={impl.hasQDMTT} />
        </div>
      )}
    </div>
  );
}

function ImplementationBadge({
  label,
  active,
}: {
  label: string;
  active: boolean;
}) {
  return (
    <span
      className={`text-xs px-1.5 py-0.5 rounded ${
        active
          ? 'bg-green-100 text-green-700'
          : 'bg-gray-100 text-gray-400 line-through'
      }`}
    >
      {label}
    </span>
  );
}

function OwnershipTreePreview({ entities }: { entities: ChainEntity[] }) {
  const upe = entities.find((e) => e.isUPE);
  if (!upe) return <p className="text-sm text-gray-500">No UPE designated.</p>;

  const renderNode = (entity: ChainEntity, depth: number): React.ReactNode => {
    const children = entities.filter(
      (e) => e.parentEntityId === entity.id
    );
    const indent = depth * 24;

    return (
      <div key={entity.id}>
        <div
          className="flex items-center gap-2 py-1 text-sm"
          style={{ paddingLeft: indent }}
        >
          {depth > 0 && (
            <span className="text-gray-300">└─</span>
          )}
          <Building className="h-3.5 w-3.5 text-gray-400" />
          <span className="font-medium">{entity.entityName || 'Unnamed'}</span>
          <span className="text-gray-400 text-xs">
            ({entity.jurisdiction || '?'})
          </span>
          {!entity.isUPE && (
            <span className="text-gray-400 text-xs">
              {entity.ownershipPercent}%
            </span>
          )}
          <span
            className={`text-xs px-1.5 py-0.5 rounded ${
              entity.isUPE
                ? 'bg-purple-100 text-purple-700'
                : entity.isIPE
                  ? 'bg-blue-100 text-blue-700'
                  : entity.isMOCE
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-gray-50 text-gray-500'
            }`}
          >
            {entity.entityType}
          </span>
        </div>
        {children.map((child) => renderNode(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="font-mono text-sm">{renderNode(upe, 0)}</div>
  );
}

// ============================================================
// STEP 2: JURISDICTIONAL DATA
// ============================================================

function StepJurisdictionData({
  jurisdictions,
  updateJurisdiction,
  addJurisdiction,
  removeJurisdiction,
  showMechanismGuide,
  setShowMechanismGuide,
}: {
  jurisdictions: JurisdictionData[];
  updateJurisdiction: (
    id: string,
    updates: Partial<JurisdictionData>
  ) => void;
  addJurisdiction: () => void;
  removeJurisdiction: (id: string) => void;
  showMechanismGuide: string | null;
  setShowMechanismGuide: (key: string | null) => void;
}) {
  const lowTaxed = jurisdictions.filter((j) => j.isLowTaxed);
  const nonLowTaxed = jurisdictions.filter((j) => !j.isLowTaxed);

  return (
    <div className="space-y-4">
      {/* Mechanism Quick Reference */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-2">
            {['QDMTT', 'IIR', 'UTPR', 'NON_ALLOCABLE'].map((key) => (
              <button
                key={key}
                className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                  showMechanismGuide === key
                    ? 'bg-amber-200 border-amber-400 text-amber-900'
                    : 'bg-white border-amber-200 text-amber-700 hover:bg-amber-100'
                }`}
                onClick={() =>
                  setShowMechanismGuide(
                    showMechanismGuide === key ? null : key
                  )
                }
              >
                {key.replace('_', '-')}
              </button>
            ))}
          </div>
          {showMechanismGuide && MECHANISM_GUIDANCE[showMechanismGuide] && (
            <p className="text-xs text-amber-800 mt-2 leading-relaxed">
              {MECHANISM_GUIDANCE[showMechanismGuide]}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Low-Taxed Jurisdictions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <CardTitle className="text-base">
                Low-Taxed Jurisdictions (Top-Up Tax to Allocate)
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {jurisdictions.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No jurisdictions populated. Go back to Step 1 to add entities,
              then jurisdictions will auto-populate.
            </p>
          ) : (
            <div className="space-y-3">
              {jurisdictions.map((jur) => (
                <JurisdictionRow
                  key={jur.id}
                  jurisdiction={jur}
                  onUpdate={updateJurisdiction}
                  onRemove={removeJurisdiction}
                />
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={addJurisdiction}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Jurisdiction
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      {lowTaxed.length > 0 && (
        <Card className="border-gray-200">
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500">Low-Taxed Jurisdictions</p>
                <p className="text-lg font-bold">{lowTaxed.length}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Top-Up Tax</p>
                <p className="text-lg font-bold text-red-600">
                  {formatEUR(
                    lowTaxed.reduce((s, j) => s + j.topUpTaxAmount, 0)
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total QDMTT</p>
                <p className="text-lg font-bold text-green-600">
                  {formatEUR(
                    lowTaxed.reduce((s, j) => s + j.qdmmtAmount, 0)
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">UTPR Jurisdictions</p>
                <p className="text-lg font-bold">
                  {nonLowTaxed.filter((j) => j.hasUTPR).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function JurisdictionRow({
  jurisdiction: jur,
  onUpdate,
  onRemove,
}: {
  jurisdiction: JurisdictionData;
  onUpdate: (id: string, updates: Partial<JurisdictionData>) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div
      className={`border rounded-md p-3 space-y-2 ${
        jur.isLowTaxed ? 'bg-red-50 border-red-200' : 'bg-white'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-sm">
            <input
              type="checkbox"
              checked={jur.isLowTaxed}
              onChange={(e) =>
                onUpdate(jur.id, { isLowTaxed: e.target.checked })
              }
              className="accent-red-600"
            />
            <span className="font-medium">{jur.label || jur.jurisdiction || 'New Jurisdiction'}</span>
          </label>
          {jur.isMOCE && (
            <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
              MOCE {jur.moceOwnershipPercent}%
            </span>
          )}
        </div>
        <button
          onClick={() => onRemove(jur.id)}
          className="text-red-400 hover:text-red-600 p-1"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Jurisdiction selector (for manually added) */}
      {!jur.jurisdiction && (
        <select
          value={jur.jurisdiction}
          onChange={(e) => {
            const juris = e.target.value;
            const impl = getJurisdictionImplementation(juris);
            onUpdate(jur.id, {
              jurisdiction: juris,
              label: juris,
              hasIIR: impl.hasIIR,
              hasUTPR: impl.hasUTPR,
              hasQDMTT: impl.hasQDMTT,
            });
          }}
          className="w-full border rounded px-2 py-1 text-sm"
        >
          <option value="">Select jurisdiction…</option>
          {JURISDICTIONS.map((j) => (
            <option key={j.value} value={j.value}>
              {j.label}
            </option>
          ))}
        </select>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Top-up tax */}
        <div>
          <label className="text-xs text-gray-500">Top-Up Tax (€)</label>
          <input
            type="number"
            min={0}
            value={jur.topUpTaxAmount || ''}
            onChange={(e) =>
              onUpdate(jur.id, {
                topUpTaxAmount: parseFloat(e.target.value) || 0,
              })
            }
            placeholder="0"
            className="w-full border rounded px-2 py-1 text-sm"
          />
        </div>

        {/* QDMTT */}
        <div>
          <label className="text-xs text-gray-500">QDMTT Collected (€)</label>
          <input
            type="number"
            min={0}
            value={jur.qdmmtAmount || ''}
            onChange={(e) =>
              onUpdate(jur.id, {
                qdmmtAmount: parseFloat(e.target.value) || 0,
              })
            }
            placeholder="0"
            className="w-full border rounded px-2 py-1 text-sm"
            disabled={!jur.hasQDMTT}
          />
        </div>

        {/* Employees */}
        <div>
          <label className="text-xs text-gray-500">Employees</label>
          <input
            type="number"
            min={0}
            value={jur.employeeCount || ''}
            onChange={(e) =>
              onUpdate(jur.id, {
                employeeCount: parseInt(e.target.value) || 0,
              })
            }
            placeholder="0"
            className="w-full border rounded px-2 py-1 text-sm"
          />
        </div>

        {/* Tangible Assets */}
        <div>
          <label className="text-xs text-gray-500">
            Tangible Assets NBV (€)
          </label>
          <input
            type="number"
            min={0}
            value={jur.tangibleAssetNBV || ''}
            onChange={(e) =>
              onUpdate(jur.id, {
                tangibleAssetNBV: parseFloat(e.target.value) || 0,
              })
            }
            placeholder="0"
            className="w-full border rounded px-2 py-1 text-sm"
          />
        </div>
      </div>

      {/* Implementation toggles (what-if) */}
      <div className="flex items-center gap-4 text-xs">
        <span className="text-gray-500">Implementation:</span>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={jur.hasIIR}
            onChange={(e) =>
              onUpdate(jur.id, { hasIIR: e.target.checked })
            }
          />
          <span className={jur.hasIIR ? 'text-green-700' : 'text-gray-400'}>
            IIR
          </span>
        </label>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={jur.hasUTPR}
            onChange={(e) =>
              onUpdate(jur.id, { hasUTPR: e.target.checked })
            }
          />
          <span className={jur.hasUTPR ? 'text-green-700' : 'text-gray-400'}>
            UTPR
          </span>
        </label>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={jur.hasQDMTT}
            onChange={(e) =>
              onUpdate(jur.id, { hasQDMTT: e.target.checked })
            }
          />
          <span className={jur.hasQDMTT ? 'text-green-700' : 'text-gray-400'}>
            QDMTT
          </span>
        </label>
        <span className="text-gray-400 ml-auto italic">
          Toggle for what-if scenarios
        </span>
      </div>
    </div>
  );
}

// ============================================================
// STEP 3: ALLOCATION WATERFALL
// ============================================================

function StepAllocationWaterfall({
  result,
  showMechanismGuide,
  setShowMechanismGuide,
}: {
  result: AllocationResult;
  showMechanismGuide: string | null;
  setShowMechanismGuide: (key: string | null) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Round 1: QDMTT */}
      <Card className="border-green-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            <CardTitle className="text-base text-green-800">
              Round 1: QDMTT Offset
            </CardTitle>
            <span className="text-xs text-green-500">
              Article 5.2.3 — Domestic collection takes priority
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-4 font-medium text-gray-600">
                    Jurisdiction
                  </th>
                  <th className="py-2 pr-4 font-medium text-gray-600 text-right">
                    Top-Up Tax
                  </th>
                  <th className="py-2 pr-4 font-medium text-green-700 text-right">
                    QDMTT Collected
                  </th>
                  <th className="py-2 font-medium text-gray-600 text-right">
                    Remaining
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.qdmmtEntries.map((entry, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-2 pr-4">{entry.jurisdictionLabel}</td>
                    <td className="py-2 pr-4 text-right">
                      {formatEUR(entry.topUpTax)}
                    </td>
                    <td className="py-2 pr-4 text-right text-green-700 font-medium">
                      {entry.qdmmtCollected > 0
                        ? `(${formatEUR(entry.qdmmtCollected)})`
                        : '—'}
                    </td>
                    <td
                      className={`py-2 text-right font-medium ${
                        entry.remaining > 0 ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {formatEUR(entry.remaining)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 font-bold">
                  <td className="py-2 pr-4">Total</td>
                  <td className="py-2 pr-4 text-right">
                    {formatEUR(result.totalTopUpTax)}
                  </td>
                  <td className="py-2 pr-4 text-right text-green-700">
                    ({formatEUR(result.totalQDMTT)})
                  </td>
                  <td className="py-2 text-right">
                    {formatEUR(result.totalTopUpTax - result.totalQDMTT)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Arrow */}
      <div className="flex justify-center">
        <ArrowDown className="h-6 w-6 text-gray-300" />
      </div>

      {/* Round 2: IIR */}
      <Card className="border-blue-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-base text-blue-800">
              Round 2: IIR Allocation
            </CardTitle>
            <span className="text-xs text-blue-500">
              Articles 2.1–2.3 — Ownership chain tracing
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-3 font-medium text-gray-600">
                    Low-Taxed Jurisdiction
                  </th>
                  <th className="py-2 pr-3 font-medium text-gray-600 text-right">
                    Remaining
                  </th>
                  <th className="py-2 pr-3 font-medium text-blue-700">
                    Collecting Entity
                  </th>
                  <th className="py-2 pr-3 font-medium text-gray-600 text-right">
                    Ownership
                  </th>
                  <th className="py-2 pr-3 font-medium text-blue-700 text-right">
                    IIR
                  </th>
                  <th className="py-2 font-medium text-amber-600 text-right">
                    Non-Allocable
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.iirEntries.map((entry, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-2 pr-3">{entry.jurisdictionLabel}</td>
                    <td className="py-2 pr-3 text-right">
                      {formatEUR(entry.remaining)}
                    </td>
                    <td className="py-2 pr-3 text-xs">
                      {entry.collectingEntityName}
                    </td>
                    <td className="py-2 pr-3 text-right">
                      {entry.effectiveOwnershipPercent > 0
                        ? formatPercentDirect(entry.effectiveOwnershipPercent, 0)
                        : '—'}
                    </td>
                    <td className="py-2 pr-3 text-right text-blue-700 font-medium">
                      {entry.iirAmount > 0 ? formatEUR(entry.iirAmount) : '—'}
                    </td>
                    <td className="py-2 text-right text-amber-600">
                      {entry.nonAllocable > 0
                        ? formatEUR(entry.nonAllocable)
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 font-bold">
                  <td className="py-2 pr-3" colSpan={2}></td>
                  <td className="py-2 pr-3 text-xs">
                    {result.iirCollectingEntity || '—'}
                  </td>
                  <td className="py-2 pr-3"></td>
                  <td className="py-2 pr-3 text-right text-blue-700">
                    {formatEUR(result.totalIIR)}
                  </td>
                  <td className="py-2 text-right text-amber-600">
                    {formatEUR(result.totalNonAllocable)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Residual for UTPR */}
          {result.residualForUTPR > 0 && (
            <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
              <strong>Residual to UTPR:</strong>{' '}
              {formatEUR(result.residualForUTPR)} — no IIR collector found in
              ownership chain for some jurisdictions.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Arrow */}
      <div className="flex justify-center">
        <ArrowDown className="h-6 w-6 text-gray-300" />
      </div>

      {/* Round 3: UTPR */}
      <Card className="border-amber-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-base text-amber-800">
              Round 3: UTPR Allocation
            </CardTitle>
            <span className="text-xs text-amber-500">
              Articles 2.4–2.6 — 50/50 substance formula (backstop)
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {result.utprEntries.length === 0 ? (
            <div className="text-center py-6 text-sm text-gray-500">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p>
                <strong>No UTPR allocation required.</strong>
              </p>
              <p className="mt-1">
                All top-up tax has been collected via QDMTT
                {result.totalIIR > 0 ? ' and IIR' : ''}. The UTPR backstop is
                not triggered.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 pr-3 font-medium text-gray-600">
                      UTPR Jurisdiction
                    </th>
                    <th className="py-2 pr-3 font-medium text-gray-600 text-right">
                      Employees
                    </th>
                    <th className="py-2 pr-3 font-medium text-gray-600 text-right">
                      Emp. Share
                    </th>
                    <th className="py-2 pr-3 font-medium text-gray-600 text-right">
                      Tangible Assets
                    </th>
                    <th className="py-2 pr-3 font-medium text-gray-600 text-right">
                      Asset Share
                    </th>
                    <th className="py-2 pr-3 font-medium text-gray-600 text-right">
                      Allocation %
                    </th>
                    <th className="py-2 font-medium text-amber-700 text-right">
                      UTPR Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.utprEntries.map((entry, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-2 pr-3">{entry.jurisdiction}</td>
                      <td className="py-2 pr-3 text-right">
                        {entry.employeeCount.toLocaleString('en-GB')}
                      </td>
                      <td className="py-2 pr-3 text-right">
                        {formatPercent(entry.employeeShare)}
                      </td>
                      <td className="py-2 pr-3 text-right">
                        {formatEUR(entry.tangibleAssetNBV)}
                      </td>
                      <td className="py-2 pr-3 text-right">
                        {formatPercent(entry.assetShare)}
                      </td>
                      <td className="py-2 pr-3 text-right font-medium">
                        {formatPercent(entry.allocationPercent)}
                      </td>
                      <td className="py-2 text-right text-amber-700 font-medium">
                        {formatEUR(entry.utprAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 font-bold">
                    <td className="py-2 pr-3">Total</td>
                    <td className="py-2 pr-3" colSpan={4}></td>
                    <td className="py-2 pr-3 text-right">100.00%</td>
                    <td className="py-2 text-right text-amber-700">
                      {formatEUR(result.totalUTPR)}
                    </td>
                  </tr>
                </tfoot>
              </table>
              <p className="text-xs text-gray-500 mt-2">
                Formula: 50% × (employees ÷ total employees) + 50% × (tangible
                assets ÷ total tangible assets)
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// STEP 4: RESULTS SUMMARY
// ============================================================

function StepResults({
  result,
  groupName,
}: {
  result: AllocationResult;
  groupName: string;
}) {
  return (
    <div className="space-y-4">
      {/* Key Banner */}
      <Card
        className={`${
          result.totalIIR === 0 && result.totalUTPR === 0
            ? 'border-green-300 bg-green-50'
            : 'border-blue-300 bg-blue-50'
        }`}
      >
        <CardContent className="pt-4">
          <div className="text-center">
            {result.totalIIR === 0 && result.totalUTPR === 0 ? (
              <>
                <CheckCircle className="h-10 w-10 text-green-600 mx-auto mb-2" />
                <p className="text-lg font-bold text-green-800">
                  All top-up tax collected via QDMTT
                </p>
                <p className="text-sm text-green-700 mt-1">
                  IIR liability to{' '}
                  {result.iirCollectingJurisdiction || 'UPE jurisdiction'} = €0.
                  No UTPR backstop required.
                </p>
              </>
            ) : (
              <>
                <GitMerge className="h-10 w-10 text-blue-600 mx-auto mb-2" />
                <p className="text-lg font-bold text-blue-800">
                  Multi-mechanism allocation
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  Top-up tax of {formatEUR(result.totalTopUpTax)} allocated
                  across{' '}
                  {[
                    result.totalQDMTT > 0 && 'QDMTT',
                    result.totalIIR > 0 && 'IIR',
                    result.totalUTPR > 0 && 'UTPR',
                  ]
                    .filter(Boolean)
                    .join(', ')}
                  .
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mechanism Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Mechanism Breakdown — {groupName || 'MNE Group'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
            <div className="p-3 rounded-md bg-gray-50">
              <p className="text-xs text-gray-500 uppercase">Total Top-Up Tax</p>
              <p className="text-xl font-bold text-gray-800">
                {formatEUR(result.totalTopUpTax)}
              </p>
            </div>
            <div className="p-3 rounded-md bg-green-50">
              <p className="text-xs text-green-600 uppercase">QDMTT</p>
              <p className="text-xl font-bold text-green-700">
                {formatEUR(result.totalQDMTT)}
              </p>
              <p className="text-xs text-green-500">
                {result.totalTopUpTax > 0
                  ? formatPercentDirect(
                      (result.totalQDMTT / result.totalTopUpTax) * 100,
                      1
                    )
                  : '0%'}
              </p>
            </div>
            <div className="p-3 rounded-md bg-blue-50">
              <p className="text-xs text-blue-600 uppercase">IIR</p>
              <p className="text-xl font-bold text-blue-700">
                {formatEUR(result.totalIIR)}
              </p>
              {result.iirCollectingEntity && result.totalIIR > 0 && (
                <p className="text-xs text-blue-500">
                  via {result.iirCollectingEntity}
                </p>
              )}
            </div>
            <div className="p-3 rounded-md bg-amber-50">
              <p className="text-xs text-amber-600 uppercase">UTPR</p>
              <p className="text-xl font-bold text-amber-700">
                {formatEUR(result.totalUTPR)}
              </p>
            </div>
            <div className="p-3 rounded-md bg-gray-50">
              <p className="text-xs text-gray-500 uppercase">Non-Allocable</p>
              <p className="text-xl font-bold text-gray-600">
                {formatEUR(result.totalNonAllocable)}
              </p>
              {result.totalNonAllocable > 0 && (
                <p className="text-xs text-gray-400">Outside shareholders</p>
              )}
            </div>
          </div>

          {/* Stacked bar visual */}
          {result.totalTopUpTax > 0 && (
            <div className="mt-4">
              <div className="flex h-6 rounded-md overflow-hidden">
                {result.totalQDMTT > 0 && (
                  <div
                    className="bg-green-500 flex items-center justify-center text-xs text-white font-medium"
                    style={{
                      width: `${(result.totalQDMTT / result.totalTopUpTax) * 100}%`,
                    }}
                  >
                    {result.totalQDMTT / result.totalTopUpTax > 0.1 &&
                      'QDMTT'}
                  </div>
                )}
                {result.totalIIR > 0 && (
                  <div
                    className="bg-blue-500 flex items-center justify-center text-xs text-white font-medium"
                    style={{
                      width: `${(result.totalIIR / result.totalTopUpTax) * 100}%`,
                    }}
                  >
                    {result.totalIIR / result.totalTopUpTax > 0.1 && 'IIR'}
                  </div>
                )}
                {result.totalUTPR > 0 && (
                  <div
                    className="bg-amber-500 flex items-center justify-center text-xs text-white font-medium"
                    style={{
                      width: `${(result.totalUTPR / result.totalTopUpTax) * 100}%`,
                    }}
                  >
                    {result.totalUTPR / result.totalTopUpTax > 0.1 && 'UTPR'}
                  </div>
                )}
                {result.totalNonAllocable > 0 && (
                  <div
                    className="bg-gray-400 flex items-center justify-center text-xs text-white font-medium"
                    style={{
                      width: `${(result.totalNonAllocable / result.totalTopUpTax) * 100}%`,
                    }}
                  >
                    {result.totalNonAllocable / result.totalTopUpTax > 0.15 &&
                      'N/A'}
                  </div>
                )}
              </div>
              <div className="flex gap-4 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-green-500 rounded-sm" />
                  QDMTT
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-blue-500 rounded-sm" />
                  IIR
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-amber-500 rounded-sm" />
                  UTPR
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-gray-400 rounded-sm" />
                  Non-allocable
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Per-Jurisdiction Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Per-Jurisdiction Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-3 font-medium text-gray-600">
                    Jurisdiction
                  </th>
                  <th className="py-2 pr-3 font-medium text-gray-600 text-right">
                    Top-Up Tax
                  </th>
                  <th className="py-2 pr-3 font-medium text-green-700 text-right">
                    QDMTT
                  </th>
                  <th className="py-2 pr-3 font-medium text-blue-700 text-right">
                    IIR
                  </th>
                  <th className="py-2 pr-3 font-medium text-amber-700 text-right">
                    UTPR
                  </th>
                  <th className="py-2 pr-3 font-medium text-gray-500 text-right">
                    Non-Alloc.
                  </th>
                  <th className="py-2 font-medium text-gray-600">
                    Mechanism
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.jurisdictionSummaries.map((summary, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-2 pr-3 font-medium">{summary.label}</td>
                    <td className="py-2 pr-3 text-right">
                      {formatEUR(summary.topUpTax)}
                    </td>
                    <td className="py-2 pr-3 text-right text-green-700">
                      {summary.qdmtt > 0 ? formatEUR(summary.qdmtt) : '—'}
                    </td>
                    <td className="py-2 pr-3 text-right text-blue-700">
                      {summary.iir > 0 ? formatEUR(summary.iir) : '—'}
                    </td>
                    <td className="py-2 pr-3 text-right text-amber-700">
                      {summary.utpr > 0 ? formatEUR(summary.utpr) : '—'}
                    </td>
                    <td className="py-2 pr-3 text-right text-gray-500">
                      {summary.nonAllocable > 0
                        ? formatEUR(summary.nonAllocable)
                        : '—'}
                    </td>
                    <td className="py-2">
                      <MechanismBadge mechanism={summary.primaryMechanism} />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 font-bold">
                  <td className="py-2 pr-3">Total</td>
                  <td className="py-2 pr-3 text-right">
                    {formatEUR(result.totalTopUpTax)}
                  </td>
                  <td className="py-2 pr-3 text-right text-green-700">
                    {formatEUR(result.totalQDMTT)}
                  </td>
                  <td className="py-2 pr-3 text-right text-blue-700">
                    {formatEUR(result.totalIIR)}
                  </td>
                  <td className="py-2 pr-3 text-right text-amber-700">
                    {formatEUR(result.totalUTPR)}
                  </td>
                  <td className="py-2 pr-3 text-right text-gray-500">
                    {formatEUR(result.totalNonAllocable)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* UTPR Allocation Detail (if applicable) */}
      {result.utprEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              UTPR Collection by Jurisdiction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 pr-3 font-medium text-gray-600">
                      Collecting Jurisdiction
                    </th>
                    <th className="py-2 pr-3 font-medium text-gray-600 text-right">
                      Allocation %
                    </th>
                    <th className="py-2 font-medium text-amber-700 text-right">
                      UTPR Collected
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.utprEntries.map((entry, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-2 pr-3">{entry.jurisdiction}</td>
                      <td className="py-2 pr-3 text-right">
                        {formatPercent(entry.allocationPercent)}
                      </td>
                      <td className="py-2 text-right text-amber-700 font-medium">
                        {formatEUR(entry.utprAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Insights */}
      <Card className="border-gray-200 bg-gray-50">
        <CardHeader>
          <CardTitle className="text-base">Key Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {result.totalQDMTT === result.totalTopUpTax &&
              result.totalTopUpTax > 0 && (
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>QDMTT collects 100% of top-up tax.</strong> All
                    low-taxed jurisdictions have implemented QDMTT, collecting
                    domestic top-up tax before IIR or UTPR apply. This is the
                    most common outcome as QDMTT adoption becomes widespread.
                  </span>
                </li>
              )}
            {result.totalIIR > 0 && (
              <li className="flex items-start gap-2">
                <Layers className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>
                    IIR collected by {result.iirCollectingEntity} (
                    {result.iirCollectingJurisdiction}).
                  </strong>{' '}
                  {formatEUR(result.totalIIR)} allocated through the ownership
                  chain to the UPE jurisdiction.
                </span>
              </li>
            )}
            {result.totalUTPR > 0 && (
              <li className="flex items-start gap-2">
                <BarChart3 className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>UTPR backstop activated.</strong>{' '}
                  {formatEUR(result.totalUTPR)} allocated across{' '}
                  {result.utprEntries.length} jurisdiction
                  {result.utprEntries.length > 1 ? 's' : ''} using the 50/50
                  substance formula.
                </span>
              </li>
            )}
            {result.totalNonAllocable > 0 && (
              <li className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>
                    Non-allocable amount: {formatEUR(result.totalNonAllocable)}.
                  </strong>{' '}
                  This is the portion of MOCE top-up tax attributable to
                  outside shareholders (not part of the MNE Group). It is not
                  collected by any GloBE mechanism.
                </span>
              </li>
            )}
            {result.totalIIR === 0 && result.totalUTPR === 0 && (
              <li className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Try the what-if scenarios.</strong> Go back to Step 2
                  and toggle QDMTT off for low-taxed jurisdictions to see how
                  IIR and UTPR would apply if QDMTT were not available.
                </span>
              </li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function MechanismBadge({
  mechanism,
}: {
  mechanism: string;
}) {
  const styles: Record<string, string> = {
    QDMTT: 'bg-green-100 text-green-800',
    IIR: 'bg-blue-100 text-blue-800',
    UTPR: 'bg-amber-100 text-amber-800',
    MIXED: 'bg-purple-100 text-purple-800',
    DE_MINIMIS: 'bg-gray-100 text-gray-600',
    NONE: 'bg-gray-100 text-gray-400',
  };

  return (
    <span
      className={`text-xs px-2 py-0.5 rounded font-medium ${styles[mechanism] || styles.NONE}`}
    >
      {mechanism.replace('_', ' ')}
    </span>
  );
}

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default ChargingAllocation;
