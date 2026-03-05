import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Navbar from '@/components/Navbar';
import { ThemeProvider } from '@/components/ThemeProvider';
import { AdminContextProvider } from '@/components/AdminContext';
import AbbrProvider from '@/components/AbbrProvider';
import PrivacyAcceptModal from '@/components/PrivacyAcceptModal';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getNamespaceContent } from '@/lib/content';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'OHSHub — Occupational Health & Safety',
  description:
    'Kennisplatform voor arbeidshygiënisten, hogere veiligheidskundigen en A&O-deskundigen.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Check admin status once per request for the edit-hint buttons
  let isAdmin = false;
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      isAdmin = data?.role === 'admin';
    }
  } catch { /* not critical — falls back to false */ }

  // Fetch custom abbreviations (merged with hardcoded ABBR_TITLES in AbbrProvider)
  const customAbbr = await getNamespaceContent('abbr.list').catch(() => ({}));

  return (
    <html lang="nl" suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme before React hydrates */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('ohshub-theme');if(t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50`}>
        <ThemeProvider>
          <AdminContextProvider isAdmin={isAdmin}>
            <AbbrProvider customAbbr={customAbbr}>
              <Navbar />
              {children}
              <PrivacyAcceptModal />
            </AbbrProvider>
          </AdminContextProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
