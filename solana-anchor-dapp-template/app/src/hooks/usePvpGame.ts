'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAnchorWallet, useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import idl from '@/idl/pvp_game.json';
import { PvpGame } from '@/idl/pvp_game';

const PROGRAM_ID = new PublicKey(idl.address);

// Seeds
const PLATFORM_CONFIG_SEED = 'platform_config';
const TREASURY_SEED = 'treasury';
const MATCH_SEED = 'match';
const ESCROW_SEED = 'escrow';

type MatchStatusCamel =
  | 'waitingForOpponent'
  | 'inProgress'
  | 'completed'
  | 'cancelled'
  | 'claimed';

export type MatchAccount = {
  matchId: number[];
  player1: PublicKey;
  player2: PublicKey;
  stakeAmount: BN;
  status: Record<MatchStatusCamel, unknown> | Partial<Record<MatchStatusCamel, unknown>>;
  winner: PublicKey;
  createdAt: BN;
  startedAt: BN;
  endedAt: BN;
  feeAmount: BN;
  prizeAmount: BN;
  bump: number;
  escrowBump: number;
};

export type MatchWithPubkey = {
  publicKey: PublicKey;
  account: MatchAccount;
};

export type PlatformConfigAccount = {
  admin: PublicKey;
  gameAuthority: PublicKey;
  treasury: PublicKey;
  feeBps: number;
  paused: boolean;
  totalMatches: BN;
  matchesCompleted: BN;
  totalVolume: BN;
  totalFeesCollected: BN;
  bump: number;
};

export function usePvpGame() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();

  const [platformConfig, setPlatformConfig] = useState<PlatformConfigAccount | null>(null);
  const [openMatches, setOpenMatches] = useState<MatchWithPubkey[]>([]);
  const [myMatches, setMyMatches] = useState<MatchWithPubkey[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isInitializing, setIsInitializing] = useState(false);
  const [isCreatingMatch, setIsCreatingMatch] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  // Create provider and program
  const provider = useMemo(() => {
    if (!anchorWallet) return null;
    return new AnchorProvider(connection, anchorWallet, {
      preflightCommitment: 'processed',
      commitment: 'confirmed',
    });
  }, [connection, anchorWallet]);

  const program = useMemo(() => {
    if (!provider) return null;
    return new Program<PvpGame>(idl as PvpGame, provider);
  }, [provider]);

  // Derive platform config PDA
  const platformConfigPDA = useMemo(() => {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from(PLATFORM_CONFIG_SEED)],
      PROGRAM_ID
    );
    return pda;
  }, []);

  // Derive treasury PDA
  const treasuryPDA = useMemo(() => {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from(TREASURY_SEED)],
      PROGRAM_ID
    );
    return pda;
  }, []);

  // Generate match PDA from match ID
  const getMatchPDA = useCallback((matchId: Uint8Array) => {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from(MATCH_SEED), matchId],
      PROGRAM_ID
    );
    return pda;
  }, []);

  // Generate escrow PDA from match PDA
  const getEscrowPDA = useCallback((matchPDA: PublicKey) => {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from(ESCROW_SEED), matchPDA.toBuffer()],
      PROGRAM_ID
    );
    return pda;
  }, []);

  // Generate random match ID
  const generateMatchId = useCallback(() => {
    return crypto.getRandomValues(new Uint8Array(32));
  }, []);

  const refresh = useCallback(async () => {
    if (!program) return;
    setIsLoading(true);
    setError(null);
    try {
      const config = (await program.account.platformConfig.fetch(
        platformConfigPDA
      )) as PlatformConfigAccount;
      setPlatformConfig(config);

      const waitingStatusOffset = 8 + 32 + 32 + 32 + 8;
      const open = (await program.account.gameMatch.all([
        {
          memcmp: {
            offset: waitingStatusOffset,
            bytes: '1',
          },
        },
      ])) as unknown as MatchWithPubkey[];
      setOpenMatches(open);

      if (publicKey) {
        const all = (await program.account.gameMatch.all()) as unknown as MatchWithPubkey[];
        setMyMatches(
          all.filter(
            (m) => m.account.player1.equals(publicKey) || m.account.player2.equals(publicKey)
          )
        );
      } else {
        setMyMatches([]);
      }
    } catch (err: any) {
      setPlatformConfig(null);
      setOpenMatches([]);
      setMyMatches([]);
      const message = typeof err?.message === 'string' ? err.message : 'Failed to load on-chain data';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [program, platformConfigPDA, publicKey]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const initializePlatform = useCallback(async (): Promise<string> => {
    if (!program || !publicKey) throw new Error('Wallet not connected');
    setIsInitializing(true);
    try {
      const tx = await program.methods
        .initializePlatform()
        .accountsStrict({
          platformConfig: platformConfigPDA,
          treasury: treasuryPDA,
          admin: publicKey,
          gameAuthority: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      await refresh();
      return tx;
    } finally {
      setIsInitializing(false);
    }
  }, [program, publicKey, platformConfigPDA, treasuryPDA, refresh]);

  // Create a new match
  const createMatch = useCallback(
    async (stakeAmountSol: number): Promise<{ tx: string; matchId: Uint8Array; matchPDA: PublicKey }> => {
      if (!program || !publicKey) {
        throw new Error('Wallet not connected');
      }

      setIsCreatingMatch(true);
      const matchId = generateMatchId();
      const matchPDA = getMatchPDA(matchId);
      const escrowPDA = getEscrowPDA(matchPDA);
      const stakeAmount = new BN(stakeAmountSol * LAMPORTS_PER_SOL);

      try {
        const tx = await program.methods
          .createMatch(stakeAmount, Array.from(matchId))
          .accountsStrict({
            platformConfig: platformConfigPDA,
            gameMatch: matchPDA,
            escrow: escrowPDA,
            player1: publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        await refresh();
        return { tx, matchId, matchPDA };
      } finally {
        setIsCreatingMatch(false);
      }
    },
    [program, publicKey, platformConfigPDA, generateMatchId, getMatchPDA, getEscrowPDA, refresh]
  );

  // Join an existing match
  const joinMatch = useCallback(
    async (matchPDA: PublicKey): Promise<string> => {
      if (!program || !publicKey) {
        throw new Error('Wallet not connected');
      }

      setIsJoining(true);
      const escrowPDA = getEscrowPDA(matchPDA);

      try {
        const tx = await program.methods
          .joinMatch()
          .accountsStrict({
            platformConfig: platformConfigPDA,
            gameMatch: matchPDA,
            escrow: escrowPDA,
            player2: publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        await refresh();
        return tx;
      } finally {
        setIsJoining(false);
      }
    },
    [program, publicKey, platformConfigPDA, getEscrowPDA, refresh]
  );

  // Cancel a match (only if no opponent)
  const cancelMatch = useCallback(
    async (matchPDA: PublicKey): Promise<string> => {
      if (!program || !publicKey) {
        throw new Error('Wallet not connected');
      }

      setIsCanceling(true);
      const escrowPDA = getEscrowPDA(matchPDA);

      try {
        const tx = await program.methods
          .cancelMatch()
          .accountsStrict({
            gameMatch: matchPDA,
            escrow: escrowPDA,
            player1: publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        await refresh();
        return tx;
      } finally {
        setIsCanceling(false);
      }
    },
    [program, publicKey, getEscrowPDA, refresh]
  );

  // Submit match result (game authority only)
  const submitResult = useCallback(
    async (matchPDA: PublicKey, winner: PublicKey): Promise<string> => {
      if (!program || !publicKey) throw new Error('Wallet not connected');
      setIsSubmitting(true);
      try {
        const tx = await program.methods
          .submitResult(winner)
          .accountsStrict({
            platformConfig: platformConfigPDA,
            gameMatch: matchPDA,
            gameAuthority: publicKey,
          })
          .rpc();
        await refresh();
        return tx;
      } finally {
        setIsSubmitting(false);
      }
    },
    [program, publicKey, platformConfigPDA, refresh]
  );

  // Claim winnings (winner only)
  const claimWinnings = useCallback(
    async (matchPDA: PublicKey): Promise<string> => {
      if (!program || !publicKey) {
        throw new Error('Wallet not connected');
      }

      setIsClaiming(true);
      const escrowPDA = getEscrowPDA(matchPDA);

      try {
        const tx = await program.methods
          .claimWinnings()
          .accountsStrict({
            platformConfig: platformConfigPDA,
            gameMatch: matchPDA,
            escrow: escrowPDA,
            treasury: treasuryPDA,
            winner: publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        await refresh();
        return tx;
      } finally {
        setIsClaiming(false);
      }
    },
    [program, publicKey, platformConfigPDA, treasuryPDA, getEscrowPDA, refresh]
  );

  return {
    program,
    provider,
    platformConfigPDA,
    treasuryPDA,
    getMatchPDA,
    getEscrowPDA,
    generateMatchId,
    platformConfig,
    openMatches,
    myMatches,
    isLoading,
    error,
    isInitializing,
    isCreatingMatch,
    isJoining,
    isCanceling,
    isSubmitting,
    isClaiming,
    refresh,
    initializePlatform,
    createMatch,
    joinMatch,
    cancelMatch,
    submitResult,
    claimWinnings,
  };
}
