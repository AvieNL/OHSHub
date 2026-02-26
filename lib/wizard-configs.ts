import type { ThemeSlug } from '@/lib/themes';
import type { WizardStep, WizardConfig } from '@/lib/wizard-types';

import { STEPS as soundSteps, WIZARD_CONFIG as soundConfig } from '@/data/wizards/soundWizard';
import { STEPS as bioAgentsSteps, WIZARD_CONFIG as bioAgentsConfig } from '@/data/wizards/bioAgentsWizard';
import { WIZARD_CONFIG as hazardousConfig } from '@/data/wizards/hazardousSubstancesWizard';
import { STEPS as lightingSteps, WIZARD_CONFIG as lightingConfig } from '@/data/wizards/lightingWizard';
import { STEPS as physicalLoadSteps, WIZARD_CONFIG as physicalLoadConfig } from '@/data/wizards/physicalLoadWizard';
import { STEPS as climateSteps, WIZARD_CONFIG as climateConfig } from '@/data/wizards/climateWizard';
import { STEPS as vibrationSteps, WIZARD_CONFIG as vibrationConfig } from '@/data/wizards/vibrationWizard';

// Backwards-compatible shim used by legacy code
export const wizardConfigs: Record<ThemeSlug, WizardStep[]> = {
  sound: soundSteps,
  'bio-agents': bioAgentsSteps,
  'hazardous-substances': hazardousConfig.steps,
  lighting: lightingSteps,
  'physical-load': physicalLoadSteps,
  climate: climateSteps,
  vibration: vibrationSteps,
};

const configs: Record<ThemeSlug, WizardConfig> = {
  sound: soundConfig,
  'bio-agents': bioAgentsConfig,
  'hazardous-substances': hazardousConfig,
  lighting: lightingConfig,
  'physical-load': physicalLoadConfig,
  climate: climateConfig,
  vibration: vibrationConfig,
};

export function getWizardConfig(slug: ThemeSlug): WizardConfig {
  return configs[slug];
}
