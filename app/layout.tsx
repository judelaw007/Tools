import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Providers } from '@/components/Providers';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'MojiTax Demo Tools',
    template: '%s | MojiTax Demo Tools',
  },
  description: 'Practical demo tools for learning international tax concepts. Included with MojiTax professional courses.',
  keywords: ['transfer pricing', 'VAT', 'FATCA', 'CRS', 'tax tools', 'tax learning', 'tax calculator'],
  authors: [{ name: 'MojiTax' }],
  creator: 'MojiTax',
  icons: {
    icon: '/mojitax-logo.png',
    shortcut: '/mojitax-logo.png',
    apple: '/mojitax-logo.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: 'https://tools.mojitax.co.uk',
    siteName: 'MojiTax Demo Tools',
    title: 'MojiTax Demo Tools',
    description: 'Practical demo tools for learning international tax concepts.',
    images: ['/mojitax-logo.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MojiTax Demo Tools',
    description: 'Practical demo tools for learning international tax concepts.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen bg-slate-50">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
