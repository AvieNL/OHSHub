'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/admin', label: 'Gebruikers', exact: true },
  { href: '/admin/abbreviations', label: 'Afkortingen', exact: false },
  { href: '/ui-demo', label: 'UI-bibliotheek', exact: false },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-8 flex gap-1 border-b border-zinc-200 dark:border-zinc-800">
      {NAV_ITEMS.map((item) => {
        const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
