import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacyverklaring — OHSHub',
  description: 'Hoe OHSHub omgaat met uw persoonsgegevens.',
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">Privacyverklaring</h1>
      <p className="mb-10 text-sm text-zinc-400">Versie 1.0 — 2 maart 2026</p>

      <div className="space-y-8 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">

        <p>
          Deze privacyverklaring is voor gebruikers van de OHSHub-app. Hierin leggen wij uit welke
          persoonsgegevens wij verwerken, waarom wij dat doen en welke rechten u heeft.
        </p>

        {/* 1 */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-50">1. Wie zijn wij?</h2>
          <p>
            <strong className="text-zinc-900 dark:text-zinc-100">DiversiThijs</strong>, gevestigd te Breedenbroek,
            ingeschreven bij de Kamer van Koophandel onder nummer{' '}
            <abbr title="Kamer van Koophandel" className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">KvK</abbr>{' '}
            92899943, is verantwoordelijk voor de verwerking van uw persoonsgegevens.
          </p>
          <p className="mt-2">U kunt ons bereiken via:</p>
          <ul className="mt-1 space-y-1 pl-5 list-disc">
            <li>E-mail: <a href="mailto:info@diversithijs.nl" className="text-orange-500 hover:underline">info@diversithijs.nl</a></li>
            <li>Postadres: Den Dam 32, 7084 BM Breedenbroek</li>
          </ul>
        </section>

        {/* 2 */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-50">2. Welke persoonsgegevens verwerken wij?</h2>
          <p>Wij verwerken afhankelijk van uw gebruik van de app onder meer:</p>
          <ul className="mt-2 space-y-1 pl-5 list-disc">
            <li><strong className="text-zinc-900 dark:text-zinc-100">Accountgegevens</strong> — e-mailadres en wachtwoord (versleuteld).</li>
            <li><strong className="text-zinc-900 dark:text-zinc-100">Gebruiksgegevens in de app</strong> — onderzoeken, notities, meetgegevens en andere inhoud die u zelf toevoegt.</li>
            <li><strong className="text-zinc-900 dark:text-zinc-100">Technische gegevens</strong> — tijdstempels van aanmelden en gebruik van de applicatie.</li>
          </ul>
          <p className="mt-2">
            Wij verwerken geen bijzondere categorieën persoonsgegevens, tenzij u deze zelf in vrije tekstvelden invoert.
          </p>
        </section>

        {/* 3 */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-50">3. Voor welke doeleinden en op basis van welke grondslag?</h2>
          <p className="mb-3">Wij verwerken uw persoonsgegevens voor de volgende doeleinden:</p>
          <ul className="mb-3 space-y-1 pl-5 list-disc">
            <li>Het aanmaken en beheren van uw OHSHub-account.</li>
            <li>Het opslaan van de data die u in de app invoert, zodat u onderzoeken en dossiers kunt beheren.</li>
            <li>Beveiliging van de app, het opsporen van misbruik en het maken van back-ups.</li>
            <li>Verbeteren van onze dienstverlening en het oplossen van storingen.</li>
          </ul>
          <p className="mb-2">De verwerkingsgrondslagen zijn:</p>
          <ul className="space-y-1 pl-5 list-disc">
            <li>
              <strong className="text-zinc-900 dark:text-zinc-100">Uitvoering van de overeenkomst</strong> — om u toegang te geven tot de app
              en uw account te laten functioneren (
              <abbr title="Algemene Verordening Gegevensbescherming" className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">AVG</abbr>{' '}
              art. 6.1.b).
            </li>
            <li>
              <strong className="text-zinc-900 dark:text-zinc-100">Gerechtvaardigd belang</strong> — voor logging, beveiliging en productverbetering,
              waarbij wij uw privacybelang afwegen tegen onze belangen (AVG art. 6.1.f).
            </li>
            <li>
              <strong className="text-zinc-900 dark:text-zinc-100">Toestemming</strong> — voor eventuele opt-in nieuwsbrieven of andere
              niet-noodzakelijke communicatie (AVG art. 6.1.a).
            </li>
          </ul>
        </section>

        {/* 4 */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-50">4. Met wie delen wij uw gegevens?</h2>
          <p>
            Wij delen uw persoonsgegevens alleen met derden als dat nodig is voor onze dienstverlening
            of als wij daartoe wettelijk verplicht zijn. Het gaat om de volgende sub-verwerkers:
          </p>
          <ul className="mt-2 space-y-1 pl-5 list-disc">
            <li>
              <strong className="text-zinc-900 dark:text-zinc-100">Supabase Inc.</strong> — database, authenticatie en opslag van gegevens.
            </li>
            <li>
              <strong className="text-zinc-900 dark:text-zinc-100">Vercel Inc.</strong> — hosting van de webapplicatie.
            </li>
          </ul>
          <p className="mt-2">
            Met deze partijen hebben wij een verwerkersovereenkomst gesloten waarin afspraken zijn
            gemaakt over beveiliging en vertrouwelijkheid.
          </p>
        </section>

        {/* 5 */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-50">5. Doorgifte buiten de <abbr title="Europese Economische Ruimte" className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">EU</abbr></h2>
          <p>
            Wij streven ernaar uw gegevens binnen de{' '}
            <abbr title="Europese Economische Ruimte" className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">EER</abbr>{' '}
            op te slaan. Als er toch sprake is van doorgifte naar buiten de{' '}
            <abbr title="Europese Economische Ruimte" className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">EER</abbr>,
            zorgen wij voor passende waarborgen, zoals standaardcontractbepalingen ({' '}
            <abbr title="Standard Contractual Clauses" className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">SCC&apos;s</abbr>)
            of een gelijkwaardig beschermingsniveau.
          </p>
        </section>

        {/* 6 */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-50">6. Hoe lang bewaren wij uw gegevens?</h2>
          <p>
            Wij bewaren uw persoonsgegevens niet langer dan noodzakelijk voor de doelen waarvoor ze
            zijn verzameld, tenzij wij wettelijk verplicht zijn gegevens langer te bewaren.
          </p>
          <ul className="mt-2 space-y-1 pl-5 list-disc">
            <li><strong className="text-zinc-900 dark:text-zinc-100">Accountgegevens</strong> — zolang uw account actief is.</li>
            <li><strong className="text-zinc-900 dark:text-zinc-100">App-gegevens</strong> — zolang uw account actief is, of totdat u de data zelf verwijdert.</li>
            <li><strong className="text-zinc-900 dark:text-zinc-100">Loggegevens</strong> — voor een beperkte periode voor beveiligings- en foutanalyse-doeleinden.</li>
          </ul>
        </section>

        {/* 7 */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-50">7. Hoe beveiligen wij uw gegevens?</h2>
          <p>
            Wij nemen passende technische en organisatorische maatregelen om uw persoonsgegevens
            te beveiligen, waaronder:
          </p>
          <ul className="mt-2 space-y-1 pl-5 list-disc">
            <li>Versleutelde verbindingen (<abbr title="HyperText Transfer Protocol Secure" className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">HTTPS</abbr>).</li>
            <li>Beveiligde opslag bij onze hosting- en databaseproviders.</li>
            <li>Toegangsbeperking tot systemen en data.</li>
            <li>Regelmatige updates en beveiligingscontroles.</li>
          </ul>
        </section>

        {/* 8 */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-50">8. Uw rechten</h2>
          <p>Op grond van de AVG heeft u de volgende rechten:</p>
          <ul className="mt-2 space-y-1 pl-5 list-disc">
            <li><strong className="text-zinc-900 dark:text-zinc-100">Inzage</strong> — u kunt uw gegevens inzien en exporteren via <em>Mijn gegevens</em>.</li>
            <li><strong className="text-zinc-900 dark:text-zinc-100">Rectificatie</strong> — u kunt uw e-mailadres wijzigen via <em>Mijn gegevens</em>.</li>
            <li><strong className="text-zinc-900 dark:text-zinc-100">Vergetelheid</strong> — u kunt uw account en alle bijbehorende gegevens permanent verwijderen via <em>Mijn gegevens</em>.</li>
            <li><strong className="text-zinc-900 dark:text-zinc-100">Beperking van verwerking</strong> — neem contact op via <a href="mailto:info@diversithijs.nl" className="text-orange-500 hover:underline">info@diversithijs.nl</a>.</li>
            <li><strong className="text-zinc-900 dark:text-zinc-100">Overdraagbaarheid</strong> — u kunt al uw gegevens downloaden als JSON via <em>Mijn gegevens</em>.</li>
            <li><strong className="text-zinc-900 dark:text-zinc-100">Bezwaar</strong> — u kunt bezwaar maken tegen verwerkingen op basis van gerechtvaardigd belang.</li>
          </ul>
          <p className="mt-2">
            U kunt een verzoek indienen via{' '}
            <a href="mailto:info@diversithijs.nl" className="text-orange-500 hover:underline">info@diversithijs.nl</a>.
            Wij reageren in principe binnen één maand op uw verzoek.
          </p>
        </section>

        {/* 9 */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-50">9. Klachten</h2>
          <p>
            Als u een klacht heeft over de manier waarop wij met uw persoonsgegevens omgaan, kunt u
            contact met ons opnemen via{' '}
            <a href="mailto:info@diversithijs.nl" className="text-orange-500 hover:underline">info@diversithijs.nl</a>.
          </p>
          <p className="mt-2">
            Komt u er met ons niet uit, dan heeft u het recht een klacht in te dienen bij de{' '}
            <abbr title="Autoriteit Persoonsgegevens — Nederlandse toezichthouder voor de AVG" className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">AP</abbr>{' '}
            via{' '}
            <a
              href="https://www.autoriteitpersoonsgegevens.nl"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-500 hover:underline"
            >
              autoriteitpersoonsgegevens.nl
            </a>.
          </p>
        </section>

        {/* 10 */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-50">10. Wijzigingen in deze privacyverklaring</h2>
          <p>
            Wij kunnen deze privacyverklaring van tijd tot tijd wijzigen. Op deze pagina staat altijd de
            meest recente versie. Bij ingrijpende wijzigingen informeren wij u via de app of per e-mail.
          </p>
        </section>

      </div>
    </main>
  );
}
