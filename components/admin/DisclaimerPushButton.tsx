'use client';

import { useState } from 'react';

interface Props {
  userId: string;
  hasPending: boolean;
  pendingVersion: string | null;
  onDone: () => void;
}

export default function DisclaimerPushButton({ userId, hasPending, pendingVersion, onDone }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: hasPending ? 'disclaimer-clear' : 'disclaimer-push' }),
    });
    setLoading(false);
    onDone();
  }

  if (hasPending) {
    return (
      <button
        onClick={handleClick}
        disabled={loading}
        title={`Herbevestigingsverzoek disclaimer intrekken (v${pendingVersion})`}
        className="rounded-lg p-1.5 text-amber-500 hover:bg-amber-50 hover:text-amber-700 disabled:opacity-50 dark:hover:bg-amber-900/20 dark:hover:text-amber-300"
      >
        {/* X icon */}
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      title="Herbevestiging disclaimer verplichten"
      className="rounded-lg p-1.5 text-zinc-400 hover:bg-orange-50 hover:text-orange-500 disabled:opacity-50 dark:hover:bg-orange-900/20 dark:hover:text-orange-400"
    >
      {/* Bell icon */}
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
      </svg>
    </button>
  );
}
