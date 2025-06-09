import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp, TrendingDown } from "lucide-react";
import { Link } from "react-router-dom";

interface Token {
  id: number;
  symbol: string;
  channelName: string;
  image: string;
  price: number;
  marketCap: number;
  change24h: number;
  volume24h: number;
}

// Mock data for tokens
const mockTokens: Token[] = [
  {
    id: 1,
    symbol: "MRBEAST",
    channelName: "MrBeast",
    image: "/placeholder.svg?height=50&width=50",
    price: 12.45,
    marketCap: 1250000,
    change24h: 5.67,
    volume24h: 125000,
  },
  {
    id: 2,
    symbol: "PEWDIE",
    channelName: "PewDiePie",
    image: "/placeholder.svg?height=50&width=50",
    price: 8.92,
    marketCap: 892000,
    change24h: -2.34,
    volume24h: 89200,
  },
  {
    id: 3,
    symbol: "MKBHD",
    channelName: "Marques Brownlee",
    image: "/placeholder.svg?height=50&width=50",
    price: 15.67,
    marketCap: 1567000,
    change24h: 8.91,
    volume24h: 156700,
  },
  {
    id: 4,
    symbol: "DUDE",
    channelName: "Dude Perfect",
    image: "/placeholder.svg?height=50&width=50",
    price: 6.78,
    marketCap: 678000,
    change24h: 3.45,
    volume24h: 67800,
  },
  {
    id: 5,
    symbol: "EMMA",
    channelName: "Emma Chamberlain",
    image: "/placeholder.svg?height=50&width=50",
    price: 9.34,
    marketCap: 934000,
    change24h: -1.23,
    volume24h: 93400,
  },
];

export default function MarketPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"marketCap" | "price" | "change24h">("marketCap");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const filteredTokens = mockTokens
    .filter(
      (token) =>
        token.channelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "marketCap") return b.marketCap - a.marketCap;
      if (sortBy === "price") return b.price - a.price;
      if (sortBy === "change24h") return b.change24h - a.change24h;
      return 0;
    });

  return (
    <div className={`min-h-screen bg-black relative overflow-hidden ${isLoaded ? "page-transition" : ""}`}>
      {/* Background effects */}
      <div className="absolute inset-0 grid-background opacity-20"></div>
      <div className="absolute top-20 right-10 w-40 h-40 bg-gradient-to-r from-white/3 to-gray-300/3 rounded-full blur-2xl float-animation"></div>

      {/* Navbar would be imported here */}
      {/* <Navbar /> */}

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
                  onChange={(e: any) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-900 border-gray-700 text-white placeholder-gray-400 input-focus hover-lift"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={sortBy === "marketCap" ? "default" : "outline"}
                  onClick={() => setSortBy("marketCap")}
                  className={`transition-all duration-200 hover-lift btn-press ${
                    sortBy === "marketCap" ? "bg-white text-black" : "bg-gray-800 border-gray-700 text-gray-300"
                  }`}
                >
                  Market Cap
                </Button>
                <Button
                  variant={sortBy === "price" ? "default" : "outline"}
                  onClick={() => setSortBy("price")}
                  className={`transition-all duration-200 hover-lift btn-press ${
                    sortBy === "price" ? "bg-white text-black" : "bg-gray-800 border-gray-700 text-gray-300"
                  }`}
                >
                  Price
                </Button>
                <Button
                  variant={sortBy === "change24h" ? "default" : "outline"}
                  onClick={() => setSortBy("change24h")}
                  className={`transition-all duration-200 hover-lift btn-press ${
                    sortBy === "change24h" ? "bg-white text-black" : "bg-gray-800 border-gray-700 text-gray-300"
                  }`}
                >
                  24h Change
                </Button>
              </div>
            </div>
          </div>

          {/* Token List with staggered animation */}
          <div className="space-y-4">
            {filteredTokens.map((token, index) => (
              <Card
                key={token.id}
                className={`backdrop-blur-glass border-gray-800/50 hover:bg-white/5 transition-all duration-300 hover-lift card-glow stagger-item`}
                style={{ animationDelay: `${0.6 + index * 0.1}s` }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="hover-scale">
                        <img
                          src={token.image || "/placeholder.svg"}
                          alt={token.channelName}
                          width={50}
                          height={50}
                          className="rounded-full transition-transform duration-200"
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white transition-colors duration-200 hover:text-gray-200">
                          {token.channelName}
                        </h3>
                        <Badge
                          variant="secondary"
                          className="bg-gray-700 text-gray-300 transition-all duration-200 hover:bg-gray-600"
                        >
                          {token.symbol}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center space-x-8">
                      <div className="text-right hover-scale">
                        <div className="text-lg font-semibold text-white">${token.price.toFixed(2)}</div>
                        <div className="text-sm text-gray-400">Price</div>
                      </div>

                      <div className="text-right hover-scale">
                        <div className="text-lg font-semibold text-white">${(token.marketCap / 1000).toFixed(0)}K</div>
                        <div className="text-sm text-gray-400">Market Cap</div>
                      </div>

                      <div className="text-right hover-scale">
                        <div
                          className={`text-lg font-semibold flex items-center transition-all duration-200 ${
                            token.change24h >= 0 ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {token.change24h >= 0 ? (
                            <TrendingUp className="h-4 w-4 mr-1 icon-hover" />
                          ) : (
                            <TrendingDown className="h-4 w-4 mr-1 icon-hover" />
                          )}
                          {token.change24h >= 0 ? "+" : ""}
                          {token.change24h.toFixed(2)}%
                        </div>
                        <div className="text-sm text-gray-400">24h Change</div>
                      </div>

                      <div className="flex space-x-2">
                        <Link to={`/token/${token.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-gray-600 text-gray-300 hover:bg-gray-700 transition-all duration-200 hover-lift btn-press"
                          >
                            Details
                          </Button>
                        </Link>
                        <Link to={`/buy-tokens?token=${token.symbol}`}>
                          <Button
                            size="sm"
                            className="bg-white text-black hover:bg-gray-100 transition-all duration-200 hover-lift btn-press btn-enhanced"
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
  );
}