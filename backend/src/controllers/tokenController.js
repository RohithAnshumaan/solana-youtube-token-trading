import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import axios from 'axios';
import User from '../models/userModel.js';
import Token from '../models/token.js';
import { YouTubeChannelAnalyzer } from '../../clients/fetch_metrics.js';
import YouTubeTokenFactory from '../../clients/create_token.js';
import dotenv from 'dotenv';
import { loadDefaultWallet, loadTokenSourceWallet, AMMClient, fetchTokenData, storePoolData } from '../../clients/amm_client.js'
import { AMMSwapClient, fetchTokenAndPoolData, loadUserWallet } from '../../clients/swap_client.js';

dotenv.config({ path: 'D:/HypeEconomy/backend/.env' });

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
                        final_balance: swapData.finalBalance,
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

export const fetchYoutubeChannelData = async (req, res) => {
    try {
        const accessToken = req.user.accessToken;

        // Step 1: Fetch the authenticated user's YouTube channel handle
        const response = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            params: {
                part: 'snippet',
                mine: true,
            },
        });

        const channelData = response.data.items[0];
        if (!channelData) {
            return res.status(404).json({ error: 'No YouTube channel found for this account' });
        }

        const channelHandle = channelData.snippet.customUrl
            ? channelData.snippet.customUrl.replace(/^@/, '')
            : channelData.snippet.title.replace(/\s+/g, '');

        console.log(`Fetched YouTube channel: ${channelData.snippet.title} (@${channelHandle})`);

        // Step 2: Use your YouTubeChannelAnalyzer
        const analyzer = new YouTubeChannelAnalyzer(process.env.GOOGLE_API_KEY);
        const metrics = await analyzer.getChannelMetrics(channelHandle);

        if (!metrics) {
            return res.status(500).json({ error: 'Failed to analyze YouTube channel metrics.' });
        }

        // Step 3: Convert ChannelMetrics instance to plain object
        const plainMetrics = {
            channelName: metrics.channelName,
            channelHandle: metrics.channelHandle,
            subscribers: metrics.subscribers,
            totalViews: metrics.totalViews,
            totalVideos: metrics.totalVideos,
            avgRecentViews: metrics.avgRecentViews,
            avgRecentLikes: metrics.avgRecentLikes,
            thumbnailUrl: metrics.thumbnailUrl,
        };

        // Step 4: Update or Insert metrics in the 'channelInfo' array
        const updateResult = await User.updateOne(
            { _id: req.user._id, "channelInfo.channelHandle": plainMetrics.channelHandle },
            { $set: { "channelInfo.$": plainMetrics } }
        );

        if (updateResult.matchedCount === 0) {
            // No existing entry, so push a new one
            await User.updateOne(
                { _id: req.user._id },
                { $push: { channelInfo: plainMetrics } }
            );
        }

        // Step 5: Send metrics as JSON
        return res.json(metrics);
    } catch (err) {
        console.error("Failed to fetch YouTube Channel data", err);
        res.status(500).json({ error: 'Internal server error' });
    }
};


export const createTokenController = async (req, res) => {
    try {
        const googleId = req.user.googleId;
        // Fetch stored channel metrics from the User's channelInfo
        const user = await User.findOne({ googleId });

        if (!user || !user.channelInfo || user.channelInfo.length === 0) {
            return res.status(404).json({ error: 'No stored channel metrics found for this channel handle.' });
        }

        const storedMetrics = user.channelInfo[0];
        console.log("THE STORED METRICS ARE, ", storedMetrics);

        // Setup Solana connection and a new payer wallet
        const connection = new Connection(RPC_URL, 'confirmed');
        const payer = Keypair.generate();

        // Airdrop some SOL to the payer (only on localnet or testnet!)
        const signature = await connection.requestAirdrop(payer.publicKey, 2 * LAMPORTS_PER_SOL);
        await connection.confirmTransaction(signature);

        // Create token using YouTubeTokenFactory
        const factory = new YouTubeTokenFactory(connection, payer);

        // Convert storedMetrics to the format expected by createChannelToken
        // Assuming factory.createChannelToken can take stored metrics directly (if not, you might need to adapt it)
        const result = await factory.createChannelToken(String(storedMetrics.channelHandle));


        // Calculate token economics
        const price = factory.calculateInitialPrice(storedMetrics);
        const supply = factory.calculateTokenSupply(storedMetrics);
        const initialSol = factory.calculateInitialSol(storedMetrics);
        const marketCap = price * supply;
        
        const channel_metrics = result.channelMetrics;

        const channel_info = {
            subscribers: channel_metrics.subscribers,
            total_views: channel_metrics.totalViews,
            average_views: channel_metrics.avgRecentViews,
            average_likes: channel_metrics.avgRecentLikes,
        }

        // Save to Tokens collection
        await Token.create({
            channel_name: storedMetrics.channelName,
            channel_handle: storedMetrics.channelHandle,
            channel_info: channel_info,
            thumbnail_url: storedMetrics.thumbnailUrl,
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
            data: {
                mint_address: result.mint,
                token_symbol: result.tokenArgs.token_symbol,
                token_title: result.tokenArgs.token_title,
                initial_price: price,
                pool_supply: supply,
                pool_sol: initialSol,
                market_cap: marketCap,
            }
        });
    } catch (error) {
        console.error('Error creating token:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


export const createAMMController = async (req, res) => {
    const googleId = req.user.googleId;

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
    const googleId = req.user.googleId;
    const { solAmount, channelName } = req.body;

    if (!solAmount || solAmount <= 0) {
        return res.status(400).json({ error: 'Invalid SOL amount provided' });
    }

    try {
        // Fetch user from DB
        const user = await User.findOne({ googleId });
        if (!user.solWalletSecretKey) {
            return res.status(400).json({ error: 'User does not have a linked SOL wallet' });
        }

        // Load wallets
        const defaultWallet = loadDefaultWallet();
        const userWallet = loadUserWallet(user.solWalletSecretKey);
        const userWalletPubkey = user.solWalletPublicKey;

        // Fetch pool data
        const poolData = await fetchTokenAndPoolData(channelName);

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
    const googleId = req.user.googleId;
    const { tokenAmount, channelName } = req.body;

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
        const poolData = await fetchTokenAndPoolData(channelName);

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

export const getTokenDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const token = await Token.findById(id); // <-- This uses MongoDB _id

        if (!token) return res.status(404).json({ msg: "Token not found" });

        return res.status(200).json(token);

    } catch (error) {
        console.error('Error in sellTokenController:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
};