use anchor_lang::prelude::*;

/// Platform configuration account
/// Stores global settings for the PVP game platform
#[account]
#[derive(InitSpace)]
pub struct PlatformConfig {
    /// Admin who can update platform settings and withdraw fees
    pub admin: Pubkey,
    
    /// Game authority (server) that can submit match results
    pub game_authority: Pubkey,
    
    /// Treasury account where fees are collected
    pub treasury: Pubkey,
    
    /// Platform fee in basis points (e.g., 500 = 5%)
    pub fee_bps: u16,
    
    /// Whether the platform is paused
    pub paused: bool,
    
    /// Total matches created
    pub total_matches: u64,
    
    /// Total matches completed
    pub matches_completed: u64,
    
    /// Total volume in lamports
    pub total_volume: u64,
    
    /// Total fees collected in lamports
    pub total_fees_collected: u64,
    
    /// Bump seed for PDA derivation
    pub bump: u8,
}

impl PlatformConfig {
    pub const SEED_PREFIX: &'static [u8] = b"platform_config";
    
    /// Initialize platform config
    pub fn init(
        &mut self,
        admin: Pubkey,
        game_authority: Pubkey,
        treasury: Pubkey,
        fee_bps: u16,
        bump: u8,
    ) {
        self.admin = admin;
        self.game_authority = game_authority;
        self.treasury = treasury;
        self.fee_bps = fee_bps;
        self.paused = false;
        self.total_matches = 0;
        self.matches_completed = 0;
        self.total_volume = 0;
        self.total_fees_collected = 0;
        self.bump = bump;
    }
    
    /// Calculate platform fee for a given amount
    pub fn calculate_fee(&self, amount: u64) -> Result<u64> {
        // fee = amount * fee_bps / 10000
        let fee = (amount as u128)
            .checked_mul(self.fee_bps as u128)
            .ok_or(crate::GameError::Overflow)?
            .checked_div(10000)
            .ok_or(crate::GameError::Overflow)? as u64;
        Ok(fee)
    }
}
