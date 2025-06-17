"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"
import { Link } from "react-router-dom"
import axios from "axios"

interface PriceHistoryEntry {
  price: number;
  timestamp: Date;
}

interface Token {
  _id: string;
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


export default function MarketPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("marketCap")
  const [isLoaded, setIsLoaded] = useState(false)
  const [mockTokens, setMockTokens] = useState<Token[]>([]);

  useEffect(() => {
    setIsLoaded(true)
    const getTokens = async () => {
      const response = await axios.get("http://localhost:8080/api/market");
      setMockTokens(response.data);
    }
    getTokens();
  }, [])

  const filteredTokens = mockTokens
    .filter(
      (token: Token) =>
        token.channel_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.token_symbol.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => {
      if (sortBy === "marketCap") return b.market_cap - a.market_cap
      if (sortBy === "price") return b.price - a.price
      return 0
    })

  return (
    <div className={`min-h-screen bg-black relative overflow-hidden ${isLoaded ? "page-transition" : ""}`}>
      {/* Background effects */}
      <div className="absolute inset-0 grid-background opacity-20"></div>
      <div className="absolute top-20 right-10 w-40 h-40 bg-gradient-to-r from-white/3 to-gray-300/3 rounded-full blur-2xl float-animation"></div>

      <Navbar />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className={`text-5xl font-bold gradient-text mb-4 ${isLoaded ? "slide-up" : ""}`}>Token Market</h1>
            <p className={`text-gray-400 mb-6 text-lg ${isLoaded ? "fade-in" : ""}`} style={{ animationDelay: "0.2s" }}>
              Discover and trade YouTube creator tokens
            </p>

            {/* Search and Filters */}
            <div
              className={`flex flex-col sm:flex-row gap-4 mb-6 ${isLoaded ? "slide-up" : ""}`}
              style={{ animationDelay: "0.4s" }}
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 transition-all duration-200" />
                <Input
                  placeholder="Search tokens or creators..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-900 border-gray-700 text-white placeholder-gray-400 input-focus hover-lift"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={sortBy === "marketCap" ? "default" : "outline"}
                  onClick={() => setSortBy("marketCap")}
                  className={`transition-all duration-200 hover-lift btn-press ${sortBy === "marketCap" ? "bg-white text-black" : "bg-gray-800 border-gray-700 text-gray-300"
                    }`}
                >
                  Market Cap
                </Button>
                <Button
                  variant={sortBy === "price" ? "default" : "outline"}
                  onClick={() => setSortBy("price")}
                  className={`transition-all duration-200 hover-lift btn-press ${sortBy === "price" ? "bg-white text-black" : "bg-gray-800 border-gray-700 text-gray-300"
                    }`}
                >
                  Price
                </Button>
              </div>
            </div>
          </div>

          {/* Token List with staggered animation */}
          <div className="space-y-4">
            {filteredTokens.map((token: Token, index) => (
              <Card
                key={token.channel_handle}
                className={`backdrop-blur-glass border-gray-800/50 hover:bg-white/5 transition-all duration-300 hover-lift card-glow stagger-item`}
                style={{ animationDelay: `${0.6 + index * 0.1}s` }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="hover-scale">
                        <img
                          src={token.thumbnail_url || "/placeholder.svg"}
                          alt={token.channel_name}
                          width={50}
                          height={50}
                          className="rounded-full transition-transform duration-200"
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white transition-colors duration-200 hover:text-gray-200">
                          {token.channel_name}
                        </h3>
                        <Badge
                          variant="secondary"
                          className="bg-gray-700 text-gray-300 transition-all duration-200 hover:bg-gray-600"
                        >
                          {token.token_symbol}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center space-x-8">
                      <div className="text-right hover-scale">
                        <div className="text-lg font-semibold text-white">${token.price.toFixed(2)}</div>
                        <div className="text-sm text-gray-400">Price</div>
                      </div>

                      <div className="text-right hover-scale">
                        <div className="text-lg font-semibold text-white">${(token.market_cap / 1000).toFixed(0)}K</div>
                        <div className="text-sm text-gray-400">Market Cap</div>
                      </div>
                      <div className="flex space-x-2">
                        <Link to={`/token/${token._id.toString()}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-gray-600 text-black hover:bg-white/50 transition-all duration-200 hover-lift btn-press"
                          >
                            Details
                          </Button>
                        </Link>
                        <Link to={`/buy-tokens?token=${token._id.toString()}`}>
                          <Button
                            size="sm"
                            className="bg-white text-black hover:bg-white/50 transition-all duration-200 hover-lift btn-press btn-enhanced"
                          >
                            Trade
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
