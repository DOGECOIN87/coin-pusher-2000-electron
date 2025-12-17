#!/bin/bash

# Deploy script for Solana Anchor dApp
# Usage: ./deploy.sh [network]
# Networks: localnet, devnet, testnet, mainnet

set -euo pipefail

NETWORK="${1:-devnet}"

echo "🚀 Deploying to $NETWORK..."

# Set the Solana CLI to the correct network
case $NETWORK in
  "localnet")
    solana config set -ul
    ;;
  "devnet")
    solana config set -ud
    ;;
  "testnet")
    solana config set -ut
    ;;
  "mainnet")
    solana config set -um
    echo "⚠️  WARNING: You are deploying to mainnet!"
    read -p "Are you sure you want to continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      exit 1
    fi
    ;;
  *)
    echo "Unknown network: $NETWORK"
    echo "Usage: ./deploy.sh [localnet|devnet|testnet|mainnet]"
    exit 1
    ;;
esac

# Check wallet balance
BALANCE=$(solana balance | cut -d' ' -f1)
echo "💰 Wallet balance: $BALANCE SOL"

if (( $(echo "$BALANCE < 0.5" | bc -l) )); then
  echo "⚠️  Low balance! You may need more SOL to deploy."
  if [ "$NETWORK" == "devnet" ]; then
    echo "Requesting airdrop..."
    solana airdrop 2
  fi
fi

# Sync keys
echo "🔑 Syncing program keys..."
anchor keys sync

# Build the program
echo "🔨 Building program..."
anchor build

# Deploy
echo "📤 Deploying program..."
anchor deploy --provider.cluster "$NETWORK"

# Get program ID
PROGRAM_ID=$(solana address -k target/deploy/pvp_game-keypair.json)
echo ""
echo "✅ Deployment successful!"
echo "📋 Program ID: $PROGRAM_ID"
echo ""
echo "🔗 View on Solana Explorer:"
EXPLORER_CLUSTER="$NETWORK"
if [ "$NETWORK" == "mainnet" ]; then
  EXPLORER_CLUSTER="mainnet-beta"
fi
if [ "$NETWORK" == "localnet" ]; then
  echo "(localnet does not have an Explorer cluster; use 'solana logs' and local validator logs)"
else
  echo "https://explorer.solana.com/address/$PROGRAM_ID?cluster=$EXPLORER_CLUSTER"
fi
echo ""

# Copy IDL + types to app
if [ -d "app/src/idl" ]; then
  echo "📋 Copying IDL + types to frontend..."
  cp target/idl/pvp_game.json app/src/idl/pvp_game.json
  cp target/types/pvp_game.ts app/src/idl/pvp_game.ts
  echo "Done!"
fi
