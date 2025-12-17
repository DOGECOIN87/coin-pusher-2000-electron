use anchor_lang::prelude::*;
use crate::state::{PlatformConfig, Vault};
use crate::GameError;

#[derive(Accounts)]
pub struct WithdrawFees<'info> {
    #[account(
        seeds = [PlatformConfig::SEED_PREFIX],
        bump = platform_config.bump,
        has_one = admin @ GameError::UnauthorizedAdmin,
        has_one = treasury
    )]
    pub platform_config: Account<'info, PlatformConfig>,
    
    /// Treasury account holding accumulated fees
    #[account(mut)]
    pub treasury: Account<'info, Vault>,
    
    /// Destination for withdrawn fees
    #[account(mut)]
    /// CHECK: Admin can withdraw to any account they specify
    pub destination: SystemAccount<'info>,
    
    /// Admin withdrawing fees
    pub admin: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<WithdrawFees>, amount: u64) -> Result<()> {
    let treasury_lamports = ctx.accounts.treasury.to_account_info().lamports();
    
    // Check treasury has enough balance
    require!(
        treasury_lamports >= amount,
        GameError::InsufficientEscrowFunds
    );
    
    // Transfer fees from treasury to destination
    **ctx.accounts.treasury.to_account_info().try_borrow_mut_lamports()? -= amount;
    **ctx.accounts.destination.to_account_info().try_borrow_mut_lamports()? += amount;
    
    msg!("Fees withdrawn!");
    msg!("Amount: {} lamports ({} SOL)", amount, amount as f64 / 1_000_000_000.0);
    msg!("Destination: {}", ctx.accounts.destination.key());
    
    Ok(())
}
