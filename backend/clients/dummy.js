import mongoose from 'mongoose';
import { Connection, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import YouTubeTokenFactory from '../clients/create_token.js'; // adjust path if needed
import Token from '../src/models/token.js'; // adjust path if needed

// ========== 🔑 MongoDB Setup ==========
const MONGO_URI = "mongodb://localhost:27017/youtube_tokens"; // change to your DB URI

// ========== 🔑 Solana Setup ==========
const connection = new Connection("http://127.0.0.1:8899", 'confirmed'); // or 'mainnet-beta' as needed

// ========== 📝 Main Function ==========
async function main() {
  try {
    // 1️⃣ Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // 2️⃣ Load or generate Solana payer wallet
    // Here, let's assume you want to use a saved keypair or generate a new one
    // For demonstration, let's generate a fresh keypair and print it (save for reuse)
    const payer = Keypair.generate();
    console.log('🗝️  Payer Public Key:', payer.publicKey.toBase58());
      
    // 3️⃣ Airdrop SOL to the payer
    const airdropSignature = await connection.requestAirdrop(payer.publicKey, 2 * LAMPORTS_PER_SOL);
    await connection.confirmTransaction(airdropSignature, 'confirmed');
    const balance = await connection.getBalance(payer.publicKey);
    console.log(`💰 Airdropped 2 SOL. New balance: ${balance / LAMPORTS_PER_SOL} SOL`);

    // 3️⃣ (Optional) Save payer keypair to disk for reuse
    // fs.writeFileSync('payer.json', JSON.stringify([...payer.secretKey]));

    // 4️⃣ Create YouTubeTokenFactory instance
    const factory = new YouTubeTokenFactory(connection, payer);

    // 5️⃣ Hardcoded channel handle
    const channelHandle = '@MoreSidemen'; // replace with actual handle

    // 6️⃣ Create token
    const result = await factory.createChannelToken(channelHandle);
    console.log("result: ", result);

    // 7️⃣ Calculate price and liquidity
    const price = factory.calculateInitialPrice(result.channelMetrics);
    const poolSupply = factory.calculateTokenSupply(result.channelMetrics);
    const poolSol = factory.calculateInitialSol(result.channelMetrics);
    const marketCap = price * poolSupply;

    // 8️⃣ Save to MongoDB
    const newToken = new Token({
      channel_name: result.channelMetrics.channel_name,
      channel_handle: result.channelMetrics.channel_handle,
      thumbnail_url: result.channelMetrics.thumbnail_url,
      token_symbol: result.tokenArgs.token_symbol,
      token_title: result.tokenArgs.token_title,
      token_uri: result.tokenArgs.token_uri,
      mint_address: result.mint,
      metadata_address: result.metadata,
      payer_public: payer.publicKey.toBase58(),
      payer_secret: Buffer.from(payer.secretKey).toString('base64'), // safe storage recommended!
      associated_token_address: result.ata,
      signature: result.signature,
      price: price,
      pool_supply: poolSupply,
      pool_sol: poolSol,
      market_cap: marketCap,
      price_history: [{ price: price }]
    });

    await newToken.save();
    console.log('🎉 Token data saved to MongoDB');

    // 9️⃣ Done
    console.log('✅ Token creation complete!');
  } catch (error) {
    console.error('❌ Error in main function:', error);
  } finally {
    mongoose.disconnect();
  }
}

// ========== 🚀 Run Main ==========
main();
