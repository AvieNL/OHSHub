import Link from 'next/link';
import { themes } from '@/lib/themes';

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          OHSHub
        </h1>
        <p className="mt-3 text-lg text-zinc-500 dark:text-zinc-400">
          Kennisplatform voor arbeidshygiënisten, hogere veiligheidskundigen en A&O-deskundigen.
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
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${theme.badgeClass}`}
                >
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
