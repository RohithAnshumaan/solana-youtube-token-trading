"use client"

import { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, Zap, Shield } from "lucide-react"
import { Link } from "react-router-dom"

export default function HomePage() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [counters, setCounters] = useState({
    volume: 0,
    tokens: 0,
    traders: 0,
    uptime: 0,
  })

  useEffect(() => {
    setIsLoaded(true)

    // Animate counters
    const animateCounter = (target: number, key: keyof typeof counters) => {
      let current = 0
      const increment = target / 100
      const timer = setInterval(() => {
        current += increment
        if (current >= target) {
          current = target
          clearInterval(timer)
        }
        setCounters((prev) => ({ ...prev, [key]: Math.floor(current) }))
      }, 20)
    }

    const timer = setTimeout(() => {
      animateCounter(2500000, "volume")
      animateCounter(150, "tokens")
      animateCounter(10000, "traders")
      animateCounter(99.9, "uptime")
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className={`min-h-screen bg-black relative overflow-hidden ${isLoaded ? "page-transition" : ""}`}>
      {/* Animated background grid */}
      <div className="absolute inset-0 grid-background opacity-30"></div>

      {/* Enhanced floating orbs */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-white/5 to-gray-300/5 rounded-full blur-xl float-animation"></div>
      <div
        className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-gray-200/5 to-white/5 rounded-full blur-xl float-animation"
        style={{ animationDelay: "2s" }}
      ></div>
      <div
        className="absolute bottom-40 left-1/4 w-40 h-40 bg-gradient-to-r from-white/3 to-gray-400/3 rounded-full blur-2xl float-animation"
        style={{ animationDelay: "4s" }}
      ></div>

      <Navbar />

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-gray-200/5 to-gray-300/5 blur-3xl"></div>
            <div className="relative">
              <h1 className={`text-6xl md:text-8xl font-bold text-white mb-6 ${isLoaded ? "slide-up" : ""}`}>
                Tokenize Your
                <span className="gradient-text block">YouTube Empire</span>
              </h1>
              <p
                className={`text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed ${isLoaded ? "fade-in" : ""}`}
                style={{ animationDelay: "0.3s" }}
              >
                Transform your YouTube channel into tradable digital assets. Let your community invest in your success
                and build the future of creator economy together.
              </p>
              <div
                className={`flex flex-col sm:flex-row gap-6 justify-center ${isLoaded ? "slide-up" : ""}`}
                style={{ animationDelay: "0.6s" }}
              >
                <Link to="/create-token">
                  <Button
                    size="lg"
                    className="bg-white text-black hover:bg-gray-100 px-10 py-4 text-lg font-semibold btn-enhanced hover-lift btn-press ripple"
                  >
                    Launch Your Token
                  </Button>
                </Link>
                <Link to="/market">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-white/10 backdrop-blur-sm px-10 py-4 text-lg hover-lift btn-press"
                  >
                    Explore Market
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2
            className={`text-3xl font-bold text-white text-center mb-12 ${isLoaded ? "fade-in" : ""}`}
            style={{ animationDelay: "0.8s" }}
          >
            Why Choose HypeEconomy?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className={`bg-gray-900/50 border-gray-800 backdrop-blur-sm hover-lift card-glow stagger-item`}>
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-12 w-12 text-white mx-auto mb-4 icon-hover" />
                <h3 className="text-xl font-semibold text-white mb-2">Liquid Markets</h3>
                <p className="text-gray-400">Trade creator tokens with real-time pricing and deep liquidity pools.</p>
              </CardContent>
            </Card>
            <Card className={`bg-gray-900/50 border-gray-800 backdrop-blur-sm hover-lift card-glow stagger-item`}>
              <CardContent className="p-6 text-center">
                <Zap className="h-12 w-12 text-white mx-auto mb-4 icon-hover" />
                <h3 className="text-xl font-semibold text-white mb-2">Instant Trading</h3>
                <p className="text-gray-400">Execute trades instantly with our advanced matching engine.</p>
              </CardContent>
            </Card>
            <Card className={`bg-gray-900/50 border-gray-800 backdrop-blur-sm hover-lift card-glow stagger-item`}>
              <CardContent className="p-6 text-center">
                <Shield className="h-12 w-12 text-white mx-auto mb-4 icon-hover" />
                <h3 className="text-xl font-semibold text-white mb-2">Secure Platform</h3>
                <p className="text-gray-400">Built on Solana with enterprise-grade security and transparency.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Enhanced Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="hover-scale">
              <div className="text-3xl font-bold text-white mb-2 counter">
                $
                {counters.volume >= 1000000
                  ? `${(counters.volume / 1000000).toFixed(1)}M`
                  : `${(counters.volume / 1000).toFixed(0)}K`}
                +
              </div>
              <div className="text-gray-400">Total Volume</div>
            </div>
            <div className="hover-scale">
              <div className="text-3xl font-bold text-white mb-2 counter">{counters.tokens}+</div>
              <div className="text-gray-400">Active Tokens</div>
            </div>
            <div className="hover-scale">
              <div className="text-3xl font-bold text-white mb-2 counter">
                {counters.traders >= 1000 ? `${(counters.traders / 1000).toFixed(0)}K` : counters.traders}+
              </div>
              <div className="text-gray-400">Traders</div>
            </div>
            <div className="hover-scale">
              <div className="text-3xl font-bold text-white mb-2 counter">{counters.uptime.toFixed(1)}%</div>
              <div className="text-gray-400">Uptime</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
