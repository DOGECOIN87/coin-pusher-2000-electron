use anchor_lang::prelude::*;
use crate::state::PlatformConfig;
use crate::GameError;

#[derive(Accounts)]
pub struct UpdatePlatform<'info> {
    #[account(
        mut,
        seeds = [PlatformConfig::SEED_PREFIX],
        bump = platform_config.bump,
        has_one = admin @ GameError::UnauthorizedAdmin
    )]
    pub platform_config: Account<'info, PlatformConfig>,
    
    pub admin: Signer<'info>,
}

pub fn handler(
    ctx: Context<UpdatePlatform>,
    new_admin: Option<Pubkey>,
    new_game_authority: Option<Pubkey>,
    paused: Option<bool>,
) -> Result<()> {
    let platform_config = &mut ctx.accounts.platform_config;
    
    if let Some(admin) = new_admin {
        msg!("Updating admin to: {}", admin);
        platform_config.admin = admin;
    }
    
    if let Some(authority) = new_game_authority {
        msg!("Updating game authority to: {}", authority);
        platform_config.game_authority = authority;
    }
    
    if let Some(is_paused) = paused {
        msg!("Setting paused to: {}", is_paused);
        platform_config.paused = is_paused;
    }
    
    msg!("Platform settings updated!");
    
    Ok(())
}
