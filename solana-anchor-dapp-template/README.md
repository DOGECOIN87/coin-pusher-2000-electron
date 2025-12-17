# Solana PVP Game Template

A production-ready template for building skill-based PVP (Player vs Player) games on Solana with secure escrow functionality.

## 🎮 Features

- **Secure Escrow**: All stakes held in PDA-controlled accounts until match completion
- **5% Platform Fee**: Flat fee collected only on completed matches (not based on wins/losses)
- **Skill-Based**: Platform profit is independent of match outcomes
- **No Tokens/NFTs**: Pure SOL wagering for simplicity
- **Wallet Integration**: Supports all major Solana wallets
- **LavaMoat Security**: Protected against supply chain attacks

## 🏗️ Architecture

```
solana-pvp-game-template/
├── programs/pvp_game/          # Anchor smart contract
│   └── src/
│       ├── lib.rs              # Program entry point
│       ├── instructions/       # Instruction handlers
│       │   ├── initialize_platform.rs
│       │   ├── create_match.rs
│       │   ├── join_match.rs
│       │   ├── submit_result.rs
│       │   ├── claim_winnings.rs
│       │   ├── cancel_match.rs
│       │   └── withdraw_fees.rs
│       └── state/              # Account structures
│           ├── platform_config.rs
│           └── game_match.rs
├── app/                        # Next.js frontend
│   └── src/
│       ├── components/         # React components
│       │   ├── GameLobby.tsx
│       │   ├── MatchCard.tsx
│       │   ├── CreateMatchModal.tsx
│       │   └── MyMatches.tsx
│       ├── hooks/              # usePvpGame hook
│       └── idl/                # Program IDL
├── tests/                      # Integration tests
└── server/                     # Game server (you implement)
```

## 🔑 Smart Contract Overview

### Accounts

**PlatformConfig** - Global platform settings
- Admin address (can withdraw fees, pause platform)
- Game authority (server keypair that submits results)
- Treasury address (receives platform fees)
- Fee percentage (500 = 5%)
- Statistics (total matches, volume, fees collected)

**GameMatch** - Individual match data
- Player 1 & Player 2 addresses
- Stake amount (per player)
- Match status (Waiting, InProgress, Completed, Cancelled, Claimed)
- Winner address
- Prize/fee amounts
- Timestamps

### Instructions

| Instruction | Description | Who Can Call |
|-------------|-------------|--------------|
| `initialize_platform` | Setup platform config | Admin (once) |
| `update_platform` | Change settings, pause | Admin |
| `create_match` | Create match & stake SOL | Any player |
| `join_match` | Join match & stake SOL | Any player (not creator) |
| `submit_result` | Declare winner | Game Authority only |
| `claim_winnings` | Winner claims prize | Winner only |
| `cancel_match` | Cancel & refund | Creator (before opponent joins) |
| `withdraw_fees` | Withdraw collected fees | Admin |

### Match Flow

```
1. Player 1 → create_match (stakes 1 SOL)
   └── Escrow PDA holds Player 1's stake
   └── Match status: WaitingForOpponent

2. Player 2 → join_match (stakes 1 SOL)
   └── Escrow PDA holds both stakes (2 SOL)
   └── Match status: InProgress

3. [OFF-CHAIN] Players compete in your game

4. Game Server → submit_result (declares winner)
   └── Match status: Completed
   └── Fee calculated: 0.1 SOL (5% of 2 SOL)
   └── Prize calculated: 1.9 SOL

5. Winner → claim_winnings
   └── Winner receives: 1.9 SOL
   └── Treasury receives: 0.1 SOL
   └── Match status: Claimed
```

## 📋 Prerequisites

```bash
rustc --version      # 1.85.0+
solana --version     # 2.1.15+
anchor --version     # 0.32.1+
node --version       # 18.0.0+
yarn --version       # 1.22.0+
```

## 🚀 Quick Start

### 1. Setup

```bash
# Install dependencies (with LavaMoat protection)
yarn install

# Configure Solana for devnet
solana config set -ud

# Create wallet if needed
solana-keygen new --no-bip39-passphrase

# Get devnet SOL
solana airdrop 2
```

### 2. Build & Deploy

```bash
# Build program
anchor build

# Sync keys (updates program ID)
anchor keys sync

# Deploy to devnet
anchor deploy

# Copy IDL to frontend
cp target/idl/pvp_game.json app/src/idl/
```

### 3. Initialize Platform

Create a script to initialize the platform:

```typescript
import { Keypair, PublicKey, SystemProgram } from '@solana/web3.js';

// Generate keypairs for game authority and treasury
const gameAuthority = Keypair.generate();
const treasury = Keypair.generate();

// SAVE THESE SECURELY!
console.log('Game Authority:', gameAuthority.publicKey.toBase58());
console.log('Treasury:', treasury.publicKey.toBase58());

// Derive platform config PDA
const [platformConfigPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("platform_config")],
  program.programId
);

// Initialize
await program.methods
  .initializePlatform()
  .accounts({
    platformConfig: platformConfigPDA,
    admin: wallet.publicKey,
    gameAuthority: gameAuthority.publicKey,
    treasury: treasury.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

### 4. Run Frontend

```bash
cd app
yarn install
yarn dev
```

Open http://localhost:3000

### 5. Run Tests

```bash
anchor test
```

## 🎯 Implementing Your Game

### Game Server Architecture

Your game server is responsible for:

1. **Match Discovery** - Watch for `InProgress` matches on-chain
2. **Player Authentication** - Verify wallet signatures
3. **Game Logic** - Run your skill-based game
4. **Result Submission** - Sign and submit winner

### Example Game Server Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Player 1      │     │   Game Server   │     │   Player 2      │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │──create_match────────▶│                       │
         │                       │◀──join_match──────────│
         │                       │                       │
         │      [Match starts - both connected]          │
         │                       │                       │
         │◀──────game_state─────▶│◀──────game_state─────▶│
         │                       │                       │
         │       [Game plays out...]                     │
         │                       │                       │
         │                       │──submit_result────────▶
         │◀────notification──────│───notification───────▶│
         │                       │                       │
         │──claim_winnings──────▶│                       │
         │                       │                       │
```

### Result Submission (Server-Side)

```typescript
import { Keypair, PublicKey } from '@solana/web3.js';
import { Program } from '@coral-xyz/anchor';

// Load your game authority keypair (KEEP THIS SECURE!)
const gameAuthority = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(fs.readFileSync('./game-authority.json')))
);

async function submitMatchResult(
  program: Program,
  matchPDA: PublicKey,
  winnerPubkey: PublicKey
) {
  const [platformConfigPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("platform_config")],
    program.programId
  );

  const tx = await program.methods
    .submitResult(winnerPubkey)
    .accounts({
      platformConfig: platformConfigPDA,
      gameMatch: matchPDA,
      gameAuthority: gameAuthority.publicKey,
    })
    .signers([gameAuthority])
    .rpc();

  console.log('Result submitted:', tx);
  return tx;
}
```

### Security Best Practices

1. **Protect Game Authority Key** - Never expose in client code
2. **Server-Side Validation** - Never trust client-reported results
3. **Rate Limiting** - Prevent spam/DoS attacks
4. **Input Validation** - Sanitize all game inputs
5. **Replay Protection** - Prevent result replay attacks

## 💰 Fee Structure

| Event | Platform Fee |
|-------|--------------|
| Match Created | 0% |
| Match Joined | 0% |
| Match Cancelled | 0% (full refund) |
| Match Completed | **5% of total pot** |

**Example:**
- Player 1 stakes: 1 SOL
- Player 2 stakes: 1 SOL
- Total pot: 2 SOL
- Platform fee: 0.1 SOL (5%)
- **Winner receives: 1.9 SOL**

The platform earns the same 5% regardless of who wins. This ensures:
- Fair gameplay incentives
- No house edge manipulation
- Transparent fee structure

## 🔒 Security: LavaMoat

This template includes LavaMoat to protect against JavaScript supply chain attacks (like the December 2024 @solana/web3.js compromise).

```json
{
  "scripts": {
    "postinstall": "yarn allow-scripts auto"
  },
  "lavamoat": {
    "allowScripts": {
      "@solana/web3.js": false,
      "@coral-xyz/anchor": false
    }
  }
}
```

See [SECURITY.md](./SECURITY.md) for full documentation.

## ⚠️ Legal Considerations

Skill-based gaming with real money may have legal implications. Consider:

- **Gaming Licenses** - Required in many jurisdictions
- **Age Verification** - Restrict to 18+/21+ as required
- **Geographic Restrictions** - Block prohibited regions
- **Terms of Service** - Clear rules, dispute resolution
- **Responsible Gaming** - Stake limits, cooldowns, self-exclusion
- **Tax Compliance** - Users may need to report winnings
- **Anti-Money Laundering** - KYC/AML requirements

**⚖️ This template is for educational purposes. Consult legal counsel before launching a real-money gaming platform.**

## 🧪 Testing

```bash
# Run all tests
anchor test

# Run with logs
anchor test -- --features "debug"

# Skip build (faster iteration)
anchor test --skip-build
```

## 📚 Resources

- [Anchor Documentation](https://www.anchor-lang.com/docs)
- [Solana Escrow Patterns](https://paulx.dev/blog/2021/01/14/programming-on-solana-an-introduction/)
- [LavaMoat Security](https://github.com/LavaMoat/LavaMoat)
- [Solana Wallet Adapter](https://github.com/anza-xyz/wallet-adapter)

## 📄 License

MIT License - Use freely for your projects!

---

**Ready to build? Create your game logic, deploy the smart contract, and let the competition begin! 🎮🏆**
