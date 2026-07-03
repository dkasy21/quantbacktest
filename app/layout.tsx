import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import Providers from '@/components/Providers';

export const metadata: Metadata = {
  title: 'QuantBacktest — Backtest any strategy in seconds',
  description: 'Build trading strategies with a no-code rule builder and backtest them instantly with detailed stats and charts.',
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
