import mongoose from 'mongoose';
import { Connection, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import dotenv from 'dotenv';
import { fetchTokenData, storePoolData, loadDefaultWallet, loadTokenSourceWallet, AMMClient } from '../clients/amm_client.js'; // adjust path as needed

dotenv.config({ path: './backend/.env' });

// ========== 🔑 MongoDB Setup ==========
const MONGO_URI = "mongodb://localhost:27017/youtube_tokens"; // adjust DB URI

// ========== 🔑 Solana Setup ==========
const connection = new Connection("http://127.0.0.1:8899", 'confirmed'); // local validator

// ========== 📝 Main Function ==========
async function main() {
    try {
        // 1️⃣ Connect to MongoDB
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // 2️⃣ Hardcoded channel name
        const channelName = 'PewDiePie'; // adjust to match token saved in DB

        // 3️⃣ Fetch token data from DB
        const tokenData = await fetchTokenData(channelName);
        console.log('🎯 Fetched token data:', tokenData);

        // 4️⃣ Load default wallet
        const defaultWallet = loadDefaultWallet();
        console.log('🗝️  Default Wallet:', defaultWallet.publicKey.toBase58());

        // 5️⃣ Load token source wallet
        const secretKey = Uint8Array.from(Buffer.from(tokenData.payer_secret, 'base64'));
        const tokenSourceWallet = Keypair.fromSecretKey(secretKey);
        console.log('🔑 Token Source Wallet:', tokenSourceWallet.publicKey.toBase58());

        console.log('🔑 Token Source Wallet:', tokenSourceWallet.publicKey.toBase58());

        // 6️⃣ Airdrop to default wallet if needed
        const defaultWalletBalance = await connection.getBalance(defaultWallet.publicKey);
        if (defaultWalletBalance < 2 * LAMPORTS_PER_SOL) {
            console.log(`💸 Airdropping 2 SOL to Default Wallet...`);
            const airdropSignature = await connection.requestAirdrop(defaultWallet.publicKey, 2 * LAMPORTS_PER_SOL);
            await connection.confirmTransaction(airdropSignature, 'confirmed');
        }
        console.log(`💰 Default Wallet Balance: ${defaultWalletBalance / LAMPORTS_PER_SOL} SOL`);

        // 7️⃣ Instantiate AMMClient
        const ammClient = new AMMClient(
            defaultWallet,
            tokenSourceWallet,
            tokenSourceWallet.publicKey,
            tokenData.pool_sol
        );

        // 8️⃣ Create liquidity pool
        console.log(`🚀 Creating liquidity pool for ${channelName}...`);
        const poolData = await ammClient.createPool(
            tokenData.mint_address,
            tokenData.pool_supply,
            tokenData.pool_sol
        );

        // 9️⃣ Store pool data back in DB
        await storePoolData(channelName, poolData);

        console.log('✅ Liquidity pool creation complete!');
    } catch (error) {
        console.error('❌ Error in AMM creation test:', error);
    } finally {
        await mongoose.disconnect();
    }
}

// ========== 🚀 Run Main ==========
main();
