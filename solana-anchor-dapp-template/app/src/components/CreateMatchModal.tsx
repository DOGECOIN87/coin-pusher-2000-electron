'use client';

import { FC, useState } from 'react';
import { usePvpGame } from '@/hooks/usePvpGame';

interface CreateMatchModalProps {
  onClose: () => void;
}

export const CreateMatchModal: FC<CreateMatchModalProps> = ({ onClose }) => {
  const [stakeAmount, setStakeAmount] = useState(0.1);
  const { createMatch, isCreatingMatch } = usePvpGame();

  const handleCreateMatch = async () => {
    await createMatch(stakeAmount);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass-card p-8 rounded-2xl w-full max-w-md m-4">
        <h2 className="text-2xl font-bold mb-6 text-[var(--primary-color)]">Create New Match</h2>

        {/* Stake Amount Input */}
        <div className="mb-6">
          <label htmlFor="stake" className="block text-sm font-bold text-[var(--subtext-color)] mb-2">
            Stake Amount (SOL)
          </label>
          <div className="relative">
            <input
              id="stake"
              type="number"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(parseFloat(e.target.value))}
              className="w-full bg-white/5 border-2 border-white/10 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-[var(--primary-color)] transition-colors"
              min="0.01"
              step="0.01"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleCreateMatch}
            className="btn-primary"
            disabled={isCreatingMatch || stakeAmount <= 0}
          >
            {isCreatingMatch ? (
              <div className="flex items-center gap-2">
                <div className="spinner"></div>
                Creating...
              </div>
            ) : (
              'Create Match'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
