use anchor_lang::prelude::*;

/// Program-owned account that holds lamports.
///
/// Used for:
/// - Match escrow vaults (per match)
/// - Platform fee treasury vault (global)
#[account]
#[derive(InitSpace)]
pub struct Vault {}

impl Vault {
    pub const TREASURY_SEED_PREFIX: &'static [u8] = b"treasury";
}

