import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { TrendingUp, Wallet, User, LogOut } from "lucide-react"

export function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  
  const createWallet = async () => {
    const response = await axios.post("http://localhost:8080/api/wallet/create", {withCredentials : true});
    console.log(response.data);
  }
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get("http://localhost:8080/auth/isLoggedIn", {
          withCredentials: true, // IMPORTANT: send cookies
        });

        if (response.data.success) {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        setIsLoggedIn(false);
      }
    };

    checkAuth();
  }, []);
  
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-glass border-b border-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Side */}
          <div className="flex items-center space-x-6">
            <Link to="/" className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-white" />
              <span className="text-xl font-bold text-white">HypeEconomy</span>
            </Link>
            <Link to="/market">
              <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10">
                Market
              </Button>
            </Link>
            <Link to="/buy-tokens">
              <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10">
                Buy Tokens
              </Button>
            </Link>
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            <Link to="/create-token">
              <Button className="bg-white text-black hover:bg-white/50 font-semibold">Create Token</Button>
            </Link>

            {isLoggedIn ? (
              <>
                <Link to="/deposit">
                  <Button
                    variant="outline"
                    className="border-gray-700 text-black hover:bg-white/50 backdrop-blur-sm"
                    onClick={createWallet}
                  >
                    <Wallet className="h-4 w-4 mr-2" />
                    Deposit
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/placeholder-user.jpg" alt="Profile" />
                        <AvatarFallback className="bg-gray-800 text-white">U</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 backdrop-blur-glass border-gray-800" align="end">
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="text-gray-300 hover:text-white">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsLoggedIn(false)} className="text-gray-300 hover:text-white">
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
                  className="text-gray-300 hover:text-white hover:bg-white/10"
                  onClick={() => {
                    window.location.href = "http://localhost:8080/auth/google/callback";
                    setIsLoggedIn(true);
                  }}
                >
                  Sign In
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
