'use client';

import { FC } from 'react';
import { usePvpGame } from '@/hooks/usePvpGame';
import { MatchCard } from './MatchCard';

export const MyMatches: FC = () => {
  const { myMatches, isLoading } = usePvpGame();

  return (
    <div className="glass-card p-6">
      <h2 className="text-2xl font-bold mb-6 text-[var(--primary-color)]">My Matches</h2>

      {isLoading ? (
        <div className="flex justify-center items-center py-16">
          <div className="spinner"></div>
        </div>
      ) : myMatches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myMatches.map((match) => (
            <MatchCard key={match.publicKey.toBase58()} match={match} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed border-white/10 rounded-lg">
          <h3 className="text-xl font-semibold text-[var(--subtext-color)]">No Active Matches</h3>
          <p className="text-sm text-white/50 mt-2">You have not created or joined any matches yet.</p>
        </div>
      )}
    </div>
  );
};
