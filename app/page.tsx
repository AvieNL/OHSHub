import Link from 'next/link';
import { themes } from '@/lib/themes';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getNamespaceContent } from '@/lib/content';
import HomeThemesGrid from '@/components/HomeThemesGrid';
import type { HomeThemeItem } from '@/components/HomeThemesGrid';
import InlineEdit from '@/components/InlineEdit';

const FALLBACK_SUBTITLE =
  'Kennisplatform voor arbeidshygiënisten, hogere veiligheidskundigen en A&O-deskundigen.';

export default async function Home() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [homeOverrides, ...themeOverrides] = await Promise.all([
    getNamespaceContent('page.home'),
    ...themes.map((t) => getNamespaceContent(`theme.${t.slug}`)),
  ]);

  const pageSubtitle = homeOverrides['subtitle'] ?? FALLBACK_SUBTITLE;

  const themedItems: HomeThemeItem[] = themes.map((theme, i) => {
    const ov = themeOverrides[i];
    return {
      slug: theme.slug,
      name: ov['name'] ?? theme.name,
      description: ov['description'] ?? theme.description,
      originalName: theme.name,
      originalDescription: theme.description,
      iconClass: theme.iconClass,
      borderClass: theme.borderClass,
      iconPaths: theme.iconPaths,
    };
  });

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-20">

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          OHS<span className="text-orange-500">Hub</span>
        </h1>
        <InlineEdit
          namespace="page.home"
          contentKey="subtitle"
          initialValue={pageSubtitle}
          fallback={FALLBACK_SUBTITLE}
        >
          <p className="mt-3 max-w-2xl text-lg text-zinc-500 dark:text-zinc-400">
            {pageSubtitle}
          </p>
        </InlineEdit>

        <div className="mt-8 flex flex-wrap gap-3">
          {!user ? (
            <>
              <Link
                href="/auth/login"
                className="rounded-lg bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
              >
                Inloggen
              </Link>
              <Link
                href="/auth/register"
                className="rounded-lg border border-zinc-200 px-6 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Account aanmaken
              </Link>
            </>
          ) : (
            <Link
              href="/kennisportaal"
              className="rounded-lg border border-zinc-200 px-6 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Kennisportaal bekijken →
            </Link>
          )}
        </div>
      </div>

      {/* ── Feature pillars ──────────────────────────────────────────────────── */}
      <section>
        <div className="grid gap-4 sm:grid-cols-3">

          {/* Kennisportaal */}
          <Link
            href="/kennisportaal"
            className="group flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-orange-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-orange-800"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-900/20">
              <svg className="h-4 w-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.966 8.966 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Kennisportaal</h3>
            <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              Normen, meetmethoden en veelgestelde vragen per thema. Gratis toegankelijk — geen account vereist.
            </p>
            <span className="mt-auto text-xs font-medium text-orange-500 group-hover:underline">
              Bekijken →
            </span>
          </Link>

          {/* Onderzoeksinstrumenten */}
          <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-900/20">
              <svg className="h-4 w-4 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Onderzoeksinstrumenten</h3>
            <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              Stap-voor-stap begeleiding bij arbeidshygiënisch veldonderzoek voor geluid, klimaat, gevaarlijke stoffen en meer.
            </p>
            {!user ? (
              <Link href="/auth/login" className="mt-auto text-xs font-medium text-sky-500 hover:underline">
                Inloggen om te starten →
              </Link>
            ) : (
              <span className="mt-auto text-xs text-zinc-400 dark:text-zinc-500">
                Kies hieronder een thema ↓
              </span>
            )}
          </div>

          {/* Abonnementen — coming soon */}
          <div className="flex flex-col gap-2 rounded-xl border border-dashed border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
              <svg className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
              </svg>
            </div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Abonnementen</h3>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
                Binnenkort
              </span>
            </div>
            <p className="text-xs leading-relaxed text-zinc-400 dark:text-zinc-500">
              Teamfuncties, geavanceerde rapportage en extra opslagruimte voor grotere organisaties.
            </p>
          </div>

        </div>
      </section>

      {/* ── Onderzoeken ──────────────────────────────────────────────────────── */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Onderzoeken
        </h2>

        {user ? (
          <HomeThemesGrid items={themedItems} />
        ) : (
          <>
            <div className="grid grid-cols-4 gap-3">
              {themedItems.map((theme) => (
                <div
                  key={theme.slug}
                  className={`flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-l-4 bg-white p-3 opacity-50 shadow-sm ring-1 ring-zinc-100 dark:bg-zinc-900 dark:ring-zinc-800 ${theme.borderClass}`}
                >
                  <svg
                    className={`h-6 w-6 shrink-0 ${theme.iconClass}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    {theme.iconPaths.map((d, i) => (
                      <path key={i} strokeLinecap="round" strokeLinejoin="round" d={d} />
                    ))}
                  </svg>
                  <span className="text-center text-xs font-medium text-zinc-900 dark:text-zinc-50">
                    {theme.name}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-center text-sm text-zinc-400 dark:text-zinc-500">
              <Link href="/auth/login" className="text-orange-500 hover:underline">Log in</Link>
              {' '}of{' '}
              <Link href="/auth/register" className="text-orange-500 hover:underline">maak een account aan</Link>
              {' '}om onderzoeken te starten.
            </p>
          </>
        )}
      </section>

    </main>
  );
}
