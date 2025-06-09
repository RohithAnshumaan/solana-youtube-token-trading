import { Navbar } from "@/components/navbar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from "@/components/ui/avatar";
import {
  Wallet,
  Mail,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft
} from "lucide-react";

// Mock user data
const userData = {
  email: "user@example.com",
  walletAddress: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  balance: 15.67,
  joinDate: "January 2024",
};

const createdTokens = [
  {
    symbol: "TECH",
    channelName: "Tech Reviews Pro",
    image: "/placeholder.svg?height=40&width=40",
    price: 2.45,
    marketCap: 245000,
    change24h: 12.5,
  },
];

const holdings = [
  {
    symbol: "MRBEAST",
    channelName: "MrBeast",
    image: "/placeholder.svg?height=40&width=40",
    amount: 150,
    value: 1867.5,
    change24h: 5.67,
  },
  {
    symbol: "MKBHD",
    channelName: "Marques Brownlee",
    image: "/placeholder.svg?height=40&width=40",
    amount: 75,
    value: 1175.25,
    change24h: 8.91,
  },
  {
    symbol: "PEWDIE",
    channelName: "PewDiePie",
    image: "/placeholder.svg?height=40&width=40",
    amount: 200,
    value: 1784.0,
    change24h: -2.34,
  },
];

const transactions = [
  {
    type: "buy",
    token: "MRBEAST",
    amount: 50,
    price: 12.45,
    total: 622.5,
    date: "2024-01-15 14:30",
    status: "Completed",
  },
  {
    type: "sell",
    token: "PEWDIE",
    amount: 25,
    price: 8.92,
    total: 223.0,
    date: "2024-01-14 09:15",
    status: "Completed",
  },
  {
    type: "deposit",
    token: "SOL",
    amount: 5.0,
    price: 85.5,
    total: 427.5,
    date: "2024-01-13 16:45",
    status: "Completed",
  },
  {
    type: "buy",
    token: "MKBHD",
    amount: 25,
    price: 15.67,
    total: 391.75,
    date: "2024-01-12 11:20",
    status: "Completed",
  },
];

export default function ProfilePage() {
  const totalPortfolioValue =
    holdings.reduce((sum, holding) => sum + holding.value, 0) +
    userData.balance * 85.5;

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 grid-background opacity-20"></div>
      <div className="absolute bottom-20 right-20 w-36 h-36 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-xl float-animation"></div>

      <Navbar />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl font-bold gradient-text mb-8">
            Profile Dashboard
          </h1>

          {/* User Info & Balance */}
          <div className="grid lg:grid-cols-3 gap-8 mb-8">
            {/* Profile Info */}
            <Card className="backdrop-blur-glass border-gray-800/50">
              <CardHeader>
                <CardTitle className="text-white">
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage
                      src="/placeholder-user.jpg"
                      alt="Profile"
                    />
                    <AvatarFallback className="bg-gray-700 text-white text-xl">
                      U
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-white font-semibold text-lg">
                      User Profile
                    </div>
                    <div className="text-gray-400">
                      Member since {userData.joinDate}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-300">{userData.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Wallet className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-300 font-mono text-sm">
                      {userData.walletAddress.slice(0, 8)}...
                      {userData.walletAddress.slice(-8)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Balance */}
            <Card className="backdrop-blur-glass border-gray-800/50">
              <CardHeader>
                <CardTitle className="text-white">
                  Current Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-2">
                    {userData.balance} SOL
                  </div>
                  <div className="text-gray-400 mb-4">
                    ≈ ${ (userData.balance * 85.5).toFixed(2) } USD
                  </div>
                  <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
                    Deposit Funds
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Portfolio Value */}
            <Card className="backdrop-blur-glass border-gray-800/50">
              <CardHeader>
                <CardTitle className="text-white">
                  Portfolio Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-2">
                    ${totalPortfolioValue.toFixed(2)}
                  </div>
                  <div className="text-gray-400 mb-2">Total Portfolio</div>
                  <div className="text-green-400 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    +8.5% (24h)
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Created Tokens */}
          <Card className="backdrop-blur-glass border-gray-800/50 mb-8">
            <CardHeader>
              <CardTitle className="text-white">Created Tokens</CardTitle>
            </CardHeader>
            <CardContent>
              {createdTokens.length > 0 ? (
                <div className="space-y-4">
                  {createdTokens.map((token, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <img
                          src={token.image || "/placeholder.svg"}
                          alt={token.channelName}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                        <div>
                          <div className="text-white font-semibold">
                            {token.channelName}
                          </div>
                          <Badge
                            variant="secondary"
                            className="bg-gray-700 text-gray-300"
                          >
                            {token.symbol}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-semibold">
                          ${token.price.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-400">
                          Market Cap: $
                          {(token.marketCap / 1000).toFixed(0)}K
                        </div>
                        <div className="text-green-400 text-sm flex items-center">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          +{token.change24h.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">
                    You haven't created any tokens yet
                  </div>
                  <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
                    Create Your First Token
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Holdings */}
          <Card className="backdrop-blur-glass border-gray-800/50 mb-8">
            <CardHeader>
              <CardTitle className="text-white">Your Holdings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {holdings.map((holding, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <img
                        src={holding.image || "/placeholder.svg"}
                        alt={holding.channelName}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                      <div>
                        <div className="text-white font-semibold">
                          {holding.channelName}
                        </div>
                        <Badge
                          variant="secondary"
                          className="bg-gray-700 text-gray-300"
                        >
                          {holding.symbol}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-semibold">
                        {holding.amount} tokens
                      </div>
                      <div className="text-gray-400">
                        ${holding.value.toFixed(2)}
                      </div>
                      <div
                        className={`text-sm flex items-center ${
                          holding.change24h >= 0
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {holding.change24h >= 0 ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {holding.change24h >= 0 ? "+" : ""}
                        {holding.change24h.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card className="backdrop-blur-glass border-gray-800/50">
            <CardHeader>
              <CardTitle className="text-white">
                Transaction History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.map((tx, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`p-2 rounded-full ${
                          tx.type === "buy"
                            ? "bg-green-900"
                            : tx.type === "sell"
                            ? "bg-red-900"
                            : "bg-blue-900"
                        }`}
                      >
                        {tx.type === "buy" ? (
                          <ArrowDownLeft className="h-4 w-4 text-green-400" />
                        ) : tx.type === "sell" ? (
                          <ArrowUpRight className="h-4 w-4 text-red-400" />
                        ) : (
                          <Wallet className="h-4 w-4 text-blue-400" />
                        )}
                      </div>
                      <div>
                        <div className="text-white font-semibold capitalize">
                          {tx.type} {tx.token}
                        </div>
                        <div className="text-gray-400 text-sm">{tx.date}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-semibold">
                        {tx.type === "deposit" ? "+" : ""}
                        {tx.amount} {tx.token}
                      </div>
                      <div className="text-gray-400 text-sm">
                        ${tx.total.toFixed(2)}
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-green-900 text-green-400 text-xs"
                      >
                        {tx.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center mt-6">
                <Button
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  View All Transactions
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
