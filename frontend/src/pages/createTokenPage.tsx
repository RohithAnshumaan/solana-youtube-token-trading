"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Eye, Heart, Play, DollarSign, Coins } from "lucide-react"
import axios from "axios"
import LiquidityPoolDetails from "@/components/poolDetails"

interface channelData {
  avgRecentLikes: number,
  avgRecentViews: number,
  channelHandle: string,
  channelName: string,
  subscribers: number,
  thumbnailUrl: string,
  totalVideos: number,
  totalViews: number
}

interface channelToken {
  mint_address: string,
  token_symbol: string,
  token_title: string,
  initial_price: number,
  pool_supply: number,
  pool_sol: number,
  market_cap: number
}

interface channelTokenResponse {
  message: string,
  data: channelToken,
}

interface AMMResponse {
  message: string,
  liquidity_pool: poolData
}

interface poolData {
  poolAccount: string,
  poolTokenAccount: string,
  poolSolAccount: string
}

export default function CreateTokenPage() {
  const [step, setStep] = useState(1)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [data, setData] = useState<channelData | null>(null);
  const [token, setToken] = useState<channelToken | null>(null);
  const [poolData, setPoolData] = useState<poolData | null>(null);

  useEffect(() => {
    setIsLoaded(true)
    const createToken = async () => {
      const response = await axios.get<channelData>("http://localhost:8080/api/token/fetch", { withCredentials: true });
      setData(response.data);
    }
    createToken();
  }, [])

  const createAmm = async () => {
    const response = await axios.post<AMMResponse>("http://localhost:8080/api/token/create-amm", {}, { withCredentials: true });
    setPoolData(response.data.liquidity_pool);
    setStep(3);
  }

  const handleStepTransition = async (newStep: number) => {
    setIsTransitioning(true);

    try {
      // Make your API call first
      const getData = await axios.post<channelTokenResponse>(
        "http://localhost:8080/api/token/create-token",
        {},
        { withCredentials: true }
      );
      setToken(getData.data.data);
      // After the API call completes, give time for the fade-out
      setTimeout(() => {
        setStep(newStep);
        setIsTransitioning(false);
      }, 300);
    } catch (error) {
      console.error("Error creating token:", error);
      setIsTransitioning(false);
      // Optionally show a toast or error message
    }
  };


  return (
    <div className={`min-h-screen bg-black relative overflow-hidden ${isLoaded ? "page-transition" : ""}`}>
      {/* Background effects */}
      <div className="absolute inset-0 grid-background opacity-20"></div>
      <div className="absolute top-32 right-16 w-40 h-40 bg-gradient-to-r from-white/3 to-gray-300/3 rounded-full blur-2xl float-animation"></div>

      <Navbar />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          <h1 className={`text-5xl font-bold gradient-text mb-8 ${isLoaded ? "slide-up" : ""}`}>Create Your Token</h1>

          <div
            className={`transition-all duration-300 ${isTransitioning ? "opacity-0 transform translate-y-4" : "opacity-100 transform translate-y-0"}`}
          >
            {step === 1 && (
              <div className="space-y-8">
                {/* Channel Information */}
                <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm hover-lift card-glow fade-in">
                  <CardHeader>
                    <CardTitle className="text-white">YouTube Channel Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-6 mb-8">
                      <div className="hover-scale">
                        <img
                          src={data?.thumbnailUrl || "/placeholder.svg"}
                          alt={data?.channelName || "Channel Thumbnail"}
                          width={100}
                          height={100}
                          className="rounded-full transition-transform duration-200"
                        />
                      </div>

                      <div>
                        <h2 className="text-2xl font-bold text-white mb-2">{data?.channelName}</h2>
                        <p className="text-gray-400 text-lg">{data?.channelHandle}</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="bg-gray-800/50 rounded-lg p-4 text-center border border-gray-700 hover-lift card-glow stagger-item">
                        <Users className="h-8 w-8 text-white mx-auto mb-2 icon-hover" />
                        <div className="text-2xl font-bold text-white">{data?.subscribers}</div>
                        <div className="text-sm text-gray-400">Subscribers</div>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-4 text-center border border-gray-700 hover-lift card-glow stagger-item">
                        <Eye className="h-8 w-8 text-white mx-auto mb-2 icon-hover" />
                        <div className="text-2xl font-bold text-white">{data?.totalViews}</div>
                        <div className="text-sm text-gray-400">Total Views</div>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-4 text-center border border-gray-700 hover-lift card-glow stagger-item">
                        <Play className="h-8 w-8 text-white mx-auto mb-2 icon-hover" />
                        <div className="text-2xl font-bold text-white">{data?.avgRecentViews}</div>
                        <div className="text-sm text-gray-400">Avg Views</div>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-4 text-center border border-gray-700 hover-lift card-glow stagger-item">
                        <Heart className="h-8 w-8 text-white mx-auto mb-2 icon-hover" />
                        <div className="text-2xl font-bold text-white">{data?.avgRecentLikes}</div>
                        <div className="text-sm text-gray-400">Avg Likes</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-center space-x-4 slide-up" style={{ animationDelay: "0.6s" }}>
                  <Button
                    onClick={() => handleStepTransition(2)}
                    className="bg-white text-black hover:bg-gray-100 px-8 py-3 font-semibold btn-enhanced hover-lift btn-press"
                  >
                    Confirm
                  </Button>
                  <Button
                    variant="outline"
                    className="border-gray-600 text-black hover:bg-white/10 px-8 py-3 hover-lift btn-press"
                  >
                    Not This Channel?
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8">
                {/* Tokenomics Display (Fetched from DB) */}
                <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm hover-lift card-glow fade-in">
                  <CardHeader>
                    <CardTitle className="text-white">Token Configuration</CardTitle>
                    <p className="text-gray-400">Based on your channel analytics and our algorithm</p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="bg-gray-800/50 rounded-lg p-4 text-center border border-gray-700 hover-lift card-glow stagger-item">
                        <DollarSign className="h-8 w-8 text-white mx-auto mb-2 icon-hover" />
                        <div className="text-2xl font-bold text-white">{token?.initial_price}</div>
                        <div className="text-sm text-gray-400">Initial Price</div>
                        <div className="text-xs text-gray-500 mt-1">Algorithm Calculated</div>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-4 text-center border border-gray-700 hover-lift card-glow stagger-item">
                        <Coins className="h-8 w-8 text-white mx-auto mb-2 icon-hover" />
                        <div className="text-2xl font-bold text-white">{token?.pool_supply}</div>
                        <div className="text-sm text-gray-400">Token Supply</div>
                        <div className="text-xs text-gray-500 mt-1">Based on Subscribers</div>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-4 text-center border border-gray-700 hover-lift card-glow stagger-item">
                        <DollarSign className="h-8 w-8 text-white mx-auto mb-2 icon-hover" />
                        <div className="text-2xl font-bold text-white">{token?.market_cap}</div>
                        <div className="text-sm text-gray-400">Initial Market Cap</div>
                        <div className="text-xs text-gray-500 mt-1">Auto Generated</div>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-4 text-center border border-gray-700 hover-lift card-glow stagger-item">
                        <DollarSign className="h-8 w-8 text-white mx-auto mb-2 icon-hover" />
                        <div className="text-2xl font-bold text-white">{token?.pool_sol}</div>
                        <div className="text-sm text-gray-400">Required Liquidity</div>
                        <div className="text-xs text-gray-500 mt-1">Platform Calculated</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Token Symbol Display */}
                <Card
                  className="bg-gray-900/50 border-gray-800 backdrop-blur-sm hover-lift card-glow slide-up"
                  style={{ animationDelay: "0.3s" }}
                >
                  <CardHeader>
                    <CardTitle className="text-white">Your Token</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center space-x-4 p-8">
                      <div className="hover-scale">
                        <img
                          src={data?.thumbnailUrl || "/placeholder.svg"}
                          alt={data?.channelName || "Channel Thumbnail"}
                          width={100}
                          height={100}
                          className="rounded-full transition-transform duration-200" />
                      </div>
                      <div className="text-center">
                        <div className="text-4xl font-bold text-white mb-2">$TECH</div>
                        <div className="text-gray-400">Token Symbol</div>
                        <div className="text-xs text-gray-500 mt-1">Generated from channel name</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-center slide-up" style={{ animationDelay: "0.6s" }}>
                  <Button className="bg-white text-black hover:bg-gray-100 px-8 py-3 text-lg font-semibold btn-enhanced hover-lift btn-press ripple" onClick={createAmm}>
                    Connect Wallet & Create Token
                  </Button>
                </div>
              </div>
            )}
            {step === 3 && poolData && (
            <LiquidityPoolDetails poolData={poolData} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
