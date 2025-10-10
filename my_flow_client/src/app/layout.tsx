import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Navigation } from '@/components/navigation';
import { Toaster } from 'sonner';
import { AppProviders } from '@/components/providers/app-providers';
import { CurrentUserServerProvider } from '@/components/providers/current-user-provider';
import { ReactNode, ReactElement } from 'react';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'MyFlow',
  description: 'Your workflow management platform',
};

// Force dynamic rendering to prevent build-time static generation
// This is required because Navigation component accesses Logto session data
export const dynamic = 'force-dynamic';

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>): Promise<ReactElement> {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <CurrentUserServerProvider>
          <AppProviders>
            <Navigation />
            {children}
            <Toaster />
          </AppProviders>
        </CurrentUserServerProvider>
      </body>
    </html>
  );
}
