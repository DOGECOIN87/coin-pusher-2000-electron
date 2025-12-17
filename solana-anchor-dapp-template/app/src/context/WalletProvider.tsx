'use client';

import { FC, ReactNode, useMemo } from 'react';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';

// Default styles for wallet adapter
import '@solana/wallet-adapter-react-ui/styles.css';

interface Props {
  children: ReactNode;
}

export const SolanaWalletProvider: FC<Props> = ({ children }) => {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
  const network = WalletAdapterNetwork.Devnet;

  // You can also provide a custom RPC endpoint.
  const endpoint = useMemo(() => {
    // Use custom RPC endpoint if provided in environment variables
    if (process.env.NEXT_PUBLIC_RPC_ENDPOINT) {
      return process.env.NEXT_PUBLIC_RPC_ENDPOINT;
    }
    return clusterApiUrl(network);
  }, [network]);

  const wallets = useMemo(
    () => [
      // Wallets that implement the Solana Wallet Standard will be available automatically.
      // This includes Phantom, Solflare, Backpack, and many others.
      // 
      // If you wish to support a wallet that doesn't implement the Wallet Standard,
      // you can add legacy wallet adapters here. For example:
      // new PhantomWalletAdapter(),
      // new SolflareWalletAdapter(),
      // 
      // The wallet adapter will automatically detect wallets that implement the standard.
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
