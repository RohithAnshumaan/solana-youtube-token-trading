import mongoose from 'mongoose';

const TokenSchema = new mongoose.Schema({
  channel_name: String,
  channel_handle: String,
  thumbnail_url: String,
  token_symbol: String,
  token_title: String,
  token_uri: String,
  mint_address: String,
  metadata_address: String,
  payer_public: String,
  payer_secret: String,
  associated_token_address: String, // ✅ NEW FIELD
  signature: String,
  price: Number,
  pool_supply: Number,
  pool_sol: Number,
  market_cap: Number,
  created_at: { type: Date, default: Date.now },
  price_history: [{
    price: Number,
    timestamp: { type: Date, default: Date.now }
  }]
});

const Token = mongoose.model('Token', TokenSchema);
export default Token;
