import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js';

import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
} from '@solana/spl-token';

import * as borsh from 'borsh';
import { YouTubeChannelAnalyzer } from '../clients/fetch_metrics.js';
import { config } from 'dotenv';

config({path : "D:/HypeEconomy/backend/.env"});

const PROGRAM_ID = new PublicKey('4q4M66k1J3STCQvVok5CiAocjFqnhiUJTj3uDFqkZ3Nh');
const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

class YouTubeTokenFactory {
  constructor(connection, payer) {
    this.connection = connection;
    this.payer = payer;
    this.analyzer = new YouTubeChannelAnalyzer(process.env.GOOGLE_API_KEY);
    console.log(process.env.GOOGLE_API_KEY);
  }

  async fetchChannelMetrics(channelHandle) {
    try {
      const cleanHandle = channelHandle.startsWith('@') ? channelHandle.slice(1) : channelHandle;
      const metrics = await this.analyzer.getChannelMetrics(cleanHandle);

      if (!metrics) {
        throw new Error('Could not retrieve channel metrics');
      }

      // Validate required fields
      const requiredFields = [
        'channelName',
        'channelHandle',
        'subscribers',
        'totalViews',
        'totalVideos',
        'avgRecentViews',
        'avgRecentLikes',
        'thumbnailUrl'
      ];

      for (const field of requiredFields) {
        if (!(field in metrics)) {
          throw new Error(`Missing required field in metrics: ${field}`);
        }
      }

      console.log(metrics);
      return metrics;
    } catch (error) {
      console.error('Error fetching channel metrics:', error);
      throw error;
    }
  }


  /**
   * Create a new YouTube channel token, create ATA, and mint supply
   */
  async createChannelToken(channelHandle) {
    try {
      // Fetch channel metrics dynamically
      const channelMetrics = await this.fetchChannelMetrics(channelHandle);
      console.log(`Creating token for ${channelMetrics.channelName}...`);

      // Generate new mint keypair
      const mintKeypair = Keypair.generate();
      console.log(`New mint public key: ${mintKeypair.publicKey.toString()}`);

      // Derive metadata PDA
      const [metadataPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('metadata'),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          mintKeypair.publicKey.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
      );

      // Derive Associated Token Account (ATA)
      const ata = getAssociatedTokenAddressSync(
        mintKeypair.publicKey,
        this.payer.publicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      // Calculate token supply using Python algorithm
      const tokenSupply = this.calculateTokenSupply(channelMetrics);

      // Prepare instruction data
      const tokenArgs = {
        token_title: `${channelMetrics.channelName} Token`,
        token_symbol: this.generateTokenSymbol(channelMetrics.channelName),
        token_uri: await this.uploadMetadata(channelMetrics),
        token_decimals: 9,
      };

      // Fixed Borsh schema to match your smart contract's CreateTokenArgs
      const tokenArgsSchema = {
        struct: {
          token_title: 'string',
          token_symbol: 'string',
          token_uri: 'string',
          token_decimals: 'u8',
        }
      };

      // Serialize instruction data WITHOUT discriminator
      const instructionData = borsh.serialize(tokenArgsSchema, tokenArgs);

      // Create ATA instruction
      const createAtaIx = createAssociatedTokenAccountInstruction(
        this.payer.publicKey, // payer
        ata, // ATA
        this.payer.publicKey, // owner
        mintKeypair.publicKey, // mint
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      // Create custom token instruction
      const createTokenIx = {
        keys: [
          { pubkey: mintKeypair.publicKey, isSigner: true, isWritable: true }, // mint_account
          { pubkey: this.payer.publicKey, isSigner: true, isWritable: false }, // mint_authority
          { pubkey: metadataPDA, isSigner: false, isWritable: true }, // metadata_account
          { pubkey: this.payer.publicKey, isSigner: true, isWritable: true }, // payer
          { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false }, // rent
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system_program
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // token_program
          { pubkey: TOKEN_METADATA_PROGRAM_ID, isSigner: false, isWritable: false }, // token_metadata_program
        ],
        programId: PROGRAM_ID,
        data: instructionData,
      };

      // Mint tokens to ATA
      const mintToIx = createMintToInstruction(
        mintKeypair.publicKey, // mint
        ata, // destination ATA
        this.payer.publicKey, // mint authority
        tokenSupply * Math.pow(10, tokenArgs.token_decimals), // amount (adjusted for decimals)
        [], // no multi-signers
        TOKEN_PROGRAM_ID
      );

      // Create and send transaction - Split into two transactions
      // First transaction: Create the token (mint account) via your smart contract
      const createTokenTransaction = new Transaction().add(createTokenIx);
      createTokenTransaction.feePayer = this.payer.publicKey;
      createTokenTransaction.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
      createTokenTransaction.sign(this.payer, mintKeypair);

      // Simulate first transaction
      const tokenSimulation = await this.connection.simulateTransaction(createTokenTransaction);
      if (tokenSimulation.value.err) {
        console.error('Token creation simulation failed:', tokenSimulation.value.logs);
        throw new Error('Token creation simulation failed');
      }

      // Send first transaction
      const tokenSignature = await this.connection.sendRawTransaction(createTokenTransaction.serialize());
      await this.connection.confirmTransaction(tokenSignature, 'confirmed');

      console.log(`Token mint created via smart contract with signature: ${tokenSignature}`);

      // Wait a moment to ensure the mint account is fully created
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Second transaction: Create ATA and mint tokens to it
      const mintTransaction = new Transaction()
        .add(createAtaIx)
        .add(mintToIx);

      mintTransaction.feePayer = this.payer.publicKey;
      mintTransaction.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
      mintTransaction.sign(this.payer);

      // Simulate second transaction
      const mintSimulation = await this.connection.simulateTransaction(mintTransaction);
      if (mintSimulation.value.err) {
        console.error('ATA creation and minting simulation failed:', mintSimulation.value.logs);
        throw new Error('ATA and mint transaction simulation failed');
      }

      // Send second transaction
      const mintSignature = await this.connection.sendRawTransaction(mintTransaction.serialize());

      // Confirm second transaction
      await this.connection.confirmTransaction(mintSignature, 'confirmed');

      console.log(`\n🎉 Complete token creation process finished!`);
      console.log(`📝 Smart contract execution signature: ${tokenSignature}`);
      console.log(`💰 ATA creation and minting signature: ${mintSignature}`);
      console.log(`🏭 Mint address: ${mintKeypair.publicKey.toString()}`);
      console.log(`📦 ATA address: ${ata.toString()}`);
      console.log(`🏷️  Token symbol: ${tokenArgs.token_symbol}`);
      console.log(`📊 Initial supply: ${tokenSupply.toLocaleString()} tokens`);

      return {
        mint: mintKeypair.publicKey.toString(),
        metadata: metadataPDA.toString(),
        ata: ata.toString(),
        signature: tokenSignature,
        mintSignature: mintSignature,
        tokenArgs,
        channelMetrics,
      };
    } catch (error) {
      if (error.name === 'SendTransactionError') {
        const logs = await error.getLogs(this.connection);
        console.error('Transaction logs:', logs);
      }
      console.error('Error creating token:', error);
      throw error;
    }
  }

  /**
   * Generate token symbol from channel name
   */
  generateTokenSymbol(channelName) {
    const cleanName = channelName.replace(/[^a-zA-Z0-9]/g, '');
    return cleanName.length >= 4 ? cleanName.substring(0, 4).toUpperCase() : cleanName.substring(0, 3).toUpperCase();
  }

  /**
   * Upload metadata to IPFS or return mock URI
   */
  async uploadMetadata(channelMetrics) {
    const metadata = {
      name: `${channelMetrics.channelName} Token`,
      symbol: this.generateTokenSymbol(channelMetrics.channelName),
      description: `Social token representing ${channelMetrics.channelName} YouTube channel`,
      image: channelMetrics.thumbnailUrl,
      external_url: `https://youtube.com/${channelMetrics.channelHandle}`,
      attributes: [
        { trait_type: 'Subscribers', value: channelMetrics.subscribers },
        { trait_type: 'Total Views', value: channelMetrics.totalViews },
        { trait_type: 'Recent Avg Views', value: channelMetrics.avgRecentViews },
        { trait_type: 'Recent Avg Likes', value: channelMetrics.avgRecentLikes },
      ],
    };

    const dataUri = 'https://example.com/mock-metadata.json';
    return dataUri;
  }

  /**
   * Calculate initial token price using Python algorithm - raw values instead of logarithmic
   */
  calculateInitialPrice(channelMetrics) {
    console.log(channelMetrics);
    const subscriberWeight = 0.5;
    const viewWeight = 0.3;
    const engagementWeight = 0.2;

    // Normalize subscriber count (log scale for better distribution)
    const subScore = Math.log10(Math.max(channelMetrics.subscribers, 1)) / 7; // Max at 10M subs = ~1

    // Normalize view score
    const viewScore = Math.log10(Math.max(channelMetrics.avgRecentViews, 1)) / 6; // Max at 1M views = ~1

    // Calculate engagement rate
    const engagementRate = channelMetrics.avgRecentViews > 0
      ? channelMetrics.avgRecentLikes / channelMetrics.avgRecentViews
      : 0;
    const engagementScore = Math.min(engagementRate * 10, 1); // Cap at 1

    // Calculate composite score (0-1 range)
    const compositeScore = (
      subscriberWeight * subScore +
      viewWeight * viewScore +
      engagementWeight * engagementScore
    );

    // Price range: 0.0001 SOL to 1 SOL
    // At ₹14k/SOL: ₹1.4 to ₹14,000 per token
    const minPrice = 0.0001; // ₹1.4
    const maxPrice = 1.0;    // ₹14,000

    const price = minPrice + (compositeScore * (maxPrice - minPrice));
    console.log("TOKEN PRICE, ", price);
    return Math.round(price * 1000000) / 1000000; // 6 decimal places
  }

  /**
   * Calculate token supply with better scaling
   */
  calculateTokenSupply(channelMetrics) {
    // Base supply scales with log of subscribers for better distribution
    const logSubs = Math.log10(Math.max(channelMetrics.subscribers, 1000));
    const baseSupply = Math.floor(50000 * Math.pow(logSubs, 1.5));

    // Engagement modifier (smaller impact)
    const engagementRate = channelMetrics.avgRecentViews > 0
      ? channelMetrics.avgRecentLikes / channelMetrics.avgRecentViews
      : 0;
    const engagementModifier = 1 + Math.min(engagementRate * 2, 0.3);

    const totalSupply = Math.floor(baseSupply * engagementModifier);

    // Reasonable supply bounds
    const minSupply = 100000;   // 100K tokens
    const maxSupply = 5000000;  // 5M tokens

    return Math.max(Math.min(totalSupply, maxSupply), minSupply);
  }

  /**
   * Calculate SOL for liquidity with 200K SOL maximum
   */
  calculateInitialSol(channelMetrics) {
    const tokenSupply = this.calculateTokenSupply(channelMetrics);
    const tokenPrice = this.calculateInitialPrice(channelMetrics);

    let solAmount = tokenSupply * tokenPrice;

    return Math.round(solAmount * 1000000) / 1000000;
  }
}

export default YouTubeTokenFactory;
