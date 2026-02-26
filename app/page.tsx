import Link from 'next/link';
import { themes } from '@/lib/themes';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function Home() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            OHSHub
          </h1>
          <p className="mt-3 text-lg text-zinc-500 dark:text-zinc-400">
            Kennisplatform voor arbeidshygiënisten, hogere veiligheidskundigen en A&amp;O-deskundigen.
          </p>
        </div>

        <div className="flex flex-col items-start gap-4 sm:flex-row">
          <Link
            href="/auth/login"
            className="rounded-lg bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            Inloggen
          </Link>
          <Link
            href="/auth/register"
            className="rounded-lg border border-zinc-200 px-6 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Account aanmaken
          </Link>
        </div>

        <section className="mt-16">
          <h2 className="mb-6 text-sm font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            Beschikbare thema&apos;s
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {themes.map((theme) => (
              <div
                key={theme.slug}
                className={`flex flex-col gap-3 rounded-xl border-l-4 bg-white p-6 shadow-sm ring-1 ring-zinc-100 opacity-60 dark:bg-zinc-900 dark:ring-zinc-800 ${theme.borderClass}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${theme.badgeClass}`}>
                    {theme.name}
                  </span>
                  <svg className="h-4 w-4 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {theme.description}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-zinc-400 dark:text-zinc-500">
            Log in om toegang te krijgen tot alle thema&apos;s en onderzoeken.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          OHSHub
        </h1>
        <p className="mt-3 text-lg text-zinc-500 dark:text-zinc-400">
          Kennisplatform voor arbeidshygiënisten, hogere veiligheidskundigen en A&amp;O-deskundigen.
        </p>
      </div>

      <section>
        <h2 className="mb-6 text-sm font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Thema&apos;s
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {themes.map((theme) => (
            <Link
              key={theme.slug}
              href={`/themes/${theme.slug}`}
              className={`group flex flex-col gap-3 rounded-xl border-l-4 bg-white p-6 shadow-sm ring-1 ring-zinc-100 transition hover:shadow-md dark:bg-zinc-900 dark:ring-zinc-800 ${theme.borderClass}`}
            >
              <div className="flex items-center justify-between">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${theme.badgeClass}`}>
                  {theme.name}
                </span>
                <svg
                  className="h-4 w-4 text-zinc-400 transition-transform group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {theme.description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
