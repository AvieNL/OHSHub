'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import MarkdownContent from '@/components/MarkdownContent';

const SESSION_KEY = 'privacy_dismissed';

async function fetchPrivacyStatus(): Promise<{ version: string; body: string | null } | null> {
  const res = await fetch('/api/privacy-status').catch(() => null);
  if (!res?.ok) return null;
  const data = await res.json().catch(() => null);
  if (!data?.version) return null;
  return data as { version: string; body: string | null };
}

export default function PrivacyAcceptModal() {
  const [version, setVersion] = useState<string | null>(null);
  const [body, setBody] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function check() {
      const data = await fetchPrivacyStatus();
      if (!data) return;
      if (sessionStorage.getItem(SESSION_KEY) === data.version) return;
      setVersion(data.version);
      setBody(data.body);
      setVisible(true);
    }

    // Check on mount (handles full-page reload after login)
    check();

    // Re-check whenever auth state changes to SIGNED_IN
    // (handles client-side login via router.replace without a full page reload)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') check();
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleAccept() {
    setAccepting(true);
    const res = await fetch('/api/privacy-accept', { method: 'POST' });
    if (res.ok) setVisible(false);
    setAccepting(false);
  }

  function handleLater() {
    if (version) sessionStorage.setItem(SESSION_KEY, version);
    setVisible(false);
  }

  if (!visible || !version) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
        {/* Header */}
        <div className="shrink-0 border-b border-zinc-100 px-6 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Privacyverklaring bijgewerkt
            </h2>
          </div>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            De privacyverklaring is bijgewerkt (
            <span className="font-mono font-semibold text-orange-600 dark:text-orange-400">v{version}</span>
            ). Lees de nieuwe tekst en accepteer om door te gaan.
          </p>
        </div>

        {/* Scrollable body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {body ? (
            <MarkdownContent className="text-sm text-zinc-700 dark:text-zinc-300">
              {body}
            </MarkdownContent>
          ) : (
            <p className="text-sm text-zinc-400">
              Ga naar <a href="/privacy" className="underline text-orange-600 dark:text-orange-400">/privacy</a> om de actuele privacyverklaring te lezen.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-between gap-3 border-t border-zinc-100 px-6 py-4 dark:border-zinc-800">
          <button
            onClick={handleLater}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Later
          </button>
          <button
            onClick={handleAccept}
            disabled={accepting}
            className="rounded-lg bg-orange-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50"
          >
            {accepting ? 'Verwerken…' : 'Accepteren en doorgaan'}
          </button>
        </div>
      </div>
    </div>
  );
}
