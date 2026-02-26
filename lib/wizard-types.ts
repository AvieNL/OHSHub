export type QuestionType = 'radio' | 'checkbox' | 'text';

export interface QuestionOption {
  value: string;
  label: string;
}

export type WizardAnswers = Record<string, string | string[]>;

export interface WizardQuestion {
  id: string;
  label: string;
  type: QuestionType;
  required?: boolean;
  tip?: string;
  options?: QuestionOption[];
  placeholder?: string;
  visibleWhen?: (answers: WizardAnswers) => boolean;
}

export interface WizardStep {
  id: string;
  title: string;
  description: string;
  questions: WizardQuestion[];
  visibleWhen?: (answers: WizardAnswers) => boolean;
}

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'unknown';

export interface RiskFinding {
  topic: string;
  level: RiskLevel;
  summary: string;
  detail?: string;
  legalBasis?: string;
}

export interface Recommendation {
  priority: number;
  ahsStep: string;
  action: string;
  why: string;
  deadline?: string;
  legalBasis?: string;
}

export interface RiskAssessmentResult {
  overallLevel: RiskLevel;
  findings: RiskFinding[];
  recommendations: Recommendation[];
  dataGaps: string[];
}

export interface WizardConfig {
  steps: WizardStep[];
  assessRisk?: (answers: WizardAnswers) => RiskAssessmentResult;
}
