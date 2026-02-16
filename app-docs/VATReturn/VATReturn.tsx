'use client';

import React, { useState, useMemo, useCallback } from 'react';
import type {
  VATReturnProps,
  VATReturnSetup,
  TransactionEntry,
  TransactionType,
  BoxNumber,
  VATReturnBoxes,
  VATReturnBoxEntry,
  VATReturnResult,
  PartialExemptionData,
  ErrorCorrectionData,
  BadDebtReliefData,
  ValidationCheck,
  SavedVATReturnData,
  BusinessType,
  PEMethod,
} from './types';
import {
  VAT_RATES,
  calculateBox3,
  calculateBox5,
  calculateVATOnAmount,
  extractVATFromGross,
  calculatePartialExemption,
  checkErrorCorrectionThreshold,
  isBDRWaitingPeriodMet,
  isBDRWithinTimeLimit,
  calculateBDRAmount,
  runAllValidations,
  formatCurrency,
  calculateFilingDeadline,
  getNetPosition,
  generateTransactionId,
} from './utils';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  output_standard: 'Standard-rated sale (20%)',
  output_reduced: 'Reduced-rated sale (5%)',
  output_zero: 'Zero-rated domestic sale',
  output_exempt: 'Exempt supply',
  pva_output: 'PVA import — output',
  pva_input: 'PVA import — input',
  reverse_charge_output: 'Reverse charge — output',
  reverse_charge_input: 'Reverse charge — input',
  input_standard: 'Standard-rated purchase',
  input_zero: 'Zero-rated purchase',
  bdr_claim: 'Bad debt relief claim',
  error_correction: 'Error correction',
  pe_adjustment: 'PE adjustment',
  export: 'Zero-rated export',
  eu_acquisition: 'EU acquisition (NI)',
  eu_dispatch: 'EU dispatch (NI)',
};

const BOX_LABELS: Record<BoxNumber, string> = {
  1: 'VAT due on sales and other outputs',
  2: 'VAT due on acquisitions from EU member states',
  3: 'Total VAT due (auto-calculated)',
  4: 'VAT reclaimed on purchases and other inputs',
  5: 'Net VAT to pay or reclaim (auto-calculated)',
  6: 'Total value of sales excluding VAT',
  7: 'Total value of purchases excluding VAT',
  8: 'Total value of supplies to EU member states',
  9: 'Total value of acquisitions from EU member states',
};

const BOX_NOTES: Record<BoxNumber, string> = {
  1: 'Includes output tax on sales, reverse charge output, and PVA output. Does NOT include zero-rated or exempt supplies.',
  2: 'NI only — acquisition tax on goods acquired from EU. GB businesses leave this at zero.',
  3: 'Auto-calculated: Box 1 + Box 2.',
  4: 'Includes input tax on purchases, PVA input (if recoverable), RC input (if recoverable), BDR claims. Reduced by PE restriction and error corrections.',
  5: 'Auto-calculated: Box 3 − Box 4. Positive = payable to HMRC. Negative = repayable.',
  6: 'Total sales value excluding VAT. Includes zero-rated AND exempt supplies. Does NOT include PVA/RC output amounts.',
  7: 'Total purchases value excluding VAT. Includes PVA import values and RC service values. Does NOT include BDR claims.',
  8: 'NI only — value of goods dispatched to EU. GB businesses leave at zero.',
  9: 'NI only — value of goods acquired from EU. GB businesses leave at zero.',
};

/** Map each TransactionType to its box allocations */
function getBoxAllocations(
  type: TransactionType,
  net: number,
  vat: number
): Partial<Record<BoxNumber, number>> {
  switch (type) {
    case 'output_standard':
    case 'output_reduced':
      return { 1: vat, 6: net };
    case 'output_zero':
    case 'output_exempt':
      return { 6: net };
    case 'export':
      return { 6: net };
    case 'pva_output':
      return { 1: vat };
    case 'pva_input':
      return { 4: vat, 7: net };
    case 'reverse_charge_output':
      return { 1: vat };
    case 'reverse_charge_input':
      return { 4: vat, 7: net };
    case 'input_standard':
      return { 4: vat, 7: net };
    case 'input_zero':
      return { 7: net };
    case 'bdr_claim':
      return { 4: vat };
    case 'error_correction':
      // VAT amount is signed: positive adds, negative subtracts
      // correctionBox determines which box (1 or 4)
      return { 1: vat, 4: vat };
    case 'pe_adjustment':
      return { 4: -Math.abs(vat) };
    case 'eu_acquisition':
      return { 2: vat, 4: vat, 7: net, 9: net };
    case 'eu_dispatch':
      return { 6: net, 8: net };
    default:
      return {};
  }
}

/** Auto-calculate VAT for a transaction type and net amount */
function autoCalculateVAT(type: TransactionType, net: number): number {
  switch (type) {
    case 'output_standard':
    case 'pva_output':
    case 'reverse_charge_output':
    case 'input_standard':
      return calculateVATOnAmount(net, VAT_RATES.STANDARD);
    case 'output_reduced':
      return calculateVATOnAmount(net, VAT_RATES.REDUCED);
    case 'pva_input':
    case 'reverse_charge_input':
      return calculateVATOnAmount(net, VAT_RATES.STANDARD);
    case 'eu_acquisition':
      return calculateVATOnAmount(net, VAT_RATES.STANDARD);
    default:
      return 0;
  }
}

/** Get the default VAT rate label for a type */
function getDefaultVATRate(type: TransactionType): string {
  switch (type) {
    case 'output_standard':
    case 'pva_output':
    case 'reverse_charge_output':
    case 'pva_input':
    case 'reverse_charge_input':
    case 'input_standard':
    case 'eu_acquisition':
      return '20%';
    case 'output_reduced':
      return '5%';
    case 'output_zero':
    case 'output_exempt':
    case 'export':
    case 'input_zero':
    case 'eu_dispatch':
      return '0%';
    case 'bdr_claim':
      return '1/6';
    case 'error_correction':
    case 'pe_adjustment':
      return '—';
    default:
      return '—';
  }
}

/** Default setup state */
function defaultSetup(): VATReturnSetup {
  return {
    period: { startDate: '', endDate: '', monthsInPeriod: 3 },
    businessType: 'GB',
    pvaElected: true,
    partiallyExempt: false,
    peMethod: 'standard',
    hasErrorCorrection: false,
    returnType: 'quarterly',
  };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StepIndicator({ activeStep, onStepClick }: { activeStep: number; onStepClick: (s: number) => void }) {
  const steps = [
    { num: 1, label: 'Setup' },
    { num: 2, label: 'Transactions' },
    { num: 3, label: 'Review' },
  ];

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((s, i) => (
        <React.Fragment key={s.num}>
          {i > 0 && <div className="w-12 h-0.5 bg-gray-300" />}
          <button
            type="button"
            onClick={() => onStepClick(s.num)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeStep === s.num
                ? 'bg-blue-600 text-white'
                : activeStep > s.num
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  : 'bg-gray-100 text-gray-500'
            }`}
          >
            <span className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold border-2 border-current">
              {activeStep > s.num ? '✓' : s.num}
            </span>
            {s.label}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}

function BoxSummaryTable({ boxValues, businessType }: { boxValues: Record<BoxNumber, number>; businessType: BusinessType }) {
  const boxNumbers: BoxNumber[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const isGBDisabled = (box: BoxNumber) => businessType === 'GB' && (box === 2 || box === 8 || box === 9);
  const isAutoCalc = (box: BoxNumber) => box === 3 || box === 5;

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700">9-Box Summary</h3>
      </div>
      <table className="w-full text-sm">
        <tbody>
          {boxNumbers.map((box) => {
            const disabled = isGBDisabled(box);
            const auto = isAutoCalc(box);
            const val = boxValues[box];
            return (
              <tr key={box} className={`border-b border-gray-100 ${disabled ? 'bg-gray-50 text-gray-400' : ''} ${auto ? 'bg-blue-50' : ''}`}>
                <td className="px-4 py-2 font-medium">Box {box}</td>
                <td className="px-4 py-2 text-xs text-gray-500 max-w-[200px] truncate">{BOX_LABELS[box]}</td>
                <td className={`px-4 py-2 text-right font-mono ${val < 0 ? 'text-red-600' : ''}`}>
                  {disabled ? '—' : formatCurrency(val)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ValidationPanel({ checks }: { checks: ValidationCheck[] }) {
  const statusIcon = (s: string) => {
    switch (s) {
      case 'pass': return <span className="text-green-600 font-bold">✓</span>;
      case 'fail': return <span className="text-red-600 font-bold">✗</span>;
      case 'warning': return <span className="text-amber-500 font-bold">⚠</span>;
      case 'info': return <span className="text-blue-500 font-bold">ℹ</span>;
      default: return null;
    }
  };

  const statusBg = (s: string) => {
    switch (s) {
      case 'pass': return 'bg-green-50 border-green-200';
      case 'fail': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-amber-50 border-amber-200';
      case 'info': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-800">Validation Checks</h3>
      {checks.length === 0 && (
        <p className="text-sm text-gray-500">No validation checks to display.</p>
      )}
      {checks.map((check, idx) => (
        <div key={idx} className={`border rounded-lg p-4 ${statusBg(check.status)}`}>
          <div className="flex items-start gap-3">
            <div className="mt-0.5">{statusIcon(check.status)}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">{check.checkName}</span>
                {check.relatedBoxes.length > 0 && (
                  <span className="text-xs text-gray-500">
                    (Box{check.relatedBoxes.length > 1 ? 'es' : ''} {check.relatedBoxes.join(', ')})
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-700">{check.message}</p>
              {check.educationalNote && (
                <p className="text-xs text-gray-500 mt-2 italic">{check.educationalNote}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function VATReturn({
  userId,
  onSave,
  onDelete,
  savedItems = [],
  onTrackCalculation,
  onTrackStepChange,
  onTrackError,
  onTrackCompletion,
}: VATReturnProps) {
  // --- State ---
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [setup, setSetup] = useState<VATReturnSetup>(defaultSetup());
  const [transactions, setTransactions] = useState<TransactionEntry[]>([]);
  const [result, setResult] = useState<VATReturnResult | null>(null);
  const [savedItemId, setSavedItemId] = useState<string | null>(null);
  const [saveName, setSaveName] = useState('');
  const [saveScenario, setSaveScenario] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showSavedPanel, setShowSavedPanel] = useState(false);

  // PE module inputs
  const [peInputs, setPeInputs] = useState({
    taxableSupplies: 0,
    exemptSupplies: 0,
    directTaxableInputTax: 0,
    directExemptInputTax: 0,
    residualInputTax: 0,
  });
  const [peResult, setPeResult] = useState<PartialExemptionData | null>(null);

  // Error correction module inputs
  const [errorInputs, setErrorInputs] = useState({
    errorDescription: '',
    errorPeriod: '',
    netErrorAmount: 0,
    correctionBox: 1 as 1 | 4,
  });
  const [errorResult, setErrorResult] = useState<ErrorCorrectionData | null>(null);

  // BDR module inputs
  const [bdrInputs, setBdrInputs] = useState({
    debtorName: '',
    invoiceDate: '',
    paymentDueDate: '',
    dateOfSupply: '',
    dateWrittenOff: '',
    grossAmountUnpaid: 0,
    condition1_vatAccountedFor: false,
    condition2_writtenOff: false,
    condition3_sixMonthsMet: false,
    condition4_notAssigned: false,
    condition5_customaryPrice: false,
  });
  const [bdrResult, setBdrResult] = useState<BadDebtReliefData | null>(null);

  // New transaction form
  const [newTxn, setNewTxn] = useState({
    description: '',
    transactionType: 'output_standard' as TransactionType,
    netAmount: '',
    vatAmount: '',
  });

  // --- Step navigation ---
  const goToStep = useCallback((step: 1 | 2 | 3) => {
    onTrackStepChange?.(activeStep, step);
    setActiveStep(step);
  }, [activeStep, onTrackStepChange]);

  // --- Compute box values from transactions ---
  const boxValues = useMemo((): Record<BoxNumber, number> => {
    const sums: Record<BoxNumber, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };

    for (const txn of transactions) {
      const allocs = txn.boxAllocations;
      for (const [boxStr, amount] of Object.entries(allocs)) {
        const box = Number(boxStr) as BoxNumber;
        if (amount !== undefined) {
          sums[box] += amount;
        }
      }
    }

    // Auto-calculate Box 3 and Box 5
    sums[3] = calculateBox3(sums[1], sums[2]);
    sums[5] = calculateBox5(sums[3], sums[4]);

    // Round all to 2dp
    for (const box of [1, 2, 3, 4, 5, 6, 7, 8, 9] as BoxNumber[]) {
      sums[box] = Math.round(sums[box] * 100) / 100;
    }

    return sums;
  }, [transactions]);

  // --- Build VATReturnBoxes from transactions ---
  const buildBoxes = useCallback((): VATReturnBoxes => {
    const makeBox = (boxNum: BoxNumber, isAuto: boolean): VATReturnBoxEntry => {
      const txns = transactions.filter(t => {
        const allocs = t.boxAllocations;
        return allocs[boxNum] !== undefined && allocs[boxNum] !== 0;
      });
      return {
        boxNumber: boxNum,
        value: boxValues[boxNum],
        isAutoCalculated: isAuto,
        transactions: txns,
      };
    };

    return {
      box1: makeBox(1, false),
      box2: makeBox(2, false),
      box3: makeBox(3, true),
      box4: makeBox(4, false),
      box5: makeBox(5, true),
      box6: makeBox(6, false),
      box7: makeBox(7, false),
      box8: makeBox(8, false),
      box9: makeBox(9, false),
    };
  }, [transactions, boxValues]);

  // --- Add transaction ---
  const handleAddTransaction = useCallback(() => {
    const net = parseFloat(newTxn.netAmount) || 0;
    const autoVat = autoCalculateVAT(newTxn.transactionType, net);
    const vat = newTxn.vatAmount !== '' ? (parseFloat(newTxn.vatAmount) || 0) : autoVat;

    if (!newTxn.description.trim()) {
      onTrackError?.('Transaction description is required', { step: 2 });
      return;
    }

    const allocations = getBoxAllocations(newTxn.transactionType, net, vat);

    const entry: TransactionEntry = {
      id: generateTransactionId(),
      description: newTxn.description,
      netAmount: net,
      vatAmount: vat,
      transactionType: newTxn.transactionType,
      vatRate: newTxn.transactionType.includes('standard') ? 'standard'
        : newTxn.transactionType.includes('reduced') ? 'reduced'
        : newTxn.transactionType.includes('zero') || newTxn.transactionType === 'export' ? 'zero'
        : null,
      boxAllocations: allocations,
    };

    setTransactions(prev => [...prev, entry]);
    setNewTxn({ description: '', transactionType: 'output_standard', netAmount: '', vatAmount: '' });
  }, [newTxn, onTrackError]);

  // --- Remove transaction ---
  const handleRemoveTransaction = useCallback((id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  }, []);

  // --- PE calculation ---
  const handleCalculatePE = useCallback(() => {
    const peData = calculatePartialExemption(
      peInputs.taxableSupplies,
      peInputs.exemptSupplies,
      peInputs.directTaxableInputTax,
      peInputs.directExemptInputTax,
      peInputs.residualInputTax,
      setup.period.monthsInPeriod
    );
    setPeResult(peData);

    onTrackCalculation?.('Partial Exemption', {
      ratioRounded: peData.ratioRounded,
      isDeMinimis: peData.isDeMinimis,
      adjustmentAmount: peData.adjustmentAmount,
    });

    // If there's an adjustment, auto-add a pe_adjustment transaction
    if (peData.adjustmentAmount > 0) {
      // Remove any existing PE adjustment first
      setTransactions(prev => prev.filter(t => t.transactionType !== 'pe_adjustment'));
      const entry: TransactionEntry = {
        id: generateTransactionId(),
        description: `PE adjustment — restrict ${formatCurrency(peData.adjustmentAmount)} exempt input tax`,
        netAmount: 0,
        vatAmount: peData.adjustmentAmount,
        transactionType: 'pe_adjustment',
        vatRate: null,
        boxAllocations: { 4: -peData.adjustmentAmount },
      };
      setTransactions(prev => [...prev, entry]);
    }
  }, [peInputs, setup.period.monthsInPeriod, onTrackCalculation]);

  // --- Error correction ---
  const handleCalculateError = useCallback(() => {
    const thresholdCheck = checkErrorCorrectionThreshold(
      errorInputs.netErrorAmount,
      boxValues[6]
    );

    const errorData: ErrorCorrectionData = {
      errorDescription: errorInputs.errorDescription,
      errorPeriod: errorInputs.errorPeriod,
      netErrorAmount: errorInputs.netErrorAmount,
      currentBox6Turnover: boxValues[6],
      withinThreshold: thresholdCheck.withinThreshold,
      correctionBox: errorInputs.correctionBox,
    };
    setErrorResult(errorData);

    onTrackCalculation?.('Error Correction', {
      netErrorAmount: errorInputs.netErrorAmount,
      withinThreshold: thresholdCheck.withinThreshold,
      method: thresholdCheck.method,
    });

    if (thresholdCheck.withinThreshold) {
      // Remove any existing error correction transaction
      setTransactions(prev => prev.filter(t => t.transactionType !== 'error_correction'));

      const boxAllocs: Partial<Record<BoxNumber, number>> = {};
      if (errorInputs.correctionBox === 1) {
        boxAllocs[1] = errorInputs.netErrorAmount;
      } else {
        boxAllocs[4] = -errorInputs.netErrorAmount; // negative overclaim reduces Box 4
      }

      const entry: TransactionEntry = {
        id: generateTransactionId(),
        description: `Error correction: ${errorInputs.errorDescription || 'Adjustment'} (${errorInputs.errorPeriod})`,
        netAmount: 0,
        vatAmount: Math.abs(errorInputs.netErrorAmount),
        transactionType: 'error_correction',
        vatRate: null,
        boxAllocations: boxAllocs,
      };
      setTransactions(prev => [...prev, entry]);
    }
  }, [errorInputs, boxValues, onTrackCalculation]);

  // --- BDR calculation ---
  const handleCalculateBDR = useCallback(() => {
    const vatClaimed = calculateBDRAmount(bdrInputs.grossAmountUnpaid);
    const allConditionsMet =
      bdrInputs.condition1_vatAccountedFor &&
      bdrInputs.condition2_writtenOff &&
      bdrInputs.condition3_sixMonthsMet &&
      bdrInputs.condition4_notAssigned &&
      bdrInputs.condition5_customaryPrice;

    const waitingMet = setup.period.endDate
      ? isBDRWaitingPeriodMet(bdrInputs.paymentDueDate, bdrInputs.dateOfSupply, setup.period.endDate)
      : false;
    const withinLimit = setup.period.endDate
      ? isBDRWithinTimeLimit(bdrInputs.paymentDueDate, bdrInputs.dateOfSupply, setup.period.endDate)
      : false;

    const data: BadDebtReliefData = {
      ...bdrInputs,
      vatAmountClaimed: vatClaimed,
      condition3_sixMonthsMet: waitingMet,
    };
    setBdrResult(data);

    onTrackCalculation?.('Bad Debt Relief', {
      grossAmountUnpaid: bdrInputs.grossAmountUnpaid,
      vatClaimed,
      allConditionsMet,
      waitingMet,
      withinLimit,
    });

    if (allConditionsMet && waitingMet && withinLimit) {
      // Remove existing BDR transactions
      setTransactions(prev => prev.filter(t => t.transactionType !== 'bdr_claim'));
      const entry: TransactionEntry = {
        id: generateTransactionId(),
        description: `BDR claim — ${bdrInputs.debtorName} (${formatCurrency(bdrInputs.grossAmountUnpaid)} unpaid)`,
        netAmount: 0,
        vatAmount: vatClaimed,
        transactionType: 'bdr_claim',
        vatRate: null,
        boxAllocations: { 4: vatClaimed },
      };
      setTransactions(prev => [...prev, entry]);
    } else {
      onTrackError?.('BDR conditions not fully met', {
        allConditionsMet,
        waitingMet,
        withinLimit,
      });
    }
  }, [bdrInputs, setup.period.endDate, onTrackCalculation, onTrackError]);

  // --- Submit / Review ---
  const handleSubmit = useCallback(() => {
    const boxes = buildBoxes();
    const checks = runAllValidations(setup, boxes, peResult, errorResult, bdrResult);
    const netPos = getNetPosition(boxValues[5]);
    const deadline = calculateFilingDeadline(setup.period.endDate);
    const allPass = checks.every(c => c.status !== 'fail');

    const returnResult: VATReturnResult = {
      setup,
      boxes,
      partialExemptionData: peResult,
      errorCorrectionData: errorResult,
      badDebtReliefData: bdrResult,
      validationChecks: checks,
      netPosition: netPos,
      netAmount: boxValues[5],
      filingDeadline: deadline.toISOString().slice(0, 10),
      allChecksPass: allPass,
    };

    setResult(returnResult);

    if (allPass) {
      onTrackCompletion?.({
        netPosition: netPos,
        netAmount: boxValues[5],
        boxCount: transactions.length,
      });
    } else {
      const failCount = checks.filter(c => c.status === 'fail').length;
      onTrackError?.(`${failCount} validation check(s) failed`, { checks: checks.map(c => ({ name: c.checkName, status: c.status })) });
    }

    goToStep(3);
  }, [buildBoxes, setup, peResult, errorResult, bdrResult, boxValues, transactions.length, onTrackCompletion, onTrackError, goToStep]);

  // --- Save ---
  const handleSave = useCallback(async () => {
    if (!onSave) return;
    setSaveStatus('saving');
    try {
      const boxes = buildBoxes();
      const id = await onSave({
        name: saveName || `VAT Return — ${setup.period.startDate} to ${setup.period.endDate}`,
        sectionScenario: saveScenario,
        setup,
        boxes,
        partialExemptionData: peResult,
        errorCorrectionData: errorResult,
        badDebtReliefData: bdrResult,
        result,
      });
      setSavedItemId(id);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
      onTrackError?.('Failed to save VAT return', {});
    }
  }, [onSave, saveName, saveScenario, setup, buildBoxes, peResult, errorResult, bdrResult, result, onTrackError]);

  // --- Load saved item ---
  const handleLoad = useCallback((item: SavedVATReturnData) => {
    setSetup(item.setup);
    setSavedItemId(item.id);
    setSaveName(item.name);
    setSaveScenario(item.sectionScenario);

    // Rebuild transactions from box data
    const allTxns: TransactionEntry[] = [];
    const seen = new Set<string>();
    const allBoxes = [item.boxes.box1, item.boxes.box2, item.boxes.box3, item.boxes.box4, item.boxes.box5, item.boxes.box6, item.boxes.box7, item.boxes.box8, item.boxes.box9];
    for (const box of allBoxes) {
      for (const txn of box.transactions) {
        if (!seen.has(txn.id)) {
          seen.add(txn.id);
          allTxns.push(txn);
        }
      }
    }
    setTransactions(allTxns);

    if (item.partialExemptionData) {
      setPeResult(item.partialExemptionData);
      setPeInputs({
        taxableSupplies: item.partialExemptionData.taxableSupplies,
        exemptSupplies: item.partialExemptionData.exemptSupplies,
        directTaxableInputTax: item.partialExemptionData.directTaxableInputTax,
        directExemptInputTax: item.partialExemptionData.directExemptInputTax,
        residualInputTax: item.partialExemptionData.residualInputTax,
      });
    }
    if (item.errorCorrectionData) {
      setErrorResult(item.errorCorrectionData);
      setErrorInputs({
        errorDescription: item.errorCorrectionData.errorDescription,
        errorPeriod: item.errorCorrectionData.errorPeriod,
        netErrorAmount: item.errorCorrectionData.netErrorAmount,
        correctionBox: item.errorCorrectionData.correctionBox,
      });
    }
    if (item.badDebtReliefData) {
      setBdrResult(item.badDebtReliefData);
      setBdrInputs({
        debtorName: item.badDebtReliefData.debtorName,
        invoiceDate: item.badDebtReliefData.invoiceDate,
        paymentDueDate: item.badDebtReliefData.paymentDueDate,
        dateOfSupply: item.badDebtReliefData.dateOfSupply,
        dateWrittenOff: item.badDebtReliefData.dateWrittenOff,
        grossAmountUnpaid: item.badDebtReliefData.grossAmountUnpaid,
        condition1_vatAccountedFor: item.badDebtReliefData.condition1_vatAccountedFor,
        condition2_writtenOff: item.badDebtReliefData.condition2_writtenOff,
        condition3_sixMonthsMet: item.badDebtReliefData.condition3_sixMonthsMet,
        condition4_notAssigned: item.badDebtReliefData.condition4_notAssigned,
        condition5_customaryPrice: item.badDebtReliefData.condition5_customaryPrice,
      });
    }
    if (item.result) {
      setResult(item.result);
    }

    setActiveStep(1);
    setShowSavedPanel(false);
  }, []);

  // --- Delete saved item ---
  const handleDeleteSaved = useCallback(async (id: string) => {
    if (!onDelete) return;
    await onDelete(id);
    if (savedItemId === id) setSavedItemId(null);
  }, [onDelete, savedItemId]);

  // --- Available transaction types based on setup ---
  const availableTypes = useMemo((): TransactionType[] => {
    const base: TransactionType[] = [
      'output_standard', 'output_reduced', 'output_zero', 'output_exempt', 'export',
      'input_standard', 'input_zero',
    ];
    if (setup.pvaElected) {
      base.push('pva_output', 'pva_input');
    }
    base.push('reverse_charge_output', 'reverse_charge_input');
    base.push('bdr_claim');
    if (setup.businessType === 'XI') {
      base.push('eu_acquisition', 'eu_dispatch');
    }
    // pe_adjustment and error_correction are added by their respective modules, not manually
    return base;
  }, [setup.pvaElected, setup.businessType]);

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">VAT Return (Boxes 1-9)</h1>
            <p className="text-sm text-gray-500 mt-1">Complete a UK VAT return with transaction-level breakdown and validation</p>
          </div>
          <div className="flex gap-2">
            {savedItems.length > 0 && (
              <button
                type="button"
                onClick={() => setShowSavedPanel(!showSavedPanel)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Saved Returns ({savedItems.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Saved items panel */}
      {showSavedPanel && savedItems.length > 0 && (
        <div className="mb-6 bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Saved VAT Returns</h3>
          <div className="space-y-2">
            {savedItems.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-sm font-medium">{item.name}</span>
                  {item.sectionScenario && (
                    <span className="text-xs text-gray-500 ml-2">({item.sectionScenario})</span>
                  )}
                  <span className="text-xs text-gray-400 ml-2">
                    {new Date(item.updatedAt).toLocaleDateString('en-GB')}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleLoad(item)}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Load
                  </button>
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => handleDeleteSaved(item.id)}
                      className="px-3 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step indicator */}
      <StepIndicator activeStep={activeStep} onStepClick={(s) => goToStep(s as 1 | 2 | 3)} />

      {/* ================================================================= */}
      {/* STEP 1: SETUP                                                     */}
      {/* ================================================================= */}
      {activeStep === 1 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Return Setup</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Period dates */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Period Start Date</label>
              <input
                type="date"
                value={setup.period.startDate}
                onChange={(e) => setSetup(s => ({ ...s, period: { ...s.period, startDate: e.target.value } }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Period End Date</label>
              <input
                type="date"
                value={setup.period.endDate}
                onChange={(e) => setSetup(s => ({ ...s, period: { ...s.period, endDate: e.target.value } }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Return type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Return Type</label>
              <select
                value={setup.returnType}
                onChange={(e) => {
                  const val = e.target.value as 'quarterly' | 'monthly' | 'annual';
                  const months = val === 'monthly' ? 1 : val === 'quarterly' ? 3 : 12;
                  setSetup(s => ({ ...s, returnType: val, period: { ...s.period, monthsInPeriod: months as 1 | 3 | 12 } }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </select>
            </div>

            {/* Business type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
              <select
                value={setup.businessType}
                onChange={(e) => setSetup(s => ({ ...s, businessType: e.target.value as BusinessType }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="GB">GB — Great Britain only</option>
                <option value="XI">XI — Northern Ireland (dual registration)</option>
              </select>
            </div>

            {/* Toggles */}
            <div className="md:col-span-2 space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={setup.pvaElected}
                  onChange={(e) => setSetup(s => ({ ...s, pvaElected: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">Postponed VAT Accounting elected</span>
                  <p className="text-xs text-gray-500">Account for import VAT on the return instead of paying at the border</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={setup.partiallyExempt}
                  onChange={(e) => setSetup(s => ({ ...s, partiallyExempt: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">Partially exempt business</span>
                  <p className="text-xs text-gray-500">Makes both taxable and exempt supplies — PE module will appear in Step 2</p>
                </div>
              </label>

              {setup.partiallyExempt && (
                <div className="ml-7">
                  <label className="block text-sm font-medium text-gray-700 mb-1">PE Method</label>
                  <select
                    value={setup.peMethod}
                    onChange={(e) => setSetup(s => ({ ...s, peMethod: e.target.value as PEMethod }))}
                    className="w-48 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="standard">Standard method</option>
                    <option value="special">Special method</option>
                  </select>
                </div>
              )}

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={setup.hasErrorCorrection}
                  onChange={(e) => setSetup(s => ({ ...s, hasErrorCorrection: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">Include error correction</span>
                  <p className="text-xs text-gray-500">Correct errors from previous periods on this return</p>
                </div>
              </label>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                if (!setup.period.startDate || !setup.period.endDate) {
                  onTrackError?.('Period dates are required', { step: 1 });
                  return;
                }
                goToStep(2);
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Next: Enter Transactions
            </button>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* STEP 2: TRANSACTIONS                                              */}
      {/* ================================================================= */}
      {activeStep === 2 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Transaction entry */}
            <div className="lg:col-span-2 space-y-6">
              {/* Add transaction form */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Add Transaction</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input
                      type="text"
                      value={newTxn.description}
                      onChange={(e) => setNewTxn(t => ({ ...t, description: e.target.value }))}
                      placeholder="e.g. UK domestic sales Q4"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
                    <select
                      value={newTxn.transactionType}
                      onChange={(e) => {
                        const type = e.target.value as TransactionType;
                        setNewTxn(t => ({
                          ...t,
                          transactionType: type,
                          vatAmount: '', // reset to auto-calculate
                        }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      {availableTypes.map(type => (
                        <option key={type} value={type}>{TRANSACTION_TYPE_LABELS[type]}</option>
                      ))}
                    </select>
                    <span className="text-xs text-gray-500 mt-1 block">
                      Default rate: {getDefaultVATRate(newTxn.transactionType)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Net Amount (GBP)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newTxn.netAmount}
                      onChange={(e) => setNewTxn(t => ({ ...t, netAmount: e.target.value }))}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      VAT Amount (GBP)
                      <span className="text-xs text-gray-400 ml-1">auto-calculated, editable</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newTxn.vatAmount !== '' ? newTxn.vatAmount : autoCalculateVAT(newTxn.transactionType, parseFloat(newTxn.netAmount) || 0).toFixed(2)}
                      onChange={(e) => setNewTxn(t => ({ ...t, vatAmount: e.target.value }))}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                    />
                  </div>
                  <div className="md:col-span-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddTransaction}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                    >
                      Add Transaction
                    </button>
                  </div>
                </div>
              </div>

              {/* Transaction list */}
              {transactions.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700">
                      Transactions ({transactions.length})
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Description</th>
                          <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Type</th>
                          <th className="text-right px-4 py-2 text-xs font-medium text-gray-500">Net</th>
                          <th className="text-right px-4 py-2 text-xs font-medium text-gray-500">VAT</th>
                          <th className="text-center px-4 py-2 text-xs font-medium text-gray-500">Boxes</th>
                          <th className="px-4 py-2"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {transactions.map(txn => (
                          <tr key={txn.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 max-w-[200px] truncate">{txn.description}</td>
                            <td className="px-4 py-2 text-xs text-gray-500">{TRANSACTION_TYPE_LABELS[txn.transactionType]}</td>
                            <td className="px-4 py-2 text-right font-mono">{formatCurrency(txn.netAmount)}</td>
                            <td className="px-4 py-2 text-right font-mono">{formatCurrency(txn.vatAmount)}</td>
                            <td className="px-4 py-2 text-center text-xs text-gray-500">
                              {Object.entries(txn.boxAllocations)
                                .filter(([, v]) => v !== undefined && v !== 0)
                                .map(([b]) => `B${b}`)
                                .join(', ')}
                            </td>
                            <td className="px-4 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveTransaction(txn.id)}
                                className="text-red-500 hover:text-red-700 text-xs"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* PE Module */}
              {setup.partiallyExempt && (
                <div className="bg-white border border-amber-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">Partial Exemption Module</h3>
                  <p className="text-xs text-gray-500 mb-4">Standard method apportionment (s.26 VATA 1994)</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Taxable Supplies (GBP)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={peInputs.taxableSupplies || ''}
                        onChange={(e) => setPeInputs(p => ({ ...p, taxableSupplies: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Exempt Supplies (GBP)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={peInputs.exemptSupplies || ''}
                        onChange={(e) => setPeInputs(p => ({ ...p, exemptSupplies: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Direct Taxable Input Tax</label>
                      <input
                        type="number"
                        step="0.01"
                        value={peInputs.directTaxableInputTax || ''}
                        onChange={(e) => setPeInputs(p => ({ ...p, directTaxableInputTax: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Direct Exempt Input Tax</label>
                      <input
                        type="number"
                        step="0.01"
                        value={peInputs.directExemptInputTax || ''}
                        onChange={(e) => setPeInputs(p => ({ ...p, directExemptInputTax: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Residual Input Tax</label>
                      <input
                        type="number"
                        step="0.01"
                        value={peInputs.residualInputTax || ''}
                        onChange={(e) => setPeInputs(p => ({ ...p, residualInputTax: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handleCalculatePE}
                        className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700"
                      >
                        Calculate PE
                      </button>
                    </div>
                  </div>

                  {/* PE Result */}
                  {peResult && (
                    <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <h4 className="text-sm font-semibold text-gray-800 mb-2">PE Calculation Result</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">Taxable ratio:</span>
                          <span className="ml-2 font-mono font-medium">{peResult.ratioRaw.toFixed(2)}% → {peResult.ratioRounded}%</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Recoverable residual:</span>
                          <span className="ml-2 font-mono font-medium">{formatCurrency(peResult.recoverableResidual)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Non-recoverable:</span>
                          <span className="ml-2 font-mono font-medium">{formatCurrency(peResult.nonRecoverableResidual)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Total exempt input tax:</span>
                          <span className="ml-2 font-mono font-medium">{formatCurrency(peResult.totalExemptInputTax)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">De minimis Test 1:</span>
                          <span className={`ml-2 font-medium ${peResult.deMinimisTest1Pass ? 'text-green-600' : 'text-red-600'}`}>
                            {peResult.deMinimisTest1Pass ? 'Pass' : 'Fail'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">De minimis Test 2:</span>
                          <span className={`ml-2 font-medium ${peResult.deMinimisTest2Pass ? 'text-green-600' : 'text-red-600'}`}>
                            {peResult.deMinimisTest2Pass ? 'Pass' : 'Fail'}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-amber-200">
                        {peResult.isDeMinimis ? (
                          <p className="text-sm text-green-700 font-medium">
                            De minimis — all input tax is recoverable. No Box 4 adjustment needed.
                          </p>
                        ) : (
                          <p className="text-sm text-red-700 font-medium">
                            Not de minimis — Box 4 reduced by {formatCurrency(peResult.adjustmentAmount)} (PE adjustment added to transactions).
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Error Correction Module */}
              {setup.hasErrorCorrection && (
                <div className="bg-white border border-purple-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">Error Correction Module</h3>
                  <p className="text-xs text-gray-500 mb-4">VAT Notice 700/45 — correct errors from previous periods</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Error Description</label>
                      <input
                        type="text"
                        value={errorInputs.errorDescription}
                        onChange={(e) => setErrorInputs(ei => ({ ...ei, errorDescription: e.target.value }))}
                        placeholder="e.g. Output tax understated on zero-rated export"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Error Period</label>
                      <input
                        type="text"
                        value={errorInputs.errorPeriod}
                        onChange={(e) => setErrorInputs(ei => ({ ...ei, errorPeriod: e.target.value }))}
                        placeholder="e.g. Q2 2025/26"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Net Error Amount (GBP)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={errorInputs.netErrorAmount || ''}
                        onChange={(e) => setErrorInputs(ei => ({ ...ei, netErrorAmount: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                      />
                      <span className="text-xs text-gray-500">Positive = underpaid output tax. Negative = overclaimed input tax.</span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Correction Box</label>
                      <select
                        value={errorInputs.correctionBox}
                        onChange={(e) => setErrorInputs(ei => ({ ...ei, correctionBox: Number(e.target.value) as 1 | 4 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value={1}>Box 1 — Output tax underpaid</option>
                        <option value={4}>Box 4 — Input tax overclaimed</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handleCalculateError}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
                      >
                        Check Threshold
                      </button>
                    </div>
                  </div>

                  {errorResult && (
                    <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <p className={`text-sm font-medium ${errorResult.withinThreshold ? 'text-green-700' : 'text-amber-700'}`}>
                        {errorResult.withinThreshold
                          ? 'Within threshold — error correction added to transactions.'
                          : 'Exceeds threshold — you must notify HMRC separately. Transaction NOT added.'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* BDR Module */}
              {transactions.some(t => t.transactionType === 'bdr_claim') || (
                <details className="bg-white border border-gray-200 rounded-lg">
                  <summary className="px-6 py-4 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-50">
                    Bad Debt Relief Module (click to expand)
                  </summary>
                  <div className="px-6 pb-6">
                    <p className="text-xs text-gray-500 mb-4">s.36 VATA 1994 — claim relief for unpaid debts</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Debtor Name</label>
                        <input
                          type="text"
                          value={bdrInputs.debtorName}
                          onChange={(e) => setBdrInputs(b => ({ ...b, debtorName: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Gross Amount Unpaid (GBP)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={bdrInputs.grossAmountUnpaid || ''}
                          onChange={(e) => setBdrInputs(b => ({ ...b, grossAmountUnpaid: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                        />
                        {bdrInputs.grossAmountUnpaid > 0 && (
                          <span className="text-xs text-gray-500">VAT element (x1/6): {formatCurrency(calculateBDRAmount(bdrInputs.grossAmountUnpaid))}</span>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
                        <input
                          type="date"
                          value={bdrInputs.invoiceDate}
                          onChange={(e) => setBdrInputs(b => ({ ...b, invoiceDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Due Date</label>
                        <input
                          type="date"
                          value={bdrInputs.paymentDueDate}
                          onChange={(e) => setBdrInputs(b => ({ ...b, paymentDueDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date of Supply (Tax Point)</label>
                        <input
                          type="date"
                          value={bdrInputs.dateOfSupply}
                          onChange={(e) => setBdrInputs(b => ({ ...b, dateOfSupply: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date Written Off</label>
                        <input
                          type="date"
                          value={bdrInputs.dateWrittenOff}
                          onChange={(e) => setBdrInputs(b => ({ ...b, dateWrittenOff: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                    </div>

                    {/* 5 conditions checkboxes */}
                    <div className="mt-4 space-y-2">
                      <h4 className="text-sm font-medium text-gray-700">5 Statutory Conditions (s.36 VATA 1994)</h4>
                      {[
                        { key: 'condition1_vatAccountedFor', label: '1. VAT accounted for and paid to HMRC' },
                        { key: 'condition2_writtenOff', label: '2. Debt written off in accounts' },
                        { key: 'condition3_sixMonthsMet', label: '3. 6 months since later of payment due / date of supply' },
                        { key: 'condition4_notAssigned', label: '4. Debt not assigned or factored' },
                        { key: 'condition5_customaryPrice', label: '5. Supply at customary selling price' },
                      ].map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={bdrInputs[key as keyof typeof bdrInputs] as boolean}
                            onChange={(e) => setBdrInputs(b => ({ ...b, [key]: e.target.checked }))}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600"
                          />
                          <span className="text-sm text-gray-700">{label}</span>
                        </label>
                      ))}
                    </div>

                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={handleCalculateBDR}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                      >
                        Calculate BDR
                      </button>
                    </div>

                    {bdrResult && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm">
                          <span className="font-medium">VAT claim amount:</span>{' '}
                          <span className="font-mono">{formatCurrency(bdrResult.vatAmountClaimed)}</span>
                        </p>
                        <p className="text-sm mt-1">
                          <span className="font-medium">6-month wait:</span>{' '}
                          <span className={bdrResult.condition3_sixMonthsMet ? 'text-green-600' : 'text-red-600'}>
                            {bdrResult.condition3_sixMonthsMet ? 'Met' : 'Not yet met'}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>

            {/* Right: Box summary sidebar */}
            <div className="space-y-4">
              <BoxSummaryTable boxValues={boxValues} businessType={setup.businessType} />

              {/* Box educational notes */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-xs font-semibold text-gray-600 uppercase mb-2">Box Notes</h4>
                <div className="space-y-2">
                  {([1, 2, 3, 4, 5, 6, 7, 8, 9] as BoxNumber[]).map(box => (
                    <div key={box} className="text-xs text-gray-500">
                      <span className="font-medium text-gray-700">Box {box}:</span>{' '}
                      {BOX_NOTES[box]}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => goToStep(1)}
              className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Back: Setup
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Review & Submit
            </button>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* STEP 3: REVIEW & SUBMIT                                           */}
      {/* ================================================================= */}
      {activeStep === 3 && result && (
        <div className="space-y-6">
          {/* Net position banner */}
          <div className={`rounded-lg p-6 text-center ${
            result.netPosition === 'payable'
              ? 'bg-red-50 border border-red-200'
              : result.netPosition === 'repayable'
                ? 'bg-green-50 border border-green-200'
                : 'bg-gray-50 border border-gray-200'
          }`}>
            <p className="text-sm text-gray-600 mb-1">Net VAT Position</p>
            <p className={`text-3xl font-bold font-mono ${
              result.netPosition === 'payable'
                ? 'text-red-700'
                : result.netPosition === 'repayable'
                  ? 'text-green-700'
                  : 'text-gray-700'
            }`}>
              {formatCurrency(Math.abs(result.netAmount))}
            </p>
            <p className={`text-sm font-medium mt-1 ${
              result.netPosition === 'payable'
                ? 'text-red-600'
                : result.netPosition === 'repayable'
                  ? 'text-green-600'
                  : 'text-gray-600'
            }`}>
              {result.netPosition === 'payable'
                ? 'Payable to HMRC'
                : result.netPosition === 'repayable'
                  ? 'Repayable by HMRC'
                  : 'Nil return'}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Filing deadline: {new Date(result.filingDeadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* 9-box summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BoxSummaryTable boxValues={boxValues} businessType={setup.businessType} />

            {/* Validation panel */}
            <ValidationPanel checks={result.validationChecks} />
          </div>

          {/* Overall status */}
          <div className={`rounded-lg p-4 text-center ${
            result.allChecksPass
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            <p className={`text-sm font-semibold ${result.allChecksPass ? 'text-green-700' : 'text-red-700'}`}>
              {result.allChecksPass
                ? 'All validation checks passed — return is ready for submission.'
                : `${result.validationChecks.filter(c => c.status === 'fail').length} check(s) failed — review and correct before submitting.`}
            </p>
          </div>

          {/* Common Errors reference */}
          <details className="bg-white border border-gray-200 rounded-lg">
            <summary className="px-6 py-4 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-50">
              Common Errors Reference
            </summary>
            <div className="px-6 pb-6">
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                <li><strong>Omitting one side of RC/PVA</strong> — Must enter BOTH output (Box 1) and input (Box 4)</li>
                <li><strong>Including BDR in Box 7</strong> — BDR only enters Box 4; Box 7 is not adjusted</li>
                <li><strong>Forgetting PE adjustment</strong> — If exempt supplies exist, input tax must be restricted</li>
                <li><strong>Entering blocked entertainment</strong> — Business entertainment VAT is wholly blocked; do not include</li>
                <li><strong>GB business using Boxes 8/9</strong> — These are for NI intra-Community trade only</li>
                <li><strong>Wrong error correction method</strong> — Check threshold before adjusting on return vs notifying HMRC</li>
                <li><strong>Missing export evidence</strong> — Zero-rated exports require proof within 3 months</li>
                <li><strong>Exempt supplies excluded from Box 6</strong> — Box 6 includes ALL sales (taxable + exempt)</li>
              </ol>
            </div>
          </details>

          {/* Save section */}
          {onSave && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Save This Return</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Return Name</label>
                  <input
                    type="text"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder={`VAT Return — ${setup.period.startDate} to ${setup.period.endDate}`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section / Scenario (optional)</label>
                  <input
                    type="text"
                    value={saveScenario}
                    onChange={(e) => setSaveScenario(e.target.value)}
                    placeholder="e.g. Case Study 10.B"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleSave}
                disabled={saveStatus === 'saving'}
                className={`px-6 py-2 rounded-lg text-sm font-medium ${
                  saveStatus === 'saved'
                    ? 'bg-green-600 text-white'
                    : saveStatus === 'error'
                      ? 'bg-red-600 text-white'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                } disabled:opacity-50`}
              >
                {saveStatus === 'saving' ? 'Saving...'
                  : saveStatus === 'saved' ? 'Saved'
                  : saveStatus === 'error' ? 'Error — try again'
                  : savedItemId ? 'Update Saved Return' : 'Save Return'}
              </button>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => goToStep(2)}
              className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Back: Edit Transactions
            </button>
            {!result.allChecksPass && (
              <button
                type="button"
                onClick={() => goToStep(2)}
                className="px-6 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700"
              >
                Fix Issues
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default VATReturn;
