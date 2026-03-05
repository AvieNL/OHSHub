import type { Metadata } from 'next';
import { supabaseAdmin } from '@/lib/supabase/admin';
import MarkdownContent from '@/components/MarkdownContent';
import PrivacyVersionEditor from '@/components/PrivacyVersionEditor';
import PrivacyPushAllButton from '@/components/PrivacyPushAllButton';

export const metadata: Metadata = {
  title: 'Privacyverklaring — OHSHub',
  description: 'Hoe OHSHub omgaat met uw persoonsgegevens.',
};

// ── Hardcoded fallback (shown when no versions exist in DB yet) ───────────────

const FALLBACK_BODY = `Versie 1.0 — 2 maart 2026

Deze privacyverklaring is voor gebruikers van de OHSHub-app. Hierin leggen wij uit welke persoonsgegevens wij verwerken, waarom wij dat doen en welke rechten u heeft.

## 1. Wie zijn wij?

**DiversiThijs**, gevestigd te Breedenbroek, ingeschreven bij de Kamer van Koophandel onder nummer <abbr title="Kamer van Koophandel" class="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">KvK</abbr> 92899943, is verantwoordelijk voor de verwerking van uw persoonsgegevens.

U kunt ons bereiken via:

- E-mail: [info@diversithijs.nl](mailto:info@diversithijs.nl)
- Postadres: Den Dam 32, 7084 BM Breedenbroek

## 2. Welke persoonsgegevens verwerken wij?

Wij verwerken afhankelijk van uw gebruik van de app onder meer:

- **Accountgegevens** — e-mailadres en wachtwoord (versleuteld).
- **Gebruiksgegevens in de app** — onderzoeken, notities, meetgegevens en andere inhoud die u zelf toevoegt.
- **Technische gegevens** — tijdstempels van aanmelden en gebruik van de applicatie.

Wij verwerken geen bijzondere categorieën persoonsgegevens, tenzij u deze zelf in vrije tekstvelden invoert.

## 3. Voor welke doeleinden en op basis van welke grondslag?

Wij verwerken uw persoonsgegevens voor de volgende doeleinden:

- Het aanmaken en beheren van uw OHSHub-account.
- Het opslaan van de data die u in de app invoert, zodat u onderzoeken en dossiers kunt beheren.
- Beveiliging van de app, het opsporen van misbruik en het maken van back-ups.
- Verbeteren van onze dienstverlening en het oplossen van storingen.

De verwerkingsgrondslagen zijn:

- **Uitvoering van de overeenkomst** — om u toegang te geven tot de app en uw account te laten functioneren (<abbr title="Algemene Verordening Gegevensbescherming" class="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">AVG</abbr> art. 6.1.b).
- **Gerechtvaardigd belang** — voor logging, beveiliging en productverbetering, waarbij wij uw privacybelang afwegen tegen onze belangen (AVG art. 6.1.f).
- **Toestemming** — voor eventuele opt-in nieuwsbrieven of andere niet-noodzakelijke communicatie (AVG art. 6.1.a).

## 4. Met wie delen wij uw gegevens?

Wij delen uw persoonsgegevens alleen met derden als dat nodig is voor onze dienstverlening of als wij daartoe wettelijk verplicht zijn. Het gaat om de volgende sub-verwerkers:

- **Supabase Inc.** — database, authenticatie en opslag van gegevens.
- **Vercel Inc.** — hosting van de webapplicatie.

Met deze partijen hebben wij een verwerkersovereenkomst gesloten waarin afspraken zijn gemaakt over beveiliging en vertrouwelijkheid.

## 5. Doorgifte buiten de EU

Wij streven ernaar uw gegevens binnen de <abbr title="Europese Economische Ruimte" class="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">EER</abbr> op te slaan. Als er toch sprake is van doorgifte naar buiten de EER, zorgen wij voor passende waarborgen, zoals standaardcontractbepalingen (<abbr title="Standard Contractual Clauses" class="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">SCC's</abbr>) of een gelijkwaardig beschermingsniveau.

## 6. Hoe lang bewaren wij uw gegevens?

Wij bewaren uw persoonsgegevens niet langer dan noodzakelijk voor de doelen waarvoor ze zijn verzameld, tenzij wij wettelijk verplicht zijn gegevens langer te bewaren.

- **Accountgegevens** — zolang uw account actief is.
- **App-gegevens** — zolang uw account actief is, of totdat u de data zelf verwijdert.
- **Loggegevens** — voor een beperkte periode voor beveiligings- en foutanalyse-doeleinden.

## 7. Hoe beveiligen wij uw gegevens?

Wij nemen passende technische en organisatorische maatregelen om uw persoonsgegevens te beveiligen, waaronder:

- Versleutelde verbindingen (<abbr title="HyperText Transfer Protocol Secure" class="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">HTTPS</abbr>).
- Beveiligde opslag bij onze hosting- en databaseproviders.
- Toegangsbeperking tot systemen en data.
- Regelmatige updates en beveiligingscontroles.

## 8. Uw rechten

Op grond van de AVG heeft u de volgende rechten:

- **Inzage** — u kunt uw gegevens inzien en exporteren via *Mijn gegevens*.
- **Rectificatie** — u kunt uw e-mailadres wijzigen via *Mijn gegevens*.
- **Vergetelheid** — u kunt uw account en alle bijbehorende gegevens permanent verwijderen via *Mijn gegevens*.
- **Beperking van verwerking** — neem contact op via [info@diversithijs.nl](mailto:info@diversithijs.nl).
- **Overdraagbaarheid** — u kunt al uw gegevens downloaden als JSON via *Mijn gegevens*.
- **Bezwaar** — u kunt bezwaar maken tegen verwerkingen op basis van gerechtvaardigd belang.

U kunt een verzoek indienen via [info@diversithijs.nl](mailto:info@diversithijs.nl). Wij reageren in principe binnen één maand op uw verzoek.

## 9. Klachten

Als u een klacht heeft over de manier waarop wij met uw persoonsgegevens omgaan, kunt u contact met ons opnemen via [info@diversithijs.nl](mailto:info@diversithijs.nl).

Komt u er met ons niet uit, dan heeft u het recht een klacht in te dienen bij de <abbr title="Autoriteit Persoonsgegevens — Nederlandse toezichthouder voor de AVG" class="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">AP</abbr> via [autoriteitpersoonsgegevens.nl](https://www.autoriteitpersoonsgegevens.nl).

## 10. Wijzigingen in deze privacyverklaring

Wij kunnen deze privacyverklaring van tijd tot tijd wijzigen. Op deze pagina staat altijd de meest recente versie. Bij ingrijpende wijzigingen informeren wij u via de app of per e-mail.
`;

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function PrivacyPage() {
  // Fetch all versions from DB (newest first)
  const { data: versions } = await supabaseAdmin
    .from('privacy_versions')
    .select('id, version_number, version_type, body, created_at')
    .order('created_at', { ascending: false });

  const allVersions = versions ?? [];
  const current = allVersions[0] ?? null;
  const older = allVersions.slice(1);

  const currentBody = current?.body ?? FALLBACK_BODY;
  const latestVersion = current?.version_number ?? null;

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      {/* Header */}
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Privacyverklaring</h1>
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
        <p className="mb-8 text-sm text-zinc-400">Versie 1.0 — 2 maart 2026</p>
      )}

      {/* Current body */}
      <MarkdownContent className="text-sm text-zinc-700 dark:text-zinc-300">
        {currentBody}
      </MarkdownContent>

      {/* Admin: new version editor */}
      <PrivacyVersionEditor currentBody={currentBody} latestVersion={latestVersion} />

      {/* Admin: push re-confirmation to all users */}
      {latestVersion && <PrivacyPushAllButton />}

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
                  <span className="text-zinc-400">{fmtDate(v.created_at)}</span>
                  <svg
                    className="ml-auto h-4 w-4 text-zinc-400 transition-transform group-open:rotate-180"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
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
    </main>
  );
}
