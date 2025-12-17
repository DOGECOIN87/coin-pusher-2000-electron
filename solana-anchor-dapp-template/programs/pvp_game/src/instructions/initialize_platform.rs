use anchor_lang::prelude::*;
use crate::state::{PlatformConfig, Vault};
use crate::PLATFORM_FEE_BPS;

#[derive(Accounts)]
pub struct InitializePlatform<'info> {
    /// Platform config account (PDA)
    #[account(
        init,
        payer = admin,
        space = 8 + PlatformConfig::INIT_SPACE,
        seeds = [PlatformConfig::SEED_PREFIX],
        bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,
    
    /// Admin who initializes and controls the platform
    #[account(mut)]
    pub admin: Signer<'info>,

    /// Game authority (server keypair) that will submit results
    /// CHECK: This is just stored as a pubkey, validated on use
    pub game_authority: UncheckedAccount<'info>,

    /// Program-owned treasury vault (PDA) where fees are accumulated.
    #[account(
        init,
        payer = admin,
        space = 8 + Vault::INIT_SPACE,
        seeds = [Vault::TREASURY_SEED_PREFIX],
        bump
    )]
    pub treasury: Account<'info, Vault>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializePlatform>) -> Result<()> {
    let platform_config = &mut ctx.accounts.platform_config;
    let bump = ctx.bumps.platform_config;
    
    platform_config.init(
        ctx.accounts.admin.key(),
        ctx.accounts.game_authority.key(),
        ctx.accounts.treasury.key(),
        PLATFORM_FEE_BPS,
        bump,
    );
    
    msg!("Platform initialized!");
    msg!("Admin: {}", platform_config.admin);
    msg!("Game Authority: {}", platform_config.game_authority);
    msg!("Treasury: {}", platform_config.treasury);
    msg!("Fee: {}%", platform_config.fee_bps as f64 / 100.0);
    
    Ok(())
}
