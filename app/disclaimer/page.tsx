import type { Metadata } from 'next';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase/admin';
import MarkdownContent from '@/components/MarkdownContent';
import DisclaimerVersionEditor from '@/components/DisclaimerVersionEditor';
import DisclaimerPushAllButton from '@/components/DisclaimerPushAllButton';

export const metadata: Metadata = {
  title: 'Disclaimer — OHSHub',
  description: 'Aansprakelijkheidsbeperking en gebruiksvoorwaarden voor OHSHub.',
};

// ── Hardcoded fallback (shown when no versions exist in DB yet) ───────────────

const FALLBACK_BODY = `## Aansprakelijkheidsbeperking

Deze app is met grote zorg en volgens actuele inzichten in arbo‑ en arbeidshygiënische richtlijnen ontwikkeld. Desondanks kunnen onjuistheden, onvolledigheden of rekenfouten niet volledig worden uitgesloten.

De ontwikkelaar aanvaardt **geen aansprakelijkheid** voor schade of gevolgen die voortvloeien uit het gebruik van deze app of de gegenereerde rapportages, adviezen en berekeningen.

## Beoordeling door een specialist

Alle uitkomsten dienen altijd door een ter zake kundige specialist — bij voorkeur een geregistreerd arbeidshygiënist of andere kerndeskundige — te worden **beoordeeld, gevalideerd en zo nodig aangepast** vóórdat daarop beleid, maatregelen of juridische besluiten worden gebaseerd.

## Wettelijke verantwoordelijkheden

Gebruik van deze app ontslaat werkgevers en arbodeskundigen niet van hun eigen wettelijke verantwoordelijkheden onder de **Arbowet** en het **Arbobesluit**.

## Gebruik in rapportages

Rapportages die zijn opgesteld met behulp van OHSHub zijn indicatief van aard. De uitkomsten moeten door een deskundige (arbeidshygiënist of kerndeskundige) worden getoetst alvorens ze worden gebruikt voor beleid, maatregelen of juridische besluiten. De ontwikkelaar is niet aansprakelijk voor het gebruik of de gevolgen van met de app opgestelde rapportages.
`;

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DisclaimerPage() {
  // Fetch all versions from DB (newest first)
  const { data: versions } = await supabaseAdmin
    .from('disclaimer_versions')
    .select('id, version_number, version_type, body, created_at')
    .order('created_at', { ascending: false });

  const allVersions = versions ?? [];
  const current = allVersions[0] ?? null;
  const older = allVersions.slice(1);

  const currentBody = current?.body ?? FALLBACK_BODY;
  const latestVersion = current?.version_number ?? null;

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      {/* Header */}
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Disclaimer</h1>
        {current && (
          <span className="rounded-full bg-orange-100 px-3 py-0.5 text-sm font-semibold text-orange-700 dark:bg-orange-950/50 dark:text-orange-400">
            v{current.version_number}
          </span>
        )}
      </div>
      {current && (
        <p className="mb-8 text-xs text-zinc-400">
          Gepubliceerd op {fmtDate(current.created_at)}
        </p>
      )}
      {!current && (
        <p className="mb-8 text-sm text-zinc-400">Lees dit zorgvuldig door vóórdat u de app gebruikt.</p>
      )}

      {/* Current body */}
      <MarkdownContent className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        {currentBody}
      </MarkdownContent>

      {/* Admin: new version editor */}
      <DisclaimerVersionEditor currentBody={currentBody} latestVersion={latestVersion} />

      {/* Admin: push re-confirmation to all users */}
      {latestVersion && <DisclaimerPushAllButton />}

      {/* Version history */}
      {older.length > 0 && (
        <section className="mt-16 border-t border-zinc-200 pt-10 dark:border-zinc-800">
          <h2 className="mb-6 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Eerdere versies
          </h2>
          <div className="space-y-4">
            {older.map((v) => (
              <details key={v.id} className="group rounded-lg border border-zinc-200 dark:border-zinc-800">
                <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 text-sm">
                  <span className="font-mono font-semibold text-zinc-700 dark:text-zinc-300">
                    v{v.version_number}
                  </span>
                  <span className="text-zinc-400">—</span>
                  <span className="text-xs text-zinc-400">{fmtDate(v.created_at)}</span>
                  <svg className="ml-auto h-4 w-4 text-zinc-400 transition group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="border-t border-zinc-100 px-4 py-4 dark:border-zinc-800">
                  <MarkdownContent className="text-sm text-zinc-600 dark:text-zinc-400">
                    {v.body}
                  </MarkdownContent>
                </div>
              </details>
            ))}
          </div>
        </section>
      )}

      <div className="mt-10 border-t border-zinc-100 pt-6 text-xs text-zinc-400 dark:border-zinc-800 dark:text-zinc-600">
        <Link href="/privacy" className="underline hover:text-zinc-600 dark:hover:text-zinc-400">
          Privacyverklaring
        </Link>
        {' · '}
        <Link href="/over" className="underline hover:text-zinc-600 dark:hover:text-zinc-400">
          Over OHSHub
        </Link>
      </div>
    </main>
  );
}
