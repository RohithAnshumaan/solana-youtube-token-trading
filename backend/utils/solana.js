import { Connection, Keypair, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, createSyncNativeInstruction } from "@solana/spl-token";
import fs from "fs";

// Load default wallet from secret key file
const defaultWalletSecret = JSON.parse(fs.readFileSync('./default-wallet.json', 'utf8'));
const defaultWallet = Keypair.fromSecretKey(Uint8Array.from(defaultWalletSecret));

// Local validator connection
const connection = new Connection("http://127.0.0.1:8899", "confirmed");

// wSOL mint address
const wSOL_MINT = new PublicKey("So11111111111111111111111111111111111111112");

export {
  connection,
  defaultWallet,
  wSOL_MINT,
  Keypair,
  SystemProgram,
  Transaction,
  getOrCreateAssociatedTokenAccount,
  createSyncNativeInstruction
};
