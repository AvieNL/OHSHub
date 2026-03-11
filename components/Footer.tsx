import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-zinc-100 py-5 dark:border-zinc-800">
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-zinc-400 dark:text-zinc-600">
        <Link
          href="/disclaimer"
          className="transition hover:text-zinc-600 dark:hover:text-zinc-400"
        >
          Disclaimer
        </Link>
        <span aria-hidden>·</span>
        <Link
          href="/privacy"
          className="transition hover:text-zinc-600 dark:hover:text-zinc-400"
        >
          Privacyverklaring
        </Link>
        <span aria-hidden>·</span>
        <Link
          href="/over"
          className="transition hover:text-zinc-600 dark:hover:text-zinc-400"
        >
          Over OHSHub
        </Link>
      </div>
    </footer>
  );
}
