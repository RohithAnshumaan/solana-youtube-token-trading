import mongoose from "mongoose";

const walletSchema = new mongoose.Schema({
  type: { type: String, required: true }, // e.g., SOL, USDC, etc.
  address: { type: String, required: true },
  secretKey: { type: [Number], required: true },
  balance: { type: Number, default: 0 },
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
});

const User = mongoose.model("User", userSchema);
export default User;