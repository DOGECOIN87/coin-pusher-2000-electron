Warning: This is a work in progress!

This repository contains the code required to run [Coin Pusher 2000](https://github.com/gildas-lormeau/coin-pusher-2000) in Electron. This project mainly contains the Rapier.rs binding needed to run the game.

# Build

- Install Git if not already installed, cf. https://git-scm.com/
- Intall Node.js if not already installed, cf. https://nodejs.org/en/download
- Install Rust if not already installed, cf. https://www.rust-lang.org/tools/install
- Install Python (required for native module compilation):
  - **macOS**: `brew install python3` or download from https://www.python.org/
  - **Windows**: Download from https://www.python.org/ or `winget install Python.Python.3`
  - **Linux**: `sudo apt install python3 python3-dev` (Ubuntu/Debian) or equivalent
- Install build tools:
  - **macOS**: `xcode-select --install` (Command Line Tools)
  - **Windows**: Install Visual Studio Build Tools or Visual Studio Community
  - **Linux**: `sudo apt install build-essential` (Ubuntu/Debian) or equivalent

- Run the following commands to clone the project, install its dependencies, and build it
```sh
git clone --recursive https://github.com/gildas-lormeau/coin-pusher-2000-electron.git
npm install
npm run build
```
# Run

Launch the following command to run the game. 
```sh
npm start
```

If you encounter Linux sandbox errors (or have `ELECTRON_RUN_AS_NODE=1` set in your environment), run:
```sh
cd coin-pusher-2000-electron && env -u ELECTRON_RUN_AS_NODE npm start -- --no-sandbox
```

# Solana dApp (Web)

This repo also includes a Solana Anchor program + Next.js web dApp under `solana-anchor-dapp-template/` that uses on-chain escrow matches and embeds Coin Pusher gameplay.

## 1) Build the Coin Pusher web bundle

The dApp serves the game from `game/build` (via a symlink in `solana-anchor-dapp-template/app/public/coin-pusher`), so build it first:
```sh
cd game
npm install
npm run build
```

## 2) Build + deploy the Anchor program (devnet)

```sh
cd solana-anchor-dapp-template
solana config set -ud
solana airdrop 2
anchor keys sync
anchor build
anchor deploy --provider.cluster devnet
cp target/idl/pvp_game.json app/src/idl/pvp_game.json
cp target/types/pvp_game.ts app/src/idl/pvp_game.ts
```

Optional (localnet) program tests:
```sh
cd solana-anchor-dapp-template
yarn install --ignore-scripts
anchor test
```

## 3) Run the web dApp

```sh
cd app
yarn install --ignore-scripts
yarn dev
```

Open http://localhost:3000, connect a devnet wallet, then:
- Click **Initialize Platform** once (sets game authority to your connected wallet for local/dev use).
- Create or join a match.
- When the match is **In Progress**, use **Play Coin Pusher** to launch the game.

# Package

Launch the following command to run the game. 
```sh
npm run package
```

# Troubleshooting

If you encounter build errors:
- Make sure Rust is properly installed: `rustc --version`
- Ensure Python is available: `python3 --version`
- On macOS, make sure Xcode Command Line Tools are installed
- On Windows, ensure Visual Studio Build Tools are installed
- Try clearing node modules: `rm -rf node_modules package-lock.json && npm install`
