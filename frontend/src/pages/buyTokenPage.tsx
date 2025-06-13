"use client"

import { useEffect, useState } from "react"
import { useMemo } from "react";
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import axios from "axios"
import { io } from "socket.io-client";


interface PriceHistoryEntry {
  price: number;
  timestamp: Date;
}

interface Token {
  id: string;
  channel_name: string;
  channel_handle: string;
  thumbnail_url: string;
  token_symbol: string;
  token_title: string;
  token_uri: string;
  mint_address: string;
  metadata_address: string;
  payer_public: string;
  payer_secret: string;
  associated_token_address: string;  // ✅ NEW FIELD
  signature: string;
  price: number;
  pool_supply: number;
  pool_sol: number;
  market_cap: number;
  created_at: Date;
  price_history: PriceHistoryEntry[];
}

export default function BuyTokensPage() {
  const [sellToken] = useState("SOL")
  const [buyToken, setBuyToken] = useState("")
  const [sellAmount, setSellAmount] = useState("")
  const [buyAmount, setBuyAmount] = useState("")
  const [allTokens, setAllTokens] = useState<Token[]>([])

  useEffect(() => {
    const getTokens = async () => {
      try {
        const response = await axios.get("http://localhost:8080/api/market")
        setAllTokens(response.data)
      } catch (err) {
        toast.error("Failed to load tokens.")
      }
    }
    getTokens()
  }, [])

  useEffect(() => {
    const socket = io("http://localhost:8080"); // adjust port if needed

    socket.on("price_update", (data) => {
      setAllTokens((prevTokens) =>
        prevTokens.map((token) =>
          token.token_symbol === data.symbol
            ? {
              ...token,
              price: data.price,
              pool_sol: data.pool_sol,
              pool_supply: data.pool_supply,
              market_cap: data.market_cap, // Optional: if market cap = pool SOL
              price_history: [
                ...(token.price_history || []),
                { price: data.price, timestamp: new Date(data.timestamp) },
              ],
            }
            : token
        )
      );
    });

    return () => {
      socket.disconnect();
    };
  }, []);


  const handleBuyToken = async () => {
    if (!sellAmount || parseFloat(sellAmount) <= 0) {
      toast.error("Please enter a valid SOL amount to sell.")
      return
    }

    try {
      // Get channelName from selected token object
      const selectedToken = allTokens.find((token) => token.token_symbol === buyToken)
      if (!selectedToken) {
        toast.error("Selected token not found.")
        return
      }

      const response = await axios.post(
        `http://localhost:8080/api/token/buy`, // hit buyTokenController directly
        {
          solAmount: parseFloat(sellAmount),
          channelName: selectedToken.channel_name,
        },
        { withCredentials: true }
      )

      setBuyAmount(response.data.swapResult.amountOut.toFixed(2))
    } catch (error: any) {
      console.error("Error during swap:", error)
      const errorMessage = error.response?.data?.error || "Swap failed."
      toast.error(errorMessage)
    }
  }

  const topTokens = useMemo(() => {
  return [...allTokens]
    .sort((a, b) => b.market_cap - a.market_cap)
    .slice(0, 5);
}, [allTokens]);


  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 grid-background opacity-20" />
      <Navbar />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl font-bold gradient-text mb-8">Buy Tokens</h1>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Top Tokens */}
            <div>
              <Card className="backdrop-blur-glass border-gray-800/50">
                <CardHeader>
                  <CardTitle className="text-white">Top 5 Tokens</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topTokens.map((token, index) => (
                      <div
                        key={token.token_symbol}
                        className="flex items-center justify-between p-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-gray-400 font-mono text-sm w-6">#{index + 1}</span>
                          <img
                            src={token.thumbnail_url || "/placeholder.svg"}
                            alt={token.channel_name}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                          <div>
                            <div className="text-white font-semibold">{token.channel_name}</div>
                            <Badge variant="secondary" className="bg-gray-700 text-gray-300 text-xs">
                              {token.token_symbol}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-semibold">${token.price?.toFixed(2)}</div>
                          <div className="text-sm text-gray-400">
                            Market Cap: ${(token.market_cap || 0).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Trading Interface */}
            <div>
              <Card className="backdrop-blur-glass border-gray-800/50">
                <CardHeader>
                  <CardTitle className="text-white">Trade Tokens</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-gray-300">You're buying</Label>
                    <div className="flex space-x-2">
                      <Select value={buyToken} onValueChange={setBuyToken}>
                        <SelectTrigger className="w-48 bg-gray-800 border-gray-700 text-white">
                          <SelectValue placeholder="Select Token" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          {allTokens.map((token: any) => (
                            <SelectItem key={token.token_symbol} value={token.token_symbol} className="text-white">
                              {token.channel_name} ({token.token_symbol})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300">You're paying in SOL</Label>
                    <Input
                      placeholder="Enter SOL amount"
                      value={sellAmount}
                      onChange={(e) => setSellAmount(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                    />
                  </div>

                  <div className="bg-gray-800 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Exchange Rate</span>
                      <span className="text-white">
                        {sellAmount} {sellToken} = ~ {buyToken ? buyAmount : "?"} {buyToken}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Trading Fee</span>
                      <span className="text-white">0.3%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Slippage</span>
                      <span className="text-white">0.5%</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleBuyToken}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white py-3"
                  >
                    Buy {buyToken || "Token"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
