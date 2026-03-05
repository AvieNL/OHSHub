import type { ThemeSlug } from '@/lib/themes';
import type { WizardConfig, WizardStep } from '@/lib/wizard-types';

import { WIZARD_CONFIG as soundConfig } from '@/data/wizards/soundWizard';
import { WIZARD_CONFIG as hazardousConfig } from '@/data/wizards/hazardousSubstancesWizard';
import { WIZARD_CONFIG as physicalLoadConfig } from '@/data/wizards/physicalLoadWizard';
import { WIZARD_CONFIG as climateConfig } from '@/data/wizards/climateWizard';

// Placeholder themes have dedicated "in development" pages and no active wizard.
const EMPTY_CONFIG: WizardConfig = { steps: [] };

const configs: Record<ThemeSlug, WizardConfig> = {
  sound: soundConfig,
  'bio-agents': EMPTY_CONFIG,
  'hazardous-substances': hazardousConfig,
  lighting: EMPTY_CONFIG,
  'physical-load': physicalLoadConfig,
  climate: climateConfig,
  vibration: EMPTY_CONFIG,
  radiation: EMPTY_CONFIG,
};

export function getWizardConfig(slug: ThemeSlug): WizardConfig {
  return configs[slug];
}

/**
 * Returns a new WizardConfig with text fields overridden by DB content.
 * `visibleWhen` and `assessRisk` are always taken from the original config.
 *
 * Key format (same as CMS namespace `wizard.{slug}`):
 *   step.{stepId}.title
 *   step.{stepId}.description
 *   step.{stepId}.q.{qId}.label
 *   step.{stepId}.q.{qId}.tip
 *   step.{stepId}.q.{qId}.placeholder
 *   step.{stepId}.q.{qId}.opt.{value}.label
 */
export function applyWizardOverrides(
  config: WizardConfig,
  overrides: Record<string, string>,
): WizardConfig {
  if (!overrides || Object.keys(overrides).length === 0) return config;

  const steps: WizardStep[] = config.steps.map((step) => {
    const titleKey = `step.${step.id}.title`;
    const descKey = `step.${step.id}.description`;

    const questions: WizardConfig['steps'][number]['questions'] = step.questions.map((q) => {
      const lKey = `step.${step.id}.q.${q.id}.label`;
      const tKey = `step.${step.id}.q.${q.id}.tip`;
      const pKey = `step.${step.id}.q.${q.id}.placeholder`;

      const options = q.options?.map((opt) => {
        const oKey = `step.${step.id}.q.${q.id}.opt.${opt.value}.label`;
        const overrideLabel = overrides[oKey];
        return overrideLabel ? { ...opt, label: overrideLabel } : opt;
      });

      return {
        ...q,
        label: overrides[lKey] ?? q.label,
        tip: overrides[tKey] ?? q.tip,
        placeholder: overrides[pKey] ?? q.placeholder,
        options,
      };
    });

    return {
      ...step,
      title: overrides[titleKey] ?? step.title,
      description: overrides[descKey] ?? step.description,
      questions,
    };
  });

  return {
    steps,
    assessRisk: config.assessRisk,
  };
}
