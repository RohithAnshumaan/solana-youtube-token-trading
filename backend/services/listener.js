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
    if (!user.wallets?.length || !user.solWalletPublicKey) continue;

    const userWallet = new PublicKey(user.solWalletPublicKey);
    const userId = user.googleId.toString();

    for (const wallet of user.wallets) {
      const tokenAddress = new PublicKey(wallet.address);

      connection.onAccountChange(tokenAddress, async (accountInfo) => {
        try {
          const rawBalance = accountInfo.data.slice(64, 72); // token balance offset
          const updatedBalance = Number(rawBalance.readBigUInt64LE()) / 1e9;

          const freshUser = await User.findOne({ googleId: userId });
          if (!freshUser) return;

          const index = freshUser.wallets.findIndex(w => w.address === wallet.address);
          if (index === -1) return;

          const storedBalance = freshUser.wallets[index].balance;
          if (storedBalance !== updatedBalance) {
            freshUser.wallets[index].balance = updatedBalance;
            await freshUser.save();

            console.log(`🔄 Updated ${wallet.type} balance for ${userId}: ${updatedBalance}`);
            io.to(userId).emit("token_wallet_balance_update", {
              tokenType: wallet.type,
              tokenAddress: wallet.address,
              updatedBalance,
              timestamp: new Date(),
            });
          }
        } catch (err) {
          console.error(`❌ Balance listener error for ${wallet.type} (${wallet.address}):`, err.message);
        }
      });
    }

    // SOL Wallet Listener
    connection.onAccountChange(userWallet, async (accountInfo) => {
      try {
        const solBalance = accountInfo.lamports / 1e9;

        await User.updateOne({ googleId: userId }, { solBalance });
        
        console.log("Balance updated to : ", solBalance );

        io.to(userId).emit("wallet_balance_update", {
          userId,
          solBalance,
          timestamp: new Date(),
        });

        console.log(`💸 SOL balance update for ${userId}: ${solBalance}`);
      } catch (err) {
        console.error(`❌ SOL wallet listener error for user ${userId}:`, err.message);
      }
    });
  }

  for (const token of tokens) {
    if (!token.liquidity_pool) {
      console.warn(`❗ Token ${token.token_symbol} missing liquidity_pool`);
      continue;
    }

    const solAccount = new PublicKey(token.liquidity_pool.pool_sol_account);
    const tokenAccount = new PublicKey(token.liquidity_pool.pool_token_account);
    const mintAddress = token.mint_address;
    const symbol = token.token_symbol;
    const DECIMALS = 9;

    // --- SOL Pool Account Listener ---
    connection.onAccountChange(solAccount, async (accountInfo) => {
      try {
        const sol = accountInfo.lamports / 1e9;

        const updated = await Token.findOne({ mint_address: mintAddress });
        if (!updated) return;

        updated.pool_sol = sol;

        if (updated.pool_supply && updated.pool_supply > 0) {
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

    // --- SPL Token Pool Account Listener ---
    connection.onAccountChange(tokenAccount, async (accountInfo) => {
      try {
        const supplyBuffer = accountInfo.data.slice(64, 72);
        const rawAmount = Number(supplyBuffer.readBigUInt64LE());
        const tokenAmount = rawAmount / Math.pow(10, DECIMALS);

        const updated = await Token.findOne({ mint_address: mintAddress });
        if (!updated) return;

        updated.pool_supply = tokenAmount;

        if (updated.pool_sol && updated.pool_sol > 0) {
          updated.price = updated.pool_sol / tokenAmount;
          updated.market_cap = updated.price * tokenAmount;
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
