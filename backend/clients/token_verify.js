import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { getMint, getAccount } from '@solana/spl-token';

async function verifyMint(connection, mintPubkey) {
  try {
    const mintInfo = await getMint(connection, mintPubkey);
    console.log('Mint info:', {
      supply: mintInfo.supply.toString(),
      decimals: mintInfo.decimals,
      mintAuthority: mintInfo.mintAuthority?.toBase58(),
      freezeAuthority: mintInfo.freezeAuthority?.toBase58(),
    });
    return mintInfo;
  } catch (error) {
    console.error('Error fetching mint info:', error);
  }
}

async function verifyTokenAccount(connection, ataPubkey) {
  try {
    const accountInfo = await getAccount(connection, ataPubkey);
    console.log('ATA info:', {
      owner: accountInfo.owner.toBase58(),
      amount: accountInfo.amount.toString(),
      isInitialized: accountInfo.isInitialized,
      isFrozen: accountInfo.isFrozen,
    });
    return accountInfo;
  } catch (error) {
    console.error('Error fetching ATA info:', error);
  }
}

async function verifyTokenCreation(connection, mintAddress, ataAddress) {
  console.log('Verifying mint and ATA...');
  const mintPubkey = new PublicKey(mintAddress);
  const ataPubkey = new PublicKey(ataAddress);

  const mintInfo = await verifyMint(connection, mintPubkey);
  const ataInfo = await verifyTokenAccount(connection, ataPubkey);

  if (mintInfo && ataInfo) {
    console.log(`Mint supply: ${mintInfo.supply.toString()}`);
    console.log(`ATA balance: ${ataInfo.amount.toString()}`);

    if (ataInfo.amount > 0) {
      console.log('✅ Tokens successfully minted to ATA!');
    } else {
      console.warn('⚠️ ATA has zero balance - tokens not minted?');
    }
  }
}

// ------ Replace these with your own data ------
// If testing on mainnet or testnet, use appropriate RPC URL or clusterApiUrl('testnet')
// For local validator use "http://127.0.0.1:8899"

const connection = new Connection("http://127.0.0.1:8899"); // or 'mainnet-beta' or local RPC URL

const mintAddress = 'CYNH3ZWpwMZDmpACGGiydjoDKFSYUaviuERpMhYzYVFj';
const ataAddress = 'xN2s87rNnFkwVQHshvCyMfs8wPvxiVNRq69CnWodUp3';

verifyTokenCreation(connection, mintAddress, ataAddress);
