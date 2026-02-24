export type QuestionType = 'radio' | 'checkbox' | 'text';

export interface QuestionOption {
  value: string;
  label: string;
}

export interface WizardQuestion {
  id: string;
  label: string;
  type: QuestionType;
  required?: boolean;
  tip?: string;
  options?: QuestionOption[];
  placeholder?: string;
}

export interface WizardStep {
  id: string;
  title: string;
  description: string;
  questions: WizardQuestion[];
}

export type WizardAnswers = Record<string, string | string[]>;
