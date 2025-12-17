use anchor_lang::prelude::*;
use crate::state::{PlatformConfig, GameMatch, MatchStatus};
use crate::GameError;

#[derive(Accounts)]
pub struct SubmitResult<'info> {
    #[account(
        mut,
        seeds = [PlatformConfig::SEED_PREFIX],
        bump = platform_config.bump,
        has_one = game_authority @ GameError::UnauthorizedGameAuthority
    )]
    pub platform_config: Account<'info, PlatformConfig>,
    
    #[account(
        mut,
        seeds = [GameMatch::SEED_PREFIX, &game_match.match_id],
        bump = game_match.bump,
        constraint = game_match.status == MatchStatus::InProgress @ GameError::InvalidMatchState
    )]
    pub game_match: Account<'info, GameMatch>,
    
    /// Game authority (server) that submits results
    pub game_authority: Signer<'info>,
}

pub fn handler(ctx: Context<SubmitResult>, winner: Pubkey) -> Result<()> {
    let game_match = &mut ctx.accounts.game_match;
    let platform_config = &ctx.accounts.platform_config;
    let clock = Clock::get()?;
    
    // Validate winner is one of the players
    require!(
        winner == game_match.player1 || winner == game_match.player2,
        GameError::InvalidWinner
    );
    
    // Calculate fee and prize
    let total_pot = game_match.total_pot();
    let fee_amount = platform_config.calculate_fee(total_pot)?;
    let prize_amount = total_pot.saturating_sub(fee_amount);
    
    // Update match result
    game_match.set_result(winner, fee_amount, prize_amount, clock.unix_timestamp)?;
    
    // Update platform stats
    let platform_config = &mut ctx.accounts.platform_config;
    platform_config.matches_completed = platform_config.matches_completed.saturating_add(1);
    platform_config.total_fees_collected = platform_config.total_fees_collected.saturating_add(fee_amount);
    
    msg!("Match result submitted!");
    msg!("Winner: {}", winner);
    msg!("Total pot: {} lamports", total_pot);
    msg!("Platform fee (5%): {} lamports", fee_amount);
    msg!("Winner prize: {} lamports ({} SOL)", prize_amount, prize_amount as f64 / 1_000_000_000.0);
    
    Ok(())
}
