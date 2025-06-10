import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

dotenv.config();

const connection = new Connection("http://localhost:8899", "confirmed");

const defaultWalletSecret = Uint8Array.from(
  JSON.parse(process.env.DEFAULT_WALLET_SECRET)
);
const defaultWallet = Keypair.fromSecretKey(defaultWalletSecret);

const INR_TO_SOL = 0.0000742; // Example static rate

export const createWallet = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check if user already has a wallet
    if (user.solWalletPublicKey && user.solWalletSecretKey?.length > 0) {
      return res.status(400).json({ message: "Wallet already exists." });
    }

    // Generate wallet
    const walletKeypair = Keypair.generate();
    const walletAddress = walletKeypair.publicKey.toBase58();
    const walletSecretKeyArray = Array.from(walletKeypair.secretKey);

    user.solWalletPublicKey = walletAddress;
    user.solWalletSecretKey = walletSecretKeyArray.toString();

    await user.save();

    return res.json({
      address: walletAddress,
    });
  } catch (err) {
    console.error("Create wallet error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

export const depositSOL = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount." });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check if user has a wallet
    if (!user.solWalletPublicKey || !user.solWalletSecretKey?.length) {
      return res.status(400).json({ message: "Wallet not found. Please create a wallet first." });
    }

    const walletAddress = user.solWalletPublicKey;
    const walletSecretKeyArray = user.solWalletSecretKey;
    const walletKeypair = Keypair.fromSecretKey(Uint8Array.from(walletSecretKeyArray.split(',').map(Number)));

    const solAmount = amount * INR_TO_SOL;

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: defaultWallet.publicKey,
        toPubkey: new PublicKey(walletAddress),
        lamports: solAmount * LAMPORTS_PER_SOL,
      })
    );

    const signature = await sendAndConfirmTransaction(connection, transaction, [defaultWallet]);

    const balance = await connection.getBalance(new PublicKey(walletAddress));
    const balanceInSOL = balance / LAMPORTS_PER_SOL;

    user.solBalance = balanceInSOL;

    user.depositHistory.push({
      amount: amount,
      signature: signature,
      balanceAfter: balanceInSOL,
      timestamp: new Date(),
    });

    await user.save();

    return res.json({
      address: walletAddress,
      balance: balanceInSOL,
      signature: signature,
    });
  } catch (err) {
    console.error("Deposit error:", err);
    res.status(500).json({ message: "Server error." });
  }
};


export const depositHistory = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Return deposit history sorted in reverse chronological order
    const history = user.depositHistory.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

    return res.json({ history });
  }
  catch (error) {
    console.error("Error fetching deposit history: ", error);
    res.status(500).json({ error: "Server error" });
  }
}

