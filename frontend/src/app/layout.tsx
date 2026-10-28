import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TRACE X | Follow the Evidence. Reconstruct the Truth.',
  description: 'AI-Powered Fraud Investigation & Digital Evidence Reconstruction Platform',
  keywords: ['forensics', 'fraud investigation', 'evidence reconstruction', 'digital forensics', 'AI'],
  authors: [{ name: 'TRACE X Team' }],
  openGraph: {
    title: 'TRACE X | Follow the Evidence. Reconstruct the Truth.',
    description: 'AI-Powered Fraud Investigation & Digital Evidence Reconstruction Platform',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} forensic-grid`}>
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔍</text></svg>" />
      </head>
      <body className="font-sans antialiased min-h-screen bg-forensic-bg text-forensic-text">
        <AuthProvider>
          <div className="relative min-h-screen">
            <div className="fixed inset-0 scanline pointer-events-none" aria-hidden="true" />
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}