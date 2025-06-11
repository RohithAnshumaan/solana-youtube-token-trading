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

dotenv.config();

const connection = new Connection("http://localhost:8899", "confirmed");

const defaultWalletSecret = Uint8Array.from(
  JSON.parse(process.env.DEFAULT_WALLET_SECRET)
);
const defaultWallet = Keypair.fromSecretKey(defaultWalletSecret);

const INR_TO_SOL = 0.0000742; // Example static rate

export const getBalance = async (req, res) => {
  try{
    const balance = req.user.solBalance;
    const walletAddress = req.user.solWalletPublicKey;
    return res.status(200).json({balance, walletAddress});
  } catch (err){
    console.error("Error fetching balance: ", err);
    res.status(500).json({msg: "Interval server error"});
  }
}

export const createOrDepositWallet = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount." });
    }

    const user = req.user;
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    let walletAddress;
    let walletKeypair;

    // Check if user has a wallet
    if (user.solWalletPublicKey && user.solWalletSecretKey?.length > 0) {
      walletAddress = user.solWalletPublicKey;
      const walletSecretKeyArray = user.solWalletSecretKey.split(',').map(Number);
      walletKeypair = Keypair.fromSecretKey(Uint8Array.from(walletSecretKeyArray));
    } else {
      // Generate a new wallet
      walletKeypair = Keypair.generate();
      walletAddress = walletKeypair.publicKey.toBase58();
      const walletSecretKeyArray = Array.from(walletKeypair.secretKey);

      user.solWalletPublicKey = walletAddress;
      user.solWalletSecretKey = walletSecretKeyArray.toString();
      await user.save();
    }

    // Calculate rent-exempt minimum
    const rentExemptMinimum = await connection.getMinimumBalanceForRentExemption(0);

    // Transfer rent-exempt minimum from defaultWallet if this is a new wallet
    const walletPublicKey = new PublicKey(walletAddress);
    const existingBalance = await connection.getBalance(walletPublicKey);

    let totalLamports = amount * INR_TO_SOL * LAMPORTS_PER_SOL;
    const transaction = new Transaction();

    // Fund rent-exempt minimum if needed
    if (existingBalance < rentExemptMinimum) {
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: defaultWallet.publicKey,
          toPubkey: walletPublicKey,
          lamports: rentExemptMinimum - existingBalance,
        })
      );
    }

    // Add user's deposit amount
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: defaultWallet.publicKey,
        toPubkey: walletPublicKey,
        lamports: totalLamports,
      })
    );

    // Send transaction
    const signature = await sendAndConfirmTransaction(connection, transaction, [defaultWallet]);

    const balance = await connection.getBalance(walletPublicKey);
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
      message: "Deposit successful.",
      address: walletAddress,
      balance: balanceInSOL,
      signature: signature,
    });
  } catch (err) {
    console.error("Create or Deposit Wallet error:", err);
    if (err.logs) {
      console.error("Transaction logs:", err.logs);
    }
    res.status(500).json({ message: "Server error." });
  }
};



export const depositHistory = async (req, res) => {
  try {
    const user = req.user;
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

