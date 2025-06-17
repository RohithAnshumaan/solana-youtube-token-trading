"use client"

import { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Eye, Heart } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import axios from "axios"
import { useParams, useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

interface PriceHistoryEntry {
  price: number;
  timestamp: Date;
}

interface Token {
  id: string;
  channel_name: string;
  channel_handle: string;
  channel_info: {
    subscribers: number,
    total_views: number,
    average_views: number,
    average_likes: number
  }
  thumbnail_url: string;
  token_symbol: string;
  token_title: string;
  token_uri: string;
  mint_address: string;
  metadata_address: string;
  payer_public: string;
  payer_secret: string;
  associated_token_address: string;
  signature: string;
  price: number;
  pool_supply: number;
  pool_sol: number;
  market_cap: number;
  created_at: Date;
  price_history: PriceHistoryEntry[];
}

function formatPriceHistory(history: PriceHistoryEntry[], range: "1Min" | "1H" | "1D" | "7D" | "1M" | "1Y") {
  const now = new Date();
  let cutoff: Date;

  switch (range) {
    case "1Min":
      cutoff = new Date(now.getTime() - 10 * 60 * 1000); // last 10 minutes
      break;
    case "1H":
      cutoff = new Date(now.getTime() - 60 * 60 * 1000); // last 1 hour
      break;
    case "1D":
      cutoff = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
      break;
    case "7D":
      cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "1M":
      cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "1Y":
      cutoff = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
  }

  return history
    .filter(entry => new Date(entry.timestamp) >= cutoff)
    .map(entry => ({
      time: new Date(entry.timestamp).toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      }),
      price: entry.price,
    }));
}


export default function TokenPage() {
  const { id } = useParams();
  const [selectedRange, setSelectedRange] = useState<"1Min" | "1H" | "1D" | "7D" | "1M" | "1Y">("7D")
  const [token, setToken] = useState<Token | null>(null);
  const [tokenAmount, setTokenAmount] = useState<string>("");
  const [isSelling, setIsSelling] = useState(false);

  const navigate = useNavigate();

  const handleSellToken = async () => {
    if (!token) return console.log("Token not found");
    if (!tokenAmount || Number(tokenAmount) <= 0) return console.log("Enter correct amount");

    setIsSelling(true);
    try {
      const response = await axios.post(
        "http://localhost:8080/api/token/sell",
        {
          tokenAmount: Number(tokenAmount),
          channelName: token.channel_name,
        },
        { withCredentials: true }
      );
      toast.success("Swap complete", {
        description: `Successfully sold ${response.data.swapResult.amountIn} ${token.token_symbol}`,
      });

      setTokenAmount("");
      const updatedToken = await axios.get(`http://localhost:8080/api/token/${id}`);
      setToken(updatedToken.data);
    } catch (error: any) {
      console.log("Failed to sell token");
    } finally {
      setIsSelling(false);
    }
  };

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/api/token/${id}`);
        setToken(response.data);
      } catch (error) {
        console.error("Error fetching token data:", error);
      }
    };

    if (id) fetchToken();
  }, [id]);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 grid-background opacity-20"></div>
      <div className="absolute top-40 left-10 w-32 h-32 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full blur-xl float-animation"></div>

      <Navbar />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center space-x-6 mb-6">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">{token?.channel_name}</h1>
                <Badge variant="secondary" className="bg-gray-700 text-gray-300 text-lg px-3 py-1">
                  {token?.token_symbol}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <StatCard label="Subscribers" value={token?.channel_info.subscribers} icon={<Users />} />
              <StatCard label="Total Views" value={token?.channel_info.total_views} icon={<Eye />} />
              <StatCard label="Avg Views" value={token?.channel_info.average_views} icon={<Eye />} />
              <StatCard label="Avg Likes" value={token?.channel_info.average_likes} icon={<Heart />} />
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="backdrop-blur-glass border-gray-800/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">Price Chart</CardTitle>
                    <div className="flex space-x-2">
                      {(["1Min", "1H", "1D", "7D", "1M", "1Y"] as const).map(range => (
                        <Button
                          key={range}
                          variant={selectedRange === range ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedRange(range)}
                          className="bg-gray-800 border-gray-700 text-gray-300"
                        >
                          {range}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={token ? formatPriceHistory(token.price_history, selectedRange) : []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} />
                        <YAxis stroke="#9CA3AF" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1F2937",
                            border: "1px solid #374151",
                            borderRadius: "8px",
                            color: "#F9FAFB",
                          }}
                        />
                        <Line type="monotone" dataKey="price" stroke="#06B6D4" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="backdrop-blur-glass border-gray-800/50">
                <CardHeader><CardTitle className="text-white">Token Stats</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <StatRow label="Current Price" value={`${token?.price.toFixed(2)} SOL`} />
                  <StatRow label="Market Cap" value={`$${(token?.market_cap! / 1000).toFixed(0)}K`} />
                </CardContent>
              </Card>

              <Card className="backdrop-blur-glass border-gray-800/50">
                <CardHeader><CardTitle className="text-white">Sell Tokens</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-gray-400">Amount to Sell</label>
                    <Input
                      type="number"
                      value={tokenAmount}
                      onChange={(e) => setTokenAmount(e.target.value)}
                      placeholder="Enter token amount"
                      className="mt-1 bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  <div className="flex space-x-4">
                    <Button onClick={() => navigate("/buy-tokens")} className="w-1/2 bg-green-700 hover:bg-green-800">
                      BUY {token?.token_symbol}
                    </Button>
                    <Button
                      onClick={handleSellToken}
                      disabled={isSelling || !tokenAmount || Number(tokenAmount) <= 0}
                      className="w-1/2 bg-red-700 hover:bg-red-800 disabled:opacity-50"
                    >
                      {isSelling ? "Selling..." : `SELL ${token?.token_symbol}`}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper Components
const StatCard = ({ label, value, icon }: { label: string, value?: number, icon: React.ReactNode }) => (
  <Card className="backdrop-blur-glass border-gray-800/50">
    <CardContent className="p-4 text-center">
      <div className="h-8 w-8 text-cyan-400 mx-auto mb-2">{icon}</div>
      <div className="text-2xl font-bold text-white">{value ?? "-"}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </CardContent>
  </Card>
);

const StatRow = ({ label, value }: { label: string, value: string }) => (
  <div className="flex justify-between">
    <span className="text-gray-400">{label}</span>
    <span className="text-white font-semibold">{value}</span>
  </div>
);
