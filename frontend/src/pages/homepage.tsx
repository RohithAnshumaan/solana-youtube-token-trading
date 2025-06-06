"use client"

import { useState, useEffect} from "react"
import { TrendingUp, TrendingDown, Play, Users, Eye, Heart, ArrowRight, Zap, Star, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Navbar from "@/components/navbar"

// Mock data for featured YouTubers/tokens
const featuredTokens = [
  {
    id: 1,
    name: "MrBeast",
    symbol: "BEAST",
    price: 156.78,
    change: 12.5,
    subscribers: "224M",
    views: "45.2B",
    engagement: 8.9,
    avatar: "/placeholder.svg?height=40&width=40",
    verified: true,
  },
  {
    id: 2,
    name: "PewDiePie",
    symbol: "PEWDS",
    price: 89.32,
    change: -3.2,
    subscribers: "111M",
    views: "29.1B",
    engagement: 7.2,
    avatar: "/placeholder.svg?height=40&width=40",
    verified: true,
  },
  {
    id: 3,
    name: "Dude Perfect",
    symbol: "DUDE",
    price: 67.45,
    change: 8.7,
    subscribers: "59.5M",
    views: "15.8B",
    engagement: 9.1,
    avatar: "/placeholder.svg?height=40&width=40",
    verified: true,
  },
  {
    id: 4,
    name: "Markiplier",
    symbol: "MARK",
    price: 45.23,
    change: 15.3,
    subscribers: "35.8M",
    views: "21.4B",
    engagement: 8.5,
    avatar: "/placeholder.svg?height=40&width=40",
    verified: true,
  },
]

const marketStats = {
  totalMarketCap: "2.4B",
  totalVolume: "156M",
  activeTokens: "1,247",
  topGainer: { name: "Markiplier", change: 15.3 },
}

export default function HomePage() {
  const [hoveredToken, setHoveredToken] = useState<number | null>(null)
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      localStorage.setItem("token", token);
      window.history.replaceState({}, document.title, "/"); // Clean URL
      window.location.reload(); // Optional: forces re-render with auth state
    }
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-cyan-900/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" />

        <div className="relative container mx-auto px-4 py-20 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20 rounded-full px-4 py-2 mb-8">
              <Zap className="h-4 w-4 text-cyan-400" />
              <span className="text-sm text-gray-300">Trade the Future of Content</span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
              HypeEconomy
            </h1>

            <p className="text-xl lg:text-2xl text-gray-300 mb-8 leading-relaxed">
              Trade tokens representing your favorite YouTubers.
              <br className="hidden sm:block" />
              Real-time value based on live YouTube metrics.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white px-8 py-3 text-lg"
              >
                Start Trading
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-gray-600 text-gray-300 hover:bg-gray-800 px-8 py-3 text-lg"
              >
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>

            {/* Market Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-2xl lg:text-3xl font-bold text-cyan-400">${marketStats.totalMarketCap}</div>
                <div className="text-sm text-gray-400">Market Cap</div>
              </div>
              <div className="text-center">
                <div className="text-2xl lg:text-3xl font-bold text-purple-400">${marketStats.totalVolume}</div>
                <div className="text-sm text-gray-400">24h Volume</div>
              </div>
              <div className="text-center">
                <div className="text-2xl lg:text-3xl font-bold text-green-400">{marketStats.activeTokens}</div>
                <div className="text-sm text-gray-400">Active Tokens</div>
              </div>
              <div className="text-center">
                <div className="text-2xl lg:text-3xl font-bold text-yellow-400">+{marketStats.topGainer.change}%</div>
                <div className="text-sm text-gray-400">Top Gainer</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Tokens Section */}
      <section className="py-20 bg-gradient-to-b from-black to-gray-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Featured Tokens
            </h2>
            <p className="text-gray-400 text-lg">Top performing YouTuber tokens in the market</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredTokens.map((token) => (
              <Card
                key={token.id}
                className="bg-gray-900/50 border-gray-800 hover:border-purple-500/50 transition-all duration-300 cursor-pointer group"
                onMouseEnter={() => setHoveredToken(token.id)}
                onMouseLeave={() => setHoveredToken(null)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={token.avatar || "/placeholder.svg"} alt={token.name} />
                        <AvatarFallback>{token.name.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-1">
                          <CardTitle className="text-lg text-white">{token.name}</CardTitle>
                          {token.verified && <Star className="h-4 w-4 text-yellow-400 fill-current" />}
                        </div>
                        <p className="text-sm text-gray-400">${token.symbol}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-white">${token.price}</span>
                    <Badge
                      variant={token.change > 0 ? "default" : "destructive"}
                      className={`${token.change > 0
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : "bg-red-500/20 text-red-400 border-red-500/30"
                        }`}
                    >
                      {token.change > 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {Math.abs(token.change)}%
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between text-gray-400">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>Subscribers</span>
                      </div>
                      <span className="text-white">{token.subscribers}</span>
                    </div>

                    <div className="flex items-center justify-between text-gray-400">
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>Total Views</span>
                      </div>
                      <span className="text-white">{token.views}</span>
                    </div>

                    <div className="flex items-center justify-between text-gray-400">
                      <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        <span>Engagement</span>
                      </div>
                      <span className="text-white">{token.engagement}/10</span>
                    </div>
                  </div>

                  <Button
                    className={`w-full transition-all duration-300 ${hoveredToken === token.id
                      ? "bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
                      : "bg-gray-800 hover:bg-gray-700"
                      }`}
                  >
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Trade Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              How It Works
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Our platform uses real-time YouTube data to determine token values, creating a dynamic trading experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-white">Choose Your Creator</h3>
              <p className="text-gray-400">
                Browse and select from thousands of YouTuber tokens based on your favorite content creators
              </p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-cyan-600 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-white">Real-Time Valuation</h3>
              <p className="text-gray-400">
                Token prices fluctuate based on live YouTube metrics including subscribers, views, and engagement
              </p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-white">Trade & Profit</h3>
              <p className="text-gray-400">
                Buy low, sell high as creator performance changes. Build your portfolio of digital creator assets
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-900/20 via-blue-900/20 to-cyan-900/20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Ready to Start Trading?
          </h2>
          <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of traders already profiting from the creator economy. Start with just $10 and build your
            digital portfolio.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white px-8 py-3 text-lg"
            >
              Create Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-gray-600 text-gray-300 hover:bg-gray-800 px-8 py-3 text-lg"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-gray-800 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg flex items-center justify-center">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">HypeEconomy</span>
              </div>
              <p className="text-gray-400 text-sm">
                The future of creator economy trading. Trade tokens representing your favorite YouTubers.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Market
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Trading
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Portfolio
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Analytics
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    API Docs
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Status
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Risk Disclosure
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 HypeEconomy. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
