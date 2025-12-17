import { PublicKey, Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';

/**
 * Shortens a public key or address for display
 */
export function shortenAddress(address: string | PublicKey, chars = 4): string {
  const addressStr = typeof address === 'string' ? address : address.toBase58();
  return `${addressStr.slice(0, chars)}...${addressStr.slice(-chars)}`;
}

/**
 * Converts lamports to SOL
 */
export function lamportsToSol(lamports: number): number {
  return lamports / LAMPORTS_PER_SOL;
}

/**
 * Converts SOL to lamports
 */
export function solToLamports(sol: number): number {
  return sol * LAMPORTS_PER_SOL;
}

/**
 * Gets the SOL balance of an account
 */
export async function getBalance(
  connection: Connection,
  publicKey: PublicKey
): Promise<number> {
  const balance = await connection.getBalance(publicKey);
  return lamportsToSol(balance);
}

/**
 * Generates a Solana Explorer URL for a transaction
 */
export function getExplorerUrl(
  signature: string,
  cluster: 'mainnet-beta' | 'devnet' | 'testnet' | 'localnet' = 'devnet'
): string {
  const baseUrl = 'https://explorer.solana.com/tx';
  const clusterParam = cluster === 'mainnet-beta' ? '' : `?cluster=${cluster}`;
  return `${baseUrl}/${signature}${clusterParam}`;
}

/**
 * Generates a Solana Explorer URL for an account
 */
export function getAccountExplorerUrl(
  address: string | PublicKey,
  cluster: 'mainnet-beta' | 'devnet' | 'testnet' | 'localnet' = 'devnet'
): string {
  const addressStr = typeof address === 'string' ? address : address.toBase58();
  const baseUrl = 'https://explorer.solana.com/address';
  const clusterParam = cluster === 'mainnet-beta' ? '' : `?cluster=${cluster}`;
  return `${baseUrl}/${addressStr}${clusterParam}`;
}

/**
 * Waits for a transaction to be confirmed
 */
export async function confirmTransaction(
  connection: Connection,
  signature: string,
  commitment: 'processed' | 'confirmed' | 'finalized' = 'confirmed'
): Promise<void> {
  const latestBlockhash = await connection.getLatestBlockhash();
  await connection.confirmTransaction(
    {
      signature,
      ...latestBlockhash,
    },
    commitment
  );
}

/**
 * Formats a number with commas for display
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Sleep for a given number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
