use anchor_lang::prelude::*;

pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("979EWfY3g1JNLEsm9LLdZjQ3LRedtXGJ2Z4p6e1ma1AG");

/// Platform fee in basis points (500 = 5%)
pub const PLATFORM_FEE_BPS: u16 = 500;

#[program]
pub mod pvp_game {
    use super::*;

    /// Initialize the platform configuration
    /// Called once by the admin to set up the platform
    pub fn initialize_platform(ctx: Context<InitializePlatform>) -> Result<()> {
        instructions::initialize_platform::handler(ctx)
    }

    /// Update platform settings (admin only)
    pub fn update_platform(
        ctx: Context<UpdatePlatform>,
        new_admin: Option<Pubkey>,
        new_game_authority: Option<Pubkey>,
        paused: Option<bool>,
    ) -> Result<()> {
        instructions::update_platform::handler(ctx, new_admin, new_game_authority, paused)
    }

    /// Create a new match and stake SOL
    /// Player 1 creates a match with a specific stake amount
    pub fn create_match(ctx: Context<CreateMatch>, stake_amount: u64, match_id: [u8; 32]) -> Result<()> {
        instructions::create_match::handler(ctx, stake_amount, match_id)
    }

    /// Join an existing match
    /// Player 2 joins by staking the same amount as Player 1
    pub fn join_match(ctx: Context<JoinMatch>) -> Result<()> {
        instructions::join_match::handler(ctx)
    }

    /// Submit match result (game authority only)
    /// Called by the game server to declare the winner
    pub fn submit_result(ctx: Context<SubmitResult>, winner: Pubkey) -> Result<()> {
        instructions::submit_result::handler(ctx, winner)
    }

    /// Claim winnings after match is settled
    /// Winner calls this to receive their prize
    pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
        instructions::claim_winnings::handler(ctx)
    }

    /// Cancel a match (only if no opponent has joined)
    /// Player 1 can cancel and get refund if no one joined
    pub fn cancel_match(ctx: Context<CancelMatch>) -> Result<()> {
        instructions::cancel_match::handler(ctx)
    }

    /// Withdraw accumulated platform fees (admin only)
    pub fn withdraw_fees(ctx: Context<WithdrawFees>, amount: u64) -> Result<()> {
        instructions::withdraw_fees::handler(ctx, amount)
    }
}

/// Custom error codes for the PVP game program
#[error_code]
pub enum GameError {
    #[msg("Platform is currently paused")]
    PlatformPaused,
    
    #[msg("Unauthorized: Only admin can perform this action")]
    UnauthorizedAdmin,
    
    #[msg("Unauthorized: Only game authority can perform this action")]
    UnauthorizedGameAuthority,
    
    #[msg("Match is not in the correct state for this action")]
    InvalidMatchState,
    
    #[msg("Stake amount must be greater than zero")]
    InvalidStakeAmount,
    
    #[msg("Minimum stake is 0.01 SOL")]
    StakeTooLow,
    
    #[msg("Maximum stake is 100 SOL")]
    StakeTooHigh,
    
    #[msg("Winner must be one of the players")]
    InvalidWinner,
    
    #[msg("Only the winner can claim the prize")]
    NotWinner,
    
    #[msg("Match already has two players")]
    MatchFull,
    
    #[msg("Cannot join your own match")]
    CannotJoinOwnMatch,
    
    #[msg("Match can only be cancelled before an opponent joins")]
    CannotCancelActiveMatch,
    
    #[msg("Only the match creator can cancel")]
    OnlyCreatorCanCancel,
    
    #[msg("Insufficient funds in escrow")]
    InsufficientEscrowFunds,
    
    #[msg("Arithmetic overflow")]
    Overflow,

    #[msg("Match has expired")]
    MatchExpired,
}
