import {
  PublicKey,
  Connection,
  Keypair,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import dotenv from "dotenv";

dotenv.config();

// Initialize connection
const connection = new Connection(process.env.SOLANA_RPC_URL, "confirmed");

// Load default wallet (payer)
const defaultWallet = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(process.env.DEFAULT_WALLET_SECRET))
);

/**
 * Creates an Associated Token Account (ATA) for the user.
 * @param {string} userPublicKey - The user's public key (wallet).
 * @param {string} tokenMint - The token mint address.
 * @returns {Promise<object>} - The new ATA details: address, secretKey, balance.
 */
export const createATA = async (userPublicKey, tokenMint) => {
  try {
    const userWalletPubkey = new PublicKey(userPublicKey);
    const tokenMintPubkey = new PublicKey(tokenMint);

    // Derive ATA address
    const ata = await getAssociatedTokenAddress(
      tokenMintPubkey,
      userWalletPubkey
    );

    // Check if the ATA already exists
    const ataInfo = await connection.getAccountInfo(ata);
    if (ataInfo) {
      console.log(`ATA already exists at: ${ata.toBase58()}`);

      // Fetch balance
      const balanceResponse = await connection.getTokenAccountBalance(ata);
      const ataBalance = balanceResponse.value.uiAmount || 0;

      return {
        ataAddress: ata.toBase58(),
        ataSecretKey: "N/A",  // ATAs are PDAs so no secret key; we store N/A
        ataBalance,
      };
    }

    // Create ATA instruction
    const ataIx = createAssociatedTokenAccountInstruction(
      defaultWallet.publicKey, // Payer
      ata,                     // ATA address
      userWalletPubkey,        // Owner
      tokenMintPubkey          // Mint
    );

    // Create transaction and send
    const transaction = new Transaction().add(ataIx);
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [defaultWallet]
    );

    console.log(`ATA created with tx signature: ${signature}`);

    // Fetch balance after creation
    const balanceResponse = await connection.getTokenAccountBalance(ata);
    const ataBalance = balanceResponse.value.uiAmount || 0;

    return {
      ataAddress: ata.toBase58(),
      ataSecretKey: "N/A",  // ATAs are PDAs so no secret key; we store N/A
      ataBalance,
    };
  } catch (error) {
    console.error("Error creating ATA:", error);
    throw error;
  }
};
