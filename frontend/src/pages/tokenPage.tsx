"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Users, Eye, Heart } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
// import Image from "next/image"

// Mock token data
const tokenData = {
  id: 1,
  symbol: "MRBEAST",
  channelName: "MrBeast",
  image: "/placeholder.svg?height=100&width=100",
  price: 12.45,
  marketCap: 1250000,
  change24h: 5.67,
  volume24h: 125000,
  subscribers: "173M",
  totalViews: "28.5B",
  avgViews: "85M",
  avgLikes: "3.2M",
}

// Mock chart data
const chartData = {
  "1D": [
    { time: "00:00", price: 11.8 },
    { time: "04:00", price: 11.95 },
    { time: "08:00", price: 12.1 },
    { time: "12:00", price: 12.25 },
    { time: "16:00", price: 12.35 },
    { time: "20:00", price: 12.45 },
  ],
  "7D": [
    { time: "Mon", price: 11.2 },
    { time: "Tue", price: 11.45 },
    { time: "Wed", price: 11.8 },
    { time: "Thu", price: 12.1 },
    { time: "Fri", price: 12.25 },
    { time: "Sat", price: 12.35 },
    { time: "Sun", price: 12.45 },
  ],
  "1M": [
    { time: "Week 1", price: 10.5 },
    { time: "Week 2", price: 11.2 },
    { time: "Week 3", price: 11.8 },
    { time: "Week 4", price: 12.45 },
  ],
  "1Y": [
    { time: "Jan", price: 8.5 },
    { time: "Mar", price: 9.2 },
    { time: "May", price: 10.1 },
    { time: "Jul", price: 10.8 },
    { time: "Sep", price: 11.5 },
    { time: "Nov", price: 12.45 },
  ],
}

export default function TokenPage() {
  const [selectedRange, setSelectedRange] = useState<keyof typeof chartData>("7D")

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 grid-background opacity-20"></div>
      <div className="absolute top-40 left-10 w-32 h-32 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full blur-xl float-animation"></div>

      <Navbar />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Token Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-6 mb-6">
              {/* <Image
                src={tokenData.image || "/placeholder.svg"}
                alt={tokenData.channelName}
                width={100}
                height={100}
                className="rounded-full"
              /> */}
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">{tokenData.channelName}</h1>
                <Badge variant="secondary" className="bg-gray-700 text-gray-300 text-lg px-3 py-1">
                  {tokenData.symbol}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <Card className="backdrop-blur-glass border-gray-800/50">
                <CardContent className="p-4 text-center">
                  <Users className="h-8 w-8 text-cyan-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{tokenData.subscribers}</div>
                  <div className="text-sm text-gray-400">Subscribers</div>
                </CardContent>
              </Card>
              <Card className="backdrop-blur-glass border-gray-800/50">
                <CardContent className="p-4 text-center">
                  <Eye className="h-8 w-8 text-cyan-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{tokenData.totalViews}</div>
                  <div className="text-sm text-gray-400">Total Views</div>
                </CardContent>
              </Card>
              <Card className="backdrop-blur-glass border-gray-800/50">
                <CardContent className="p-4 text-center">
                  <Eye className="h-8 w-8 text-cyan-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{tokenData.avgViews}</div>
                  <div className="text-sm text-gray-400">Avg Views</div>
                </CardContent>
              </Card>
              <Card className="backdrop-blur-glass border-gray-800/50">
                <CardContent className="p-4 text-center">
                  <Heart className="h-8 w-8 text-cyan-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{tokenData.avgLikes}</div>
                  <div className="text-sm text-gray-400">Avg Likes</div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Price Chart */}
            <div className="lg:col-span-2">
              <Card className="backdrop-blur-glass border-gray-800/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">Price Chart</CardTitle>
                    <div className="flex space-x-2">
                      {(Object.keys(chartData) as Array<keyof typeof chartData>).map((range) => (
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
                      <LineChart data={chartData[selectedRange]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} />
                        <YAxis stroke="#9CA3AF" fontSize={12} domain={["dataMin - 0.5", "dataMax + 0.5"]} />
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

            {/* Token Stats */}
            <div className="space-y-6">
              <Card className="backdrop-blur-glass border-gray-800/50">
                <CardHeader>
                  <CardTitle className="text-white">Token Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Current Price</span>
                    <span className="text-white font-semibold">${tokenData.price.toFixed(2)} SOL</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Market Cap</span>
                    <span className="text-white font-semibold">${(tokenData.marketCap / 1000).toFixed(0)}K</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">24h Volume</span>
                    <span className="text-white font-semibold">${(tokenData.volume24h / 1000).toFixed(0)}K</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">24h Change</span>
                    <span
                      className={`font-semibold flex items-center ${
                        tokenData.change24h >= 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {tokenData.change24h >= 0 ? (
                        <TrendingUp className="h-4 w-4 mr-1" />
                      ) : (
                        <TrendingDown className="h-4 w-4 mr-1" />
                      )}
                      {tokenData.change24h >= 0 ? "+" : ""}
                      {tokenData.change24h.toFixed(2)}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white py-3">
                Trade {tokenData.symbol}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
