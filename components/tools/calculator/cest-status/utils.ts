/**
 * CEST Employment Status Tool — Utility Functions
 *
 * Pure functions for evaluating employment status based on the five
 * CEST assessment areas: control, substitution, mutuality of obligation,
 * financial risk, and in business on own account.
 *
 * Scoring: negative weights = employment indicator, positive = self-employment.
 */

import type {
  EmploymentStatus,
  IndicatorDirection,
  AssessmentAreaId,
  WorkerEngagement,
  ClientSize,
  ConfidenceLevel,
  UndeterminedLeaning,
  AnswerOption,
  AssessmentQuestion,
  AssessmentArea,
  CaseLawReference,
  PreliminaryInputs,
  QuestionAnswer,
  CestInputs,
  QuestionResult,
  AreaResult,
  IR35Implications,
  KeyFactorsSummary,
  OverallDetermination,
  ValidationResult,
  CestOutput,
  HCScenario,
} from './types';

// ─── Determination Thresholds ─────────────────────────────────────────────────

const EMPLOYED_THRESHOLD = -10;
const SELF_EMPLOYED_THRESHOLD = 10;
const LEANING_EMPLOYMENT_THRESHOLD = -5;
const LEANING_SELF_EMPLOYMENT_THRESHOLD = 5;

// ─── Case Law References ─────────────────────────────────────────────────────

export const CASE_LAW: CaseLawReference[] = [
  {
    name: 'Ready Mixed Concrete v Minister of Pensions',
    citation: '[1968] 2 QB 497',
    year: 1968,
    areas: ['control'],
    principle:
      'Three conditions for a contract of service: (1) the worker agrees to provide their own work and skill in consideration of a wage, (2) the worker agrees expressly or impliedly to be subject to the other party\'s control, and (3) the other provisions of the contract are consistent with it being a contract of service.',
  },
  {
    name: 'Market Investigations v Minister of Social Security',
    citation: '[1969] 2 QB 173',
    year: 1969,
    areas: ['financial-risk', 'in-business'],
    principle:
      'The fundamental test: is the person performing the services doing so as a person in business on their own account? Relevant factors include financial risk, investment of own capital, opportunity for profit and loss, and provision of own equipment.',
  },
  {
    name: 'Hall v Lorimer',
    citation: '[1994] 1 WLR 209',
    year: 1994,
    areas: ['in-business'],
    principle:
      'No single test is determinative. The court must consider many different factors and paint a picture from the accumulation of detail — it is the overall picture that matters, not any single brush stroke.',
  },
  {
    name: 'Pimlico Plumbers v Smith',
    citation: '[2018] UKSC 29',
    year: 2018,
    areas: ['substitution'],
    principle:
      'A substitution clause requiring client approval was held to be too limited to constitute a genuine unfettered right of substitution. The Supreme Court looked at the reality of the arrangement, not just the contractual wording.',
  },
  {
    name: 'Autoclenz v Belcher',
    citation: '[2011] UKSC 41',
    year: 2011,
    areas: ['substitution', 'control'],
    principle:
      'Courts must adopt a purposive approach to contractual terms. Where the written contract does not reflect the true agreement between the parties, the court will look at the reality of the working relationship, not just the written terms.',
  },
  {
    name: 'Carmichael v National Power',
    citation: '[1999] 1 WLR 2042',
    year: 1999,
    areas: ['moo'],
    principle:
      'Mutuality of obligation is the irreducible minimum for a contract of employment. Without an obligation on the employer to provide work and an obligation on the worker to perform it, there is no employment relationship.',
  },
  {
    name: 'Nethermere (St Neots) v Gardiner',
    citation: '[1984] ICR 612',
    year: 1984,
    areas: ['moo'],
    principle:
      'Even without a formal written contract, a regular pattern of work over time can give rise to an implied mutuality of obligation. An "umbrella contract" may exist where the parties have established a course of dealing.',
  },
  {
    name: 'Lee v Chung',
    citation: '[1990] 2 AC 374',
    year: 1990,
    areas: ['in-business'],
    principle:
      'The Privy Council confirmed the overall "economic reality" test: the fundamental question is whether the worker is performing services as a person in business on their own account.',
  },
];

/** Get case law references for a specific area */
export function getCaseLawForArea(areaId: AssessmentAreaId): CaseLawReference[] {
  return CASE_LAW.filter((c) => c.areas.includes(areaId));
}

// ─── Question Bank ────────────────────────────────────────────────────────────

function opt(key: string, text: string, weight: number): AnswerOption {
  const direction: IndicatorDirection =
    weight < 0 ? 'employment' : weight > 0 ? 'self-employment' : 'neutral';
  return { key, text, weight, direction };
}

const CONTROL_QUESTIONS: AssessmentQuestion[] = [
  {
    id: 'C1',
    areaId: 'control',
    text: 'Who decides what work the worker does on a day-to-day basis?',
    options: [
      opt('a', 'The client decides and allocates specific tasks', -1),
      opt('b', 'The client sets broad objectives but the worker plans their own day-to-day tasks', 1),
      opt('c', 'The worker decides their own workload and priorities', 2),
    ],
    educationalNote:
      'Ready Mixed Concrete: the right to control WHAT work is done is a fundamental indicator of employment. If the client directs specific tasks, this suggests an employment relationship. If the worker has autonomy to plan their own work, it suggests self-employment.',
  },
  {
    id: 'C2',
    areaId: 'control',
    text: 'Does the client direct how the work should be carried out?',
    options: [
      opt('a', 'Yes \u2014 the client instructs the worker on methods and approach', -2),
      opt('b', 'No \u2014 the client specifies the end result but the worker chooses their own methods', 1),
      opt('c', 'No \u2014 the worker has complete autonomy over how they deliver the work', 2),
    ],
    educationalNote:
      'The HOW test is one of the strongest control indicators. An employer tells workers not just WHAT to do but HOW to do it. A self-employed person is engaged for a result \u2014 they choose their own methods.',
  },
  {
    id: 'C3',
    areaId: 'control',
    text: 'Can the client move the worker to different tasks beyond the agreed scope?',
    options: [
      opt('a', 'Yes \u2014 the client can reassign the worker to different work', -2),
      opt('b', 'Only within the worker\u2019s specialism or area of expertise', 0),
      opt('c', 'No \u2014 the worker only does the specific work originally agreed', 1),
    ],
    educationalNote:
      'The power to redeploy a worker to different tasks is characteristic of employment. A self-employed worker is engaged for specific work \u2014 you cannot reassign them to something outside the agreed scope.',
  },
  {
    id: 'C4',
    areaId: 'control',
    text: 'Does the client decide when and where the work is done?',
    options: [
      opt('a', 'Yes \u2014 the client specifies working hours and requires attendance at their premises', -2),
      opt('b', 'Partly \u2014 the worker must attend the client\u2019s premises for some tasks but has flexibility on hours', 0),
      opt('c', 'No \u2014 the worker chooses their own hours and work location', 2),
    ],
    educationalNote:
      'Fixed hours at the client\u2019s premises is a strong employment indicator. Self-employed workers typically choose when and where to work. However, some on-site attendance may be necessary for practical reasons (e.g., using specialist equipment) without indicating employment.',
  },
];

const SUBSTITUTION_QUESTIONS: AssessmentQuestion[] = [
  {
    id: 'S1',
    areaId: 'substitution',
    text: 'Does the worker have a contractual right to send a substitute to do the work in their place?',
    options: [
      opt('a', 'No \u2014 the contract requires the worker to do the work personally', -2),
      opt('b', 'Yes \u2014 but the client must approve any substitute before they can work', 0),
      opt('c', 'Yes \u2014 the worker has an unrestricted right to send a suitable substitute', 2),
    ],
    educationalNote:
      'Personal service is fundamental to employment. An obligation to perform work personally is the strongest single indicator of employment. A genuine unfettered right of substitution points strongly to self-employment. Note: a right requiring client approval is considered weak (Pimlico Plumbers v Smith [2018]).',
  },
  {
    id: 'S2',
    areaId: 'substitution',
    text: 'Has the worker ever actually sent a substitute to do the work?',
    options: [
      opt('a', 'No \u2014 the worker has always done the work personally', -1),
      opt('b', 'Yes \u2014 a substitute has done the work at least once', 2),
      opt('c', 'Not applicable \u2014 there is no substitution right', 0),
    ],
    educationalNote:
      'A substitution clause that has never been exercised may be a sham (Autoclenz v Belcher [2011]). Courts look at the reality, not just the written contract. If the right exists but has never been used, its genuineness is questionable. An exercised substitution right is very strong evidence of self-employment.',
  },
  {
    id: 'S3',
    areaId: 'substitution',
    text: 'If a substitute is or could be sent, who pays the substitute?',
    options: [
      opt('a', 'The client would pay the substitute directly', -1),
      opt('b', 'The worker would pay the substitute from their own fee', 2),
      opt('c', 'Not applicable', 0),
    ],
    educationalNote:
      'If the worker pays the substitute from their own fee, they bear genuine financial risk \u2014 a strong self-employment indicator. If the client pays the substitute directly, it looks more like the client hiring a different worker \u2014 the original worker has no financial stake in the substitution.',
  },
];

const MOO_QUESTIONS: AssessmentQuestion[] = [
  {
    id: 'M1',
    areaId: 'moo',
    text: 'Is the client obliged to offer work to the worker on an ongoing basis?',
    options: [
      opt('a', 'Yes \u2014 there is a contractual commitment to provide regular work', -2),
      opt('b', 'There is a rolling engagement but work volume is not guaranteed', -1),
      opt('c', 'No \u2014 work is offered project by project with no guarantee of future work', 2),
    ],
    educationalNote:
      'Mutuality of obligation (MOO) is the irreducible minimum for an employment contract (Carmichael v National Power [1999]). Without an obligation to provide work, there cannot be a contract of employment. Project-based engagements with no guaranteed future work point to self-employment.',
  },
  {
    id: 'M2',
    areaId: 'moo',
    text: 'Is the worker obliged to accept work when offered?',
    options: [
      opt('a', 'Yes \u2014 the worker must accept work when it is available', -2),
      opt('b', 'The worker is generally expected to be available but can negotiate', -1),
      opt('c', 'No \u2014 the worker can freely decline work without consequence', 2),
    ],
    educationalNote:
      'If the worker MUST accept work when offered, this completes the mutual obligation at the heart of employment. A self-employed person can refuse work \u2014 they are not obliged to accept every commission.',
  },
  {
    id: 'M3',
    areaId: 'moo',
    text: 'What is the arrangement for ending the engagement?',
    options: [
      opt('a', 'The worker has employment-like notice periods or continuous service', -2),
      opt('b', 'There is a fixed notice period for termination (e.g., 1\u20133 months)', -1),
      opt('c', 'Either party can end the engagement immediately or with minimal notice', 1),
    ],
    educationalNote:
      'Long notice periods and concepts of continuous service are features of employment. A self-employed engagement for a specific project simply ends when the work is completed. Ongoing engagements with substantial notice periods suggest an employment-like relationship.',
  },
];

const FINANCIAL_RISK_QUESTIONS: AssessmentQuestion[] = [
  {
    id: 'F1',
    areaId: 'financial-risk',
    text: 'Does the worker provide their own equipment, tools, or software for the work?',
    options: [
      opt('a', 'No \u2014 the client provides all equipment, tools, and software', -2),
      opt('b', 'The worker provides some minor items but the client supplies major equipment', -1),
      opt('c', 'Yes \u2014 the worker provides their own significant equipment at their own cost', 2),
    ],
    educationalNote:
      'Market Investigations: providing your own equipment and bearing the investment cost is a hallmark of self-employment. An employee uses the employer\u2019s equipment \u2014 they do not invest their own capital in the means of production.',
  },
  {
    id: 'F2',
    areaId: 'financial-risk',
    text: 'If the work is unsatisfactory, who bears the cost of putting it right?',
    options: [
      opt('a', 'The client \u2014 the worker is paid regardless and corrections are handled internally', -1),
      opt('b', 'The worker must redo the work but is paid for the additional time', 0),
      opt('c', 'The worker \u2014 they must correct work at their own expense with no additional payment', 2),
    ],
    educationalNote:
      'Bearing the financial risk of defective work is a key self-employment indicator. An employee is paid a wage regardless of output quality \u2014 the employer bears the risk of poor work. A self-employed person who must put right defective work at their own cost is taking genuine financial risk.',
  },
  {
    id: 'F3',
    areaId: 'financial-risk',
    text: 'How is the worker paid?',
    options: [
      opt('a', 'Regular fixed amounts (weekly/monthly) similar to a salary', -1),
      opt('b', 'By invoice, based on time worked (e.g., day rate multiplied by days)', 0),
      opt('c', 'Fixed price per project or deliverable \u2014 payment does not depend on time taken', 2),
    ],
    educationalNote:
      'Payment by the hour/day with no risk is employment-like (a salary). A fixed-price contract means the worker bears genuine financial risk \u2014 if the work takes longer than expected, the worker absorbs the cost overrun. Day-rate invoicing is intermediate and does not strongly indicate either direction.',
  },
  {
    id: 'F4',
    areaId: 'financial-risk',
    text: 'Could the worker make a financial loss on this engagement?',
    options: [
      opt('a', 'No \u2014 the worker is guaranteed payment for all time worked', -1),
      opt('b', 'Unlikely \u2014 but there is some risk of reduced or delayed payment', 0),
      opt('c', 'Yes \u2014 the worker could lose money if costs exceed their fee', 2),
    ],
    educationalNote:
      'The possibility of profit AND loss is a key indicator of self-employment (Market Investigations). An employee cannot make a loss \u2014 they receive a wage regardless. A self-employed person who risks losing money if the engagement goes badly is genuinely in business on their own account.',
  },
];

const IN_BUSINESS_QUESTIONS: AssessmentQuestion[] = [
  {
    id: 'B1',
    areaId: 'in-business',
    text: 'Does the worker provide similar services to other clients?',
    options: [
      opt('a', 'No \u2014 the worker works exclusively for this client', -2),
      opt('b', 'The worker has 1\u20132 other minor clients but this is their main engagement', 0),
      opt('c', 'Yes \u2014 the worker has multiple clients and this is one of several', 2),
    ],
    educationalNote:
      'Working exclusively for one client is a strong employment indicator \u2014 it suggests economic dependence. Having multiple clients, where no single client dominates, indicates genuine self-employment. However, a single exclusive client is not determinative on its own (Hall v Lorimer).',
  },
  {
    id: 'B2',
    areaId: 'in-business',
    text: 'Does the worker advertise or market their services?',
    options: [
      opt('a', 'No \u2014 the worker does not advertise', -1),
      opt('b', 'The worker has a basic online presence (LinkedIn profile, simple website)', 0),
      opt('c', 'Yes \u2014 the worker actively markets their services to attract new clients', 1),
    ],
    educationalNote:
      'Self-employed people need to find their own work. Advertising and marketing are hallmarks of being in business on your own account. An employee does not need to market themselves \u2014 work comes to them through the employment relationship.',
  },
  {
    id: 'B3',
    areaId: 'in-business',
    text: 'What business structure does the worker operate through?',
    options: [
      opt('a', 'The worker is engaged as an individual with no formal business structure', -1),
      opt('b', 'The worker operates through a limited company (PSC) but it is essentially just them', 0),
      opt('c', 'The worker has a genuine business with employees, premises, or significant infrastructure', 2),
    ],
    educationalNote:
      'A PSC alone does NOT determine employment status \u2014 that is the entire point of IR35. The legislation looks through the intermediary to the underlying working relationship. However, a genuine business with its own employees, separate premises, and real business infrastructure is a strong indicator of self-employment.',
  },
  {
    id: 'B4',
    areaId: 'in-business',
    text: 'How integrated is the worker into the client\u2019s organisation?',
    options: [
      opt('a', 'The worker is treated like staff \u2014 attends team meetings, has company email, appears on org chart', -2),
      opt('b', 'The worker interacts with the client\u2019s team but is clearly identified as external', 0),
      opt('c', 'The worker operates independently with minimal day-to-day involvement in the client\u2019s operations', 1),
    ],
    educationalNote:
      'Integration into the client\u2019s organisation is a strong employment indicator. Self-employed workers typically maintain a clear separation \u2014 they deliver work product but are not "part of the team." Company emails, org chart inclusion, and staff meeting attendance all point to employment.',
  },
];

// ─── Assessment Areas ─────────────────────────────────────────────────────────

export const ASSESSMENT_AREAS: AssessmentArea[] = [
  {
    id: 'control',
    name: 'Control',
    description: 'Who decides what, how, when, and where the work is done?',
    questions: CONTROL_QUESTIONS,
    caseLawRefs: ['Ready Mixed Concrete v Minister of Pensions', 'Autoclenz v Belcher'],
  },
  {
    id: 'substitution',
    name: 'Substitution',
    description: 'Does the worker have a genuine right to send a substitute?',
    questions: SUBSTITUTION_QUESTIONS,
    caseLawRefs: ['Pimlico Plumbers v Smith', 'Autoclenz v Belcher'],
  },
  {
    id: 'moo',
    name: 'Mutuality of Obligation',
    description: 'Is there an obligation to offer and accept work?',
    questions: MOO_QUESTIONS,
    caseLawRefs: ['Carmichael v National Power', 'Nethermere (St Neots) v Gardiner'],
  },
  {
    id: 'financial-risk',
    name: 'Financial Risk',
    description: 'Does the worker bear genuine financial risk?',
    questions: FINANCIAL_RISK_QUESTIONS,
    caseLawRefs: ['Market Investigations v Minister of Social Security'],
  },
  {
    id: 'in-business',
    name: 'In Business on Own Account',
    description: 'Is the worker genuinely running their own business?',
    questions: IN_BUSINESS_QUESTIONS,
    caseLawRefs: ['Hall v Lorimer', 'Lee v Chung', 'Market Investigations v Minister of Social Security'],
  },
];

/** Get all questions as a flat array */
export function getAllQuestions(): AssessmentQuestion[] {
  return ASSESSMENT_AREAS.flatMap((area) => area.questions);
}

/** Get a question by ID */
export function getQuestionById(id: string): AssessmentQuestion | undefined {
  return getAllQuestions().find((q) => q.id === id);
}

/** Get an assessment area by ID */
export function getAreaById(id: AssessmentAreaId): AssessmentArea | undefined {
  return ASSESSMENT_AREAS.find((a) => a.id === id);
}

// ─── Assessment Logic ─────────────────────────────────────────────────────────

/** Determine the direction of an area based on its score */
function areaDirection(score: number): IndicatorDirection {
  if (score < 0) return 'employment';
  if (score > 0) return 'self-employment';
  return 'neutral';
}

/** Evaluate a single assessment area */
function evaluateArea(
  area: AssessmentArea,
  answers: Record<string, QuestionAnswer>
): AreaResult {
  const questionResults: QuestionResult[] = area.questions.map((q) => {
    const answer = answers[q.id];
    if (!answer) {
      return {
        questionId: q.id,
        questionText: q.text,
        selectedAnswer: '(unanswered)',
        weight: 0,
        direction: 'neutral' as IndicatorDirection,
      };
    }

    const selectedOption = q.options.find((o) => o.key === answer.selectedKey);
    return {
      questionId: q.id,
      questionText: q.text,
      selectedAnswer: selectedOption?.text ?? '(unknown)',
      weight: answer.weight,
      direction: selectedOption?.direction ?? 'neutral',
    };
  });

  const areaScore = questionResults.reduce((sum, qr) => sum + qr.weight, 0);

  return {
    areaId: area.id,
    areaName: area.name,
    areaScore,
    areaDirection: areaDirection(areaScore),
    questionResults,
    caseLawReferences: getCaseLawForArea(area.id),
  };
}

/** Check if the substitution override is triggered */
function checkSubstitutionOverride(answers: Record<string, QuestionAnswer>): boolean {
  const s1 = answers['S1'];
  const s2 = answers['S2'];
  const s3 = answers['S3'];

  if (!s1 || !s2 || !s3) return false;

  // Unrestricted right (S1=c, weight +2) AND exercised (S2=b, weight +2) AND worker pays (S3=b, weight +2)
  return s1.selectedKey === 'c' && s2.selectedKey === 'b' && s3.selectedKey === 'b';
}

/** Determine the overall employment status */
function determineStatus(
  overallScore: number,
  substitutionOverride: boolean
): { status: EmploymentStatus; confidence: ConfidenceLevel; leaning: UndeterminedLeaning | null } {
  if (substitutionOverride) {
    return { status: 'self-employed', confidence: 'decisive', leaning: null };
  }

  if (overallScore <= EMPLOYED_THRESHOLD) {
    const confidence: ConfidenceLevel = overallScore <= EMPLOYED_THRESHOLD - 5 ? 'decisive' : 'marginal';
    return { status: 'employed', confidence, leaning: null };
  }

  if (overallScore >= SELF_EMPLOYED_THRESHOLD) {
    const confidence: ConfidenceLevel = overallScore >= SELF_EMPLOYED_THRESHOLD + 5 ? 'decisive' : 'marginal';
    return { status: 'self-employed', confidence, leaning: null };
  }

  // Undetermined
  let leaning: UndeterminedLeaning;
  if (overallScore <= LEANING_EMPLOYMENT_THRESHOLD) {
    leaning = 'employment';
  } else if (overallScore >= LEANING_SELF_EMPLOYMENT_THRESHOLD) {
    leaning = 'self-employment';
  } else {
    leaning = 'evenly-balanced';
  }

  return { status: 'undetermined', confidence: 'marginal', leaning };
}

/** Generate determination reason text */
function generateReason(
  status: EmploymentStatus,
  overallScore: number,
  areaResults: AreaResult[],
  substitutionOverride: boolean,
  leaning: UndeterminedLeaning | null
): string {
  if (substitutionOverride) {
    return 'The worker has a genuine, unrestricted right of substitution that has been exercised, with the worker paying the substitute from their own fee. This combination is a very strong indicator of self-employment and overrides other factors. A genuine right of substitution exercised in practice is inconsistent with a contract of personal service, which is fundamental to employment.';
  }

  const employmentAreas = areaResults.filter((a) => a.areaDirection === 'employment').map((a) => a.areaName);
  const seAreas = areaResults.filter((a) => a.areaDirection === 'self-employment').map((a) => a.areaName);
  const neutralAreas = areaResults.filter((a) => a.areaDirection === 'neutral').map((a) => a.areaName);

  if (status === 'employed') {
    return `The assessment indicates employment. ${employmentAreas.length} of 5 assessment areas point toward employment (${employmentAreas.join(', ')}). The overall balance of indicators, considering the weight of each factor, points decisively toward an employment relationship.${seAreas.length > 0 ? ` ${seAreas.length} area(s) pointed toward self-employment (${seAreas.join(', ')}), but these were outweighed by the employment indicators.` : ''}`;
  }

  if (status === 'self-employed') {
    return `The assessment indicates self-employment. ${seAreas.length} of 5 assessment areas point toward self-employment (${seAreas.join(', ')}). The overall balance of indicators, considering the weight of each factor, points decisively toward a self-employment relationship.${employmentAreas.length > 0 ? ` ${employmentAreas.length} area(s) pointed toward employment (${employmentAreas.join(', ')}), but these were outweighed by the self-employment indicators.` : ''}`;
  }

  // Undetermined
  const leaningText = leaning === 'employment'
    ? 'On balance, more factors point toward employment, but the evidence is not decisive.'
    : leaning === 'self-employment'
    ? 'On balance, more factors point toward self-employment, but the evidence is not decisive.'
    : 'The factors are evenly balanced with no clear direction.';

  return `The assessment is undetermined \u2014 the employment status cannot be conclusively determined from the answers provided. ${employmentAreas.length > 0 ? `${employmentAreas.join(' and ')} point${employmentAreas.length === 1 ? 's' : ''} toward employment. ` : ''}${seAreas.length > 0 ? `${seAreas.join(' and ')} point${seAreas.length === 1 ? 's' : ''} toward self-employment. ` : ''}${neutralAreas.length > 0 ? `${neutralAreas.join(' and ')} ${neutralAreas.length === 1 ? 'is' : 'are'} inconclusive. ` : ''}${leaningText} This is consistent with how HMRC\u2019s own CEST tool frequently returns \u201Cundetermined\u201D when factors genuinely point both ways. Further specialist review is recommended.`;
}

// ─── IR35 Implications ────────────────────────────────────────────────────────

/** Generate IR35 implications based on preliminary inputs and determination */
function generateIR35Implications(
  preliminary: PreliminaryInputs,
  determination: EmploymentStatus
): IR35Implications {
  const engagement = preliminary.workerEngagement;
  const size = preliminary.clientSize;

  // Does IR35 apply?
  const ir35Applies = engagement === 'psc' || engagement === 'agency';
  const ir35Reason = ir35Applies
    ? `The worker is engaged through ${engagement === 'psc' ? 'a personal service company (PSC)' : 'an employment agency'}. The off-payroll working rules (IR35) apply to this arrangement.`
    : 'The worker is engaged directly \u2014 there is no intermediary. The off-payroll working rules (IR35) do not apply. Standard employment/self-employment rules apply.';

  // Who is responsible?
  let responsibleParty: string;
  let sdsRequired: boolean;
  if (!ir35Applies) {
    responsibleParty = 'Not applicable \u2014 IR35 does not apply to direct engagements.';
    sdsRequired = false;
  } else if (size === 'small') {
    responsibleParty = 'The worker\u2019s intermediary (PSC) is responsible for determining their own employment status. Small company exemption applies \u2014 the end client does not need to make the determination.';
    sdsRequired = false;
  } else if (size === 'medium-large') {
    responsibleParty = 'The end client is responsible for determining the worker\u2019s employment status and issuing a Status Determination Statement (SDS). As a medium or large company, the off-payroll working rules place this obligation on the end client, not the PSC.';
    sdsRequired = true;
  } else {
    responsibleParty = 'It is unclear whether the end client is a small company. If small (meeting 2 of 3 tests: \u226450 employees, \u2264\u00A310.2m turnover, \u2264\u00A35.1m balance sheet), the PSC decides. Otherwise, the end client must decide.';
    sdsRequired = false;
  }

  // Consequences if employed
  let consequences: string;
  if (determination === 'employed') {
    consequences = ir35Applies
      ? 'The worker should be treated as employed for tax purposes. The fee-payer (the entity paying the PSC) must deduct income tax and NICs from payments as if they were employment income. Deemed employment payment rules apply \u2014 a 5% allowance for running costs is deducted, then income tax and both employee and employer NICs are calculated on the remainder.'
      : 'The worker should be treated as an employee. The client must operate PAYE, deduct income tax and employee NICs, and pay employer NICs on all payments.';
  } else if (determination === 'self-employed') {
    consequences = 'The worker can continue to be treated as self-employed. No PAYE or NIC deductions are required on payments to the worker or their PSC.';
  } else {
    consequences = 'The status is undetermined. This does not remove the obligation to make a determination \u2014 the responsible party should seek specialist advice and/or obtain HMRC clearance. Continuing without a determination creates compliance risk.';
  }

  // Next steps
  const nextSteps: string[] = [];

  if (determination === 'employed' && ir35Applies) {
    nextSteps.push('Issue a Status Determination Statement (SDS) to the worker and the fee-payer');
    nextSteps.push('Set up PAYE for the deemed employment payment (if not already in place)');
    nextSteps.push('Review the contractual arrangements to ensure they reflect the employment status');
    nextSteps.push('Consider whether the worker should be offered direct employment');
  } else if (determination === 'self-employed') {
    nextSteps.push('Document the CEST determination and retain the evidence supporting the decision');
    nextSteps.push('Review periodically \u2014 if working arrangements change, reassess');
    if (ir35Applies && sdsRequired) {
      nextSteps.push('Issue an SDS confirming the self-employed determination');
    }
  } else {
    nextSteps.push('Seek specialist employment tax advice for a definitive determination');
    nextSteps.push('Consider applying to HMRC for a formal opinion on the worker\u2019s status');
    nextSteps.push('Review the working arrangements to identify whether any changes could clarify the position');
    nextSteps.push('Document all factors and the reasons why the determination is uncertain');
    if (ir35Applies) {
      nextSteps.push('Consider protective PAYE registration while the status is being resolved');
    }
  }

  return {
    ir35Applies,
    ir35Reason,
    responsibleParty,
    sdsRequired,
    consequences,
    nextSteps,
  };
}

// ─── Key Factors Summary ──────────────────────────────────────────────────────

/** Generate a summary of key factors */
function generateKeyFactors(areaResults: AreaResult[]): KeyFactorsSummary {
  const allQuestions = areaResults.flatMap((a) => a.questionResults);

  const employmentFactors: string[] = [];
  const selfEmploymentFactors: string[] = [];
  const neutralFactors: string[] = [];

  let strongestEmployment: { text: string; weight: number } | null = null;
  let strongestSE: { text: string; weight: number } | null = null;

  for (const qr of allQuestions) {
    if (qr.weight < 0) {
      employmentFactors.push(`${qr.questionText} \u2014 ${qr.selectedAnswer}`);
      if (!strongestEmployment || qr.weight < strongestEmployment.weight) {
        strongestEmployment = { text: `${qr.questionText} \u2014 ${qr.selectedAnswer}`, weight: qr.weight };
      }
    } else if (qr.weight > 0) {
      selfEmploymentFactors.push(`${qr.questionText} \u2014 ${qr.selectedAnswer}`);
      if (!strongestSE || qr.weight > strongestSE.weight) {
        strongestSE = { text: `${qr.questionText} \u2014 ${qr.selectedAnswer}`, weight: qr.weight };
      }
    } else {
      neutralFactors.push(`${qr.questionText} \u2014 ${qr.selectedAnswer}`);
    }
  }

  return {
    employmentFactors,
    selfEmploymentFactors,
    neutralFactors,
    strongestEmployment: strongestEmployment?.text ?? null,
    strongestSelfEmployment: strongestSE?.text ?? null,
  };
}

// ─── Validation ───────────────────────────────────────────────────────────────

/** Run all validation rules */
export function validateInputs(inputs: CestInputs): ValidationResult[] {
  const results: ValidationResult[] = [];
  const allQuestions = getAllQuestions();
  const answeredIds = Object.keys(inputs.answers);

  // V1: All questions answered
  const unansweredQuestions = allQuestions.filter((q) => !answeredIds.includes(q.id));
  if (unansweredQuestions.length > 0) {
    results.push({
      ruleId: 'V1',
      severity: 'error',
      message: `${unansweredQuestions.length} question(s) not yet answered. All 18 questions must be answered to run the assessment: ${unansweredQuestions.map((q) => q.id).join(', ')}.`,
      affectedQuestions: unansweredQuestions.map((q) => q.id),
      passed: false,
    });
  } else {
    results.push({
      ruleId: 'V1',
      severity: 'info',
      message: 'All 18 questions answered.',
      affectedQuestions: [],
      passed: true,
    });
  }

  // V2: Preliminary questions
  if (!inputs.preliminary.workerEngagement || !inputs.preliminary.clientSize) {
    const missing: string[] = [];
    if (!inputs.preliminary.workerEngagement) missing.push('worker engagement type');
    if (!inputs.preliminary.clientSize) missing.push('client size');
    results.push({
      ruleId: 'V2',
      severity: 'warning',
      message: `Preliminary context not fully provided (${missing.join(', ')}). IR35 implications cannot be determined without this information.`,
      affectedQuestions: [],
      passed: false,
    });
  }

  // V3: Substitution consistency
  const s1 = inputs.answers['S1'];
  const s2 = inputs.answers['S2'];
  if (s1 && s2 && s1.selectedKey === 'a' && s2.selectedKey === 'b') {
    results.push({
      ruleId: 'V3',
      severity: 'warning',
      message: 'Inconsistency detected: Q S1 says there is no substitution right, but Q S2 says a substitute has been sent. Please review these answers.',
      affectedQuestions: ['S1', 'S2'],
      passed: false,
    });
  }

  // V4: MOO consistency
  const m1 = inputs.answers['M1'];
  const m2 = inputs.answers['M2'];
  if (m1 && m2 && m1.selectedKey === 'c' && m2.selectedKey === 'a') {
    results.push({
      ruleId: 'V4',
      severity: 'warning',
      message: 'Inconsistency detected: Q M1 says there is no obligation to offer work, but Q M2 says the worker must accept work when offered. If there is no obligation to offer work, the obligation to accept is moot.',
      affectedQuestions: ['M1', 'M2'],
      passed: false,
    });
  }

  // V5: All areas covered
  const areasCovered = ASSESSMENT_AREAS.every((area) =>
    area.questions.every((q) => answeredIds.includes(q.id))
  );
  if (areasCovered) {
    results.push({
      ruleId: 'V5',
      severity: 'info',
      message: 'All 5 assessment areas have been fully answered.',
      affectedQuestions: [],
      passed: true,
    });
  }

  return results;
}

/** Summarise validation results */
export function summariseValidation(results: ValidationResult[]) {
  return {
    errors: results.filter((r) => r.severity === 'error' && !r.passed).length,
    warnings: results.filter((r) => r.severity === 'warning' && !r.passed).length,
    info: results.filter((r) => r.severity === 'info').length,
    total: results.length,
  };
}

// ─── Full Assessment ──────────────────────────────────────────────────────────

/** Run the full CEST assessment */
export function runAssessment(inputs: CestInputs): CestOutput {
  // Validate
  const validationResults = validateInputs(inputs);
  const validationSummary = summariseValidation(validationResults);

  // Evaluate each area
  const areaResults = ASSESSMENT_AREAS.map((area) => evaluateArea(area, inputs.answers));

  // Overall score
  const overallScore = areaResults.reduce((sum, ar) => sum + ar.areaScore, 0);

  // Substitution override
  const substitutionOverride = checkSubstitutionOverride(inputs.answers);

  // Determine status
  const { status, confidence, leaning } = determineStatus(overallScore, substitutionOverride);

  // Generate reason
  const reason = generateReason(status, overallScore, areaResults, substitutionOverride, leaning);

  const determination: OverallDetermination = {
    status,
    overallScore,
    confidenceLevel: confidence,
    leaning,
    substitutionOverride,
    reason,
  };

  // IR35 implications
  const ir35 = generateIR35Implications(inputs.preliminary, status);

  // Key factors
  const keyFactors = generateKeyFactors(areaResults);

  return {
    determination,
    areaResults,
    ir35,
    keyFactors,
    validationResults,
    validationSummary,
  };
}

// ─── Empty Inputs ─────────────────────────────────────────────────────────────

/** Create empty/default inputs */
export function createEmptyInputs(): CestInputs {
  return {
    preliminary: {
      workerEngagement: null,
      clientSize: null,
    },
    answers: {},
  };
}

// ─── H&C Test Scenarios ───────────────────────────────────────────────────────

export const HC_SCENARIOS: HCScenario[] = [
  // ── Scenario 1: S1 — James Kirby CEST Assessment ──────────────────────────
  {
    id: 's1-james-kirby',
    name: 'S1 \u2014 James Kirby CEST Assessment',
    section: 1,
    description:
      'Assess the employment status of James Kirby, a CAD design engineer engaged through his PSC (Kirby Design Solutions Ltd). He works 3 days/week on-site at C&S Engineering, uses C&S\u2019s CAD workstation and SolidWorks licences, has a substitution clause requiring client approval, and has 2 other minor clients (~20% of his time). HMRC has sent an intermediaries query letter.',
    preliminary: {
      workerEngagement: 'psc',
      clientSize: 'medium-large',
    },
    preFilledAnswers: {
      C1: 'b', // Client sets broad objectives, worker plans tasks
      C2: 'b', // Client specifies end result, worker chooses methods
      C3: 'b', // Only within specialism
      C4: 'b', // On-site required but flexibility on hours
      S1: 'b', // Right exists but client must approve
      S2: 'a', // Never sent a substitute
      S3: 'c', // Not applicable (never exercised)
      M1: 'b', // Rolling engagement, volume not guaranteed
      M2: 'b', // Generally expected to be available
      M3: 'b', // 3-month notice period
      F1: 'a', // Client provides all equipment
      F2: 'b', // Worker redoes but paid for time
      F3: 'b', // Invoiced monthly based on day rate
      F4: 'a', // Guaranteed payment for days worked
      B1: 'b', // 1-2 other minor clients
      B2: 'b', // Basic online presence
      B3: 'b', // Operates through PSC (just him)
      B4: 'b', // On-site, interacts, clearly external
    },
    expectedDetermination: 'undetermined',
    expectedScore: -5,
    hints: {
      C1: [
        'C&S specifies WHAT work James does (specific projects and drawings).',
        'But James plans his own day-to-day approach \u2014 he chooses methods and priorities.',
      ],
      C2: [
        'C&S tells James which drawings/designs are needed.',
        'James chooses his own CAD methods and design approach \u2014 he is a specialist.',
      ],
      S1: [
        'James\u2019s contract with C&S allows substitution.',
        'BUT C&S must approve the substitute \u2014 this is a weak substitution clause per Pimlico Plumbers.',
      ],
      S2: [
        'James has never actually sent a substitute.',
        'An unexercised substitution clause may be a sham (Autoclenz v Belcher).',
      ],
      F1: [
        'James uses C&S\u2019s CAD workstation and SolidWorks software licences.',
        'He does not provide his own major equipment \u2014 a significant employment indicator.',
      ],
      M3: [
        'James has a rolling contract with 3-month notice.',
        'This is an employment-like arrangement \u2014 self-employed engagements typically have shorter notice or end on project completion.',
      ],
      B1: [
        'James does occasional work for 2 other engineering firms (~20% of his time).',
        'This suggests some independence but C&S is clearly his primary engagement.',
      ],
    },
  },

  // ── Scenario 2: S1 — Clearly Employed Comparison ──────────────────────────
  {
    id: 's1-employed-comparison',
    name: 'S1 \u2014 Employed Worker (Comparison)',
    section: 1,
    description:
      'For comparison with James Kirby: a hypothetical temporary warehouse operative supplied by an agency to work full-time at C&S\u2019s premises. All factors point decisively toward employment. Use this scenario to see what a clear employment determination looks like.',
    preliminary: {
      workerEngagement: 'agency',
      clientSize: 'medium-large',
    },
    preFilledAnswers: {
      C1: 'a', // Client decides and allocates tasks
      C2: 'a', // Client instructs methods
      C3: 'a', // Client can reassign
      C4: 'a', // Client specifies hours and location
      S1: 'a', // No substitution right
      S2: 'c', // Not applicable
      S3: 'c', // Not applicable
      M1: 'a', // Contractual commitment to regular work
      M2: 'a', // Must accept work
      M3: 'a', // Employment-like notice
      F1: 'a', // Client provides all equipment
      F2: 'a', // Client pays regardless
      F3: 'a', // Regular fixed amounts
      F4: 'a', // Guaranteed payment
      B1: 'a', // Works exclusively for this client
      B2: 'a', // Does not advertise
      B3: 'a', // No business structure
      B4: 'a', // Treated like staff
    },
    expectedDetermination: 'employed',
    expectedScore: -26,
    hints: {
      C1: [
        'The warehouse operative is told exactly what to do \u2014 tasks are allocated by a supervisor.',
      ],
      S1: [
        'There is no substitution clause. The agency sends a specific named worker to the site.',
      ],
      B1: [
        'The worker works full-time at C&S only. They have no other clients.',
      ],
      B4: [
        'The worker is integrated into the warehouse team \u2014 attends briefings, follows internal procedures, uses company equipment.',
      ],
    },
  },
];

/** Look up an H&C scenario by ID */
export function getScenarioById(id: string): HCScenario | undefined {
  return HC_SCENARIOS.find((s) => s.id === id);
}

/** Look up H&C scenarios by section number */
export function getScenariosBySection(section: number): HCScenario[] {
  return HC_SCENARIOS.filter((s) => s.section === section);
}

/** Convert a scenario's pre-filled answers to CestInputs */
export function scenarioToInputs(scenario: HCScenario): CestInputs {
  const answers: Record<string, QuestionAnswer> = {};
  const allQuestions = getAllQuestions();

  for (const [questionId, optionKey] of Object.entries(scenario.preFilledAnswers)) {
    const question = allQuestions.find((q) => q.id === questionId);
    if (question) {
      const option = question.options.find((o) => o.key === optionKey);
      if (option) {
        answers[questionId] = {
          questionId,
          selectedKey: optionKey,
          weight: option.weight,
        };
      }
    }
  }

  return {
    preliminary: { ...scenario.preliminary },
    answers,
  };
}
