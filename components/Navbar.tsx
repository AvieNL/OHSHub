import Link from 'next/link';
import { themes } from '@/lib/themes';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          OHS<span className="text-blue-600">Hub</span>
        </Link>

        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link
            href="/"
            className="text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Home
          </Link>

          <div className="group relative">
            <button className="flex items-center gap-1 text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
              Thema&apos;s
              <svg
                className="h-3.5 w-3.5 transition-transform group-hover:rotate-180"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <div className="invisible absolute right-0 top-full mt-2 w-56 rounded-lg border border-zinc-200 bg-white py-1 opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100 dark:border-zinc-800 dark:bg-zinc-900">
              {themes.map((theme) => (
                <Link
                  key={theme.slug}
                  href={`/themes/${theme.slug}`}
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  <span className={`h-2 w-2 rounded-full ${theme.dotClass}`} />
                  {theme.name}
                </Link>
              ))}
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
