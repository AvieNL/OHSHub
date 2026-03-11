'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import MarkdownContent from '@/components/MarkdownContent';

const SESSION_KEY = 'disclaimer_dismissed';

async function fetchDisclaimerStatus(): Promise<{ version: string; body: string | null } | null> {
  const res = await fetch('/api/disclaimer-status').catch(() => null);
  if (!res?.ok) return null;
  const data = await res.json().catch(() => null);
  if (!data?.version) return null;
  return data as { version: string; body: string | null };
}

export default function DisclaimerModal() {
  const [version, setVersion] = useState<string | null>(null);
  const [body, setBody] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function check() {
      const data = await fetchDisclaimerStatus();
      if (!data) return;
      if (sessionStorage.getItem(SESSION_KEY) === data.version) return;
      setVersion(data.version);
      setBody(data.body);
      setVisible(true);
    }

    check();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') check();
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleAccept() {
    setAccepting(true);
    const res = await fetch('/api/disclaimer-accept', { method: 'POST' });
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Disclaimer bijgewerkt
            </h2>
          </div>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            De disclaimer is bijgewerkt (
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
              Ga naar <a href="/disclaimer" className="underline text-orange-600 dark:text-orange-400">/disclaimer</a> om de actuele disclaimer te lezen.
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
