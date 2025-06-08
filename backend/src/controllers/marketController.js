import Token from "../models/token.js"
import User from "../models/userModel.js"

export const getAllTokens = async (req, res) => {
  try {
    const tokens = await Token.find().sort({ market_cap: -1 });
    res.json(tokens);
  } catch (error) {
    console.error("Error fetching tokens:", error);
    res.status(500).json({ error: "Server error" });
  }
};

export const buyToken = async (req, res) => {
  const { channel_handle } = req.params;
  const { userId } = req.body;

  try {
    // Fetch the token with liquidity pool info
    const token = await Token.findOne({ channel_handle: channel_handle });
    if (!token) {
      return res.status(404).json({ error: "Token not found" });
    }

    const liquidityPool = token.liquidityPool;
    if (!liquidityPool) {
      return res.status(404).json({ error: "Liquidity pool not found" });
    }

    // Fetch user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found. Sign up." });
    }

    let wallets = user.wallets || [];
    const existingWallet = wallets.find(wallet => wallet.type === tokenSymbol);

    if (!existingWallet) {
      // Simulate creating ATA
      const { ataAddress, ataSecretKey, ataBalance } = await createATA(userPublicKey, token.liquidityPool.poolTokenAccount);
      const newWallet = {
        type: token.token_symbol,
        publicKey: ataAddress,
        secretKey: ataSecretKey,
        balance: ataBalance
      };
      wallets.push(newWallet);
      user.wallets = wallets;
      await user.save();
    }

    res.status(200).json({
      liquidityPool: {
        poolAccount: liquidityPool.poolAccount,
        poolTokenAccount: liquidityPool.poolTokenAccount,
        poolSolAccount: liquidityPool.poolSolAccount
      },
      userWallets: user.wallets
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};
