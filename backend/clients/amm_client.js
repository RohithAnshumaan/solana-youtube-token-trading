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
} from '@solana/spl-token';
import BN from 'bn.js';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });


// MongoDB setup
const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = 'youtube_tokens';
const COLLECTION_NAME = 'tokens';

const PROGRAM_ID = new PublicKey('H9esR6wDUq9CrivQbz2iX2SLicYUZxXNQ7CDMZoCsvde');
const RPC_URL = 'http://127.0.0.1:8899';
const connection = new Connection(RPC_URL, 'confirmed');
const DEFAULT_WALLET_PUBKEY = new PublicKey('4Vd2tqPNX4tQjsQXTz4cAqdrwrSLFhrwjHsKfjo2cvQX');

async function fetchTokenData(channelName) {
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    const token = await collection.findOne(
      { channel_name: channelName },
      { sort: { _id: -1 } }
    );

    if (!token) {
      throw new Error(`No token found in the database for ${channelName}`);
    }

    if (isNaN(token.pool_supply) || isNaN(token.pool_sol)) {
      throw new Error('Invalid pool_supply or pool_sol in database');
    }

    return {
      payer_public: token.payer_public,
      payer_secret: token.payer_secret,
      mint_address: token.mint_address,
      pool_supply: Number(token.pool_supply),
      pool_sol: Number(token.pool_sol),
    };
  } finally {
    await client.close();
  }
}


async function storePoolData(channelName, poolData) {
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    const result = await collection.updateOne(
      { channel_name: channelName },
      {
        $set: {
          liquidity_pool: {
            pool_account: poolData.poolAccount.toBase58(),
            pool_token_account: poolData.poolTokenAccount.toBase58(),
            pool_sol_account: poolData.poolSolAccount.toBase58(),
            created_at: new Date()
          }
        }
      },
      { upsert: true }
    );

    console.log(`Stored liquidity pool data for ${channelName}:`, result);
  } catch (error) {
    console.error('Failed to store liquidity pool data:', error);
    throw error;
  } finally {
    await client.close();
  }
}

class AMMClient {
  constructor(defaultWalletKeypair, tokenSourceWalletKeypair, tokenSourceWalletPubkey, required_sol) {
    if (defaultWalletKeypair.publicKey.toBase58() !== DEFAULT_WALLET_PUBKEY.toBase58()) {
      throw new Error(`Default wallet public key mismatch: expected ${DEFAULT_WALLET_PUBKEY.toBase58()}, got ${defaultWalletKeypair.publicKey.toBase58()}`);
    }
    if (tokenSourceWalletKeypair.publicKey.toBase58() !== tokenSourceWalletPubkey.toBase58()) {
      throw new Error(`Token source wallet public key mismatch: expected ${tokenSourceWalletPubkey.toBase58()}, got ${tokenSourceWalletKeypair.publicKey.toBase58()}`);
    }
    this.defaultWallet = defaultWalletKeypair;
    this.tokenSourceWallet = tokenSourceWalletKeypair;
    this.tokenSourceWalletPubkey = tokenSourceWalletPubkey;
    this.required_sol = required_sol;
    this.connection = connection;
  }

  isValidPublicKey(pubkey) {
    try {
      new PublicKey(pubkey);
      return true;
    } catch (error) {
      console.error(`Invalid public key: ${pubkey.toString()}`, error);
      return false;
    }
  }

  async ensureSufficientBalance(requiredSol = this.required_sol) {
    const currentBalance = await this.connection.getBalance(this.defaultWallet.publicKey);
    const requiredLamports = requiredSol * LAMPORTS_PER_SOL;

    if (currentBalance < requiredLamports) {
      const neededSol = requiredSol - currentBalance / LAMPORTS_PER_SOL;
      console.log(`Requesting airdrop of ${neededSol} SOL to ${this.defaultWallet.publicKey.toBase58()}`);
      try {
        const airdropSignature = await this.connection.requestAirdrop(
          this.defaultWallet.publicKey,
          neededSol * LAMPORTS_PER_SOL
        );
        await this.connection.confirmTransaction(airdropSignature);
        console.log(`Airdrop successful: ${neededSol} SOL received`);
      } catch (error) {
        console.error('Airdrop failed:', error);
        throw new Error(`Failed to airdrop ${neededSol} SOL`);
      }
    }
  }

  async createPool(tokenMint, tokenSupply, solAmount) {
    if (tokenSupply <= 0 || solAmount <= 0) {
      throw new Error("Token supply and SOL amount must be positive");
    }

    // Fetch token decimals
    const mintInfo = await getMint(this.connection, new PublicKey(tokenMint));
    const decimals = mintInfo.decimals;
    console.log(`Token decimals: ${decimals}`);

    // Adjust tokenSupply based on decimals
    const adjustedTokenSupply = Math.floor(tokenSupply * Math.pow(10, decimals));
    console.log(`Adjusted token supply: ${adjustedTokenSupply}`);

    await this.ensureSufficientBalance(solAmount + 2);

    const solBalance = await this.connection.getBalance(this.defaultWallet.publicKey);
    console.log(`Default wallet SOL balance: ${solBalance / LAMPORTS_PER_SOL} SOL`);

    const WSOL_MINT = new PublicKey('So11111111111111111111111111111111111111112');

    const [poolPDA, bump] = await PublicKey.findProgramAddress(
      [Buffer.from("amm"), new PublicKey(tokenMint).toBuffer(), WSOL_MINT.toBuffer()],
      PROGRAM_ID
    );

    console.log(`Pool PDA: ${poolPDA.toBase58()}, Bump: ${bump}`);

    console.log("Token mint = ", tokenMint);

    const poolTokenAccount = await getOrCreateAssociatedTokenAccount(
      this.connection,
      this.defaultWallet,
      new PublicKey(tokenMint),
      poolPDA,
      true
    );
    console.log(`Pool YT_TOKEN account: ${poolTokenAccount.address.toBase58()}`);

    const poolSolAccount = await getOrCreateAssociatedTokenAccount(
      this.connection,
      this.defaultWallet,
      WSOL_MINT,
      poolPDA,
      true
    );
    console.log(`Pool WSOL account: ${poolSolAccount.address.toBase58()}`);

    const userSolAccount = await getOrCreateAssociatedTokenAccount(
      this.connection,
      this.defaultWallet,
      WSOL_MINT,
      this.defaultWallet.publicKey,
      false
    );
    console.log(`User WSOL account: ${userSolAccount.address.toBase58()}`);

    const userSolAccountInfo = await this.connection.getAccountInfo(userSolAccount.address);
    if (!userSolAccountInfo) {
      throw new Error(`User WSOL account ${userSolAccount.address.toBase58()} does not exist`);
    }
    console.log(`User WSOL account owner: ${userSolAccountInfo.owner.toBase58()}`);
    if (userSolAccountInfo.owner.toBase58() !== TOKEN_PROGRAM_ID.toBase58()) {
      throw new Error(`User WSOL account is not owned by SPL Token program`);
    }

    let wsolBalance = await this.connection.getTokenAccountBalance(userSolAccount.address);
    console.log(`Initial user WSOL balance: ${wsolBalance.value.uiAmount} WSOL`);

    // Check WSOL balance and wrap only the needed amount
    const solAmountInLamports = Math.floor(solAmount * LAMPORTS_PER_SOL);
    const neededWSOL = solAmount - (wsolBalance.value.uiAmount || 0);
    if (neededWSOL > 0) {
      console.log(`Wrapping ${neededWSOL} SOL into WSOL...`);
      const wrapSolTx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: this.defaultWallet.publicKey,
          toPubkey: userSolAccount.address,
          lamports: Math.floor(neededWSOL * LAMPORTS_PER_SOL),
        }),
        createSyncNativeInstruction(userSolAccount.address)
      );

      try {
        const wrapTxSignature = await sendAndConfirmTransaction(this.connection, wrapSolTx, [this.defaultWallet]);
        console.log(`Successfully wrapped ${neededWSOL} SOL into WSOL. Transaction signature: ${wrapTxSignature}`);
      } catch (error) {
        console.error("Failed to wrap SOL:", error);
        throw error;
      }
    } else {
      console.log(`Sufficient WSOL balance already present: ${wsolBalance.value.uiAmount} WSOL`);
    }

    wsolBalance = await this.connection.getTokenAccountBalance(userSolAccount.address);
    console.log(`User WSOL balance after wrap: ${wsolBalance.value.uiAmount} WSOL`);
    if (wsolBalance.value.uiAmount < solAmount) {
      throw new Error(`Insufficient WSOL balance: ${wsolBalance.value.uiAmount}, required: ${solAmount}`);
    }

    const initData = Buffer.alloc(1 + 32 + 32);
    initData.writeUInt8(0, 0);
    new PublicKey(tokenMint).toBuffer().copy(initData, 1);
    WSOL_MINT.toBuffer().copy(initData, 33);

    const sourceTokenAccount = await getOrCreateAssociatedTokenAccount(
      this.connection,
      this.tokenSourceWallet,
      new PublicKey(tokenMint),
      this.tokenSourceWallet.publicKey,
      false
    );
    console.log(`User YT_TOKEN account: ${sourceTokenAccount.address.toBase58()}`);

    console.log("TOKEN_PROGRAM_ID on client:", TOKEN_PROGRAM_ID.toBase58());

    const initInstruction = new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: this.defaultWallet.publicKey, isSigner: true, isWritable: true }, // user_account
        { pubkey: poolPDA, isSigner: false, isWritable: true }, // pool_account
        { pubkey: poolTokenAccount.address, isSigner: false, isWritable: true }, // token_a_account
        { pubkey: poolSolAccount.address, isSigner: false, isWritable: true }, // token_b_account
        { pubkey: this.defaultWallet.publicKey, isSigner: true, isWritable: false }, // user_token_a_authority
        { pubkey: this.defaultWallet.publicKey, isSigner: true, isWritable: false }, // user_token_b_authority
        { pubkey: sourceTokenAccount.address, isSigner: false, isWritable: true }, // user_token_a_account
        { pubkey: userSolAccount.address, isSigner: false, isWritable: true }, // user_token_b_account
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // token_program
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
      ],

      data: initData,
    });

    // Simulate the transaction before sending it
    const first_simulation = await connection.simulateTransaction(
      new Transaction().add(initInstruction),
      [this.defaultWallet]
    );
    console.log("Simulation logs:", first_simulation.value.logs);


    console.log("Sending pool initialization transaction...");
    await sendAndConfirmTransaction(
      this.connection,
      new Transaction().add(initInstruction),
      [this.defaultWallet]
    );

    const tokenBalance = await this.connection.getTokenAccountBalance(sourceTokenAccount.address);
    console.log(`User YT_TOKEN balance: ${tokenBalance.value.uiAmount}`);
    if (tokenBalance.value.uiAmount < tokenSupply) {
      throw new Error(`Insufficient YT_TOKEN balance: ${tokenBalance.value.uiAmount}, required: ${tokenSupply}`);
    }

    // Log values for debugging
    console.log(`Creating liquidityData with adjustedTokenSupply: ${adjustedTokenSupply}, solAmountInLamports: ${solAmountInLamports}`);

    // Use 16 bytes for u128 as expected by the program
    const liquidityData = Buffer.alloc(1 + 16 + 16);
    liquidityData.writeUInt8(1, 0);
    try {
      new BN(adjustedTokenSupply.toString()).toArrayLike(Buffer, 'le', 16).copy(liquidityData, 1);
      new BN(solAmountInLamports.toString()).toArrayLike(Buffer, 'le', 16).copy(liquidityData, 17);
    } catch (error) {
      console.error(`Failed to encode liquidityData: adjustedTokenSupply=${adjustedTokenSupply}, solAmountInLamports=${solAmountInLamports}`);
      throw error;
    }

    const liquidityInstruction = new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: this.defaultWallet.publicKey, isSigner: true, isWritable: false },
        { pubkey: poolPDA, isSigner: false, isWritable: true },
        { pubkey: poolTokenAccount.address, isSigner: false, isWritable: true },
        { pubkey: poolSolAccount.address, isSigner: false, isWritable: true },
        { pubkey: this.tokenSourceWallet.publicKey, isSigner: true, isWritable: false },
        { pubkey: this.defaultWallet.publicKey, isSigner: true, isWritable: false },
        { pubkey: sourceTokenAccount.address, isSigner: false, isWritable: true },
        { pubkey: userSolAccount.address, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
      ],
      data: liquidityData,
    });

    console.log("Simulating liquidity addition transaction...");
    const simulation = await this.connection.simulateTransaction(
      new Transaction().add(liquidityInstruction),
      [this.defaultWallet, this.tokenSourceWallet]
    );
    console.log("Simulation logs:", simulation.value.logs);
    if (simulation.value.err) {
      throw new Error(`Simulation failed: ${JSON.stringify(simulation.value.err)}`);
    }

    console.log("Sending liquidity addition transaction...");
    try {
      const txSignature = await sendAndConfirmTransaction(
        this.connection,
        new Transaction().add(liquidityInstruction),
        [this.defaultWallet, this.tokenSourceWallet]
      );
      console.log(`Liquidity added successfully. Transaction signature: ${txSignature}`);
    } catch (error) {
      console.error("Failed to add liquidity:", error);
      throw error;
    }

    const poolData = {
      poolAccount: poolPDA,
      poolTokenAccount: poolTokenAccount.address,
      poolSolAccount: poolSolAccount.address,
    };

    return poolData;
  }
}

function loadDefaultWallet() {
  const secretKey = Uint8Array.from(JSON.parse(process.env.DEFAULT_WALLET_SECRET));
  return Keypair.fromSecretKey(secretKey);
}

function loadTokenSourceWallet(payerSecret) {
  const secretKeyArray = payerSecret.split(',').map(num => parseInt(num.trim(), 10));
  const secretKey = Uint8Array.from(secretKeyArray);
  return Keypair.fromSecretKey(secretKey);
}

export {
  AMMClient,
  fetchTokenData,
  storePoolData,
  loadDefaultWallet,
  loadTokenSourceWallet
};
