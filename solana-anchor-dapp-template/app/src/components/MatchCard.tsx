'use client';

import { FC } from 'react';
import { usePvpGame } from '@/hooks/usePvpGame';
import type { MatchWithPubkey } from '@/hooks/usePvpGame';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import Link from 'next/link';

interface MatchCardProps {
  match: MatchWithPubkey;
}

export const MatchCard: FC<MatchCardProps> = ({ match }) => {
  const { publicKey } = useWallet();
  const {
    platformConfig,
    joinMatch,
    submitResult,
    claimWinnings,
    cancelMatch,
    isJoining,
    isSubmitting,
    isClaiming,
    isCanceling,
  } = usePvpGame();

  const status = getStatus(match.account.status);
  const isPlayer1 = publicKey ? publicKey.equals(match.account.player1) : false;
  const isPlayer2 = publicKey ? publicKey.equals(match.account.player2) : false;

  const canJoin = status === 'WaitingForOpponent' && !isPlayer1 && !isPlayer2;
  const canCancel = status === 'WaitingForOpponent' && isPlayer1;
  const canDeclareWinner =
    status === 'InProgress' &&
    publicKey &&
    platformConfig &&
    publicKey.equals(platformConfig.gameAuthority);
  const canClaim =
    status === 'Completed' && publicKey && publicKey.equals(match.account.winner);

  const renderAction = () => {
    const actions: JSX.Element[] = [];

    if (status === 'InProgress' && (isPlayer1 || isPlayer2)) {
      actions.push(
        <Link
          key="play"
          href={`/play/${match.publicKey.toBase58()}`}
          className="btn-primary w-full text-center"
        >
          Play Coin Pusher
        </Link>
      );
    }

    if (canJoin) {
      actions.push(
        <button
          key="join"
          onClick={() => joinMatch(match.publicKey)}
          className="btn-primary w-full"
          disabled={isJoining}
        >
          Join Match
        </button>
      );
    }

    if (canDeclareWinner) {
      actions.push(
        <div key="declare" className="flex gap-2">
          <button
            onClick={() => submitResult(match.publicKey, match.account.player1)}
            className="btn-secondary w-full"
            disabled={isSubmitting}
          >
            Winner: P1
          </button>
          <button
            onClick={() => submitResult(match.publicKey, match.account.player2)}
            className="btn-secondary w-full"
            disabled={isSubmitting}
          >
            Winner: P2
          </button>
        </div>
      );
    }

    if (canClaim) {
      actions.push(
        <button
          key="claim"
          onClick={() => claimWinnings(match.publicKey)}
          className="btn-primary w-full"
          disabled={isClaiming}
        >
          Claim Winnings
        </button>
      );
    }

    if (canCancel) {
      actions.push(
        <button
          key="cancel"
          onClick={() => cancelMatch(match.publicKey)}
          className="btn-secondary w-full"
          disabled={isCanceling}
        >
          Cancel Match
        </button>
      );
    }

    if (!actions.length) return null;
    return <div className="flex flex-col gap-2">{actions}</div>;
  };

  return (
    <div className="glass-card p-6 flex flex-col justify-between hover:border-[var(--primary-color)] transition-colors duration-300">
      <div>
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-sm text-[var(--subtext-color)]">Match Stake</p>
            <p className="text-2xl font-bold text-[var(--primary-color)]">
              {match.account.stakeAmount.toNumber() / LAMPORTS_PER_SOL} SOL
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-[var(--subtext-color)]">Status</p>
            <p className="font-bold">{renderStatus(status)}</p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <p><span className="font-semibold text-[var(--subtext-color)]">Player 1:</span> {match.account.player1.toBase58().slice(0, 8)}...</p>
          <p>
            <span className="font-semibold text-[var(--subtext-color)]">Player 2:</span>{' '}
            {status === 'WaitingForOpponent'
              ? 'Waiting...'
              : `${match.account.player2.toBase58().slice(0, 8)}...`}
          </p>
          {(status === 'Completed' || status === 'Claimed') && (
            <p>
              <span className="font-semibold text-[var(--subtext-color)]">Winner:</span>{' '}
              {match.account.winner.toBase58().slice(0, 8)}...
            </p>
          )}
        </div>
      </div>
      <div className="mt-6">
        {renderAction()}
      </div>
    </div>
  );
};

function getStatus(status: Record<string, unknown>): string {
  if (status.waitingForOpponent) return 'WaitingForOpponent';
  if (status.inProgress) return 'InProgress';
  if (status.completed) return 'Completed';
  if (status.cancelled) return 'Cancelled';
  if (status.claimed) return 'Claimed';
  return 'Unknown';
}

function renderStatus(status: string) {
  switch (status) {
    case 'WaitingForOpponent':
      return <span className="text-green-400">Open</span>;
    case 'InProgress':
      return <span className="text-yellow-400">In Progress</span>;
    case 'Completed':
      return <span className="text-blue-400">Completed</span>;
    case 'Cancelled':
      return <span className="text-gray-400">Cancelled</span>;
    case 'Claimed':
      return <span className="text-purple-400">Claimed</span>;
    default:
      return <span className="text-gray-500">Unknown</span>;
  }
}
