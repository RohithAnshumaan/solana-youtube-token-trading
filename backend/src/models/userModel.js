import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    googleId: { type: String, required: true },
    displayName: String,
    email: String,
    accessToken: String,
    refreshToken: String,
    walletAddress: String,
    walletBalance: String,
    walletSecretKey: [Number]
});

const User = mongoose.model("User", userSchema);
export default User;