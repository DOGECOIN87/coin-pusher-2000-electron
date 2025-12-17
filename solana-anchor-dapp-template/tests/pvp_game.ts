import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PvpGame } from "../target/types/pvp_game";
import { PublicKey, SystemProgram, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { expect } from "chai";
import crypto from "crypto";

describe("pvp_game", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.PvpGame as Program<PvpGame>;
  
  // Keypairs for testing
  const admin = provider.wallet;
  const gameAuthority = Keypair.generate();
  const player1 = Keypair.generate();
  const player2 = Keypair.generate();

  // PDAs
  let platformConfigPDA: PublicKey;
  let treasuryPDA: PublicKey;
  let matchPDA: PublicKey;
  let escrowPDA: PublicKey;

  // Test data
  const matchId = crypto.randomBytes(32);
  const stakeAmount = new anchor.BN(Math.floor(LAMPORTS_PER_SOL / 10)); // 0.1 SOL
  const vaultAccountSize = 8; // discriminator only (Vault has no fields)
  let vaultRent: number;

  before(async () => {
    // Derive platform config PDA
    [platformConfigPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("platform_config")],
      program.programId
    );

    // Derive treasury PDA
    [treasuryPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("treasury")],
      program.programId
    );

    vaultRent = await provider.connection.getMinimumBalanceForRentExemption(vaultAccountSize);

    // Airdrop SOL to test accounts
    const airdropAmount = 2 * LAMPORTS_PER_SOL;
    
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(gameAuthority.publicKey, airdropAmount)
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(player1.publicKey, airdropAmount)
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(player2.publicKey, airdropAmount)
    );

    console.log("Test accounts funded");
    console.log("Admin:", admin.publicKey.toBase58());
    console.log("Game Authority:", gameAuthority.publicKey.toBase58());
    console.log("Player 1:", player1.publicKey.toBase58());
    console.log("Player 2:", player2.publicKey.toBase58());
  });

  it("Initializes the platform", async () => {
    const tx = await program.methods
      .initializePlatform()
      .accountsStrict({
        platformConfig: platformConfigPDA,
        admin: admin.publicKey,
        gameAuthority: gameAuthority.publicKey,
        treasury: treasuryPDA,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Initialize platform tx:", tx);

    const platformConfig = await program.account.platformConfig.fetch(platformConfigPDA);
    
    expect(platformConfig.admin.toBase58()).to.equal(admin.publicKey.toBase58());
    expect(platformConfig.gameAuthority.toBase58()).to.equal(gameAuthority.publicKey.toBase58());
    expect(platformConfig.treasury.toBase58()).to.equal(treasuryPDA.toBase58());
    expect(platformConfig.feeBps).to.equal(500); // 5%
    expect(platformConfig.paused).to.equal(false);
    
    console.log("Platform initialized with 5% fee");
  });

  it("Creates a match", async () => {
    // Derive match PDA
    [matchPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("match"), matchId],
      program.programId
    );

    // Derive escrow PDA
    [escrowPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), matchPDA.toBuffer()],
      program.programId
    );

    const tx = await program.methods
      .createMatch(stakeAmount, Array.from(matchId))
      .accountsStrict({
        platformConfig: platformConfigPDA,
        gameMatch: matchPDA,
        escrow: escrowPDA,
        player1: player1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([player1])
      .rpc();

    console.log("Create match tx:", tx);

    const gameMatch = await program.account.gameMatch.fetch(matchPDA);
    
    expect(gameMatch.player1.toBase58()).to.equal(player1.publicKey.toBase58());
    expect(gameMatch.stakeAmount.toNumber()).to.equal(stakeAmount.toNumber());
    expect(gameMatch.status).to.deep.equal({ waitingForOpponent: {} });

    const escrowBalance = await provider.connection.getBalance(escrowPDA);
    expect(escrowBalance).to.equal(vaultRent + stakeAmount.toNumber());

    console.log("Match created, escrow funded with", escrowBalance / LAMPORTS_PER_SOL, "SOL");
  });

  it("Player 2 joins the match", async () => {
    const tx = await program.methods
      .joinMatch()
      .accountsStrict({
        platformConfig: platformConfigPDA,
        gameMatch: matchPDA,
        escrow: escrowPDA,
        player2: player2.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([player2])
      .rpc();

    console.log("Join match tx:", tx);

    const gameMatch = await program.account.gameMatch.fetch(matchPDA);
    
    expect(gameMatch.player2.toBase58()).to.equal(player2.publicKey.toBase58());
    expect(gameMatch.status).to.deep.equal({ inProgress: {} });

    const escrowBalance = await provider.connection.getBalance(escrowPDA);
    expect(escrowBalance).to.equal(vaultRent + stakeAmount.toNumber() * 2);

    console.log("Match started, total pot:", escrowBalance / LAMPORTS_PER_SOL, "SOL");
  });

  it("Game authority submits result (Player 1 wins)", async () => {
    const tx = await program.methods
      .submitResult(player1.publicKey)
      .accountsStrict({
        platformConfig: platformConfigPDA,
        gameMatch: matchPDA,
        gameAuthority: gameAuthority.publicKey,
      })
      .signers([gameAuthority])
      .rpc();

    console.log("Submit result tx:", tx);

    const gameMatch = await program.account.gameMatch.fetch(matchPDA);
    
    expect(gameMatch.winner.toBase58()).to.equal(player1.publicKey.toBase58());
    expect(gameMatch.status).to.deep.equal({ completed: {} });
    
    const totalPot = stakeAmount.toNumber() * 2;
    const expectedFee = Math.floor(totalPot * 500 / 10000); // 5%
    const expectedPrize = totalPot - expectedFee;

    expect(gameMatch.feeAmount.toNumber()).to.equal(expectedFee);
    expect(gameMatch.prizeAmount.toNumber()).to.equal(expectedPrize);

    console.log("Winner:", player1.publicKey.toBase58());
    console.log("Prize:", expectedPrize / LAMPORTS_PER_SOL, "SOL");
    console.log("Platform fee:", expectedFee / LAMPORTS_PER_SOL, "SOL");
  });

  it("Winner claims winnings", async () => {
    const gameMatchBefore = await program.account.gameMatch.fetch(matchPDA);
    const expectedPrize = gameMatchBefore.prizeAmount.toNumber();
    const expectedFee = gameMatchBefore.feeAmount.toNumber();

    const player1BalanceBefore = await provider.connection.getBalance(player1.publicKey);
    const treasuryBalanceBefore = await provider.connection.getBalance(treasuryPDA);

    const tx = await program.methods
      .claimWinnings()
      .accountsStrict({
        platformConfig: platformConfigPDA,
        gameMatch: matchPDA,
        escrow: escrowPDA,
        treasury: treasuryPDA,
        winner: player1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([player1])
      .rpc();

    console.log("Claim winnings tx:", tx);

    const gameMatch = await program.account.gameMatch.fetch(matchPDA);
    expect(gameMatch.status).to.deep.equal({ claimed: {} });

    const player1BalanceAfter = await provider.connection.getBalance(player1.publicKey);
    const treasuryBalanceAfter = await provider.connection.getBalance(treasuryPDA);

    const prizeReceived = player1BalanceAfter - player1BalanceBefore;
    const feeReceived = treasuryBalanceAfter - treasuryBalanceBefore;

    expect(feeReceived).to.equal(expectedFee);
    expect(prizeReceived).to.be.greaterThan(expectedPrize);

    console.log("Winner received:", prizeReceived / LAMPORTS_PER_SOL, "SOL");
    console.log("Treasury received:", feeReceived / LAMPORTS_PER_SOL, "SOL");

    // Verify escrow was closed
    const escrowAccountInfo = await provider.connection.getAccountInfo(escrowPDA);
    expect(escrowAccountInfo).to.equal(null);
  });

  it("Can create and cancel a match", async () => {
    const newMatchId = crypto.randomBytes(32);
    
    const [newMatchPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("match"), newMatchId],
      program.programId
    );

    const [newEscrowPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), newMatchPDA.toBuffer()],
      program.programId
    );

    // Create match
    await program.methods
      .createMatch(stakeAmount, Array.from(newMatchId))
      .accountsStrict({
        platformConfig: platformConfigPDA,
        gameMatch: newMatchPDA,
        escrow: newEscrowPDA,
        player1: player1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([player1])
      .rpc();

    console.log("New match created for cancellation test");

    const player1BalanceBefore = await provider.connection.getBalance(player1.publicKey);

    // Cancel match
    const tx = await program.methods
      .cancelMatch()
      .accountsStrict({
        gameMatch: newMatchPDA,
        escrow: newEscrowPDA,
        player1: player1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([player1])
      .rpc();

    console.log("Cancel match tx:", tx);

    const gameMatch = await program.account.gameMatch.fetch(newMatchPDA);
    expect(gameMatch.status).to.deep.equal({ cancelled: {} });

    const player1BalanceAfter = await provider.connection.getBalance(player1.publicKey);
    console.log("Refund received (minus fees):", (player1BalanceAfter - player1BalanceBefore) / LAMPORTS_PER_SOL, "SOL");

    const escrowAccountInfo = await provider.connection.getAccountInfo(newEscrowPDA);
    expect(escrowAccountInfo).to.equal(null);
  });

  it("Fails when non-winner tries to claim", async () => {
    // Create a new match for this test
    const testMatchId = crypto.randomBytes(32);
    
    const [testMatchPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("match"), testMatchId],
      program.programId
    );

    const [testEscrowPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), testMatchPDA.toBuffer()],
      program.programId
    );

    // Create and join match
    await program.methods
      .createMatch(stakeAmount, Array.from(testMatchId))
      .accountsStrict({
        platformConfig: platformConfigPDA,
        gameMatch: testMatchPDA,
        escrow: testEscrowPDA,
        player1: player1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([player1])
      .rpc();

    await program.methods
      .joinMatch()
      .accountsStrict({
        platformConfig: platformConfigPDA,
        gameMatch: testMatchPDA,
        escrow: testEscrowPDA,
        player2: player2.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([player2])
      .rpc();

    // Submit result - Player 1 wins
    await program.methods
      .submitResult(player1.publicKey)
      .accountsStrict({
        platformConfig: platformConfigPDA,
        gameMatch: testMatchPDA,
        gameAuthority: gameAuthority.publicKey,
      })
      .signers([gameAuthority])
      .rpc();

    // Player 2 (loser) tries to claim - should fail
    try {
      await program.methods
        .claimWinnings()
        .accountsStrict({
          platformConfig: platformConfigPDA,
          gameMatch: testMatchPDA,
          escrow: testEscrowPDA,
          treasury: treasuryPDA,
          winner: player2.publicKey,  // Loser trying to claim
          systemProgram: SystemProgram.programId,
        })
        .signers([player2])
        .rpc();

      expect.fail("Expected transaction to fail");
    } catch (error) {
      expect(error.toString()).to.include("NotWinner");
      console.log("Correctly rejected non-winner claim attempt");
    }
  });
});
