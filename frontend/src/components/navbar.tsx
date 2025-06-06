"use client"

import { useState, useEffect } from "react"
import { Menu, Zap, TrendingUp, ShoppingCart, Plus, LogIn, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  
  useEffect(() => {
  const token = localStorage.getItem("token");
  setIsAuthenticated(!!token);
}, []);

  return (
    <nav className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left Side */}
          <div className="flex items-center space-x-6">
            {/* Logo + App Name */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">HypeEconomy</span>
            </div>

            {/* Desktop Navigation - Left */}
            <div className="hidden md:flex items-center space-x-4">
              <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"  onClick={() => window.location.href = "/market"}>
                <TrendingUp className="mr-2 h-4 w-4" />
                Market
              </Button>
              <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-gray-800 transition-colors">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Buy Tokens
              </Button>
            </div>
          </div>

          {/* Right Side */}
          <div className="hidden md:flex items-center space-x-3">
            <Button
              variant="outline"
              className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 transition-colors"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Token
            </Button>
            {isAuthenticated ? (
              <>
                <Button
                  variant="ghost"
                  className="text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                  onClick={() => window.location.href = "/deposit"}
                >
                  {/* <Wallet className="mr-2 h-4 w-4" /> */}
                  Deposit
                </Button>
                <Button
                  variant="ghost"
                  className="text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                  onClick={() => window.location.href = "/profile"}
                >
                  {/* <User className="mr-2 h-4 w-4" /> */}
                  Profile
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  className="text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                  onClick={() => {
                    window.location.href = "http://localhost:8080/auth/google";
                  }}
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Login
                </Button>
                <Button
                  className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white transition-all duration-300"
                  onClick={() => {
                    window.location.href = "http://localhost:8080/auth/google";
                  }}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Sign Up
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-black border-gray-800 text-white">
                <div className="flex flex-col space-y-4 mt-8">
                  {/* Mobile Navigation Links */}
                  <Button
                    variant="ghost"
                    className="justify-start text-gray-300 hover:text-white hover:bg-gray-800"
                    onClick={() => setIsOpen(false)}
                  >
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Market
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start text-gray-300 hover:text-white hover:bg-gray-800"
                    onClick={() => setIsOpen(false)}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Buy Tokens
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                    onClick={() => setIsOpen(false)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Token
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                    onClick={() => setIsOpen(false)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Deposit
                  </Button>

                  <div className="border-t border-gray-800 pt-4 mt-4">
                    <Button
                      variant="ghost"
                      className="justify-start w-full text-gray-300 hover:text-white hover:bg-gray-800"
                      onClick={() => setIsOpen(false)}
                    >
                      <LogIn className="mr-2 h-4 w-4" />
                      Login
                    </Button>
                    <Button
                      className="justify-start w-full mt-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
                      onClick={() => setIsOpen(false)}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Sign Up
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}
