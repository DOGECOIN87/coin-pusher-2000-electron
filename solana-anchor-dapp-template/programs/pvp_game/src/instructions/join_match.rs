use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::state::{PlatformConfig, GameMatch, MatchStatus, Vault};
use crate::GameError;

#[derive(Accounts)]
pub struct JoinMatch<'info> {
    #[account(
        mut,
        seeds = [PlatformConfig::SEED_PREFIX],
        bump = platform_config.bump,
        constraint = !platform_config.paused @ GameError::PlatformPaused
    )]
    pub platform_config: Account<'info, PlatformConfig>,
    
    #[account(
        mut,
        seeds = [GameMatch::SEED_PREFIX, &game_match.match_id],
        bump = game_match.bump,
        constraint = game_match.status == MatchStatus::WaitingForOpponent @ GameError::InvalidMatchState
    )]
    pub game_match: Account<'info, GameMatch>,
    
    /// Escrow vault holding Player 1's stake
    #[account(
        mut,
        seeds = [GameMatch::ESCROW_SEED_PREFIX, game_match.key().as_ref()],
        bump = game_match.escrow_bump
    )]
    pub escrow: Account<'info, Vault>,
    
    /// Player 2 joining the match
    #[account(mut)]
    pub player2: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<JoinMatch>) -> Result<()> {
    let game_match = &mut ctx.accounts.game_match;
    let clock = Clock::get()?;
    
    // Check if match has expired
    require!(
        !game_match.is_expired(clock.unix_timestamp),
        GameError::MatchExpired
    );
    
    // Check player2 is not player1
    require!(
        ctx.accounts.player2.key() != game_match.player1,
        GameError::CannotJoinOwnMatch
    );
    
    let stake_amount = game_match.stake_amount;
    
    // Update match state
    game_match.join(ctx.accounts.player2.key(), clock.unix_timestamp)?;
    
    // Transfer stake from player2 to escrow
    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.player2.to_account_info(),
                to: ctx.accounts.escrow.to_account_info(),
            },
        ),
        stake_amount,
    )?;
    
    // Update platform stats
    let platform_config = &mut ctx.accounts.platform_config;
    platform_config.total_volume = platform_config.total_volume.saturating_add(stake_amount);
    
    msg!("Player 2 joined the match!");
    msg!("Match ID: {:?}", game_match.match_id);
    msg!("Player 1: {}", game_match.player1);
    msg!("Player 2: {}", game_match.player2);
    msg!("Total pot: {} lamports ({} SOL)", game_match.total_pot(), game_match.total_pot() as f64 / 1_000_000_000.0);
    
    Ok(())
}
