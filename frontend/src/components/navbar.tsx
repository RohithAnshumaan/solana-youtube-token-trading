"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { TrendingUp, Wallet, User, LogOut } from "lucide-react"
import { Link } from "react-router-dom"

export function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "backdrop-blur-glass border-b border-gray-800/50 bg-black/80"
          : "backdrop-blur-glass border-b border-gray-800/30 bg-black/60"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Side */}
          <div className="flex items-center space-x-6">
            <Link to="/" className="flex items-center space-x-2 hover-scale">
              <TrendingUp className="h-8 w-8 text-white icon-hover" />
              <span className="text-xl font-bold text-white">HypeEconomy</span>
            </Link>
            <Link to="/market">
              <Button
                variant="ghost"
                className="text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200 hover-lift"
              >
                Market
              </Button>
            </Link>
            <Link to="/buy-tokens">
              <Button
                variant="ghost"
                className="text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200 hover-lift"
              >
                Buy Tokens
              </Button>
            </Link>
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            <Link to="/create-token">
              <Button className="bg-white text-black hover:bg-gray-100 font-semibold btn-enhanced hover-lift btn-press">
                Create Token
              </Button>
            </Link>

            {isLoggedIn ? (
              <>
                <Link to="/deposit">
                  <Button
                    variant="outline"
                    className="border-gray-700 text-gray-300 hover:bg-white/10 backdrop-blur-sm hover-lift btn-press"
                  >
                    <Wallet className="h-4 w-4 mr-2 icon-hover" />
                    Deposit
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full hover-scale">
                      <Avatar className="h-8 w-8 transition-transform duration-200">
                        <AvatarImage src="/placeholder-user.jpg" alt="Profile" />
                        <AvatarFallback className="bg-gray-800 text-white">U</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 backdrop-blur-glass border-gray-800 slide-up" align="end">
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="text-gray-300 hover:text-white transition-colors duration-200">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setIsLoggedIn(false)}
                      className="text-gray-300 hover:text-white transition-colors duration-200"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  className="text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200 hover-lift"
                  onClick={() => setIsLoggedIn(true)}
                >
                  Sign In
                </Button>
                <Button
                  variant="outline"
                  className="border-gray-700 text-gray-300 hover:bg-white/10 backdrop-blur-sm hover-lift btn-press"
                  onClick={() => setIsLoggedIn(true)}
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
