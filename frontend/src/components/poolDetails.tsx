"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Copy, ArrowLeft, TrendingUp } from "lucide-react"
import { useNavigate } from "react-router-dom";


interface PoolDetailsProps {
  poolData: {
    poolAccount: string
    poolTokenAccount: string
    poolSolAccount: string
  }
}

export default function LiquidityPoolDetails({ poolData }: PoolDetailsProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)
  
  const navigate = useNavigate();


  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`
  }

  return (
    <div className="min-h-screen bg-black text-white relative">
      <div className="relative z-10 max-w-4xl mx-auto p-6 md:p-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-white/10 rounded-full p-4">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            Liquidity Pool Created!
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Your YouTube channel token liquidity pool is now live and ready for trading on{" "}
            <span className="text-white font-semibold">HypeEconomy</span>.
          </p>
        </div>

        {/* Pool Details Card */}
        <Card className="bg-black border border-gray-700 shadow-lg mb-8">
          <CardHeader className="border-b border-gray-700">
            <CardTitle className="text-2xl flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-green-500" />
              <span>Pool Details</span>
            </CardTitle>
            <CardDescription className="text-gray-400">
              Your liquidity pool addresses and account information
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {[
              { label: "POOL ACCOUNT", value: poolData.poolAccount, field: "poolAccount" },
              { label: "POOL TOKEN ACCOUNT", value: poolData.poolTokenAccount, field: "poolTokenAccount" },
              { label: "POOL SOL ACCOUNT", value: poolData.poolSolAccount, field: "poolSolAccount" }
            ].map((item) => (
              <div key={item.field}>
                <label className="block text-sm font-semibold text-white mb-2">{item.label}</label>
                <div className="flex items-center text-white justify-between bg-gray-800/50 rounded-lg px-4 py-3 border border-gray-700 hover:border-gray-500 transition-all">
                  <p className="font-mono text-base break-all">
                    {truncateAddress(item.value)}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(item.value, item.field)}
                      className="text-gray-400 hover:text-white"
                    >
                      {copiedField === item.field ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button
            variant="outline"
            size="lg"
            className="border-gray-700 text-black hover:bg-gray-800 hover:text-white px-8 py-4"
            onClick={() => navigate("/market")}
          >
            <ArrowLeft className="w-5 h-5 mr-3" />
            Go Back
          </Button>
        </div>

        {/* Additional Info */}
        <div className="text-center">
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8 max-w-2xl mx-auto">
            <h3 className="text-xl font-bold mb-4">What's Next?</h3>
            <p className="text-gray-300">
              Your liquidity pool is now live! Users can start trading your YouTube channel tokens. Monitor your pool's
              performance and trading activity from your dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
