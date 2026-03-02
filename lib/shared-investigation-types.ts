// ─── Gedeelde typen voor alle onderzoeksmodules ────────────────────────────────
//
// Gebruik BasePerson als basis voor module-specifieke persoon-interfaces.
// Gebruik CommonScopeFields als basis voor module-specifieke scope-interfaces.

/**
 * Gemeenschappelijke velden voor alle persoon-types in onderzoeksmodules.
 * Module-specifieke types (SoundPerson, PhysicalPerson, etc.) breiden dit uit.
 */
export interface BasePerson {
  id: string;
  name?: string;
  role?: string;
  organization?: string;
  address?: string;
  email?: string;
  phone?: string;
  /** Medewerker wil anoniem worden geregistreerd */
  anonymous?: boolean;
  /** Rol van de persoon in het onderzoek (alleen respondenten) */
  investigationRole?: string;
  /** Beroepsprofiel / kwalificatie (Arbowet art. 14) — waarde afhankelijk van module */
  qualification?: string;
  /** Gecertificeerd Arbokerndeskundige (SZW-register, Arbowet art. 20) */
  isAKD?: boolean;
  /** AKD-registratienummer */
  akdNumber?: string;
  /** BIG-registratienummer (Wet BIG, art. 3) — alleen voor Bedrijfsarts */
  bigNumber?: string;
  /** Vrije toelichting bij kwalificatie 'other' */
  qualificationNote?: string;
}

/**
 * Gemeenschappelijke scope-metadata voor alle onderzoeksmodules.
 * Zichtbaar in ScopeFields-component (§15.a NEN-EN-ISO 9612 / NEN-ISO 11228 / ISO 7730).
 */
export interface CommonScopeFields {
  /** Naam opdrachtgevend bedrijf */
  companyName?: string;
  /** Afdeling of locatieaanduiding */
  department?: string;
  /** Naam van de werkplek / meetlocatie */
  workplaceName?: string;
  /** Adres van de werkplek (kan afwijken van vestigingsadres werkgever) */
  workplaceAddress?: string;
  /** Beschrijving van de betrokken medewerkers(groep) */
  workerDescription?: string;
  /** Doel van het onderzoek */
  purpose?: string;
  /** Periode van het onderzoek (bijv. "januari–februari 2025") */
  investigationPeriod?: string;
  /** Aanvullende opmerkingen */
  notes?: string;
}
