import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SolanaWalletProvider } from '@/context/WalletProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Coin Pusher 2000',
  description: 'Coin Pusher 2000 — a Solana dApp with on-chain escrow matches.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SolanaWalletProvider>{children}</SolanaWalletProvider>
      </body>
    </html>
  );
}
