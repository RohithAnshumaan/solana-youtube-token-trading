import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, TrendingUp, TrendingDown } from "lucide-react";

// Mock top tokens data
const topTokens = [
  {
    id: 1,
    symbol: "MRBEAST",
    channelName: "MrBeast",
    image: "/placeholder.svg?height=40&width=40",
    price: 12.45,
    change24h: 5.67,
  },
  {
    id: 2,
    symbol: "MKBHD",
    channelName: "Marques Brownlee",
    image: "/placeholder.svg?height=40&width=40",
    price: 15.67,
    change24h: 8.91,
  },
  {
    id: 3,
    symbol: "PEWDIE",
    channelName: "PewDiePie",
    image: "/placeholder.svg?height=40&width=40",
    price: 8.92,
    change24h: -2.34,
  },
  {
    id: 4,
    symbol: "DUDE",
    channelName: "Dude Perfect",
    image: "/placeholder.svg?height=40&width=40",
    price: 6.78,
    change24h: 3.45,
  },
  {
    id: 5,
    symbol: "EMMA",
    channelName: "Emma Chamberlain",
    image: "/placeholder.svg?height=40&width=40",
    price: 9.34,
    change24h: -1.23,
  },
];

export default function BuyTokensPage() {
  const [sellToken, setSellToken] = useState("SOL");
  const [buyToken, setBuyToken] = useState("MRBEAST");
  const [sellAmount, setSellAmount] = useState("");
  const [buyAmount, setBuyAmount] = useState("");

  const handleSwapTokens = () => {
    setSellToken(buyToken);
    setBuyToken(sellToken);
    setSellAmount(buyAmount);
    setBuyAmount(sellAmount);
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 grid-background opacity-20"></div>

      <Navbar />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl font-bold gradient-text mb-8">Buy Tokens</h1>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Top Tokens */}
            <div>
              <Card className="backdrop-blur-glass border-gray-800/50">
                <CardHeader>
                  <CardTitle className="text-white">Top 10 Tokens</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topTokens.map((token, index) => (
                      <div
                        key={token.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-gray-400 font-mono text-sm w-6">
                            #{index + 1}
                          </span>
                          <img
                            src={token.image || "/placeholder.svg"}
                            alt={token.channelName}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                          <div>
                            <div className="text-white font-semibold">
                              {token.channelName}
                            </div>
                            <Badge
                              variant="secondary"
                              className="bg-gray-700 text-gray-300 text-xs"
                            >
                              {token.symbol}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-semibold">
                            ${token.price.toFixed(2)}
                          </div>
                          <div
                            className={`text-sm flex items-center ${
                              token.change24h >= 0
                                ? "text-green-400"
                                : "text-red-400"
                            }`}
                          >
                            {token.change24h >= 0 ? (
                              <TrendingUp className="h-3 w-3 mr-1" />
                            ) : (
                              <TrendingDown className="h-3 w-3 mr-1" />
                            )}
                            {token.change24h >= 0 ? "+" : ""}
                            {token.change24h.toFixed(2)}%
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
                  {/* Sell Section */}
                  <div className="space-y-2">
                    <Label className="text-gray-300">You're selling</Label>
                    <div className="flex space-x-2">
                      <Select value={sellToken} onValueChange={setSellToken}>
                        <SelectTrigger className="w-32 bg-gray-800 border-gray-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="SOL" className="text-white">
                            SOL
                          </SelectItem>
                          <SelectItem value="USDC" className="text-white">
                            USDC
                          </SelectItem>
                          {topTokens.map((token) => (
                            <SelectItem
                              key={token.symbol}
                              value={token.symbol}
                              className="text-white"
                            >
                              {token.symbol}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="0.00"
                        value={sellAmount}
                        onChange={(e) => setSellAmount(e.target.value)}
                        className="flex-1 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                      />
                    </div>
                    <div className="text-sm text-gray-400">
                      Balance: 10.5 {sellToken}
                    </div>
                  </div>

                  {/* Swap Button */}
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleSwapTokens}
                      className="border-gray-700 text-gray-300 hover:bg-gray-800"
                    >
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Buy Section */}
                  <div className="space-y-2">
                    <Label className="text-gray-300">You're buying</Label>
                    <div className="flex space-x-2">
                      <Select value={buyToken} onValueChange={setBuyToken}>
                        <SelectTrigger className="w-32 bg-gray-800 border-gray-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          {topTokens.map((token) => (
                            <SelectItem
                              key={token.symbol}
                              value={token.symbol}
                              className="text-white"
                            >
                              {token.symbol}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="0.00"
                        value={buyAmount}
                        onChange={(e) => setBuyAmount(e.target.value)}
                        className="flex-1 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                      />
                    </div>
                    <div className="text-sm text-gray-400">≈ $156.78</div>
                  </div>

                  {/* Trade Summary */}
                  <div className="bg-gray-800 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Exchange Rate</span>
                      <span className="text-white">
                        1 {sellToken} = 0.85 {buyToken}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Trading Fee</span>
                      <span className="text-white">0.25%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Slippage</span>
                      <span className="text-white">0.5%</span>
                    </div>
                  </div>

                  <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white py-3">
                    Buy {buyToken} Token
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
