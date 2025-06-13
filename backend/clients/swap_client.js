import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

import {
    Connection,
    PublicKey,
    Keypair,
    Transaction,
    TransactionInstruction,
    SystemProgram,
    sendAndConfirmTransaction,
    LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
    TOKEN_PROGRAM_ID,
    getOrCreateAssociatedTokenAccount,
    createSyncNativeInstruction,
    getMint,
    NATIVE_MINT,
    getAssociatedTokenAddress
} from '@solana/spl-token';
import BN from 'bn.js';
import { MongoClient } from 'mongodb';
import User from '../src/models/userModel.js';
import mongoose from 'mongoose';

// MongoDB setup
const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = 'youtube_tokens';
const COLLECTION_NAME = 'tokens';

const PROGRAM_ID = new PublicKey('9pKDtt6qeSmkbYu4Jhh65Gg5EsmcrBwdJFL1fbzFZtVJ');
const RPC_URL = process.env.SOLANA_RPC_URL;
const connection = new Connection(RPC_URL, 'confirmed');
const DEFAULT_WALLET_PUBKEY = new PublicKey('4Vd2tqPNX4tQjsQXTz4cAqdrwrSLFhrwjHsKfjo2cvQX');

async function fetchTokenAndPoolData(channelName) {
    const client = new MongoClient(MONGO_URI);
    try {
        const db = client.db(DB_NAME);
        const collection = db.collection(COLLECTION_NAME);

        const token = await collection.findOne(
            { channel_name: channelName },
            { sort: { _id: -1 } }
        );

        if (!token) {
            throw new Error(`No token found in the database for ${channelName}`);
        }

        if (!token.liquidity_pool) {
            throw new Error(`No liquidity pool data found for this token: ${channelName}`);
        }

        return {
            token_title: token.token_title,
            token_symbol: token.token_symbol,
            price: token.price,
            url: token.thumbnail_url,
            payer_public: token.payer_public,
            payer_secret: token.payer_secret,
            mint_address: token.mint_address,
            pool_supply: Number(token.pool_supply),
            pool_sol: Number(token.pool_sol),
            liquidity_pool: {
                pool_account: new PublicKey(token.liquidity_pool.pool_account),
                pool_token_account: new PublicKey(token.liquidity_pool.pool_token_account),
                pool_sol_account: new PublicKey(token.liquidity_pool.pool_sol_account),
            }
        };
    } finally {
        await client.close();
    }
}

class AMMSwapClient {
    constructor(defaultWalletKeypair, userWalletKeypair, userWalletPubkey, currentUserEmail) {
        if (defaultWalletKeypair.publicKey.toBase58() !== DEFAULT_WALLET_PUBKEY.toBase58()) {
            throw new Error(`Default wallet public key mismatch: expected ${DEFAULT_WALLET_PUBKEY.toBase58()}, got ${defaultWalletKeypair.publicKey.toBase58()}`);
        }
        if (userWalletKeypair.publicKey.toBase58() !== userWalletPubkey.toBase58()) {
            throw new Error(`User wallet public key mismatch: expected ${userWalletPubkey.toBase58()}, got ${userWalletKeypair.publicKey.toBase58()}`);
        }
        this.defaultWallet = defaultWalletKeypair;
        this.userWallet = userWalletKeypair;
        this.userWalletPubkey = userWalletPubkey;
        this.connection = connection;
        this.currentUserEmail = currentUserEmail;
    }

    async ensureSufficientBalance(requiredSol = 1) {
        const currentBalance = await this.connection.getBalance(this.userWallet.publicKey);
        const requiredLamports = requiredSol * LAMPORTS_PER_SOL;

        if (currentBalance < requiredLamports) {
            const neededSol = requiredSol - currentBalance / LAMPORTS_PER_SOL;
            const neededLamports = Math.ceil(neededSol * LAMPORTS_PER_SOL);  // Round up to avoid floating-point errors
            console.log(`Requesting airdrop of ${neededSol} SOL (${neededLamports} lamports) to ${this.userWallet.publicKey.toBase58()}`);
            try {
                const airdropSignature = await this.connection.requestAirdrop(
                    this.userWallet.publicKey,
                    neededLamports
                );
                await this.connection.confirmTransaction(airdropSignature);
                console.log(`Airdrop successful: ${neededSol} SOL received`);
            } catch (error) {
                console.error('Airdrop failed:', error);
                throw new Error(`Failed to airdrop ${neededSol} SOL`);
            }
        }
    }

    async swapSolForTokens(poolData, solAmount) {

        const user = await User.findOne({ email: this.currentUserEmail });

        if (!user) {
            throw new Error(`User not found with email: ${this.currentUserEmail}`);
        }

        const tokenMint = new PublicKey(poolData.mint_address);
        const wsolMint = NATIVE_MINT;

        await this.ensureSufficientBalance(solAmount + 100);

        console.log("Ensuring WSOL account...");
        // Create WSOL account for the user
        const userWsolAccount = await getOrCreateAssociatedTokenAccount(
            this.connection,
            this.userWallet,
            NATIVE_MINT,
            this.userWallet.publicKey,
            false
        );
        console.log(`User WSOL account: ${userWsolAccount.address.toBase58()}`);

        console.log("Ensuring user's token account...");
        // Get or create user's token account for the custom token
        const userTokenAccount = await getOrCreateAssociatedTokenAccount(
            this.connection,
            this.userWallet,
            tokenMint,
            this.userWallet.publicKey,
            false
        );
        console.log(`User token account: ${userTokenAccount.address.toBase58()}`);

        // Check current SOL balance
        const solBalance = await this.connection.getBalance(this.userWallet.publicKey);
        console.log(`Current user SOL balance: ${solBalance / LAMPORTS_PER_SOL} SOL`);

        if (solBalance < solAmount * LAMPORTS_PER_SOL) {
            throw new Error(`Insufficient SOL balance: ${solBalance / LAMPORTS_PER_SOL}, required: ${solAmount}`);
        }

        const solAmountInLamports = Math.floor(solAmount * LAMPORTS_PER_SOL);
        console.log(`Swapping ${solAmount} SOL for tokens...`);
        console.log(`SOL amount in lamports: ${solAmountInLamports}`);

        // Create transaction
        const transaction = new Transaction();

        // Transfer SOL to WSOL account
        transaction.add(
            SystemProgram.transfer({
                fromPubkey: this.userWallet.publicKey,
                toPubkey: userWsolAccount.address,
                lamports: solAmountInLamports,
            })
        );

        // Sync native (convert SOL to WSOL)
        transaction.add(
            createSyncNativeInstruction(userWsolAccount.address)
        );

        // Validate pool PDA
        let poolAccount = poolData.liquidity_pool.pool_account;
        try {
            // Try common AMM seed patterns
            const [expectedPoolPda] = await PublicKey.findProgramAddress(
                [Buffer.from("amm"), tokenMint.toBuffer(), wsolMint.toBuffer()],
                PROGRAM_ID
            );
            console.log(`Expected pool PDA: ${expectedPoolPda.toBase58()}`);
            if (expectedPoolPda.toBase58() !== poolData.liquidity_pool.pool_account.toBase58()) {
                console.warn(`Warning: Pool PDA mismatch. Expected: ${expectedPoolPda.toBase58()}, Got: ${poolData.liquidity_pool.pool_account.toBase58()}`);
                console.warn("Using provided pool_account for testing. Update the database with the correct PDA for production.");
                // Optionally update the database
                // await updatePoolAccount("PewDiePie", expectedPoolPda.toBase58());
                // poolAccount = expectedPoolPda;
            } else {
                poolAccount = expectedPoolPda;
            }
        } catch (error) {
            console.error("Failed to derive pool PDA:", error);
            console.warn("Proceeding with provided pool_account. Verify the correct seeds and PROGRAM_ID.");
        }

        // Validate pool token accounts
        const expectedPoolTokenAccount = await getAssociatedTokenAddress(
            tokenMint,
            poolAccount,
            true // Allow owner off-curve for PDAs
        );
        const expectedPoolSolAccount = await getAssociatedTokenAddress(
            NATIVE_MINT,
            poolAccount,
            true
        );
        console.log(`Expected pool token account: ${expectedPoolTokenAccount.toBase58()}`);
        console.log(`Expected pool SOL account: ${expectedPoolSolAccount.toBase58()}`);
        if (expectedPoolTokenAccount.toBase58() !== poolData.liquidity_pool.pool_token_account.toBase58()) {
            console.warn(`Warning: Pool token account mismatch. Expected: ${expectedPoolTokenAccount.toBase58()}, Got: ${poolData.liquidity_pool.pool_token_account.toBase58()}`);
        }
        if (expectedPoolSolAccount.toBase58() !== poolData.liquidity_pool.pool_sol_account.toBase58()) {
            console.warn(`Warning: Pool SOL account mismatch. Expected: ${expectedPoolSolAccount.toBase58()}, Got: ${poolData.liquidity_pool.pool_sol_account.toBase58()}`);
        }

        // Create swap instruction data
        const swapData = Buffer.alloc(1 + 16);
        swapData.writeUInt8(3, 0); // Instruction index for SOL->YT_TOKEN swap
        new BN(solAmountInLamports.toString()).toArrayLike(Buffer, 'le', 16).copy(swapData, 1);

        // Swap instruction with all required accounts
        const swapInstruction = new TransactionInstruction({
            programId: PROGRAM_ID,
            keys: [
                { pubkey: this.userWallet.publicKey, isSigner: true, isWritable: false }, // user_account
                { pubkey: poolAccount, isSigner: false, isWritable: true }, // pool_account (writable per program)
                { pubkey: poolData.liquidity_pool.pool_token_account, isSigner: false, isWritable: true }, // token_a_account (pool's YT_TOKEN)
                { pubkey: poolData.liquidity_pool.pool_sol_account, isSigner: false, isWritable: true }, // token_b_account (pool's WSOL)
                { pubkey: this.userWallet.publicKey, isSigner: true, isWritable: false }, // user_token_a_authority
                { pubkey: this.userWallet.publicKey, isSigner: true, isWritable: false }, // user_token_b_authority
                { pubkey: userTokenAccount.address, isSigner: false, isWritable: true }, // user_token_a_account (user's YT_TOKEN - receiving)
                { pubkey: userWsolAccount.address, isSigner: false, isWritable: true }, // user_token_b_account (user's WSOL - spending)
                { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // token_program
                { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }

            ],
            data: swapData,
        });

        transaction.add(swapInstruction);

        console.log("Simulating swap transaction...");
        const simulation = await this.connection.simulateTransaction(transaction, [this.userWallet]);
        console.log("Simulation result:", JSON.stringify(simulation.value, null, 2));
        if (simulation.value.err) {
            throw new Error(`Simulation failed: ${JSON.stringify(simulation.value.err)}`);
        }

        console.log("Executing swap transaction...");
        const txSignature = await sendAndConfirmTransaction(
            this.connection,
            transaction,
            [this.userWallet]
        );

        console.log(`Swap successful! Transaction signature: ${txSignature}`);

        // Get final balances
        const finalTokenBalance = await this.connection.getTokenAccountBalance(userTokenAccount.address);
        const finalSolBalance = await this.connection.getBalance(this.userWallet.publicKey);

        console.log(`Final token balance: ${finalTokenBalance.value.uiAmount}`);
        console.log(`Final SOL balance: ${finalSolBalance / LAMPORTS_PER_SOL} SOL`);

        const tokenType = poolData.token_symbol; // e.g., MRBEAST
        const tokenTitle = poolData.token_title;
        const tokenUrl = poolData.url;
        const tokenPrice = poolData.price;
        const tokenAddress = userTokenAccount.address.toBase58();
        const tokenBalance = finalTokenBalance.value.uiAmount;
        const tokenSecret = userTokenAccount.secretKey ? Array.from(userTokenAccount.secretKey) : [];

        const walletIndex = user.wallets.findIndex(w => w.type === tokenType);

        if (walletIndex >= 0) {
            // Update existing
            user.wallets[walletIndex].balance = tokenBalance;
            user.wallets[walletIndex].address = tokenAddress;
            if (tokenSecret.length) {
                user.wallets[walletIndex].secretKey = tokenSecret;
            }
        } else {
            // Insert new
            user.wallets.push({
                type: tokenType,
                address: tokenAddress,
                balance: tokenBalance,
                secretKey: tokenSecret,
                title: tokenTitle,
                price: tokenPrice,
                url: tokenUrl,
            });
        }

        await user.save();

        const swapResult = {
            txSignature,
            swapType: 'SOL_TO_TOKEN',
            amountIn: solAmount,
            amountOut: finalTokenBalance.value.uiAmount,
            userWallet: this.userWallet.publicKey.toBase58()
        };

        return swapResult;
    }

    async swapTokensForSol(poolData, tokenAmount) {
        const tokenMint = new PublicKey(poolData.mint_address);
        const wsolMint = NATIVE_MINT;

        await this.ensureSufficientBalance(100); // Small buffer for transaction fees

        console.log("Ensuring user's token account...");
        // Get user's token account
        const userTokenAccount = await getOrCreateAssociatedTokenAccount(
            this.connection,
            this.userWallet,
            tokenMint,
            this.userWallet.publicKey,
            false
        );
        console.log(`User token account: ${userTokenAccount.address.toBase58()}`);

        console.log("Ensuring WSOL account...");
        // Get or create user's WSOL account
        const userWsolAccount = await getOrCreateAssociatedTokenAccount(
            this.connection,
            this.userWallet,
            NATIVE_MINT,
            this.userWallet.publicKey,
            false
        );
        console.log(`User WSOL account: ${userWsolAccount.address.toBase58()}`);

        // Check token balance
        const tokenBalance = await this.connection.getTokenAccountBalance(userTokenAccount.address);
        console.log(`Current token balance: ${tokenBalance.value.uiAmount}`);
        console.log(`Current token balance (raw): ${tokenBalance.value.amount}`);

        if (tokenBalance.value.uiAmount < tokenAmount) {
            throw new Error(`Insufficient token balance: ${tokenBalance.value.uiAmount}, required: ${tokenAmount}`);
        }

        // Fetch token decimals
        const mintInfo = await getMint(this.connection, tokenMint);
        const tokenDecimals = mintInfo.decimals;
        console.log(`Token decimals: ${tokenDecimals}`);

        const tokenAmountAdjusted = Math.floor(tokenAmount * Math.pow(10, tokenDecimals));
        console.log(`Swapping ${tokenAmount} tokens for SOL...`);
        console.log(`Token amount (adjusted): ${tokenAmountAdjusted}`);
        console.log(`Available balance (raw): ${tokenBalance.value.amount}`);

        // Additional safety check
        if (parseInt(tokenBalance.value.amount) < tokenAmountAdjusted) {
            throw new Error(`Insufficient token balance (raw): ${tokenBalance.value.amount}, required: ${tokenAmountAdjusted}`);
        }

        // Create transaction
        const transaction = new Transaction();

        // Validate pool PDA
        let poolAccount = poolData.liquidity_pool.pool_account;
        try {
            // Try common AMM seed patterns
            const [expectedPoolPda] = await PublicKey.findProgramAddress(
                [Buffer.from("amm"), tokenMint.toBuffer(), wsolMint.toBuffer()],
                PROGRAM_ID
            );
            console.log(`Expected pool PDA: ${expectedPoolPda.toBase58()}`);
            if (expectedPoolPda.toBase58() !== poolData.liquidity_pool.pool_account.toBase58()) {
                console.warn(`Warning: Pool PDA mismatch. Expected: ${expectedPoolPda.toBase58()}, Got: ${poolData.liquidity_pool.pool_account.toBase58()}`);
                console.warn("Using provided pool_account for testing. Update the database with the correct PDA for production.");
                // Optionally update the database
                // await updatePoolAccount("PewDiePie", expectedPoolPda.toBase58());
                // poolAccount = expectedPoolPda;
            } else {
                poolAccount = expectedPoolPda;
            }
        } catch (error) {
            console.error("Failed to derive pool PDA:", error);
            console.warn("Proceeding with provided pool_account. Verify the correct seeds and PROGRAM_ID.");
        }

        // Validate pool token accounts
        const expectedPoolTokenAccount = await getAssociatedTokenAddress(
            tokenMint,
            poolAccount,
            true // Allow owner off-curve for PDAs
        );
        const expectedPoolSolAccount = await getAssociatedTokenAddress(
            NATIVE_MINT,
            poolAccount,
            true
        );
        console.log(`Expected pool token account: ${expectedPoolTokenAccount.toBase58()}`);
        console.log(`Expected pool SOL account: ${expectedPoolSolAccount.toBase58()}`);
        if (expectedPoolTokenAccount.toBase58() !== poolData.liquidity_pool.pool_token_account.toBase58()) {
            console.warn(`Warning: Pool token account mismatch. Expected: ${expectedPoolTokenAccount.toBase58()}, Got: ${poolData.liquidity_pool.pool_token_account.toBase58()}`);
        }
        if (expectedPoolSolAccount.toBase58() !== poolData.liquidity_pool.pool_sol_account.toBase58()) {
            console.warn(`Warning: Pool SOL account mismatch. Expected: ${expectedPoolSolAccount.toBase58()}, Got: ${poolData.liquidity_pool.pool_sol_account.toBase58()}`);
        }

        // Create swap instruction data
        const swapData = Buffer.alloc(1 + 16);
        swapData.writeUInt8(2, 0); // Instruction index for Token->SOL swap
        new BN(tokenAmountAdjusted.toString()).toArrayLike(Buffer, 'le', 16).copy(swapData, 1);

        // Swap instruction with all required accounts
        const swapInstruction = new TransactionInstruction({
            programId: PROGRAM_ID,
            keys: [
                { pubkey: this.userWallet.publicKey, isSigner: true, isWritable: false }, // user_account
                { pubkey: poolAccount, isSigner: false, isWritable: true }, // pool_account (writable per program)
                { pubkey: poolData.liquidity_pool.pool_token_account, isSigner: false, isWritable: true }, // token_a_account (pool's YT_TOKEN)
                { pubkey: poolData.liquidity_pool.pool_sol_account, isSigner: false, isWritable: true }, // token_b_account (pool's WSOL)
                { pubkey: this.userWallet.publicKey, isSigner: true, isWritable: false }, // user_token_a_authority
                { pubkey: this.userWallet.publicKey, isSigner: true, isWritable: false }, // user_token_b_authority
                { pubkey: userTokenAccount.address, isSigner: false, isWritable: true }, // user_token_a_account (user's YT_TOKEN - spending)
                { pubkey: userWsolAccount.address, isSigner: false, isWritable: true }, // user_token_b_account (user's WSOL - receiving)
                { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // token_program
                { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
            ],
            data: swapData,
        });

        transaction.add(swapInstruction);

        console.log("Simulating swap transaction...");
        const simulation = await this.connection.simulateTransaction(transaction, [this.userWallet]);
        console.log("Simulation result:", JSON.stringify(simulation.value, null, 2));
        if (simulation.value.err) {
            throw new Error(`Simulation failed: ${JSON.stringify(simulation.value.err)}`);
        }

        console.log("Executing swap transaction...");
        const txSignature = await sendAndConfirmTransaction(
            this.connection,
            transaction,
            [this.userWallet]
        );

        console.log(`Swap successful! Transaction signature: ${txSignature}`);

        // Get final balances
        const finalTokenBalance = await this.connection.getTokenAccountBalance(userTokenAccount.address);
        const finalWsolBalance = await this.connection.getTokenAccountBalance(userWsolAccount.address);

        console.log(`Final token balance: ${finalTokenBalance.value.uiAmount}`);
        console.log(`Final WSOL balance: ${finalWsolBalance.value.uiAmount}`);

        const swapResult = {
            txSignature,
            swapType: 'TOKEN_TO_SOL',
            amountIn: tokenAmount,
            amountOut: finalWsolBalance.value.uiAmount,
            userWallet: this.userWallet.publicKey.toBase58()
        };

        return swapResult;
    }
}

function loadDefaultWallet() {
    const secretKey = Uint8Array.from(JSON.parse(process.env.DEFAULT_WALLET_SECRET));
    return Keypair.fromSecretKey(secretKey);
}

function loadUserWallet(payerSecret) {
    const secretKeyArray = payerSecret.split(',').map(num => parseInt(num.trim(), 10));
    const secretKey = Uint8Array.from(secretKeyArray);
    return Keypair.fromSecretKey(secretKey);
}

// Export for use in other modules
export { AMMSwapClient, fetchTokenAndPoolData, loadDefaultWallet, loadUserWallet };