use anchor_lang::prelude::*;

/// Match status enum
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum MatchStatus {
    /// Waiting for opponent to join
    WaitingForOpponent,
    /// Both players joined, game in progress
    InProgress,
    /// Match completed, winner declared
    Completed,
    /// Match cancelled (refunded)
    Cancelled,
    /// Winnings claimed
    Claimed,
}

impl Default for MatchStatus {
    fn default() -> Self {
        MatchStatus::WaitingForOpponent
    }
}

/// Individual match account
/// Stores all data for a single PVP match
#[account]
#[derive(InitSpace)]
pub struct GameMatch {
    /// Unique match identifier
    pub match_id: [u8; 32],
    
    /// Player 1 (match creator)
    pub player1: Pubkey,
    
    /// Player 2 (opponent) - Pubkey::default() if not joined
    pub player2: Pubkey,
    
    /// Stake amount per player in lamports
    pub stake_amount: u64,
    
    /// Current match status
    pub status: MatchStatus,
    
    /// Winner of the match (Pubkey::default() if not decided)
    pub winner: Pubkey,
    
    /// Timestamp when match was created
    pub created_at: i64,
    
    /// Timestamp when opponent joined
    pub started_at: i64,
    
    /// Timestamp when match ended
    pub ended_at: i64,
    
    /// Platform fee amount (calculated at settlement)
    pub fee_amount: u64,
    
    /// Prize amount for winner (total pot - fee)
    pub prize_amount: u64,
    
    /// Bump seed for match PDA
    pub bump: u8,
    
    /// Bump seed for escrow PDA
    pub escrow_bump: u8,
}

impl GameMatch {
    pub const SEED_PREFIX: &'static [u8] = b"match";
    pub const ESCROW_SEED_PREFIX: &'static [u8] = b"escrow";
    
    /// Match expiration time (24 hours in seconds)
    pub const EXPIRATION_TIME: i64 = 86400;
    
    /// Minimum stake (0.01 SOL)
    pub const MIN_STAKE: u64 = 10_000_000; // 0.01 SOL in lamports
    
    /// Maximum stake (100 SOL)
    pub const MAX_STAKE: u64 = 100_000_000_000; // 100 SOL in lamports
    
    /// Initialize a new match
    pub fn init(
        &mut self,
        match_id: [u8; 32],
        player1: Pubkey,
        stake_amount: u64,
        created_at: i64,
        bump: u8,
        escrow_bump: u8,
    ) {
        self.match_id = match_id;
        self.player1 = player1;
        self.player2 = Pubkey::default();
        self.stake_amount = stake_amount;
        self.status = MatchStatus::WaitingForOpponent;
        self.winner = Pubkey::default();
        self.created_at = created_at;
        self.started_at = 0;
        self.ended_at = 0;
        self.fee_amount = 0;
        self.prize_amount = 0;
        self.bump = bump;
        self.escrow_bump = escrow_bump;
    }
    
    /// Check if match has expired (no opponent joined within 24h)
    pub fn is_expired(&self, current_time: i64) -> bool {
        self.status == MatchStatus::WaitingForOpponent 
            && current_time > self.created_at + Self::EXPIRATION_TIME
    }
    
    /// Join the match as player 2
    pub fn join(&mut self, player2: Pubkey, joined_at: i64) -> Result<()> {
        require!(
            self.status == MatchStatus::WaitingForOpponent,
            crate::GameError::InvalidMatchState
        );
        require!(
            player2 != self.player1,
            crate::GameError::CannotJoinOwnMatch
        );
        
        self.player2 = player2;
        self.status = MatchStatus::InProgress;
        self.started_at = joined_at;
        
        Ok(())
    }
    
    /// Set the match result
    pub fn set_result(
        &mut self,
        winner: Pubkey,
        fee_amount: u64,
        prize_amount: u64,
        ended_at: i64,
    ) -> Result<()> {
        require!(
            self.status == MatchStatus::InProgress,
            crate::GameError::InvalidMatchState
        );
        require!(
            winner == self.player1 || winner == self.player2,
            crate::GameError::InvalidWinner
        );
        
        self.winner = winner;
        self.fee_amount = fee_amount;
        self.prize_amount = prize_amount;
        self.ended_at = ended_at;
        self.status = MatchStatus::Completed;
        
        Ok(())
    }
    
    /// Mark winnings as claimed
    pub fn mark_claimed(&mut self) {
        self.status = MatchStatus::Claimed;
    }
    
    /// Cancel the match
    pub fn cancel(&mut self) {
        self.status = MatchStatus::Cancelled;
    }
    
    /// Get total pot amount
    pub fn total_pot(&self) -> u64 {
        self.stake_amount.saturating_mul(2)
    }
}
