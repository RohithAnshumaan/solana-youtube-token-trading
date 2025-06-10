import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import axios from 'axios';
import User from '../models/userModel.js';
import Token from '../models/token.js';
import connectDB from '../../utils/db.js';
import YouTubeTokenFactory from '../../clients/create_token.js';
import dotenv from 'dotenv';
import { loadDefaultWallet, loadTokenSourceWallet, AMMClient } from '../../clients/amm_client.js'
import { AMMSwapClient, fetchTokenAndPoolData, loadUserWallet } from '../../clients/swap_client.js';

dotenv.config({ path: './backend/.env' });

const RPC_URL = 'http://localhost:8899';

async function storeSwapData(swapData, userEmail, tokenSymbol) {
    try {
        await User.updateOne(
            { email: userEmail },
            {
                $push: {
                    swapHistory: {
                        transaction_signature: swapData.txSignature,
                        swap_type: swapData.swapType,
                        amount_in: swapData.amountIn,
                        amount_out: swapData.amountOut,
                        token: tokenSymbol,
                        timestamp: new Date()
                    }
                }
            },
            { upsert: true }
        );
        console.log(`Stored swap data for ${userEmail}`);
    } catch (error) {
        console.error('Failed to store swap data:', error);
        throw error;
    }
}

export const createTokenController = async (req, res) => {
    const { googleId } = req.params;

    try {
        await connectDB();

        const user = await User.findOne({ googleId });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const accessToken = user.accessToken;
        if (!accessToken) {
            return res.status(400).json({ error: 'No access token found for this user' });
        }

        // Fetch user's YouTube channel info
        const response = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            params: {
                part: 'snippet,statistics',
                mine: true,
            },
        });

        const channelData = response.data.items[0];
        if (!channelData) {
            return res.status(404).json({ error: 'No YouTube channel found for this account' });
        }

        // Extract relevant data
        const channelHandle = `@${channelData.snippet.customUrl || channelData.snippet.title.replace(/\s+/g, '')}`;
        const channelName = channelData.snippet.title;

        console.log(`Fetched YouTube channel: ${channelName} (${channelHandle})`);

        // Setup Solana connection and a new payer wallet
        const connection = new Connection(RPC_URL, 'confirmed');
        const payer = Keypair.generate();

        // Airdrop some SOL to the payer (only on localnet or testnet!)
        const signature = await connection.requestAirdrop(payer.publicKey, 2 * LAMPORTS_PER_SOL);
        await connection.confirmTransaction(signature);

        // Create token using YouTubeTokenFactory
        const factory = new YouTubeTokenFactory(connection, payer);
        const result = await factory.createChannelToken(channelHandle);

        // Calculate token economics
        const price = factory.calculateInitialPrice(result.channelMetrics);
        const supply = factory.calculateTokenSupply(result.channelMetrics);
        const initialSol = factory.calculateInitialSol(result.channelMetrics);
        const marketCap = price * supply;

        // Save to Tokens collection
        await Token.create({
            channel_name: result.channelMetrics.channel_name,
            channel_handle: result.channelMetrics.channel_handle,
            thumbnail_url: result.channelMetrics.thumbnail_url,
            token_symbol: result.tokenArgs.token_symbol,
            token_title: result.tokenArgs.token_title,
            token_uri: result.tokenArgs.token_uri,
            mint_address: result.mint,
            metadata_address: result.metadata,
            payer_public: payer.publicKey.toString(),
            payer_secret: payer.secretKey.toString(),
            associated_token_address: result.ata,
            signature: result.signature,
            price: price,
            pool_supply: supply,
            pool_sol: initialSol,
            market_cap: marketCap,
        });

        // Save token reference to user's createdTokens array
        await User.updateOne(
            { googleId },
            {
                $push: {
                    createdTokens: {
                        mint_address: result.mint,
                        token_symbol: result.tokenArgs.token_symbol,
                        token_title: result.tokenArgs.token_title,
                        token_uri: result.tokenArgs.token_uri,
                        initial_price: price,
                        pool_supply: supply,
                        pool_sol: initialSol,
                        market_cap: marketCap,
                        created_at: new Date(),
                    },
                },
            }
        );

        console.log(`Token created and saved successfully!`);

        // Respond with token details
        return res.status(201).json({
            message: 'Token created successfully',
            mint_address: result.mint,
            token_symbol: result.tokenArgs.token_symbol,
            token_title: result.tokenArgs.token_title,
            initial_price: price,
            pool_supply: supply,
            pool_sol: initialSol,
            market_cap: marketCap,
        });
    } catch (error) {
        console.error('Error creating token:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const createAMMController = async (req, res) => {
    const { googleId } = req.params;

    try {
        // Step 1: Fetch user
        const user = await User.findOne({ googleId });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Step 2: Fetch the latest created token by the user
        if (!user.createdTokens || user.createdTokens.length === 0) {
            return res.status(400).json({ error: 'No tokens created by this user' });
        }

        const latestToken = user.createdTokens[user.createdTokens.length - 1];
        const channelName = latestToken.token_title.replace(' Token', ''); // reverse from naming convention
        console.log(`Creating AMM for channel: ${channelName}`);

        // Step 3: Fetch token data from the Token collection
        const tokenData = await fetchTokenData(channelName);
        if (!tokenData) {
            return res.status(404).json({ error: `Token data not found for channel ${channelName}` });
        }

        // Step 4: Load wallets and AMMClient
        const defaultWallet = loadDefaultWallet();
        const tokenSourceWallet = loadTokenSourceWallet(tokenData.payer_secret);
        const tokenSourceWalletPubkey = new PublicKey(tokenData.payer_public);

        const ammClient = new AMMClient(
            defaultWallet,
            tokenSourceWallet,
            tokenSourceWalletPubkey,
            tokenData.pool_sol
        );

        // Step 5: Create liquidity pool
        const poolData = await ammClient.createPool(
            tokenData.mint_address,
            tokenData.pool_supply,
            tokenData.pool_sol
        );

        await storePoolData(channelName, poolData);

        console.log(`Liquidity pool created successfully for ${channelName}`);
        res.status(201).json({
            message: `AMM created successfully for channel ${channelName}`,
            liquidity_pool: poolData
        });
    } catch (error) {
        console.error('Error creating AMM:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const buyTokenController = async (req, res) => {
    const { googleId } = req.user; // Assuming authentication middleware sets req.user
    const { solAmount } = req.body;

    if (!solAmount || solAmount <= 0) {
        return res.status(400).json({ error: 'Invalid SOL amount provided' });
    }

    try {
        // Fetch user from DB
        const user = await User.findOne({ googleId });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!user.solWalletSecretKey) {
            return res.status(400).json({ error: 'User does not have a linked SOL wallet' });
        }

        // Load wallets
        const defaultWallet = loadDefaultWallet();
        const userWallet = loadUserWallet(user.solWalletSecretKey);
        const userWalletPubkey = user.solWalletPublicKey;

        // Fetch pool data
        const poolData = await fetchTokenAndPoolData();

        // Initialize AMMSwapClient
        const swapClient = new AMMSwapClient(defaultWallet, userWallet, new PublicKey(userWalletPubkey));
        swapClient.currentUserEmail = user.email;

        // Perform SOL -> Token swap
        const swapResult = await swapClient.swapSolForTokens(poolData, solAmount);
        
        await storeSwapData(swapResult, user.email, poolData.token_symbol);

        return res.status(200).json({
            message: 'Swap successful',
            swapResult
        });
    } catch (error) {
        console.error('Error in buyTokenController:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
};

export const sellTokenController = async (req, res) => {
    const { googleId } = req.user;
    const { tokenAmount } = req.body;

    if (!tokenAmount || tokenAmount <= 0) {
        return res.status(400).json({ error: 'Invalid token amount provided' });
    }

    try {
        // Fetch user from DB
        const user = await User.findOne({ googleId });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!user.solWalletSecretKey) {
            return res.status(400).json({ error: 'User does not have a linked SOL wallet' });
        }

        // Load wallets
        const defaultWallet = loadDefaultWallet();
        const userWallet = loadUserWallet(user.solWalletSecretKey);
        const userWalletPubkey = user.solWalletPublicKey;

        // Fetch pool data
        const poolData = await fetchTokenAndPoolData();

        // Initialize AMMSwapClient
        const swapClient = new AMMSwapClient(defaultWallet, userWallet, new PublicKey(userWalletPubkey));
        swapClient.currentUserEmail = user.email;

        // Perform Token -> SOL swap
        const swapResult = await swapClient.swapTokensForSol(poolData, tokenAmount);
        
        await storeSwapData(swapResult, user.email, poolData.token_symbol);

        return res.status(200).json({
            message: 'Swap successful',
            swapResult
        });
    } catch (error) {
        console.error('Error in sellTokenController:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
};
