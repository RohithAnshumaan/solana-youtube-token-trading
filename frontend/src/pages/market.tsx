"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Skeleton from "@/components/ui/skeleton";
import TokenCard, { TokenCardContent } from "@/components/ui/tokenCard";

interface Token {
  _id: string;
  channel_handle: string,
  token_symbol: string;
  thumbnail_url: string;
  initial_price: number;
  market_cap: number;
}

const MarketPage: React.FC = () => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const response = await axios.get("http://localhost:8080/api/market");
        setTokens(response.data);
      } catch (error) {
        console.error("Failed to fetch tokens:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
  }, []);

  const handleBuy = (token: Token) => {
    // Placeholder logic for buying token
    console.log(`Buying token: ${token.token_symbol}`);
    alert(`Initiating purchase of ${token.token_symbol}`);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Market</h1>
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, index) => (
            <Skeleton key={index} className="h-20 w-full rounded-lg bg-gray-700" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {tokens.map((token) => (
            <TokenCard
              key={token._id}
              className="hover:bg-gray-700 transition-colors duration-200"
            >
              <TokenCardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <img
                    src={token.thumbnail_url}
                    alt={token.token_symbol}
                    className="w-12 h-12 rounded-full object-cover border border-gray-700"
                  />
                  <div>
                    <div className="text-xl font-semibold">{token.token_symbol}</div>
                    <div className="text-sm text-gray-400">
                      Price: ${token.initial_price.toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm text-gray-400">Market Cap</div>
                    <div className="text-lg font-bold">
                      ${token.market_cap.toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={() => handleBuy(token)}
                    className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                  >
                    Buy
                  </button>
                </div>
              </TokenCardContent>
            </TokenCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default MarketPage;
