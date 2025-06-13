import { Connection, PublicKey } from '@solana/web3.js';
import Token from '../src/models/token.js';
import User from '../src/models/userModel.js';

const connection = new Connection("http://127.0.0.1:8899", 'confirmed');


export async function startWebSocketListeners(io) {

  const tokens = await Token.find({}).lean();
  console.log(`📡 Setting up WebSocket listeners for ${tokens.length} tokens`);

  const users = await User.find({}).lean();
  console.log(`👥 Setting up listeners for ${users.length} user wallets`);


  for (const user of users) {
    if (!user.wallets || user.wallets.length === 0) continue;
    if (!user.solWalletPublicKey) continue;

    const userWallet = new PublicKey(user.solWalletPublicKey);
    const userId = user.googleId.toString(); // Or however you're tracking them
    
    for (let i = 0; i < user.wallets.length; i++) {
    const wallet = user.wallets[i];
    const tokenAddress = new PublicKey(wallet.address);

    // Set up listener for each token wallet
    connection.onAccountChange(tokenAddress, async (accountInfo) => {
      try {
        const rawBalance = accountInfo.data.slice(64, 72); // token amount starts at offset 64
        const updatedBalance = Number(rawBalance.readBigUInt64LE()) / 1e9; // assuming DECIMALS = 9

        const freshUser = await User.findOne({ googleId: user.googleId });
        if (!freshUser) return;

        const index = freshUser.wallets.findIndex(w => w.address === wallet.address);
        if (index === -1) return;

        const storedBalance = freshUser.wallets[index].balance;

        // Update only if balance changed
        if (storedBalance !== updatedBalance) {
          freshUser.wallets[index].balance = updatedBalance;
          await freshUser.save();

          console.log(`🔄 Updated wallet balance for ${user.googleId} (${wallet.type}): ${updatedBalance}`);

          io.to(user.googleId.toString()).emit("token_wallet_balance_update", {
            tokenType: wallet.type,
            tokenAddress: wallet.address,
            updatedBalance,
            timestamp: new Date(),
          });
        }
      } catch (err) {
        console.error(`❌ Error tracking balance for ${wallet.type} (${wallet.address}):`, err.message);
      }
    });
  }

    connection.onAccountChange(userWallet, async (accountInfo) => {
      try {
        const solBalance = accountInfo.lamports / 1e9;

        // Optionally update in DB:
        await User.updateOne({ googleId: userId }, { solBalance });

        const wallets =

          // Emit update via socket
          io.to(userId).emit("wallet_balance_update", {
            userId,
            solBalance,
            timestamp: new Date(),
          });

        console.log(`💸 Balance update for ${userId}: ${solBalance} SOL`);

      } catch (err) {
        console.error(`❌ Wallet listener error for user ${userId}:`, err.message);
      }
    });
  }

  for (const token of tokens) {
    if (!token.liquidity_pool) {
      console.warn(`❗ Token ${token.token_symbol} is missing liquidity_pool`);
      continue;
    }

    const solAccount = new PublicKey(token.liquidity_pool.pool_sol_account);
    const tokenAccount = new PublicKey(token.liquidity_pool.pool_token_account);
    const mintAddress = token.mint_address;
    const symbol = token.token_symbol;

    const DECIMALS = 9;

    // --- SOL Account Listener ---
    connection.onAccountChange(solAccount, async (accountInfo) => {
      try {
        const sol = accountInfo.lamports / 1e9; // Convert lamports to SOL

        const updated = await Token.findOne({ mint_address: mintAddress });
        if (!updated) return;

        updated.pool_sol = sol;

        if (updated.pool_supply && updated.pool_supply > 0) {
          // Recalculate price in SOL/token
          updated.price = sol / updated.pool_supply;
          updated.market_cap = updated.price * updated.pool_supply;
          updated.price_history.push({ price: updated.price, timestamp: new Date() });
        }

        await updated.save();

        io.emit("price_update", {
          symbol,
          price: updated.price,
          pool_sol: updated.pool_sol,
          pool_supply: updated.pool_supply,
          market_cap: updated.market_cap,
          timestamp: new Date()
        });

      } catch (err) {
        console.error(`❌ SOL listener error for ${symbol}:`, err.message);
      }
    });

    // --- SPL Token Account Listener ---
    connection.onAccountChange(tokenAccount, async (accountInfo) => {
      try {
        const data = accountInfo.data;
        const supplyBuffer = data.slice(64, 72); // SPL token amount starts at offset 64
        const rawAmount = Number(supplyBuffer.readBigUInt64LE());

        const tokenAmount = rawAmount / Math.pow(10, DECIMALS);

        const updated = await Token.findOne({ mint_address: mintAddress });
        if (!updated) return;

        updated.pool_supply = tokenAmount;

        if (updated.pool_sol && updated.pool_sol > 0) {
          updated.price = updated.pool_sol / tokenAmount;
          updated.market_cap = updated.price * updated.pool_supply;
          updated.price_history.push({ price: updated.price, timestamp: new Date() });
        }

        await updated.save();

        io.emit("price_update", {
          symbol,
          price: updated.price,
          pool_sol: updated.pool_sol,
          pool_supply: updated.pool_supply,
          market_cap: updated.market_cap,
          timestamp: new Date()
        });

      } catch (err) {
        console.error(`❌ Token listener error for ${symbol}:`, err.message);
      }
    });
  }
}
