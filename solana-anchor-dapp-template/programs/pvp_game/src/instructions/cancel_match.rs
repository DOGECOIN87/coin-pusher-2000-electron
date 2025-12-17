use anchor_lang::prelude::*;
use crate::state::{GameMatch, MatchStatus, Vault};
use crate::GameError;

#[derive(Accounts)]
pub struct CancelMatch<'info> {
    #[account(
        mut,
        seeds = [GameMatch::SEED_PREFIX, &game_match.match_id],
        bump = game_match.bump,
        constraint = game_match.status == MatchStatus::WaitingForOpponent @ GameError::CannotCancelActiveMatch,
        constraint = game_match.player1 == player1.key() @ GameError::OnlyCreatorCanCancel
    )]
    pub game_match: Account<'info, GameMatch>,
    
    /// Escrow vault holding Player 1's stake
    #[account(
        mut,
        seeds = [GameMatch::ESCROW_SEED_PREFIX, game_match.key().as_ref()],
        bump = game_match.escrow_bump,
        close = player1
    )]
    pub escrow: Account<'info, Vault>,
    
    /// Player 1 (match creator) cancelling the match
    #[account(mut)]
    pub player1: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CancelMatch>) -> Result<()> {
    let game_match = &mut ctx.accounts.game_match;
    let stake_amount = game_match.stake_amount;
    
    require!(
        ctx.accounts.escrow.to_account_info().lamports() >= stake_amount,
        GameError::InsufficientEscrowFunds
    );
    
    // Transfer stake back to player1 from escrow
    **ctx.accounts.escrow.to_account_info().try_borrow_mut_lamports()? -= stake_amount;
    **ctx.accounts.player1.to_account_info().try_borrow_mut_lamports()? += stake_amount;
    
    // Mark match as cancelled
    game_match.cancel();
    
    msg!("Match cancelled!");
    msg!("Match ID: {:?}", game_match.match_id);
    msg!("Refunded {} lamports ({} SOL) to Player 1", stake_amount, stake_amount as f64 / 1_000_000_000.0);
    
    Ok(())
}
