import type { ThemeSlug } from '@/lib/themes';
import type { WizardStep } from '@/lib/wizard-types';

import { STEPS as soundSteps } from '@/data/wizards/soundWizard';
import { STEPS as bioAgentsSteps } from '@/data/wizards/bioAgentsWizard';
import { STEPS as hazardousSteps } from '@/data/wizards/hazardousSubstancesWizard';
import { STEPS as lightingSteps } from '@/data/wizards/lightingWizard';
import { STEPS as physicalLoadSteps } from '@/data/wizards/physicalLoadWizard';
import { STEPS as climateSteps } from '@/data/wizards/climateWizard';

export const wizardConfigs: Record<ThemeSlug, WizardStep[]> = {
  sound: soundSteps,
  'bio-agents': bioAgentsSteps,
  'hazardous-substances': hazardousSteps,
  lighting: lightingSteps,
  'physical-load': physicalLoadSteps,
  climate: climateSteps,
};
