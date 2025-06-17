import mongoose from "mongoose";

const walletSchema = new mongoose.Schema({
  type: { type: String, required: true }, // e.g., SOL, USDC, etc.
  address: { type: String, required: true },
  secretKey: { type: [Number], required: true },
  balance: { type: Number, default: 0 },
  title: String,
  price: Number,
  url: String,
});

const userSchema = new mongoose.Schema({
  googleId: { type: String, required: true },
  displayName: String,
  email: String,
  
  accessToken: String,
  refreshToken: String,
  
  solWalletPublicKey: String,
  solWalletSecretKey: String,
  solBalance: Number,

  wallets: [walletSchema],
  
  depositHistory: [{
    amount: { type: Number, required: true },
    signature: { type: String, required: true },
    balanceAfter: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now },
  }],
  
  swapHistory: [{
    transaction_signature: String,
    swap_type: String,
    amount_in: Number,
    amount_out: Number,
    final_balance: Number,
    token: String,
    timestamp: { type: Date, default: Date.now },
  }],
  
  createdTokens: [
    {
      token_symbol: String,
      token_title: String,
      thumbnail_url: String,
      initial_price: Number,
      pool_supply: Number,
      pool_sol: Number,
      market_cap: Number,
      created_at: { type: Date, default: Date.now }
  }
  ],
  
  channelInfo: [
    {
      avgRecentLikes: Number,
      avgRecentViews: Number,
      channelHandle: String,
      channelName: String,
      subscribers: Number,
      thumbnailUrl: String,
      totalVideos: Number,
      totalViews: Number
    }
  ]
});

const User = mongoose.model("User", userSchema);
export default User;