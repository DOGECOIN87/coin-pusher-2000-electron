'use client';

import { usePvpGame } from '@/hooks/usePvpGame';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { Header } from '@/components/Header';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type CoinPusherMessage =
  | {
      source: 'coin-pusher-2000';
      type: 'coin-pusher:start';
      match?: string;
      player?: string;
    }
  | {
      source: 'coin-pusher-2000';
      type: 'coin-pusher:finished';
      match?: string;
      player?: string;
      score: number;
      points: number;
    };

export default function PlayMatchPage() {
  const { match: matchParam } = useParams<{ match: string }>();
  const { publicKey } = useWallet();
  const { program, openMatches, myMatches } = usePvpGame();

  const matchPubkey = useMemo(() => {
    try {
      return new PublicKey(matchParam);
    } catch {
      return null;
    }
  }, [matchParam]);

  const [fetchedMatch, setFetchedMatch] = useState<any | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!program || !matchPubkey) return;
      try {
        const account = await program.account.gameMatch.fetch(matchPubkey);
        if (!cancelled) setFetchedMatch({ publicKey: matchPubkey, account });
      } catch {
        if (!cancelled) setFetchedMatch(null);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [program, matchPubkey]);

  const match = useMemo(() => {
    if (!matchPubkey) return null;
    return (
      myMatches.find((m) => m.publicKey.equals(matchPubkey)) ??
      openMatches.find((m) => m.publicKey.equals(matchPubkey)) ??
      fetchedMatch ??
      null
    );
  }, [matchPubkey, myMatches, openMatches, fetchedMatch]);

  const [runStarted, setRunStarted] = useState(false);
  const [finalScore, setFinalScore] = useState<{ score: number; points: number } | null>(null);

  const iframeSrc = useMemo(() => {
    const params = new URLSearchParams();
    params.set('match', matchParam);
    if (publicKey) params.set('player', publicKey.toBase58());
    return `/coin-pusher/index.html?${params.toString()}`;
  }, [matchParam, publicKey]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (!event.data || typeof event.data !== 'object') return;

      const data = event.data as Partial<CoinPusherMessage>;
      if (data.source !== 'coin-pusher-2000') return;
      if (data.match && data.match !== matchParam) return;

      if (data.type === 'coin-pusher:start') {
        setRunStarted(true);
        setFinalScore(null);
      }
      if (data.type === 'coin-pusher:finished') {
        if (typeof data.score === 'number' && typeof data.points === 'number') {
          setFinalScore({ score: data.score, points: data.points });
        }
      }
    }

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [matchParam]);

  return (
    <main className="min-h-screen flex flex-col bg-[var(--secondary-color)] text-[var(--text-color)]">
      <Header />

      <div className="container mx-auto px-4 py-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="btn-secondary">
            ← Back
          </Link>
          <div className="text-right">
            <p className="text-xs text-[var(--subtext-color)]">Match</p>
            <p className="text-sm font-mono text-white">
              {matchPubkey ? `${matchPubkey.toBase58().slice(0, 4)}...${matchPubkey.toBase58().slice(-4)}` : 'Invalid'}
            </p>
          </div>
        </div>

        <div className="glass-card p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm text-[var(--subtext-color)]">Status</p>
            <p className="font-bold text-white">
              {match ? getStatus(match.account.status) : 'Loading…'}
            </p>
          </div>
          <div>
            <p className="text-sm text-[var(--subtext-color)]">Run</p>
            <p className="font-bold text-white">
              {finalScore ? `Finished (score ${finalScore.score})` : runStarted ? 'In progress' : 'Not started'}
            </p>
          </div>
        </div>

        <div className="glass-card overflow-hidden" style={{ height: '80vh' }}>
          <iframe
            title="Coin Pusher 2000"
            src={iframeSrc}
            className="w-full h-full border-0"
            allow="clipboard-read; clipboard-write"
          />
        </div>

        {finalScore && (
          <div className="glass-card p-4">
            <h2 className="text-lg font-bold text-[var(--primary-color)]">Final Score</h2>
            <p className="text-sm text-[var(--subtext-color)]">
              Score: <span className="font-mono text-white">{finalScore.score}</span> · Points:{' '}
              <span className="font-mono text-white">{finalScore.points}</span>
            </p>
            <p className="text-xs text-white/50 mt-2">
              The on-chain winner must be declared by the configured game authority.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

function getStatus(status: Record<string, unknown>): string {
  if (status.waitingForOpponent) return 'WaitingForOpponent';
  if (status.inProgress) return 'InProgress';
  if (status.completed) return 'Completed';
  if (status.cancelled) return 'Cancelled';
  if (status.claimed) return 'Claimed';
  return 'Unknown';
}
