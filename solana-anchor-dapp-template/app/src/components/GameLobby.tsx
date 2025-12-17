'use client';

import { FC, useState } from 'react';
import { usePvpGame } from '@/hooks/usePvpGame';
import { MatchCard } from './MatchCard';
import { CreateMatchModal } from './CreateMatchModal';

export const GameLobby: FC = () => {
  const { openMatches, isLoading } = usePvpGame();
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  return (
    <div className="glass-card p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[var(--primary-color)]">Game Lobby</h2>
        <button onClick={() => setCreateModalOpen(true)} className="btn-primary">
          + Create Match
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-16">
          <div className="spinner"></div>
        </div>
      ) : openMatches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {openMatches.map((match) => (
            <MatchCard key={match.publicKey.toBase58()} match={match} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed border-white/10 rounded-lg">
          <h3 className="text-xl font-semibold text-[var(--subtext-color)]">No Open Matches</h3>
          <p className="text-sm text-white/50 mt-2">Be the first to create a match and start the action!</p>
        </div>
      )}

      {isCreateModalOpen && (
        <CreateMatchModal onClose={() => setCreateModalOpen(false)} />
      )}
    </div>
  );
};
