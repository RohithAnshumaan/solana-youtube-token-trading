"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Wallet, Mail, TrendingUp, ArrowUpRight, ArrowDownLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"

interface walletInterface {
  type: string
  address: string
  secretKey: number
  balance: number
  title: string,
  price: number,
  url: string,
}

interface User {
  googleId: string
  displayName: string
  email: string
  accessToken: string
  refreshToken: string
  solWalletPublicKey: string
  solWalletSecretKey: string
  solBalance: number
  wallets: walletInterface[]
  depositHistory: {
    amount: number
    signature: string
    balanceAfter: number
    timestamp: Date
  }[]
  createdTokens: {
    token_title: string
    token_symbol: string
    thumbnail_url: string
    initial_price: number
    pool_supply: number
    pool_sol: number
    market_cap: number
    created_at: Date
  }[]
  channelInfo: {
    avgRecentLikes: number
    avgRecentViews: number
    channelHandle: string
    channelName: string
    subscribers: number
    thumbnailUrl: string
    totalVideos: number
    totalViews: number
  }[]
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const navigate = useNavigate();


  useEffect(() => {
    const getProfile = async () => {
      const response = await axios.get<{ user: User }>("http://localhost:8080/api/profile", { withCredentials: true })
      console.log(response.data.user);
      setUser(response.data.user)
    }
    getProfile()
  }, [])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading...
      </div>
    );
  }

  const transactions = [
    {
      type: "buy",
      token: "MRBST",
      amount: 100,
      total: 1200,
      date: "2025-06-12",
      status: "confirmed",
    },
    {
      type: "deposit",
      token: "SOL",
      amount: 2,
      total: 300,
      date: "2025-06-11",
      status: "confirmed",
    },
  ]

  // const totalPortfolioValue =
  //   (holdings?.reduce((sum, holding) => sum + holding.value, 0) || 0) + (user?.solBalance || 0) * 85.5

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 grid-background opacity-20"></div>
      <div className="absolute bottom-20 right-20 w-36 h-36 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-xl float-animation"></div>

      <Navbar />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl font-bold gradient-text mb-8">Profile Dashboard</h1>

          <div className="grid lg:grid-cols-3 gap-8 mb-8">
            {/* Profile Info */}
            <Card className="backdrop-blur-glass border-gray-800/50">
              <CardHeader><CardTitle className="text-white">Profile Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src="/placeholder-user.jpg" alt="Profile" />
                    <AvatarFallback className="bg-gray-700 text-white text-xl">
                      {user?.displayName?.charAt(0) ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div><div className="text-white font-semibold text-lg">{user.displayName}</div></div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-300">{user.email}</span>
                  </div>
                  {user.wallets?.[0]?.address && (
                    <div className="flex items-center space-x-2">
                      <Wallet className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-300 font-mono text-sm">
                        {user.wallets[0].address.slice(0, 6)}...{user.wallets[0].address.slice(-4)}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* SOL Balance */}
            <Card className="backdrop-blur-glass border-gray-800/50">
              <CardHeader><CardTitle className="text-white">Current Balance</CardTitle></CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-2">{user.solBalance ?? 0} SOL</div>
                  <Button onClick={() => navigate("/deposit")} className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">Deposit SOL</Button>
                </div>
              </CardContent>
            </Card>

            {/* Portfolio Value */}
            <Card className="backdrop-blur-glass border-gray-800/50">
              <CardHeader><CardTitle className="text-white">Portfolio Value</CardTitle></CardHeader>
              <CardContent>
                <div className="text-center">
                  {/* <div className="text-3xl font-bold text-white mb-2">${totalPortfolioValue.toFixed(2)}</div> */}
                  <div className="text-gray-400 mb-2">Total Portfolio</div>
                  <div className="text-green-400 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 mr-1" /> +8.5% (24h)
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Created Tokens */}
          <Card className="backdrop-blur-glass border-gray-800/50 mb-8">
            <CardHeader><CardTitle className="text-white">Created Tokens</CardTitle></CardHeader>
            <CardContent>
              {user.createdTokens?.length ? (
                <div className="space-y-4">
                  {user.createdTokens.map((token, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                      <div>
                        <div className="text-white font-semibold">{token.token_title}</div>
                        <Badge variant="secondary" className="bg-gray-700 text-gray-300">{token.token_symbol}</Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-semibold">${token.pool_sol.toFixed(2)}</div>
                        <div className="text-sm text-gray-400">Market Cap: ${(token.market_cap / 1000).toFixed(0)}K</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">You haven't created any tokens yet</div>
                  <Button onClick={() => navigate("/create-token")} className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
                    Create Your First Token
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Holdings */}
          <Card className="backdrop-blur-glass border-gray-800/50 mb-8">
            <CardHeader><CardTitle className="text-white">Your Holdings</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {user.wallets.map((holding, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="hover-scale">
                        <img
                          src={holding.url}
                          alt={holding.title}
                          width={50}
                          height={50}
                          className="rounded-full transition-transform duration-200"
                        />
                      </div>
                      <div>
                        <div className="text-white font-semibold">{holding.title.replace(/ Token$/i, '')}</div>
                        <Badge variant="secondary" className="bg-gray-700 text-gray-300">{holding.type}</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-semibold">{holding.balance} tokens</div>
                      <div className="text-gray-400">${(holding.balance * holding.price).toFixed(2)}</div>
                      {/* <div className={`text-sm flex items-center ${holding.change24h >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {holding.change24h >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                        {holding.change24h >= 0 ? "+" : ""}{holding.change24h.toFixed(2)}%
                      </div> */}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Transactions */}
          <Card className="backdrop-blur-glass border-gray-800/50">
            <CardHeader><CardTitle className="text-white">Transaction History</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.map((tx, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full ${tx.type === "buy" ? "bg-green-900" : tx.type === "sell" ? "bg-red-900" : "bg-blue-900"}`}>
                        {tx.type === "buy" ? <ArrowDownLeft className="h-4 w-4 text-green-400" />
                          : tx.type === "sell" ? <ArrowUpRight className="h-4 w-4 text-red-400" />
                            : <Wallet className="h-4 w-4 text-blue-400" />}
                      </div>
                      <div>
                        <div className="text-white font-semibold capitalize">{tx.type} {tx.token}</div>
                        <div className="text-gray-400 text-sm">{tx.date}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-semibold">
                        {tx.type === "deposit" ? "+" : ""}{tx.amount} {tx.token}
                      </div>
                      <div className="text-gray-400 text-sm">${tx.total.toFixed(2)}</div>
                      <Badge variant="secondary" className="bg-green-900 text-green-400 text-xs">{tx.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center mt-6">
                <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                  View All Transactions
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
