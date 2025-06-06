import express from "express";
import jwt from "jsonwebtoken";
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import dotenv from "dotenv";
import User from "../models/userModel.js";

dotenv.config();

const walletRouter = express.Router();
const connection = new Connection("http://localhost:8899", "confirmed");

const defaultWalletSecret = Uint8Array.from(JSON.parse(process.env.DEFAULT_WALLET_SECRET)); // stored in .env
const defaultWallet = Keypair.fromSecretKey(defaultWalletSecret);

// Convert INR to SOL rate
const INR_TO_SOL = 0.0000742; // Example static rate

walletRouter.post("/deposit", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount." });
    }

    // Find the user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    let walletAddress, walletSecretKeyArray;
    let walletKeypair;

    // Check if user already has a wallet
    if (user.walletAddress && user.walletSecretKey && user.walletSecretKey.length > 0) {
      // User already has a wallet
      walletAddress = user.walletAddress;
      walletSecretKeyArray = user.walletSecretKey;
      walletKeypair = Keypair.fromSecretKey(Uint8Array.from(walletSecretKeyArray));
    } else {
      // Create new wallet
      walletKeypair = Keypair.generate();
      walletAddress = walletKeypair.publicKey.toBase58();
      walletSecretKeyArray = Array.from(walletKeypair.secretKey);
    }

    // Calculate SOL amount
    const solAmount = amount * INR_TO_SOL;

    // Fund the wallet from default wallet
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: defaultWallet.publicKey,
        toPubkey: new PublicKey(walletAddress),
        lamports: solAmount * LAMPORTS_PER_SOL
      })
    );

    await sendAndConfirmTransaction(connection, transaction, [defaultWallet]);

    // Get updated balance
    const balance = await connection.getBalance(new PublicKey(walletAddress));
    const balanceInSOL = balance / LAMPORTS_PER_SOL;

    // Update user in DB
    user.walletAddress = walletAddress;
    user.walletSecretKey = walletSecretKeyArray;
    user.walletBalance = balanceInSOL;
    await user.save();

    return res.json({
      address: walletAddress,
      balance: balanceInSOL
    });
  } catch (err) {
    console.error("Deposit error:", err);
    res.status(500).json({ message: "Server error." });
  }
});


export default walletRouter;
