import Token from "../models/token.js"

export const getAllTokens = async (req, res) => {
  try {
    const tokens = await Token.find().sort({ market_cap: -1 });
    res.json(tokens);
  } catch (error) {
    console.error("Error fetching tokens:", error);
    res.status(500).json({ error: "Server error" });
  }
};
